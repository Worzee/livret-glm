import type { Apprenti } from '@/types';

/**
 * Helpers autour des maîtres / tuteurs d'un·e apprenti·e.
 * Référence : retours coordonnateurs pédagogiques juin 2026.
 *
 * Un·e apprenti·e peut avoir jusqu'à **2 maîtres / tuteurs** :
 *   - le principal (`maitreApprentissageId`, obligatoire) — affiché dans les
 *     en-têtes et le PDF, porte l'entreprise de référence ;
 *   - un second optionnel (`maitreApprentissageSecondId`) — mêmes droits
 *     d'accès et d'édition, peut être d'une autre entreprise (mise à
 *     disposition, groupement d'employeurs…).
 *
 * Le slot de signature « Maître / Tuteur » reste **unique et partagé** :
 * n'importe lequel des deux signe au nom de l'entreprise (R9/R15 inchangées).
 */

/**
 * Liste des ids de maîtres d'un·e apprenti·e : principal + second éventuel,
 * sans doublon ni id vide.
 */
export function maitresIdsDeLApprenti(
  apprenti: Pick<Apprenti, 'maitreApprentissageId' | 'maitreApprentissageSecondId'>,
): string[] {
  const ids = [apprenti.maitreApprentissageId, apprenti.maitreApprentissageSecondId];
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/** True si `maitreId` est le maître principal OU second de l'apprenti·e. */
export function estMaitreDeLApprenti(
  maitreId: string,
  apprenti: Pick<Apprenti, 'maitreApprentissageId' | 'maitreApprentissageSecondId'>,
): boolean {
  return maitresIdsDeLApprenti(apprenti).includes(maitreId);
}
