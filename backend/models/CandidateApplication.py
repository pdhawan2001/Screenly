from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class CandidateApplication(Base):
    __tablename__ = 'candidate_applications'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic candidate info from form
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    birthdate = Column(String, nullable=True)
    
    # CV file information
    cv_filename = Column(String, nullable=False)
    cv_file_path = Column(String, nullable=False)  # Local file path or cloud storage URL
    cv_text_content = Column(Text, nullable=True)  # Extracted text from CV
    
    # Job application details
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False)
    job_role = Column(String, nullable=False)  # Sales, Security, Operations, Reception
    
    # AI-extracted information
    educational_qualification = Column(Text, nullable=True)
    job_history = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)  # JSON string or comma-separated
    
    # Application status and timestamps
    application_status = Column(String, default="submitted")  # submitted, processing, evaluated, rejected, accepted
    submitted_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    evaluations = relationship("CandidateEvaluation", back_populates="application")
    
    def __repr__(self):
        return f"<CandidateApplication(id={self.id}, name={self.name}, job_role={self.job_role})>"