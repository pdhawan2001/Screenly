from pydantic import BaseModel
from typing import List
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: str
    street_number: str
    street_name: str
    city: str
    country: str
    zip_code: str
    skills_required: List[str]  # Accept as a list in the API
    is_active: bool = True

class JobOut(BaseModel):
    id: int
    title: str
    description: str
    street_number: str
    street_name: str
    city: str
    country: str
    zip_code: str
    skills_required: List[str]
    is_active: bool
    posted_at: datetime
    created_by: int
    company_name: str

    class Config:
        orm_mode = True