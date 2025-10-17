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
  preferredContact: string;
  createdAt: string;
}

interface CreateUserData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  preferredContact: string;
}

const ClientManager: React.FC = () => {
  const [clients, setClients] = useState<UserData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [formData, setFormData] = useState<CreateUserData>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    preferredContact: 'email'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${window.location.origin}/api/user/type/User`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const clientUsers = await response.json();
        setClients(clientUsers);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
      setMessage('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      // Generate a secure random password
      const tempPassword = generateSecurePassword();
      
      const response = await fetch(`${window.location.origin}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          userType: 'User',
          password: tempPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create client');
      }

      const result = await response.json();
      setGeneratedPassword(tempPassword);
      setModalMessage(`✅ Client created successfully!`);
      setMessage(`✅ Client created successfully! ID: ${result.userId}`);
      
      // Don't auto-close so manager can copy the password
      loadClients();
    } catch (err) {
      console.error('Create client error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
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

  const handleEditClient = async () => {
    if (!editingClient) return;

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/user/update/${editingClient.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update client');
      }

      setModalMessage('✅ Client updated successfully!');
      setMessage('✅ Client updated successfully!');
      
      setTimeout(() => {
        setShowCreateForm(false);
        setModalMessage('');
        setEditingClient(null);
        resetForm();
        loadClients();
      }, 2000);
    } catch (err) {
      console.error('Update client error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
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

  const handleDeleteClient = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(`${window.location.origin}/api/user/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete client');
      }

      setMessage('✅ Client deleted successfully!');
      loadClients();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Delete client error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to delete client');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      address: '',
      preferredContact: 'email'
    });
    setGeneratedPassword('');
  };

  const openCreateForm = () => {
    resetForm();
    setEditingClient(null);
    setModalMessage('');
    setShowCreateForm(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('📋 Password copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    }).catch(() => {
      setMessage('❌ Failed to copy password');
      setTimeout(() => setMessage(''), 2000);
    });
  };

  const closeModal = () => {
    setShowCreateForm(false);
    setModalMessage('');
    setEditingClient(null);
    resetForm();
  };

  const openEditForm = (client: UserData) => {
    setFormData({
      firstname: client.firstname,
      lastname: client.lastname,
      email: client.email,
      phone: client.phone,
      address: client.address,
      preferredContact: client.preferredContact
    });
    setEditingClient(client);
    setModalMessage('');
    setShowCreateForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Clients</h2>
          <p className="text-gray-600">Create, view, edit, and manage client accounts</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          + Add Client
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

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.userId} className="bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {client.firstname} {client.lastname}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {client.userId}</p>
                </div>
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Client
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div><strong>Email:</strong> {client.email}</div>
                <div><strong>Phone:</strong> {client.phone}</div>
                <div><strong>Address:</strong> {client.address}</div>
                <div><strong>Preferred Contact:</strong> {client.preferredContact}</div>
                <div><strong>Member Since:</strong> {new Date(client.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => openEditForm(client)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Client"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClient(client.userId)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Client"
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

      {clients.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No clients found. Create your first client!</p>
        </div>
      )}

      {/* Create/Edit Client Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>

              {/* First Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  required
                />
              </div>

              {/* Preferred Contact */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              {/* Modal Message Display */}
              {modalMessage && (
                <div className={`p-3 rounded-lg mb-4 ${
                  modalMessage.includes('✅') 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {generatedPassword ? (
                    <div>
                      <div className="font-medium mb-2">✅ Client created successfully!</div>
                      <div className="bg-white p-3 rounded border mb-3">
                        <div className="mb-2"><strong>📧 Email:</strong> {formData.email}</div>
                        <div className="mb-2 flex items-center justify-between">
                          <span><strong>🔑 Temporary Password:</strong></span>
                          <button
                            onClick={() => copyToClipboard(generatedPassword)}
                            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            title="Copy password"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                          {generatedPassword}
                        </div>
                      </div>
                      <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        ⚠️ <strong>IMPORTANT:</strong> Please share these credentials securely with the client. They should change their password after first login.
                      </div>
                    </div>
                  ) : (
                    modalMessage
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {generatedPassword ? 'Close' : 'Cancel'}
                </button>
                {!generatedPassword && (
                  <button
                    onClick={editingClient ? handleEditClient : handleCreateClient}
                    disabled={isLoading || !formData.firstname || !formData.lastname || !formData.email}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {isLoading 
                      ? (editingClient ? 'Updating...' : 'Creating...') 
                      : (editingClient ? 'Update Client' : 'Create Client')
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
