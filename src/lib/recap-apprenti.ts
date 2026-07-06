import type { FicheSuiviPeriode, LieuFiche, Livret } from '@/types';
import { estMotifEntretienTripartite } from './organisation-suivi';
import { periodeSignee } from './regles-periode';

/**
 * Helpers purs pour le tableau de bord récapitulatif de l'apprenti·e
 * (18 juin 2026) : échéances (entretien tripartite, période en cours, fin de
 * contrat) et progression (fiches signées, entretien tenu). Aucune
 * dépendance UI — réutilise les règles métier existantes.
 */

/** L'entretien est tenu quand les 3 parties l'ont signé. */
export function entretienTenu(livret: Livret): boolean {
  const e = livret.entretien;
  return (
    !!e && e.signatures.apprenti.signe && e.signatures.maitre.signe && e.signatures.formateur.signe
  );
}

/** Progression des fiches de période d'un lieu : signées / total. */
export interface ProgressionFiches {
  total: number;
  signees: number;
}

export function progressionFiches(
  fiches: ReadonlyArray<FicheSuiviPeriode>,
  lieu: LieuFiche,
): ProgressionFiches {
  return {
    total: fiches.length,
    signees: fiches.filter((f) => periodeSignee(f, lieu)).length,
  };
}

/**
 * Période « en cours » d'un lieu = première fiche non encore signée dans
 * l'ordre chronologique. `null` si toutes les fiches sont signées (ou aucune).
 */
export function periodeCourante(
  fiches: ReadonlyArray<FicheSuiviPeriode>,
  lieu: LieuFiche,
): FicheSuiviPeriode | null {
  const triees = [...fiches].sort((a, b) => a.numeroPeriode - b.numeroPeriode);
  return triees.find((f) => !periodeSignee(f, lieu)) ?? null;
}

export interface EcheanceEntretien {
  /** Date prévue (ISO) issue de l'événement d'organisation, si renseignée. */
  datePrevue?: string;
  /** L'entretien est-il déjà initialisé (objet non null) ? */
  initialise: boolean;
}

/**
 * Échéance de l'entretien tripartite : tant qu'il n'est pas signé par les
 * 3 parties, renvoie sa date prévue (si un événement d'organisation la
 * porte) et son état d'initialisation. `null` quand l'entretien est signé.
 */
export function echeanceEntretien(livret: Livret): EcheanceEntretien | null {
  if (entretienTenu(livret)) return null;
  const evt = livret.organisationSuivi.evenements.find((ev) =>
    estMotifEntretienTripartite(ev.motif),
  );
  return { datePrevue: evt?.date, initialise: livret.entretien !== null };
}

/**
 * Nombre de jours civils restants jusqu'à une date ISO (négatif si la date est
 * déjà passée). Arrondi au jour supérieur.
 */
export function joursRestants(dateIso: string, maintenant: Date = new Date()): number {
  const cible = Date.parse(dateIso);
  if (Number.isNaN(cible)) return 0;
  return Math.ceil((cible - maintenant.getTime()) / (24 * 60 * 60 * 1000));
}
