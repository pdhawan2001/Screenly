from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    role = Column(String, default="Candidate")
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    email_verified = Column(Boolean, default=False)

    # HR Specific Field
    company_name = Column(String, nullable=True)
    position = Column(String, nullable=True)
    street_number = Column(String, nullable=True)
    street_name = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"

    jobs = relationship("Job", back_populates="hr")