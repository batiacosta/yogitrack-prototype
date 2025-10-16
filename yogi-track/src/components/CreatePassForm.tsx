import { useState } from 'react';
import { passService } from '../services/passService';
import type { CreatePassData } from '../services/passService';

interface CreatePassFormProps {
  onPassCreated: () => void;
  onCancel: () => void;
}

const CreatePassForm: React.FC<CreatePassFormProps> = ({ onPassCreated, onCancel }) => {
  const [formData, setFormData] = useState<CreatePassData>({
    name: '',
    description: '',
    duration: { value: 1, unit: 'months' },
    sessions: 1,
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration.value') {
      setFormData(prev => ({
        ...prev,
        duration: { ...prev.duration, value: parseInt(value) || 1 }
      }));
    } else if (name === 'duration.unit') {
      setFormData(prev => ({
        ...prev,
        duration: { ...prev.duration, unit: value as 'days' | 'weeks' | 'months' | 'years' }
      }));
    } else if (name === 'sessions') {
      setFormData(prev => ({ ...prev, sessions: parseInt(value) || 1 }));
    } else if (name === 'price') {
      setFormData(prev => ({ ...prev, price: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Pass name is required');
      setIsLoading(false);
      return;
    }

    if (formData.sessions < 1) {
      setError('Number of sessions must be at least 1');
      setIsLoading(false);
      return;
    }

    if (formData.price < 0) {
      setError('Price cannot be negative');
      setIsLoading(false);
      return;
    }

    try {
      await passService.createPass(formData);
      onPassCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pass');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-emerald-400 to-amber-400 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Create New Pass</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Pass Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Pass Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Bronze Pass"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brief description of the pass"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="duration.value"
                type="number"
                min="1"
                required
                value={formData.duration.value}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="1"
              />
              <select
                name="duration.unit"
                value={formData.duration.unit}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            <label htmlFor="sessions" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Sessions *
            </label>
            <input
              id="sessions"
              name="sessions"
              type="number"
              min="1"
              required
              value={formData.sessions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="4"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (USD) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="59.99"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Creating...' : 'Create Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePassForm;
