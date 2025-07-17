import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.User import User
from app.schemas.user import CreateCandidate, CreateHR, UserOut, LoginRequest
from app.core.auth import create_access_token
from app.database import get_db
from datetime import datetime, timezone


router = APIRouter()


@router.get("/")
def health_check():
    return {"status": "ok"}


@router.post("/register/Candidate", status_code=201, response_model=UserOut)
async def register_user(user: CreateCandidate, db: Session = Depends(get_db)):
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
async def register_hr(user: CreateHR, db: Session = Depends(get_db)):
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
