import type { AttitudeProfessionnelle, EntretienTripartite } from '@/types';

/**
 * Attitudes professionnelles — catalogue global + helpers.
 * Référence : retours coordos juin 2026.
 *
 * Les attitudes sortent du référentiel de compétences pour devenir un
 * **catalogue central unique** géré par l'admin (`/admin/attitudes`,
 * pattern banque de questions). Elles sont évaluées par le maître / tuteur
 * **à chaque entretien tripartite** (échelle ++/+/-/--) ; l'onglet
 * « Attitudes » de l'évaluation finale en devient une synthèse en lecture
 * seule (E1..E4).
 *
 * Pures fonctions — pas d'effet de bord.
 */

/**
 * Catalogue par défaut — reprend les 6 attitudes historiques du référentiel
 * CAP Cuisine (formulations génériques, valables pour toute spécialité).
 */
export const ATTITUDES_INITIALES: ReadonlyArray<AttitudeProfessionnelle> = [
  { id: 'a1', libelle: 'Ponctualité et assiduité' },
  { id: 'a2', libelle: 'Respect des consignes et de la hiérarchie' },
  { id: 'a3', libelle: 'Qualité du travail fourni' },
  { id: 'a4', libelle: "Intégration dans l'équipe" },
  { id: 'a5', libelle: "Prise d'initiative et autonomie" },
  { id: 'a6', libelle: 'Communication professionnelle' },
];

/**
 * Indique si une attitude est évaluée dans au moins un entretien existant.
 * Utilisé pour bloquer la suppression depuis le catalogue (cohérence
 * référentielle), comme pour les questions de la banque.
 */
export function attitudeEstUtilisee(
  attitudeId: string,
  entretiens: ReadonlyArray<EntretienTripartite | null>,
): boolean {
  for (const e of entretiens) {
    if (!e) continue;
    const valeur = e.evaluationsAttitudes[attitudeId];
    if (valeur !== undefined && valeur !== null) return true;
  }
  return false;
}

/**
 * Au moins une attitude évaluée dans l'entretien ? Extension R20 (juin
 * 2026) : exigée pour que le maître / tuteur puisse signer.
 */
export function auMoinsUneAttitudeEvaluee(entretien: EntretienTripartite): boolean {
  return Object.values(entretien.evaluationsAttitudes).some((v) => v !== null && v !== undefined);
}
