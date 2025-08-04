import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { RegisterCandidateRequest, RegisterHRRequest } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type RegistrationType = 'candidate' | 'hr';

const RegisterPage: React.FC = () => {
  const { registerCandidate, registerHR } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationType, setRegistrationType] = useState<RegistrationType>('candidate');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterHRRequest & { confirm_password: string }>();

  const password = watch('password');

  const onSubmit = async (data: RegisterHRRequest & { confirm_password: string }) => {
    setLoading(true);
    setError('');
    
    try {
      if (registrationType === 'candidate') {
        const candidateData: RegisterCandidateRequest = {
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
        };
        await registerCandidate(candidateData);
      } else {
        await registerHR(data);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Screenly today
          </p>
        </div>

        <div className="card">
          {/* Registration Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am registering as a:
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setRegistrationType('candidate')}
                className={`flex-1 p-3 text-sm font-medium rounded-lg border ${
                  registrationType === 'candidate'
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Job Candidate
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('hr')}
                className={`flex-1 p-3 text-sm font-medium rounded-lg border ${
                  registrationType === 'hr'
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
              >
                HR Professional
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  {...register('first_name', { required: 'First name is required' })}
                  type="text"
                  className="input mt-1"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-error-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  {...register('last_name')}
                  type="text"
                  className="input mt-1"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                })}
                type="text"
                className="input mt-1"
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-error-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                className="input mt-1"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  type="password"
                  className="input mt-1"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type="password"
                  className="input mt-1"
                  placeholder="••••••••"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-error-600">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            {/* HR-specific fields */}
            {registrationType === 'hr' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Company Name *
                      </label>
                      <input
                        {...register('company_name', { required: 'Company name is required' })}
                        type="text"
                        className="input mt-1"
                        placeholder="TechCorp Inc"
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-sm text-error-600">{errors.company_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                        Your Position *
                      </label>
                      <input
                        {...register('position', { required: 'Position is required' })}
                        type="text"
                        className="input mt-1"
                        placeholder="HR Manager"
                      />
                      {errors.position && (
                        <p className="mt-1 text-sm text-error-600">{errors.position.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="street_number" className="block text-sm font-medium text-gray-700">
                          Street Number *
                        </label>
                        <input
                          {...register('street_number', { required: 'Street number is required' })}
                          type="text"
                          className="input mt-1"
                          placeholder="123"
                        />
                        {errors.street_number && (
                          <p className="mt-1 text-sm text-error-600">{errors.street_number.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="street_name" className="block text-sm font-medium text-gray-700">
                          Street Name *
                        </label>
                        <input
                          {...register('street_name', { required: 'Street name is required' })}
                          type="text"
                          className="input mt-1"
                          placeholder="Main Street"
                        />
                        {errors.street_name && (
                          <p className="mt-1 text-sm text-error-600">{errors.street_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City *
                        </label>
                        <input
                          {...register('city', { required: 'City is required' })}
                          type="text"
                          className="input mt-1"
                          placeholder="New York"
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-error-600">{errors.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                          Postal Code *
                        </label>
                        <input
                          {...register('postal_code', { required: 'Postal code is required' })}
                          type="text"
                          className="input mt-1"
                          placeholder="10001"
                        />
                        {errors.postal_code && (
                          <p className="mt-1 text-sm text-error-600">{errors.postal_code.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country *
                        </label>
                        <input
                          {...register('country', { required: 'Country is required' })}
                          type="text"
                          className="input mt-1"
                          placeholder="USA"
                        />
                        {errors.country && (
                          <p className="mt-1 text-sm text-error-600">{errors.country.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary flex justify-center items-center"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full btn btn-secondary flex justify-center items-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;