import React, { useState } from 'react';
import type { User } from '../services/authService';
import PassList from './PassList';
import UserPasses from './UserPasses';
import CreatePassForm from './CreatePassForm';
import AttendanceManager from './AttendanceManager';
import ClassManager from './ClassManager';
import ClassScheduler from './ClassScheduler';
import InstructorManager from './InstructorManager';
import ClientManager from './ClientManager';
import ManagerManager from './ManagerManager';
import Reports from './Reports';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreatePassForm, setShowCreatePassForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handlePassCreated = () => {
    setShowCreatePassForm(false);
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('passes');
  };

  const handlePassPurchased = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClassScheduled = () => {
    setRefreshTrigger(prev => prev + 1);
  };  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    ...(user.userType === 'Manager' ? [
      { id: 'passes', name: 'Manage Passes', icon: '🎫' },
      { id: 'classes', name: 'Manage Classes', icon: '🧘‍♀️' },
      { id: 'instructors', name: 'Manage Instructors', icon: '👨‍🏫' },
      { id: 'clients', name: 'Manage Clients', icon: '👥' },
      { id: 'managers', name: 'Manage Managers', icon: '👔' },
      { id: 'reports', name: 'Reports', icon: '📈' }
    ] : user.userType === 'Instructor' ? [
      { id: 'attendance', name: 'Attendance', icon: '📋' },
      { id: 'classes', name: 'My Classes', icon: '🧘‍♀️' }
    ] : [
      { id: 'passes', name: 'Browse Passes', icon: '🎫' },
      { id: 'my-passes', name: 'My Passes', icon: '📋' },
      { id: 'schedule', name: 'Schedule Class', icon: '📅' }
    ])
  ];

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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <>
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
                            {user.userType === 'Manager' && 'You have full management access to instructors, classes, and passes.'}
                            {user.userType === 'Instructor' && 'You can manage your classes, take attendance, and view schedules.'}
                            {user.userType === 'User' && 'You can purchase passes and book classes.'}
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
                        <button 
                          onClick={() => setActiveTab('passes')}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          🎫 Manage Passes
                        </button>
                        <button 
                          onClick={() => setActiveTab('classes')}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          📅 Manage Classes
                        </button>
                        <button 
                          onClick={() => setActiveTab('reports')}
                          className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          📈 View Reports
                        </button>
                      </>
                    )}
                    {user.userType === 'Instructor' && (
                      <>
                        <button 
                          onClick={() => setActiveTab('classes')}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
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
                        <button 
                          onClick={() => setActiveTab('passes')}
                          className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          🎫 Browse Passes
                        </button>
                        <button 
                          onClick={() => setActiveTab('my-passes')}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          📋 My Passes
                        </button>
                        <button 
                          onClick={() => setActiveTab('schedule')}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                          📅 Schedule Class
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'passes' && (
            <div>
              {user.userType === 'Manager' && (
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Passes</h2>
                    <p className="text-gray-600">Create, edit, and manage yoga passes</p>
                  </div>
                  <button
                    onClick={() => setShowCreatePassForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    + Create Pass
                  </button>
                </div>
              )}
              <PassList 
                userType={user.userType} 
                onPassPurchased={handlePassPurchased}
                key={refreshTrigger}
              />
            </div>
          )}

          {activeTab === 'my-passes' && user.userType !== 'Manager' && (
            <UserPasses key={refreshTrigger} />
          )}

          {activeTab === 'attendance' && user.userType === 'Instructor' && (
            <AttendanceManager />
          )}

          {activeTab === 'classes' && (user.userType === 'Instructor' || user.userType === 'Manager') && (
            <ClassManager userType={user.userType} />
          )}

          {activeTab === 'instructors' && user.userType === 'Manager' && (
            <InstructorManager />
          )}

          {activeTab === 'clients' && user.userType === 'Manager' && (
            <ClientManager />
          )}

          {activeTab === 'managers' && user.userType === 'Manager' && (
            <ManagerManager />
          )}

          {activeTab === 'reports' && user.userType === 'Manager' && (
            <Reports />
          )}

          {activeTab === 'schedule' && user.userType === 'User' && (
            <ClassScheduler 
              onNeedPass={() => setActiveTab('passes')} 
              onClassScheduled={handleClassScheduled}
            />
          )}
        </div>
      </main>

      {/* Create Pass Form Modal */}
      {showCreatePassForm && (
        <CreatePassForm
          onPassCreated={handlePassCreated}
          onCancel={() => setShowCreatePassForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
