import type { AttitudeProfessionnelle, Livret } from '@/types';

/**
 * Sélection des attitudes professionnelles d'un livret (13 juin 2026).
 *
 * Le choix se fait **lors de l'entretien tripartite 1** — par le maître /
 * tuteur et le formateur référent (ressource `entretien.attitudes-selection`)
 * — puis se fige à la 3ᵉ signature de l'E1, comme la sélection des
 * compétences abordées en entreprise. Les attitudes retenues sont ensuite
 * évaluées par le maître **à chaque entretien** (E1 compris).
 *
 * Pures fonctions — pas d'effet de bord.
 */

/**
 * La sélection est figée dès que l'entretien 1 est signé par les 3 parties
 * (R9). Tant que l'E1 n'est pas initialisé ou pas complètement signé, le
 * choix reste modifiable.
 */
export function selectionAttitudesFigee(livret: Livret): boolean {
  const e1 = livret.entretiens[1];
  if (!e1) return false;
  const s = e1.signatures;
  return s.apprenti.signe && s.maitre.signe && s.formateur.signe;
}

/** Coche/décoche un id dans la sélection (retourne une nouvelle liste). */
export function toggleIdSelection(ids: ReadonlyArray<string>, id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/**
 * Attitudes du catalogue retenues pour le livret, dans l'ordre du catalogue.
 * Les ids orphelins (attitude supprimée du catalogue entre-temps) sont
 * ignorés — protection d'affichage.
 */
export function attitudesRetenues(
  catalogue: ReadonlyArray<AttitudeProfessionnelle>,
  selection: ReadonlyArray<string>,
): AttitudeProfessionnelle[] {
  const ids = new Set(selection);
  return catalogue.filter((a) => ids.has(a.id));
}
