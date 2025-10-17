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
  capacity: number;
  isActive: boolean;
}

interface InstructorData {
  instructorId: string;
  userId: string;
  firstname: string;
  lastname: string;
}

interface CreateClassData {
  className: string;
  instructorId?: string; // Optional for instructors (they use their own ID)
  classType: string;
  description: string;
  daytime: Array<{
    day: string;
    time: string;
    duration: number;
  }>;
  capacity?: number;
}

interface ClassManagerProps {
  userType: string;
}

const ClassManager: React.FC<ClassManagerProps> = ({ userType }) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState<CreateClassData>({
    className: '',
    classType: '',
    description: '',
    daytime: [],
    capacity: 20
  });

  const isManager = userType === 'Manager';

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoading(true);
        const token = authService.getToken();
        const endpoint = isManager 
          ? `${window.location.origin}/api/class/list`
          : `${window.location.origin}/api/class/instructor/my-classes`;
        
        const response = await fetch(endpoint, {
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

    const loadInstructors = async () => {
      try {
        const token = authService.getToken();
        const response = await fetch(`${window.location.origin}/api/instructor/getInstructorIds`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load instructors');
        }

        const data = await response.json();
        setInstructors(data);
      } catch (err) {
        console.error('Failed to load instructors:', err);
      }
    };

    const loadData = async () => {
      await loadClasses();
      if (isManager) {
        await loadInstructors();
      }
    };
    
    loadData();
  }, [isManager]);


  const handleCreateClass = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Debug logging
      console.log('Creating class with formData:', formData);
      console.log('User type:', userType);
      
      const response = await fetch(`${window.location.origin}/api/class/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        
        // Handle scheduling conflicts specifically
        if (response.status === 409) {
          throw new Error(`⚠️ Scheduling Conflict: ${errorData.message}`);
        }
        
        throw new Error(errorData.message || 'Failed to create class');
      }

      const result = await response.json();
      const successMessage = `✅ Class created successfully! Class ID: ${result.classId}`;
      
      // Show success in modal briefly before closing
      setModalMessage(successMessage);
      setMessage(successMessage);
      
      // Close modal and refresh after showing success
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        resetForm();
        window.location.reload(); // Refresh to update class list
      }, 2000);
    } catch (err) {
      console.error('Create class error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create class';
      
      // Show error in modal for immediate visibility
      setModalMessage(errorMessage);
      
      // Also set the main message for consistency
      setMessage(errorMessage);
      
      // Auto-clear messages after 5 seconds for conflicts, 3 seconds for other errors
      const clearTime = errorMessage.includes('⚠️') ? 5000 : 3000;
      setTimeout(() => {
        setModalMessage('');
        setMessage('');
      }, clearTime);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = async () => {
    if (!editingClass) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/class/update/${editingClass.classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update class');
      }

      setMessage('✅ Class updated successfully!');
      setEditingClass(null);
      setShowCreateForm(false);
      resetForm();
      window.location.reload(); // Refresh to update class list
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/class/delete/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete class');
      }

      setMessage('✅ Class deleted successfully!');
      window.location.reload(); // Refresh to update class list
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: '',
      classType: '',
      description: '',
      daytime: [],
      capacity: 20
    });
  };

  const openCreateForm = () => {
    resetForm();
    setEditingClass(null);
    setModalMessage(''); // Clear any previous modal messages
    setShowCreateForm(true);
  };

  const openEditForm = (classData: ClassData) => {
    setFormData({
      className: classData.className,
      instructorId: classData.instructorId,
      classType: classData.classType,
      description: classData.description,
      daytime: classData.daytime,
      capacity: classData.capacity
    });
    setEditingClass(classData);
    setShowCreateForm(true);
  };

  const addDayTime = () => {
    setFormData(prev => ({
      ...prev,
      daytime: [...prev.daytime, { day: 'Monday', time: '09:00', duration: 60 }]
    }));
  };

  const removeDayTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      daytime: prev.daytime.filter((_, i) => i !== index)
    }));
  };

  const updateDayTime = (index: number, field: 'day' | 'time' | 'duration', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      daytime: prev.daytime.map((dt, i) => 
        i === index ? { ...dt, [field]: value } : dt
      )
    }));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isManager ? '🧘‍♀️ Manage All Classes' : '📚 My Classes'}
        </h2>
        <button
          onClick={openCreateForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          + Create New Class
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-700 border border-green-200'
            : message.includes('⚠️')
            ? 'bg-orange-100 text-orange-700 border border-orange-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Classes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classData) => (
          <div key={classData.classId} className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{classData.className}</h3>
                <span className="text-xs text-gray-500">ID: {classData.classId}</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div><strong>Type:</strong> {classData.classType}</div>
                <div><strong>Instructor:</strong> {classData.instructorId}</div>
                <div><strong>Capacity:</strong> {classData.capacity} students</div>
                <div><strong>Description:</strong> {classData.description}</div>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <strong className="text-sm text-gray-700">Schedule:</strong>
                <div className="mt-1">
                  {classData.daytime.map((dt, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {dt.day}s at {dt.time} ({dt.duration} min)
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditForm(classData)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClass(classData.classId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No classes found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first class to get started</p>
        </div>
      )}

      {/* Create/Edit Class Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Morning Hatha Yoga"
                  required
                />
              </div>

              {/* Instructor Selection (Manager only) */}
              {isManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor *
                  </label>
                  <select
                    value={formData.instructorId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select an instructor...</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.instructorId} value={instructor.instructorId}>
                        {instructor.firstname} {instructor.lastname} ({instructor.instructorId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Type *
                </label>
                <select
                  value={formData.classType}
                  onChange={(e) => setFormData(prev => ({ ...prev, classType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select class type...</option>
                  <option value="Hatha">Hatha</option>
                  <option value="Vinyasa">Vinyasa</option>
                  <option value="Ashtanga">Ashtanga</option>
                  <option value="Yin">Yin</option>
                  <option value="Restorative">Restorative</option>
                  <option value="Hot Yoga">Hot Yoga</option>
                  <option value="Power Yoga">Power Yoga</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="Brief description of the class..."
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Schedule */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Schedule *
                  </label>
                  <button
                    onClick={addDayTime}
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1 px-2 rounded"
                  >
                    + Add Time
                  </button>
                </div>
                
                {formData.daytime.map((dt, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <select
                      value={dt.day}
                      onChange={(e) => updateDayTime(index, 'day', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={dt.time}
                      onChange={(e) => updateDayTime(index, 'time', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <select
                      value={dt.duration}
                      onChange={(e) => updateDayTime(index, 'duration', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                    </select>
                    <button
                      onClick={() => removeDayTime(index)}
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {formData.daytime.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Click "Add Time" to schedule class times</p>
                )}
              </div>

              {/* Modal Message Display */}
              {modalMessage && (
                <div className={`p-3 rounded-lg mb-4 ${
                  modalMessage.includes('✅') 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : modalMessage.includes('⚠️')
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
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
                    setModalMessage(''); // Clear modal message when closing
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={editingClass ? handleEditClass : handleCreateClass}
                  disabled={isLoading || !formData.className || !formData.classType || formData.daytime.length === 0 || (isManager && !formData.instructorId)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingClass ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingClass ? 'Update Class' : 'Create Class'
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

export default ClassManager;
