import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@shared/schema";

interface InvoicePreviewProps {
  invoice: Invoice;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const subtotal = invoice.services.reduce((sum, service) => 
    sum + (service.hours * service.rate), 0
  );
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;

  const isComplete = invoice.clientName && invoice.clientEmail && 
    invoice.invoiceNumber && invoice.services.every(s => s.name && s.hours > 0 && s.rate > 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Invoice Preview</CardTitle>
          <span className="text-sm text-muted-foreground">Live preview of your invoice</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Header */}
        <div className="border-b border-border pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-invoice-title">
                INVOICE
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-invoice-number">
                Invoice #{invoice.invoiceNumber || "---"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium" data-testid="text-invoice-date">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h3>
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">From:</h3>
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
                <th className="text-left">Service</th>
                <th className="text-center">Hours</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((service, index) => (
                <tr key={service.id} data-testid={`row-service-${index}`}>
                  <td className="font-medium" data-testid={`text-service-name-${index}`}>
                    {service.name || "Service Name"}
                  </td>
                  <td className="text-center" data-testid={`text-service-hours-${index}`}>
                    {service.hours || 0}
                  </td>
                  <td className="text-right" data-testid={`text-service-rate-${index}`}>
                    ${(service.rate || 0).toFixed(2)}
                  </td>
                  <td className="text-right font-medium" data-testid={`text-service-total-${index}`}>
                    ${((service.hours || 0) * (service.rate || 0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="font-semibold text-right">Subtotal:</td>
                <td className="text-right font-semibold" data-testid="text-subtotal">
                  ${subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="font-semibold text-right">
                  Tax ({(invoice.taxRate * 100).toFixed(1)}%):
                </td>
                <td className="text-right font-semibold" data-testid="text-tax">
                  ${tax.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-muted">
                <td colSpan={3} className="font-bold text-right text-lg">Total:</td>
                <td className="text-right font-bold text-lg text-primary" data-testid="text-total">
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Terms */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Payment Terms</h3>
          <p className="text-sm text-muted-foreground">
            Payment is due within 30 days of invoice date. 
            Late payments may be subject to a 1.5% monthly service charge.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-accent' : 'bg-muted-foreground'}`}></div>
            <span className="text-sm font-medium" data-testid="status-indicator">
              {isComplete ? "Ready to Generate" : "Incomplete Form"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isComplete ? "All fields completed" : "Please fill required fields"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
