import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Calendar, CreditCard, Hash, FileCheck, Download, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addPaymentStampToPDF, previewPDFStamp, PaymentStamp } from "@/lib/pdf-stamper";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PDFStamper() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showStampPreview, setShowStampPreview] = useState<boolean>(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate preview with current payment details
  const generatePreview = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsGeneratingPreview(true);
    try {
      const stamp: PaymentStamp = {
        date: new Date(paymentDate),
        method: paymentMethod || undefined,
        reference: paymentReference || undefined,
      };

      const stampedPreview = await previewPDFStamp(selectedFile, stamp, t);
      setPreviewUrl(stampedPreview);
      setShowStampPreview(true);
    } catch (error) {
      console.warn('Could not generate preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [selectedFile, paymentDate, paymentMethod, paymentReference, t]);

  // Debounced preview update
  const updatePreview = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      generatePreview();
    }, 1000); // 1 second debounce
  }, [generatePreview]);

  // Effect to trigger preview updates when form values change
  useEffect(() => {
    if (selectedFile) {
      updatePreview();
    }
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [paymentDate, paymentMethod, paymentReference, updatePreview]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: t.invalidFile,
          description: t.selectPdfFile,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setPreviewUrl("");
      setShowStampPreview(false);
      
      // Create preview URL for the original PDF
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setShowStampPreview(false);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      toast({
        title: t.invalidFile,
        description: t.dropPdfFile,
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleStampPDF = async () => {
    if (!selectedFile) {
      toast({
        title: t.noFileSelected,
        description: t.selectPdfFirst,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const stamp: PaymentStamp = {
        date: new Date(paymentDate),
        method: paymentMethod || undefined,
        reference: paymentReference || undefined,
      };

      await addPaymentStampToPDF(selectedFile, stamp, t);
      
      toast({
        title: t.success,
        description: t.paymentStampAdded,
      });
      
      // Show preview of stamped PDF
      try {
        const stampedPreview = await previewPDFStamp(selectedFile, stamp, t);
        setPreviewUrl(stampedPreview);
        setShowStampPreview(true);
      } catch (previewError) {
        console.warn('Could not generate preview:', previewError);
      }
      
      // Note: Keep form data for potential reuse/modifications
      // User can manually clear or select a new file to reset
      
    } catch (error) {
      console.error("Error stamping PDF:", error);
      toast({
        title: t.processingFailed,
        description: error instanceof Error ? error.message : t.failedToAddStamp,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
                {t.pdfStamper}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="link-invoice-generator">
                  <FileText className="h-4 w-4 mr-2" />
                  {t.createInvoice}
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">{t.addPaymentStampsExisting}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload and Form Section */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>{t.uploadInvoicePdf}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-pdf"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileCheck className="h-12 w-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-foreground" data-testid="text-selected-file">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.clickToSelectDifferentFile}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium text-foreground">
                        {t.dropPdfHere}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.onlyPdfAccepted}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>{t.paymentDetails}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-date" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{t.paymentDate}</span>
                  </Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    data-testid="input-payment-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">{t.paymentMethodOptional}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder={t.selectPaymentMethod} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank-transfer" data-testid="option-bank-transfer">{t.bankTransfer}</SelectItem>
                      <SelectItem value="credit-card" data-testid="option-credit-card">{t.creditCard}</SelectItem>
                      <SelectItem value="cash" data-testid="option-cash">{t.cash}</SelectItem>
                      <SelectItem value="check" data-testid="option-check">{t.check}</SelectItem>
                      <SelectItem value="other" data-testid="option-other">{t.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-reference" className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>{t.paymentReferenceOptional}</span>
                  </Label>
                  <Input
                    id="payment-reference"
                    type="text"
                    placeholder={t.transactionIdPlaceholder}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    data-testid="input-payment-reference"
                  />
                </div>

                <Button 
                  onClick={handleStampPDF}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                  data-testid="button-add-stamp"
                >
                  {isProcessing ? (
                    <>{t.processing}</>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t.addPaymentStampExport}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.pdfPreview}</span>
                  {isGeneratingPreview && (
                    <div className="text-sm text-muted-foreground">
                      {t.processing}...
                    </div>
                  )}
                  {showStampPreview && (
                    <div className="text-sm text-green-600 font-medium">
                      Stamped Preview
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUrl ? (
                  <div className="w-full h-[600px] border border-border rounded-lg overflow-hidden">
                    <iframe
                      src={previewUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                      data-testid="iframe-pdf-preview"
                    />
                  </div>
                ) : (
                  <div className="w-full h-[600px] border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <FileCheck className="h-12 w-12 mx-auto" />
                      <p>{t.uploadPdfToPreview}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}