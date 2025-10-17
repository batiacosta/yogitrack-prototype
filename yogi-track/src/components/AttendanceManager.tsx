import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

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
  registeredUsers: Array<{
    userId: string;
    registrationDate: string;
    userPassId: string;
    userDetails: {
      firstname: string;
      lastname: string;
      email: string;
    };
  }>;
  capacity: number;
}

const AttendanceManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendees, setAttendees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load instructor's classes
  useEffect(() => {
    loadInstructorClasses();
  }, []);

  const loadInstructorClasses = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/class/instructor/my-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendeeToggle = (userId: string) => {
    setAttendees(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const submitAttendance = async () => {
    if (!selectedClass || attendees.length === 0) {
      setMessage('Please select a class and mark at least one attendee');
      return;
    }

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const attendeesList = attendees.map(userId => ({ userId }));
      
      const response = await fetch(`${window.location.origin}/api/class/attendance/${selectedClass.classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          attendees: attendeesList
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      const result = await response.json();
      setMessage(`✅ Attendance marked successfully! ${result.attendeesCount} students attended.`);
      setAttendees([]);
      
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Class Attendance</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass?.classId || ''}
            onChange={(e) => {
              const classData = classes.find(c => c.classId === e.target.value);
              setSelectedClass(classData || null);
              setAttendees([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Choose a class...</option>
            {classes.map((classData) => (
              <option key={classData.classId} value={classData.classId}>
                {classData.className} - {classData.classType}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Registered Students */}
        {selectedClass && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Registered Students ({selectedClass.registeredUsers.length})
            </h3>
            
            {selectedClass.registeredUsers.length === 0 ? (
              <p className="text-gray-500 italic">No students registered for this class</p>
            ) : (
              <div className="space-y-2">
                {selectedClass.registeredUsers.map((registration) => (
                  <label
                    key={registration.userId}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={attendees.includes(registration.userId)}
                      onChange={() => handleAttendeeToggle(registration.userId)}
                      className="mr-3 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {registration.userDetails?.firstname} {registration.userDetails?.lastname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.userDetails?.email}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Registered: {new Date(registration.registrationDate).toLocaleDateString()}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {selectedClass && selectedClass.registeredUsers.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={submitAttendance}
              disabled={isLoading || attendees.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Marking...
                </div>
              ) : (
                `Mark Attendance (${attendees.length} selected)`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Class Summary */}
      {selectedClass && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Class Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Class Name:</span>
              <span className="ml-2 text-gray-900">{selectedClass.className}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-900">{selectedClass.classType}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Capacity:</span>
              <span className="ml-2 text-gray-900">{selectedClass.capacity} students</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Registered:</span>
              <span className="ml-2 text-gray-900">{selectedClass.registeredUsers.length} students</span>
            </div>
          </div>
          {selectedClass.description && (
            <div className="mt-3">
              <span className="font-medium text-gray-700">Description:</span>
              <p className="ml-2 text-gray-900">{selectedClass.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;