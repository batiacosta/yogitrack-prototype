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

interface ManagerData {
  managerId: string;
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  isActive: boolean;
}

interface FullManagerData {
  managerId: string;
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
    userType: string;
  };
  department: string;
  isActive: boolean;
}

interface CreateManagerData {
  userId: string;
  department: string;
}

interface EditManagerData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  isActive: boolean;
}

const ManagerManager: React.FC = () => {
  const [managers, setManagers] = useState<ManagerData[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingManager, setEditingManager] = useState<FullManagerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState<CreateManagerData>({
    userId: '',
    department: ''
  });

  const [editFormData, setEditFormData] = useState<EditManagerData>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    isActive: true
  });

  useEffect(() => {
    const loadData = async () => {
      await loadManagers();
      await loadAvailableUsers();
    };
    loadData();
  }, []);

  const loadManagers = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/manager/ids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform data to match our interface
        const managerList = data.map((manager: { managerId: string; userId: string; firstname: string; lastname: string }) => ({
          managerId: manager.managerId,
          userId: manager.userId,
          firstname: manager.firstname,
          lastname: manager.lastname,
          email: 'N/A', // Will load on demand if needed
          phone: 'N/A',
          address: 'N/A', 
          department: 'Management', // Default value
          isActive: true // Default value
        }));
        
        setManagers(managerList);
        return managerList;
      }
    } catch (err) {
      console.error('Failed to load managers:', err);
      setMessage('Failed to load managers');
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  const loadData = async () => {
    const managers = await loadManagers();
    await loadAvailableUsers();
    return managers;
  };

  const loadAvailableUsers = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/user/available-for-manager`, {
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

  const handleCreateManager = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/manager/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 409 && errorData.message?.includes('already a manager')) {
          await loadData();
          setModalMessage(`✅ User is already a manager! Refreshing list...`);
          setMessage(`✅ User is already a manager! Refreshing list...`);
          
          setTimeout(() => {
            setShowCreateForm(false);
            setModalMessage('');
            resetForm();
          }, 2000);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to create manager');
      }

      const result = await response.json();
      setModalMessage(`✅ Manager created successfully! ID: ${result.managerId}`);
      setMessage(`✅ Manager created successfully! ID: ${result.managerId}`);
      
      await loadData();
      
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Create manager error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create manager';
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

  const handleEditManager = async () => {
    if (!editingManager) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Update both User data and Manager data
      const userUpdateResponse = await fetch(`${window.location.origin}/api/user/update/${editingManager.userId._id}`, {
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

      // Update Manager-specific data
      const managerUpdateResponse = await fetch(`${window.location.origin}/api/manager/update/${editingManager.managerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          department: editFormData.department,
          isActive: editFormData.isActive
        }),
      });

      if (!managerUpdateResponse.ok) {
        const errorData = await managerUpdateResponse.json();
        throw new Error(errorData.message || 'Failed to update manager data');
      }

      setModalMessage('✅ Manager updated successfully!');
      setMessage('✅ Manager updated successfully!');
      
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        setEditingManager(null);
        resetEditForm();
        loadData();
      }, 2000);
    } catch (err) {
      console.error('Update manager error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update manager';
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

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to delete this manager? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/manager/delete?managerId=${managerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete manager');
      }

      setMessage('✅ Manager deleted successfully!');
      await loadData();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Delete manager error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to delete manager');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      department: ''
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      address: '',
      department: '',
      isActive: true
    });
  };

  const openEditForm = async (manager: ManagerData) => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Get full manager details
      const response = await fetch(`${window.location.origin}/api/manager/get?managerId=${manager.managerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const fullManager: FullManagerData = await response.json();
        
        setEditFormData({
          firstname: fullManager.userId.firstname || '',
          lastname: fullManager.userId.lastname || '',
          email: fullManager.userId.email || '',
          phone: fullManager.userId.phone || '',
          address: fullManager.userId.address || '',
          department: fullManager.department || '',
          isActive: fullManager.isActive
        });
        
        setEditingManager(fullManager);
        setModalMessage('');
        setShowCreateForm(true);
      } else {
        throw new Error('Failed to load manager details');
      }
    } catch (err) {
      console.error('Error loading manager details:', err);
      setMessage('Failed to load manager details');
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

  const departmentOptions = [
    'Management',
    'Operations',
    'Finance',
    'Human Resources',
    'Marketing',
    'Customer Service',
    'Administration'
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Managers</h2>
          <p className="text-gray-600">Create, view, and manage yoga studio managers</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          + Add Manager
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

      {/* Managers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers.map((manager) => (
          <div key={manager.managerId} className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {manager.firstname} {manager.lastname}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {manager.managerId}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  manager.isActive 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {manager.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div><strong>User ID:</strong> {manager.userId}</div>
                <div><strong>Department:</strong> {manager.department}</div>
                <div><strong>Status:</strong> <span className="text-purple-600">Active Manager</span></div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openEditForm(manager)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Manager"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteManager(manager.managerId)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Manager"
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

      {managers.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No managers found. Create your first manager!</p>
        </div>
      )}

      {/* Create/Edit Manager Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingManager ? 'Edit Manager' : 'Add New Manager'}
              </h3>

              {!editingManager && (
                <>
                  {/* User Selection - Only for creating new managers */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select User *
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

              {editingManager && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={editFormData.address}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {/* Department */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={editingManager ? editFormData.department : formData.department}
                  onChange={(e) => editingManager 
                    ? setEditFormData(prev => ({ ...prev, department: e.target.value }))
                    : setFormData(prev => ({ ...prev, department: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select department...</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
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
                    setEditingManager(null);
                    resetEditForm();
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={editingManager ? handleEditManager : handleCreateManager}
                  disabled={isLoading || (!editingManager && (!formData.userId || !formData.department))}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading 
                    ? (editingManager ? 'Updating...' : 'Creating...') 
                    : (editingManager ? 'Update Manager' : 'Create Manager')
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

export default ManagerManager;
