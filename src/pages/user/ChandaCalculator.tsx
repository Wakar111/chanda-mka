import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface Contribution {
  name: string;
  amount: number;
}

interface KhuddamContribution {
  name: string;
  yearlyAmount: number;
  monthlyAmount: number;
}

export default function ChandaCalculator() {
  const [activeTab, setActiveTab] = useState<'income' | 'khuddam'>('income');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [isMusi, setIsMusi] = useState<boolean>(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [khuddamContributions, setKhuddamContributions] = useState<KhuddamContribution[]>([]);

  const calculatePromisesFromIncome = (income: number, musi: boolean): Contribution[] => {
    const contributionRates: { name: string; percentage: number; applies: boolean }[] = [
      { name: 'Hissa Amad', percentage: 10, applies: musi },
      { name: 'Chanda Aam', percentage: 6.25, applies: !musi },
      { name: 'Jalsa Salana', percentage: 0.833, applies: true },
      { name: 'Majlis', percentage: 1, applies: true },
      { name: 'Ijtema', percentage: 0.208, applies: true },
      { name: 'Ishaat', percentage: 0.2, applies: true }
    ];

    return contributionRates
      .filter(c => c.applies)
      .map(c => ({
        name: c.name,
        amount: Number(((income * c.percentage) / 100).toFixed(2))
      }));
  };

  const calculateKhuddamBudget = (income: number): KhuddamContribution[] => {
    const annualIncome = income * 12;
    
    const contributionRates = [
      { name: 'Majlis Khuddam', percentage: 1.00 },
      { name: 'Ijtema Khuddam', percentage: 0.21 },
      { name: 'Ishaat Khuddam', percentage: 0.02 }
    ];

    return contributionRates.map(c => ({
      name: c.name,
      yearlyAmount: Number(((annualIncome * c.percentage) / 100).toFixed(2)),
      monthlyAmount: Number((((annualIncome * c.percentage) / 100) / 12).toFixed(2))
    }));
  };

  const handleCalculate = () => {
    const income = Number(monthlyIncome);
    
    if (isNaN(income) || income <= 0) {
      alert('Bitte geben Sie ein gültiges Monatseinkommen ein');
      return;
    }

    if (activeTab === 'income') {
      const result = calculatePromisesFromIncome(income, isMusi);
      setContributions(result);
      setKhuddamContributions([]);
    } else {
      const result = calculateKhuddamBudget(income);
      setKhuddamContributions(result);
      setContributions([]);
    }
  };

  const handleReset = () => {
    setMonthlyIncome('');
    setContributions([]);
    setKhuddamContributions([]);
  };

  const getTotalMonthly = (): number => {
    return contributions.reduce((sum, c) => sum + c.amount, 0);
  };

  const getTotalYearly = (): number => {
    return khuddamContributions.reduce((sum, c) => sum + c.yearlyAmount, 0);
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} €`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Chanda Rechner
            </h1>
            <p className="text-gray-600 text-lg">
              Berechnen Sie Ihre monatlichen oder jährlichen Chanda-Beiträge basierend auf Ihrem Einkommen.
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('income');
                  handleReset();
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'income'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Einkommen Budget
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('khuddam');
                  handleReset();
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'khuddam'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Khuddam Budget
              </button>
            </div>

            {/* Income Budget Tab */}
            {activeTab === 'income' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Einkommen Budget</h3>
                  <p className="text-sm text-blue-800">
                    Berechnen Sie Ihre monatlichen Chanda-Beiträge basierend auf Ihrem Monatseinkommen.
                    Die Berechnung berücksichtigt verschiedene Chanda-Arten wie Chanda Aam/Hissa Amad, 
                    Jalsa Salana, Majlis, Ijtema und Ishaat.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monatseinkommen (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="z.B. 2500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="musi-toggle"
                    checked={isMusi}
                    onChange={(e) => setIsMusi(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="musi-toggle" className="ml-2 text-sm font-medium text-gray-700">
                    Ich bin Musi (10% Hissa Amad statt 6.25% Chanda Aam)
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCalculate}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors font-medium"
                  >
                    Berechnen
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Zurücksetzen
                  </button>
                </div>

                {/* Results for Income Budget */}
                {contributions.length > 0 && (
                  <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Berechnete Monatliche Beiträge</h3>
                    <div className="space-y-3">
                      {contributions.map((contribution, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <span className="text-gray-700 font-medium">{contribution.name}</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(contribution.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                        <span className="text-lg font-bold text-gray-800">Gesamt (Monatlich)</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(getTotalMonthly())}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 bg-blue-50 p-3 rounded-lg">
                        <span className="text-base font-bold text-gray-800">Gesamt (Jährlich)</span>
                        <span className="text-base font-bold text-blue-700">{formatCurrency(getTotalMonthly() * 12)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Khuddam Budget Tab */}
            {activeTab === 'khuddam' && (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Khuddam Budget</h3>
                  <p className="text-sm text-green-800">
                    Berechnen Sie Ihre jährlichen Khuddam-spezifischen Chanda-Beiträge basierend auf 
                    Ihrem Monatseinkommen. Dies umfasst Majlis Khuddam, Ijtema Khuddam und Ishaat Khuddam.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monatseinkommen (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="z.B. 2500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCalculate}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors font-medium"
                  >
                    Berechnen
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Zurücksetzen
                  </button>
                </div>

                {/* Results for Khuddam Budget */}
                {khuddamContributions.length > 0 && (
                  <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Berechnete Khuddam Beiträge</h3>
                    <div className="space-y-3">
                      {khuddamContributions.map((contribution, index) => (
                        <div key={index} className="py-3 border-b border-gray-200 last:border-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-700 font-medium">{contribution.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Jährlich:</span>
                              <span className="text-gray-900 font-semibold">{formatCurrency(contribution.yearlyAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Monatlich:</span>
                              <span className="text-gray-900 font-semibold">{formatCurrency(contribution.monthlyAmount)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                        <span className="text-lg font-bold text-gray-800">Gesamt (Jährlich)</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(getTotalYearly())}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 bg-green-50 p-3 rounded-lg">
                        <span className="text-base font-bold text-gray-800">Gesamt (Monatlich)</span>
                        <span className="text-base font-bold text-green-700">{formatCurrency(getTotalYearly() / 12)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Information Box */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Wichtige Informationen</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Einkommen Budget:</strong> Berechnet monatliche Beiträge für allgemeine Chanda-Arten 
                basierend auf Ihrem Monatseinkommen.
              </p>
              <p>
                <strong>Khuddam Budget:</strong> Berechnet jährliche Beiträge für Khuddam-spezifische Chanda-Arten 
                basierend auf Ihrem Jahreseinkommen (Monatseinkommen × 12).
              </p>
              <p>
                <strong>Musi:</strong> Wenn Sie Musi sind, wird Hissa Amad (10%) statt Chanda Aam (6.25%) berechnet.
              </p>
              <p className="text-blue-600 font-medium">
                Diese Berechnung dient nur zur Orientierung. Die tatsächlichen Beiträge können je nach 
                individueller Situation variieren.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
