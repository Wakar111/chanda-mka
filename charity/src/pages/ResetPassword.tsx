import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

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
    
    console.log('Reset password page loaded');
    console.log('Type:', type);
    console.log('Access token present:', !!accessToken);
    console.log('Full hash:', window.location.hash);
    
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Passwort festlegen</h1>
          <p className="text-gray-600">Bitte legen Sie Ihr neues Passwort fest</p>
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
              Passwort bestätigen
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
            {loading ? 'Wird gespeichert...' : 'Passwort festlegen'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 text-sm block w-full"
          >
            Zurück zum Login
          </button>
          
          {status?.type === 'error' && (
            <div className="text-xs text-gray-600 mt-4 p-3 bg-gray-50 rounded">
              <p className="font-semibold mb-2">Hilfe:</p>
              <p>Wenn der Link abgelaufen ist, bitten Sie den Administrator, einen neuen Benutzer zu erstellen oder kontaktieren Sie den Support.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
