import os
import asyncio
from typing import Dict, Optional, Tuple
from dotenv import load_dotenv
import google.generativeai as genai
import PyPDF2
import pdfplumber
from io import BytesIO
import json

load_dotenv()

class AIService:
    def __init__(self):
        self.gemini_model = None
        self.setup_gemini_client()
    
    def setup_gemini_client(self):
        """Initialize Gemini client"""
        gemini_key = os.getenv("GEMINI_API_KEY")
        
        if not gemini_key:
            raise Exception("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=gemini_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("Gemini client initialized successfully")
    
    async def extract_text_from_pdf(self, file_content: bytes, filename: str) -> str:
        """Extract text from PDF file content"""
        try:
            # Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(BytesIO(file_content)) as pdf:
                text_parts = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                
                if text_parts:
                    return "\n\n".join(text_parts)
        except Exception as e:
            print(f"pdfplumber failed: {e}")
        
        try:
            # Fallback to PyPDF2
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            return "\n\n".join(text_parts)
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
            raise Exception(f"Failed to extract text from PDF: {e}")
    
    async def extract_personal_data(self, cv_text: str) -> Dict[str, Optional[str]]:
        """Extract personal data from CV text"""
        prompt = """
        You are an expert extraction algorithm.
        Only extract relevant information from the text.
        If you do not know the value of an attribute asked to extract, you may omit the attribute's value.
        
        Extract the following information from this CV text:
        - telephone: Phone number
        - city: City/location
        - birthdate: Date of birth
        
        Return as JSON format.
        """
        
        try:
            if not self.gemini_model:
                raise Exception("Gemini client not initialized")
            
            response = await self._call_gemini(f"{prompt}\n\nCV Text:\n{cv_text}")
            return self._parse_personal_data_response(response)
        except Exception as e:
            print(f"Error extracting personal data: {e}")
            return {"telephone": None, "city": None, "birthdate": None}
    
    async def extract_qualifications(self, cv_text: str) -> Dict[str, Optional[str]]:
        """Extract qualifications from CV text"""
        prompt = """
        You are an expert extraction algorithm.
        Only extract relevant information from the text.
        If you do not know the value of an attribute asked to extract, you may omit the attribute's value.
        
        Extract the following information from this CV text:
        - Educational qualification: Summary of your academic career. Focus on your high school and university studies. Summarize in 100 words maximum and also include your grade if applicable.
        - Job History: Work history summary. Focus on your most recent work experiences. Summarize in 100 words maximum
        - Skills: Extract the candidate's technical skills. What software and frameworks they are proficient in. Make a bulleted list.
        
        Return as JSON format.
        """
        
        try:
            if not self.gemini_model:
                raise Exception("Gemini client not initialized")
            
            response = await self._call_gemini(f"{prompt}\n\nCV Text:\n{cv_text}")
            return self._parse_qualifications_response(response)
        except Exception as e:
            print(f"Error extracting qualifications: {e}")
            return {
                "Educational qualification": None,
                "Job History": None,
                "Skills": None
            }
    
    async def generate_candidate_summary(self, candidate_data: Dict) -> str:
        """Generate candidate summary"""
        prompt = f"""
        Write a concise summary of the following:
        
        City: {candidate_data.get('city', 'N/A')}
        Birthdate: {candidate_data.get('birthdate', 'N/A')}
        Educational qualification: {candidate_data.get('Educational qualification', 'N/A')}
        Job History: {candidate_data.get('Job History', 'N/A')}
        Skills: {candidate_data.get('Skills', 'N/A')}
        
        Use 100 words or less. Be concise and conversational.
        """
        
        try:
            if not self.gemini_model:
                raise Exception("Gemini client not initialized")
            
            return await self._call_gemini(prompt)
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Unable to generate summary"
    
    async def evaluate_candidate(self, candidate_summary: str, job_profile: str) -> Tuple[float, str]:
        """Evaluate candidate against job profile"""
        prompt = f"""
        You are an HR expert and need to assess if the candidate aligns with the profile the company is looking for. 
        You must give a score from 1 to 10, where 1 means the candidate is not at all aligned with the requirements, 
        while 10 means they are the ideal candidate because they perfectly match the desired profile. 
        
        Additionally, explain why you gave that score in the consideration field.
        
        Profile Wanted:
        {job_profile}
        
        Candidate:
        {candidate_summary}
        
        Return your response in JSON format with 'vote' (score 1-10) and 'consideration' (explanation) fields.
        """
        
        try:
            if not self.gemini_model:
                raise Exception("Gemini client not initialized")
            
            response = await self._call_gemini(prompt)
            result = self._parse_evaluation_response(response)
            return result.get('vote', 0.0), result.get('consideration', 'Unable to evaluate')
        except Exception as e:
            print(f"Error evaluating candidate: {e}")
            return 0.0, f"Evaluation failed: {str(e)}"
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API with structured output"""
        try:
            # Add system instructions to the prompt for better results
            enhanced_prompt = f"""You are a helpful AI assistant that provides accurate information extraction and analysis.

{prompt}

Please provide accurate, structured responses. When asked for JSON format, return valid JSON only."""

            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                enhanced_prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise e
    
    def _parse_personal_data_response(self, response: str) -> Dict[str, Optional[str]]:
        """Parse AI response for personal data extraction"""
        try:
            # Try to find and parse JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                data = json.loads(json_str)
                return {
                    "telephone": data.get("telephone"),
                    "city": data.get("city"), 
                    "birthdate": data.get("birthdate")
                }
        except json.JSONDecodeError as e:
            print(f"JSON parse error in personal data: {e}")
        except Exception as e:
            print(f"Error parsing personal data response: {e}")
        
        # Fallback to default values
        return {"telephone": None, "city": None, "birthdate": None}
    
    def _parse_qualifications_response(self, response: str) -> Dict[str, Optional[str]]:
        """Parse AI response for qualifications extraction"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                data = json.loads(json_str)
                return {
                    "Educational qualification": data.get("Educational qualification"),
                    "Job History": data.get("Job History"),
                    "Skills": data.get("Skills")
                }
        except json.JSONDecodeError as e:
            print(f"JSON parse error in qualifications: {e}")
        except Exception as e:
            print(f"Error parsing qualifications response: {e}")
        
        return {
            "Educational qualification": None,
            "Job History": None,
            "Skills": None
        }
    
    def _parse_evaluation_response(self, response: str) -> Dict:
        """Parse AI response for candidate evaluation"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                result = json.loads(json_str)
                # Ensure vote is a float and within valid range
                if 'vote' in result:
                    vote = float(result['vote'])
                    result['vote'] = max(1.0, min(10.0, vote))  # Clamp between 1-10
                return result
        except json.JSONDecodeError as e:
            print(f"JSON parse error in evaluation: {e}")
        except Exception as e:
            print(f"Error parsing evaluation response: {e}")
        
        return {"vote": 0.0, "consideration": "Unable to parse evaluation"}

# Create a singleton instance
ai_service = AIService()