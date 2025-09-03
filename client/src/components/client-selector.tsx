import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ClientStorage, SavedClient } from "@/lib/client-storage";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientSelectorProps {
  selectedClient?: { name: string; email: string };
  onClientSelect: (client: { name: string; email: string }) => void;
  onClientSave: (name: string, email: string) => void;
}

export function ClientSelector({
  selectedClient,
  onClientSelect,
  onClientSave,
}: ClientSelectorProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<SavedClient[]>([]);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const savedClients = ClientStorage.getClients();
    setClients(savedClients);
  };

  const handleClientSelect = (client: SavedClient) => {
    onClientSelect({ name: client.name, email: client.email });
    ClientStorage.saveClient(client.name, client.email); // Update last used
    loadClients(); // Refresh the list
    setOpen(false);
  };

  const handleDeleteClient = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ClientStorage.deleteClient(clientId);
    loadClients();
  };

  const handleNewClient = () => {
    onClientSelect({ name: "", email: "" });
    setOpen(false);
  };

  const getDisplayText = () => {
    if (selectedClient?.name && selectedClient?.email) {
      return `${selectedClient.name} (${selectedClient.email})`;
    }
    return t.selectExistingClient;
  };

  return (
    <div className="space-y-2">
      <Label>{t.clientSelection}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              data-testid="button-client-selector"
            >
              <span className="truncate">
                {getDisplayText()}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput placeholder={t.searchClients} />
              <CommandEmpty>{t.noClientsFound}</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={handleNewClient} data-testid="button-new-client">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addNewClient}
                </CommandItem>
                {clients.length > 0 && (
                  <>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        onSelect={() => handleClientSelect(client)}
                        className="group"
                        data-testid={`client-option-${client.id}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center flex-1 min-w-0">
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedClient?.email === client.email
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium truncate">
                                {client.name}
                              </span>
                              <span className="text-sm text-muted-foreground truncate">
                                {client.email}
                              </span>
                            </div>
                          </div>
                          {showDeleteButtons && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 ml-2"
                              onClick={(e) => handleDeleteClient(client.id, e)}
                              data-testid={`delete-client-${client.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandGroup>
            </Command>
            {clients.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteButtons(!showDeleteButtons)}
                  className="w-full text-xs"
                >
                  {showDeleteButtons ? t.hideDeleteButtons : t.showDeleteButtons}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}