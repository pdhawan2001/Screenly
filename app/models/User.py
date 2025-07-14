import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.database import Base

class RoleEnum(enum.Enum):
    HR = "HR"
    Candidate = "Candidate"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"