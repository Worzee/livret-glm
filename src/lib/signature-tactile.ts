/**
 * Signature manuscrite tactile (doigt, stylet ou souris) — maquette.
 * Référence : CDC v1.5 §14.C + cadrage du 12 juin 2026.
 *
 * La zone de dessin capture des « traits » (polylignes de points) ; à la
 * confirmation, le canvas est exporté en PNG (data-URL) et stocké dans
 * `SignaturePartie.trace`.
 *
 * ⚠ Valeur probante : en étape 1 (maquette sans authentification réelle),
 * le tracé est purement déclaratif — comme le bouton « Signer » qu'il
 * remplace. La valeur juridique (signature électronique « simple » eIDAS)
 * viendra en étape 2 avec les comptes authentifiés et l'horodatage serveur.
 * RGPD : on stocke uniquement l'image statique — JAMAIS la dynamique du
 * tracé (vitesse, pression), qui relèverait de la biométrie (art. 9).
 */

export interface PointTrace {
  x: number;
  y: number;
}

/** Une signature = une liste de traits, chaque trait = une polyligne. */
export type TraitsSignature = PointTrace[][];

/**
 * Longueur cumulée minimale (px CSS) pour considérer un tracé comme une
 * signature volontaire — écarte le point isolé ou le micro-gribouillis
 * accidentel (frôlement d'écran).
 */
export const LONGUEUR_MIN_SIGNATURE = 60;

/** Longueur euclidienne cumulée de tous les traits, en px. */
export function longueurTraits(traits: TraitsSignature): number {
  let total = 0;
  for (const trait of traits) {
    for (let i = 1; i < trait.length; i++) {
      total += Math.hypot(trait[i].x - trait[i - 1].x, trait[i].y - trait[i - 1].y);
    }
  }
  return total;
}

/**
 * True si le tracé constitue une signature exploitable : au moins un trait
 * et une longueur cumulée ≥ LONGUEUR_MIN_SIGNATURE. C'est la condition
 * d'activation du bouton « Confirmer » de la zone de signature.
 */
export function traceEstSignificative(traits: TraitsSignature): boolean {
  if (traits.length === 0) return false;
  return longueurTraits(traits) >= LONGUEUR_MIN_SIGNATURE;
}
