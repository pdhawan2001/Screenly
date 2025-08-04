import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { CandidateApplication } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const ApplicationsPage: React.FC = () => {
  const { isHR } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    jobRole: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
  });

  useEffect(() => {
    loadApplications();
  }, [filters, pagination.page]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = isHR 
        ? await apiService.getAllApplications(
            pagination.page,
            pagination.per_page,
            filters.status || undefined,
            filters.jobRole || undefined
          )
        : await apiService.getCandidateApplications(pagination.page, pagination.per_page);
      
      setApplications(data.applications);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (err: any) {
      setError('Failed to load applications');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'processing':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'evaluated':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'failed':
        return 'text-error-600 bg-error-50 border-error-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.per_page);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isHR ? 'All Applications' : 'My Applications'}
        </h1>
        <p className="text-gray-600">
          {isHR 
            ? 'Review and manage candidate applications' 
            : 'Track the status of your job applications'
          }
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters (HR only) */}
      {isHR && (
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="processing">Processing</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Role
                </label>
                <select
                  id="role-filter"
                  value={filters.jobRole}
                  onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                  className="input"
                >
                  <option value="">All Roles</option>
                  <option value="Sales">Sales</option>
                  <option value="Security">Security</option>
                  <option value="Operations">Operations</option>
                  <option value="Reception">Reception</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ status: '', jobRole: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="card">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {isHR 
                ? 'No candidate applications match your current filters.' 
                : "You haven't submitted any applications yet."
              }
            </p>
            {!isHR && (
              <Link to="/apply" className="btn btn-primary">
                Submit Your First Application
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isHR && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                  {isHR && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.name}
                          </div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.job_role}
                      </div>
                      <div className="text-sm text-gray-500">{application.cv_filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.application_status)}`}>
                        {getStatusIcon(application.application_status)}
                        <span className="ml-1 capitalize">{application.application_status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.processed_at 
                        ? new Date(application.processed_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    {isHR && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/hr/applications/${application.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>View</span>
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.per_page + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.per_page, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;