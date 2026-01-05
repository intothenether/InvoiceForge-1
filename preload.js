const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('electronAPI', {
  // Example of exposing a function to the renderer process
  // You can add more functions here to interact with the main process
  // e.g., file system operations, database calls, etc.
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (path, data, encoding) => ipcRenderer.invoke('save-file', { path, data, encoding }),
  getNextInvoiceNumber: (path) => ipcRenderer.invoke('get-next-invoice-number', path),
  readDirectoryPDFs: (path) => ipcRenderer.invoke('read-directory-pdfs', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  saveFileSilent: (path, data, encoding) => ipcRenderer.invoke('save-file-silent', { path, data, encoding }),
  checkFileExists: (path) => ipcRenderer.invoke('check-file-exists', path),
  openDirectory: (dirPath) => ipcRenderer.invoke('open-directory', dirPath),

  // You can also listen for events from the main process
  on: (channel, callback) => {
    const validChannels = ['update-available']; // Whitelist channels
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});

console.log('Preload script loaded.');
