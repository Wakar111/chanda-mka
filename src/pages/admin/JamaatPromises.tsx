import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
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

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function JamaatPromises() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promises, setPromises] = useState<JamaatPromise[]>([]);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPromiseId, setEditingPromiseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nizam_name: '',
    period_start: '',
    period_end: '',
    total_promise: 0,
  });

  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('current');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [chandaTypes, setChandaTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [paymentStats, setPaymentStats] = useState<Record<string, { promise: number; paid: number }>>({});

  useEffect(() => {
    checkAdminAndLoadPromises();
    loadChandaTypes();
  }, []);

  useEffect(() => {
    if (status?.type === 'success') {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const checkAdminAndLoadPromises = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData || userData.role !== 'admin') {
        navigate('/');
        return;
      }

      await loadPromises();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadChandaTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chanda_types')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setChandaTypes(data || []);
    } catch (error) {
      console.error('Error loading chanda types:', error);
    }
  };

  const loadPromises = async () => {
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
      console.error('Error loading promises:', error);
      setStatus({ type: 'error', message: 'Fehler beim Laden der Versprechungen' });
    }
  };

  const loadPaymentStatistics = async () => {
    try {
      const stats: Record<string, { promise: number; paid: number }> = {};

      // For each filtered promise, calculate total payments
      for (const promise of filteredPromises) {
        // First, get the chanda_type_id for this nizam_name
        const { data: chandaType, error: chandaError } = await supabase
          .from('chanda_types')
          .select('id')
          .eq('name', promise.nizam_name)
          .single();

        if (chandaError || !chandaType) {
          console.error(`Error finding chanda_type for ${promise.nizam_name}:`, chandaError);
          continue;
        }

        // Get all promises for this chanda_type within the period
        const { data: userPromises, error: promiseError } = await supabase
          .from('promises')
          .select('id')
          .eq('chanda_type_id', chandaType.id)
          .gte('year', new Date(promise.period_start).getFullYear())
          .lte('year', new Date(promise.period_end).getFullYear());

        if (promiseError || !userPromises || userPromises.length === 0) {
          if (!stats[promise.nizam_name]) {
            stats[promise.nizam_name] = { promise: promise.total_promise, paid: 0 };
          }
          continue;
        }

        const promiseIds = userPromises.map(p => p.id);

        // Get all payments for these promises within the date range
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .in('promise_id', promiseIds)
          .gte('payment_date', promise.period_start)
          .lte('payment_date', promise.period_end);

        if (paymentError) {
          console.error(`Error loading payments for ${promise.nizam_name}:`, paymentError);
          continue;
        }

        const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        if (!stats[promise.nizam_name]) {
          stats[promise.nizam_name] = { promise: 0, paid: 0 };
        }

        stats[promise.nizam_name].promise += promise.total_promise;
        stats[promise.nizam_name].paid += totalPaid;
      }

      setPaymentStats(stats);
    } catch (error) {
      console.error('Error loading payment statistics:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nizam_name || !formData.period_start || !formData.period_end || formData.total_promise <= 0) {
      setStatus({ type: 'error', message: 'Bitte füllen Sie alle Pflichtfelder aus' });
      return;
    }

    try {
      if (editingPromiseId) {
        const { error } = await supabase
          .from('jamaat_promises')
          .update({
            nizam_name: formData.nizam_name,
            period_start: formData.period_start,
            period_end: formData.period_end,
            total_promise: formData.total_promise,
          })
          .eq('id', editingPromiseId);

        if (error) throw error;
        setStatus({ type: 'success', message: 'Versprechen erfolgreich aktualisiert' });
        setEditingPromiseId(null);
      } else {
        const { error } = await supabase
          .from('jamaat_promises')
          .insert({
            nizam_name: formData.nizam_name,
            period_start: formData.period_start,
            period_end: formData.period_end,
            total_promise: formData.total_promise,
          });

        if (error) throw error;
        setStatus({ type: 'success', message: 'Versprechen erfolgreich hinzugefügt' });
      }

      resetForm();
      setIsAddModalOpen(false);
      await loadPromises();
    } catch (error) {
      console.error('Error saving promise:', error);
      setStatus({ type: 'error', message: 'Fehler beim Speichern des Versprechens' });
    }
  };

  const handleEdit = (promise: JamaatPromise) => {
    setFormData({
      nizam_name: promise.nizam_name,
      period_start: promise.period_start,
      period_end: promise.period_end,
      total_promise: promise.total_promise,
    });
    setEditingPromiseId(promise.id);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Versprechen wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('jamaat_promises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStatus({ type: 'success', message: 'Versprechen erfolgreich gelöscht' });
      await loadPromises();
    } catch (error) {
      console.error('Error deleting promise:', error);
      setStatus({ type: 'error', message: 'Fehler beim Löschen des Versprechens' });
    }
  };

  const resetForm = () => {
    setFormData({
      nizam_name: '',
      period_start: '',
      period_end: '',
      total_promise: 0,
    });
    setEditingPromiseId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const calculateRemainingDays = (endDate: string): number => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  // Load payment statistics when filtered promises change
  useEffect(() => {
    if (filteredPromises.length > 0) {
      loadPaymentStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPromises.length, selectedYearFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600">Laden...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Jamaat Versprechungen</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Verwalten Sie Jamaat-weite Versprechungen für verschiedene Nizam
            </p>
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

          {/* Payment Statistics Charts */}
          {Object.keys(paymentStats).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {Object.entries(paymentStats).map(([nizamName, stats]) => {
                const remaining = Math.max(0, stats.promise - stats.paid);
                const percentage = stats.promise > 0 ? Math.min(100, ((stats.paid / stats.promise) * 100)).toFixed(1) : 0;
                
                // Find the promise with this nizam_name to get the end date
                const promise = filteredPromises.find(p => p.nizam_name === nizamName);
                const endDate = promise?.period_end;
                const remainingDays = endDate ? calculateRemainingDays(endDate) : null;
                
                return (
                  <div key={nizamName} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">{nizamName}</h3>
                    
                    <PromisePieChart
                      paid={stats.paid}
                      promise={stats.promise}
                      remainingDays={remainingDays}
                      formatCurrency={formatCurrency}
                    />

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Versprechen:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(stats.promise)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bezahlt:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(stats.paid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Ausstehend:</span>
                        <span className="font-semibold text-gray-500">{formatCurrency(remaining)}</span>
                      </div>
                      {endDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Enddatum:</span>
                          <span className="font-semibold text-gray-900">{formatDate(endDate)}</span>
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
          )}

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Versprechungen</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {availableYears.length > 0 && (
                  <select
                    value={selectedYearFilter}
                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="current">Aktuelles Jahr</option>
                    <option value="all">Alle Jahre</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors"
                >
                  + Versprechen hinzufügen
                </button>
              </div>
            </div>

            {filteredPromises.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Noch keine Versprechungen hinzugefügt
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nizam
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zeitraum
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Versprechen
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPromises.map((promise) => (
                      <tr key={promise.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {promise.nizam_name}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(promise.period_start)} - {formatDate(promise.period_end)}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(promise.total_promise)}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEdit(promise)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDelete(promise.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">
                {editingPromiseId ? 'Versprechen bearbeiten' : 'Neues Versprechen hinzufügen'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Nizam Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.nizam_name}
                  onChange={(e) => setFormData({ ...formData, nizam_name: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Bitte wählen...</option>
                  {chandaTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Zeitraum von <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Zeitraum bis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Gesamt Versprechen (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_promise}
                  onChange={(e) => setFormData({ ...formData, total_promise: parseFloat(e.target.value) })}
                  placeholder="z.B. 40000.00"
                  className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm md:text-base font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors"
                >
                  {editingPromiseId ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
