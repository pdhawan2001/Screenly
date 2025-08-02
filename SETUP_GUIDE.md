# Screenly - HR Screening System Setup Guide

This guide will help you set up your HR screening system.

## System Overview

Your system now includes:

1. **Candidate Application Processing** - Similar to the n8n form submission trigger
2. **AI-Powered CV Analysis** - Text extraction and candidate evaluation 
3. **Google Sheets Integration** - Job profile import and results export
4. **HR Dashboard** - For reviewing and managing applications
5. **Automated Scoring** - AI-based candidate evaluation (1-10 scale)

## Setup Steps

### 1. Environment Configuration

Create a `.env` file in your backend directory with these variables:

```bash
# Database Configuration
DB_URI=postgresql://username:password@localhost:5432/screenly_db

# JWT Configuration
JWT_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
TOKEN_EXPIRE_MINUTES=30

# AI Services - Google Gemini (REQUIRED)
GEMINI_API_KEY=your-gemini-api-key-here

# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
JOB_PROFILES_SHEET_URL=https://docs.google.com/spreadsheets/d/your-profiles-sheet-id
RESULTS_SHEET_URL=https://docs.google.com/spreadsheets/d/your-results-sheet-id
```

### 2. Google Sheets Setup

#### Create Service Account:
1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable Google Sheets API and Google Drive API
4. Create a Service Account
5. Download the JSON key file
6. Share your Google Sheets with the service account email

#### Job Profiles Sheet Structure:
```
| Role       | Profile Wanted                           | Required Skills | Experience Level |
|------------|------------------------------------------|-----------------|------------------|
| Sales      | Experienced sales professional with...   | CRM, Sales      | Mid-Senior       |
| Security   | Security expert with background in...    | Security, Risk  | Senior           |
| Operations | Operations manager with process...       | Operations, PM  | Mid              |
| Reception  | Professional receptionist with...        | Communication   | Entry            |
```

#### Results Sheet:
The system will automatically create headers:
```
DATA | NAME | PHONE | CITY | EMAIL | Birthdate | EDUCATIONAL | JOB HISTORY | SKILLS | SUMMARIZE | VOTE | CONSIDERATION
```

### 3. AI Service Setup

**Important:** This system uses **Google Gemini only**. Make sure you have:
- A Google AI Studio account at https://aistudio.google.com/
- Generated API key with appropriate quotas
- Added the API key to your `.env` file

The system will automatically use Gemini 1.5 Flash for:
- CV text extraction and analysis
- Personal data extraction
- Qualifications analysis  
- Candidate evaluation and scoring

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Database Setup

```bash
# Create PostgreSQL database
createdb screenly_db

# The models will auto-create tables when you start the server
```

### 6. Start the Server

```bash
cd backend
uvicorn main:app --reload
```

**Note:** The server will fail to start if `GEMINI_API_KEY` is not set in your environment variables.

## API Endpoints

### Public Endpoints
- `POST /api/v1/candidates/apply` - Submit candidate application with CV

### HR Endpoints  
- `GET /api/v1/hr/dashboard` - HR dashboard with statistics
- `GET /api/v1/candidates/applications` - View all applications
- `GET /api/v1/hr/evaluations` - View candidate evaluations
- `POST /api/v1/hr/import-job-profiles` - Import job profiles from Google Sheets
- `POST /api/v1/candidates/applications/{id}/review` - Submit HR review

### Authentication
- `POST /api/v1/register/HR` - Register HR user
- `POST /api/v1/register/Candidate` - Register candidate
- `POST /api/v1/login` - Login

## Workflow Process

1. **Candidate Submits Application**
   - Fills form with name, email, phone, job role
   - Uploads PDF CV
   - System saves application

2. **Automated Processing** (like your n8n workflow)
   - Extract text from PDF
   - AI extracts personal data (city, birthdate, phone)
   - AI extracts qualifications (education, job history, skills)
   - Generate candidate summary

3. **Job Profile Matching**
   - Lookup job profile from database or Google Sheets
   - Compare candidate against requirements

4. **AI Evaluation**
   - Generate 1-10 score based on alignment
   - Provide detailed consideration/reasoning

5. **Results Storage**
   - Save evaluation to database
   - Export to Google Sheets (if configured)

6. **HR Review**
   - HR can view applications and evaluations
   - Override AI scores with manual review
   - Make final hiring decisions

## Key Features Implemented

✅ **Form Submission** - Like n8n form trigger
✅ **CV Upload & Processing** - PDF text extraction  
✅ **AI Information Extraction** - Personal data & qualifications
✅ **Candidate Summarization** - Concise profile generation
✅ **Job Profile Matching** - Google Sheets integration
✅ **AI Evaluation** - 1-10 scoring with reasoning
✅ **Results Export** - Google Sheets output
✅ **HR Dashboard** - Application management
✅ **Job Import** - Import roles from Google Sheets

## Next Steps

1. **Frontend Development** - Create React/Vue.js frontend
2. **Email Notifications** - Notify candidates and HR
3. **Interview Scheduling** - Integration with calendar systems
4. **Advanced AI Features** - Multi-language support, bias detection
5. **Reporting** - Advanced analytics and reporting features

## Testing the System

1. Register an HR user: `POST /api/v1/register/HR`
2. Login to get access token
3. Import job profiles: `POST /api/v1/hr/import-job-profiles`
4. Submit test application: `POST /api/v1/candidates/apply`
5. Check results: `GET /api/v1/hr/dashboard`

Your system now mirrors the n8n workflow functionality with additional database persistence and HR management features!