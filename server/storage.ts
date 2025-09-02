import { type Invoice, type Service } from "@shared/schema";
import { randomUUID } from "crypto";

// Simple storage interface for invoice functionality
export interface IStorage {
  saveInvoice(invoice: Invoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
}

export class MemStorage implements IStorage {
  private invoices: Map<string, Invoice>;

  constructor() {
    this.invoices = new Map();
  }

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const id = invoice.invoiceNumber || randomUUID();
    const savedInvoice: Invoice = { ...invoice, invoiceNumber: id };
    this.invoices.set(id, savedInvoice);
    return savedInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
}

export const storage = new MemStorage();
