import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import logging

logger = logging.getLogger(__name__)

# Try to load environment variables from multiple possible locations
env_loaded = False
env_paths = ["config/.env", ".env", "../config/.env"]

for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path)
        logger.info(f"Loaded environment variables from {env_path}")
        env_loaded = True
        break

if not env_loaded:
    logger.info("No .env file found, using environment variables from system")

DATABASE_URL = os.getenv("DB_URI")

if not DATABASE_URL:
    logger.error("DB_URI environment variable is not set")
    raise ValueError("Database URL is required. Please set the DB_URI environment variable.")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()