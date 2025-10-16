import { useState, useEffect } from 'react';
import { passService, type PassData, type CreatePassData } from '../services/passService';

interface EditPassModalProps {
  pass: PassData | null;
  isOpen: boolean;
  onClose: () => void;
  onPassUpdated: () => void;
}

const EditPassModal: React.FC<EditPassModalProps> = ({
  pass,
  isOpen,
  onClose,
  onPassUpdated
}) => {
  const [formData, setFormData] = useState<CreatePassData>({
    name: '',
    description: '',
    duration: { value: 1, unit: 'months' },
    sessions: 1,
    price: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when pass changes
  useEffect(() => {
    if (pass) {
      setFormData({
        name: pass.name,
        description: pass.description || '',
        duration: pass.duration,
        sessions: pass.sessions,
        price: pass.price
      });
    }
  }, [pass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass) return;

    setIsLoading(true);
    try {
      await passService.updatePass(pass.passId, formData);
      alert('Pass updated successfully! ✅');
      onPassUpdated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreatePassData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDurationChange = (field: 'value' | 'unit', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      duration: {
        ...prev.duration,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Edit Pass</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pass Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pass Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Bronze Pass"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="Brief description of the pass..."
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration *
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={formData.duration.value}
                onChange={(e) => handleDurationChange('value', parseInt(e.target.value))}
                min="1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <select
                value={formData.duration.unit}
                onChange={(e) => handleDurationChange('unit', e.target.value as 'days' | 'weeks' | 'months' | 'years')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>

          {/* Sessions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Sessions *
            </label>
            <input
              type="number"
              value={formData.sessions}
              onChange={(e) => handleInputChange('sessions', parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., 4"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., 59.99"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                'Update Pass'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPassModal;
