// User Types
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
  email: string;
  role: 'HR' | 'Candidate';
  email_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterCandidateRequest {
  username: string;
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
}

export interface RegisterHRRequest extends RegisterCandidateRequest {
  company_name: string;
  position: string;
  street_number: string;
  street_name: string;
  postal_code: string;
  city: string;
  country: string;
}

// Job Types
export interface Job {
  id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  company_name: string;
  posted_at: string;
  skills_required: string[];
  is_active: boolean;
  job_profile_id?: number;
}

export interface JobProfile {
  id: number;
  role: string;
  profile_wanted: string;
  required_skills?: string;
  experience_level?: string;
  education_requirements?: string;
  created_at: string;
  updated_at: string;
}

// Application Types
export interface CandidateApplication {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  birthdate?: string;
  cv_filename: string;
  job_role: string;
  educational_qualification?: string;
  job_history?: string;
  skills?: string;
  application_status: 'submitted' | 'processing' | 'evaluated' | 'failed';
  submitted_at: string;
  processed_at?: string;
}

export interface CandidateEvaluation {
  id: number;
  application_id: number;
  candidate_summary?: string;
  ai_score?: number;
  ai_considerations?: string;
  job_profile_requirements?: string;
  alignment_analysis?: string;
  hr_reviewed: boolean;
  hr_score?: number;
  hr_notes?: string;
  hr_decision?: 'accept' | 'reject' | 'interview' | 'pending';
  evaluation_status: string;
  evaluated_at?: string;
  exported_to_sheets: boolean;
}

// API Response Types
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  applications: T[];
  total: number;
  page: number;
  per_page: number;
}

// Dashboard Types
export interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  evaluated_applications: number;
  total_evaluations: number;
  high_score_evaluations: number;
  applications_by_role: Record<string, number>;
  google_sheets_available: boolean;
}