from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class CandidateEvaluation(Base):
    __tablename__ = 'candidate_evaluations'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to the application
    application_id = Column(Integer, ForeignKey('candidate_applications.id'), nullable=False)
    
    # AI-generated summary and evaluation
    candidate_summary = Column(Text, nullable=True)  # Concise summary from AI
    
    # HR Expert AI scoring (1-10 scale like in n8n workflow)
    ai_score = Column(Float, nullable=True)  # Score from 1-10
    ai_considerations = Column(Text, nullable=True)  # AI explanation for the score
    
    # Job profile matching
    job_profile_requirements = Column(Text, nullable=True)  # Requirements from Google Sheets
    alignment_analysis = Column(Text, nullable=True)  # How well candidate aligns with requirements
    
    # HR review (optional manual override)
    hr_reviewed = Column(Boolean, default=False)
    hr_score = Column(Float, nullable=True)  # Manual HR score (optional override)
    hr_notes = Column(Text, nullable=True)  # HR manual notes
    hr_decision = Column(String, nullable=True)  # "accept", "reject", "interview", "pending"
    
    # Processing metadata
    evaluation_status = Column(String, default="pending")  # pending, processing, completed, failed
    evaluated_at = Column(DateTime, nullable=True)
    evaluated_by = Column(Integer, ForeignKey('users.id'), nullable=True)  # HR user who reviewed
    
    # Google Sheets integration tracking
    exported_to_sheets = Column(Boolean, default=False)
    sheets_row_id = Column(String, nullable=True)  # Reference to Google Sheets row
    
    # Relationships
    application = relationship("CandidateApplication", back_populates="evaluations")
    reviewer = relationship("User", foreign_keys=[evaluated_by])
    
    def __repr__(self):
        return f"<CandidateEvaluation(id={self.id}, application_id={self.application_id}, ai_score={self.ai_score})>"