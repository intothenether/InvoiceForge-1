// This file is injected by esbuild to provide shims for CJS builds.

// Shim for import.meta.url
// In a CJS context, we need to determine the current file URL
import { pathToFileURL } from 'url';

// Safely get current file path with multiple fallbacks
function getCurrentFilePath() {
  // Try all possible ways to get the current file path
  if (require.main && require.main.filename) {
    return require.main.filename;
  }
  
  if (process.argv[1]) {
    return process.argv[1];
  }
  
  // If in Electron, we might be able to get it from process.resourcesPath
  if (process.resourcesPath) {
    const { join } = require('path');
    return join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.cjs');
  }
  
  // Last resort: use current working directory
  const { resolve } = require('path');
  return resolve(process.cwd(), 'index.cjs');
}

// Set up import.meta.url
if (typeof import.meta === 'undefined') {
  const filePath = getCurrentFilePath();
  globalThis.import = {
    meta: {
      url: filePath ? pathToFileURL(filePath).href : 'file://'
    }
  };
}

// Shim for __dirname and __filename with robust fallbacks
import { dirname } from 'path';
export const __filename = getCurrentFilePath();
export const __dirname = __filename ? dirname(__filename) : process.cwd();

// Log the values for debugging
console.log('Shim __filename:', __filename);
console.log('Shim __dirname:', __dirname);
