import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.User import User
from app.schemas.user import CreateUser, UserOut
from app.database import get_db

router = APIRouter()

@router.get("/")
def health_check():
    return {"status": "ok"}


@router.post("/registerUser", status_code=201, response_model=UserOut)
async def register_user(user: CreateUser, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this username or email already exists."
        )
    
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = User(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password,  # Use the correct field name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return the new_user object, but only the fields in UserOut will be included in the response
    return new_user