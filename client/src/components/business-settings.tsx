import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessConfig, getBusinessConfig, saveBusinessConfig } from "@shared/config";
import { Save, RotateCcw, Folder } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function BusinessSettings() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<BusinessConfig>(getBusinessConfig());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedConfig = getBusinessConfig();
    setConfig(savedConfig);
  }, []);

  const handleInputChange = (field: keyof BusinessConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      saveBusinessConfig(config);
      setHasChanges(false);
      toast.success("Business information saved successfully!");
    } catch (error) {
      toast.error("Failed to save business information");
    }
  };

  const handleReset = () => {
    const defaultConfig = getBusinessConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Configure your business details that will appear on invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={config.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEmail">Email</Label>
            <Input
              id="businessEmail"
              type="email"
              value={config.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              placeholder="Enter business email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Phone</Label>
            <Input
              id="businessPhone"
              value={config.businessPhone}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessMomsregnr">VAT Number</Label>
            <Input
              id="businessMomsregnr"
              value={config.businessMomsregnr}
              onChange={(e) => handleInputChange('businessMomsregnr', e.target.value)}
              placeholder="Enter VAT registration number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPlusgiro">PlusGiro</Label>
            <Input
              id="businessPlusgiro"
              value={config.businessPlusgiro}
              onChange={(e) => handleInputChange('businessPlusgiro', e.target.value)}
              placeholder="Enter PlusGiro number"
            />
          </div>
        </div>

        {window.electronAPI && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-medium">Storage Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceSavePath">Invoice Save Directory</Label>
                <div className="flex gap-2">
                  <Input
                    id="invoiceSavePath"
                    value={config.invoiceSavePath || ""}
                    readOnly
                    placeholder="Default (Downloads)"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      try {
                        const path = await window.electronAPI?.selectDirectory();
                        if (path) {
                          handleInputChange('invoiceSavePath', path);
                        }
                      } catch (error) {
                        console.error('Failed to select directory:', error);
                      }
                    }}
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Directory where generated invoices will be saved automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stampedInvoiceSavePath">Stamped Invoice Save Directory</Label>
                <div className="flex gap-2">
                  <Input
                    id="stampedInvoiceSavePath"
                    value={config.stampedInvoiceSavePath || ""}
                    readOnly
                    placeholder="Default (Downloads)"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      try {
                        const path = await window.electronAPI?.selectDirectory();
                        if (path) {
                          handleInputChange('stampedInvoiceSavePath', path);
                        }
                      } catch (error) {
                        console.error('Failed to select directory:', error);
                      }
                    }}
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Directory where stamped PDFs will be saved automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="useAutoInvoiceNumber"
                checked={config.useAutoInvoiceNumber || false}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, useAutoInvoiceNumber: checked }))}
              />
              <div className="space-y-0.5">
                <Label htmlFor="useAutoInvoiceNumber">Auto-increment Invoice Number</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically set invoice number to the next available number from the Invoice Save Directory.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
