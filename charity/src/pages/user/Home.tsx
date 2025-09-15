import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface UserInfo {
  name: string;
  surname: string;
  jamaatID: string;
  jamaat: string;
  role: string;
}

interface ChandaItem {
  id: string;
  name: string;
  description: string;
  promise: number;
  paid_in: number;
  spende_ends: string;
}

export default function Home() {
  const [chandaItems, setChandaItems] = useState<ChandaItem[]>([]);
  const [selectedChanda, setSelectedChanda] = useState<ChandaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchUserInfo();
    fetchChandaData();
  }, []);

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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('chanda')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      setChandaItems(data || []);
    } catch (error) {
      console.error('Error fetching chanda data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Dein Jahres Übersicht
          </h1>

          <div className="space-y-4">
            {chandaItems.map((chanda) => {
              const progress = chanda.promise ? (chanda.paid_in / chanda.promise) * 100 : 0;
              
              return (
                <div
                  key={chanda.id}
                  onClick={() => setSelectedChanda(chanda)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">
                    {chanda.name}
                  </h2>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">
                      {chanda.promise ? `Versprochen: ${chanda.promise}` : 'Freiwillig'}
                    </span>
                    <span className="text-gray-600">
                      Bezahlt: {chanda.paid_in}
                    </span>
                  </div>
                  {chanda.promise > 0 && (
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {selectedChanda && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">{selectedChanda.name}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 block">Beschreibung</label>
                  <p className="text-gray-800">{selectedChanda.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-600 block">Versprochen</label>
                    <span className="text-gray-800 font-semibold">
                      {selectedChanda.promise || 'Freiwillig'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-sm text-gray-600 block">Bezahlt</label>
                    <span className="text-gray-800 font-semibold">
                      {selectedChanda.paid_in}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-sm text-gray-600 block">Enddatum</label>
                  <span className="text-gray-800 font-semibold">
                    {formatDate(selectedChanda.spende_ends)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedChanda(null)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
