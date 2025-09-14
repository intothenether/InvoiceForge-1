import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { Translations } from './translations';

export interface PaymentStamp {
  date: Date;
  method?: string;
  amount?: string;
  reference?: string;
}

// Safe base64 conversion for large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  let binary = '';
  
  // Process in chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Map payment method IDs to localized display names
function getLocalizedPaymentMethod(methodId: string, t: Translations): string {
  const methodMap: Record<string, string> = {
    'bank-transfer': t.bankTransfer,
    'credit-card': t.creditCard,
    'cash': t.cash,
    'check': t.check,
    'other': t.other
  };
  
  return methodMap[methodId] || methodId;
}

// Web browser download fallback
function downloadFile(dataUri: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function addPaymentStampToPDF(
  pdfFile: File, 
  stamp: PaymentStamp,
  t: Translations
): Promise<string> {
  try {
    // Read the PDF file
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Get the first page (or add logic to select page)
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Format payment date
    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };
    
    // Calculate stamp position (top-right corner)
    const stampX = width - 150;
    const stampY = height - 60;
    
    // Draw stamp background (light green rectangle)
    firstPage.drawRectangle({
      x: stampX - 10,
      y: stampY - 30,
      width: 140,
      height: 50,
      borderColor: rgb(0.2, 0.7, 0.2), // Green border
      borderWidth: 2,
      color: rgb(0.9, 1, 0.9), // Light green background
    });
    
    // Add "PAID" text (localized)
    firstPage.drawText(t.paid, {
      x: stampX + 45,
      y: stampY - 5,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.7, 0.2),
    });
    
    // Add payment date (localized)
    firstPage.drawText(`${t.dateLabel} ${formatDate(stamp.date)}`, {
      x: stampX,
      y: stampY - 20,
      size: 10,
      font: font,
      color: rgb(0.1, 0.5, 0.1),
    });
    
    // Add payment method if provided (localized)
    if (stamp.method) {
      const localizedMethod = getLocalizedPaymentMethod(stamp.method, t);
      firstPage.drawText(`${t.methodLabel} ${localizedMethod}`, {
        x: stampX,
        y: stampY - 32,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Add reference if provided (localized)
    if (stamp.reference) {
      firstPage.drawText(`${t.refLabel} ${stamp.reference}`, {
        x: stampX,
        y: stampY - 44,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 safely
    const pdfBase64 = arrayBufferToBase64(pdfBytes.buffer as ArrayBuffer);
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;
    
    // Generate filename
    const originalName = pdfFile.name.replace(/\.pdf$/i, '');
    const stampedFileName = `${originalName}_stamped_${Date.now()}.pdf`;
    
    // Check if we're running on a mobile platform (Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        // Save to device using Capacitor
        await Filesystem.writeFile({
          path: stampedFileName,
          data: pdfBase64,
          directory: Directory.Documents,
          encoding: Encoding.BASE64,
          recursive: true
        });
        
        // Share the file
        await Share.share({
          title: t.stampedInvoice,
          text: t.hereIsStampedInvoice,
          url: pdfDataUri,
          dialogTitle: t.shareStampedInvoice
        });
      } catch (capacitorError) {
        console.warn('Capacitor file operations failed, falling back to web download:', capacitorError);
        // Fallback to web download
        downloadFile(pdfDataUri, stampedFileName);
      }
    } else {
      // Web browser - trigger download
      downloadFile(pdfDataUri, stampedFileName);
    }
    
    return pdfDataUri;
  } catch (error) {
    console.error('Error stamping PDF:', error);
    throw new Error('Failed to add stamp to PDF. Please ensure the file is a valid PDF.');
  }
}

export async function previewPDFStamp(
  pdfFile: File,
  stamp: PaymentStamp,
  t: Translations
): Promise<string> {
  try {
    // Create a stamped version for preview
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Format payment date
    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };
    
    // Calculate stamp position (top-right corner)
    const stampX = width - 150;
    const stampY = height - 60;
    
    // Draw stamp background (lighter for preview)
    firstPage.drawRectangle({
      x: stampX - 10,
      y: stampY - 30,
      width: 140,
      height: 50,
      borderColor: rgb(0.2, 0.7, 0.2), // Green border
      borderWidth: 1,
      color: rgb(0.95, 1, 0.95), // Very light green background for preview
    });
    
    // Add "PAID" text (localized)
    firstPage.drawText(t.paid, {
      x: stampX + 45,
      y: stampY - 5,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.7, 0.2),
    });
    
    // Add payment date (localized)
    firstPage.drawText(`${t.dateLabel} ${formatDate(stamp.date)}`, {
      x: stampX,
      y: stampY - 20,
      size: 10,
      font: font,
      color: rgb(0.1, 0.5, 0.1),
    });
    
    // Add payment method if provided (localized)
    if (stamp.method) {
      const localizedMethod = getLocalizedPaymentMethod(stamp.method, t);
      firstPage.drawText(`${t.methodLabel} ${localizedMethod}`, {
        x: stampX,
        y: stampY - 32,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Add reference if provided (localized)
    if (stamp.reference) {
      firstPage.drawText(`${t.refLabel} ${stamp.reference}`, {
        x: stampX,
        y: stampY - 44,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Serialize the preview PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = arrayBufferToBase64(pdfBytes.buffer as ArrayBuffer);
    return `data:application/pdf;base64,${pdfBase64}`;
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw new Error('Failed to preview PDF. Please ensure the file is a valid PDF.');
  }
}