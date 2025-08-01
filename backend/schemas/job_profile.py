from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobProfileCreate(BaseModel):
    role: str
    profile_wanted: str
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None
    education_requirements: Optional[str] = None
    sheets_source_url: Optional[str] = None

class JobProfileUpdate(BaseModel):
    profile_wanted: Optional[str] = None
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None
    education_requirements: Optional[str] = None
    sheets_source_url: Optional[str] = None
    sync_enabled: Optional[bool] = None

class JobProfileOut(BaseModel):
    id: int
    role: str
    profile_wanted: str
    required_skills: Optional[str]
    experience_level: Optional[str]
    education_requirements: Optional[str]
    sheets_source_url: Optional[str]
    last_sync_at: Optional[datetime]
    sync_enabled: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class GoogleSheetsImportRequest(BaseModel):
    spreadsheet_url: str
    sheet_name: Optional[str] = "Sheet1"
    role_column: str = "Role"
    profile_column: str = "Profile Wanted"