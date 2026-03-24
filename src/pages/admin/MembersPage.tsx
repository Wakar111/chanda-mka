import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

interface User {
  id: string;
  jamaatID: string | null;
  name: string | null;
  surname: string | null;
  jamaat: string | null;
  email: string;
  phone: number;
  role: string;
  musi: boolean;
  gender: string;
}

export default function MembersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const [error, setError] = useState<string>('');

  const fetchUsers = async () => {
    setError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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

      const { data, error } = await supabase
        .from('users')
        .select('id, jamaatID, name, surname, jamaat, email, role, phone, musi, gender')
        .order('jamaat', { ascending: true })
        .order('name', { ascending: true });

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
    const matchesSearch = (
      safeString(user.jamaatID).toLowerCase().includes(searchLower) ||
      safeString(user.name).toLowerCase().includes(searchLower) ||
      safeString(user.surname).toLowerCase().includes(searchLower) ||
      safeString(user.jamaat).toLowerCase().includes(searchLower)
    );
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  Liste der Users
                </h1>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  User
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Admin
                </button>
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
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jamaat ID
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jamaat
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Musi
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-3 md:px-6 py-2 md:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                          <Link 
                            to={`/admin/charity-promise?jamaatID=${user.jamaatID}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {user.jamaatID}
                          </Link>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.name} {user.surname}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.jamaat}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.phone}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.musi ? 'Ja' : 'Nein'}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.role}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {user.gender}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                          <Link 
                            to={`/admin/edit-user/${user.id}`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Benutzer bearbeiten"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
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
    </AdminLayout>
  );
}
