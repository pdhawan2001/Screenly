import os
import gspread
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from googleapiclient.discovery import build
from typing import List, Dict, Optional, Tuple
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/config/.env")

class GoogleSheetsService:
    def __init__(self):
        self.gc = None
        self.service = None
        self.setup_google_sheets_client()
    
    def setup_google_sheets_client(self):
        """Initialize Google Sheets client using service account or OAuth"""
        try:
            # Try service account first (recommended for server applications)
            service_account_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
            if service_account_path and os.path.exists(service_account_path):
                scope = [
                    'https://spreadsheets.google.com/feeds',
                    'https://www.googleapis.com/auth/drive'
                ]
                creds = ServiceAccountCredentials.from_service_account_file(
                    service_account_path, scopes=scope
                )
                self.gc = gspread.authorize(creds)
                self.service = build('sheets', 'v4', credentials=creds)
                print("Google Sheets initialized with service account")
                return
            
            # Fallback to OAuth (requires user interaction)
            # This would need proper OAuth flow implementation
            print("Google Sheets service account not configured")
            
        except Exception as e:
            print(f"Failed to initialize Google Sheets: {e}")
    
    def is_available(self) -> bool:
        """Check if Google Sheets service is available"""
        return self.gc is not None and self.service is not None
    
    async def import_job_profiles(self, spreadsheet_url: str, sheet_name: str = "Sheet1", 
                                 role_column: str = "Role", profile_column: str = "Profile Wanted") -> List[Dict]:
        """Import job profiles from Google Sheets, similar to n8n job roles lookup"""
        if not self.is_available():
            raise Exception("Google Sheets service not available")
        
        try:
            # Extract spreadsheet ID from URL
            spreadsheet_id = self._extract_spreadsheet_id(spreadsheet_url)
            
            # Open the spreadsheet
            spreadsheet = self.gc.open_by_key(spreadsheet_id)
            worksheet = spreadsheet.worksheet(sheet_name)
            
            # Get all records
            records = worksheet.get_all_records()
            
            job_profiles = []
            for record in records:
                if role_column in record and profile_column in record:
                    job_profile = {
                        "role": record[role_column],
                        "profile_wanted": record[profile_column],
                        "required_skills": record.get("Required Skills", ""),
                        "experience_level": record.get("Experience Level", ""),
                        "education_requirements": record.get("Education Requirements", ""),
                        "sheets_source_url": spreadsheet_url,
                        "last_sync_at": datetime.utcnow(),
                        "sync_enabled": True
                    }
                    job_profiles.append(job_profile)
            
            return job_profiles
            
        except Exception as e:
            raise Exception(f"Failed to import job profiles: {str(e)}")
    
    async def export_candidate_evaluation(self, evaluation_data: Dict, spreadsheet_url: str, 
                                        sheet_name: str = "Sheet1") -> Optional[str]:
        """Export candidate evaluation to Google Sheets"""
        if not self.is_available():
            raise Exception("Google Sheets service not available")
        
        try:
            spreadsheet_id = self._extract_spreadsheet_id(spreadsheet_url)
            spreadsheet = self.gc.open_by_key(spreadsheet_id)
            worksheet = spreadsheet.worksheet(sheet_name)
            
            # Prepare row data similar to n8n workflow structure
            row_data = [
                datetime.now().strftime('%d/%m/%Y'),  # DATA
                evaluation_data.get('name', ''),  # NAME
                evaluation_data.get('phone', '').replace('+', '') if evaluation_data.get('phone') else '',  # PHONE
                evaluation_data.get('city', ''),  # CITY
                evaluation_data.get('email', ''),  # EMAIL
                evaluation_data.get('birthdate', ''),  # Birthdate
                evaluation_data.get('educational_qualification', ''),  # EDUCATIONAL
                evaluation_data.get('job_history', ''),  # JOB HISTORY
                evaluation_data.get('skills', ''),  # SKILLS
                evaluation_data.get('candidate_summary', ''),  # SUMMARIZE
                str(evaluation_data.get('ai_score', '')),  # VOTE
                evaluation_data.get('ai_considerations', ''),  # CONSIDERATION
            ]
            
            # Append the row
            worksheet.append_row(row_data)
            
            # Return the row number for tracking
            return str(len(worksheet.get_all_records()) + 1)
            
        except Exception as e:
            raise Exception(f"Failed to export to Google Sheets: {str(e)}")
    
    async def get_job_profile_by_role(self, role: str, spreadsheet_url: str, 
                                     sheet_name: str = "Sheet1") -> Optional[Dict]:
        """Get specific job profile by role from Google Sheets"""
        if not self.is_available():
            return None
        
        try:
            spreadsheet_id = self._extract_spreadsheet_id(spreadsheet_url)
            spreadsheet = self.gc.open_by_key(spreadsheet_id)
            worksheet = spreadsheet.worksheet(sheet_name)
            
            # Find the row with the matching role
            records = worksheet.get_all_records()
            for record in records:
                if record.get("Role", "").lower() == role.lower():
                    return {
                        "role": record.get("Role", ""),
                        "profile_wanted": record.get("Profile Wanted", ""),
                        "required_skills": record.get("Required Skills", ""),
                        "experience_level": record.get("Experience Level", ""),
                        "education_requirements": record.get("Education Requirements", "")
                    }
            
            return None
            
        except Exception as e:
            print(f"Failed to get job profile: {e}")
            return None
    
    def _extract_spreadsheet_id(self, url: str) -> str:
        """Extract spreadsheet ID from Google Sheets URL"""
        # Handle different URL formats
        if "/spreadsheets/d/" in url:
            start = url.find("/spreadsheets/d/") + len("/spreadsheets/d/")
            end = url.find("/", start)
            if end == -1:
                end = url.find("#", start)
            if end == -1:
                end = len(url)
            return url[start:end]
        else:
            # Assume the URL is already just the ID
            return url
    
    async def create_results_spreadsheet(self, spreadsheet_name: str = "HR Screening Results") -> str:
        """Create a new spreadsheet for storing results"""
        if not self.is_available():
            raise Exception("Google Sheets service not available")
        
        try:
            # Create new spreadsheet
            spreadsheet = self.gc.create(spreadsheet_name)
            
            # Set up headers similar to n8n workflow
            headers = [
                "DATA", "NAME", "PHONE", "CITY", "EMAIL", "Birthdate",
                "EDUCATIONAL", "JOB HISTORY", "SKILLS", "SUMMARIZE", 
                "VOTE", "CONSIDERATION"
            ]
            
            worksheet = spreadsheet.sheet1
            worksheet.update('A1:L1', [headers])
            
            # Format headers
            worksheet.format('A1:L1', {
                "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 0.9},
                "textFormat": {"bold": True}
            })
            
            return spreadsheet.url
            
        except Exception as e:
            raise Exception(f"Failed to create spreadsheet: {str(e)}")
    
    async def validate_spreadsheet_access(self, spreadsheet_url: str) -> Tuple[bool, str]:
        """Validate that we can access the spreadsheet"""
        if not self.is_available():
            return False, "Google Sheets service not configured"
        
        try:
            spreadsheet_id = self._extract_spreadsheet_id(spreadsheet_url)
            spreadsheet = self.gc.open_by_key(spreadsheet_id)
            _ = spreadsheet.sheet1.get_all_records()
            return True, "Access validated successfully"
        except Exception as e:
            return False, f"Failed to access spreadsheet: {str(e)}"

# Create a singleton instance
google_sheets_service = GoogleSheetsService()