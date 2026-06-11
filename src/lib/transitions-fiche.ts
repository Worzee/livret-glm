import type { EtatFiche, FicheSuiviPeriode, SignaturesTripartite } from '@/types';

/**
 * Machine à états des fiches de suivi par période.
 * Référence : cahier des charges v1.3, sections 8.3 (R15, R16, R17) et diagramme.
 *
 *   [*] --> brouillon
 *   brouillon --> en-cours          (R16 : 1ère modif)
 *   en-cours --> en-cours           (R15 : signature partielle)
 *   en-cours --> signee             (R15 : 3 signatures)
 *   signee --> verrouillee          (R17 : 15 j sans modif OU clic manuel)
 *   signee --> en-cours             (R10 : déverrouillage formateur)
 */

/** Durée en jours après laquelle une fiche signée devient verrouillée (R17). */
export const DUREE_VERROU_JOURS = 15;

/**
 * Compte les signatures effectivement apposées.
 */
export function nombreSignatures(signatures: SignaturesTripartite): number {
  let n = 0;
  if (signatures.apprenti.signe) n++;
  if (signatures.maitre.signe) n++;
  if (signatures.formateur.signe) n++;
  return n;
}

/**
 * Détermine si une fiche est totalement vide (jamais modifiée).
 * Une fiche vide reste en `brouillon`.
 */
export function ficheEstVide(fiche: FicheSuiviPeriode): boolean {
  // Refonte mai 2026 : le suivi GRETA CFA est désormais 2 zones de texte.
  if (fiche.suiviGretaCfa.apprenti?.trim()) return false;
  if (fiche.suiviGretaCfa.formateur?.trim()) return false;
  if (fiche.suiviEntreprise.length > 0) return false;
  if (fiche.observations.apprenti) return false;
  if (fiche.observations.maitre) return false;
  if (fiche.observations.formateur) return false;
  if (nombreSignatures(fiche.signatures) > 0) return false;
  return true;
}

/**
 * Calcule l'état déduit d'une fiche en fonction de ses données et de ses signatures.
 *
 * - Si verrouillée (état figé par R10/R17) → on conserve `verrouillee`.
 * - Sinon, si 3 signatures : `signee`
 * - Sinon, si la fiche a au moins une donnée saisie : `en-cours`
 * - Sinon : `brouillon`
 *
 * Cette fonction est appelée à chaque mutation pour recalculer l'état.
 * Elle n'écrit pas — elle retourne juste le nouvel état.
 */
export function deduireEtat(fiche: FicheSuiviPeriode): EtatFiche {
  // R17 (verrouillage manuel ou auto) prime sur tout
  if (fiche.etat === 'verrouillee') return 'verrouillee';

  const signatures = nombreSignatures(fiche.signatures);
  if (signatures === 3) return 'signee';
  if (signatures > 0) return 'en-cours';
  if (ficheEstVide(fiche)) return 'brouillon';
  return 'en-cours';
}

/**
 * Règle R21 — un rôle ne peut plus modifier ses propres champs après avoir
 * apposé sa signature, sauf via un déverrouillage R10 (qui réinitialise les
 * trois signatures).
 *
 * Cette fonction encapsule les deux conditions de blocage côté UI :
 *   - la fiche est verrouillée (R17 — auto ou manuel),
 *   - OU le rôle visé a déjà signé (R21 — non régression).
 *
 * Elle est consommée par `ZoneObservation`, `TableauTriColonnes` et
 * `SuiviGretaCfa` pour empêcher la modification des zones du rôle après sa
 * signature. Un sigle clair évite la duplication de cette logique.
 */
export function peutEncoreEditerFiche(
  fiche: FicheSuiviPeriode,
  role: 'apprenti' | 'maitre' | 'formateur',
): boolean {
  if (fiche.etat === 'verrouillee') return false;
  if (fiche.signatures[role].signe) return false;
  return true;
}

/**
 * Indique si une fiche signée a dépassé la durée d'inactivité de R17.
 * @param fiche — la fiche concernée
 * @param maintenant — date courante (injectable pour les tests)
 */
export function fichePeutEtreVerrouilleeAuto(
  fiche: FicheSuiviPeriode,
  maintenant: Date = new Date(),
): boolean {
  if (fiche.etat !== 'signee') return false;
  // Date de la dernière signature = la plus récente des 3
  const signatureDates = [
    fiche.signatures.apprenti.dateSignature,
    fiche.signatures.maitre.dateSignature,
    fiche.signatures.formateur.dateSignature,
  ].filter((d): d is string => Boolean(d));
  if (signatureDates.length === 0) return false;
  const derniereSignature = Math.max(...signatureDates.map((d) => Date.parse(d)));
  const ageMs = maintenant.getTime() - derniereSignature;
  const ageJours = ageMs / (1000 * 60 * 60 * 24);
  return ageJours >= DUREE_VERROU_JOURS;
}
