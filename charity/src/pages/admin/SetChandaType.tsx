import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ChandaType {
  id?: string;
  name: string;
  description: string;
}

export default function SetChandaType() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [chandaTypes, setChandaTypes] = useState<ChandaType[]>([]);
  const [formData, setFormData] = useState<ChandaType>({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchChandaTypes();
  }, []);
  
  // 👉 Effect 2: auto-hide message after 5s
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const fetchChandaTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chanda_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setChandaTypes(data || []);
    } catch (error) {
      console.error('Error fetching chanda types:', error);
      setMessage({ text: 'Fehler beim Laden der Chanda-Typen', type: 'error' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase
        .from('chanda_types')
        .insert([formData]);

      if (error) throw error;

      setMessage({ text: 'Chanda-Typ erfolgreich hinzugefügt', type: 'success' });
      setFormData({ name: '', description: '' });
      fetchChandaTypes(); // Refresh the list
    } catch (error) {
      console.error('Error adding chanda type:', error);
      setMessage({ text: 'Fehler beim Hinzufügen des Chanda-Typs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Chanda-Typ hinzufügen
            </h1>

            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name des Chanda-Typs
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner /> : 'Hinzufügen'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Vorhandene Chanda-Typen
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chandaTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {type.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {type.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chandaTypes.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Keine Chanda-Typen gefunden
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
