import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    middleware: true,
    proxy: { 
      '/api': { 
        target: 'http://localhost:5000', 
        changeOrigin: true,
        secure: false,
        ws: true
      } 
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  }
});
