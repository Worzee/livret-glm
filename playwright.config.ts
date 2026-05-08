import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E du livret d'apprentissage.
 * Référence : cahier des charges v1.3, section 22.2.3.
 *
 * Cible : 5 scénarios (1 par sprint) couvrant les critères d'acceptance.
 * On teste contre `npm run preview` (build statique sur localhost:4173) :
 *   - pas de Basic Auth, pas de dépendance VPS
 *   - bundle réel (et non le mode dev avec HMR)
 *   - démarrage automatique via la directive `webServer` ci-dessous
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Le store partagé en localStorage exige une exécution séquentielle.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      // Le projet desktop ne joue pas les specs mobile-only (`*.mobile.spec.ts`).
      testIgnore: /.*\.mobile\.spec\.ts/,
    },
    {
      // Émulation smartphone Android représentative (393×851, dpr=2.75).
      // Cible le cas d'usage terrain : entretiens et visites de suivi sur mobile.
      name: 'mobile-pixel5',
      use: { ...devices['Pixel 5'] },
      // Les specs spécifiquement mobiles peuvent porter le suffixe `.mobile`.
      // Par défaut on ne joue que les audits dédiés au mobile sur ce projet.
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],

  // Lance automatiquement `vite preview` avant la suite.
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
