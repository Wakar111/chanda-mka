import { useState } from 'react';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
}

interface ChandaCardProps {
  chanda: {
    id: string;
    name: string;
    description: string;
    promise: number;
    paid_in: number;
    spende_ends: string;
  };
  payments: Payment[];
}

export default function ChandaCard({ chanda, payments }: ChandaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const progress = chanda.promise ? (chanda.paid_in / chanda.promise) * 100 : 0;
  const lastPayment = payments.length > 0 
    ? new Date(payments[0].payment_date).toLocaleDateString('de-DE')
    : 'No payments yet';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {chanda.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Last Payment: {lastPayment}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-800">
              {chanda.paid_in} €
            </p>
            <p className="text-sm text-gray-600">
              of {chanda.promise ? `${chanda.promise} €` : 'Freiwillig'}
            </p>
          </div>
        </div>

        {chanda.promise > 0 && (
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Due date: {formatDate(chanda.spende_ends)}
          </span>
          <button
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="mt-4">
            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600">{chanda.description}</p>
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Payment History</h3>
            <div className="space-y-2">
              {payments.length > 0 ? (
                payments.map(payment => (
                  <div 
                    key={payment.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-600">
                      {formatDate(payment.payment_date)}
                    </span>
                    <span className="font-medium text-gray-800">
                      {payment.amount} €
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No payment history available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
