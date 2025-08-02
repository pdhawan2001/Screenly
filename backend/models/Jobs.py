from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    street_number = Column(String)
    street_name = Column(String)
    city = Column(String)
    country = Column(String)
    zip_code = Column(String)
    skills_required = Column(String)  # You can use a comma-separated string or a separate table for skills
    is_active = Column(Boolean, default=True)
    posted_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))  # HR user ID
    company_name = Column(String)
    
    # Proper relationship to JobProfile for evaluation criteria
    job_profile_id = Column(Integer, ForeignKey('job_profiles.id'), nullable=True)  # Link to evaluation criteria

    hr = relationship("User", back_populates="jobs")
    applications = relationship("CandidateApplication", back_populates="job")
    job_profile = relationship("JobProfile", back_populates="jobs")