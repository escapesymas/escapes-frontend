import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
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
      emptyOutDir: true,
      sourcemap: false, // Disable sourcemaps for production speed
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code to reduce main bundle size
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-utils': ['@google/genai']
          }
        }
      }
    }
  };
});