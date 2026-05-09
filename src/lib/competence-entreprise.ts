import type { Competence } from '@/types';

/**
 * Helpers autour du flag `Competence.evalueeEnEntreprise`.
 *
 * Règle métier (décidée avec le pilote, mai 2026) :
 *   - Une compétence est par défaut **abordée en entreprise** quand le flag
 *     n'est pas explicitement défini (rétrocompatibilité avec les anciens
 *     référentiels et avec les imports CSV/XLSX qui ne portent pas cette
 *     information).
 *   - Le coordo·rice ou l'admin peut basculer ce flag par compétence depuis
 *     la page `/admin/referentiels`.
 *   - Quand `evalueeEnEntreprise === false`, la compétence disparaît du
 *     sélecteur d'ajout dans la fiche « Suivi de la formation en entreprise ».
 *     Les lignes déjà saisies pour cette compétence restent visibles
 *     (cohérence historique, on ne supprime pas du travail validé).
 *
 * Pures fonctions — testables sans React ni store.
 */

export function estEvalueeEnEntreprise(competence: Competence): boolean {
  return competence.evalueeEnEntreprise !== false;
}

export function filtrerCompetencesEvalueesEnEntreprise<T extends Competence>(
  competences: ReadonlyArray<T>,
): T[] {
  return competences.filter(estEvalueeEnEntreprise);
}
