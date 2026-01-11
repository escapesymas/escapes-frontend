import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Todas las peticiones al backend durante el desarrollo se canalizarán a través
  // de nuestro servidor Node.js local (server.js) que actúa como un proxy seguro.
  const localBackendTarget = 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy para la API de WooCommerce
        '/wp-json': {
          target: localBackendTarget,
          changeOrigin: true,
          secure: false,
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
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    }
  };
});