import { useState, useEffect } from 'react';
import { passService } from '../services/passService';
import type { UserPassData } from '../services/passService';

interface UserPassCardProps {
  userPass: UserPassData;
}

const UserPassCard: React.FC<UserPassCardProps> = ({ userPass }) => {
  const pass = typeof userPass.passId === 'string' ? null : userPass.passId;
  const daysRemaining = passService.getDaysRemaining(userPass.expirationDate);
  const isExpired = daysRemaining === 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

  const getStatusColor = () => {
    if (!userPass.isActive || isExpired) return 'bg-red-100 text-red-800';
    if (isExpiringSoon) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (!userPass.isActive) return 'Inactive';
    if (isExpired) return 'Expired';
    if (userPass.sessionsRemaining === 0) return 'Sessions Used';
    return 'Active';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-400 to-amber-400 px-4 py-3">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-white">
            {pass ? pass.name : 'Pass'}
          </h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        <p className="text-white/90 text-sm mt-1">ID: {userPass.userPassId}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 font-medium">Sessions:</span>
            <p className="text-gray-900 font-semibold">
              {userPass.sessionsRemaining} / {userPass.totalSessions} remaining
            </p>
          </div>
          
          <div>
            <span className="text-gray-500 font-medium">Days Left:</span>
            <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-green-600'}`}>
              {isExpired ? 'Expired' : `${daysRemaining} days`}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Purchase Date:</span>
            <p className="text-gray-900">
              {new Date(userPass.purchaseDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <span className="text-gray-500 font-medium">Expires:</span>
            <p className="text-gray-900">
              {new Date(userPass.expirationDate).toLocaleDateString()}
            </p>
          </div>

          <div className="col-span-2">
            <span className="text-gray-500 font-medium">Price Paid:</span>
            <p className="text-gray-900 font-semibold">
              {passService.formatPrice(userPass.purchasePrice)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Sessions Used</span>
            <span>{userPass.totalSessions - userPass.sessionsRemaining} / {userPass.totalSessions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((userPass.totalSessions - userPass.sessionsRemaining) / userPass.totalSessions) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UserPassesProps {
  showActiveOnly?: boolean;
}

const UserPasses: React.FC<UserPassesProps> = ({ showActiveOnly = false }) => {
  const [userPasses, setUserPasses] = useState<UserPassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const passes = showActiveOnly 
          ? await passService.getUserActivePasses()
          : await passService.getUserPasses();
        setUserPasses(passes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load passes');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [showActiveOnly]);

  const loadUserPasses = async () => {
    try {
      setIsLoading(true);
      const passes = showActiveOnly 
        ? await passService.getUserActivePasses()
        : await passService.getUserPasses();
      setUserPasses(passes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={loadUserPasses}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (userPasses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <p className="text-gray-600 text-lg font-medium">
          {showActiveOnly ? 'No active passes' : 'No passes found'}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {showActiveOnly 
            ? 'You don\'t have any active passes. Purchase a pass to start booking classes.'
            : 'You haven\'t purchased any passes yet. Browse available passes to get started.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {showActiveOnly ? 'Active Passes' : 'My Passes'}
        </h2>
        <p className="text-gray-600">
          {showActiveOnly 
            ? 'Your currently active yoga passes'
            : 'All your purchased yoga passes'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userPasses.map((userPass) => (
          <UserPassCard
            key={userPass.userPassId}
            userPass={userPass}
          />
        ))}
      </div>
    </div>
  );
};

export default UserPasses;
