import React, { useState } from 'react';
import { authService } from '../services/authService';
import Logo from '../assets/Logo.png';

interface LoginProps {
  onLoginSuccess: () => void;
  onSignUpClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.login(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      setResetLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch(`${window.location.origin}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          phone: resetPhone,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setResetSuccess('Password reset successfully! You can now login with your new password.');
      
      // Clear form and close modal after 3 seconds
      setTimeout(() => {
        setShowResetForm(false);
        setResetEmail('');
        setResetPhone('');
        setNewPassword('');
        setConfirmPassword('');
        setResetSuccess('');
      }, 3000);

    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const openResetForm = () => {
    setShowResetForm(true);
    setResetError('');
    setResetSuccess('');
  };

  const closeResetForm = () => {
    setShowResetForm(false);
    setResetEmail('');
    setResetPhone('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-google-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            className="h-24 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-200"
            src={Logo}
            alt="YogiTrack Logo"
          />
          <div className="mt-3 text-center">
            <h1 className="text-2xl font-bold text-yogi-black">YogiTrack</h1>
            <p className="text-sm text-gray-600 mt-1">Yoga Studio Management System</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-yogi-black">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to{' '}
          <span className="font-medium text-amber-600">YogiTrack</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-yogi-black">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-500 shadow-sm focus:border-yogi-orange focus:outline-none focus:ring-yogi-orange text-yogi-black sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 bg-white text-yogi-orange focus:ring-yogi-orange focus:ring-offset-white"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={openResetForm}
                  className="font-medium text-emerald-400 hover:text-amber-500 cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Login Failed
                    </h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Credentials */}
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Test Credentials:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Manager:</strong> manager1@gmail.com | 123456*</p>
                <p><strong>Instructor:</strong> instructor1@gmail.com | 123456*</p>
                <p><strong>Client:</strong> client1@gmail.com | 123456*</p>
              </div>
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
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          
          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSignUpClick}
                className="font-medium text-yogi-orange hover:text-yogi-brown cursor-pointer"
              >
                Sign up for free
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reset Password
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email and phone number to verify your identity, then set a new password.
              </p>

              <form onSubmit={handleResetPassword}>
                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label htmlFor="reset-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="reset-phone"
                    type="tel"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="At least 6 characters"
                  />
                </div>

                {/* Confirm Password */}
                <div className="mb-4">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="Confirm your new password"
                  />
                </div>

                {/* Error Message */}
                {resetError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200">
                    {resetError}
                  </div>
                )}

                {/* Success Message */}
                {resetSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 border border-green-200">
                    {resetSuccess}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeResetForm}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
