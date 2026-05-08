import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyage du DOM après chaque test (RTL recommandation).
afterEach(() => {
  cleanup();
});
