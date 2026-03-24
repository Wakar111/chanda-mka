import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import PromisePieChart from '../../components/PromisePieChart';

interface JamaatPromise {
  id: string;
  nizam_name: string;
  period_start: string;
  period_end: string;
  total_promise: number;
  created_at: string;
  updated_at: string;
}

interface PromiseStats {
  nizamName: string;
  promise: number;
  paid: number;
  endDate: string;
}

const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} €`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE');
};

const calculateRemainingDays = (endDate: string): number => {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function Promises() {
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('current');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [promises, setPromises] = useState<JamaatPromise[]>([]);
  const [promiseStats, setPromiseStats] = useState<PromiseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJamaatPromises();
  }, []);

  useEffect(() => {
    if (filteredPromises.length > 0) {
      calculateStats();
    }
  }, [promises, selectedYearFilter]);

  const loadJamaatPromises = async () => {
    try {
      const { data, error } = await supabase
        .from('jamaat_promises')
        .select('*')
        .order('period_start', { ascending: false })
        .order('nizam_name', { ascending: true });

      if (error) throw error;
      setPromises(data || []);

      // Extract unique year ranges from period_start and period_end
      if (data && data.length > 0) {
        const yearRanges = new Set<string>();
        data.forEach(promise => {
          const startYear = new Date(promise.period_start).getFullYear();
          const endYear = new Date(promise.period_end).getFullYear();
          
          if (startYear === endYear) {
            yearRanges.add(startYear.toString());
          } else {
            yearRanges.add(`${startYear}/${endYear}`);
          }
        });
        
        const years = Array.from(yearRanges).sort().reverse();
        setAvailableYears(years);
      }
    } catch (error) {
      console.error('Error loading jamaat promises:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    const stats: PromiseStats[] = [];

    for (const promise of filteredPromises) {
      
      // Get the chanda_type_id for this nizam_name
      const { data: chandaType, error: chandaError } = await supabase
        .from('chanda_types')
        .select('id')
        .eq('name', promise.nizam_name)
        .single();

      if (chandaError || !chandaType) {
        console.error(`Error finding chanda_type for ${promise.nizam_name}:`, chandaError);
        continue;
      }

      const startYear = new Date(promise.period_start).getFullYear();
      const endYear = new Date(promise.period_end).getFullYear();

      // Get all user promises for this chanda_type within the period
      const { data: userPromises, error: promiseError } = await supabase
        .from('promises')
        .select('id')
        .eq('chanda_type_id', chandaType.id)
        .gte('year', startYear)
        .lte('year', endYear);

      if (promiseError) {
        console.error('Error loading user promises:', promiseError);
        continue;
      }

      // Calculate total paid for all these promises within the date range
      let totalPaid = 0;
      if (userPromises && userPromises.length > 0) {
        const promiseIds = userPromises.map(p => p.id);
        
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .in('promise_id', promiseIds)
          .gte('payment_date', promise.period_start)
          .lte('payment_date', promise.period_end);

        if (!paymentError && payments) {
          totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        } else if (paymentError) {
          console.error(`Payment Error for ${promise.nizam_name}:`, paymentError);
        }
      }

      stats.push({
        nizamName: promise.nizam_name,
        promise: promise.total_promise,
        paid: totalPaid,
        endDate: promise.period_end
      });
    }

    setPromiseStats(stats);
  };

  // Helper function to get year range from promise
  const getYearRange = (promise: JamaatPromise): string => {
    const startYear = new Date(promise.period_start).getFullYear();
    const endYear = new Date(promise.period_end).getFullYear();
    return startYear === endYear ? startYear.toString() : `${startYear}/${endYear}`;
  };

  // Filter promises based on selected year
  const filteredPromises = selectedYearFilter === 'all' 
    ? promises 
    : selectedYearFilter === 'current'
    ? promises.filter(p => {
        const currentYear = new Date().getFullYear();
        const startYear = new Date(p.period_start).getFullYear();
        const endYear = new Date(p.period_end).getFullYear();
        return currentYear >= startYear && currentYear <= endYear;
      })
    : promises.filter(p => getYearRange(p) === selectedYearFilter);

  const getTotalPromise = () => promiseStats.reduce((sum, s) => sum + s.promise, 0);
  const getTotalPaid = () => promiseStats.reduce((sum, s) => sum + s.paid, 0);
  const getTotalRemaining = () => Math.max(0, getTotalPromise() - getTotalPaid());
  const getOverallPercentage = () => {
    const total = getTotalPromise();
    return total > 0 ? Math.min(100, ((getTotalPaid() / total) * 100)).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Jamaat Versprechungen</h1>
          <p className="text-gray-600 mt-2">
            Übersicht aller Jamaat-weiten Versprechungen
          </p>
        </div>

        {/* Year Filter */}
        {availableYears.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Jahr auswählen:</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="current">Aktuelles Jahr</option>
              <option value="all">Alle Jahre</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Overall Statistics */}
        {promiseStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gesamtübersicht {selectedYearFilter === 'current' ? 'Aktuelles Jahr' : selectedYearFilter === 'all' ? 'Alle Jahre' : selectedYearFilter}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Gesamtversprechen</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPromise())}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Bezahlt</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalPaid())}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalRemaining())}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Fortschritt</p>
                <p className="text-2xl font-bold text-blue-600">{getOverallPercentage()}%</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getOverallPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Individual Promise Cards */}
        {promiseStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promiseStats.map((stat, index) => {
              const remaining = Math.max(0, stat.promise - stat.paid);
              const percentage = stat.promise > 0 ? Math.min(100, ((stat.paid / stat.promise) * 100)).toFixed(1) : 0;
              const remainingDays = stat.endDate ? calculateRemainingDays(stat.endDate) : null;

              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">{stat.nizamName}</h3>
                  
                  <PromisePieChart
                    paid={stat.paid}
                    promise={stat.promise}
                    remainingDays={remainingDays}
                    formatCurrency={formatCurrency}
                  />

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Versprechen:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(stat.promise)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bezahlt:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(stat.paid)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ausstehend:</span>
                      <span className="font-semibold text-gray-500">{formatCurrency(remaining)}</span>
                    </div>
                    {stat.endDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Enddatum:</span>
                        <span className="font-semibold text-gray-900">{formatDate(stat.endDate)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Fortschritt:</span>
                        <span className="font-bold text-blue-600">{percentage}%</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Keine Versprechungen gefunden</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}