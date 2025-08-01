from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class CandidateApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    job_role: str  # Sales, Security, Operations, Reception
    # CV file will be handled separately via file upload

class CandidateApplicationUpdate(BaseModel):
    city: Optional[str] = None
    birthdate: Optional[str] = None
    educational_qualification: Optional[str] = None
    job_history: Optional[str] = None
    skills: Optional[str] = None
    application_status: Optional[str] = None
    processed_at: Optional[datetime] = None

class CandidateApplicationOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    city: Optional[str]
    birthdate: Optional[str]
    cv_filename: str
    job_role: str
    educational_qualification: Optional[str]
    job_history: Optional[str]
    skills: Optional[str]
    application_status: str
    submitted_at: datetime
    processed_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class CandidateApplicationList(BaseModel):
    applications: List[CandidateApplicationOut]
    total: int
    page: int
    per_page: int