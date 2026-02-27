import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { chandaRates } from '../../data/chandaInfo';
import { supabase } from '../../supabaseClient';

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
}

export default function Info() {
  const [jamaatSettings, setJamaatSettings] = useState<JamaatSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJamaatSettings();
  }, []);

  const loadJamaatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('jamaat_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading jamaat settings:', error);
      }

      if (data) {
        setJamaatSettings(data);
      }
    } catch (error) {
      console.error('Error loading jamaat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Information über Lokale Jamaat
          </h1>

         {/* Jamaat Information Section */}
          {!loading && jamaatSettings && (
            <section className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Unsere Jamaat - {jamaatSettings.jamaat_name}
              </h2>
              
              <div className="space-y-6">

                {/* Address Information */}
                {(jamaatSettings.street || jamaatSettings.city || jamaatSettings.postal_code) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Anschrift
                    </h4>
                    <div className="text-gray-600 ml-7">
                      {jamaatSettings.street && <p>{jamaatSettings.street}</p>}
                      {(jamaatSettings.postal_code || jamaatSettings.city) && (
                        <p>{jamaatSettings.postal_code} {jamaatSettings.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Information */}
                {jamaatSettings.phone && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Telefon
                    </h4>
                    <p className="text-gray-600 ml-7">{jamaatSettings.phone}</p>
                  </div>
                )}

                {/* Member Statistics */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Mitgliederstatistik
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-7">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Gesamt</p>
                      <p className="text-2xl font-bold text-blue-600">{jamaatSettings.total_members}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Ansar</p>
                      <p className="text-2xl font-bold text-green-600">{jamaatSettings.ansar_count}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Khuddam</p>
                      <p className="text-2xl font-bold text-purple-600">{jamaatSettings.khuddam_count}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Tifl</p>
                      <p className="text-2xl font-bold text-yellow-600">{jamaatSettings.tifl_count}</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Lajna</p>
                      <p className="text-2xl font-bold text-pink-600">{jamaatSettings.lajna_count}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Nazarat</p>
                      <p className="text-2xl font-bold text-indigo-600">{jamaatSettings.nazarat_count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Was ist Chanda?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Chanda ist ein System des finanziellen Opfers in der Ahmadiyya Muslim Jamaat. 
                Es basiert auf dem islamischen Prinzip der freiwilligen Spende zur Unterstützung 
                der Gemeinschaft und ihrer wohltätigen Aktivitäten.
              </p>
            </section>

            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Arten von Chanda
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chandaRates.map((chanda, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">{chanda.name}</h3>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-600">
                        {chanda.rate}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {chanda.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Verwendung der Spenden
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Bau und Unterhalt von Moscheen</li>
                <li>Bildungsprojekte und Stipendien</li>
                <li>Humanitäre Hilfe weltweit</li>
                <li>Missionsarbeit und Verbreitung des Islam</li>
                <li>Publikationen und Medienarbeit</li>
                <li>Unterstützung bedürftiger Mitglieder</li>
              </ul>
            </section>

            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Wichtige Hinweise
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  • Alle Beiträge sind freiwillig und basieren auf dem Prinzip der Aufrichtigkeit.
                </p>
                <p>
                  • Die Höhe der Beiträge richtet sich nach den finanziellen Möglichkeiten des Einzelnen.
                </p>
                <p>
                  • Transparenz und sorgfältige Verwaltung der Spenden haben höchste Priorität.
                </p>
                <p>
                  • Jedes Mitglied erhält regelmäßige Übersichten über seine Beiträge.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
