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
    return raw ? JSON.parse(raw) : [];
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
  localStorage.setItem('clients', JSON.stringify(clients));
}

  static deleteClient(id: string) {
    const clients = ClientStorage.getClients().filter(c => c.id !== id);
    localStorage.setItem('clients', JSON.stringify(clients));
  }
}