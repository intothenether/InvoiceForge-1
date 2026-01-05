import { Invoice } from "@shared/schema";

export interface InvoiceHistoryEntry {
    clientName: string;
    invoiceNumber: string;
    date: string; // ISO timestamp
    services: Invoice['services'];
    taxRate: number;
    includeSkatterabatt: boolean;
    total: number;
    clientEmail?: string;
    clientPersonnumber?: string;
    clientAddress?: string;
}

const STORAGE_KEY = 'invoiceHistory';
const MAX_HISTORY_ENTRIES = 100; // Limit storage size

/**
 * Save an invoice to history
 */
export function saveInvoiceToHistory(invoice: Invoice): void {
    try {
        console.log('Saving invoice to history:', invoice.clientName);
        const history = getAllInvoiceHistory();
        console.log('Current history length:', history.length);

        // Calculate total
        const total = invoice.services.reduce((sum, service) => {
            if (service.type === 'fixed') {
                return sum + (service.total || 0);
            } else {
                return sum + ((service.hours || 0) * (service.rate || 0));
            }
        }, 0);

        const entry: InvoiceHistoryEntry = {
            clientName: invoice.clientName,
            invoiceNumber: invoice.invoiceNumber,
            date: new Date().toISOString(),
            services: invoice.services,
            taxRate: invoice.taxRate,
            includeSkatterabatt: invoice.includeSkatterabatt,
            total,
            clientEmail: invoice.clientEmail,
            clientPersonnumber: invoice.clientPersonnumber,
            clientAddress: invoice.clientAddress,
        };

        // Add to beginning of array (most recent first)
        history.unshift(entry);

        // Limit size
        if (history.length > MAX_HISTORY_ENTRIES) {
            history.splice(MAX_HISTORY_ENTRIES);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('Invoice history saved successfully. New length:', history.length);
    } catch (error) {
        console.error('Failed to save invoice to history:', error);
    }
}

/**
 * Get the most recent invoice for a specific client
 */
export function getLastInvoiceForClient(clientName: string): InvoiceHistoryEntry | null {
    try {
        console.log('Searching history for client:', clientName);
        const history = getAllInvoiceHistory();
        console.log('History entries:', history.length);
        const normalized = clientName.trim().toLowerCase();

        const match = history.find(entry =>
            entry.clientName.trim().toLowerCase() === normalized
        );

        console.log('Match found:', match ? 'Yes' : 'No');
        return match || null;
    } catch (error) {
        console.error('Failed to get last invoice for client:', error);
        return null;
    }
}

/**
 * Get all invoice history
 */
export function getAllInvoiceHistory(): InvoiceHistoryEntry[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data) as InvoiceHistoryEntry[];
    } catch (error) {
        console.error('Failed to load invoice history:', error);
        return [];
    }
}

/**
 * Clear all invoice history (for debugging/reset)
 */
export function clearInvoiceHistory(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear invoice history:', error);
    }
}
