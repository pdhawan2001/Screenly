from pydantic import BaseModel, EmailStr, field_validator
from app.models.User import RoleEnum

class CreateUser(BaseModel):
    username: str
    first_name: str 
    last_name: str | None = None
    email: EmailStr
    password: str
    role: RoleEnum

    @field_validator('username')
    def validate_user(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        return v
    
    @field_validator('password')
    def validate_password(cls, v): 
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserOut(BaseModel):
    username: str
    first_name: str
    last_name: str | None = None
    email: EmailStr
    role: RoleEnum
