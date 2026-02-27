import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { calculateAge } from '../../utils/dateUtils';

interface UserData {
  id: string;
  email: string;
  jamaatID: string;
  jamaat: string;
  name: string;
  surname: string;
  date_of_birth: string;
  phone: string;
  address: string;
  profession: string;
  role: 'admin' | 'user';
  musi: boolean;
  gender: 'male' | 'female' | '';
}

export default function EditUser() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userData, setUserData] = useState<UserData>({
    id: '',
    email: '',
    jamaatID: '',
    jamaat: '',
    name: '',
    surname: '',
    date_of_birth: '',
    phone: '',
    address: '',
    profession: '',
    role: 'user',
    musi: false,
    gender: 'male'
  });

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Format date_of_birth to YYYY-MM-DD for date input and ensure all fields are strings
        const formattedData = {
          ...data,
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
          phone: data.phone ? String(data.phone) : '', // Convert int8 to string
          address: data.address || '',
          profession: data.profession || '',
          jamaatID: data.jamaatID || '',
          musi: data.musi || false,
          jamaat: data.jamaat || '',
          name: data.name || '',
          surname: data.surname || '',
          email: data.email || '',
          gender: data.gender || 'male'
        };
        setUserData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setStatus({ type: 'error', message: 'Fehler beim Laden des Benutzers' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): { isValid: boolean; message: string } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(userData.email)) {
      return { isValid: false, message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' };
    }

    if (!userData.phone || typeof userData.phone !== 'string') {
      return { isValid: false, message: 'Bitte geben Sie eine Telefonnummer ein' };
    }

    const normalizedPhone = String(userData.phone).replace(/\s+/g, '');
    const phoneRegex = /^(\+49[1-9][0-9]{9,13}|0[1-9][0-9]{8,14})$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return { isValid: false, message: 'Bitte geben Sie eine gültige deutsche Telefonnummer ein (z.B. 0175... oder +49175...)' };
    }

    const today = new Date();
    const birthDate = new Date(userData.date_of_birth);
    if (birthDate >= today) {
      return { isValid: false, message: 'Geburtsdatum darf nicht in der Zukunft liegen' };
    }

    return { isValid: true, message: '' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Convert 'true'/'false' string to boolean for musi field
    const processedValue = name === 'musi' ? value === 'true' : value;
    setUserData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const validation = validateForm();
    if (!validation.isValid) {
      setStatus({ type: 'error', message: validation.message });
      return;
    }

    setSaving(true);

    try {
      // Keep phone as text to preserve leading zeros and +49 format
      const phoneText = userData.phone ? userData.phone.replace(/\s+/g, '') : null;
      
      const { error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          jamaatID: userData.jamaatID,
          jamaat: userData.jamaat,
          name: userData.name,
          surname: userData.surname,
          date_of_birth: userData.date_of_birth,
          age: calculateAge(userData.date_of_birth),
          phone: phoneText,
          address: userData.address,
          profession: userData.profession,
          role: userData.role,
          musi: userData.musi,
          gender: userData.gender || null
        })
        .eq('id', userId);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Benutzer erfolgreich aktualisiert' });
    } catch (error) {
      console.error('Error updating user:', error);
      setStatus({ type: 'error', message: 'Fehler beim Aktualisieren des Benutzers' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);

    try {
      // Step 1: Delete user's payments first
      const { data: promises } = await supabase
        .from('promises')
        .select('id')
        .eq('user_id', userId);

      if (promises && promises.length > 0) {
        const promiseIds = promises.map(p => p.id);
        const { error: paymentsError } = await supabase
          .from('payments')
          .delete()
          .in('promise_id', promiseIds);
        
        if (paymentsError) throw paymentsError;
      }

      // Step 2: Delete user's promises
      const { error: promisesError } = await supabase
        .from('promises')
        .delete()
        .eq('user_id', userId);
      
      if (promisesError) throw promisesError;

      // Step 3: Delete user from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) throw userError;

      // Step 4: Delete user from auth (authentication system)
      // Call edge function to delete auth user (requires service role key)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          console.error('Failed to delete auth user:', await response.text());
          setStatus({ 
            type: 'success', 
            message: 'Benutzer gelöscht. Hinweis: Auth-Daten müssen manuell in Supabase gelöscht werden.' 
          });
        } else {
          setStatus({ 
            type: 'success', 
            message: 'Benutzer erfolgreich gelöscht (inkl. Authentifizierung)' 
          });
        }
      } catch (authError) {
        console.error('Error calling delete-user function:', authError);
        setStatus({ 
          type: 'success', 
          message: 'Benutzer gelöscht. Hinweis: Auth-Daten müssen manuell in Supabase gelöscht werden.' 
        });
      }
      
      // Navigate back to admin dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setStatus({ type: 'error', message: `Fehler beim Löschen: ${error.message || 'Unbekannter Fehler'}` });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Benutzer bearbeiten
              </h1>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Zurück
              </button>
            </div>

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
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jamaat ID
                </label>
                <input
                  type="text"
                  name="jamaatID"
                  value={userData.jamaatID}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jamaat
                </label>
                <input
                  type="text"
                  name="jamaat"
                  value={userData.jamaat}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname
                  </label>
                  <input
                    type="text"
                    name="surname"
                    value={userData.surname}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={userData.date_of_birth}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Musi
                  </label>
                  <select
                    name="musi"
                    value={userData.musi.toString()}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="true">Ja</option>
                    <option value="false">Nein</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    required
                    placeholder="017854585678"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={userData.gender}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profession
                </label>
                <input
                  type="text"
                  name="profession"
                  value={userData.profession}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? 'Speichern...' : 'Änderungen speichern'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="px-6 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  Benutzer löschen
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Benutzer löschen?
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Möchten Sie diesen Benutzer wirklich löschen? Alle zugehörigen Versprechen und Zahlungen werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
