import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    // Le chunk lazy ExportPdfLazy contient @react-pdf/renderer (~500 KB gzip),
    // mais il n'est chargé qu'au clic sur "Exporter le livret". Le bundle
    // initial reste autour de 95 KB gzippé, bien sous la cible CDC §19.1.
    chunkSizeWarningLimit: 600,
  },
});
