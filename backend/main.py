from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.v1.routes.router import router
from backend.database import Base, engine

# Import all models to ensure they're registered with SQLAlchemy
from backend.models.User import User
from backend.models.Jobs import Job
from backend.models.CandidateApplication import CandidateApplication
from backend.models.CandidateEvaluation import CandidateEvaluation
from backend.models.JobProfile import JobProfile

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Screenly - HR Screening System",
    description="AI-powered HR screening system with candidate application processing and evaluation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")