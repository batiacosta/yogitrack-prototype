import { useState, useEffect } from 'react';
import { passService } from '../services/passService';
import type { PassData } from '../services/passService';

interface PassCardProps {
  pass: PassData;
  onPurchase?: (passId: string) => void;
  isManager?: boolean;
  onEdit?: (pass: PassData) => void;
  onDelete?: (passId: string) => void;
}

const PassCard: React.FC<PassCardProps> = ({ 
  pass, 
  onPurchase, 
  isManager = false, 
  onEdit, 
  onDelete 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!onPurchase) return;
    
    setIsLoading(true);
    try {
      await onPurchase(pass.passId);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeColor = (sessions: number) => {
    if (sessions <= 4) return 'bg-green-100 text-green-800';
    if (sessions <= 8) return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-400 to-amber-400 px-6 py-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white">{pass.name}</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(pass.sessions)}`}>
            {pass.sessions} sessions
          </span>
        </div>
        {pass.description && (
          <p className="text-white/90 mt-2 text-sm">{pass.description}</p>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Duration:</span>
            <span className="text-gray-900">{passService.formatDuration(pass.duration)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Sessions:</span>
            <span className="text-gray-900">{pass.sessions} classes</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-lg font-bold text-gray-900">Price:</span>
            <span className="text-2xl font-bold text-emerald-600">{passService.formatPrice(pass.price)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        {isManager ? (
          <div className="flex space-x-3">
            <button
              onClick={() => onEdit?.(pass)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(pass.passId)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Purchase Pass'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

interface PassListProps {
  userType: string;
  onPassPurchased?: () => void;
}

const PassList: React.FC<PassListProps> = ({ userType, onPassPurchased }) => {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isManager = userType === 'Manager';

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      setIsLoading(true);
      const passData = await passService.getAllPasses();
      setPasses(passData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (passId: string) => {
    try {
      await passService.purchasePass(passId);
      alert('Pass purchased successfully! 🎉');
      onPassPurchased?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Purchase failed');
    }
  };

  const handleEdit = (pass: PassData) => {
    // TODO: Open edit modal
    console.log('Edit pass:', pass);
  };

  const handleDelete = async (passId: string) => {
    if (!confirm('Are you sure you want to delete this pass?')) return;
    
    try {
      await passService.deletePass(passId);
      alert('Pass deleted successfully');
      loadPasses(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
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
          onClick={loadPasses}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No passes available</p>
        {isManager && (
          <p className="text-gray-500 text-sm mt-2">Create your first pass to get started</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isManager ? 'Manage Passes' : 'Available Passes'}
        </h2>
        <p className="text-gray-600">
          {isManager 
            ? 'Create, edit, and manage yoga passes' 
            : 'Choose a pass that fits your yoga journey'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {passes.map((pass) => (
          <PassCard
            key={pass.passId}
            pass={pass}
            onPurchase={isManager ? undefined : handlePurchase}
            isManager={isManager}
            onEdit={isManager ? handleEdit : undefined}
            onDelete={isManager ? handleDelete : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default PassList;
