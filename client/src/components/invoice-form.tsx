import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, FileText, Download, Eye, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { invoiceSchema, type Invoice } from "@shared/schema";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientSelector } from "@/components/client-selector";
import { ClientStorage } from "@/lib/client-storage";
import { getLastInvoiceForClient } from "@/lib/invoice-history";

interface InvoiceFormProps {
  onInvoiceChange: (invoice: Invoice) => void;
}

export function InvoiceForm({ onInvoiceChange }: InvoiceFormProps) {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Function to generate new invoice number (fallback)
  const getFallbackInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  };

  // Async function to fetch next invoice number if configured
  const fetchNextInvoiceNumber = async () => {
    if (window.electronAPI) {
      try {
        const configStr = localStorage.getItem('businessConfig');
        if (configStr) {
          const config = JSON.parse(configStr);
          if (config.useAutoInvoiceNumber && config.invoiceSavePath) {
            const nextNum = await window.electronAPI.getNextInvoiceNumber(config.invoiceSavePath);
            if (nextNum) {
              return nextNum.toString();
            }
          }
        }
      } catch (e) {
        console.error("Failed to get auto invoice number", e);
      }
    }
    return null;
  };

  const form = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: getFallbackInvoiceNumber(),
      clientName: "",
      clientEmail: "",
      clientPersonnumber: "",
      clientAddress: "",
      services: [{ id: "1", name: "Städning", type: "fixed", hours: 1, rate: 0 }],
      taxRate: 0.25,
      includeSkatterabatt: true,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const watchedValues = form.watch();

  // Initialize invoice number
  React.useEffect(() => {
    const initInvoiceNumber = async () => {
      const autoNum = await fetchNextInvoiceNumber();
      if (autoNum) {
        form.setValue("invoiceNumber", autoNum);
      }
    };
    initInvoiceNumber();
  }, []);

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
      type: "hourly",
      hours: 1,
      rate: 0
    });
  };

  const removeService = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleClientSelect = (client: { name: string; email: string, personnumber: string, address: string }) => {
    form.setValue("clientName", client.name);
    form.setValue("clientEmail", client.email);
    form.setValue("clientPersonnumber", client.personnumber);
    form.setValue("clientAddress", client.address);
  };

  const handleClientSave = (name: string, email: string, personnumber: string, address: string) => {
    if (name.trim() && email.trim() && personnumber.trim() && address.trim()) {
      ClientStorage.saveClient(name, email, personnumber, address);
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

  const handleLoadFromHistory = () => {
    const clientName = watchedValues.clientName;
    console.log('Loading history for client:', clientName);

    if (!clientName.trim()) {
      toast({
        title: t.noInvoiceHistory,
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    const lastInvoice = getLastInvoiceForClient(clientName);
    console.log('Found invoice:', lastInvoice);

    if (!lastInvoice) {
      toast({
        title: t.noInvoiceHistory,
        description: `No previous invoice found for ${clientName}.`,
        variant: "destructive",
      });
      return;
    }

    // Populate form with last invoice data
    console.log('Loading services:', lastInvoice.services);
    form.setValue("services", lastInvoice.services);
    form.setValue("taxRate", lastInvoice.taxRate);
    form.setValue("includeSkatterabatt", lastInvoice.includeSkatterabatt);

    toast({
      title: t.invoiceHistoryLoaded,
      description: `Loaded ${lastInvoice.services.length} services from invoice #${lastInvoice.invoiceNumber}`,
    });
  };

  const handleDownload = async () => {
    if (form.formState.isValid) {
      try {
        await generateInvoicePDF(watchedValues, language);
        toast({
          title: t.pdfGenerated,
          description: t.downloadSuccessful,
        });

        // Generate new invoice number after successful download
        const autoNum = await fetchNextInvoiceNumber();
        const newInvoiceNumber = autoNum || getFallbackInvoiceNumber();
        form.setValue("invoiceNumber", newInvoiceNumber);

        toast({
          title: "Invoice number updated",
          description: `New invoice number: ${newInvoiceNumber}`,
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


          <ClientSelector
            selectedClient={{
              name: watchedValues.clientName,
              email: watchedValues.clientEmail,
              personnumber: watchedValues.clientPersonnumber,
              address: watchedValues.clientAddress
            }}
            onClientSelect={handleClientSelect}
            onClientSave={handleClientSave}
          />

          {/* Load from Last Invoice Button */}
          {watchedValues.clientName && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadFromHistory}
              className="flex items-center gap-2 w-full"
            >
              <History className="h-4 w-4" />
              {t.loadFromLastInvoice}
            </Button>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div className="floating-label-input">
              <Input
                {...form.register("clientPersonnumber")}
                placeholder=" "
                data-testid="input-client-personnumber"
              />
              <Label>{t.clientPersonnumber}</Label>
              {form.formState.errors.clientPersonnumber && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.clientPersonnumber.message}
                </p>
              )}
            </div>

            <div className="floating-label-input">
              <Input
                {...form.register("clientAddress")}
                type="address"
                placeholder=" "
                data-testid="input-client-address"
              />
              <Label>{t.clientAddress}</Label>
              {form.formState.errors.clientAddress && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.clientAddress.message}
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
                  {t.service} #{index + 1}
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

              <div className="flex items-center space-x-2">
                <Label htmlFor={`service-type-${index}`} className="text-sm font-medium">
                  {t.serviceType}:
                </Label>
                <Switch
                  id={`service-type-${index}`}
                  checked={watchedValues.services[index]?.type === "fixed"}
                  onCheckedChange={(checked) => {
                    form.setValue(`services.${index}.type` as const, checked ? "fixed" : "hourly");
                    if (checked) {
                      form.setValue(`services.${index}.hours` as const, undefined);
                      form.setValue(`services.${index}.rate` as const, undefined);
                    } else {
                      form.setValue(`services.${index}.total` as const, undefined);
                    }
                  }}
                  data-testid={`switch-service-type-${index}`}
                />
                <Label htmlFor={`service-type-${index}`} className="text-sm">
                  {watchedValues.services[index]?.type === "fixed" ? t.fixedService : t.hourlyService}
                </Label>
              </div>

              {watchedValues.services[index]?.type === "hourly" ? (
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
              ) : (
                <div className="floating-label-input">
                  <Input
                    {...form.register(`services.${index}.total` as const, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder=" "
                    data-testid={`input-service-total-${index}`}
                  />
                  <Label>{t.fixedTotal}</Label>
                  {form.formState.errors.services?.[index]?.total && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.services[index]?.total?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>


        <Separator />

        {/* Tax Rate Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="taxRate" className="text-md font-medium text-foreground">
              {t.taxRateLabel}
            </Label>
          </div>
          <div className="w-full max-w-xs">
            <Select
              value={(watchedValues.taxRate * 100).toString()}
              onValueChange={(value) => {
                form.setValue("taxRate", parseFloat(value) / 100);
              }}
            >
              <SelectTrigger data-testid="select-tax-rate">
                <SelectValue placeholder={t.taxRateLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Tax Free)</SelectItem>
                <SelectItem value="6">6%</SelectItem>
                <SelectItem value="12">12%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
                <SelectItem value="25">25% (Default)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Skatterabatt Section */}
        <div className="flex items-center space-x-2">
          <Switch
            id="include-skatterabatt"
            checked={watchedValues.includeSkatterabatt}
            onCheckedChange={(checked) => {
              form.setValue("includeSkatterabatt", checked);
            }}
          />
          <Label htmlFor="include-skatterabatt">{t.includeSkatterabatt}</Label>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          {/*<Button
            type="button"
            onClick={handlePreview}
            className="flex-1 flex items-center justify-center gap-2"
            data-testid="button-preview-invoice"
          >
            <Eye className="h-4 w-4" />
            {t.previewInvoice}
          </Button>*/}

          <Button
            type="button"
            onClick={async () => {
              handleClientSave(
                watchedValues.clientName,
                watchedValues.clientEmail,
                watchedValues.clientPersonnumber,
                watchedValues.clientAddress
              );
              await handleDownload();
            }}
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
