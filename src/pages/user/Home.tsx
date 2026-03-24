import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ChandaCard from '../../components/ChandaCard';
import LoadingSpinner from '../../components/LoadingSpinner';

interface UserInfo {
  name: string;
  surname: string;
  jamaatID: string;
  jamaat: string;
  role: string;
  musi: boolean;
  gender: string;
}

interface Quote {
  id: string;
  content: string;
  author: string;
  permanent?: boolean;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  promise_id: string;
}

interface ChandaType {
  id: string;
  name: string;
  description: string;
  charity_end?: string;
}

interface Promise {
  id: string;
  user_id: string;
  chanda_type_id: string;
  year: number;
  promise: number;
  spende_ends: string;
  chanda_types: ChandaType;
  payments?: Payment[];
}

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [promises, setPromises] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchUserInfo();
    fetchAvailableYears();
    fetchRandomQuote();
  }, []);

  useEffect(() => {
    fetchChandaData();
  }, [selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('promises')
        .select('year')
        .eq('user_id', session.user.id)
        .order('year', { ascending: false });

      if (error) throw error;

      const years = [...new Set(data?.map(p => p.year) || [])];
      if (!years.includes(currentYear)) {
        years.unshift(currentYear);
      }
      setAvailableYears(years);
    } catch (error) {
      console.error('Error fetching available years:', error);
    }
  };

  const fetchRandomQuote = async () => {
    try {
      // First, try to get a permanent quote
      const { data: permanentQuotes, error: permError } = await supabase
        .from('quotes')
        .select('*')
        .eq('permanent', true)
        .limit(1);

      if (permError) throw permError;

      // If there's a permanent quote, use it
      if (permanentQuotes && permanentQuotes.length > 0) {
        setRandomQuote(permanentQuotes[0]);
        return;
      }

      // Otherwise, get a random quote from non-permanent quotes
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('permanent', false);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setRandomQuote(data[randomIndex]);
      }
    } catch (error) {
      console.error('Error fetching random quote:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('users')
        .select('name, surname, jamaatID, jamaat, role, musi, gender')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUserInfo(data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchChandaData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return;
      }
      
      const { data: promiseData, error: promiseError } = await supabase
        .from('promises')
        .select(`
          *,
          chanda_types!inner(*)
        `)
        .eq('user_id', session.user.id)
        .eq('year', selectedYear);
      
      if (promiseError) {
        console.error('Promise fetch error:', promiseError);
        throw promiseError;
      }
      
      if (!promiseData) {
        console.log('No promise data found');
        return;
      }

      // Fetch payments for each promise
      const promisesWithPayments = await Promise.all(
        promiseData.map(async (promise) => {
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .eq('promise_id', promise.id)
            .order('payment_date', { ascending: false });

          if (paymentsError) {
            console.error('Payments fetch error:', paymentsError);
            throw paymentsError;
          }

          return {
            ...promise,
            payments: payments || []
          };
        })
      );

      setPromises(promisesWithPayments);
    } catch (error) {
      console.error('Error fetching chanda data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8 relative">
            {/* Toggle Button */}
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={showUserInfo ? "Zitat anzeigen" : "Benutzerinfo anzeigen"}
            >
              {showUserInfo ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Content */}
            {showUserInfo ? (
              // User Info View
              userInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pr-12">
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Name</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold">{userInfo.name} {userInfo.surname}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Jamaat ID</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold">{userInfo.jamaatID}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Jamaat</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold">{userInfo.jamaat}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Role</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold capitalize">{userInfo.role}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Musi</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold">{userInfo.musi ? 'Ja' : 'Nein'}</p>
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-sm md:text-base text-gray-800 font-semibold capitalize">{userInfo.gender}</p>
                  </div>
                </div>
              )
            ) : (
              // Quote View (Default)
              randomQuote ? (
                <div className="pr-12">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-base md:text-lg text-gray-700 italic leading-relaxed mb-4">
                        {randomQuote.content}
                      </p>
                      <p className="text-sm md:text-base text-gray-600 font-semibold text-right">
                        — {randomQuote.author}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>Lade inspirierendes Zitat...</p>
                </div>
              )
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Dein Jahres Übersicht
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  fetchUserInfo();
                  fetchChandaData();
                  fetchRandomQuote();
                }}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Seite aktualisieren"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <label className="text-xs md:text-sm font-medium text-gray-600">Jahr:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-2 md:px-3 py-1 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {promises.length > 0 ? (
              <div className="space-y-6">
                {promises.map((promise) => {
                  return (
                    <ChandaCard
                      key={promise.id}
                      chanda={{
                        id: promise.id,
                        name: promise.chanda_types.name,
                        description: promise.chanda_types.description,
                        promise: promise.promise,
                        paid_in: promise.payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
                        spende_ends: promise.chanda_types.charity_end || promise.spende_ends
                      }}
                      payments={promise.payments || []}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Keine Chanda-Einträge gefunden
                </h3>
                <p className="text-gray-600">
                  Derzeit sind keine Chanda-Einträge für Ihr Konto vorhanden.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
