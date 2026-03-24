import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Quote {
  id?: string;
  content: string;
  author: string;
  permanent?: boolean;
}

export default function ManageQuotes() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [formData, setFormData] = useState<Quote>({
    content: '',
    author: '',
    permanent: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Quote>({ content: '', author: '', permanent: false });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortPermanent, setSortPermanent] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);
  
  // Auto-hide message after 5s
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('author', { ascending: true });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setMessage({ text: 'Fehler beim Laden der Zitate', type: 'error' });
    }
  };

  const handleSortPermanent = () => {
    if (sortPermanent === null || sortPermanent === 'desc') {
      setSortPermanent('asc');
      const sorted = [...quotes].sort((a, b) => {
        const aVal = a.permanent ? 1 : 0;
        const bVal = b.permanent ? 1 : 0;
        return aVal - bVal;
      });
      setQuotes(sorted);
    } else {
      setSortPermanent('desc');
      const sorted = [...quotes].sort((a, b) => {
        const aVal = a.permanent ? 1 : 0;
        const bVal = b.permanent ? 1 : 0;
        return bVal - aVal;
      });
      setQuotes(sorted);
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
        .from('quotes')
        .insert([formData]);

      if (error) throw error;

      setMessage({ text: 'Zitat erfolgreich hinzugefügt', type: 'success' });
      setFormData({ content: '', author: '', permanent: false });
      setShowAddModal(false);
      fetchQuotes();
    } catch (error) {
      console.error('Error adding quote:', error);
      setMessage({ text: 'Fehler beim Hinzufügen des Zitats', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (quote: Quote) => {
    setEditingId(quote.id || null);
    setEditForm({ content: quote.content, author: quote.author, permanent: quote.permanent || false });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ content: '', author: '', permanent: false });
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.content.trim() || !editForm.author.trim()) {
      setMessage({ text: 'Inhalt und Autor dürfen nicht leer sein', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          content: editForm.content,
          author: editForm.author,
          permanent: editForm.permanent
        })
        .eq('id', id);

      if (error) throw error;

      setMessage({ text: 'Zitat erfolgreich aktualisiert', type: 'success' });
      setEditingId(null);
      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      setMessage({ text: 'Fehler beim Aktualisieren des Zitats', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie dieses Zitat wirklich löschen?')) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ text: 'Zitat erfolgreich gelöscht', type: 'success' });
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      setMessage({ text: 'Fehler beim Löschen des Zitats', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
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

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Motivierende Zitate verwalten
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors"
              >
                + Zitat Hinzufügen
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inhalt
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Autor
                    </th>
                    <th 
                      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={handleSortPermanent}
                    >
                      <div className="flex items-center gap-1">
                        Permanent
                        {sortPermanent && (
                          <span className="text-blue-600">
                            {sortPermanent === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      {editingId === quote.id ? (
                        <>
                          <td className="px-6 py-4 text-sm">
                            <textarea
                              value={editForm.content}
                              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                              rows={3}
                              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              value={editForm.author}
                              onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <input
                              type="checkbox"
                              checked={editForm.permanent || false}
                              onChange={(e) => setEditForm(prev => ({ ...prev, permanent: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdate(quote.id!)}
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
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-md">
                              {quote.content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {quote.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {quote.permanent ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ja
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Nein
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(quote)}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Bearbeiten"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(quote.id!)}
                                disabled={deletingId === quote.id}
                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                title="Löschen"
                              >
                                {deletingId === quote.id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

              {quotes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Zitate vorhanden
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Quote Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">Zitat hinzufügen</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Inhalt des Zitats
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Geben Sie hier das motivierende Zitat ein..."
                    className="w-full rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Autor
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    placeholder="z.B. Khalifat-ul-Masih III"
                    className="w-full rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="permanent"
                    checked={formData.permanent || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, permanent: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="permanent" className="ml-2 block text-xs md:text-sm text-gray-700">
                    Als permanente Nachricht anzeigen (wird nicht zufällig gewechselt)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-full sm:w-auto px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm md:text-base font-medium hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto flex justify-center items-center rounded-lg bg-blue-600 px-4 md:px-6 py-2 font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
                  >
                    {loading ? <LoadingSpinner /> : 'Hinzufügen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
