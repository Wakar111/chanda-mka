import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';

interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
}

export default function Benachrichtigung() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [users, setUsers] = useState<User[]>([]);
  
  // Email Form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Auto-hide message after 5s
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, surname, email, role');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ text: 'Fehler beim Laden der Benutzer', type: 'error' });
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.surname.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const toggleRecipient = (email: string) => {
    setSelectedRecipients(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const removeRecipient = (email: string) => {
    setSelectedRecipients(prev => prev.filter(e => e !== email));
  };

  const selectAllUsers = () => {
    setSelectedRecipients(users.map(u => u.email));
    setShowDropdown(false);
  };

  const handleEmailSend = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      setMessage({ text: 'Bitte füllen Sie Betreff und Nachricht aus', type: 'error' });
      return;
    }

    if (selectedRecipients.length === 0) {
      setMessage({ text: 'Bitte wählen Sie mindestens einen Empfänger aus', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          recipients: selectedRecipients
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mail');
      }

      setMessage({ 
        text: `✅ ${data.message}`, 
        type: 'success' 
      });
      setEmailSubject('');
      setEmailBody('');
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Error sending emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setMessage({ 
        text: `❌ ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Benachrichtigungen
          </h1>

          {/* Success/Error Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-600' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          {/* Email Section */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">E-Mail an Jamaat</h2>
              </div>

              <div className="space-y-4">
                {/* Recipient Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      An (Empfänger auswählen)
                    </label>
                    <button
                      type="button"
                      onClick={selectAllUsers}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Alle auswählen ({users.length})
                    </button>
                  </div>

                  {/* Selected Recipients Tags */}
                  {selectedRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedRecipients.map(email => {
                        const user = users.find(u => u.email === email);
                        return (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {user ? `${user.name} ${user.surname}` : email}
                            <button
                              onClick={() => removeRecipient(email)}
                              className="hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Suchen Sie nach Name oder E-Mail..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    
                    {/* Dropdown with user list */}
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                          <>
                            <div className="sticky top-0 bg-gray-50 px-3 py-2 text-xs text-gray-600 border-b">
                              {filteredUsers.length} Benutzer gefunden
                            </div>
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => toggleRecipient(user.email)}
                                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${
                                  selectedRecipients.includes(user.email) ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name} {user.surname}
                                  </div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                                {selectedRecipients.includes(user.email) && (
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            Keine Benutzer gefunden
                          </div>
                        )}
                        <div className="sticky bottom-0 bg-gray-50 px-3 py-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowDropdown(false)}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            Schließen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRecipients.length} Empfänger ausgewählt
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="E-Mail Betreff"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachricht
                  </label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={6}
                    placeholder="Geben Sie Ihre E-Mail-Nachricht ein..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleEmailSend}
                  disabled={loading || selectedRecipients.length === 0}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? 'Wird gesendet...' 
                    : `E-Mail an ${selectedRecipients.length} Empfänger senden`
                  }
                </button>

                <p className="text-xs text-gray-500">
                  Hinweis: E-Mails werden direkt über Gmail versendet. Wählen Sie Empfänger aus der Liste oben aus.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="max-w-3xl mx-auto mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Statistiken</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Gesamt Mitglieder</p>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.role === 'user').length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
