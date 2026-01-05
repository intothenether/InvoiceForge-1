import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { spawn } from "child_process";
import fs from "fs";
import net from "net";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;
let server;
let isServerReady = false;
let serverRetries = 0;
const MAX_SERVER_RETRIES = 3;
const SERVER_PORT = 5000;

// Get correct paths based on installation type
function getServerPaths() {
  const possibleServerPaths = [
    // Try .cjs first (new bundled format)
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.cjs'),
    path.join(__dirname, 'dist', 'index.cjs'),
    path.join(process.resourcesPath, 'dist', 'index.cjs'),
    path.join(app.getAppPath(), 'dist', 'index.cjs'),

    // Fallback to .mjs
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.mjs'),
    path.join(__dirname, 'dist', 'index.mjs'),
    path.join(process.resourcesPath, 'dist', 'index.mjs'),
    path.join(app.getAppPath(), 'dist', 'index.mjs'),

    // Fallback to .js
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.js'),
    path.join(__dirname, 'dist', 'index.js'),
    path.join(process.resourcesPath, 'dist', 'index.js'),
    path.join(app.getAppPath(), 'dist', 'index.js'),
  ];

  return possibleServerPaths;
}

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    testServer.listen(port, () => {
      testServer.close(() => resolve(true));
    });
    testServer.on('error', () => resolve(false));
  });
}

// Kill any process using the port
async function killPortProcess(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? `netstat -ano | findstr :${port}` : `lsof -ti:${port}`;

    require('child_process').exec(cmd, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        resolve(false);
        return;
      }

      if (isWindows) {
        const lines = stdout.trim().split('\n');
        const pids = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1];
        }).filter(pid => pid && pid !== '0');

        if (pids.length > 0) {
          require('child_process').exec(`taskkill /PID ${pids.join(' /PID ')} /F`, () => resolve(true));
        } else {
          resolve(false);
        }
      } else {
        require('child_process').exec(`kill -9 ${stdout.trim()}`, () => resolve(true));
      }
    });
  });
}

