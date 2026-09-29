import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: false,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
