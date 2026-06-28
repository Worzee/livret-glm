import type { AffectationEntreprise, Role } from '@/types';

/**
 * Traçabilité des affectations d'entreprise d'un·e apprenti·e (juin 2026).
 *
 * Pures fonctions — pas d'effet de bord (hors génération d'id), testables sans
 * React ni store. La dernière entrée de l'historique correspond à l'entreprise
 * actuelle (`Apprenti.entrepriseId`).
 */

export interface AuteurAffectation {
  id: string;
  nom: string;
  role: Role;
}

/** Crée une entrée d'affectation d'entreprise datée et attribuée. */
export function creerAffectation(
  entrepriseId: string,
  auteur: AuteurAffectation,
  dateIso: string,
): AffectationEntreprise {
  return {
    id: `aff-${crypto.randomUUID().slice(0, 8)}`,
    entrepriseId,
    dateIso,
    auteurId: auteur.id,
    auteurNom: auteur.nom,
    auteurRole: auteur.role,
  };
}

/**
 * Ajoute une affectation à l'historique uniquement si l'entreprise diffère de
 * la dernière entrée — évite les doublons consécutifs (ex. édition d'un·e
 * apprenti·e sans changement d'entreprise). Retourne l'historique inchangé (même
 * référence) sinon.
 */
export function ajouterAffectationSiChangement(
  historique: AffectationEntreprise[] | undefined,
  entrepriseId: string,
  auteur: AuteurAffectation,
  dateIso: string,
): AffectationEntreprise[] {
  const courant = historique ?? [];
  const derniere = courant[courant.length - 1];
  if (derniere && derniere.entrepriseId === entrepriseId) {
    return courant;
  }
  return [...courant, creerAffectation(entrepriseId, auteur, dateIso)];
}

/** Entreprise actuelle = dernière entrée de l'historique (ou undefined). */
export function entrepriseActuelle(
  historique: AffectationEntreprise[] | undefined,
): string | undefined {
  const h = historique ?? [];
  return h[h.length - 1]?.entrepriseId;
}
