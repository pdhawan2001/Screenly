import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { CandidateApplication, Job } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [applicationsData, jobsData] = await Promise.all([
        apiService.getCandidateApplications(1, 5), // Get latest 5 applications
        apiService.getAvailableJobs(),
      ]);
      
      setApplications(applicationsData.applications);
      setAvailableJobs(jobsData.slice(0, 6)); // Show 6 latest jobs
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'processing':
        return <LoadingSpinner size="sm" />;
      case 'evaluated':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'processing':
        return 'Processing';
      case 'evaluated':
        return 'Evaluated';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-warning-600 bg-warning-50';
      case 'processing':
        return 'text-primary-600 bg-primary-50';
      case 'evaluated':
        return 'text-success-600 bg-success-50';
      case 'failed':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-600">Track your applications and discover new opportunities</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/apply"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BriefcaseIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Apply for Jobs</h3>
              <p className="text-gray-600">Submit applications with AI-powered screening</p>
            </div>
          </div>
        </Link>

        <Link
          to="/my-applications"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
              <p className="text-gray-600">Track the status of your submissions</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
            <Link to="/my-applications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No applications yet</p>
              <Link to="/apply" className="btn btn-primary">
                Submit Your First Application
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{application.job_role}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.application_status)}`}>
                      {getStatusIcon(application.application_status)}
                      <span className="ml-1">{getStatusText(application.application_status)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Applied on {new Date(application.submitted_at).toLocaleDateString()}
                  </p>
                  {application.processed_at && (
                    <p className="text-sm text-gray-600">
                      Processed on {new Date(application.processed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Latest Job Opportunities</h2>
            <Link to="/apply" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {availableJobs.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No jobs available at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company_name}</p>
                      <p className="text-sm text-gray-500">{job.city}, {job.country}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                  {job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skills_required.slice(0, 3).map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills_required.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{job.skills_required.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Posted {new Date(job.posted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;