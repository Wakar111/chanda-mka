import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface User {
  id: string;
  jamaatID: string;
  full_name: string;
  email: string;
}

interface CharityPromise {
  id: string;
  user_id: string;
  name: string;
  promise: number;
  spende_ends: string;
}

export default function CharityPromise() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    promise: '',
    spende_ends: ''
  });
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);
  const [userPromises, setUserPromises] = useState<CharityPromise[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPromises(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, jamaatID, full_name, email')
        .eq('role', 'user');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserPromises = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chanda')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserPromises(data || []);
    } catch (error) {
      console.error('Error fetching promises:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!selectedUser) {
      setStatus({ type: 'error', message: 'Please select a user' });
      return;
    }

    try {
      const { error } = await supabase
        .from('chanda')
        .insert([
          {
            user_id: selectedUser,
            name: formData.name,
            promise: parseFloat(formData.promise),
            spende_ends: formData.spende_ends,
            paid_in: 0
          }
        ]);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Charity promise set successfully!' });
      setFormData({ name: '', promise: '', spende_ends: '' });
      fetchUserPromises(selectedUser);
    } catch (error) {
      console.error('Error setting promise:', error);
      setStatus({ type: 'error', message: 'Failed to set promise. Please try again.' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Set Charity Promise
            </h1>

            {status && (
              <div
                className={`mb-4 p-3 rounded ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.jamaatID})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chanda Type
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Chanda Aam, Jalsa Salana"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promise Amount
                </label>
                <input
                  type="number"
                  name="promise"
                  value={formData.promise}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="spende_ends"
                  value={formData.spende_ends}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Promise
              </button>
            </form>
          </div>

          {selectedUser && userPromises.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Current Promises
              </h2>
              <div className="space-y-4">
                {userPromises.map((promise) => (
                  <div
                    key={promise.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {promise.name}
                        </h3>
                        <p className="text-gray-600">
                          Promise: {promise.promise}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Ends: {new Date(promise.spende_ends).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
