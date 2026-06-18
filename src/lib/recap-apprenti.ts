import type { FicheSuiviPeriode, LieuFiche, Livret, NumeroEntretien } from '@/types';
import { NUMEROS_ENTRETIEN } from '@/types';
import { numeroEntretienPourMotif } from './organisation-suivi';
import { periodeSignee } from './regles-periode';

/**
 * Helpers purs pour le tableau de bord récapitulatif de l'apprenti·e
 * (18 juin 2026) : échéances (prochain entretien, période en cours, fin de
 * contrat) et progression (fiches signées, entretiens tenus). Aucune
 * dépendance UI — réutilise les règles métier existantes.
 */

/** Un entretien est tenu quand les 3 parties l'ont signé. */
function entretienSigne(livret: Livret, numero: NumeroEntretien): boolean {
  const e = livret.entretiens[numero];
  return (
    !!e &&
    e.signatures.apprenti.signe &&
    e.signatures.maitre.signe &&
    e.signatures.formateur.signe
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
  numero: NumeroEntretien;
  /** Date prévue (ISO) issue de l'événement d'organisation, si renseignée. */
  datePrevue?: string;
  /** L'entretien est-il déjà initialisé (objet non null) ? */
  initialise: boolean;
}

/**
 * Prochaine échéance d'entretien tripartite : le plus petit numéro (≤
 * `nombreEntretiens`) non encore signé par les 3 parties, avec sa date prévue
 * si un événement d'organisation la porte. `null` si tous les entretiens
 * prévus sont signés.
 */
export function prochainEntretien(
  livret: Livret,
  nombreEntretiens: number,
): EcheanceEntretien | null {
  for (const numero of NUMEROS_ENTRETIEN) {
    if (numero > nombreEntretiens) break;
    if (entretienSigne(livret, numero)) continue;
    const evt = livret.organisationSuivi.evenements.find(
      (ev) => numeroEntretienPourMotif(ev.motif) === numero,
    );
    return { numero, datePrevue: evt?.date, initialise: livret.entretiens[numero] !== null };
  }
  return null;
}

/** Nombre d'entretiens signés (3 parties) sur le total prévu par la formation. */
export function progressionEntretiens(
  livret: Livret,
  nombreEntretiens: number,
): { signes: number; total: number } {
  let signes = 0;
  for (const numero of NUMEROS_ENTRETIEN) {
    if (numero > nombreEntretiens) break;
    if (entretienSigne(livret, numero)) signes++;
  }
  return { signes, total: nombreEntretiens };
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
