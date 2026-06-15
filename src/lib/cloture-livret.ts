import type { ClotureLivret, Livret, Role } from '@/types';

/**
 * Règle métier R22 — Clôture du livret.
 * Référence : cahier des charges v1.3, section 8.5.
 *
 *   « La grille d'évaluation des compétences est éditable tant que le livret
 *     n'est pas clôturé. Le livret est considéré clôturé quand la dernière
 *     fiche de période est `verrouillée` et que le formateur référent a
 *     explicitement cliqué "Clôturer le livret". »
 *
 * Conséquences fonctionnelles :
 *   - Toutes les grilles d'évaluation finales passent en lecture seule.
 *   - Plus aucune fiche de période ne peut être déverrouillée (sauf via R10
 *     côté formateur — qui décide alors de rouvrir le livret en parallèle).
 *   - L'export PDF mentionne la date et l'auteur de la clôture.
 */

/** Indique si le livret a été clôturé par le formateur référent. */
export function estCloture(livret: Livret): boolean {
  return livret.cloture !== null;
}

/**
 * Indique si la clôture est techniquement autorisée à cet instant.
 *
 * Conditions cumulatives :
 *   - le livret n'est pas déjà clôturé,
 *   - au moins une fiche de période existe (un livret vide n'a rien à clôturer),
 *   - toutes les fiches de période sont en état `verrouillee`.
 */
export function peutCloturer(livret: Livret): boolean {
  if (estCloture(livret)) return false;
  if (livret.fichesSuivi.length === 0) return false;
  return livret.fichesSuivi.every((f) => f.etat === 'verrouillee');
}

/**
 * Retourne `null` si la clôture est possible, sinon un message d'erreur
 * explicite à afficher dans l'UI (ARIA `role="alert"` côté composant).
 */
export function motifBlocageCloture(livret: Livret): string | null {
  if (estCloture(livret)) {
    return 'Ce livret est déjà clôturé.';
  }
  if (livret.fichesSuivi.length === 0) {
    return "Aucune fiche de période n'a été créée. Créez et complétez au moins une période avant de clôturer le livret.";
  }
  const nonVerrouillees = livret.fichesSuivi.filter((f) => f.etat !== 'verrouillee');
  if (nonVerrouillees.length > 0) {
    const numeros = nonVerrouillees.map((f) => f.numeroPeriode).sort((a, b) => a - b);
    const liste =
      numeros.length === 1 ? `la période ${numeros[0]}` : `les périodes ${numeros.join(', ')}`;
    return `Pour clôturer le livret, ${nonVerrouillees.length} fiche(s) doivent encore être verrouillée(s) (${liste}).`;
  }
  return null;
}

/**
 * Construit l'objet `ClotureLivret` à enregistrer dans le store.
 * `maintenant` est injectable pour les tests.
 */
export function creerCloture(
  auteurId: string,
  auteurNom: string,
  auteurRole: Role,
  maintenant: Date = new Date(),
): ClotureLivret {
  return {
    dateCloture: maintenant.toISOString(),
    auteurId,
    auteurNom,
    auteurRole,
  };
}
