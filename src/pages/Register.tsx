import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import mkaLogo from '/mka-logo.png';

export default function Register() {
  const [step, setStep] = useState<'verify' | 'password'>('verify');
  const [jamaatID, setJamaatID] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert jamaatID to integer
      const jamaatIDNumber = parseInt(jamaatID, 10);
      
      if (isNaN(jamaatIDNumber)) {
        setError('Bitte geben Sie eine gültige Jamaat ID ein.');
        setLoading(false);
        return;
      }

      // Check if user exists in database with matching jamaatID and email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('jamaatID', jamaatIDNumber)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (userError || !user) {
        setError('Jamaat ID oder E-Mail-Adresse nicht gefunden. Bitte überprüfen Sie Ihre Eingabe oder kontaktieren Sie Ihren Administrator.');
        setLoading(false);
        return;
      }

      // Store user data and proceed to password step
      // We'll check if auth account exists during the actual registration
      setUserData(user);
      setStep('password');
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);

    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            name: userData.name,
            surname: userData.surname,
            jamaatID: userData.jamaatID
          }
        }
      });

      if (authError) {
        // Check if error is because user already exists
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('Sie haben bereits einen Account. Bitte verwenden Sie die Login-Seite.');
        } else {
          setError(`Registrierung fehlgeschlagen: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        setLoading(false);
        return;
      }

      // Delete old row and insert new one with correct auth user ID
      // This is necessary because id is the primary key with NOT NULL constraint
      
      // First, delete the old row
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('jamaatID', userData.jamaatID)
        .eq('email', email.toLowerCase().trim());

      if (deleteError) {
        console.error('Delete error:', deleteError);
        setError(`Fehler beim Löschen der alten Benutzerdaten: ${deleteError.message}`);
        setLoading(false);
        return;
      }

      // Then insert new row with auth user id
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          surname: userData.surname,
          jamaatID: userData.jamaatID,
          jamaat: userData.jamaat,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
          age: userData.age,
          address: userData.address,
          profession: userData.profession,
          gender: userData.gender,
          musi: userData.musi,
          role: userData.role
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Fehler beim Erstellen der Benutzerdaten: ${insertError.message}`);
        setLoading(false);
        return;
      }

      if (!insertData || insertData.length === 0) {
        console.error('No rows inserted');
        setError('Fehler: Benutzerdaten konnten nicht erstellt werden.');
        setLoading(false);
        return;
      }

      // Show success message and redirect to login after 2 seconds
      setSuccess(true);
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
            Account Registrierung
          </h2>
          <p className="text-center text-gray-600 text-sm px-4">
            {step === 'verify' 
              ? 'Geben Sie Ihre Jamaat-ID und E-Mail-Adresse ein, um Ihren Account zu aktivieren.'
              : 'Erstellen Sie ein sicheres Passwort für Ihren Account.'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-green-900 font-semibold">Registrierung erfolgreich!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Sie werden in Kürze zur Login-Seite weitergeleitet...
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'verify' ? (
          <form className="space-y-5" onSubmit={handleVerify}>
            {/* Jamaat ID */}
            <div>
              <label
                htmlFor="jamaatID"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Jamaat ID
              </label>
              <input
                id="jamaatID"
                type="text"
                placeholder="Ihre Jamaat ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                value={jamaatID}
                onChange={(e) => setJamaatID(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                placeholder="ihre.email@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Verwenden Sie die E-Mail-Adresse, die Ihr Administrator hinterlegt hat.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Überprüfe...' : 'Weiter'}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* User Info Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Name:</strong> {userData?.name} {userData?.surname}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Jamaat ID:</strong> {userData?.jamaatID}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {email}
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mindestens 8 Zeichen"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
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
                placeholder="Passwort wiederholen"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              >
                Zurück
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Registriere...' : 'Registrieren'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:underline"
          >
            Bereits registriert? Zum Login
          </button>
        </div>
      </div>
    </div>
  );
}
