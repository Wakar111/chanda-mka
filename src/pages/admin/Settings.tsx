import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';

interface ChandaCollector {
  id: string;
  shoba_name: string; // e.g., "Nazim Maal"
  first_name: string;
  last_name: string;
  phone: string;
  nizam: string;
  period_start: string; // ISO date format
  period_end: string; // ISO date format
}

interface JamaatSettings {
  jamaat_name: string;
  street: string;
  postal_code: string;
  city: string;
  phone: string;
  total_members: number;
  ansar_count: number;
  khuddam_count: number;
  tifl_count: number;
  lajna_count: number;
  nazarat_count: number;
  collectors: ChandaCollector[];
}

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [settings, setSettings] = useState<JamaatSettings>({
    jamaat_name: '',
    street: '',
    postal_code: '',
    city: '',
    phone: '',
    total_members: 0,
    ansar_count: 0,
    khuddam_count: 0,
    tifl_count: 0,
    lajna_count: 0,
    nazarat_count: 0,
    collectors: [],
  });

  // New collector form state
  const [newCollector, setNewCollector] = useState({
    shoba_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    nizam: '',
    period_start: '',
    period_end: '',
  });

  // Edit collector state
  const [editingCollectorId, setEditingCollectorId] = useState<string | null>(null);
  const [editCollector, setEditCollector] = useState({
    shoba_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    nizam: '',
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (status?.type === 'success') {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const checkAdminAndLoadSettings = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        navigate('/');
        return;
      }

      // Load jamaat settings from database
      const { data: jamaatData, error: jamaatError } = await supabase
        .from('jamaat_settings')
        .select('*')
        .single();

      // Load chanda collectors from database
      const { data: collectorsData, error: collectorsError } = await supabase
        .from('chanda_collectors')
        .select('*')
        .order('created_at', { ascending: false });

      if (jamaatError && jamaatError.code !== 'PGRST116') {
        console.error('Error loading jamaat settings:', jamaatError);
      }

      if (collectorsError) {
        console.error('Error loading collectors:', collectorsError);
      }

      // Set settings with data from database or defaults
      setSettings({
        jamaat_name: jamaatData?.jamaat_name || '',
        street: jamaatData?.street || '',
        postal_code: jamaatData?.postal_code || '',
        city: jamaatData?.city || '',
        phone: jamaatData?.phone || '',
        total_members: jamaatData?.total_members || 0,
        ansar_count: jamaatData?.ansar_count || 0,
        khuddam_count: jamaatData?.khuddam_count || 0,
        tifl_count: jamaatData?.tifl_count || 0,
        lajna_count: jamaatData?.lajna_count || 0,
        nazarat_count: jamaatData?.nazarat_count || 0,
        collectors: collectorsData || [],
      });

    } catch (error) {
      console.error('Error loading settings:', error);
      setStatus({ type: 'error', message: 'Fehler beim Laden der Einstellungen' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollector = async () => {
    // Validate collector form
    if (!newCollector.shoba_name.trim()) {
      setStatus({ type: 'error', message: 'Shoba Name ist erforderlich' });
      return;
    }
    if (!newCollector.first_name.trim() || !newCollector.last_name.trim()) {
      setStatus({ type: 'error', message: 'Vor- und Nachname sind erforderlich' });
      return;
    }
    if (!newCollector.phone.trim()) {
      setStatus({ type: 'error', message: 'Telefonnummer ist erforderlich' });
      return;
    }
    if (!newCollector.nizam.trim()) {
      setStatus({ type: 'error', message: 'Nizam ist erforderlich' });
      return;
    }
    if (!newCollector.period_start || !newCollector.period_end) {
      setStatus({ type: 'error', message: 'Zeitraum ist erforderlich' });
      return;
    }

    // Check if end date is after start date
    if (new Date(newCollector.period_end) < new Date(newCollector.period_start)) {
      setStatus({ type: 'error', message: 'Enddatum muss nach dem Startdatum liegen' });
      return;
    }

    try {
      // Insert collector into database
      const { data, error } = await supabase
        .from('chanda_collectors')
        .insert({
          shoba_name: newCollector.shoba_name.trim(),
          first_name: newCollector.first_name.trim(),
          last_name: newCollector.last_name.trim(),
          phone: newCollector.phone.trim(),
          nizam: newCollector.nizam.trim(),
          period_start: newCollector.period_start,
          period_end: newCollector.period_end,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding collector:', error);
        setStatus({ type: 'error', message: 'Fehler beim Hinzufügen des Einkassierers' });
        return;
      }

      // Add to local state
      setSettings({
        ...settings,
        collectors: [data, ...settings.collectors],
      });

      // Reset form
      setNewCollector({
        shoba_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        nizam: '',
        period_start: '',
        period_end: '',
      });

      setStatus({ type: 'success', message: 'Einkassierer erfolgreich hinzugefügt' });
    } catch (error) {
      console.error('Error adding collector:', error);
      setStatus({ type: 'error', message: 'Fehler beim Hinzufügen des Einkassierers' });
    }
  };

  const handleEditCollector = (collector: ChandaCollector) => {
    setEditingCollectorId(collector.id);
    setEditCollector({
      shoba_name: collector.shoba_name,
      first_name: collector.first_name,
      last_name: collector.last_name,
      phone: collector.phone,
      nizam: collector.nizam,
      period_start: collector.period_start,
      period_end: collector.period_end,
    });
  };

  const handleCancelEdit = () => {
    setEditingCollectorId(null);
    setEditCollector({
      shoba_name: '',
      first_name: '',
      last_name: '',
      phone: '',
      nizam: '',
      period_start: '',
      period_end: '',
    });
  };

  const handleUpdateCollector = async (collectorId: string) => {
    // Validate edit form
    if (!editCollector.shoba_name.trim()) {
      setStatus({ type: 'error', message: 'Shoba Name ist erforderlich' });
      return;
    }
    if (!editCollector.first_name.trim() || !editCollector.last_name.trim()) {
      setStatus({ type: 'error', message: 'Vor- und Nachname sind erforderlich' });
      return;
    }
    if (!editCollector.phone.trim()) {
      setStatus({ type: 'error', message: 'Telefonnummer ist erforderlich' });
      return;
    }
    if (!editCollector.nizam.trim()) {
      setStatus({ type: 'error', message: 'Nizam ist erforderlich' });
      return;
    }
    if (!editCollector.period_start || !editCollector.period_end) {
      setStatus({ type: 'error', message: 'Zeitraum ist erforderlich' });
      return;
    }

    // Check if end date is after start date
    if (new Date(editCollector.period_end) < new Date(editCollector.period_start)) {
      setStatus({ type: 'error', message: 'Enddatum muss nach dem Startdatum liegen' });
      return;
    }

    try {
      // Update collector in database
      const { error } = await supabase
        .from('chanda_collectors')
        .update({
          shoba_name: editCollector.shoba_name.trim(),
          first_name: editCollector.first_name.trim(),
          last_name: editCollector.last_name.trim(),
          phone: editCollector.phone.trim(),
          nizam: editCollector.nizam.trim(),
          period_start: editCollector.period_start,
          period_end: editCollector.period_end,
        })
        .eq('id', collectorId);

      if (error) {
        console.error('Error updating collector:', error);
        setStatus({ type: 'error', message: 'Fehler beim Aktualisieren des Einkassierers' });
        return;
      }

      // Update local state
      setSettings({
        ...settings,
        collectors: settings.collectors.map(c => 
          c.id === collectorId 
            ? {
                ...c,
                shoba_name: editCollector.shoba_name.trim(),
                first_name: editCollector.first_name.trim(),
                last_name: editCollector.last_name.trim(),
                phone: editCollector.phone.trim(),
                nizam: editCollector.nizam.trim(),
                period_start: editCollector.period_start,
                period_end: editCollector.period_end,
              }
            : c
        ),
      });

      // Reset edit state
      handleCancelEdit();

      setStatus({ type: 'success', message: 'Einkassierer erfolgreich aktualisiert' });
    } catch (error) {
      console.error('Error updating collector:', error);
      setStatus({ type: 'error', message: 'Fehler beim Aktualisieren des Einkassierers' });
    }
  };

  const handleRemoveCollector = async (collectorId: string) => {
    try {
      // Delete collector from database
      const { error } = await supabase
        .from('chanda_collectors')
        .delete()
        .eq('id', collectorId);

      if (error) {
        console.error('Error removing collector:', error);
        setStatus({ type: 'error', message: 'Fehler beim Entfernen des Einkassierers' });
        return;
      }

      // Remove from local state
      setSettings({
        ...settings,
        collectors: settings.collectors.filter(c => c.id !== collectorId),
      });

      setStatus({ type: 'success', message: 'Einkassierer erfolgreich entfernt' });
    } catch (error) {
      console.error('Error removing collector:', error);
      setStatus({ type: 'error', message: 'Fehler beim Entfernen des Einkassierers' });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setStatus(null);

    try {
      // Validate inputs
      if (!settings.jamaat_name.trim()) {
        setStatus({ type: 'error', message: 'Jamaat Name darf nicht leer sein' });
        setSaving(false);
        return;
      }

      if (settings.total_members < 0) {
        setStatus({ type: 'error', message: 'Mitgliederanzahl muss positiv sein' });
        setSaving(false);
        return;
      }

      // Check if settings record exists
      const { data: existingSettings } = await supabase
        .from('jamaat_settings')
        .select('id')
        .single();

      const settingsData = {
        jamaat_name: settings.jamaat_name.trim(),
        street: settings.street.trim() || null,
        postal_code: settings.postal_code.trim() || null,
        city: settings.city.trim() || null,
        phone: settings.phone.trim() || null,
        total_members: settings.total_members,
        ansar_count: settings.ansar_count,
        khuddam_count: settings.khuddam_count,
        tifl_count: settings.tifl_count,
        lajna_count: settings.lajna_count,
        nazarat_count: settings.nazarat_count,
      };

      let error;

      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('jamaat_settings')
          .update(settingsData)
          .eq('id', existingSettings.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('jamaat_settings')
          .insert(settingsData);
        error = result.error;
      }

      if (error) {
        console.error('Error saving settings:', error);
        setStatus({ type: 'error', message: 'Fehler beim Speichern der Einstellungen' });
        setSaving(false);
        return;
      }

      setStatus({ type: 'success', message: 'Einstellungen erfolgreich gespeichert' });

    } catch (error) {
      console.error('Error saving settings:', error);
      setStatus({ type: 'error', message: 'Fehler beim Speichern der Einstellungen' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Fixed Status Message */}
      {status && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className={`p-4 rounded-lg shadow-lg ${
            status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{status.message}</span>
              <button
                onClick={() => setStatus(null)}
                className="ml-4 text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Einstellungen</h1>
            <p className="text-gray-600 mt-2">Jamaat-Konfiguration verwalten</p>
          </div>

          {/* Chanda Collectors Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Chanda Einkassierer verwalten</h2>
            <p className="text-sm text-gray-600 mb-6">
              Hier können Sie Mitglieder hinzufügen, die berechtigt sind, Chanda-Spenden einzukassieren.
            </p>

            {/* Add New Collector Form */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Neuen Einkassierer hinzufügen</h3>
              
              <div className="space-y-4">
                {/* Shoba Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shoba Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCollector.shoba_name}
                    onChange={(e) => setNewCollector({ ...newCollector, shoba_name: e.target.value })}
                    placeholder="z.B. Nazim Maal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Position/Verantwortung des Mitglieds
                  </p>
                </div>

                {/* First Name and Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCollector.first_name}
                      onChange={(e) => setNewCollector({ ...newCollector, first_name: e.target.value })}
                      placeholder="Vorname"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nachname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCollector.last_name}
                      onChange={(e) => setNewCollector({ ...newCollector, last_name: e.target.value })}
                      placeholder="Nachname"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Phone und Nizam */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newCollector.phone}
                      onChange={(e) => setNewCollector({ ...newCollector, phone: e.target.value })}
                      placeholder="z.B. +49 123 456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nizam <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCollector.nizam}
                      onChange={(e) => setNewCollector({ ...newCollector, nizam: e.target.value })}
                      placeholder="Nizam"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Period Start and End */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zeitraum von <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newCollector.period_start}
                      onChange={(e) => setNewCollector({ ...newCollector, period_start: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zeitraum bis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newCollector.period_end}
                      onChange={(e) => setNewCollector({ ...newCollector, period_end: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Add Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAddCollector}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Einkassierer hinzufügen
                  </button>
                </div>
              </div>
            </div>

            {/* List of Collectors */}
            <div className="border-t mt-6 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktive Einkassierer</h3>
              
              {settings.collectors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Noch keine Einkassierer hinzugefügt
                </p>
              ) : (
                <div className="space-y-4">
{settings.collectors.map((collector) => (
                    <div
                      key={collector.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {editingCollectorId === collector.id ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Shoba Name</label>
                              <input
                                type="text"
                                value={editCollector.shoba_name}
                                onChange={(e) => setEditCollector({ ...editCollector, shoba_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nizam</label>
                              <input
                                type="text"
                                value={editCollector.nizam}
                                onChange={(e) => setEditCollector({ ...editCollector, nizam: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Vorname</label>
                              <input
                                type="text"
                                value={editCollector.first_name}
                                onChange={(e) => setEditCollector({ ...editCollector, first_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nachname</label>
                              <input
                                type="text"
                                value={editCollector.last_name}
                                onChange={(e) => setEditCollector({ ...editCollector, last_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefonnummer</label>
                            <input
                              type="tel"
                              value={editCollector.phone}
                              onChange={(e) => setEditCollector({ ...editCollector, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum von</label>
                              <input
                                type="date"
                                value={editCollector.period_start}
                                onChange={(e) => setEditCollector({ ...editCollector, period_start: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum bis</label>
                              <input
                                type="date"
                                value={editCollector.period_end}
                                onChange={(e) => setEditCollector({ ...editCollector, period_end: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={() => handleUpdateCollector(collector.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Speichern
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {collector.shoba_name}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800">
                              {collector.first_name} {collector.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {collector.phone}
                            </p>
                            {collector.nizam && (
                              <p className="text-sm text-gray-600 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Nizam: {collector.nizam}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(collector.period_start).toLocaleDateString('de-DE')} - {new Date(collector.period_end).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCollector(collector)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleRemoveCollector(collector.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Entfernen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jamaat Settings Form */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Jamaat Einstellungen</h2>
            
            <div className="space-y-6">
              {/* Jamaat Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jamaat Name
                </label>
                <input
                  type="text"
                  value={settings.jamaat_name}
                  onChange={(e) => setSettings({ ...settings, jamaat_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. Jamaat Frankfurt"
                  disabled={saving}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Der Name Ihres Jamaats
                </p>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straße
                </label>
                <input
                  type="text"
                  value={settings.street}
                  onChange={(e) => setSettings({ ...settings, street: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. Musterstraße 123"
                  disabled={saving}
                />
              </div>

              {/* Postal Code and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PLZ
                  </label>
                  <input
                    type="text"
                    value={settings.postal_code}
                    onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="z.B. 60311"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ort
                  </label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="z.B. Frankfurt am Main"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="z.B. +49 69 12345678"
                  disabled={saving}
                />
              </div>

              {/* Member Categories Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Anzahl der Mitglieder</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Members */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gesamtanzahl Mitglieder
                    </label>
                    <input
                      type="number"
                      value={settings.total_members}
                      onChange={(e) => setSettings({ ...settings, total_members: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Die Gesamtanzahl der Mitglieder in Ihrem Jamaat
                    </p>
                  </div>

                  {/* Ansar Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl der Ansar
                    </label>
                    <input
                      type="number"
                      value={settings.ansar_count}
                      onChange={(e) => setSettings({ ...settings, ansar_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>

                  {/* Khuddam Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl der Khuddam
                    </label>
                    <input
                      type="number"
                      value={settings.khuddam_count}
                      onChange={(e) => setSettings({ ...settings, khuddam_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>

                  {/* Tifl Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl der Tifl
                    </label>
                    <input
                      type="number"
                      value={settings.tifl_count}
                      onChange={(e) => setSettings({ ...settings, tifl_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>

                  {/* Lajna Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl der Lajna
                    </label>
                    <input
                      type="number"
                      value={settings.lajna_count}
                      onChange={(e) => setSettings({ ...settings, lajna_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>

                  {/* Nazarat Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anzahl der Nazarat
                    </label>
                    <input
                      type="number"
                      value={settings.nazarat_count}
                      onChange={(e) => setSettings({ ...settings, nazarat_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saving ? 'Speichern...' : 'Einstellungen speichern'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
