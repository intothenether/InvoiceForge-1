export interface SavedClient {
  id: string;
  name: string;
  email: string;
  lastUsed: Date;
}

const STORAGE_KEY = 'invoice-clients';

export class ClientStorage {
  static getClients(): SavedClient[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const clients = JSON.parse(stored);
      return clients.map((client: any) => ({
        ...client,
        lastUsed: new Date(client.lastUsed)
      }));
    } catch (error) {
      console.error('Error loading clients from storage:', error);
      return [];
    }
  }

  static saveClient(name: string, email: string): void {
    if (!name.trim() || !email.trim()) return;

    const clients = this.getClients();
    const existingIndex = clients.findIndex(client => 
      client.email.toLowerCase() === email.toLowerCase()
    );

    const clientData: SavedClient = {
      id: existingIndex >= 0 ? clients[existingIndex].id : this.generateId(),
      name: name.trim(),
      email: email.trim(),
      lastUsed: new Date()
    };

    if (existingIndex >= 0) {
      clients[existingIndex] = clientData;
    } else {
      clients.push(clientData);
    }

    // Sort by last used (most recent first)
    clients.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

    // Keep only the last 50 clients
    const limitedClients = clients.slice(0, 50);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedClients));
    } catch (error) {
      console.error('Error saving client to storage:', error);
    }
  }

  static deleteClient(id: string): void {
    const clients = this.getClients().filter(client => client.id !== id);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error deleting client from storage:', error);
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}