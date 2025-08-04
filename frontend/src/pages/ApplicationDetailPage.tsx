import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiService } from '../services/api';
import { CandidateApplication, CandidateEvaluation } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface HRReviewForm {
  hr_score: number;
  hr_notes: string;
  hr_decision: string;
}

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<CandidateApplication | null>(null);
  const [evaluation, setEvaluation] = useState<CandidateEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<HRReviewForm>();

  useEffect(() => {
    if (id) {
      loadApplicationDetail();
    }
  }, [id]);

  const loadApplicationDetail = async () => {
    try {
      setLoading(true);
      const [appData, evalData] = await Promise.all([
        apiService.getApplication(parseInt(id!)),
        apiService.getApplicationEvaluation(parseInt(id!)).catch(() => null), // Evaluation might not exist yet
      ]);
      
      setApplication(appData);
      setEvaluation(evalData);
      
      // Pre-fill form with existing HR review data
      if (evalData?.hr_reviewed) {
        setValue('hr_score', evalData.hr_score || 0);
        setValue('hr_notes', evalData.hr_notes || '');
        setValue('hr_decision', evalData.hr_decision || '');
      }
    } catch (err: any) {
      setError('Failed to load application details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReview = async (data: HRReviewForm) => {
    if (!id) return;
    
    setSubmittingReview(true);
    setError('');
    
    try {
      await apiService.submitHRReview(parseInt(id), data);
      setReviewSuccess(true);
      // Reload the evaluation data
      const evalData = await apiService.getApplicationEvaluation(parseInt(id));
      setEvaluation(evalData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success-600 bg-success-50';
    if (score >= 6) return 'text-warning-600 bg-warning-50';
    return 'text-error-600 bg-error-50';
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < score ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
          <button onClick={() => navigate('/hr/applications')} className="btn btn-primary">
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/hr/applications')}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Applications
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.name}</h1>
            <p className="text-gray-600">Application for {application.job_role}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(application.application_status)}
            <span className="text-sm font-medium capitalize">{application.application_status}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 text-error-600 rounded-lg">
          {error}
        </div>
      )}

      {reviewSuccess && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 text-success-600 rounded-lg">
          Review submitted successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Information */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">Candidate Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{application.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{application.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{application.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">City</label>
                <p className="text-gray-900">{application.city || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Birthdate</label>
                <p className="text-gray-900">{application.birthdate || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">CV File</label>
                <p className="text-gray-900">{application.cv_filename}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-gray-900">{new Date(application.submitted_at).toLocaleString()}</p>
                </div>
                {application.processed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Processed</label>
                    <p className="text-gray-900">{new Date(application.processed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Extracted Information */}
          {(application.educational_qualification || application.job_history || application.skills) && (
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">AI-Extracted Information</h2>
              </div>
              
              {application.educational_qualification && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Education</label>
                  <p className="text-gray-900 text-sm leading-relaxed">{application.educational_qualification}</p>
                </div>
              )}
              
              {application.job_history && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Job History</label>
                  <p className="text-gray-900 text-sm leading-relaxed">{application.job_history}</p>
                </div>
              )}
              
              {application.skills && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Skills</label>
                  <p className="text-gray-900 text-sm leading-relaxed">{application.skills}</p>
                </div>
              )}
            </div>
          )}

          {/* AI Evaluation */}
          {evaluation && (
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">AI Evaluation</h2>
              </div>
              
              {evaluation.ai_score && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">AI Score</label>
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(evaluation.ai_score)}`}>
                      {evaluation.ai_score}/10
                    </span>
                    <div className="flex space-x-0.5">
                      {renderStars(Math.round(evaluation.ai_score))}
                    </div>
                  </div>
                </div>
              )}
              
              {evaluation.candidate_summary && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Candidate Summary</label>
                  <p className="text-gray-900 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {evaluation.candidate_summary}
                  </p>
                </div>
              )}
              
              {evaluation.ai_considerations && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">AI Analysis</label>
                  <p className="text-gray-900 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {evaluation.ai_considerations}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* HR Review Form */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">HR Review</h3>
            
            {evaluation?.hr_reviewed && (
              <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-600 font-medium">Already reviewed</p>
                <p className="text-xs text-success-600">You can update your review below</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
              <div>
                <label htmlFor="hr_score" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Score (1-10) *
                </label>
                <input
                  {...register('hr_score', {
                    required: 'Score is required',
                    min: { value: 1, message: 'Score must be at least 1' },
                    max: { value: 10, message: 'Score must be at most 10' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  className="input"
                  placeholder="8.5"
                />
                {errors.hr_score && (
                  <p className="mt-1 text-sm text-error-600">{errors.hr_score.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="hr_decision" className="block text-sm font-medium text-gray-700 mb-1">
                  Decision *
                </label>
                <select
                  {...register('hr_decision', { required: 'Decision is required' })}
                  className="input"
                >
                  <option value="">Select decision</option>
                  <option value="accept">Accept</option>
                  <option value="reject">Reject</option>
                  <option value="interview">Interview</option>
                  <option value="pending">Pending</option>
                </select>
                {errors.hr_decision && (
                  <p className="mt-1 text-sm text-error-600">{errors.hr_decision.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="hr_notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('hr_notes')}
                  rows={4}
                  className="input"
                  placeholder="Add your notes about this candidate..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                {submittingReview ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          </div>

          {/* Existing HR Review */}
          {evaluation?.hr_reviewed && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Review</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">HR Score</label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(evaluation.hr_score || 0)}`}>
                      {evaluation.hr_score}/10
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Decision</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                    {evaluation.hr_decision}
                  </span>
                </div>
                {evaluation.hr_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900 mt-1">{evaluation.hr_notes}</p>
                  </div>
                )}
                {evaluation.evaluated_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Reviewed</label>
                    <p className="text-sm text-gray-900">{new Date(evaluation.evaluated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;