import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { Server } from "http";

// Safe way to get current directory without top-level await
function getCurrentDir() {
  // Try to detect if we're in CJS bundled environment
  if (typeof require !== 'undefined' && require.main) {
    return path.dirname(require.main.filename);
  } else if (process.argv[1]) {
    return path.dirname(process.argv[1]);
  } else {
    return process.cwd();
  }
}

const currentDir = getCurrentDir();

// Conditional imports for development vs production
let createViteServer: any = null;
let createLogger: any = null;
let viteConfig: any = null;

// Only import Vite in development or when available
const isDevelopment = process.env.NODE_ENV === 'development';
const isBundled = currentDir.includes('app.asar') || 
                 currentDir.includes('dist') ||
                 !fs.existsSync(path.join(currentDir, '..', 'vite.config.ts'));

// Initialize Vite imports asynchronously when needed
async function initializeViteImports() {
  if (!isDevelopment || isBundled) {
    return false;
  }
  
  try {
    const viteModule = await import("vite");
    createViteServer = viteModule.createServer;
    createLogger = viteModule.createLogger;
    
    try {
      const configModule = await import("../vite.config.js");
      viteConfig = configModule.default;
    } catch {
      viteConfig = {};
    }
    return true;
  } catch (error) {
    console.log('Vite not available in bundled environment, using static serving only');
    return false;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Initialize Vite imports
  const viteAvailable = await initializeViteImports();
  
  // Only set up Vite if we're in development and have access to it
  if (!isDevelopment || isBundled || !viteAvailable || !createViteServer) {
    console.log('Skipping Vite setup - using static serving instead');
    serveStatic(app);
    return null;
  }

  console.log('Setting up Vite development server...');
  
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        currentDir,
        "..",
        "client",
        "index.html"
      );

      // Check if file exists before trying to read it
      if (!fs.existsSync(clientTemplate)) {
        throw new Error(`Client template not found at: ${clientTemplate}`);
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      if (vite && vite.ssrFixStacktrace) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  return vite;
}

export function serveStatic(app: Express) {
  console.log('Setting up static file serving...');
  
  const processCwd = process.cwd();
  
  console.log("Server context info:");
  console.log(`  processCwd: ${processCwd}`);
  console.log(`  process.resourcesPath: ${process.resourcesPath || 'undefined'}`);
  console.log(`  process.argv[1]: ${process.argv[1] || 'undefined'}`);
  console.log(`  currentDir: ${currentDir}`);
  console.log(`  isBundled: ${isBundled}`);
  console.log("");

  // For embedded Electron context, we need to explicitly check the unpacked resources
  const isEmbeddedElectron = process.resourcesPath && !process.argv[1];
  
  let possiblePaths = [];
  
  if (isEmbeddedElectron || isBundled) {
    // When running embedded in Electron or bundled, prioritize unpacked resources
    possiblePaths = [
      path.join(process.resourcesPath || '', "app.asar.unpacked", "dist", "public"),
      path.join(process.resourcesPath || '', "dist", "public"),
      path.join(process.resourcesPath || '', "public"),
      path.join(currentDir, "..", "dist", "public"),
      path.join(currentDir, "public"),
      path.join(processCwd, "dist", "public"),
      path.join(processCwd, "public"),
    ];
  } else {
    // When running as separate process or in development
    possiblePaths = [
      path.join(processCwd, "dist", "public"),
      path.join(currentDir, "..", "dist", "public"),
      path.join(currentDir, "public"),
      path.join(processCwd, "public"),
      path.join(process.resourcesPath || "", "app.asar.unpacked", "dist", "public"),
      path.join(process.resourcesPath || "", "dist", "public"),
      path.join(process.resourcesPath || "", "public"),
      path.join(processCwd, "resources", "app.asar.unpacked", "dist", "public"),
      path.join(processCwd, "client", "dist"),
      path.resolve(processCwd, "dist", "public"),
      path.resolve("public"),
      path.resolve("dist", "public")
    ];
  }

  console.log(`Running in ${isEmbeddedElectron ? 'embedded Electron' : isBundled ? 'bundled' : 'separate process'} mode`);
  console.log("Searching for client files:");
  
  let selectedPath = null;

  for (const testPath of possiblePaths) {
    console.log(`  ${testPath}`);
    try {
      const dirExists = fs.existsSync(testPath);
      const indexExists = fs.existsSync(path.join(testPath, "index.html"));
      
      console.log(`    Directory exists: ${dirExists}`);
      console.log(`    index.html exists: ${indexExists}`);
      
      if (dirExists && indexExists) {
        selectedPath = testPath;
        console.log(`    ✓ SELECTED: ${selectedPath}`);
        break;
      }
    } catch (error: any) {
      console.log(`    Error checking path: ${error.message}`);
    }
  }

  if (!selectedPath) {
    console.log("❌ Could not find index.html in any location");
    
    // Show error page with debug info
    app.get("*", (req, res) => {
      res.status(404).send(`
        <html>
          <head><title>InvoiceForge - Files Not Found</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Client Files Not Found</h1>
            <p>The application could not locate the client files.</p>
            <p>Mode: ${isEmbeddedElectron ? 'Embedded Electron' : isBundled ? 'Bundled' : 'Separate Process'}</p>
            <details style="text-align: left; max-width: 600px; margin: 0 auto;">
              <summary>Debug Info</summary>
              <p><strong>Current Directory:</strong> ${processCwd}</p>
              <p><strong>Resources Path:</strong> ${process.resourcesPath || 'undefined'}</p>
              <p><strong>Process argv[1]:</strong> ${process.argv[1] || 'undefined'}</p>
              <p><strong>File Directory:</strong> ${currentDir}</p>
              <p><strong>Is Bundled:</strong> ${isBundled}</p>
              <p><strong>Searched Paths:</strong></p>
              <ul>
                ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </details>
          </body>
        </html>
      `);
    });
    
    return;
  }

  console.log(`\n🌐 Serving static files from: ${selectedPath}`);
  
  app.use(express.static(selectedPath));
  
  // Fallback for SPA routing
  app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(selectedPath!, "index.html"));
    }
  });
}