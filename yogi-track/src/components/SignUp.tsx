import React, { useState } from 'react';
import { authService } from '../services/authService';

interface SignUpProps {
  onSignUpSuccess: () => void;
  onBackToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUpSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Extract only the needed fields for registration
      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
      };
      await authService.register(userData);
      onSignUpSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-google-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            className="h-16 w-auto"
            src="/Logo.png"
            alt="YogiTrack"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-yogi-black">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join{' '}
          <span className="font-medium text-amber-600">YogiTrack</span>
          {' '}today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-yogi-black">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="firstname"
                    name="firstname"
                    type="text"
                    required
                    value={formData.firstname}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                    placeholder="First name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-yogi-black">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="lastname"
                    name="lastname"
                    type="text"
                    required
                    value={formData.lastname}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-yogi-black">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-yogi-black">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-yogi-black">
                Address
              </label>
              <div className="mt-1">
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-yogi-black">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-yogi-black">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Registration Failed
                    </h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* User Type Info */}
            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>Account Type:</strong> You'll be registered as a Client. 
                A Manager can later upgrade your account to Instructor or Manager if needed.
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-emerald-400 hover:bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-yogi-brown focus:outline-none focus:ring-2 focus:ring-yogi-orange focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Back to Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onBackToLogin}
                className="font-medium text-yogi-orange hover:text-yogi-brown cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
