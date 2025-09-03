import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoicePreviewProps {
  invoice: Invoice;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { t } = useLanguage();
  
  const subtotal = invoice.services.reduce((sum, service) => {
    if (service.type === "fixed") {
      return sum + (service.total || 0);
    } else {
      return sum + ((service.hours || 0) * (service.rate || 0));
    }
  }, 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;

  const isComplete = invoice.clientName && invoice.clientEmail && 
    invoice.invoiceNumber && invoice.services.every(s => {
      if (s.type === "fixed") {
        return s.name && s.total && s.total > 0;
      } else {
        return s.name && s.hours && s.hours > 0 && s.rate && s.rate > 0;
      }
    });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.invoicePreview}</CardTitle>
          <span className="text-sm text-muted-foreground">{t.livePreview}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Header */}
        <div className="border-b border-border pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-invoice-title">
                {t.invoice.toUpperCase()}
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-invoice-number">
                {t.invoice} #{invoice.invoiceNumber || "---"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t.date}</p>
              <p className="font-medium" data-testid="text-invoice-date">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t.billTo}</h3>
            <div className="space-y-1">
              <p className="font-medium" data-testid="text-client-name">
                {invoice.clientName || "Client Name"}
              </p>
              <p className="text-muted-foreground" data-testid="text-client-email">
                {invoice.clientEmail || "client@email.com"}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t.from}</h3>
            <div className="space-y-1">
              <p className="font-medium">Your Business Name</p>
              <p className="text-muted-foreground">your.email@business.com</p>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="text-left">{t.service}</th>
                <th className="text-center">Type</th>
                <th className="text-center">Details</th>
                <th className="text-right">{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((service, index) => (
                <tr key={service.id} data-testid={`row-service-${index}`}>
                  <td className="font-medium" data-testid={`text-service-name-${index}`}>
                    {service.name || "Service Name"}
                  </td>
                  <td className="text-center" data-testid={`text-service-type-${index}`}>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      service.type === "fixed" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {service.type === "fixed" ? "Fixed" : "Hourly"}
                    </span>
                  </td>
                  <td className="text-center" data-testid={`text-service-details-${index}`}>
                    {service.type === "fixed" 
                      ? "Fixed Price"
                      : `${service.hours || 0}h × $${(service.rate || 0).toFixed(2)}`
                    }
                  </td>
                  <td className="text-right font-medium" data-testid={`text-service-total-${index}`}>
                    ${
                      service.type === "fixed" 
                        ? (service.total || 0).toFixed(2)
                        : ((service.hours || 0) * (service.rate || 0)).toFixed(2)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="font-semibold text-right">{t.subtotal}</td>
                <td className="text-right font-semibold" data-testid="text-subtotal">
                  ${subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="font-semibold text-right">
                  {t.tax} ({(invoice.taxRate * 100).toFixed(1)}%):
                </td>
                <td className="text-right font-semibold" data-testid="text-tax">
                  ${tax.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-muted">
                <td colSpan={3} className="font-bold text-right text-lg">{t.total}:</td>
                <td className="text-right font-bold text-lg text-primary" data-testid="text-total">
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Terms */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">{t.paymentTerms}</h3>
          <p className="text-sm text-muted-foreground">
            {t.paymentTermsText}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-accent' : 'bg-muted-foreground'}`}></div>
            <span className="text-sm font-medium" data-testid="status-indicator">
              {isComplete ? t.readyToGenerate : t.incompleteForm}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isComplete ? t.allFieldsCompleted : t.pleaseFillRequiredFields}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
