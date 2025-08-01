import os
import asyncio
from typing import Dict, Optional, Tuple
import openai
import google.generativeai as genai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import PyPDF2
import pdfplumber
from io import BytesIO

class AIService:
    def __init__(self):
        self.openai_client = None
        self.gemini_model = None
        self.setup_ai_clients()
    
    def setup_ai_clients(self):
        """Initialize AI clients based on available API keys"""
        openai_key = os.getenv("OPENAI_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY")
        
        if openai_key:
            self.openai_client = openai.OpenAI(api_key=openai_key)
        
        if gemini_key:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    
    async def extract_text_from_pdf(self, file_content: bytes, filename: str) -> str:
        """Extract text from PDF file content, similar to n8n Extract from File node"""
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
        """Extract personal data from CV text, similar to n8n Personal Data node"""
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
            if self.gemini_model:
                response = await self._call_gemini(f"{prompt}\n\nCV Text:\n{cv_text}")
            elif self.openai_client:
                response = await self._call_openai(f"{prompt}\n\nCV Text:\n{cv_text}")
            else:
                raise Exception("No AI service available")
            
            # Parse the response to extract structured data
            # This is a simplified version - you might want to use a proper JSON parser
            return self._parse_personal_data_response(response)
        except Exception as e:
            print(f"Error extracting personal data: {e}")
            return {"telephone": None, "city": None, "birthdate": None}
    
    async def extract_qualifications(self, cv_text: str) -> Dict[str, Optional[str]]:
        """Extract qualifications from CV text, similar to n8n Qualifications node"""
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
            if self.gemini_model:
                response = await self._call_gemini(f"{prompt}\n\nCV Text:\n{cv_text}")
            elif self.openai_client:
                response = await self._call_openai(f"{prompt}\n\nCV Text:\n{cv_text}")
            else:
                raise Exception("No AI service available")
            
            return self._parse_qualifications_response(response)
        except Exception as e:
            print(f"Error extracting qualifications: {e}")
            return {
                "Educational qualification": None,
                "Job History": None,
                "Skills": None
            }
    
    async def generate_candidate_summary(self, candidate_data: Dict) -> str:
        """Generate candidate summary, similar to n8n Summarization Chain"""
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
            if self.gemini_model:
                return await self._call_gemini(prompt)
            elif self.openai_client:
                return await self._call_openai(prompt)
            else:
                raise Exception("No AI service available")
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Unable to generate summary"
    
    async def evaluate_candidate(self, candidate_summary: str, job_profile: str) -> Tuple[float, str]:
        """Evaluate candidate against job profile, similar to n8n HR Expert node"""
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
            if self.gemini_model:
                response = await self._call_gemini(prompt)
            elif self.openai_client:
                response = await self._call_openai(prompt)
            else:
                raise Exception("No AI service available")
            
            # Parse the response to extract score and consideration
            result = self._parse_evaluation_response(response)
            return result.get('vote', 0.0), result.get('consideration', 'Unable to evaluate')
        except Exception as e:
            print(f"Error evaluating candidate: {e}")
            return 0.0, f"Evaluation failed: {str(e)}"
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        response = await asyncio.to_thread(
            self.openai_client.chat.completions.create,
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        return response.choices[0].message.content
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API"""
        response = await asyncio.to_thread(
            self.gemini_model.generate_content,
            prompt
        )
        return response.text
    
    def _parse_personal_data_response(self, response: str) -> Dict[str, Optional[str]]:
        """Parse AI response for personal data extraction"""
        # Simple parsing - in production, use a proper JSON parser
        import json
        try:
            # Try to find JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback to default values
        return {"telephone": None, "city": None, "birthdate": None}
    
    def _parse_qualifications_response(self, response: str) -> Dict[str, Optional[str]]:
        """Parse AI response for qualifications extraction"""
        import json
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        return {
            "Educational qualification": None,
            "Job History": None,
            "Skills": None
        }
    
    def _parse_evaluation_response(self, response: str) -> Dict:
        """Parse AI response for candidate evaluation"""
        import json
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                result = json.loads(json_str)
                # Ensure vote is a float
                if 'vote' in result:
                    result['vote'] = float(result['vote'])
                return result
        except:
            pass
        
        return {"vote": 0.0, "consideration": "Unable to parse evaluation"}

# Create a singleton instance
ai_service = AIService()