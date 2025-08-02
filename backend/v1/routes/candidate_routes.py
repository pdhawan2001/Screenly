import os
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.models.User import User
from backend.models.Jobs import Job
from backend.models.CandidateApplication import CandidateApplication
from backend.models.CandidateEvaluation import CandidateEvaluation
from backend.models.JobProfile import JobProfile
from backend.schemas.candidate_application import (
    CandidateApplicationCreate, CandidateApplicationOut, 
    CandidateApplicationList, CandidateApplicationUpdate
)
from backend.schemas.candidate_evaluation import (
    CandidateEvaluationOut, CandidateEvaluationCreate, HRReviewRequest
)
from backend.core.auth import get_current_user
from backend.database import get_db
from backend.services.ai_service import ai_service
from backend.services.google_sheets_service import google_sheets_service

router = APIRouter(prefix="/candidates", tags=["candidates"])

UPLOAD_DIR = "uploads/cvs"
ALLOWED_EXTENSIONS = {'.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/apply", response_model=CandidateApplicationOut)
async def submit_application(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    job_role: str = Form(...),  # Sales, Security, Operations, Reception
    cv_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Submit a candidate application with CV upload, similar to n8n form submission trigger"""
    
    # Validate file
    if not cv_file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_ext = os.path.splitext(cv_file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Check file size
    contents = await cv_file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Find the job for this role (we'll create a default job if none exists)
    job = db.query(Job).filter(Job.title.ilike(f"%{job_role}%")).first()
    if not job:
        # Create a default job for this role
        job = Job(
            title=f"{job_role} Position",
            description=f"Default {job_role} position",
            city="Various",
            country="Various",
            skills_required=job_role,
            is_active=True,
            company_name="Company"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
    
    # Save the CV file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{name.replace(' ', '_')}_{cv_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        # Extract text from PDF
        cv_text = await ai_service.extract_text_from_pdf(contents, cv_file.filename)
        
        # Create the application record
        application = CandidateApplication(
            name=name,
            email=email,
            phone=phone,
            job_id=job.id,
            job_role=job_role,
            cv_filename=cv_file.filename,
            cv_file_path=file_path,
            cv_text_content=cv_text,
            application_status="submitted",
            submitted_at=datetime.utcnow()
        )
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        # Process the application asynchronously (extract data and evaluate)
        await process_application_async(application.id, db)
        
        return application
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process application: {str(e)}")

@router.get("/applications", response_model=CandidateApplicationList)
async def get_applications(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    job_role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get candidate applications (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view applications")
    
    query = db.query(CandidateApplication)
    
    if status:
        query = query.filter(CandidateApplication.application_status == status)
    if job_role:
        query = query.filter(CandidateApplication.job_role == job_role)
    
    total = query.count()
    applications = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return CandidateApplicationList(
        applications=applications,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/applications/{application_id}", response_model=CandidateApplicationOut)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific candidate application (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view applications")
    
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application

@router.get("/applications/{application_id}/evaluation", response_model=CandidateEvaluationOut)
async def get_application_evaluation(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get candidate evaluation (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view evaluations")
    
    evaluation = db.query(CandidateEvaluation).filter(
        CandidateEvaluation.application_id == application_id
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    return evaluation

@router.post("/applications/{application_id}/review")
async def submit_hr_review(
    application_id: int,
    review: HRReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit HR review for a candidate (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can submit reviews")
    
    evaluation = db.query(CandidateEvaluation).filter(
        CandidateEvaluation.application_id == application_id
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Update evaluation with HR review
    evaluation.hr_reviewed = True
    evaluation.hr_score = review.hr_score
    evaluation.hr_notes = review.hr_notes
    evaluation.hr_decision = review.hr_decision
    evaluation.evaluated_by = current_user.id
    evaluation.evaluated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Review submitted successfully"}

@router.post("/applications/{application_id}/reprocess")
async def reprocess_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reprocess application with AI (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can reprocess applications")
    
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    try:
        await process_application_async(application_id, db)
        return {"message": "Application reprocessed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reprocess application: {str(e)}")

async def process_application_async(application_id: int, db: Session):
    """Process application with AI extraction and evaluation, similar to n8n workflow"""
    application = db.query(CandidateApplication).filter(
        CandidateApplication.id == application_id
    ).first()
    
    if not application or not application.cv_text_content:
        return
    
    try:
        # Update status to processing
        application.application_status = "processing"
        db.commit()
        
        # Extract personal data and qualifications (parallel processing like n8n)
        personal_data = await ai_service.extract_personal_data(application.cv_text_content)
        qualifications = await ai_service.extract_qualifications(application.cv_text_content)
        
        # Update application with extracted data
        application.city = personal_data.get('city')
        application.birthdate = personal_data.get('birthdate')
        # Update phone if not provided in form
        if not application.phone and personal_data.get('telephone'):
            application.phone = personal_data.get('telephone')
        
        application.educational_qualification = qualifications.get('Educational qualification')
        application.job_history = qualifications.get('Job History')
        application.skills = qualifications.get('Skills')
        application.processed_at = datetime.utcnow()
        
        # Merge data for summary generation
        candidate_data = {
            'city': application.city,
            'birthdate': application.birthdate,
            'Educational qualification': application.educational_qualification,
            'Job History': application.job_history,
            'Skills': application.skills
        }
        
        # Generate candidate summary
        candidate_summary = await ai_service.generate_candidate_summary(candidate_data)
        
        # Get job profile - PROPER WAY using relationship
        job = db.query(Job).filter(Job.id == application.job_id).first()
        job_profile = None
        profile_requirements = ""
        
        # First, try to get profile through proper Job -> JobProfile relationship
        if job and job.job_profile_id:
            job_profile = db.query(JobProfile).filter(JobProfile.id == job.job_profile_id).first()
            if job_profile:
                profile_requirements = job_profile.profile_wanted
        
        # Fallback: if no direct relationship, try matching by role (backwards compatibility)
        if not job_profile:
            job_profile = db.query(JobProfile).filter(
                JobProfile.role == application.job_role
            ).first()
            if job_profile:
                profile_requirements = job_profile.profile_wanted
        
        # Final fallback: Google Sheets
        if not profile_requirements:
            sheets_url = os.getenv("JOB_PROFILES_SHEET_URL")
            if sheets_url and google_sheets_service.is_available():
                profile_data = await google_sheets_service.get_job_profile_by_role(
                    application.job_role, sheets_url
                )
                if profile_data:
                    profile_requirements = profile_data.get('profile_wanted', '')
        
        # Evaluate candidate with AI
        ai_score, ai_considerations = await ai_service.evaluate_candidate(
            candidate_summary, profile_requirements
        )
        
        # Create or update evaluation record
        evaluation = db.query(CandidateEvaluation).filter(
            CandidateEvaluation.application_id == application_id
        ).first()
        
        if not evaluation:
            evaluation = CandidateEvaluation(
                application_id=application_id,
                candidate_summary=candidate_summary,
                ai_score=ai_score,
                ai_considerations=ai_considerations,
                job_profile_requirements=profile_requirements,
                evaluation_status="completed",
                evaluated_at=datetime.utcnow()
            )
            db.add(evaluation)
        else:
            evaluation.candidate_summary = candidate_summary
            evaluation.ai_score = ai_score
            evaluation.ai_considerations = ai_considerations
            evaluation.job_profile_requirements = profile_requirements
            evaluation.evaluation_status = "completed"
            evaluation.evaluated_at = datetime.utcnow()
        
        # Update application status
        application.application_status = "evaluated"
        
        db.commit()
        
        # Export to Google Sheets if configured
        sheets_url = os.getenv("RESULTS_SHEET_URL")
        if sheets_url and google_sheets_service.is_available():
            try:
                evaluation_data = {
                    'name': application.name,
                    'email': application.email,
                    'phone': application.phone,
                    'city': application.city,
                    'birthdate': application.birthdate,
                    'educational_qualification': application.educational_qualification,
                    'job_history': application.job_history,
                    'skills': application.skills,
                    'candidate_summary': candidate_summary,
                    'ai_score': ai_score,
                    'ai_considerations': ai_considerations
                }
                
                sheets_row_id = await google_sheets_service.export_candidate_evaluation(
                    evaluation_data, sheets_url
                )
                
                if sheets_row_id:
                    evaluation.exported_to_sheets = True
                    evaluation.sheets_row_id = sheets_row_id
                    db.commit()
                    
            except Exception as e:
                print(f"Failed to export to Google Sheets: {e}")
        
    except Exception as e:
        # Update status to failed
        application.application_status = "failed"
        db.commit()
        print(f"Failed to process application {application_id}: {e}")
        raise e