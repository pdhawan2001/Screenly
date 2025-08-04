import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiService } from '../services/api';
import { Job, JobProfile } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface JobForm {
  title: string;
  description: string;
  street_number: string;
  street_name: string;
  city: string;
  country: string;
  zip_code: string;
  skills_required: string;
  is_active: boolean;
  job_profile_id?: number;
}

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<JobForm>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, profilesData] = await Promise.all([
        apiService.getJobs(),
        apiService.getJobProfiles(),
      ]);
      setJobs(jobsData);
      setJobProfiles(profilesData);
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: JobForm) => {
    setSubmitting(true);
    setError('');
    
    try {
      const jobData = {
        ...data,
        skills_required: data.skills_required.split(',').map(s => s.trim()),
        job_profile_id: data.job_profile_id || undefined,
      };

      if (editingJob) {
        // Update job (API endpoint would need to be implemented)
        console.log('Update job:', jobData);
      } else {
        await apiService.createJob(jobData);
      }
      
      reset();
      setShowCreateForm(false);
      setEditingJob(null);
      loadData(); // Reload the jobs list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowCreateForm(true);
    setValue('title', job.title);
    setValue('description', job.description);
    setValue('city', job.city);
    setValue('country', job.country);
    setValue('skills_required', job.skills_required.join(', '));
    setValue('is_active', job.is_active);
    setValue('job_profile_id', job.job_profile_id);
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setShowCreateForm(false);
    reset();
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600">Create and manage job postings</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Create/Edit Job Form */}
      {showCreateForm && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {editingJob ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  {...register('title', { required: 'Job title is required' })}
                  type="text"
                  className="input"
                  placeholder="Senior Sales Manager"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-error-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="job_profile_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Profile
                </label>
                <select
                  {...register('job_profile_id', { valueAsNumber: true })}
                  className="input"
                >
                  <option value="">Select a job profile (optional)</option>
                  {jobProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input"
                placeholder="Describe the job responsibilities, requirements, and benefits..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="street_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Number
                </label>
                <input
                  {...register('street_number')}
                  type="text"
                  className="input"
                  placeholder="123"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="street_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Name
                </label>
                <input
                  {...register('street_name')}
                  type="text"
                  className="input"
                  placeholder="Main Street"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className="input"
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-error-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  {...register('country', { required: 'Country is required' })}
                  type="text"
                  className="input"
                  placeholder="USA"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-error-600">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  {...register('zip_code')}
                  type="text"
                  className="input"
                  placeholder="10001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="skills_required" className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills (comma-separated)
              </label>
              <input
                {...register('skills_required')}
                type="text"
                className="input"
                placeholder="Sales, Leadership, CRM, Communication"
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                defaultChecked={true}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Job is active
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>{editingJob ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <span>{editingJob ? 'Update Job' : 'Create Job'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Active Jobs ({jobs.length})</h2>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-600 mb-4">Create your first job posting to start accepting applications.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.is_active 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{job.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                      <div>
                        <span className="font-medium">Location:</span> {job.city}, {job.country}
                      </div>
                      <div>
                        <span className="font-medium">Company:</span> {job.company_name}
                      </div>
                      <div>
                        <span className="font-medium">Posted:</span> {new Date(job.posted_at).toLocaleDateString()}
                      </div>
                      {job.job_profile_id && (
                        <div>
                          <span className="font-medium">Profile:</span> {
                            jobProfiles.find(p => p.id === job.job_profile_id)?.role || 'Unknown'
                          }
                        </div>
                      )}
                    </div>
                    
                    {job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.skills_required.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(job)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Edit job"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this job?')) {
                          // Implement delete functionality
                          console.log('Delete job:', job.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-error-600"
                      title="Delete job"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;