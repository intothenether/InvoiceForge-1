import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface PaymentStamp {
  date: Date;
  method?: string;
  amount?: string;
  reference?: string;
}

export async function addPaymentStampToPDF(
  pdfFile: File, 
  stamp: PaymentStamp
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
    
    // Draw stamp background (light red/green rectangle)
    firstPage.drawRectangle({
      x: stampX - 10,
      y: stampY - 30,
      width: 140,
      height: 50,
      borderColor: rgb(0.2, 0.7, 0.2), // Green border
      borderWidth: 2,
      color: rgb(0.9, 1, 0.9), // Light green background
    });
    
    // Add "PAID" text
    firstPage.drawText('PAID', {
      x: stampX + 45,
      y: stampY - 5,
      size: 16,
      font: boldFont,
      color: rgb(0.2, 0.7, 0.2),
    });
    
    // Add payment date
    firstPage.drawText(`Date: ${formatDate(stamp.date)}`, {
      x: stampX,
      y: stampY - 20,
      size: 10,
      font: font,
      color: rgb(0.1, 0.5, 0.1),
    });
    
    // Add payment method if provided
    if (stamp.method) {
      firstPage.drawText(`Method: ${stamp.method}`, {
        x: stampX,
        y: stampY - 32,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Add reference if provided
    if (stamp.reference) {
      firstPage.drawText(`Ref: ${stamp.reference}`, {
        x: stampX,
        y: stampY - 44,
        size: 8,
        font: font,
        color: rgb(0.1, 0.5, 0.1),
      });
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 for file system
    const pdfBase64 = btoa(String.fromCharCode.apply(null, Array.from(pdfBytes)));
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;
    
    // Generate filename
    const originalName = pdfFile.name.replace(/\.pdf$/i, '');
    const stampedFileName = `${originalName}_stamped_${Date.now()}.pdf`;
    
    // Save to device
    await Filesystem.writeFile({
      path: stampedFileName,
      data: pdfBase64,
      directory: Directory.Documents,
      recursive: true
    });
    
    // Optional: let user share/open the file
    await Share.share({
      title: 'Stamped Invoice',
      text: 'Here is your stamped invoice',
      url: pdfDataUri,
      dialogTitle: 'Share Stamped Invoice'
    });
    
    return pdfDataUri;
  } catch (error) {
    console.error('Error stamping PDF:', error);
    throw new Error('Failed to add stamp to PDF. Please ensure the file is a valid PDF.');
  }
}

export async function previewPDFStamp(
  pdfFile: File,
  stamp: PaymentStamp
): Promise<string> {
  try {
    // For preview, we'll just return the original PDF as base64
    // In a real implementation, you might want to create a preview with the stamp
    const arrayBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfBase64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    return `data:application/pdf;base64,${pdfBase64}`;
  } catch (error) {
    console.error('Error previewing PDF:', error);
    throw new Error('Failed to preview PDF. Please ensure the file is a valid PDF.');
  }
}