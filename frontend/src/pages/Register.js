import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Optional fields validation
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 18 || (age === 18 && monthDiff < 0)) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword and clean up empty optional fields
      const { confirmPassword, phone, dateOfBirth, ...userData } = formData;

      // Only include optional fields if they have values
      const cleanedUserData = {
        ...userData,
        ...(phone && phone.trim() && { phone: phone.trim() }),
        ...(dateOfBirth && { dateOfBirth })
      };

      console.log('🔍 Register Component: Form data:', formData);
      console.log('🔍 Register Component: Cleaned data:', cleanedUserData);

      const result = await register(cleanedUserData);
      console.log('🔍 Register Component: Register result:', result);

      if (result.success) {
        toast.success('Registration successful! Welcome to Leisure Club!');
        navigate('/dashboard');
      } else {
        console.error('🔍 Register Component: Registration failed:', result.error);
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🏊‍♂️</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="form-input"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth (Optional)
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="form-input"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.dateOfBirth && (
                <p className="form-error">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="form-input"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <button type="button" className="text-blue-600 hover:text-blue-500 underline bg-transparent border-none p-0 cursor-pointer">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" className="text-blue-600 hover:text-blue-500 underline bg-transparent border-none p-0 cursor-pointer">
              Privacy Policy
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;