// ChangePassword.tsx is when a user or admin wants to change his password while he is logged in

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Validation
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwörter stimmen nicht überein' });
      return;
    }

    if (currentPassword === newPassword) {
      setStatus({ type: 'error', message: 'Neues Passwort muss sich vom aktuellen Passwort unterscheiden' });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('Kein Benutzer angemeldet');
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setStatus({ type: 'error', message: 'Aktuelles Passwort ist falsch' });
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setStatus({ 
        type: 'success', 
        message: 'Passwort erfolgreich geändert! Sie werden zum Profil weitergeleitet...' 
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to profile after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Fehler beim Ändern des Passworts. Bitte versuchen Sie es erneut.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Passwort ändern</h1>
            <p className="text-gray-600">Geben Sie Ihr aktuelles und neues Passwort ein</p>
          </div>

          {status && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                status.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Aktuelles Passwort eingeben"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Passwort wiederholen"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Wird geändert...' : 'Passwort ändern'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/profile')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Zurück zum Profil
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
