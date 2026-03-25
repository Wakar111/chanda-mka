import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function OnlineSpenden() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Online Spenden
            </h1>
            <p className="text-gray-600 text-lg">
              Hier finden Sie alle Informationen und Links zu den verschiedenen
              Online-Spendenmöglichkeiten der Ahmadiyya Muslim Jamaat
              Deutschland.
            </p>
          </div>

          {/* Maal Ahmadiyya - Allgemeine Gemeinde Spenden */}
          <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
              onClick={() => toggleSection("maal")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Maal Ahmadiyya
                    </h2>
                    <p className="text-blue-100">Allgemeine Gemeinde Spenden</p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-white transition-transform ${expandedSection === "maal" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {expandedSection === "maal" && (
              <div className="p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Was ist Maal Ahmadiyya?
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Über das Maal Ahmadiyya Online-Portal können Sie Ihre
                      regelmäßigen Chanda-Zahlungen (Gemeindebeiträge) bequem
                      online tätigen. Dies umfasst verschiedene Chanda-Arten wie
                      Chanda Aam, Jalsa Salana, Tahrik-e-Jadid und viele
                      weitere.
                    </p>
                    <a
                      href="https://maal-ahmadiyya.de/maalnew/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      maal-ahmadiyya.de/maalnew
                    </a>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Wie funktioniert es?
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>
                        Besuchen Sie die{" "}
                        <a
                          href="https://maal-ahmadiyya.de/maalnew/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Maal Ahmadiyya Online-Plattform
                        </a>
                      </li>
                      <li>
                        Geben Sie Ihre persönlichen Daten ein (Name, Jamaat ID,
                        etc.)
                      </li>
                      <li>
                        Wählen Sie die gewünschten Chanda-Arten aus der Liste
                      </li>
                      <li>
                        Nutzen Sie den Chanda-Rechner für automatische
                        Berechnungen (z.B. für Moosi)
                      </li>
                      <li>
                        Geben Sie die Beträge ein und überprüfen Sie die
                        Gesamtsumme
                      </li>
                      <li>Schließen Sie die Zahlung ab</li>
                      <li>Sie erhalten eine Quittung per E-Mail</li>
                      <li>
                        Ihr Sadar Jamaat/Sekretär Maal erhält ebenfalls eine
                        Kopie
                      </li>
                    </ol>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Verfügbare Chanda-Arten
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
                      <span>• Chanda Aam</span>
                      <span>• Jalsa Salana</span>
                      <span>• Tahrik-e-Jadid</span>
                      <span>• Waqf-e-Jadid</span>
                      <span>• Tuluba Rabwah</span>
                      <span>• Qadian Student</span>
                      <span>• Taalimi Fund</span>
                      <span>• Dar-ul-Yatama</span>
                      <span>• Humanity First</span>
                      <span>• und viele weitere...</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Kontakt
                    </h3>
                    <div className="space-y-1 text-gray-700">
                      <p>
                        <strong>Maal Abteilung:</strong> 069 - 506 88 681
                      </p>
                      <p>
                        <strong>E-Mail:</strong> maal@maal-ahmadiyya.de
                      </p>
                      <p>
                        <strong>Steuer Bescheinigung:</strong> 069 - 506 88 684
                      </p>
                      <p>
                        <strong>E-Mail:</strong> st-bescheinigung@ahmadiyya.de
                      </p>
                      <p>
                        <strong>Chanda Online:</strong> 069 - 506 88 888
                      </p>
                      <p>
                        <strong>E-Mail:</strong> coz@maal-ahmadiyya.de
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://maal-ahmadiyya.de/maalnew/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    Zur Maal Ahmadiyya Online-Plattform →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* MKAD - Khuddam Spenden */}
          <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-600 to-green-700 p-6 cursor-pointer hover:from-green-700 hover:to-green-800 transition-all"
              onClick={() => toggleSection("khuddam")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      MKAD Maal Online
                    </h2>
                    <p className="text-green-100">
                      Majlis Khuddam-ul-Ahmadiyya Spenden
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-white transition-transform ${expandedSection === "khuddam" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {expandedSection === "khuddam" && (
              <div className="p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Was ist MKAD Maal Online?
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Das MKAD Maal Online-Portal ist speziell für Mitglieder
                      der Majlis Khuddam-ul-Ahmadiyya Deutschland konzipiert.
                      Hier können Khuddam ihre spezifischen Chanda-Beiträge
                      online zahlen, die für die Aktivitäten und Programme der
                      Khuddam-Organisation verwendet werden.
                    </p>
                    <a
                      href="https://software.khuddam.de/maalonline/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      software.khuddam.de/maalonline
                    </a>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Wie funktioniert es?
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>
                        Öffnen Sie das{" "}
                        <a
                          href="https://software.khuddam.de/maalonline/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          MKAD Maal Online-Portal
                        </a>
                      </li>
                      <li>
                        Füllen Sie das Chanda-Formular mit Ihren persönlichen
                        Informationen aus
                      </li>
                      <li>
                        Geben Sie Ihre Jamaat-Zugehörigkeit und Kontaktdaten an
                      </li>
                      <li>
                        Wählen Sie die Khuddam-spezifischen Chanda-Arten aus
                      </li>
                      <li>Geben Sie die gewünschten Beträge ein</li>
                      <li>Überprüfen Sie Ihre Angaben</li>
                      <li>Führen Sie die Zahlung durch</li>
                      <li>Erhalten Sie eine Bestätigung per E-Mail</li>
                    </ol>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Für wen ist es gedacht?
                    </h3>
                    <p className="text-gray-700">
                      Dieses Portal ist ausschließlich für Mitglieder der Majlis
                      Khuddam-ul-Ahmadiyya Deutschland (männliche Mitglieder
                      zwischen 15 und 40 Jahren). Es ermöglicht die einfache und
                      sichere Online-Zahlung von Khuddam-spezifischen Beiträgen.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-blue-800">
                        <strong>Hinweis:</strong> Dieses Portal ist speziell für
                        Khuddam-Mitglieder. Für allgemeine Gemeindebeiträge
                        nutzen Sie bitte das Maal Ahmadiyya Portal.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://software.khuddam.de/maalonline/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    Zum MKAD Maal Online-Portal →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Humanity First - Freiwillige Spenden */}
          <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-600 to-red-700 p-6 cursor-pointer hover:from-red-700 hover:to-red-800 transition-all"
              onClick={() => toggleSection("humanity")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Humanity First
                    </h2>
                    <p className="text-red-100">Humanitäre Hilfsorganisation</p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-white transition-transform ${expandedSection === "humanity" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {expandedSection === "humanity" && (
              <div className="p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Was ist Humanity First?
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Humanity First Deutschland e.V. ist eine internationale
                      humanitäre Hilfsorganisation der Ahmadiyya Muslim Jamaat.
                      Die Organisation leistet weltweit Katastrophenhilfe,
                      Entwicklungshilfe und unterstützt Menschen in Not -
                      unabhängig von Religion, Rasse oder Nationalität.
                    </p>
                    <a
                      href="https://humanityfirst.de/spenden/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      humanityfirst.de/spenden
                    </a>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Wofür werden die Spenden verwendet?
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Katastrophenhilfe bei Naturkatastrophen weltweit</li>
                      <li>Medizinische Versorgung in Krisengebieten</li>
                      <li>Bildungsprojekte in Entwicklungsländern</li>
                      <li>Wasserversorgungsprojekte</li>
                      <li>Nahrungsmittelhilfe für Bedürftige</li>
                      <li>Wiederaufbauprojekte nach Katastrophen</li>
                      <li>Flüchtlingshilfe</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Wie kann ich spenden?
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Online-Spende:
                        </p>
                        <p className="text-gray-700 text-sm">
                          Besuchen Sie die{" "}
                          <a
                            href="https://humanityfirst.de/spenden/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Humanity First Webseite
                          </a>{" "}
                          und nutzen Sie das Online-Spendenformular für eine
                          schnelle und sichere Spende.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Banküberweisung:
                        </p>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                          <p>
                            <strong>Empfänger:</strong> Humanity First
                            Deutschland e.V.
                          </p>
                          <p>
                            <strong>IBAN:</strong> DE72 5019 0000 0500 2846 76
                          </p>
                          <p>
                            <strong>BIC:</strong> FFVBDEFF
                          </p>
                          <p>
                            <strong>Bank:</strong> Frankfurter Volksbank
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Zuwendungsbestätigung
                    </h3>
                    <p className="text-gray-700">
                      Benötigen Sie eine Zuwendungsbestätigung
                      (Spendenbescheinigung) für Ihre Steuererklärung? Diese
                      können Sie direkt über die Webseite anfordern. Humanity
                      First Deutschland e.V. ist als gemeinnützig anerkannt,
                      sodass Ihre Spenden steuerlich absetzbar sind.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      Kontakt
                    </h3>
                    <p className="text-gray-700">
                      <strong>E-Mail:</strong> info@humanityfirst.de
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        <strong>Wichtig:</strong> Humanity First ist eine
                        freiwillige Hilfsorganisation. Spenden an Humanity First
                        sind zusätzlich zu den regulären Chanda-Beiträgen und
                        vollkommen freiwillig.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://humanityfirst.de/spenden/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    Zur Humanity First Spendenseite →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 text-sm">
              Alle Spenden sind sicher und werden ausschließlich für die
              angegebenen Zwecke verwendet. Bei Fragen wenden Sie sich bitte an
              die jeweiligen Kontaktstellen.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
