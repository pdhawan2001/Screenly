import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  LoginRequest,
  RegisterCandidateRequest,
  RegisterHRRequest,
  AuthResponse,
  Job,
  JobProfile,
  CandidateApplication,
  CandidateEvaluation,
  PaginatedResponse,
  DashboardStats,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/login', credentials);
    return response.data;
  }

  async registerCandidate(data: RegisterCandidateRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/register/Candidate', data);
    return response.data;
  }

  async registerHR(data: RegisterHRRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/register/HR', data);
    return response.data;
  }

  // Candidate endpoints
  async getAvailableJobs(city?: string, jobRole?: string): Promise<Job[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (jobRole) params.append('job_role', jobRole);
    
    const response: AxiosResponse<Job[]> = await this.api.get(`/candidates/jobs?${params}`);
    return response.data;
  }

  async submitApplication(formData: FormData): Promise<CandidateApplication> {
    const response: AxiosResponse<CandidateApplication> = await this.api.post(
      '/candidates/apply',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getCandidateApplications(page = 1, perPage = 20): Promise<PaginatedResponse<CandidateApplication>> {
    const response: AxiosResponse<PaginatedResponse<CandidateApplication>> = await this.api.get(
      `/candidates/applications?page=${page}&per_page=${perPage}`
    );
    return response.data;
  }

  // HR endpoints
  async getHRDashboard(): Promise<DashboardStats> {
    const response: AxiosResponse<DashboardStats> = await this.api.get('/hr/dashboard');
    return response.data;
  }

  async getAllApplications(page = 1, perPage = 20, status?: string, jobRole?: string): Promise<PaginatedResponse<CandidateApplication>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (status) params.append('status', status);
    if (jobRole) params.append('job_role', jobRole);

    const response: AxiosResponse<PaginatedResponse<CandidateApplication>> = await this.api.get(
      `/candidates/applications?${params}`
    );
    return response.data;
  }

  async getApplication(id: number): Promise<CandidateApplication> {
    const response: AxiosResponse<CandidateApplication> = await this.api.get(`/candidates/applications/${id}`);
    return response.data;
  }

  async getApplicationEvaluation(id: number): Promise<CandidateEvaluation> {
    const response: AxiosResponse<CandidateEvaluation> = await this.api.get(`/candidates/applications/${id}/evaluation`);
    return response.data;
  }

  async submitHRReview(applicationId: number, review: {
    hr_score: number;
    hr_notes?: string;
    hr_decision: string;
  }): Promise<{ message: string }> {
    const response = await this.api.post(`/candidates/applications/${applicationId}/review`, review);
    return response.data;
  }

  // Job Management
  async getJobs(): Promise<Job[]> {
    const response: AxiosResponse<Job[]> = await this.api.get('/hr/jobs');
    return response.data;
  }

  async createJob(job: Omit<Job, 'id' | 'posted_at' | 'company_name'>): Promise<Job> {
    const response: AxiosResponse<Job> = await this.api.post('/hr/jobs', job);
    return response.data;
  }

  async getJobProfiles(): Promise<JobProfile[]> {
    const response: AxiosResponse<JobProfile[]> = await this.api.get('/hr/job-profiles');
    return response.data;
  }

  async createJobProfile(profile: Omit<JobProfile, 'id' | 'created_at' | 'updated_at'>): Promise<JobProfile> {
    const response: AxiosResponse<JobProfile> = await this.api.post('/hr/job-profiles', profile);
    return response.data;
  }
}

export const apiService = new ApiService();