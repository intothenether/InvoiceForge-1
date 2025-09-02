import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@shared/schema';

export function generateInvoicePDF(invoice: Invoice): void {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', 20, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #${invoice.invoiceNumber}`, 20, 40);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Company info (right side)
  doc.text('Your Business Name', 140, 30);
  doc.text('your.email@business.com', 140, 35);
  
  // Client info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Bill To:', 20, 60);
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
    head: [['Service', 'Hours', 'Rate', 'Total']],
    body: tableData,
    foot: [
      ['', '', 'Subtotal:', `$${subtotal.toFixed(2)}`],
      ['', '', `Tax (${(invoice.taxRate * 100).toFixed(1)}%):`, `$${tax.toFixed(2)}`],
      ['', '', 'Total:', `$${total.toFixed(2)}`]
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
  doc.text('Payment Terms:', 20, finalY + 20);
  doc.text('Payment is due within 30 days of invoice date.', 20, finalY + 27);
  doc.text('Late payments may be subject to a 1.5% monthly service charge.', 20, finalY + 32);
  
  // Download the PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
