import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@shared/schema';
import { Language, translations } from '@/lib/translations';

export function generateInvoicePDF(invoice: Invoice, language: Language = 'en'): void {
  const t = translations[language];
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text(t.invoice, 20, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t.invoice} #${invoice.invoiceNumber}`, 20, 40);
  doc.text(`${t.date}: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Company info (right side)
  doc.text(t.businessName, 140, 30);
  doc.text(t.businessEmail, 140, 35);
  
  // Client info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(t.billTo, 20, 60);
  doc.setFontSize(10);
  doc.text(invoice.clientName, 20, 67);
  doc.text(invoice.clientEmail, 20, 72);
  
  // Calculate totals
  const subtotal = invoice.services.reduce((sum, service) => sum + (service.hours * service.rate), 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;
  
  // Services table
  const tableData = invoice.services.map(service => [
    service.name,
    service.hours.toString(),
    `$${service.rate.toFixed(2)}`,
    `$${(service.hours * service.rate).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 85,
    head: [[t.service, t.hours, language === 'sv' ? 'Timpris (kr)' : 'Rate ($)', t.total]],
    body: tableData,
    foot: [
      ['', '', `${t.subtotal}`, `${language === 'sv' ? '' : '$'}${subtotal.toFixed(2)}${language === 'sv' ? ' kr' : ''}`],
      ['', '', `${t.tax} (${(invoice.taxRate * 100).toFixed(1)}%):`, `${language === 'sv' ? '' : '$'}${tax.toFixed(2)}${language === 'sv' ? ' kr' : ''}`],
      ['', '', `${t.total}:`, `${language === 'sv' ? '' : '$'}${total.toFixed(2)}${language === 'sv' ? ' kr' : ''}`]
    ],
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [250, 250, 250],
      textColor: [40, 40, 40],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: 20, right: 20 },
  });
  
  // Payment terms
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t.paymentTerms}:`, 20, finalY + 20);
  doc.text(t.paymentTermsText.split('. ')[0] + '.', 20, finalY + 27);
  doc.text(t.paymentTermsText.split('. ')[1] || '', 20, finalY + 32);
  
  // Download the PDF
  doc.save(`${language === 'sv' ? 'faktura' : 'invoice'}-${invoice.invoiceNumber}.pdf`);
}
