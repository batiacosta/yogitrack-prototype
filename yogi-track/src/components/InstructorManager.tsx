import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface UserData {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  userType: string;
}

interface InstructorData {
  instructorId: string;
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  specializations: string[];
  hireDate: string;
  isActive: boolean;
}

interface CreateInstructorData {
  userId: string;
  specializations: string[];
  hireDate: string;
}

const InstructorManager: React.FC = () => {
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState<CreateInstructorData>({
    userId: '',
    specializations: [],
    hireDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadData = async () => {
      await loadInstructors();
      await loadAvailableUsers();
    };
    loadData();
  }, []);

  const loadInstructors = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/instructor/getInstructorIds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Get full instructor details
        const instructorDetails = await Promise.all(
          data.map(async (instructor: { instructorId: string; userId: string; firstname: string; lastname: string }) => {
            const detailResponse = await fetch(`${window.location.origin}/api/instructor/getInstructor?instructorId=${instructor.instructorId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (detailResponse.ok) {
              const detail = await detailResponse.json();
              return {
                instructorId: detail.instructorId,
                userId: detail.userId._id,
                firstname: detail.userId.firstname,
                lastname: detail.userId.lastname,
                email: detail.userId.email,
                phone: detail.userId.phone,
                address: detail.userId.address,
                specializations: detail.specializations || [],
                hireDate: detail.hireDate,
                isActive: detail.isActive
              };
            }
            return null;
          })
        );
        const validInstructors = instructorDetails.filter(Boolean);
        setInstructors(validInstructors);
        return validInstructors; // Return for use in loadAvailableUsers
      }
    } catch (err) {
      console.error('Failed to load instructors:', err);
      setMessage('Failed to load instructors');
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  const loadData = async () => {
    const instructors = await loadInstructors();
    await loadAvailableUsers();
    return instructors;
  };

  const loadAvailableUsers = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/user/available-for-instructor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateInstructor = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/instructor/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific case where user is already an instructor
        if (response.status === 409 && errorData.message?.includes('already an instructor')) {
          // User was likely created in a previous attempt, refresh data and show success
          await loadData();
          setModalMessage(`✅ User is already an instructor! Refreshing list...`);
          setMessage(`✅ User is already an instructor! Refreshing list...`);
          
          setTimeout(() => {
            setShowCreateForm(false);
            setModalMessage('');
            resetForm();
          }, 2000);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to create instructor');
      }

      const result = await response.json();
      setModalMessage(`✅ Instructor created successfully! ID: ${result.instructorId}`);
      setMessage(`✅ Instructor created successfully! ID: ${result.instructorId}`);
      
      // Refresh data to update instructor list and available users
      await loadData();
      
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Create instructor error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create instructor';
      setModalMessage(errorMessage);
      setMessage(errorMessage);
      
      setTimeout(() => {
        setModalMessage('');
        setMessage('');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    if (!confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/instructor/deleteInstructor?instructorId=${instructorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete instructor');
      }

      setMessage('✅ Instructor deleted successfully!');
      await loadData(); // Refresh both instructors and available users
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Delete instructor error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to delete instructor');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      specializations: [],
      hireDate: new Date().toISOString().split('T')[0]
    });
  };

  const openCreateForm = () => {
    resetForm();
    setModalMessage('');
    setShowCreateForm(true);
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specializations: prev.specializations.filter(s => s !== specialization)
      }));
    }
  };

  const specializationOptions = [
    'Hatha Yoga',
    'Vinyasa Yoga',
    'Ashtanga Yoga',
    'Bikram Yoga',
    'Yin Yoga',
    'Kundalini Yoga',
    'Restorative Yoga',
    'Power Yoga',
    'Hot Yoga',
    'General'
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Instructors</h2>
          <p className="text-gray-600">Create, view, and manage yoga instructors</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          + Add Instructor
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Instructors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((instructor) => (
          <div key={instructor.instructorId} className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {instructor.firstname} {instructor.lastname}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {instructor.instructorId}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  instructor.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {instructor.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div><strong>Email:</strong> {instructor.email}</div>
                <div><strong>Phone:</strong> {instructor.phone}</div>
                <div><strong>Address:</strong> {instructor.address}</div>
                <div><strong>Hire Date:</strong> {new Date(instructor.hireDate).toLocaleDateString()}</div>
                <div><strong>Specializations:</strong> {instructor.specializations.length > 0 ? instructor.specializations.join(', ') : 'None'}</div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleDeleteInstructor(instructor.instructorId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {instructors.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No instructors found. Create your first instructor!</p>
        </div>
      )}

      {/* Create Instructor Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Instructor
              </h3>

              {/* User Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.firstname} {user.lastname} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hire Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date *
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Specializations */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {specializationOptions.map((spec) => (
                    <label key={spec} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modal Message Display */}
              {modalMessage && (
                <div className={`p-3 rounded-lg mb-4 ${
                  modalMessage.includes('✅') 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {modalMessage}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setModalMessage('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInstructor}
                  disabled={isLoading || !formData.userId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? 'Creating...' : 'Create Instructor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorManager;
