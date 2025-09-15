import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';

interface User {
  id: string;
  jamaatID: string | null;
  name: string | null;
  surname: string | null;
  jamaat: string | null;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const [error, setError] = useState<string>('');

  const fetchUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      console.log('User role:', userData);

      if (userError) {
        console.error('Error fetching user role:', userError);
        setError('Error checking admin permissions');
        return;
      }

      if (userData?.role !== 'admin') {
        console.error('User is not admin:', userData?.role);
        navigate('/');
        return;
      }

      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('users')
        .select('id, jamaatID, name, surname, jamaat, email, role')
        .order('jamaat', { ascending: true })
        .order('name', { ascending: true });

      console.log('Users data:', data);
      console.log('Users error:', error);

      if (error) {
        console.error('Error fetching users:', error);
        setError('Error loading users list');
        return;
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeString = (value: string | null | undefined): string => {
    return value?.toString() || '';
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      safeString(user.jamaatID).toLowerCase().includes(searchLower) ||
      safeString(user.name).toLowerCase().includes(searchLower) ||
      safeString(user.surname).toLowerCase().includes(searchLower) ||
      safeString(user.jamaat).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Mitgliederliste
              </h1>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jamaat ID
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jamaat
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.jamaatID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name} {user.surname}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.jamaat}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Keine Mitglieder gefunden
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
