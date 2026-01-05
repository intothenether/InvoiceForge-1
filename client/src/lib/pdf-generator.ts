import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@shared/schema';
import { Language, translations } from '@/lib/translations';
import { getBusinessConfig } from '@shared/config';
import { saveInvoiceToHistory } from '@/lib/invoice-history';

export async function requestFilesystemPermissions() {
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const result = await Filesystem.requestPermissions();
    console.log('Filesystem permissions:', result);
    // result.publicStorage === 'granted' means you have permission
    return result;
  } catch (error) {
    console.error('Failed to request filesystem permissions:', error);
    throw error;
  }
}


export async function generateInvoicePDF(invoice: Invoice, language: Language = 'en') {
  const t = translations[language];
  const businessConfig = getBusinessConfig();
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

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  doc.text(`${t.date}: ${formatDate(new Date())}`, 20, 45);

  // Company info (right side) - now using config
  doc.text(businessConfig.businessName, 140, 30);
  doc.text("E-post " + businessConfig.businessEmail, 140, 35);
  doc.text("Momsregnr. " + businessConfig.businessMomsregnr, 140, 40);
  doc.text("Tel. " + businessConfig.businessPhone, 140, 45);
  doc.text("PLUSGIRO " + businessConfig.businessPlusgiro, 140, 50);

  // Client info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(t.billTo, 20, 60);
  doc.setFontSize(10);
  doc.text("Namn: " + invoice.clientName, 20, 67);
  doc.text("Personnummer: " + invoice.clientPersonnumber, 20, 72);
  doc.text("E-post: " + invoice.clientEmail, 20, 77);
  doc.text("Adress: " + invoice.clientAddress, 20, 82);

  // Calculate totals
  const subtotal = invoice.services.reduce((sum, service) => {
    if (service.type === 'fixed') {
      return sum + (service.total || 0);
    } else {
      return sum + ((service.hours || 0) * (service.rate || 0));
    }
  }, 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;

  // Services table
  let tableData: any[] = [];
  if (language === 'sv') {
    tableData = invoice.services.map(service => [
      service.name,
      service.type === 'fixed'
        ? 'Fast pris'
        : ((service.hours ?? 0) > 1 ? `${service.hours ?? 0} timmar` : `${service.hours ?? 0} timme`),
      service.type === 'fixed'
        ? 'N/A'
        : `${(service.rate || 0).toFixed(2)} kr`,
      `${(
        service.type === 'fixed'
          ? (service.total || 0)
          : ((service.hours || 0) * (service.rate || 0))
      ).toFixed(2)} kr`
    ]);
  } else {
    tableData = invoice.services.map(service => [
      service.name,
      service.type === 'fixed'
        ? 'Fixed Price'
        : `${service.hours || 0} hrs`,
      service.type === 'fixed'
        ? 'N/A'
        : `$${(service.rate || 0).toFixed(2)}`,
      `$${(
        service.type === 'fixed'
          ? (service.total || 0)
          : ((service.hours || 0) * (service.rate || 0))
      ).toFixed(2)}`
    ]);
  }

  autoTable(doc, {
    startY: 85,
    head: [[t.service, language === 'sv' ? 'Tjänsttyp / Timmar' : 'Service Type / Hours', language === 'sv' ? 'Timpris' : 'Rate', t.total]],
    body: tableData,
    foot: [
      ['', '', `${t.subtotal}`, `${language === 'sv' ? '' : '$'}${subtotal.toFixed(2)}${language === 'sv' ? ' kr' : ''}`],
      ['', '', `${t.tax} (${(invoice.taxRate * 100).toFixed(1)}%):`, `${language === 'sv' ? '' : '$'}${tax.toFixed(2)}${language === 'sv' ? ' kr' : ''}`],
      ['', '', `${t.total}:`, `${language === 'sv' ? '' : '$'}${total.toFixed(2)}${language === 'sv' ? ' kr' : ''}`],
      ...(invoice.includeSkatterabatt ? [['', '', `${t.skatterabatt}:`, `${language === 'sv' ? '' : '$'}${(total / 2).toFixed(2)}${language === 'sv' ? ' kr' : ''}`]] : [])
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
  //doc.text(`${t.paymentTerms}:`, 20, finalY + 20);
  //doc.text(t.paymentTermsText.split('. ')[0] + '.', 20, finalY + 27);
  //doc.text(t.paymentTermsText.split('. ')[1] || '', 20, finalY + 32);

  // Download the PDF
  const pdfOutput = doc.output('datauristring'); // or 'arraybuffer' / 'blob'

  const isNative =
    typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  // Generate filename with client name and invoice number
  // Clean client name for filename (remove special characters)
  const cleanClientName = invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const fileName = `${language === 'sv' ? 'faktura' : 'invoice'}_${cleanClientName}_${invoice.invoiceNumber}.pdf`;

  // Electron (Desktop) check
  if (window.electronAPI && businessConfig.invoiceSavePath) {
    try {
      // For electron we need the raw data, not datauri for cleaner saving
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fullPath = `${businessConfig.invoiceSavePath}\\${fileName}`; // Using backslash for Windows as per OS context

      const result = await window.electronAPI.saveFile(fullPath, pdfBase64, 'base64');
      if (result.success) {
        console.log('File saved to:', fullPath);

        // Save to history immediately upon success
        saveInvoiceToHistory(invoice);

        return; // Success, skip other methods
      } else {
        // If canceled, we just return and do don't fallback to browser download
        // because the user explicitly canceled the action.
        console.log('Save action canceled by user');
        return;
      }
    } catch (err) {
      console.error('Electron save error:', err);
      // Fallback to browser download if electron save fails
    }
  }

  if (isNative) {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: pdfOutput.split(',')[1], // strip "data:application/pdf;base64,"
        directory: Directory.Cache, // Use Cache instead of Data
        encoding: Encoding.UTF8, // Use UTF8 for base64 data with Capacitor
        recursive: true
      });

      console.log('File URI for sharing:', writeResult.uri);

      await Share.share({
        title: 'Facio Faktura',
        text: 'Här är din faktura',
        url: writeResult.uri, // Use the native file URI
        dialogTitle: 'Dela Faktura'
      });
    } catch (err) {
      console.error('Capacitor error:', err);
    }
  } else {
    // Browser fallback: download the PDF
    doc.save(fileName);
    saveInvoiceToHistory(invoice);
  }
}