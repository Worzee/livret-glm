import type { Page } from '@playwright/test';

/**
 * Helpers partagés entre les scénarios E2E.
 * Référence : cahier des charges v1.3, section 22.2.3.
 */

/**
 * Réinitialise complètement l'état applicatif :
 *  - vide le localStorage (livret + rôle actif)
 *  - recharge sur la page d'accueil
 *
 * À appeler en début de chaque test pour garantir une base déterministe
 * (rôle = formateur, livret de Léa MARTIN aux fixtures initiales).
 */
export async function resetState(page: Page): Promise<void> {
  // On charge d'abord pour avoir accès au localStorage de l'origine.
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/');
}

/**
 * Bascule de rôle via le `role="radiogroup"` du header.
 * @param label Libellé exact tel qu'affiché ("Apprenti·e", "Maître d'apprentissage", …)
 */
export async function selectRole(
  page: Page,
  label: 'Apprenti·e' | "Maître d'apprentissage" | 'Formateur référent' | 'Coordinateur·rice' | 'Admin',
): Promise<void> {
  await page.getByRole('radio', { name: label }).click();
  // Petite attente que l'état Zustand soit propagé.
  await page.waitForFunction((expected) => {
    const radios = Array.from(document.querySelectorAll('[role="radio"]')) as HTMLElement[];
    return radios.some((r) => r.getAttribute('aria-checked') === 'true' && r.textContent?.includes(expected));
  }, label);
}
