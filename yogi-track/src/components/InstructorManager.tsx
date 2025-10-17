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

interface FullInstructorData {
  instructorId: string;
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
    userType: string;
  };
  classIds: string[];
  specializations: string[];
  hireDate: string;
  isActive: boolean;
}

interface CreateInstructorData {
  userId: string;
  specializations: string[];
  hireDate: string;
}

interface EditInstructorData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  specializations: string[];
  hireDate: string;
  isActive: boolean;
}

const InstructorManager: React.FC = () => {
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<FullInstructorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState<CreateInstructorData>({
    userId: '',
    specializations: [],
    hireDate: new Date().toISOString().split('T')[0]
  });

  const [editFormData, setEditFormData] = useState<EditInstructorData>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    specializations: [],
    hireDate: '',
    isActive: true
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
        // Use the data directly from getInstructorIds endpoint
        // This includes: instructorId, userId, firstname, lastname
        const instructorList = data.map((instructor: { instructorId: string; userId: string; firstname: string; lastname: string }) => ({
          instructorId: instructor.instructorId,
          userId: instructor.userId,
          firstname: instructor.firstname,
          lastname: instructor.lastname,
          email: 'N/A', // We'll load this on demand if needed
          phone: 'N/A',
          address: 'N/A', 
          specializations: [], // We'll load this on demand if needed
          hireDate: new Date().toISOString(), // Default value
          isActive: true // Default value
        }));
        
        setInstructors(instructorList);
        return instructorList; // Return for use in loadAvailableUsers
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

  const handleEditInstructor = async () => {
    if (!editingInstructor) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Update both User data and Instructor data
      const userUpdateResponse = await fetch(`${window.location.origin}/api/user/update/${editingInstructor.userId._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstname: editFormData.firstname,
          lastname: editFormData.lastname,
          email: editFormData.email,
          phone: editFormData.phone,
          address: editFormData.address
        }),
      });

      if (!userUpdateResponse.ok) {
        const errorData = await userUpdateResponse.json();
        throw new Error(errorData.message || 'Failed to update user data');
      }

      // Update Instructor-specific data
      const instructorUpdateResponse = await fetch(`${window.location.origin}/api/manager/instructor/update/${editingInstructor.instructorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          specializations: editFormData.specializations,
          hireDate: editFormData.hireDate,
          isActive: editFormData.isActive
        }),
      });

      if (!instructorUpdateResponse.ok) {
        const errorData = await instructorUpdateResponse.json();
        throw new Error(errorData.message || 'Failed to update instructor data');
      }

      setModalMessage('✅ Instructor updated successfully!');
      setMessage('✅ Instructor updated successfully!');
      
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        setEditingInstructor(null);
        resetEditForm();
        loadData();
      }, 2000);
    } catch (err) {
      console.error('Update instructor error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update instructor';
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

  const resetForm = () => {
    setFormData({
      userId: '',
      specializations: [],
      hireDate: new Date().toISOString().split('T')[0]
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      address: '',
      specializations: [],
      hireDate: '',
      isActive: true
    });
  };

  const openEditForm = async (instructor: InstructorData) => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Get full instructor details
      const response = await fetch(`${window.location.origin}/api/instructor/getInstructor?instructorId=${instructor.instructorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const fullInstructor: FullInstructorData = await response.json();
        
        setEditFormData({
          firstname: fullInstructor.userId.firstname || '',
          lastname: fullInstructor.userId.lastname || '',
          email: fullInstructor.userId.email || '',
          phone: fullInstructor.userId.phone || '',
          address: fullInstructor.userId.address || '',
          specializations: fullInstructor.specializations || [],
          hireDate: fullInstructor.hireDate ? fullInstructor.hireDate.split('T')[0] : '',
          isActive: fullInstructor.isActive
        });
        
        setEditingInstructor(fullInstructor);
        setModalMessage('');
        setShowCreateForm(true);
      } else {
        throw new Error('Failed to load instructor details');
      }
    } catch (err) {
      console.error('Error loading instructor details:', err);
      setMessage('Failed to load instructor details');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
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

  const handleEditSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setEditFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, specialization]
      }));
    } else {
      setEditFormData(prev => ({
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
          <div key={instructor.instructorId} className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
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

              <div className="space-y-2 text-sm mb-4">
                <div><strong>User ID:</strong> {instructor.userId}</div>
                <div><strong>Status:</strong> <span className="text-green-600">Active Instructor</span></div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openEditForm(instructor)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Instructor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteInstructor(instructor.instructorId)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Instructor"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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

      {/* Create/Edit Instructor Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
              </h3>

              {!editingInstructor && (
                <>
                  {/* User Selection - Only for creating new instructors */}
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
                </>
              )}

              {editingInstructor && (
                <>
                  {/* Edit User Information */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.firstname}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, firstname: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.lastname}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lastname: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      rows={2}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editFormData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {/* Hire Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date *
                </label>
                <input
                  type="date"
                  value={editingInstructor ? editFormData.hireDate : formData.hireDate}
                  onChange={(e) => editingInstructor 
                    ? setEditFormData(prev => ({ ...prev, hireDate: e.target.value }))
                    : setFormData(prev => ({ ...prev, hireDate: e.target.value }))
                  }
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
                        checked={editingInstructor 
                          ? editFormData.specializations.includes(spec)
                          : formData.specializations.includes(spec)
                        }
                        onChange={(e) => editingInstructor
                          ? handleEditSpecializationChange(spec, e.target.checked)
                          : handleSpecializationChange(spec, e.target.checked)
                        }
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
                    setEditingInstructor(null);
                    resetEditForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={editingInstructor ? handleEditInstructor : handleCreateInstructor}
                  disabled={isLoading || (!editingInstructor && !formData.userId)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading 
                    ? (editingInstructor ? 'Updating...' : 'Creating...') 
                    : (editingInstructor ? 'Update Instructor' : 'Create Instructor')
                  }
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
