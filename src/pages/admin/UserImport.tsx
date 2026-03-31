import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminLayout from '../../components/AdminLayout';
import * as XLSX from 'xlsx';

interface UserData {
  email: string;
  name: string;
  surname: string;
  jamaatID: string;
  jamaat: string;
  phone: string;
  date_of_birth: string;
  address: string;
  profession: string;
  gender: string;
  musi: boolean;
  row: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; email: string; error: string }[];
}

export default function UserImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<UserData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row and parse data
        const users: UserData[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length > 0 && row[0]) { // Skip empty rows
            users.push({
              email: String(row[0] || '').trim(),
              name: String(row[1] || '').trim(),
              surname: String(row[2] || '').trim(),
              jamaatID: String(row[3] || '').trim(),
              jamaat: String(row[4] || '').trim(),
              phone: String(row[5] || '').trim(),
              date_of_birth: String(row[6] || '').trim(),
              address: String(row[7] || '').trim(),
              profession: String(row[8] || '').trim(),
              gender: String(row[9] || '').toLowerCase().trim(),
              musi: String(row[10] || '').toLowerCase() === 'ja' || String(row[10] || '').toLowerCase() === 'yes' || String(row[10] || '').toLowerCase() === 'true',
              row: i + 1
            });
          }
        }
        setPreview(users);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Fehler beim Lesen der Excel-Datei. Bitte überprüfen Sie das Format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateUser = (user: UserData): string | null => {
    if (!user.email || !user.email.includes('@')) {
      return 'Ungültige E-Mail-Adresse';
    }
    if (!user.name) {
      return 'Name fehlt';
    }
    if (!user.surname) {
      return 'Nachname fehlt';
    }
    if (!user.jamaatID) {
      return 'Jamaat ID fehlt';
    }
    if (!user.jamaat) {
      return 'Jamaat fehlt';
    }
    if (!user.gender || (user.gender !== 'male' && user.gender !== 'female')) {
      return 'Geschlecht muss "male" oder "female" sein';
    }
    return null;
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      alert('Keine Benutzer zum Importieren gefunden');
      return;
    }

    setImporting(true);
    const errors: { row: number; email: string; error: string }[] = [];
    let successCount = 0;

    for (const user of preview) {
      try {
        // Validate user data
        const validationError = validateUser(user);
        if (validationError) {
          errors.push({
            row: user.row,
            email: user.email,
            error: validationError
          });
          continue;
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from('users')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();

        if (existingEmail) {
          errors.push({
            row: user.row,
            email: user.email,
            error: 'E-Mail-Adresse bereits registriert'
          });
          continue;
        }

        // Check if jamaatID already exists
        const { data: existingJamaatID } = await supabase
          .from('users')
          .select('jamaatID')
          .eq('jamaatID', user.jamaatID)
          .maybeSingle();

        if (existingJamaatID) {
          errors.push({
            row: user.row,
            email: user.email,
            error: `Jamaat ID "${user.jamaatID}" bereits vergeben`
          });
          continue;
        }

        // Insert user data into users table WITHOUT creating auth account
        // Users will self-register later using the registration page
        // Convert phone string to number for int8 database field
        const phoneNumber = user.phone ? parseInt(user.phone.replace(/\s+/g, '').replace(/\+/g, ''), 10) : null;
        // Calculate age from date of birth
        const ageNumber = user.date_of_birth ? calculateAge(user.date_of_birth) : null;
        
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            // Don't set id - it will be auto-generated and updated during registration
            email: user.email,
            name: user.name,
            surname: user.surname,
            jamaatID: user.jamaatID,
            jamaat: user.jamaat,
            phone: phoneNumber,
            gender: user.gender,
            musi: user.musi,
            role: 'user', // Default role
            date_of_birth: user.date_of_birth || null,
            age: ageNumber,
            address: user.address || null,
            profession: user.profession || null
          });

        if (dbError) {
          errors.push({
            row: user.row,
            email: user.email,
            error: `Datenbank-Fehler: ${dbError.message}`
          });
          continue;
        }

        successCount++;
      } catch (error: any) {
        errors.push({
          row: user.row,
          email: user.email,
          error: error.message || 'Unbekannter Fehler'
        });
      }
    }

    setResult({
      success: successCount,
      failed: errors.length,
      errors
    });
    setImporting(false);
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      ['Email', 'Name', 'Nachname', 'JamaatID', 'Jamaat', 'Phone', 'Geburtsdatum', 'Adresse', 'Beruf', 'Gender', 'Musi'],
      ['max.mustermann@example.com', 'Max', 'Mustermann', 'J001', 'Frankfurt', '+49123456789', '1990-05-15', 'Musterstraße 1, 60311 Frankfurt', 'Ingenieur', 'male', 'Nein'],
      ['erika.musterfrau@example.com', 'Erika', 'Musterfrau', 'J002', 'Frankfurt', '+49987654321', '1985-08-22', 'Beispielweg 10, 60313 Frankfurt', 'Lehrerin', 'female', 'Ja']
    ];

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Email
      { wch: 15 }, // Name
      { wch: 15 }, // Surname
      { wch: 10 }, // JamaatID
      { wch: 15 }, // Jamaat
      { wch: 15 }, // Phone
      { wch: 12 }, // Geburtsdatum
      { wch: 30 }, // Adresse
      { wch: 15 }, // Beruf
      { wch: 10 }, // Gender
      { wch: 8 }   // Musi
    ];

    // Download file
    XLSX.writeFile(wb, 'user_import_template.xlsx');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Nutzer importieren</h1>
          <p className="text-gray-600">
            Importieren Sie mehrere Benutzer gleichzeitig über eine Excel-Datei.
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Excel-Datei hochladen</h2>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Excel-Datei auswählen
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Unterstützte Formate: .xlsx, .xls
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{file.name}</span>
                <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>
        </div>

        {/* Template Download */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Excel-Vorlage herunterladen</h3>
              <p className="text-sm text-gray-700 mb-4">
                Laden Sie die Excel-Vorlage herunter, füllen Sie sie mit den Benutzerdaten aus und laden Sie sie hier hoch.
                Die Vorlage enthält alle erforderlichen Spalten mit Beispieldaten.
              </p>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Vorlage herunterladen
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Vorschau ({preview.length} Benutzer)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zeile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nachname</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jamaat ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jamaat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geburtsdatum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beruf</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geschlecht</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Musi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(0, 10).map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.row}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.surname}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.jamaatID}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.jamaat}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.date_of_birth}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.address}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.profession}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{user.gender}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.musi ? (
                          <span className="text-green-600 font-medium">Ja</span>
                        ) : (
                          <span className="text-gray-500">Nein</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  ... und {preview.length - 10} weitere Benutzer
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {importing ? 'Importiere...' : `${preview.length} Benutzer importieren`}
              </button>
              <button
                onClick={handleReset}
                disabled={importing}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Import-Ergebnis</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">Erfolgreich</p>
                <p className="text-3xl font-bold text-green-700">{result.success}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium mb-1">Fehlgeschlagen</p>
                <p className="text-3xl font-bold text-red-700">{result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Fehler-Details:</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-red-900">
                        Zeile {error.row}: {error.email}
                      </p>
                      <p className="text-red-700 mt-1">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Anleitung</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>1.</strong> Laden Sie die Excel-Vorlage herunter</p>
            <p><strong>2.</strong> Füllen Sie die Vorlage mit den Benutzerdaten aus:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Email:</strong> Gültige E-Mail-Adresse (erforderlich)</li>
              <li><strong>Name:</strong> Vorname des Benutzers (erforderlich)</li>
              <li><strong>Nachname:</strong> Nachname des Benutzers (erforderlich)</li>
              <li><strong>JamaatID:</strong> Eindeutige Jamaat-ID (erforderlich)</li>
              <li><strong>Jamaat:</strong> Name der Jamaat (erforderlich)</li>
              <li><strong>Phone:</strong> Telefonnummer, z.B. +49123456789 (optional)</li>
              <li><strong>Geburtsdatum:</strong> Format YYYY-MM-DD, z.B. 1990-05-15 (optional)</li>
              <li><strong>Adresse:</strong> Vollständige Adresse (optional)</li>
              <li><strong>Beruf:</strong> Berufsbezeichnung (optional)</li>
              <li><strong>Gender:</strong> "male" oder "female" (erforderlich)</li>
              <li><strong>Musi:</strong> "Ja" oder "Nein" (erforderlich)</li>
            </ul>
            <p><strong>3.</strong> Laden Sie die ausgefüllte Excel-Datei hoch</p>
            <p><strong>4.</strong> Überprüfen Sie die Vorschau</p>
            <p><strong>5.</strong> Klicken Sie auf "Importieren"</p>
            
            <div className="bg-gray-50 p-3 rounded-lg mt-4">
              <p className="font-semibold text-gray-800 mb-2">Automatisch berechnete/gesetzte Felder:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>Rolle:</strong> Automatisch auf "user" gesetzt</li>
                <li><strong>Alter:</strong> Wird automatisch aus dem Geburtsdatum berechnet</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="font-semibold text-blue-900 mb-2">🔐 Self-Service Registrierung</p>
              <p className="text-sm text-blue-800">
                <strong>Wichtig:</strong> Importierte Benutzer erhalten KEINEN automatischen Account. 
                Sie müssen sich selbst über die Registrierungsseite registrieren, indem sie ihre 
                <strong> Jamaat-ID</strong> und <strong>E-Mail-Adresse</strong> eingeben. 
                Nach der E-Mail-Verifizierung können sie ihr eigenes Passwort festlegen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
