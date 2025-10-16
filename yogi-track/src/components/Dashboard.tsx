import React from 'react';
import type { User } from '../services/authService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'Manager':
        return 'bg-purple-100 text-purple-800';
      case 'Instructor':
        return 'bg-blue-100 text-blue-800';
      case 'User':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'Manager':
        return '👔';
      case 'Instructor':
        return '🧘‍♀️';
      case 'User':
        return '🧘‍♂️';
      default:
        return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 font-google-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img className="h-10 w-auto" src="/Logo.png" alt="YogiTrack" />
              <h1 className="ml-3 text-2xl font-bold text-yogi-black">YogiTrack</h1>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-yogi-black mb-2">
              Welcome back, {user.firstname}! {getUserTypeIcon(user.userType)}
            </h2>
            <p className="text-gray-600">
              Here's your account information and recent activity.
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-400 to-amber-400">
              <h3 className="text-lg font-semibold text-white">Account Information</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div>
                  <h4 className="text-lg font-medium text-yogi-black mb-4">Personal Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-20">ID:</span>
                      <span className="text-sm text-yogi-black font-mono bg-gray-100 px-2 py-1 rounded">
                        {user.userId}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-20">Name:</span>
                      <span className="text-sm text-yogi-black">
                        {user.firstname} {user.lastname}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-20">Email:</span>
                      <span className="text-sm text-yogi-black">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 w-20">Phone:</span>
                        <span className="text-sm text-yogi-black">{user.phone}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 w-20">Address:</span>
                        <span className="text-sm text-yogi-black">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Type */}
                <div>
                  <h4 className="text-lg font-medium text-yogi-black mb-4">Account Type</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-20">Role:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(user.userType)}`}>
                        {getUserTypeIcon(user.userType)} {user.userType}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        {user.userType === 'Manager' && 'You have full management access to instructors and classes.'}
                        {user.userType === 'Instructor' && 'You can manage your classes and view schedules.'}
                        {user.userType === 'User' && 'You can book classes and view your schedule.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-400 to-amber-400">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.userType === 'Manager' && (
                  <>
                    <button className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      📊 Manage Instructors
                    </button>
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      📅 Manage Classes
                    </button>
                    <button className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      📈 View Reports
                    </button>
                  </>
                )}
                {user.userType === 'Instructor' && (
                  <>
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      📅 My Classes
                    </button>
                    <button className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      👥 View Students
                    </button>
                    <button className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      ⚙️ Profile Settings
                    </button>
                  </>
                )}
                {user.userType === 'User' && (
                  <>
                    <button className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      🔍 Browse Classes
                    </button>
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      📅 My Bookings
                    </button>
                    <button className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                      ⚙️ Profile Settings
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
