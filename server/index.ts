import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { resolve, dirname } from "path";

// Safe way to get __dirname in both ESM and CJS environments
function getServerPaths() {
  let __dirname: string;
  let __filename: string;

  // Try to detect if we're in CJS bundled environment
  if (typeof require !== 'undefined' && require.main) {
    __filename = require.main.filename;
    __dirname = dirname(__filename);
  } else if (process.argv[1]) {
    __filename = process.argv[1];
    __dirname = dirname(__filename);
  } else {
    // Final fallback
    __dirname = process.cwd();
    __filename = resolve(__dirname, 'index.js');
  }

  return { __dirname, __filename };
}

const { __dirname, __filename } = getServerPaths();

console.log('Server __dirname:', __dirname);
console.log('Server __filename:', __filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Simple static file serving for production
function serveStatic(app: express.Application) {
  console.log('Setting up static file serving...');
  
  // Try multiple possible paths for the built client files
  const possibleStaticPaths = [
    // First check if we're in a packaged environment
    resolve(process.resourcesPath || '', 'app.asar.unpacked', 'dist', 'public'),
    resolve(process.resourcesPath || '', 'dist', 'public'),
    resolve(__dirname, '../dist/public'),
    resolve(__dirname, '../../dist/public'),
    resolve(__dirname, 'public'),
    resolve(process.cwd(), 'dist/public'),
    // Additional paths for packaged environment
    resolve(process.cwd(), '..', 'dist', 'public'),
    resolve(process.cwd(), 'resources', 'app.asar.unpacked', 'dist', 'public'),
  ];
  
  console.log('Searching for static files in:');
  let staticPath = null;
  for (const testPath of possibleStaticPaths) {
    console.log(`  Checking: ${testPath}`);
    try {
      if (require('fs').existsSync(testPath)) {
        const indexPath = resolve(testPath, 'index.html');
        if (require('fs').existsSync(indexPath)) {
          staticPath = testPath;
          console.log(`✓ Found static files at: ${staticPath}`);
          break;
        } else {
          console.log(`    Directory exists but no index.html`);
        }
      } else {
        console.log(`    Directory does not exist`);
      }
    } catch (err) {
      console.log(`    Error checking: ${err.message}`);
    }
  }
  
  if (staticPath) {
    // Serve static files
    app.use(express.static(staticPath));
    
    // Serve index.html for all non-API routes (SPA fallback)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      const indexPath = resolve(staticPath!, 'index.html');
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Static files not found');
      }
    });
  } else {
    console.warn('⚠️  No static files found, serving minimal fallback');
    console.log('Debug info:');
    console.log(`  __dirname: ${__dirname}`);
    console.log(`  process.cwd(): ${process.cwd()}`);
    console.log(`  process.resourcesPath: ${process.resourcesPath}`);
    console.log(`  app.getAppPath(): ${require('electron').app?.getAppPath()}`);
    
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.send(`
        <html>
          <head><title>InvoiceForge</title></head>
          <body>
            <h1>InvoiceForge Server</h1>
            <p>Static files not found. Please check the build configuration.</p>
            <details>
              <summary>Debug Information</summary>
              <p><strong>__dirname:</strong> ${__dirname}</p>
              <p><strong>process.cwd():</strong> ${process.cwd()}</p>
              <p><strong>process.resourcesPath:</strong> ${process.resourcesPath}</p>
              <p><strong>Searched paths:</strong></p>
              <ul>
                ${possibleStaticPaths.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </details>
          </body>
        </html>
      `);
    });
  }
}

// Create the server setup function for Electron to use
export async function createElectronServer() {
  console.log('Creating Electron server...');
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  // Detect bundled/packaged environment more reliably
  const isBundled = typeof (process as any).pkg !== 'undefined' || 
                   (typeof (process as any).resourcesPath === 'string' && (process as any).resourcesPath?.includes('app.asar')) ||
                   __filename.includes('index.cjs') ||
                   __filename.includes('app.asar') ||
                   process.cwd().includes('AppData');
                     
  console.log(`Server environment: ${isBundled ? 'bundled/packaged' : 'development'}`);
  
  // Always use static serving in bundled version
  serveStatic(app);

  return server;
}

// Export the Express app for Electron to use  
export { app };

// Export a default function that creates and returns the server
export default async function createServer() {
  return await createElectronServer();
}

// Only start server if running directly (not imported by Electron)
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isDirectRun = isMainModule || 
                   __filename.includes('index.cjs') ||
                   process.argv[1]?.includes('index.cjs');

if (isDirectRun) {
  (async () => {
    const server = await createElectronServer();
    const port = parseInt(process.env.PORT || "5000", 10);
    
    server.listen(port, "0.0.0.0", () => {
      console.log("SERVER_READY");
      console.log(`Server listening at http://localhost:${port}`);
    });
  })();
}