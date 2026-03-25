import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChandaType {
  id: string;
  name: string;
  description: string;
  charity_end?: string;
}

interface Payment {
  id: string;
  promise_id: string;
  amount: number;
  payment_date: string;
}

interface Promise {
  id: string;
  user_id: string;
  chanda_type_id: string;
  year: number;
  promise: number;
  spende_ends: string;
  chanda_types: ChandaType;
  payments?: Payment[];
  lastPaymentDate?: string;
}

interface User {
  id: string;
  jamaatID: string;
  name: string;
  surname: string;
  email: string;
  jamaat: string;
  phone: string;
  musi: boolean;
  profession: string;
  role: string;
  gender: string;
}

interface PromisePDFExportProps {
  user: User;
  promises: Promise[];
  selectedYear: number;
  totalPromise: number;
  totalPaid: number;
  totalUnpaid: number;
}

const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} €`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
};

const getTotalPaid = (promise: Promise): number => {
  if (!promise.payments || promise.payments.length === 0) return 0;
  return promise.payments.reduce((sum, payment) => sum + payment.amount, 0);
};

export const exportPromisesToPDF = (props: PromisePDFExportProps) => {
  const { user, promises, selectedYear, totalPromise, totalPaid, totalUnpaid } = props;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header Section
  const headerY = 10;
  
  // Organization Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Majlis Khuddam-ul-Ahmadiyya', pageWidth / 2, headerY + 5, { align: 'center' });
  
  // Document Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Versprechen Übersicht', pageWidth / 2, headerY + 11, { align: 'center' });
  
  // Date on the right side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - 14, headerY + 5, { align: 'right' });
  
  // Header line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, headerY + 16, pageWidth - 14, headerY + 16);
  
  // Reset text color to black
  doc.setTextColor(0, 0, 0);
  
  // User Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${user.name} ${user.surname}`, 14, 40);
  doc.text(`Jamaat ID: ${user.jamaatID}`, 14, 47);
  doc.text(`Jahr: ${selectedYear}`, 14, 54);
  
  // Summary Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Zusammenfassung', 14, 70);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gesamt Versprechen: ${formatCurrency(totalPromise)}`, 14, 80);
  doc.text(`Gesamt Bezahlt: ${formatCurrency(totalPaid)}`, 14, 87);
  doc.text(`Noch zu zahlen: ${formatCurrency(totalUnpaid)}`, 14, 94);
  
  // Promises Table
  const tableData = promises.map(promise => {
    const paid = getTotalPaid(promise);
    const remaining = promise.promise - paid;
    const status = remaining <= 0 ? 'Bezahlt' : 'Offen';
    
    return [
      promise.chanda_types.name,
      formatCurrency(promise.promise),
      formatCurrency(paid),
      formatCurrency(remaining),
      status,
      promise.lastPaymentDate ? formatDate(promise.lastPaymentDate) : '-'
    ];
  });
  
  autoTable(doc, {
    startY: 105,
    head: [['Chanda Typ', 'Versprechen', 'Bezahlt', 'Offen', 'Status', 'Letzte Zahlung']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 25;
    
    // Footer line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, pageWidth - 14, footerY);
    
    // Organization name
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Majlis Khuddam-ul-Ahmadiyya', pageWidth / 2, footerY + 6, { align: 'center' });
    
    // Contact info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Gemeinde Deutschland', pageWidth / 2, footerY + 11, { align: 'center' });
    
    // Page number
    doc.setFontSize(7);
    doc.text(
      `Seite ${i} von ${pageCount}`,
      pageWidth - 14,
      footerY + 16,
      { align: 'right' }
    );
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }
  
  // Generate filename: name_jamaatID_year.pdf
  const filename = `${user.name}_${user.jamaatID}_${selectedYear}.pdf`;
  
  // Save PDF
  doc.save(filename);
};

interface PDFExportButtonProps {
  user: User;
  promises: Promise[];
  selectedYear: number;
  totalPromise: number;
  totalPaid: number;
  totalUnpaid: number;
  disabled?: boolean;
}

export default function PDFExportButton(props: PDFExportButtonProps) {
  const { user, promises, selectedYear, totalPromise, totalPaid, totalUnpaid, disabled } = props;

  const handleExport = () => {
    exportPromisesToPDF({
      user,
      promises,
      selectedYear,
      totalPromise,
      totalPaid,
      totalUnpaid
    });
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || promises.length === 0}
      className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-colors text-xs md:text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      title="Als PDF exportieren"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      PDF Export
    </button>
  );
}
