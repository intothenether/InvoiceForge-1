export interface ElectronAPI {
    getAppVersion: () => Promise<string>;
    selectDirectory: () => Promise<string | null>;
    saveFile: (path: string, data: string, encoding?: string) => Promise<{ success: boolean }>;
    getNextInvoiceNumber: (path: string) => Promise<number | null>;
    readDirectoryPDFs: (path: string) => Promise<{ name: string, path: string }[]>;
    readFile: (path: string) => Promise<string>;
    saveFileSilent: (path: string, data: string, encoding?: string) => Promise<{ success: boolean; error?: string }>;
    checkFileExists: (path: string) => Promise<boolean>;
    openDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    on: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
