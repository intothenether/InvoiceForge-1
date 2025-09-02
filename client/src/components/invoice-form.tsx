import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { invoiceSchema, type Invoice } from "@shared/schema";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceFormProps {
  onInvoiceChange: (invoice: Invoice) => void;
}

export function InvoiceForm({ onInvoiceChange }: InvoiceFormProps) {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const form = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      clientName: "",
      clientEmail: "",
      services: [{ id: "1", name: "", hours: 0, rate: 0 }],
      taxRate: 0.085,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const watchedValues = form.watch();

  // Update parent component whenever form values change
  React.useEffect(() => {
    if (form.formState.isValid) {
      onInvoiceChange(watchedValues);
    }
  }, [JSON.stringify(watchedValues), form.formState.isValid, onInvoiceChange]);

  const addService = () => {
    append({ 
      id: Date.now().toString(), 
      name: "", 
      hours: 0, 
      rate: 0 
    });
  };

  const removeService = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handlePreview = () => {
    if (form.formState.isValid) {
      toast({
        title: t.previewUpdated,
        description: t.previewUpdatedDesc,
      });
    } else {
      toast({
        title: t.validationError,
        description: t.fillRequiredFields,
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (form.formState.isValid) {
      try {
        generateInvoicePDF(watchedValues, language);
        toast({
          title: t.pdfGenerated,
          description: t.downloadSuccessful,
        });
      } catch (error) {
        toast({
          title: t.downloadFailed,
          description: t.downloadError,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t.validationError,
        description: t.fillRequiredFields,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.invoiceDetails}
          </CardTitle>
          <span className="text-sm text-muted-foreground">{t.fillServiceInfo}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-foreground border-b border-border pb-2">
              {t.clientInformation}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="floating-label-input">
              <Input
                {...form.register("clientName")}
                placeholder=" "
                data-testid="input-client-name"
              />
              <Label>{t.clientName}</Label>
              {form.formState.errors.clientName && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.clientName.message}
                </p>
              )}
            </div>
            
            <div className="floating-label-input">
              <Input
                {...form.register("clientEmail")}
                type="email"
                placeholder=" "
                data-testid="input-client-email"
              />
              <Label>{t.clientEmail}</Label>
              {form.formState.errors.clientEmail && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.clientEmail.message}
                </p>
              )}
            </div>
          </div>

          <div className="floating-label-input">
            <Input
              {...form.register("invoiceNumber")}
              placeholder=" "
              data-testid="input-invoice-number"
            />
            <Label>{t.invoiceNumber}</Label>
            {form.formState.errors.invoiceNumber && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.invoiceNumber.message}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Services Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-foreground border-b border-border pb-2 flex-1">
              {t.services}
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addService}
              className="flex items-center gap-2"
              data-testid="button-add-service"
            >
              <Plus className="h-4 w-4" />
              {t.addService}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Service #{index + 1}
                </span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                    className="text-destructive hover:text-destructive/80"
                    data-testid={`button-remove-service-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="floating-label-input">
                <Input
                  {...form.register(`services.${index}.name` as const)}
                  placeholder=" "
                  data-testid={`input-service-name-${index}`}
                />
                <Label>{t.serviceName}</Label>
                {form.formState.errors.services?.[index]?.name && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.services[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="floating-label-input">
                  <Input
                    {...form.register(`services.${index}.hours` as const, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder=" "
                    data-testid={`input-service-hours-${index}`}
                  />
                  <Label>{t.hours}</Label>
                  {form.formState.errors.services?.[index]?.hours && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.services[index]?.hours?.message}
                    </p>
                  )}
                </div>
                
                <div className="floating-label-input">
                  <Input
                    {...form.register(`services.${index}.rate` as const, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=" "
                    data-testid={`input-service-rate-${index}`}
                  />
                  <Label>{t.rate}</Label>
                  {form.formState.errors.services?.[index]?.rate && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.services[index]?.rate?.message}
                    </p>
                  )}
                </div>
                
                <div className="floating-label-input">
                  <Input
                    type="text"
                    value={`$${((watchedValues.services[index]?.hours || 0) * (watchedValues.services[index]?.rate || 0)).toFixed(2)}`}
                    readOnly
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    placeholder=" "
                    data-testid={`text-service-total-${index}`}
                  />
                  <Label>{t.total}</Label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          <Button
            type="button"
            onClick={handlePreview}
            className="flex-1 flex items-center justify-center gap-2"
            data-testid="button-preview-invoice"
          >
            <Eye className="h-4 w-4" />
            {t.previewInvoice}
          </Button>
          
          <Button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-download-pdf"
          >
            <Download className="h-4 w-4" />
            {t.downloadPDF}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
