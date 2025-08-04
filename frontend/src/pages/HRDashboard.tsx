import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { DashboardStats, CandidateApplication } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, applicationsData] = await Promise.all([
        apiService.getHRDashboard(),
        apiService.getAllApplications(1, 5), // Get latest 5 applications
      ]);
      
      setStats(dashboardStats);
      setRecentApplications(applicationsData.applications);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
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
          HR Dashboard
        </h1>
        <p className="text-gray-600">Welcome back, {user?.first_name}! Here's your hiring overview</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.total_applications}</h3>
                <p className="text-gray-600">Total Applications</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.pending_applications}</h3>
                <p className="text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.evaluated_applications}</h3>
                <p className="text-gray-600">Evaluated</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.high_score_evaluations}</h3>
                <p className="text-gray-600">High Scores (7+)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/hr/applications"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Review Applications</h3>
              <p className="text-gray-600">Evaluate candidate submissions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/hr/jobs"
          className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Manage Jobs</h3>
              <p className="text-gray-600">Create and manage job postings</p>
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="text-gray-600">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
            <Link to="/hr/applications" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <Link
                  key={application.id}
                  to={`/hr/applications/${application.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{application.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.application_status)}`}>
                      {application.application_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Applied for: {application.job_role}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(application.submitted_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Applications by Role */}
        {stats && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Applications by Role</h2>
            
            {Object.keys(stats.applications_by_role).length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.applications_by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-gray-700">{role}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.applications_by_role))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Status */}
      {stats && (
        <div className="mt-8">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI Processing: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${stats.google_sheets_available ? 'bg-success-500' : 'bg-warning-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Google Sheets: {stats.google_sheets_available ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;