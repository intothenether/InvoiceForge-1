export interface SavedClient {
  id: string;
  name: string;
  email: string;
  personnumber: string;
  address: string;
  lastUsed: Date;
}

export class ClientStorage {
  static getClients(): SavedClient[] {
    const raw = localStorage.getItem('clients');
    if (!raw) return [];
    
    try {
      const clients = JSON.parse(raw);
      // Ensure lastUsed is a Date object
      return clients.map((client: any) => ({
        ...client,
        lastUsed: new Date(client.lastUsed)
      }));
    } catch (error) {
      console.error('Error parsing clients data:', error);
      return [];
    }
  }

  static saveClient(name: string, email: string, personnumber: string, address: string) {
    if (!name || !email || !personnumber || !address) return;
    
    const clients = ClientStorage.getClients();
    const id = `${personnumber}`;
    const existingIndex = clients.findIndex(c => c.id === id);
    const clientData = { id, name, email, personnumber, address, lastUsed: new Date() };
    
    if (existingIndex === -1) {
      clients.push(clientData);
    } else {
      clients[existingIndex] = clientData;
    }
    
    // Sort by lastUsed (most recent first)
    clients.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
    
    localStorage.setItem('clients', JSON.stringify(clients));
  }

  static deleteClient(id: string) {
    const clients = ClientStorage.getClients().filter(c => c.id !== id);
    localStorage.setItem('clients', JSON.stringify(clients));
  }

  static updateClientLastUsed(id: string) {
    const clients = ClientStorage.getClients();
    const clientIndex = clients.findIndex(c => c.id === id);
    
    if (clientIndex !== -1) {
      clients[clientIndex].lastUsed = new Date();
      // Sort by lastUsed (most recent first)
      clients.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }
}