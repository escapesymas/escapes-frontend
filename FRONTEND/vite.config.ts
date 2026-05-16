import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Todas las peticiones al backend durante el desarrollo se canalizarán a través
  // de nuestro servidor Node.js local (server.js) que actúa como un proxy seguro.
  const localBackendTarget = 'http://localhost:8080';

  return {
    plugins: [
      react(),
      // Generate .gz files for better serving performance
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Also generate .br (Brotli) files for modern browsers
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      })
    ],
    server: {
      proxy: {
        // Proxy para la API de WooCommerce
        '/wp-json': {
          target: localBackendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy para evitar CORS en producción y desarrollo (Unified Proxy)
        '/proxy-wc': {
          target: localBackendTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/proxy-wc/, ''),
        },
        // Proxy para la ruta de fallback de WooCommerce
        '/wp-fallback': {
          target: localBackendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Proxy para nuestra API interna (ej. pagos con SumUp)
        '/api': {
          target: localBackendTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      target: 'esnext', // Use latest JS for better minification/smaller bundles
      minify: 'terser', // Use Terser for better minification
      cssCodeSplit: true, // Split CSS into smaller files linked to chunks
      modulePreload: {
        polyfill: false // Modern browsers don't need module preload polyfills
      },
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: true,
        format: {
          comments: false // Remove all comments
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React stuff
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
              return 'vendor-core';
            }
            // Icons are big, keep them separate
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Router
            if (id.includes('node_modules/react-router') || id.includes('@remix-run/router')) {
              return 'vendor-router';
            }
            // Social Auth (Only loaded when login/register is opened)
            if (id.includes('node_modules/@react-oauth') || id.includes('node_modules/react-apple-signin-auth') || id.includes('node_modules/react-facebook-login')) {
              return 'vendor-auth';
            }
            // Other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-libs';
            }
          }
        }
      }
    }
  };
});
