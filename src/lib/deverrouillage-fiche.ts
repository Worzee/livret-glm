/**
 * Règle métier R10 — Déverrouillage d'une fiche signée par le formateur.
 * Référence : cahier des charges v1.3, §6 (matrice — note transverse) et §8.3.
 *
 *   « Une fois une fiche signée par les trois parties, elle passe en lecture
 *     seule pour tous (déverrouillable uniquement par le formateur référent
 *     avec confirmation explicite, pour simuler un désaccord qui bloquerait
 *     la validation). »
 *
 * La confirmation explicite est implémentée comme un motif obligatoire d'une
 * longueur minimale, consigné dans l'historique de la fiche pour assurer la
 * traçabilité du dispositif.
 */

/** Longueur minimale du motif (caractères, après trim). */
export const LONGUEUR_MIN_MOTIF = 10;

/** Longueur maximale du motif (caractères, après trim). */
export const LONGUEUR_MAX_MOTIF = 500;

export interface ResultatValidationMotif {
  ok: boolean;
  /** Message à afficher en `role="alert"` quand `ok === false`. */
  raison?: string;
}

/**
 * Valide le motif de déverrouillage saisi par le formateur référent.
 * Le motif est trimé avant comparaison.
 */
export function validerMotifDeverrouillage(motif: string): ResultatValidationMotif {
  const valeur = motif.trim();

  if (valeur.length === 0) {
    return { ok: false, raison: 'Le motif de déverrouillage est obligatoire.' };
  }

  if (valeur.length < LONGUEUR_MIN_MOTIF) {
    return {
      ok: false,
      raison: `Le motif doit contenir au moins ${LONGUEUR_MIN_MOTIF} caractères pour être traçable.`,
    };
  }

  if (valeur.length > LONGUEUR_MAX_MOTIF) {
    return {
      ok: false,
      raison: `Le motif ne peut excéder ${LONGUEUR_MAX_MOTIF} caractères.`,
    };
  }

  return { ok: true };
}
