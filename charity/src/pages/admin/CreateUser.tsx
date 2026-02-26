import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { calculateAge } from '../../utils/dateUtils';

// Function to generate a random password
const generatePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

interface CreateUserForm {
  email: string;
  password: string;
  jamaatID: string;
  jamaat: string;
  name: string;
  surname: string;
  date_of_birth: string;
  musi: boolean;
  phone: string;
  address: string;
  profession: string;
  role: 'admin' | 'user';
}

export default function CreateUser() {
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    jamaatID: '',
    jamaat: '',
    name: '',
    surname: '',
    date_of_birth: '',
    musi: false,
    phone: '',
    address: '',
    profession: '',
    role: 'user'
  });
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);

  const validateForm = (): { isValid: boolean; message: string } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }

    const normalizedPhone = formData.phone.replace(/\s+/g, '');
    const phoneRegex = /^(\+49|0)[1-9][0-9]{8,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return { isValid: false, message: 'Please enter a valid German phone number (e.g., 017854585 or +4912345667)' };
    }

    const today = new Date();
    const birthDate = new Date(formData.date_of_birth);
    if (birthDate >= today) {
      return { isValid: false, message: 'Date of birth cannot be in the future' };
    }

    return { isValid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const validation = validateForm();
    if (!validation.isValid) {
      setStatus({ type: 'error', message: validation.message });
      return;
    }

    try {
      // Generate a random password
      const generatedPassword = generatePassword(12);
      
      // Create auth user with auto-generated password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: generatedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name: formData.name,
            surname: formData.surname,
            generated_password: generatedPassword
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Create user profile
      // Convert phone string to number for int8 database field
      const phoneNumber = formData.phone ? parseInt(formData.phone.replace(/\s+/g, ''), 10) : null;
      
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            jamaatID: formData.jamaatID,
            jamaat: formData.jamaat,
            name: formData.name,
            surname: formData.surname,
            date_of_birth: formData.date_of_birth,
            age: calculateAge(formData.date_of_birth),
            musi: formData.musi,
            phone: phoneNumber,
            address: formData.address,
            profession: formData.profession,
            role: formData.role
          }
        ]);

      if (profileError) {
        // If profile creation fails, try to delete the auth user to avoid orphaned accounts
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        console.error('Error sending password reset email:', resetError);
        // Don't fail the whole operation if email fails
      }

      setStatus({ 
        type: 'success', 
        message: `Benutzer erfolgreich erstellt! Eine E-Mail zum Festlegen des Passworts wurde an ${formData.email} gesendet.` 
      });
      setFormData({
        email: '',
        password: '',
        jamaatID: '',
        jamaat: '',
        name: '',
        surname: '',
        date_of_birth: '',
        musi: false,
        phone: '',
        address: '',
        profession: '',
        role: 'user'
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle rate limit error specifically
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        setStatus({ 
          type: 'error', 
          message: 'Zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.' 
        });
      } else if (error?.message?.includes('already registered')) {
        setStatus({ 
          type: 'error', 
          message: 'Diese E-Mail-Adresse ist bereits registriert.' 
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: 'Fehler beim Erstellen des Benutzers. Bitte versuchen Sie es erneut.' 
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'musi') {
      setFormData(prev => ({ ...prev, [name]: value === 'ja' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Create New User
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
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">Ein Passwort wird automatisch generiert und per E-Mail gesendet</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jamaat ID
                </label>
                <input
                  type="text"
                  name="jamaatID"
                  value={formData.jamaatID}
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
                  value={formData.jamaat}
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
                    value={formData.name}
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
                    value={formData.surname}
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
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">Date of birth cannot be in the future</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Musi
                  </label>
                  <select
                    name="musi"
                    value={formData.musi ? 'ja' : 'nein'}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="nein">Nein</option>
                    <option value="ja">Ja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="017854585678"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">Enter phone number (e.g., 017854585678 or +4917854585678)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profession
                </label>
                <select
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="Student">Student</option>
                  <option value="Angestellter">Angestellter</option>
                  <option value="Kein Arbeit">Kein Arbeit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
