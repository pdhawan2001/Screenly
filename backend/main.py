from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from v1.routes.router import router
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all models to ensure they're registered with SQLAlchemy
from models.User import User
from models.Jobs import Job
from models.CandidateApplication import CandidateApplication
from models.CandidateEvaluation import CandidateEvaluation
from models.JobProfile import JobProfile

# Initialize database tables with error handling
try:
    from database import Base, engine
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")
    # Don't fail the startup - let the app start and handle DB errors per request

app = FastAPI(
    title="Screenly - HR Screening System",
    description="AI-powered HR screening system with candidate application processing and evaluation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now - configure properly for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

# Health check endpoint for Cloud Run
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Service is running"}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Screenly HR Screening System API", "version": "1.0.0"}