// dirname-shim.js
import { fileURLToPath } from 'url';
import path from 'path';

// Only define __dirname if it doesn't exist (i.e., in ES modules)
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = path.dirname(fileURLToPath(import.meta.url));
}