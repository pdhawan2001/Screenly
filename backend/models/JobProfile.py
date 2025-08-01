from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

class JobProfile(Base):
    __tablename__ = 'job_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Job role matching the form dropdown (Sales, Security, Operations, Reception)
    role = Column(String, nullable=False, unique=True, index=True)
    
    # Profile requirements from Google Sheets
    profile_wanted = Column(Text, nullable=False)  # Detailed requirements and description
    
    # Additional profile details
    required_skills = Column(Text, nullable=True)  # Skills required for this role
    experience_level = Column(String, nullable=True)  # Entry, Mid, Senior
    education_requirements = Column(Text, nullable=True)  # Education requirements
    
    # Google Sheets integration
    sheets_source_url = Column(String, nullable=True)  # Source Google Sheets URL
    last_sync_at = Column(DateTime, nullable=True)  # Last time synced from Sheets
    sync_enabled = Column(Boolean, default=True)  # Whether to auto-sync this profile
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)  # HR user who created/updated
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<JobProfile(id={self.id}, role={self.role})>"