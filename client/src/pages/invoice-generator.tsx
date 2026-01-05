import { useState } from "react";
import { FileText, Stamp, Settings, Folder } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/invoice-form";
import { InvoicePreview } from "@/components/invoice-preview";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@shared/schema";

export default function InvoiceGenerator() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}`;
    })(),
    clientName: "",
    clientEmail: "",
    services: [{ id: "1", name: "", type: "hourly", hours: 0, rate: 0 }],
    taxRate: 0.25,
    clientPersonnumber: "",
    clientAddress: "",
    includeSkatterabatt: true
  });

  const handleInvoiceChange = (updatedInvoice: Invoice) => {
    setInvoice(updatedInvoice);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
                {t.appTitle}
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
              <Link href="/settings">
                <Button variant="ghost" size="sm" data-testid="link-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href="/stamp-pdf">
                <Button variant="outline" size="sm" data-testid="link-pdf-stamper">
                  <Stamp className="h-4 w-4 mr-2" />
                  Stamp PDF
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">{t.appSubtitle}</span>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="w-full lg:w-1/2">
            <InvoiceForm onInvoiceChange={handleInvoiceChange} />
          </div>

          {/* Preview Section */}
          <div className="w-full lg:w-1/2">
            <InvoicePreview
              invoice={invoice}
              onInvoiceUpdate={handleInvoiceChange}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <FileText className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{t.appTitle}</span>
              </div>
              <span className="text-sm text-muted-foreground">{t.tagline}</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-muted-foreground">{t.copyright}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
