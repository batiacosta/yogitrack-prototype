import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { passService } from '../services/passService';
import type { UserPassData } from '../services/passService';

interface ClassData {
  classId: string;
  className: string;
  instructorId: string;
  classType: string;
  description: string;
  daytime: Array<{
    day: string;
    time: string;
    duration: number;
  }>;
  capacity: number;
  isActive: boolean;
  registeredUsers?: string[];
}

interface ClassSchedulerProps {
  onNeedPass: () => void; // Callback to redirect to pass purchase
}

const ClassScheduler: React.FC<ClassSchedulerProps> = ({ onNeedPass }) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [userPasses, setUserPasses] = useState<UserPassData[]>([]);
  const [selectedPass, setSelectedPass] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load available classes
      const classesResponse = await fetch(`${window.location.origin}/api/class/list`);
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.filter((cls: ClassData) => cls.isActive));
      }
      
      // Load user's active passes
      const activePasses = await passService.getUserActivePasses();
      setUserPasses(activePasses);
      
      if (activePasses.length > 0) {
        setSelectedPass(activePasses[0].userPassId); // Auto-select first active pass
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage('Failed to load class schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleClass = (classData: ClassData) => {
    // Check if user has valid passes
    if (userPasses.length === 0) {
      setMessage('❌ You need an active pass to schedule classes');
      setTimeout(() => {
        onNeedPass(); // Redirect to pass purchase
      }, 2000);
      return;
    }

    setSelectedClass(classData);
    setShowScheduleModal(true);
    setMessage('');
  };

  const confirmSchedule = async () => {
    if (!selectedClass || !selectedPass) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/class/register/${selectedClass.classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userPassId: selectedPass
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule class');
      }

      setMessage(`✅ Successfully scheduled for ${selectedClass.className}!`);
      setShowScheduleModal(false);
      setSelectedClass(null);
      loadData(); // Refresh data
    } catch (err) {
      console.error('Schedule error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to schedule class');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSchedule = (daytime: ClassData['daytime']) => {
    return daytime.map(dt => `${dt.day}s at ${dt.time} (${dt.duration}min)`).join(', ');
  };

  const getAvailableSpots = (classData: ClassData) => {
    const registered = classData.registeredUsers?.length || 0;
    return classData.capacity - registered;
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📅 Schedule a Class</h2>
        <p className="text-gray-600 mt-2">
          Book your spot in available yoga classes
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Pass Status */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Active Passes</h3>
        {userPasses.length > 0 ? (
          <div className="space-y-2">
            {userPasses.map((pass) => {
              const passData = typeof pass.passId === 'object' ? pass.passId : null;
              return (
                <div key={pass.userPassId} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <span className="font-medium text-green-800">
                      {passData?.name || 'Yoga Pass'}
                    </span>
                    <span className="text-sm text-green-600 ml-2">
                      ({pass.sessionsRemaining} sessions remaining)
                    </span>
                  </div>
                  <span className="text-xs text-green-600">
                    Expires: {new Date(pass.expirationDate).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-3">You don't have any active passes</p>
            <button
              onClick={onNeedPass}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              🎫 Purchase a Pass
            </button>
          </div>
        )}
      </div>

      {/* Available Classes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Available Classes</h3>
        
        {classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classData) => {
              const availableSpots = getAvailableSpots(classData);
              const isFull = availableSpots <= 0;
              
              return (
                <div key={classData.classId} className="bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{classData.className}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {availableSpots} spots left
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div><strong>Type:</strong> {classData.classType}</div>
                      <div><strong>Instructor:</strong> {classData.instructorId}</div>
                      <div><strong>Schedule:</strong> {formatSchedule(classData.daytime)}</div>
                      {classData.description && (
                        <div><strong>Description:</strong> {classData.description}</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleScheduleClass(classData)}
                      disabled={isFull || userPasses.length === 0}
                      className={`w-full font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                        isFull 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : userPasses.length === 0
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isFull 
                        ? '🚫 Class Full' 
                        : userPasses.length === 0 
                        ? '🎫 Need Pass' 
                        : '📝 Schedule Class'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg border border-gray-200">
            <p className="text-gray-600 text-lg">No classes available at the moment</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new classes</p>
          </div>
        )}
      </div>

      {/* Schedule Confirmation Modal */}
      {showScheduleModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Confirm Booking</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {/* Class Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedClass.className}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Type:</strong> {selectedClass.classType}</div>
                    <div><strong>Schedule:</strong> {formatSchedule(selectedClass.daytime)}</div>
                    <div><strong>Instructor:</strong> {selectedClass.instructorId}</div>
                  </div>
                </div>

                {/* Pass Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pass to Use:
                  </label>
                  <select
                    value={selectedPass}
                    onChange={(e) => setSelectedPass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {userPasses.map((pass) => {
                      const passData = typeof pass.passId === 'object' ? pass.passId : null;
                      return (
                        <option key={pass.userPassId} value={pass.userPassId}>
                          {passData?.name || 'Yoga Pass'} ({pass.sessionsRemaining} sessions left)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ This will use 1 session from your selected pass
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSchedule}
                  disabled={isLoading || !selectedPass}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking...
                    </div>
                  ) : (
                    '✅ Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassScheduler;