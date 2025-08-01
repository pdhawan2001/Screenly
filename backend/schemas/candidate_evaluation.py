from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CandidateEvaluationCreate(BaseModel):
    application_id: int
    candidate_summary: Optional[str] = None
    ai_score: Optional[float] = None
    ai_considerations: Optional[str] = None
    job_profile_requirements: Optional[str] = None
    alignment_analysis: Optional[str] = None

class CandidateEvaluationUpdate(BaseModel):
    hr_score: Optional[float] = None
    hr_notes: Optional[str] = None
    hr_decision: Optional[str] = None  # accept, reject, interview, pending
    evaluation_status: Optional[str] = None

class CandidateEvaluationOut(BaseModel):
    id: int
    application_id: int
    candidate_summary: Optional[str]
    ai_score: Optional[float]
    ai_considerations: Optional[str]
    job_profile_requirements: Optional[str]
    alignment_analysis: Optional[str]
    hr_reviewed: bool
    hr_score: Optional[float]
    hr_notes: Optional[str]
    hr_decision: Optional[str]
    evaluation_status: str
    evaluated_at: Optional[datetime]
    exported_to_sheets: bool
    
    class Config:
        orm_mode = True

class HRReviewRequest(BaseModel):
    hr_score: float
    hr_notes: Optional[str] = None
    hr_decision: str  # accept, reject, interview, pending