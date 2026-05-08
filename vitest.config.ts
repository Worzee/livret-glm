import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Configuration Vitest séparée de vite.config.ts pour éviter le conflit
// de types entre la version de Vite installée à la racine et celle bundlée
// par Vitest. Les deux configs partagent les mêmes alias.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Vitest ne doit voir que les tests unitaires sous src/.
    // Les tests E2E (Playwright) vivent dans e2e/ et ne sont pas exécutables ici.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
