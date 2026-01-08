import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  const proxyConfig = {
    target: 'https://backendescapes.com',
    changeOrigin: true,
    secure: false,
    configure: (proxy, _options) => {
      proxy.on('proxyReq', (proxyReq, req, _res) => {
        proxyReq.removeHeader('Origin');
        proxyReq.removeHeader('Referer');
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      });
    }
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy Estándar
        '/wp-json': proxyConfig,
        // Proxy Fallback (Redirige /wp-fallback a la raíz del dominio)
        '/wp-fallback': {
          ...proxyConfig,
          rewrite: (path) => path.replace(/^\/wp-fallback/, '')
        },
        '/api': {
          target: 'http://localhost:8080',
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