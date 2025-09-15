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

  useEffect(() => {
    fetchUserInfo();
    fetchAvailableYears();
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

  const fetchUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('users')
        .select('name, surname, jamaatID, jamaat, role')
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

      console.log('Fetching promises for user:', session.user.id);
      
      // Fetch promises with chanda types
      console.log('Fetching promises for year:', selectedYear);
      
      const { data: promiseData, error: promiseError } = await supabase
        .from('promises')
        .select(`
          *,
          chanda_types!inner(*)
        `)
        .eq('user_id', session.user.id)
        .eq('year', selectedYear);
      
      console.log('Raw promise data:', promiseData);

      if (promiseError) {
        console.error('Promise fetch error:', promiseError);
        throw promiseError;
      }
      
      if (!promiseData) {
        console.log('No promise data found');
        return;
      }

      // Fetch payments for each promise
      console.log('Fetching payments for promises...');
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

          console.log(`Payments for promise ${promise.id}:`, payments);
          return {
            ...promise,
            payments: payments || []
          };
        })
      );

      console.log('Promises with payments:', promisesWithPayments);
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
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          {userInfo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-800 font-semibold">{userInfo.name} {userInfo.surname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Jamaat ID</label>
                  <p className="text-gray-800 font-semibold">{userInfo.jamaatID}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Jamaat</label>
                  <p className="text-gray-800 font-semibold">{userInfo.jamaat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-800 font-semibold capitalize">{userInfo.role}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Dein Jahres Übersicht
            </h1>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600">Jahr:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                {promises.map((promise) => (
                  <ChandaCard
                    key={promise.id}
                    chanda={{
                      id: promise.id,
                      name: promise.chanda_types.name,
                      description: promise.chanda_types.description,
                      promise: promise.promise,
                      paid_in: promise.payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
                      spende_ends: promise.spende_ends
                    }}
                    payments={promise.payments || []}
                  />
                ))}
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
