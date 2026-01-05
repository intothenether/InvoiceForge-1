import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { Invoice } from "@shared/schema";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBusinessConfig } from '@shared/config';
import { saveInvoiceToHistory } from '@/lib/invoice-history';

interface InvoicePreviewProps {
  invoice: Invoice;
  onInvoiceUpdate?: (updatedInvoice: Invoice) => void;
}

export function InvoicePreview({ invoice, onInvoiceUpdate }: InvoicePreviewProps) {
  const { t, language } = useLanguage();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const currentUrlRef = useRef<string | null>(null);

  // Check if invoice has required fields for preview
  const isInvoiceValid = invoice.clientName && invoice.clientEmail &&
    invoice.services.length > 0 &&
    invoice.services.every(s => s.name);

  // Generate PDF preview whenever invoice changes
  useEffect(() => {
    // Cleanup previous URL before generating new one
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }

    if (!isInvoiceValid) {
      setPdfPreviewUrl(null);
      return;
    }

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      try {
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

        // Company info (right side) - using config
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

        // Convert to blob URL for preview
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        // Store reference and set state
        currentUrlRef.current = url;
        setPdfPreviewUrl(url);

      } catch (error) {
        console.error('Error generating PDF preview:', error);
        toast.error('Failed to generate PDF preview');
        setPdfPreviewUrl(null);
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    generatePreview();

    // Cleanup function
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [
    // Add all relevant dependencies to ensure proper updates
    invoice.clientName,
    invoice.clientEmail,
    invoice.clientPersonnumber,
    invoice.clientAddress,
    invoice.invoiceNumber,
    JSON.stringify(invoice.services), // Use JSON.stringify for array comparison
    invoice.taxRate,
    language,
    t.invoice,
    t.date,
    t.billTo,
    t.service,
    t.subtotal,
    t.tax,
    t.total,
    t.skatterabatt,
    invoice.includeSkatterabatt,
    isInvoiceValid
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
    };
  }, []);

  const generateNewInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  };

  const handleDownload = async () => {
    if (!isInvoiceValid) {
      toast.error(t.fillRequiredFields);
      return;
    }

    try {
      await generateInvoicePDF(invoice, language);

      // Save to invoice history
      console.log('DEBUG: Calling saveInvoiceToHistory with:', invoice.clientName);
      saveInvoiceToHistory(invoice);
      console.log('DEBUG: saveInvoiceToHistory called');

      toast.success(t.downloadSuccessful);

      // Generate new invoice number after successful download
      if (onInvoiceUpdate) {
        const newInvoiceNumber = generateNewInvoiceNumber();
        const updatedInvoice = { ...invoice, invoiceNumber: newInvoiceNumber };
        onInvoiceUpdate(updatedInvoice);

        toast.success(`New invoice number: ${newInvoiceNumber}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t.downloadError);
    }
  };

  const handlePreview = () => {
    if (pdfPreviewUrl) {
      window.open(pdfPreviewUrl, '_blank');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{t.invoicePreview}</span>
        </CardTitle>
        <Badge variant={isInvoiceValid ? "default" : "secondary"}>
          {isInvoiceValid ? t.readyToGenerate : t.incompleteForm}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isInvoiceValid ? t.allFieldsCompleted : t.pleaseFillRequiredFields}
        </p>

        {/* PDF Preview */}
        <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '500px' }}>
          {isGeneratingPreview ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Generating preview...</span>
            </div>
          ) : pdfPreviewUrl ? (
            <iframe
              src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title="PDF Preview"
              key={pdfPreviewUrl} // Force iframe reload when URL changes
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Fill in invoice details to see preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            variant="outline"
            disabled={!pdfPreviewUrl}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            {t.previewInvoice}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!isInvoiceValid}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {t.downloadPDF}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}