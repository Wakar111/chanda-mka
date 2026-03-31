// ResetPassword.tsx is a page where user or admin can set initial password after registration or forgot password

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import mkaLogo from '/mka-logo.png';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user came from password reset email
    // Supabase sends the token in the URL hash or as query params
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    
    if (!type || type !== 'recovery') {
      setStatus({ type: 'error', message: 'Ungültiger oder abgelaufener Link. Bitte fordern Sie einen neuen Link an.' });
    } else if (!accessToken) {
      setStatus({ type: 'error', message: 'Kein gültiger Token gefunden. Bitte fordern Sie einen neuen Link an.' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Validation
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Passwort muss mindestens 6 Zeichen lang sein' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwörter stimmen nicht überein' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setStatus({ type: 'success', message: 'Passwort erfolgreich festgelegt! Sie werden zum Login weitergeleitet...' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setStatus({ type: 'error', message: 'Fehler beim Festlegen des Passworts. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={mkaLogo} alt="MKA Logo" className="h-20 w-auto mb-4" />
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
            Passwort festlegen
          </h2>
          <p className="text-center text-gray-600 text-sm px-4">
            Bitte legen Sie Ihr neues Passwort fest
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Neues Passwort
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Passwort wiederholen"
            />
          </div>

          {/* Status Messages */}
          {status && (
            <p className={`mt-2 text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {status.message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort festlegen'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="block w-full text-sm text-blue-600 hover:underline"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    </div>
  );
}
