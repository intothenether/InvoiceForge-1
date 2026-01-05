import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClientStorage, SavedClient } from "@/lib/client-storage";
import { Download, Upload, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export function ClientManagement() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<SavedClient[]>(ClientStorage.getClients());

  const refreshClients = () => {
    setClients(ClientStorage.getClients());
  };

  const handleExportClients = async () => {
    try {
      const clientsData = ClientStorage.getClients();
      
      if (clientsData.length === 0) {
        toast.error("No clients to export");
        return;
      }

      // Create human-readable JSON with proper formatting
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        clientCount: clientsData.length,
        clients: clientsData.map(client => ({
          name: client.name,
          email: client.email,
          personnumber: client.personnumber,
          address: client.address,
          lastUsed: client.lastUsed
        }))
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `clients-export-${dateStr}.json`;

      // Check if we're in a mobile environment
      const isNative = typeof window !== 'undefined' && 
                      (window as any).Capacitor?.isNativePlatform?.();

      if (isNative) {
        try {
          // Use Capacitor for mobile
          const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');

          const base64Data = btoa(jsonString);
          
          const writeResult = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
            recursive: true
          });

          await Share.share({
            title: 'Export Clients',
            text: 'Client data export file',
            url: writeResult.uri,
            dialogTitle: 'Share Client Export'
          });

          toast.success(`Exported ${clientsData.length} clients successfully`);
        } catch (capacitorError) {
          console.warn('Capacitor export failed, falling back to web download:', capacitorError);
          // Fallback to web download
          downloadFile(blob, filename);
        }
      } else {
        // Web browser download
        downloadFile(blob, filename);
      }

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export clients');
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${clients.length} clients successfully`);
  };

  const handleImportClients = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate the import data structure
        if (!importData.clients || !Array.isArray(importData.clients)) {
          throw new Error('Invalid file format: missing clients array');
        }

        // Validate each client entry
        const validClients = importData.clients.filter((client: any) => {
          return client.name && client.email && client.personnumber && client.address;
        });

        if (validClients.length === 0) {
          throw new Error('No valid clients found in the file');
        }

        // Get existing clients
        const existingClients = ClientStorage.getClients();
        let importedCount = 0;
        let updatedCount = 0;

        // Import each client
        validClients.forEach((clientData: any) => {
          const existingIndex = existingClients.findIndex(c => c.personnumber === clientData.personnumber);
          
          if (existingIndex === -1) {
            // New client
            ClientStorage.saveClient(
              clientData.name,
              clientData.email,
              clientData.personnumber,
              clientData.address
            );
            importedCount++;
          } else {
            // Update existing client
            ClientStorage.saveClient(
              clientData.name,
              clientData.email,
              clientData.personnumber,
              clientData.address
            );
            updatedCount++;
          }
        });

        refreshClients();

        let message = '';
        if (importedCount > 0 && updatedCount > 0) {
          message = `Imported ${importedCount} new clients and updated ${updatedCount} existing clients`;
        } else if (importedCount > 0) {
          message = `Imported ${importedCount} new clients`;
        } else if (updatedCount > 0) {
          message = `Updated ${updatedCount} existing clients`;
        }

        toast.success(message);

      } catch (error) {
        console.error('Import error:', error);
        toast.error(`Failed to import clients: ${error.message}`);
      }
    };

    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  const handleDeleteClient = (clientId: string) => {
    try {
      ClientStorage.deleteClient(clientId);
      refreshClients();
      toast.success('Client deleted successfully');
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const handleClearAllClients = () => {
    if (clients.length === 0) {
      toast.error('No clients to clear');
      return;
    }

    if (confirm(`Are you sure you want to delete all ${clients.length} clients? This action cannot be undone.`)) {
      try {
        clients.forEach(client => ClientStorage.deleteClient(client.id));
        refreshClients();
        toast.success('All clients cleared successfully');
      } catch (error) {
        toast.error('Failed to clear clients');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Management
        </CardTitle>
        <CardDescription>
          Export and import client data, or manage your saved clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export/Import Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Import/Export</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleExportClients}
              disabled={clients.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Clients ({clients.length})
            </Button>
            
            <div className="relative">
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportClients}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Clients
              </Button>
            </div>

            <Button 
              variant="destructive"
              onClick={handleClearAllClients}
              disabled={clients.length === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Saved Clients ({clients.length})
          </h3>
          
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No clients saved yet</p>
              <p className="text-sm">Clients will appear here when you save them from the invoice form</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.email} • {client.personnumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {client.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last used: {new Date(client.lastUsed).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How to use:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Export:</strong> Download all your saved clients as a JSON file</li>
            <li><strong>Import:</strong> Upload a previously exported JSON file to restore clients</li>
            <li><strong>Format:</strong> The export file is human-readable and can be edited in any text editor</li>
            <li><strong>Backup:</strong> Regular exports serve as backups of your client data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
