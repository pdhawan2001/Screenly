# Screenly - AI-Powered HR Screening System

A modern, full-stack web application that automates the HR screening process using AI technology. Built with FastAPI (Python) backend and React (TypeScript) frontend.

## 🚀 Features

### For Candidates
- **User Registration & Authentication** - Secure login system with JWT tokens
- **Job Application Portal** - Upload CVs and apply for positions
- **Application Tracking** - Monitor application status in real-time
- **AI-Powered Screening** - Automatic CV parsing and qualification extraction

### For HR Professionals
- **Comprehensive Dashboard** - View application statistics and analytics
- **Application Management** - Review and evaluate candidate submissions
- **Job Posting Management** - Create and manage job listings
- **AI Evaluation System** - Get AI-generated candidate scores and analysis
- **Google Sheets Integration** - Import job profiles and export results

### AI Capabilities
- **CV Text Extraction** - Automatic PDF parsing
- **Personal Data Extraction** - Extract phone, city, birthdate
- **Qualification Analysis** - Education, work history, and skills extraction
- **Candidate Summarization** - AI-generated candidate summaries
- **Job Matching** - Score candidates against job requirements (1-10 scale)
- **Detailed Feedback** - AI considerations and recommendations

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Authentication System
├── Candidate Portal
├── HR Dashboard
├── Job Management
└── Application Review

Backend (FastAPI + Python)
├── REST API Endpoints
├── JWT Authentication
├── AI Service Integration (Google Gemini)
├── Database Models (PostgreSQL)
├── Google Sheets Integration
└── Asynchronous Processing
```

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL** (or SQLite for development)
- **Google Gemini API Key**
- **Google Sheets API** (optional)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Screenly
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create environment variables file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DB_URI=postgresql://user:password@localhost/screenly
# - JWT_KEY=your-secret-key
# - GEMINI_API_KEY=your-gemini-api-key
# - GOOGLE_SERVICE_ACCOUNT_JSON=path/to/service-account.json (optional)

# Run database migrations
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start the backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env.local

# Start the development server
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔑 Environment Variables

### Backend (.env)
```bash
# Database
DB_URI=postgresql://user:password@localhost:5432/screenly

# JWT Configuration
JWT_KEY=your-super-secret-jwt-key
ALGORITHM=HS256
TOKEN_EXPIRE_MINUTES=30

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# Google Sheets (Optional)
GOOGLE_SERVICE_ACCOUNT_JSON=path/to/service-account.json
JOB_PROFILES_SHEET_URL=https://docs.google.com/spreadsheets/d/your-sheet-id
RESULTS_SHEET_URL=https://docs.google.com/spreadsheets/d/your-results-sheet-id
```

### Frontend (.env.local)
```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/login` - User login
- `POST /api/v1/register/Candidate` - Candidate registration
- `POST /api/v1/register/HR` - HR registration

### Candidates
- `GET /api/v1/candidates/jobs` - Get available jobs
- `POST /api/v1/candidates/apply` - Submit application
- `GET /api/v1/candidates/applications` - Get candidate's applications
- `GET /api/v1/candidates/applications/{id}` - Get specific application
- `GET /api/v1/candidates/applications/{id}/evaluation` - Get evaluation

### HR Management
- `GET /api/v1/hr/dashboard` - Dashboard statistics
- `GET /api/v1/hr/jobs` - Get all jobs
- `POST /api/v1/hr/jobs` - Create new job
- `GET /api/v1/hr/job-profiles` - Get job profiles
- `POST /api/v1/hr/job-profiles` - Create job profile
- `POST /api/v1/candidates/applications/{id}/review` - Submit HR review

## 🔄 Application Flow

1. **Candidate Registration** - Users register as candidates or HR professionals
2. **Job Creation** - HR creates job postings with requirements
3. **Application Submission** - Candidates upload CVs and apply for positions
4. **AI Processing** - System automatically:
   - Extracts text from PDF CVs
   - Identifies personal information
   - Analyzes qualifications and skills
   - Generates candidate summary
   - Scores against job requirements
5. **HR Review** - HR professionals review AI evaluations and make decisions
6. **Results Export** - Data exported to Google Sheets for further analysis

## 🧪 Testing the Application

### Sample User Flow

1. **Register as HR** - Create an HR account
2. **Create Job Profile** - Define evaluation criteria
3. **Post Job** - Create a job posting linked to the profile
4. **Register as Candidate** - Create a candidate account
5. **Apply for Job** - Upload CV and submit application
6. **Monitor Processing** - Watch AI analyze the application
7. **HR Review** - Login as HR and evaluate the candidate

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DB_URI in .env file

2. **AI Processing Fails**
   - Verify GEMINI_API_KEY is correct
   - Check API quota and billing

3. **Frontend Not Loading**
   - Ensure backend is running on port 8000
   - Check CORS configuration in main.py

4. **File Upload Issues**
   - Verify file is PDF format
   - Check file size limits (10MB max)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)

## 👥 Team

Built with ❤️ by Parth.

---

**Note**: This application uses AI for candidate evaluation. The AI scores and recommendations should be used as guidance alongside human judgment in hiring decisions.