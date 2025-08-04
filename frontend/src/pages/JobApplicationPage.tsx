import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Job } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BriefcaseIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ApplicationForm {
  job_role: string;
  cv_file: FileList;
}

const JobApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ApplicationForm>();

  const selectedJobRole = watch('job_role');

  useEffect(() => {
    loadAvailableJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const jobs = await apiService.getAvailableJobs();
      setAvailableJobs(jobs);
    } catch (err: any) {
      setError('Failed to load available jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    setSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('job_role', data.job_role);
      formData.append('cv_file', data.cv_file[0]);

      await apiService.submitApplication(formData);
      setSuccess(true);
      
      // Redirect to applications page after 3 seconds
      setTimeout(() => {
        navigate('/my-applications');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJob = availableJobs.find(job => job.title.toLowerCase().includes(selectedJobRole?.toLowerCase()));

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card text-center">
          <CheckCircleIcon className="h-16 w-16 text-success-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your application has been successfully submitted and is being processed by our AI screening system.
          </p>
          <div className="bg-primary-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-primary-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-primary-700 space-y-1 text-left">
              <li>• AI will extract and analyze your CV content</li>
              <li>• Your qualifications will be evaluated against job requirements</li>
              <li>• You'll receive an AI-generated score and feedback</li>
              <li>• HR team will review the results and make a decision</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to your applications in a few seconds...
          </p>
          <button
            onClick={() => navigate('/my-applications')}
            className="btn btn-primary"
          >
            View My Applications
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Apply for a Position</h1>
        <p className="text-gray-600">Submit your application with AI-powered screening</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Application Details</h2>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="job_role" className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <select
                  {...register('job_role', { required: 'Please select a position' })}
                  className="input"
                >
                  <option value="">Select a position</option>
                  <option value="Sales">Sales</option>
                  <option value="Security">Security</option>
                  <option value="Operations">Operations</option>
                  <option value="Reception">Reception</option>
                </select>
                {errors.job_role && (
                  <p className="mt-1 text-sm text-error-600">{errors.job_role.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="cv_file" className="block text-sm font-medium text-gray-700 mb-2">
                  CV/Resume *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="cv_file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload your CV</span>
                        <input
                          {...register('cv_file', {
                            required: 'Please upload your CV',
                            validate: {
                              fileType: (files) => {
                                if (!files || files.length === 0) return true;
                                const file = files[0];
                                return file.type === 'application/pdf' || 'Please upload a PDF file';
                              },
                              fileSize: (files) => {
                                if (!files || files.length === 0) return true;
                                const file = files[0];
                                return file.size <= 10 * 1024 * 1024 || 'File size must be less than 10MB';
                              },
                            },
                          })}
                          id="cv_file"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>
                {errors.cv_file && (
                  <p className="mt-1 text-sm text-error-600">{errors.cv_file.message}</p>
                )}
              </div>

              <div className="border-t pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting Application...</span>
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Job Information Sidebar */}
        <div className="space-y-6">
          {/* Available Positions */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Positions</h3>
            <div className="space-y-3">
              {['Sales', 'Security', 'Operations', 'Reception'].map((role) => (
                <div key={role} className="flex items-center space-x-3">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Job Details */}
          {selectedJobRole && selectedJob && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Position Details</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedJob.title}</h4>
                  <p className="text-sm text-gray-600">{selectedJob.company_name}</p>
                  <p className="text-sm text-gray-500">{selectedJob.city}, {selectedJob.country}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">{selectedJob.description}</p>
                </div>
                {selectedJob.skills_required.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedJob.skills_required.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Processing Info */}
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-medium text-primary-900 mb-3">AI-Powered Screening</h3>
            <div className="space-y-2 text-sm text-primary-700">
              <p>• Automatic CV parsing and analysis</p>
              <p>• Skills and experience evaluation</p>
              <p>• Job fit scoring (1-10 scale)</p>
              <p>• Detailed feedback and recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;