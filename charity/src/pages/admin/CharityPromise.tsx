import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface User {
  id: string;
  jamaatID: string;
  name: string;
  surname: string;
  email: string;
  jamaat: string;
  phone: string;
  musi: boolean;
  profession: string;
}

interface ChandaType {
  id: string;
  name: string;
  description: string;
}

interface Payment {
  id: string;
  promise_id: string;
  amount: number;
  payment_date: string;
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
  lastPaymentDate?: string;
}

const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} €`;
};

const getTotalPaid = (promise: Promise): number => {
  return promise.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
};

const getRemainingAmount = (promise: Promise): number => {
  return promise.promise - getTotalPaid(promise);
};

const getYearlyPromiseTotal = (promises: Promise[], year: number): number => {
  return promises
    .filter(p => p.year === year)
    .reduce((sum, p) => sum + p.promise, 0);
};

const getYearlyPaidTotal = (promises: Promise[], year: number): number => {
  return promises
    .filter(p => p.year === year)
    .reduce((sum, p) => sum + getTotalPaid(p), 0);
};

const getYearlyRemainingTotal = (promises: Promise[], year: number): number => {
  return promises
    .filter(p => p.year === year)
    .reduce((sum, p) => sum + getRemainingAmount(p), 0);
};

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

interface NewPromiseForm {
  chanda_type_id: string;
  promise: string;
  spende_ends: string;
  paid_amount: string;
  payment_date: string;
}

interface IncomeBudgetForm {
  monthly_income: string;
  is_musi: boolean;
}

export default function CharityPromise() {
  const [searchJamaatID, setSearchJamaatID] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [userPromises, setUserPromises] = useState<Promise[]>([]);
  const [chandaTypes, setChandaTypes] = useState<ChandaType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [editingPromiseId, setEditingPromiseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState<string | null>(null);
  const [showNewPromiseModal, setShowNewPromiseModal] = useState(false);
  const [newPromiseForm, setNewPromiseForm] = useState<NewPromiseForm>({
    chanda_type_id: '',
    promise: '',
    spende_ends: '',
    paid_amount: '',
    payment_date: ''
  });
  const [savingNewPromise, setSavingNewPromise] = useState(false);
  const [deletingPromiseId, setDeletingPromiseId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [promiseToDelete, setPromiseToDelete] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'income' | 'manual'>('income');
  const [incomeBudgetForm, setIncomeBudgetForm] = useState<IncomeBudgetForm>({
    monthly_income: '',
    is_musi: false
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users by Jamaat ID prefix
  const searchUsersByPrefix = async (prefix: string) => {
    const prefixStr = String(prefix || '');
    if (!prefixStr.trim()) {
      setFilteredUsers([]);
      setShowDropdown(false);
      return;
    }

    try {
      // Fetch all users with role 'user' and filter client-side since jamaatID is int8
      const { data, error } = await supabase
        .from('users')
        .select('id, jamaatID, name, surname, email, jamaat, phone, profession, musi')
        .eq('role', 'user');

      if (error) throw error;

      // Filter by jamaatID prefix on client side
      const filtered = (data || [])
        .filter(user => String(user.jamaatID).startsWith(prefixStr))
        .slice(0, 10);

      setFilteredUsers(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (error) {
      console.error('Error searching users:', error);
      setFilteredUsers([]);
      setShowDropdown(false);
    }
  };

  // Handle input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsersByPrefix(searchJamaatID);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchJamaatID]);

  const selectUser = async (user: User) => {
    setSearchJamaatID(user.jamaatID);
    setShowDropdown(false);
    setFilteredUsers([]);
    setLoading(true);
    setStatus(null);
    setSelectedUser(null);
    setUserPromises([]);

    try {
      setSelectedUser(user);
      await fetchChandaTypes();
      const promises = await fetchUserPromises(user.id);
      const years = [...new Set(promises.map(p => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      setSelectedYear(years[0] || new Date().getFullYear());
    } catch (error) {
      console.error('Error loading user data:', error);
      setStatus({ type: 'error', message: 'Fehler beim Laden der Benutzerdaten' });
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchJamaatID.trim()) {
      setStatus({ type: 'error', message: 'Bitte geben Sie eine Jamaat ID ein' });
      return;
    }

    setLoading(true);
    setStatus(null);
    setSelectedUser(null);
    setUserPromises([]);
    setShowDropdown(false);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, jamaatID, name, surname, email, jamaat, phone, profession, musi')
        .eq('role', 'user')
        .eq('jamaatID', searchJamaatID)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setSelectedUser(data[0]);
        await fetchChandaTypes();
        const promises = await fetchUserPromises(data[0].id);
        const years = [...new Set(promises.map(p => p.year))].sort((a, b) => b - a);
        setAvailableYears(years);
        setSelectedYear(years[0] || new Date().getFullYear());
      } else {
        setStatus({ type: 'error', message: 'Kein Benutzer mit dieser Jamaat ID gefunden' });
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setStatus({ type: 'error', message: 'Fehler beim Suchen des Benutzers' });
    } finally {
      setLoading(false);
    }
  };

  const startEditPayment = (promiseId: string) => {
    setEditingPromiseId(promiseId);
    const p = userPromises.find((x) => x.id === promiseId);
    const currentTotal = p ? getTotalPaid(p) : 0;
    setEditAmount(currentTotal.toFixed(2));
  };

  const cancelEditPayment = () => {
    setEditingPromiseId(null);
    setEditAmount('');
  };

  const savePayment = async (promiseId: string) => {
    const newTotal = Number(editAmount.replace(',', '.'));
    if (isNaN(newTotal) || newTotal < 0) {
      setStatus({ type: 'error', message: 'Bitte einen gültigen Betrag eingeben' });
      return;
    }

    try {
      setSavingPayment(promiseId);
      setStatus(null);

      // Replace existing payments with a single payment equal to the new total.
      const { error: delErr } = await supabase
        .from('payments')
        .delete()
        .eq('promise_id', promiseId);
      if (delErr) throw delErr;

      if (newTotal > 0) {
        const { error: insErr } = await supabase
          .from('payments')
          .insert({
            promise_id: promiseId,
            amount: newTotal,
            payment_date: new Date().toISOString(),
          });
        if (insErr) throw insErr;
      }

      // Refresh payments for this promise only
      const payments = await fetchPayments(promiseId);
      setUserPromises((prev) =>
        prev.map((p) =>
          p.id === promiseId
            ? {
                ...p,
                payments,
                lastPaymentDate:
                  payments.length > 0
                    ? payments
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.payment_date).getTime() -
                            new Date(a.payment_date).getTime()
                        )[0].payment_date
                    : undefined,
              }
            : p
        )
      );

      setStatus({ type: 'success', message: 'Zahlung gespeichert' });
      cancelEditPayment();
    } catch (error) {
      console.error('Error saving payment:', error);
      setStatus({ type: 'error', message: 'Fehler beim Speichern der Zahlung' });
    } finally {
      setSavingPayment(null);
    }
  };

  const fetchUserPromises = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('promises')
        .select(`
          *,
          chanda_types (*)
        `)
        .eq('user_id', userId)
        .order('year', { ascending: false });
      if (error) throw error;
      
      const promises = data || [];
      const promisesWithPayments = await Promise.all(
        promises.map(async (promise) => {
          const payments = await fetchPayments(promise.id);
          const lastPayment = payments.length > 0
            ? payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
            : null;
          return {
            ...promise,
            payments,
            lastPaymentDate: lastPayment?.payment_date
          };
        })
      );
      
      setUserPromises(promisesWithPayments);
      return promisesWithPayments;
    } catch (error) {
      console.error('Error fetching promises:', error);
      return [];
    }
  };

  const fetchPayments = async (promiseId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('promise_id', promiseId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  };

  const fetchChandaTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chanda_types')
        .select('*');

      if (error) throw error;
      setChandaTypes(data || []);
    } catch (error) {
      console.error('Error fetching chanda types:', error);
    }
  };

  const handleNewPromiseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPromiseForm(prev => ({ ...prev, [name]: value }));
  };

  const openNewPromiseModal = () => {
    setActiveTab('income');
    setNewPromiseForm({
      chanda_type_id: '',
      promise: '',
      spende_ends: '',
      paid_amount: '',
      payment_date: ''
    });
    setIncomeBudgetForm({
      monthly_income: '',
      is_musi: selectedUser?.musi || false
    });
    setShowNewPromiseModal(true);
  };

  const closeNewPromiseModal = () => {
    setShowNewPromiseModal(false);
    setActiveTab('income');
    setNewPromiseForm({
      chanda_type_id: '',
      promise: '',
      spende_ends: '',
      paid_amount: '',
      payment_date: ''
    });
    setIncomeBudgetForm({
      monthly_income: '',
      is_musi: false
    });
  };

  const calculatePromisesFromIncome = (monthlyIncome: number, isMusi: boolean) => {
    const contributions: { name: string; percentage: number; applies: boolean }[] = [
      { name: 'Hissa Amad', percentage: 10, applies: isMusi },
      { name: 'Chanda Aam', percentage: 6.25, applies: !isMusi },
      { name: 'Jalsa Salana', percentage: 0.833, applies: true },
      { name: 'Majlis', percentage: 1, applies: true },
      { name: 'Ijtema', percentage: 0.208, applies: true },
      { name: 'Ishaat', percentage: 0.2, applies: true }
    ];

    return contributions
      .filter(c => c.applies)
      .map(c => ({
        name: c.name,
        amount: Number(((monthlyIncome * c.percentage) / 100).toFixed(2))
      }));
  };

  const handleCreateIncomeBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setStatus({ type: 'error', message: 'Kein Benutzer ausgewählt' });
      return;
    }

    const monthlyIncome = Number(incomeBudgetForm.monthly_income);
    if (isNaN(monthlyIncome) || monthlyIncome <= 0) {
      setStatus({ type: 'error', message: 'Bitte ein gültiges Monatseinkommen eingeben' });
      return;
    }

    setSavingNewPromise(true);
    setStatus(null);

    try {
      const calculatedPromises = calculatePromisesFromIncome(monthlyIncome, incomeBudgetForm.is_musi);
      const currentYear = new Date().getFullYear();

      const missingTypes: string[] = [];
      for (const promise of calculatedPromises) {
        const chandaType = chandaTypes.find(ct => ct.name === promise.name);
        if (!chandaType) {
          missingTypes.push(promise.name);
        }
      }

      if (missingTypes.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Folgende Chanda-Typen fehlen in der Datenbank: ${missingTypes.join(', ')}. Bitte legen Sie diese zuerst unter "Chanda-Typ festlegen" an.` 
        });
        setSavingNewPromise(false);
        return;
      }

      // Check for existing promises for this year
      const chandaTypeIds = calculatedPromises
        .map(p => chandaTypes.find(ct => ct.name === p.name)?.id)
        .filter(id => id !== undefined);

      const { data: existingPromises, error: checkError } = await supabase
        .from('promises')
        .select('chanda_type_id, chanda_types(name)')
        .eq('user_id', selectedUser.id)
        .eq('year', currentYear)
        .in('chanda_type_id', chandaTypeIds);

      if (checkError) throw checkError;

      if (existingPromises && existingPromises.length > 0) {
        const existingTypeNames = existingPromises
          .map((p: any) => p.chanda_types?.name)
          .filter(Boolean)
          .join(', ');
        
        setStatus({ 
          type: 'error', 
          message: `Für das Jahr ${currentYear} existieren bereits Versprechen für folgende Typen: ${existingTypeNames}. Bitte löschen Sie diese zuerst oder verwenden Sie den manuellen Modus.` 
        });
        setSavingNewPromise(false);
        return;
      }

      for (const promise of calculatedPromises) {
        const chandaType = chandaTypes.find(ct => ct.name === promise.name);
        
        const { error: promiseError } = await supabase
          .from('promises')
          .insert({
            user_id: selectedUser.id,
            chanda_type_id: chandaType!.id,
            year: currentYear,
            promise: promise.amount
          });

        if (promiseError) throw promiseError;
      }

      setStatus({ type: 'success', message: 'Jahresbudget erfolgreich erstellt' });
      closeNewPromiseModal();
      
      const promises = await fetchUserPromises(selectedUser.id);
      const years = [...new Set(promises.map(p => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      if (!years.includes(currentYear)) {
        setSelectedYear(currentYear);
      }
    } catch (error) {
      console.error('Error creating income budget:', error);
      setStatus({ type: 'error', message: 'Fehler beim Erstellen des Jahresbudgets' });
    } finally {
      setSavingNewPromise(false);
    }
  };

  const handleCreatePromise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setStatus({ type: 'error', message: 'Kein Benutzer ausgewählt' });
      return;
    }

    setSavingNewPromise(true);
    setStatus(null);

    try {
      const promiseAmount = Number(newPromiseForm.promise);
      const paidAmount = Number(newPromiseForm.paid_amount);

      if (isNaN(promiseAmount) || promiseAmount < 0) {
        setStatus({ type: 'error', message: 'Bitte einen gültigen Versprechensbetrag eingeben' });
        return;
      }

      if (isNaN(paidAmount) || paidAmount < 0) {
        setStatus({ type: 'error', message: 'Bitte einen gültigen Zahlungsbetrag eingeben' });
        return;
      }

      const currentYear = new Date().getFullYear();

      // Check if promise already exists for this chanda type and year
      const { data: existingPromise, error: checkError } = await supabase
        .from('promises')
        .select('id, chanda_types(name)')
        .eq('user_id', selectedUser.id)
        .eq('chanda_type_id', newPromiseForm.chanda_type_id)
        .eq('year', currentYear)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPromise) {
        const chandaTypeName = (existingPromise as any).chanda_types?.name || 'diesem Typ';
        setStatus({ 
          type: 'error', 
          message: `Für das Jahr ${currentYear} existiert bereits ein Versprechen für ${chandaTypeName}. Bitte löschen Sie das bestehende Versprechen zuerst.` 
        });
        setSavingNewPromise(false);
        return;
      }

      // Create the promise
      const promiseInsert: any = {
        user_id: selectedUser.id,
        chanda_type_id: newPromiseForm.chanda_type_id,
        year: currentYear,
        promise: promiseAmount
      };

      // Only add spende_ends if it's provided
      if (newPromiseForm.spende_ends) {
        promiseInsert.spende_ends = newPromiseForm.spende_ends;
      }

      const { data: promiseData, error: promiseError } = await supabase
        .from('promises')
        .insert(promiseInsert)
        .select()
        .single();

      if (promiseError) throw promiseError;

      // If there's a payment amount, create the payment
      if (paidAmount > 0) {
        const paymentDate = newPromiseForm.payment_date || new Date().toISOString().split('T')[0];
        
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            promise_id: promiseData.id,
            amount: paidAmount,
            payment_date: paymentDate
          });

        if (paymentError) throw paymentError;
      }

      setStatus({ type: 'success', message: 'Versprechen erfolgreich erstellt' });
      closeNewPromiseModal();
      
      // Refresh promises
      const promises = await fetchUserPromises(selectedUser.id);
      const years = [...new Set(promises.map(p => p.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      if (!years.includes(selectedYear)) {
        setSelectedYear(years[0] || new Date().getFullYear());
      }
    } catch (error) {
      console.error('Error creating promise:', error);
      setStatus({ type: 'error', message: 'Fehler beim Erstellen des Versprechens' });
    } finally {
      setSavingNewPromise(false);
    }
  };

  const openDeleteConfirm = (promiseId: string) => {
    setPromiseToDelete(promiseId);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setPromiseToDelete(null);
  };

  const confirmDeletePromise = async () => {
    if (!promiseToDelete) return;

    setDeletingPromiseId(promiseToDelete);
    setStatus(null);
    setShowDeleteConfirm(false);

    try {
      // Delete associated payments first
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('promise_id', promiseToDelete);

      if (paymentsError) throw paymentsError;

      // Delete the promise
      const { error: promiseError } = await supabase
        .from('promises')
        .delete()
        .eq('id', promiseToDelete);

      if (promiseError) throw promiseError;

      setStatus({ type: 'success', message: 'Versprechen erfolgreich gelöscht' });

      // Refresh promises
      if (selectedUser) {
        const promises = await fetchUserPromises(selectedUser.id);
        const years = [...new Set(promises.map(p => p.year))].sort((a, b) => b - a);
        setAvailableYears(years);
        
        // If current year has no promises, switch to first available year
        if (promises.filter(p => p.year === selectedYear).length === 0 && years.length > 0) {
          setSelectedYear(years[0]);
        }
      }
    } catch (error) {
      console.error('Error deleting promise:', error);
      setStatus({ type: 'error', message: 'Fehler beim Löschen des Versprechens' });
    } finally {
      setDeletingPromiseId(null);
      setPromiseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Chanda Versprechen festlegen
            </h1>

            {status && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jamaat ID
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={searchJamaatID}
                    onChange={(e) => setSearchJamaatID(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                    placeholder="Jamaat ID eingeben..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={loading}
                    onFocus={() => {
                      if (String(searchJamaatID || '').trim() && filteredUsers.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={searchUser}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Suche...' : 'Suchen'}
                  </button>
                </div>
                
                {showDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name} {user.surname}
                            </p>
                            <p className="text-sm text-gray-600">
                              Jamaat ID: <span className="font-semibold">{user.jamaatID}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{user.jamaat}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedUser && (
              <div className="space-y-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Benutzer Information</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Jamaat ID</p>
                      <p className="font-medium">{selectedUser.jamaatID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedUser.name} {selectedUser.surname}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jamaat</p>
                      <p className="font-medium">{selectedUser.jamaat}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Beruf</p>
                      <p className="font-medium">{selectedUser.profession}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Musi</p>
                      <p className="font-medium">{selectedUser.musi ? 'Ja' : 'Nein'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      Versprechen
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={openNewPromiseModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors text-sm font-medium"
                      >
                        + Neu Versprechen
                      </button>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Jahr:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="rounded-lg border border-gray-300 px-3 py-1 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          {availableYears.length > 0 ? (
                            availableYears.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))
                          ) : (
                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                  {userPromises.filter(p => p.year === selectedYear).length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Gesamt Versprechen</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(getYearlyPromiseTotal(userPromises, selectedYear))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Gesamt Bezahlt</p>
                          <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-blue-700">
                              {formatCurrency(getYearlyPaidTotal(userPromises, selectedYear))}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1">
                          <p className="text-sm text-blue-600 font-medium">Verbleibend</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(getYearlyRemainingTotal(userPromises, selectedYear))}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Chanda Typ
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Versprechen
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Enddatum
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Bezahlt
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Letzte Zahlung am
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Verbleibend
                              </th>
                              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aktionen
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userPromises
                              .filter(p => p.year === selectedYear)
                              .map((promise) => (
                              <tr key={promise.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {promise.chanda_types.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {promise.promise} €
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {promise.spende_ends 
                                    ? new Date(promise.spende_ends).toLocaleDateString('de-DE')
                                    : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {editingPromiseId === promise.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        placeholder="Betrag"
                                        className="w-24 rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => savePayment(promise.id)}
                                        disabled={savingPayment === promise.id}
                                        className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                                        title="Speichern"
                                      >
                                        {savingPayment === promise.id ? '...' : 'Speichern'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEditPayment}
                                        className="px-2 py-1 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
                                        title="Abbrechen"
                                      >
                                        Abbrechen
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-700 font-medium">
                                        {formatCurrency(getTotalPaid(promise))}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => startEditPayment(promise.id)}
                                        className="p-1 rounded hover:bg-gray-100"
                                        title="Betrag bearbeiten"
                                      >
                                        {/* Pencil icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600">
                                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 0 0 0-3.714Z" />
                                          <path d="M19.513 8.199 15.8 4.486 4.772 15.514a5.25 5.25 0 0 0-1.32 2.214l-.8 2.401a.75.75 0 0 0 .948.948l2.401-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {promise.lastPaymentDate 
                                    ? new Date(promise.lastPaymentDate).toLocaleDateString('de-DE')
                                    : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium ${getRemainingAmount(promise) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {formatCurrency(getRemainingAmount(promise))}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button
                                    type="button"
                                    onClick={() => openDeleteConfirm(promise.id)}
                                    disabled={deletingPromiseId === promise.id}
                                    className="p-1 rounded hover:bg-red-50 text-red-600 hover:text-red-700 disabled:opacity-50"
                                    title="Versprechen löschen"
                                  >
                                    {deletingPromiseId === promise.id ? (
                                      <span className="text-xs">...</span>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Keine Versprechen für das Jahr {selectedYear} gefunden
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />

      {/* New Promise Modal */}
      {showNewPromiseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Neu Versprechen erstellen</h2>
                <button
                  type="button"
                  onClick={closeNewPromiseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('income')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'income'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Einkommen Budget
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Manuell
                </button>
              </div>

              {/* Status Message */}
              {status && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    status.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {status.message}
                </div>
              )}

              {/* Income Budget Tab */}
              {activeTab === 'income' && (
                <form onSubmit={handleCreateIncomeBudget} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0">
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">Hinweis:</p>
                        <p>Stellen Sie sicher, dass alle benötigten Chanda-Typen (Musi, Chanda Aam, Jalsa Salana, Majlis, Ijtema, Ishaat) bereits unter "Chanda-Typ festlegen" angelegt wurden.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monatseinkommen (€) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={incomeBudgetForm.monthly_income}
                      onChange={(e) => setIncomeBudgetForm(prev => ({ ...prev, monthly_income: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                      placeholder="1000.00"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Musi Status
                    </label>
                    <select
                      value={incomeBudgetForm.is_musi ? 'ja' : 'nein'}
                      onChange={(e) => setIncomeBudgetForm(prev => ({ ...prev, is_musi: e.target.value === 'ja' }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="nein">Nein</option>
                      <option value="ja">Ja</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {incomeBudgetForm.is_musi 
                        ? 'Musi-Mitglied zahlt: Musi (10%), Jalsa Salana, Majlis, Ijtema, Ishaat'
                        : 'Kein Musi zahlt: Chanda Aam (6,25%), Jalsa Salana, Majlis, Ijtema, Ishaat'}
                    </p>
                  </div>

                  {incomeBudgetForm.monthly_income && Number(incomeBudgetForm.monthly_income) > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Berechnete Beiträge:</h3>
                      <div className="space-y-2">
                        {calculatePromisesFromIncome(Number(incomeBudgetForm.monthly_income), incomeBudgetForm.is_musi).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name}:</span>
                            <span className="font-semibold text-gray-900">{item.amount.toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeNewPromiseModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={savingNewPromise}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {savingNewPromise ? 'Erstelle...' : 'Spenden erstellen'}
                    </button>
                  </div>
                </form>
              )}

              {/* Manual Promise Tab */}
              {activeTab === 'manual' && (
                <form onSubmit={handleCreatePromise} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chanda Typ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="chanda_type_id"
                    value={newPromiseForm.chanda_type_id}
                    onChange={handleNewPromiseChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Bitte wählen...</option>
                    {chandaTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Versprechen (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="promise"
                    value={newPromiseForm.promise}
                    onChange={handleNewPromiseChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enddatum von Chanda dieses Jahres
                  </label>
                  <input
                    type="date"
                    name="spende_ends"
                    value={newPromiseForm.spende_ends}
                    onChange={handleNewPromiseChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: Fälligkeitsdatum für das Versprechen</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezahlt (€)
                  </label>
                  <input
                    type="number"
                    name="paid_amount"
                    value={newPromiseForm.paid_amount}
                    onChange={handleNewPromiseChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: Bereits bezahlter Betrag</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Letzte Zahlung am
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={newPromiseForm.payment_date}
                    onChange={handleNewPromiseChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional: Nur erforderlich, wenn ein Betrag bezahlt wurde</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeNewPromiseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewPromise}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-colors"
                  >
                    {savingNewPromise ? 'Speichern...' : 'Erstellen'}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}

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
                Versprechen löschen?
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Möchten Sie dieses Versprechen wirklich löschen? Alle zugehörigen Zahlungen werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteConfirm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePromise}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
