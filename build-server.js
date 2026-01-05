import { build } from 'esbuild';
import fs from 'fs';

async function buildServer() {
  try {
    console.log('Building server bundle...');
    
    const result = await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outdir: 'dist',
      outExtension: { '.js': '.cjs' },
      banner: {
        js: `
// CommonJS shims for import.meta.url and ES module compatibility
const { fileURLToPath } = require('url');
const { dirname, resolve } = require('path');

// Safe import.meta.url shim
function getImportMetaUrl() {
  if (require.main && require.main.filename) {
    const { pathToFileURL } = require('url');
    return pathToFileURL(require.main.filename).href;
  }
  
  if (process.argv[1]) {
    const { pathToFileURL } = require('url');
    return pathToFileURL(process.argv[1]).href;
  }
  
  // Electron fallback
  if (process.resourcesPath) {
    const { pathToFileURL } = require('url');
    return pathToFileURL(resolve(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.cjs')).href;
  }
  
  // Last resort
  const { pathToFileURL } = require('url');
  return pathToFileURL(resolve(process.cwd(), 'index.cjs')).href;
}

// Set up global import.meta
if (typeof globalThis.import === 'undefined') {
  globalThis.import = {
    meta: {
      url: getImportMetaUrl()
    }
  };
}

// Override import.meta usage in bundled code
const import_meta_url = getImportMetaUrl();

console.log('CJS Banner - import_meta_url:', import_meta_url);
`
      },
      // Don't bundle certain problematic packages
      external: [
        'electron', 
        'lightningcss',
        '@babel/preset-typescript',
        '@babel/core',
        'esbuild',
        'vite',
        'rollup',
        'postcss',
        'tailwindcss',
        'autoprefixer',
        '@vitejs/*',
        '@rollup/*',
        'rollup-plugin-*',
        'vite-plugin-*'
      ],
      define: {
        'process.env.NODE_ENV': '"production"',
        // Replace import.meta.url references with our shim
        'import.meta.url': 'import_meta_url'
      },
      metafile: true,
      logLevel: 'info',
      plugins: [
        {
          name: 'external-modules',
          setup(build) {
            // Mark build-time dependencies as external
            build.onResolve({ filter: /^(@babel|lightningcss|esbuild|vite|rollup|postcss|tailwindcss|autoprefixer)/ }, args => ({
              path: args.path,
              external: true
            }));
          }
        }
      ]
    });

    console.log('✓ Server bundle built successfully');
    
    // Create a package.json for the dist folder - use CommonJS
    const distPackageJson = {
      type: "commonjs",
      name: "invoiceforge-server",
      version: "1.0.0"
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));
    console.log('✓ Created dist/package.json with CommonJS type');
    
    // Check if the client build exists
    const publicPath = 'dist/public';
    if (fs.existsSync(publicPath)) {
      console.log('✓ Client build found at dist/public');
      const indexPath = 'dist/public/index.html';
      if (fs.existsSync(indexPath)) {
        console.log('✓ index.html found in client build');
      } else {
        console.warn('⚠️  index.html not found in client build');
      }
    } else {
      console.warn('⚠️  Client build not found. Run `vite build` first.');
    }
    
    // Write metafile for debugging
    if (result.metafile) {
      fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

buildServer();