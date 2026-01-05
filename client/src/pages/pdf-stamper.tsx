import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Calendar, CreditCard, Hash, FileCheck, Download, FileText, Folder } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addPaymentStampToPDF, previewPDFStamp, PaymentStamp } from "@/lib/pdf-stamper";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [sourceDirectory, setSourceDirectory] = useState<string>("");
  const [batchFiles, setBatchFiles] = useState<{
    name: string,
    path: string,
    paymentDate: string,
    paymentMethod: string,
    paymentReference: string
  }[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'processing' | 'completed' | 'stopped'>('idle');
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Effect to update preview when selectedFileId changes in batch mode
  useEffect(() => {
    const updateBatchPreview = async () => {
      if (isBatchMode && selectedFileId && batchFiles.length > 0) {
        const selectedBatchFile = batchFiles.find(f => f.path === selectedFileId);
        if (selectedBatchFile) {
          // Update payment details form
          setPaymentDate(selectedBatchFile.paymentDate);
          setPaymentMethod(selectedBatchFile.paymentMethod);
          setPaymentReference(selectedBatchFile.paymentReference);

          // Update PDF preview
          if (window.electronAPI) {
            try {
              setIsGeneratingPreview(true);
              const base64Data = await window.electronAPI.readFile(selectedBatchFile.path);

              // Convert base64 to Blob/File
              const binaryString = window.atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              const file = new File([blob], selectedBatchFile.name, { type: 'application/pdf' });

              // Generate preview
              const stamp: PaymentStamp = {
                date: new Date(selectedBatchFile.paymentDate),
                method: selectedBatchFile.paymentMethod || undefined,
                reference: selectedBatchFile.paymentReference || undefined,
              };

              const stampedPreview = await previewPDFStamp(file, stamp, t);
              setPreviewUrl(stampedPreview);
              setShowStampPreview(true);
            } catch (error) {
              console.error("Failed to generate preview for selected batch file:", error);
              toast({
                title: "Preview Error",
                description: "Could not load preview for selected file.",
                variant: "destructive"
              });
            } finally {
              setIsGeneratingPreview(false);
            }
          }
        }
      }
    };

    updateBatchPreview();
  }, [selectedFileId, isBatchMode, batchFiles, t]);

  const handleFolderSelect = async () => {
    if (!window.electronAPI) {
      console.log("Browser mode: Simulating folder selection");
      setSourceDirectory("C:\\Mock\\Path\\To\\Invoices");
      setBatchStatus('idle');
      setProcessedCount(0);
      const today = new Date().toISOString().split('T')[0];
      const mockFiles = [
        { name: "invoice_001.pdf", path: "mock/path/invoice_001.pdf", paymentDate: today, paymentMethod: "", paymentReference: "" },
        { name: "invoice_002.pdf", path: "mock/path/invoice_002.pdf", paymentDate: today, paymentMethod: "", paymentReference: "" },
        { name: "invoice_003.pdf", path: "mock/path/invoice_003.pdf", paymentDate: today, paymentMethod: "", paymentReference: "" },
        { name: "invoice_004.pdf", path: "mock/path/invoice_004.pdf", paymentDate: today, paymentMethod: "", paymentReference: "" },
        { name: "invoice_005.pdf", path: "mock/path/invoice_005.pdf", paymentDate: today, paymentMethod: "", paymentReference: "" },
      ];
      setBatchFiles(mockFiles);
      setSelectedFileId(mockFiles[0].path);
      setBatchLog([]);
      setPaymentDate(today);

      toast({
        title: "Browser Testing Mode",
        description: "Simulated folder selection with 5 mock files.",
      });
      return;
    }

    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      setSourceDirectory(dir);
      setBatchStatus('idle');
      setProcessedCount(0);
      setBatchLog([]);

      // List files
      try {
        const files = await window.electronAPI.readDirectoryPDFs(dir);
        const today = new Date().toISOString().split('T')[0];
        const filesWithDetails = files.map(f => ({
          ...f,
          paymentDate: today,
          paymentMethod: "",
          paymentReference: ""
        }));
        setBatchFiles(filesWithDetails);
        if (filesWithDetails.length > 0) {
          setSelectedFileId(filesWithDetails[0].path);
        }
        toast({
          title: "Folder Selected",
          description: `Found ${files.length} PDF files.`
        });
      } catch (err) {
        console.error("Error reading directory:", err);
        toast({
          title: "Error",
          description: "Failed to read directory contents.",
          variant: "destructive"
        });
      }
    }
  };

  const addToLog = (message: string) => {
    setBatchLog(prev => [message, ...prev].slice(0, 100));
  };

  const handleBatchStamp = async () => {
    if (batchFiles.length === 0) return;

    setIsProcessing(true);
    setBatchStatus('processing');
    setProcessedCount(0);
    setBatchLog([]);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    let processed = 0;

    for (const file of batchFiles) {
      if (signal.aborted) {
        addToLog("Batch processing stopped by user.");
        break;
      }

      try {
        addToLog(`Processing: ${file.name}...`);

        const stamp: PaymentStamp = {
          date: new Date(file.paymentDate),
          method: file.paymentMethod || undefined,
          reference: file.paymentReference || undefined,
        };

        // Read file
        const base64Content = await window.electronAPI.readFile(file.path);
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Stamp
        const { pdfBase64 } = await import("@/lib/pdf-stamper").then(m => m.stampPdfBuffer(arrayBuffer, stamp, t));

        // Generate filename using same convention as single file mode
        const originalName = file.name.replace(/\.pdf$/i, '');
        const stampedFileName = `${originalName}_stamped_${Date.now()}.pdf`;

        // Get save directory from settings
        const businessConfig = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('businessConfig') || '{}')
          : {};

        // Use configured save path or fallback to 'stamped' subdirectory
        const saveDir = businessConfig.stampedInvoiceSavePath || `${sourceDirectory}\\stamped`;
        const savePath = `${saveDir}\\${stampedFileName}`;

        const result = await window.electronAPI.saveFileSilent(savePath, pdfBase64, 'base64');

        if (result.success) {
          processed++;
          setProcessedCount(processed);
          addToLog(`✓ Saved to: ${savePath}`);
        } else {
          addToLog(`✗ Failed to save ${file.name}: ${result.error}`);
        }

      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        addToLog(`✗ Error processing ${file.name}`);
      }
    }

    setIsProcessing(false);
    setBatchStatus(signal.aborted ? 'stopped' : 'completed');
    if (!signal.aborted) {
      toast({
        title: "Batch Complete",
        description: `Successfully processed ${processed} of ${batchFiles.length} files.`
      });
    }
  };

  const openInvoiceFolder = async () => {
    if (!window.electronAPI) return;

    const businessConfig = JSON.parse(localStorage.getItem('businessConfig') || '{}');
    const invoicePath = businessConfig.invoiceSavePath;

    if (!invoicePath) {
      toast({
        title: "No Path Set",
        description: "Please set the invoice save directory in Settings first.",
        variant: "destructive"
      });
      return;
    }

    await window.electronAPI.openDirectory(invoicePath);
  };

  const openStampedFolder = async () => {
    if (!window.electronAPI) return;

    const businessConfig = JSON.parse(localStorage.getItem('businessConfig') || '{}');
    const stampedPath = businessConfig.stampedInvoiceSavePath;

    if (!stampedPath) {
      toast({
        title: "No Path Set",
        description: "Please set the stamped invoice save directory in Settings first.",
        variant: "destructive"
      });
      return;
    }

    await window.electronAPI.openDirectory(stampedPath);
  };

  const stopBatch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {window.electronAPI && (
                <>
                  <Button variant="ghost" size="icon" onClick={openInvoiceFolder} title={t.invoiceFolder}>
                    <Folder className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={openStampedFolder} title={t.stampedFolder}>
                    <Folder className="h-5 w-5" />
                  </Button>
                </>
              )}
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
            {/* File Upload / Batch Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isBatchMode ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                    <span>{isBatchMode ? t.batchProcessing : t.uploadInvoicePdf}</span>
                  </div>
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setIsBatchMode(false)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!isBatchMode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {t.singleFile}
                    </button>
                    <button
                      onClick={() => setIsBatchMode(true)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isBatchMode ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {t.batchMode}
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isBatchMode ? (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label>{t.sourceFolder}</Label>
                      <div className="flex space-x-2">
                        <Input value={sourceDirectory} readOnly placeholder={t.selectFolder} className="flex-1" />
                        <Button variant="secondary" onClick={handleFolderSelect} className="shrink-0">
                          {t.browse}
                        </Button>
                      </div>
                    </div>

                    {batchFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-muted px-4 py-2 font-medium text-sm">
                            {batchFiles.length} {t.filesFound} - {t.setPaymentDetailsForEach}
                          </div>

                          {/* Table of files with editable payment details */}
                          <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                  <th className="text-left p-2 font-medium">{t.file}</th>
                                  <th className="text-left p-2 font-medium w-32">{t.paymentDate}</th>
                                  <th className="text-left p-2 font-medium w-32">{t.method}</th>
                                  <th className="text-left p-2 font-medium w-32">{t.reference}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batchFiles.map((file, index) => (
                                  <tr
                                    key={index}
                                    className={`border-t border-border cursor-pointer transition-colors ${selectedFileId === file.path
                                      ? 'bg-accent text-accent-foreground'
                                      : 'hover:bg-muted/50'
                                      }`}
                                    onClick={() => setSelectedFileId(file.path)}
                                  >
                                    <td className="p-2 text-xs font-medium" title={file.path}>
                                      {file.name}
                                    </td>
                                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                      <Input
                                        type="date"
                                        value={file.paymentDate}
                                        onChange={(e) => {
                                          const newFiles = [...batchFiles];
                                          newFiles[index].paymentDate = e.target.value;
                                          setBatchFiles(newFiles);
                                          // Also update current preview if this is the selected file
                                          if (selectedFileId === file.path) {
                                            setPaymentDate(e.target.value);
                                          }
                                        }}
                                        className="h-8 text-xs bg-background"
                                      />
                                    </td>
                                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                      <Select
                                        value={file.paymentMethod}
                                        onValueChange={(value) => {
                                          const newFiles = [...batchFiles];
                                          newFiles[index].paymentMethod = value;
                                          setBatchFiles(newFiles);
                                          if (selectedFileId === file.path) {
                                            setPaymentMethod(value);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                          <SelectValue placeholder={t.method} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="bank-transfer">{t.bankTransfer}</SelectItem>
                                          <SelectItem value="credit-card">{t.creditCard}</SelectItem>
                                          <SelectItem value="cash">{t.cash}</SelectItem>
                                          <SelectItem value="check">{t.check}</SelectItem>
                                          <SelectItem value="other">{t.other}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                      <Input
                                        type="text"
                                        value={file.paymentReference}
                                        onChange={(e) => {
                                          const newFiles = [...batchFiles];
                                          newFiles[index].paymentReference = e.target.value;
                                          setBatchFiles(newFiles);
                                          if (selectedFileId === file.path) {
                                            setPaymentReference(e.target.value);
                                          }
                                        }}
                                        placeholder={t.reference}
                                        className="h-8 text-xs bg-background"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {batchStatus !== 'idle' && (
                          <div className="space-y-1">
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${(processedCount / batchFiles.length) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{processedCount} / {batchFiles.length}</span>
                              <span>{Math.round((processedCount / batchFiles.length) * 100)}%</span>
                            </div>
                          </div>
                        )}

                        {/* Recent Log */}
                        <div className="h-40 overflow-y-auto text-xs font-mono space-y-1 p-2 bg-background border rounded">
                          {batchLog.map((log, i) => (
                            <div key={i} className={log.startsWith('✗') ? 'text-red-500' : log.startsWith('✓') ? 'text-green-600' : 'text-muted-foreground'}>
                              {log}
                            </div>
                          ))}
                          {batchLog.length === 0 && <span className="text-muted-foreground opacity-50">{t.processing}...</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            {/* Payment Details Form - Hidden in batch mode */}
            {!isBatchMode && (
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

                  <div className="flex gap-2">
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Button for Batch Mode */}
            {isBatchMode && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    {batchStatus === 'processing' ? (
                      <Button
                        onClick={stopBatch}
                        variant="destructive"
                        className="w-full"
                      >
                        {t.stopProcessing}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBatchStamp}
                        disabled={batchFiles.length === 0}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {`${t.processFiles} ${batchFiles.length}`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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