async function startEmbeddedServer() {
  try {
    console.log('Starting embedded server...');

    // Kill any existing process on port 5000
    const portAvailable = await isPortAvailable(SERVER_PORT);
    if (!portAvailable) {
      console.log(`Port ${SERVER_PORT} is in use, attempting to free it...`);
      await killPortProcess(SERVER_PORT);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const possibleServerPaths = getServerPaths();

    let serverPath = null;

    for (const testPath of possibleServerPaths) {
      console.log(`Checking server path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        serverPath = testPath;
        console.log(`✓ Found server at: ${serverPath}`);
        break;
      }
    }

    if (!serverPath) {
      throw new Error('Server file not found in any location!');
    }

    console.log(`Loading server from: ${serverPath}`);

    // Handle different file types
    const serverFileName = path.basename(serverPath);
    let serverModule;

    if (serverFileName.endsWith('.cjs')) {
      // For CommonJS files, use require directly
      delete require.cache[serverPath]; // Clear cache
      serverModule = require(serverPath);
      console.log('Loaded CommonJS server module');
    } else {
      // For ES modules, use dynamic import
      const serverFileURL = pathToFileURL(serverPath).href;
      console.log(`Server file URL: ${serverFileURL}`);
      const importUrl = `${serverFileURL}?t=${Date.now()}`;
      serverModule = await import(importUrl);
      console.log('Loaded ES module server');
    }

    console.log('Server module keys:', Object.keys(serverModule));

    // Try different export patterns
    let createServerFn;
    let expressApp;

    if (typeof serverModule.createElectronServer === 'function') {
      createServerFn = serverModule.createElectronServer;
      console.log('Using createElectronServer function');
    } else if (typeof serverModule.default === 'function') {
      createServerFn = serverModule.default;
      console.log('Using default export function');
    } else if (serverModule.default && typeof serverModule.default.createElectronServer === 'function') {
      createServerFn = serverModule.default.createElectronServer;
      console.log('Using default.createElectronServer function');
    } else if (serverModule.app) {
      expressApp = serverModule.app;
      console.log('Using exported app');
    } else if (serverModule.default && serverModule.default.app) {
      expressApp = serverModule.default.app;
      console.log('Using default.app');
    }

    if (!createServerFn && !expressApp) {
      console.error('Available exports:', Object.keys(serverModule));
      if (serverModule.default) {
        console.error('Default export keys:', Object.keys(serverModule.default || {}));
      }
      throw new Error(`Could not find server function or app. Available exports: ${Object.keys(serverModule).join(', ')}`);
    }

    console.log('Found server function/app, starting on port 5000...');

    // Start the server
    if (createServerFn) {
      server = await createServerFn();
    } else {
      // Create HTTP server from Express app
      const http = require('http');
      server = http.createServer(expressApp);
    }

    server.listen(SERVER_PORT, '0.0.0.0', () => {
      console.log('SERVER_READY');
      console.log(`Embedded server listening at http://localhost:${SERVER_PORT}`);
      isServerReady = true;

      if (mainWindow) {
        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`).catch((err) => {
          console.error(`Failed to load URL: ${err.message}`);
        });
      }
    });

    server.on('error', (err) => {
      console.error(`Embedded server error: ${err.message}`);
      console.log('Falling back to process approach...');
      setTimeout(() => startServerAsProcess(), 2000);
    });

  } catch (err) {
    console.error(`Failed to start embedded server: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    console.log('Attempting fallback to separate process...');
    setTimeout(() => startServerAsProcess(), 2000);
  }
}

async function startServerAsProcess() {
  if (serverProcess || serverRetries >= MAX_SERVER_RETRIES) {
    console.log('Server already running or max retries reached');
    return;
  }

  console.log(`Starting server process attempt ${serverRetries + 1}...`);

  const portAvailable = await isPortAvailable(SERVER_PORT);
  if (!portAvailable) {
    console.log(`Port ${SERVER_PORT} is in use, attempting to free it...`);
    await killPortProcess(SERVER_PORT);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const stillInUse = !(await isPortAvailable(SERVER_PORT));
    if (stillInUse) {
      console.log('Port still in use after cleanup attempt');
      serverRetries++;
      if (serverRetries < MAX_SERVER_RETRIES) {
        setTimeout(() => startServerAsProcess(), 5000);
      } else {
        showErrorPage();
      }
      return;
    }
  }

  const possibleServerPaths = getServerPaths();

  let serverPath = null;

  for (const testPath of possibleServerPaths) {
    console.log(`Checking: ${testPath}`);
    if (fs.existsSync(testPath)) {
      serverPath = testPath;
      console.log(`✓ Found server at: ${serverPath}`);
      break;
    } else {
      console.log(`✗ Not found: ${testPath}`);
    }
  }

  if (!serverPath) {
    console.log('Server file not found in any location for process spawn!');
    showErrorPage();
    return;
  }

  const nodeExecutable = findNodeExecutable();
  console.log(`Using Node.js executable: ${nodeExecutable}`);

  const spawnOptions = {
    stdio: "pipe",
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: SERVER_PORT.toString()
    }
  };

  if (nodeExecutable === process.execPath) {
    spawnOptions.env.ELECTRON_RUN_AS_NODE = '1';
  }

  // Handle different file types for spawning
  const serverFileName = path.basename(serverPath);
  let spawnArgs;

  if (serverFileName.endsWith('.cjs')) {
    // For CommonJS files, direct execution
    spawnArgs = [serverPath];
  } else if (serverFileName.endsWith('.mjs')) {
    // For ES module files, direct execution
    spawnArgs = [serverPath];
  } else {
    // For .js files, use the wrapper script approach
    const wrapperScript = `import('${pathToFileURL(serverPath).href}').then(() => console.log('Server module loaded')).catch(err => { console.error('Failed to load server:', err); process.exit(1); });`;
    spawnArgs = ['--input-type=module', '--eval', wrapperScript];
  }

  console.log(`Spawning server with args: ${spawnArgs.join(' ')}`);
  serverProcess = spawn(nodeExecutable, spawnArgs, spawnOptions);

  serverProcess.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(`Server stdout: ${output.trim()}`);

    if (output.includes('SERVER_READY') || output.includes('listening') || output.includes('Server started')) {
      isServerReady = true;
      console.log('Server is ready! Loading app...');
      if (mainWindow) {
        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`).catch((err) => {
          console.log(`Failed to load URL: ${err.message}`);
        });
      }
    }
  });

  serverProcess.stderr.on("data", (data) => {
    const error = data.toString();
    console.error(`Server stderr: ${error.trim()}`);
  });

  serverProcess.on("close", (code) => {
    console.log(`Server process closed with code ${code}`);
    serverProcess = null;
    isServerReady = false;

    if (code !== 0 && serverRetries < MAX_SERVER_RETRIES) {
      serverRetries++;
      console.log(`Retrying server start in 3 seconds (attempt ${serverRetries + 1}/${MAX_SERVER_RETRIES})...`);
      setTimeout(() => startServerAsProcess(), 3000);
    } else if (serverRetries >= MAX_SERVER_RETRIES) {
      showErrorPage();
    }
  });

  serverProcess.on("error", (err) => {
    console.error(`Server spawn error: ${err.message} (code: ${err.code})`);
    serverProcess = null;
    isServerReady = false;

    if (serverRetries < MAX_SERVER_RETRIES) {
      serverRetries++;
      console.log(`Retrying server start in 3 seconds (attempt ${serverRetries + 1}/${MAX_SERVER_RETRIES})...`);
      setTimeout(() => startServerAsProcess(), 3000);
    } else {
      showErrorPage();
    }
  });
}

function findNodeExecutable() {
  const possibleNodePaths = [
    'node',
    'node.exe',
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\Program Files (x86)\\nodejs\\node.exe',
    path.join(process.env.PROGRAMFILES || '', 'nodejs', 'node.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'nodejs', 'node.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'nodejs', 'node.exe'),
  ];

  for (const nodePath of possibleNodePaths) {
    try {
      if (nodePath.includes(':') && fs.existsSync(nodePath)) {
        console.log(`Found Node.js at: ${nodePath}`);
        return nodePath;
      } else if (!nodePath.includes(':')) {
        console.log(`Using system Node.js command: ${nodePath}`);
        return nodePath;
      }
    } catch (err) {
      console.log(`Node.js not accessible at: ${nodePath}`);
    }
  }

  console.log('No system Node.js found, will use Electron in Node mode');
  return process.execPath;
}

function showErrorPage() {
  if (!mainWindow) return;

  mainWindow.loadURL(`data:text/html,
    <html>
      <head><title>InvoiceForge - Server Error</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center; color: #333;">
        <h1 style="color: #e74c3c;">Server Failed to Start</h1>
        <p>The InvoiceForge server could not be started.</p>
        <p>Please check the console for detailed error logs.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Try Again
        </button>
        <br><br>
        <details style="text-align: left; max-width: 600px; margin: 0 auto;">
          <summary>Debug Information</summary>
          <p><strong>App Path:</strong> ${app.getAppPath()}</p>
          <p><strong>Resources Path:</strong> ${process.resourcesPath}</p>
          <p><strong>Packaged:</strong> ${app.isPackaged}</p>
          <p><strong>Server Retries:</strong> ${serverRetries}/${MAX_SERVER_RETRIES}</p>
        </details>
      </body>
    </html>
  `);
}

function createWindow() {
  if (mainWindow) return;

  console.log('Creating window...');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Expose backend functions to frontend
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  });

  //mainWindow.webContents.openDevTools();

  mainWindow.loadURL(`data:text/html,
    <html>
      <head><title>Starting InvoiceForge</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h1>Starting InvoiceForge server...</h1>
        <p>Please wait while the server starts up.</p>
        <div style="margin-top: 20px;">
          <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </body>
    </html>
  `);

  mainWindow.on("closed", () => {
    console.log('Window closed');
    mainWindow = null;
    if (serverProcess) {
      console.log('Killing server process...');
      serverProcess.kill('SIGTERM');
    }
    if (server) {
      console.log('Closing embedded server...');
      server.close();
    }
  });
}

app.whenReady().then(() => {
  console.log('App ready, starting server and creating window...');
  console.log(`App packaged: ${app.isPackaged}`);
  console.log(`App path: ${app.getAppPath()}`);
  console.log(`Resources path: ${process.resourcesPath}`);
  console.log(`__dirname: ${__dirname}`);

  startEmbeddedServer();
  createWindow();
});

app.on("window-all-closed", () => {
  console.log('All windows closed');
  if (process.platform !== "darwin") {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
    if (server) {
      server.close();
    }
    app.quit();
  }
});


// IPC Handlers
import { ipcMain, dialog } from "electron";

ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('save-file', async (event, { path: defaultPath, data, encoding }) => {
  try {
    if (!mainWindow) return { success: false };

    // Show save dialog with the provided default path
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (canceled || !savePath) {
      return { success: false, canceled: true };
    }

    // Determine write encoding
    const writeEncoding = encoding || 'base64';
    const buffer = Buffer.from(data, writeEncoding);

    // Ensure directory exists (though save dialog usually handles this context, 
    // but good to be safe if they typed a new path)
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(savePath, buffer);
    return { success: true, filePath: savePath };
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

ipcMain.handle('get-next-invoice-number', async (event, directory) => {
  try {
    if (!fs.existsSync(directory)) {
      return null;
    }

    const files = fs.readdirSync(directory);
    let maxNumber = 0;

    // Pattern to look for numbers at the end of filename before extension
    // e.g. invoice_test_1001.pdf -> 1001
    // Matches _123.pdf
    const regex = /_(\d+)\.pdf$/i;

    for (const file of files) {
      const match = file.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // If we found numbers, return max + 1
    // If no numbers found (or maxNumber is 0), maybe start at 1001? Or 1?
    // Let's assume 1001 is a good start if folder is empty or has no numbered invoices
    return maxNumber > 0 ? maxNumber + 1 : 1001;
  } catch (error) {
    console.error('Failed to get next invoice number:', error);
    return null;
  }
});

ipcMain.handle('read-directory-pdfs', async (event, directoryPath) => {
  try {
    if (!fs.existsSync(directoryPath)) {
      return [];
    }

    const files = fs.readdirSync(directoryPath);
    // Filter for PDF files
    const pdfFiles = files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file,
        path: path.join(directoryPath, file)
      }));

    return pdfFiles;
  } catch (error) {
    console.error('Failed to read directory:', error);
    throw error;
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
});

ipcMain.handle('save-file-silent', async (event, { path: savePath, data, encoding }) => {
  try {
    const writeEncoding = encoding || 'base64';
    const buffer = Buffer.from(data, writeEncoding);

    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(savePath, buffer);
    return { success: true, filePath: savePath };
  } catch (error) {
    console.error('Failed to save file silently:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  if (server) {
    server.close();
  }
});

// IPC handler to open directory in file explorer
ipcMain.handle('open-directory', async (event, dirPath) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(dirPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening directory:', error);
    return { success: false, error: error.message };
  }
});