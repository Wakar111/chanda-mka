import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { chandaRates } from '../../data/chandaInfo';

export default function Info() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Information über Chanda
          </h1>

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
