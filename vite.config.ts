import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Use fallback to empty string to prevent "undefined" being injected into the code, causing syntax errors or crashes
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
    server: {
      proxy: {
        '/wp-json': {
          target: 'https://backendescapes.com',
          changeOrigin: true,
          secure: false,
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
      emptyOutDir: true
    }
  };
});