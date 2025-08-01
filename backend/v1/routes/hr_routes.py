from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.User import User
from app.models.JobProfile import JobProfile
from app.models.CandidateApplication import CandidateApplication
from app.models.CandidateEvaluation import CandidateEvaluation
from app.schemas.job_profile import (
    JobProfileCreate, JobProfileOut, JobProfileUpdate, GoogleSheetsImportRequest
)
from app.schemas.job import JobCreate, JobOut
from app.models.Jobs import Job
from app.schemas.candidate_evaluation import CandidateEvaluationOut
from app.core.auth import get_current_user
from app.database import get_db
from app.services.google_sheets_service import google_sheets_service
from datetime import datetime

router = APIRouter(prefix="/hr", tags=["hr"])

@router.post("/job-profiles", response_model=JobProfileOut)
async def create_job_profile(
    profile: JobProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job profile (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can create job profiles")
    
    # Check if profile for this role already exists
    existing_profile = db.query(JobProfile).filter(JobProfile.role == profile.role).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail=f"Job profile for {profile.role} already exists")
    
    job_profile = JobProfile(
        role=profile.role,
        profile_wanted=profile.profile_wanted,
        required_skills=profile.required_skills,
        experience_level=profile.experience_level,
        education_requirements=profile.education_requirements,
        sheets_source_url=profile.sheets_source_url,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(job_profile)
    db.commit()
    db.refresh(job_profile)
    
    return job_profile

@router.get("/job-profiles", response_model=List[JobProfileOut])
async def get_job_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all job profiles (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view job profiles")
    
    profiles = db.query(JobProfile).all()
    return profiles

@router.get("/job-profiles/{role}", response_model=JobProfileOut)
async def get_job_profile_by_role(
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job profile by role (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view job profiles")
    
    profile = db.query(JobProfile).filter(JobProfile.role == role).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Job profile not found")
    
    return profile

@router.put("/job-profiles/{profile_id}", response_model=JobProfileOut)
async def update_job_profile(
    profile_id: int,
    profile_update: JobProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job profile (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can update job profiles")
    
    profile = db.query(JobProfile).filter(JobProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Job profile not found")
    
    # Update fields that were provided
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    
    return profile

@router.delete("/job-profiles/{profile_id}")
async def delete_job_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete job profile (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can delete job profiles")
    
    profile = db.query(JobProfile).filter(JobProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Job profile not found")
    
    db.delete(profile)
    db.commit()
    
    return {"message": "Job profile deleted successfully"}

@router.post("/import-job-profiles")
async def import_job_profiles_from_sheets(
    import_request: GoogleSheetsImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import job profiles from Google Sheets (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can import job profiles")
    
    if not google_sheets_service.is_available():
        raise HTTPException(status_code=503, detail="Google Sheets service not available")
    
    try:
        # Validate spreadsheet access
        is_valid, message = await google_sheets_service.validate_spreadsheet_access(
            import_request.spreadsheet_url
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Import job profiles
        profiles_data = await google_sheets_service.import_job_profiles(
            import_request.spreadsheet_url,
            import_request.sheet_name,
            import_request.role_column,
            import_request.profile_column
        )
        
        imported_count = 0
        updated_count = 0
        
        for profile_data in profiles_data:
            existing_profile = db.query(JobProfile).filter(
                JobProfile.role == profile_data["role"]
            ).first()
            
            if existing_profile:
                # Update existing profile
                existing_profile.profile_wanted = profile_data["profile_wanted"]
                existing_profile.required_skills = profile_data.get("required_skills", "")
                existing_profile.experience_level = profile_data.get("experience_level", "")
                existing_profile.education_requirements = profile_data.get("education_requirements", "")
                existing_profile.sheets_source_url = profile_data["sheets_source_url"]
                existing_profile.last_sync_at = profile_data["last_sync_at"]
                existing_profile.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                # Create new profile
                new_profile = JobProfile(
                    role=profile_data["role"],
                    profile_wanted=profile_data["profile_wanted"],
                    required_skills=profile_data.get("required_skills", ""),
                    experience_level=profile_data.get("experience_level", ""),
                    education_requirements=profile_data.get("education_requirements", ""),
                    sheets_source_url=profile_data["sheets_source_url"],
                    last_sync_at=profile_data["last_sync_at"],
                    sync_enabled=profile_data["sync_enabled"],
                    created_by=current_user.id
                )
                db.add(new_profile)
                imported_count += 1
        
        db.commit()
        
        return {
            "message": "Job profiles imported successfully",
            "imported": imported_count,
            "updated": updated_count,
            "total": len(profiles_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import job profiles: {str(e)}")

@router.post("/create-results-spreadsheet")
async def create_results_spreadsheet(
    spreadsheet_name: Optional[str] = "HR Screening Results",
    current_user: User = Depends(get_current_user)
):
    """Create a new Google Sheets spreadsheet for storing results (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can create spreadsheets")
    
    if not google_sheets_service.is_available():
        raise HTTPException(status_code=503, detail="Google Sheets service not available")
    
    try:
        spreadsheet_url = await google_sheets_service.create_results_spreadsheet(spreadsheet_name)
        return {
            "message": "Results spreadsheet created successfully",
            "url": spreadsheet_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create spreadsheet: {str(e)}")

@router.get("/evaluations", response_model=List[CandidateEvaluationOut])
async def get_all_evaluations(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all candidate evaluations (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view evaluations")
    
    query = db.query(CandidateEvaluation)
    
    if status:
        query = query.filter(CandidateEvaluation.evaluation_status == status)
    
    evaluations = query.offset((page - 1) * per_page).limit(per_page).all()
    return evaluations

@router.get("/dashboard")
async def get_hr_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get HR dashboard statistics (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view dashboard")
    
    # Get application statistics
    total_applications = db.query(CandidateApplication).count()
    pending_applications = db.query(CandidateApplication).filter(
        CandidateApplication.application_status == "submitted"
    ).count()
    evaluated_applications = db.query(CandidateApplication).filter(
        CandidateApplication.application_status == "evaluated"
    ).count()
    
    # Get evaluation statistics
    total_evaluations = db.query(CandidateEvaluation).count()
    high_score_evaluations = db.query(CandidateEvaluation).filter(
        CandidateEvaluation.ai_score >= 7.0
    ).count()
    
    # Get applications by role
    applications_by_role = db.query(
        CandidateApplication.job_role,
        db.func.count(CandidateApplication.id).label('count')
    ).group_by(CandidateApplication.job_role).all()
    
    role_stats = {role: count for role, count in applications_by_role}
    
    return {
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "evaluated_applications": evaluated_applications,
        "total_evaluations": total_evaluations,
        "high_score_evaluations": high_score_evaluations,
        "applications_by_role": role_stats,
        "google_sheets_available": google_sheets_service.is_available()
    }

# Job Management Endpoints (actual job postings)
@router.post("/jobs", response_model=JobOut)
async def create_job(
    job: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job posting (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can create jobs")
    
    # Convert skills_required list to comma-separated string for storage
    skills_str = ",".join(job.skills_required) if job.skills_required else ""
    
    new_job = Job(
        title=job.title,
        description=job.description,
        street_number=job.street_number,
        street_name=job.street_name,
        city=job.city,
        country=job.country,
        zip_code=job.zip_code,
        skills_required=skills_str,
        is_active=job.is_active,
        created_by=current_user.id,
        company_name=current_user.company_name or "Company",
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Convert skills back to list for output
    new_job.skills_required = new_job.skills_required.split(",") if new_job.skills_required else []
    return new_job

@router.get("/jobs", response_model=List[JobOut])
async def get_jobs(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all job postings (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view jobs")
    
    query = db.query(Job)
    if active_only:
        query = query.filter(Job.is_active == True)
    
    jobs = query.all()
    
    # Convert skills to list format for output
    for job in jobs:
        job.skills_required = job.skills_required.split(",") if job.skills_required else []
    
    return jobs

@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific job posting (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can view jobs")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Convert skills to list format for output
    job.skills_required = job.skills_required.split(",") if job.skills_required else []
    return job

@router.put("/jobs/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    job_update: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job posting (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can update jobs")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Update job fields
    job.title = job_update.title
    job.description = job_update.description
    job.street_number = job_update.street_number
    job.street_name = job_update.street_name
    job.city = job_update.city
    job.country = job_update.country
    job.zip_code = job_update.zip_code
    job.skills_required = ",".join(job_update.skills_required) if job_update.skills_required else ""
    job.is_active = job_update.is_active
    
    db.commit()
    db.refresh(job)
    
    # Convert skills back to list for output
    job.skills_required = job.skills_required.split(",") if job.skills_required else []
    return job

@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete job posting (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can delete jobs")
    
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if there are applications for this job
    applications_count = db.query(CandidateApplication).filter(
        CandidateApplication.job_id == job_id
    ).count()
    
    if applications_count > 0:
        # Don't delete, just deactivate
        job.is_active = False
        db.commit()
        return {"message": f"Job deactivated (has {applications_count} applications)"}
    else:
        db.delete(job)
        db.commit()
        return {"message": "Job deleted successfully"}

@router.post("/jobs/import-from-sheets")
async def import_jobs_from_sheets(
    import_request: GoogleSheetsImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import job postings from Google Sheets (HR only)"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HR users can import jobs")
    
    if not google_sheets_service.is_available():
        raise HTTPException(status_code=503, detail="Google Sheets service not available")
    
    try:
        # This would need to be implemented in google_sheets_service
        # For now, return instructions
        return {
            "message": "Job import from Google Sheets not yet implemented",
            "instructions": "Use the job profile import for evaluation criteria, or create jobs manually using POST /hr/jobs"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import jobs: {str(e)}")