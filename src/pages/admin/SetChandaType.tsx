import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ChandaType {
  id?: string;
  name: string;
  description: string;
  charity_end?: string;
}

export default function SetChandaType() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [chandaTypes, setChandaTypes] = useState<ChandaType[]>([]);
  const [formData, setFormData] = useState<ChandaType>({
    name: '',
    description: '',
    charity_end: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChandaType>({ name: '', description: '', charity_end: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');

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
      setFormData({ name: '', description: '', charity_end: '' });
      fetchChandaTypes();
    } catch (error) {
      console.error('Error adding chanda type:', error);
      setMessage({ text: 'Fehler beim Hinzufügen des Chanda-Typs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (type: ChandaType) => {
    setEditingId(type.id || null);
    setEditForm({ name: type.name, description: type.description, charity_end: type.charity_end || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', charity_end: '' });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name.trim() || !editForm.description.trim()) {
      setMessage({ text: 'Name und Beschreibung dürfen nicht leer sein', type: 'error' });
      return;
    }

    try {
      const updateData: any = { 
        name: editForm.name, 
        description: editForm.description 
      };
      
      if (editForm.charity_end) {
        updateData.charity_end = editForm.charity_end;
      }

      const { error } = await supabase
        .from('chanda_types')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setMessage({ text: 'Chanda-Typ erfolgreich aktualisiert', type: 'success' });
      setEditingId(null);
      setEditForm({ name: '', description: '', charity_end: '' });
      fetchChandaTypes();
    } catch (error) {
      console.error('Error updating chanda type:', error);
      setMessage({ text: 'Fehler beim Aktualisieren des Chanda-Typs', type: 'error' });
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeleteTargetName('');
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    setDeletingId(deleteTargetId);
    try {
      const { error } = await supabase
        .from('chanda_types')
        .delete()
        .eq('id', deleteTargetId);

      if (error) throw error;

      setMessage({ text: 'Chanda-Typ erfolgreich gelöscht', type: 'success' });
      closeDeleteModal();
      fetchChandaTypes();
    } catch (error) {
      console.error('Error deleting chanda type:', error);
      setMessage({ text: 'Fehler beim Löschen des Chanda-Typs', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endzahldatum (Optional)
                </label>
                <input
                  type="date"
                  name="charity_end"
                  value={formData.charity_end}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Stichtag bis wann die Spende bezahlt werden muss</p>
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
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endzahldatum
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chandaTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      {editingId === type.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={2}
                              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="date"
                              value={editForm.charity_end || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, charity_end: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdate(type.id!)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {type.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {type.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {type.charity_end 
                              ? new Date(type.charity_end).toLocaleDateString('de-DE')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(type)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Bearbeiten"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 0 0 0-3.714Z" />
                                  <path d="M19.513 8.199 15.8 4.486 4.772 15.514a5.25 5.25 0 0 0-1.32 2.214l-.8 2.401a.75.75 0 0 0 .948.948l2.401-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openDeleteModal(type.id!, type.name)}
                                disabled={deletingId === type.id}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                title="Löschen"
                              >
                                {deletingId === type.id ? (
                                  <span className="text-xs">...</span>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Chanda-Typ löschen?
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                Möchten Sie den Chanda-Typ <span className="font-semibold">"{deleteTargetName}"</span> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingId !== null ? 'Löschen...' : 'Löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
