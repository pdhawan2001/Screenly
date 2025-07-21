import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.User import User
from app.models.Jobs import Job
from app.schemas.user import CreateCandidate, CreateHR, UserOut, LoginRequest
from app.schemas.job import JobCreate, JobOut
from app.core.auth import create_access_token
from app.database import get_db
from datetime import datetime, timezone


router = APIRouter()


@router.get("/")
def health_check():
    return {"status": "ok"}


@router.post("/register/Candidate", status_code=201, response_model=UserOut)
def register_user(user: CreateCandidate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter((User.username == user.username) | (User.email == user.email))
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400, detail="User with this username or email already exists."
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password,
        role="Candidate",
        created_at=datetime.now(timezone.utc),
        email_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return the new_user object, but only the fields in UserOut will be included in the response
    return new_user


@router.post("/register/HR", status_code=201, response_model=UserOut)
def register_hr(user: CreateHR, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter((User.username == user.username) | (User.email == user.email))
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400, detail="User with this username or email already exists."
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password,
        role="HR",
        created_at=user.created_at,
        email_verified=user.email_verified,
        company_name=user.company_name,
        position=user.position,
        street_number=user.street_number,
        street_name=user.street_name,
        postal_code=user.postal_code,
        city=user.city,
        country=user.country,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", status_code=201)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    is_email = "@" in request.username_or_email
    if is_email:
        user = db.query(User).filter(User.email == request.username_or_email).first()
    else:
        user = db.query(User).filter(User.username == request.username_or_email).first()
    if not user or not bcrypt.checkpw(
        request.password.encode("utf-8"), user.hashed_password.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # You can include more user info in the token if needed
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/jobs/create", response_model=JobOut)
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only HRs can create jobs
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Only HRs can create jobs.")

    # Convert skills_required list to comma-separated string for storage
    skills_str = ",".join(job.skills_required)

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
        company_name=current_user.company_name,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    # Convert skills back to list for output
    new_job.skills_required = new_job.skills_required.split(",")
    return new_job