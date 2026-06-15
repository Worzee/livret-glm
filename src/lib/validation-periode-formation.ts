import type { FicheSuiviPeriode, Livret, PeriodeFormation } from '@/types';

/**
 * Validation et verrous des périodes définies au niveau formation
 * (refonte mai 2026 — chantier #1).
 *
 * Le coordo/admin gère le planning des périodes d'une promotion ; chaque
 * période génère une fiche dans le livret de chaque apprenti·e. Ces
 * helpers garantissent la cohérence du planning (dates valides, pas de
 * chevauchement) et protègent les fiches déjà signées contre les
 * modifications structurelles.
 */

export interface SaisiePeriode {
  titre?: string;
  dateDebut: string;
  dateFin: string;
}

export interface ErreursPeriode {
  titre?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface ResultatValidationPeriode {
  ok: boolean;
  erreurs: ErreursPeriode;
}

/**
 * Valide les dates d'une période et l'absence de chevauchement avec les
 * autres périodes de la même formation.
 *
 * @param saisie       Champs de saisie du formulaire.
 * @param existantes   Périodes déjà définies sur la formation (sans
 *                     `idACourtCircuiter` pour le cas de l'édition).
 * @param idACourtCircuiter  Quand on édite une période existante, son id
 *                           est ignoré lors du contrôle de chevauchement
 *                           (sinon elle se chevaucherait elle-même).
 */
export function validerSaisiePeriode(
  saisie: SaisiePeriode,
  existantes: ReadonlyArray<PeriodeFormation>,
  idACourtCircuiter?: string,
): ResultatValidationPeriode {
  const erreurs: ErreursPeriode = {};

  if (!saisie.dateDebut) {
    erreurs.dateDebut = 'La date de début est obligatoire.';
  }
  if (!saisie.dateFin) {
    erreurs.dateFin = 'La date de fin est obligatoire.';
  }

  if (saisie.dateDebut && saisie.dateFin && saisie.dateFin <= saisie.dateDebut) {
    // R11 (cohérence chronologique) appliquée au planning formation.
    erreurs.dateFin = 'La date de fin doit être strictement postérieure au début (R11).';
  }

  // R12 — pas de chevauchement avec les autres périodes de la formation.
  if (saisie.dateDebut && saisie.dateFin && !erreurs.dateFin) {
    const chevauche = existantes.find((p) => {
      if (p.id === idACourtCircuiter) return false;
      // Chevauchement = pas séparé par une frontière franche.
      return !(saisie.dateFin <= p.dateDebut || saisie.dateDebut >= p.dateFin);
    });
    if (chevauche) {
      const debut = formaterDate(chevauche.dateDebut);
      const fin = formaterDate(chevauche.dateFin);
      const libelle = chevauche.titre
        ? `« ${chevauche.titre} »`
        : `la période n° ${chevauche.numero}`;
      erreurs.dateDebut = `Les dates chevauchent ${libelle} (du ${debut} au ${fin}).`;
    }
  }

  return { ok: Object.keys(erreurs).length === 0, erreurs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verrou modification/suppression : refus si fiches signées ou verrouillées
// ─────────────────────────────────────────────────────────────────────────────

export interface VerrouPeriode {
  /** `true` si l'opération est autorisée, `false` sinon. */
  peut: boolean;
  /** Raison du blocage (vide quand `peut === true`). */
  raison: string;
  /** Nombre d'apprenti·e·s impacté·e·s (fiches signées/verrouillées trouvées). */
  apprentisImpactes: number;
}

/**
 * Compte les fiches d'apprenti·e·s déjà signées ou verrouillées qui
 * référencent cette période. Si > 0, on refuse modification et suppression
 * (cohérent avec la politique de cohérence référentielle du projet).
 */
export function evaluerVerrouPeriode(
  periode: PeriodeFormation,
  livrets: ReadonlyArray<Livret>,
  operation: 'modification' | 'suppression',
): VerrouPeriode {
  const fichesImpactees = livrets.flatMap((l) =>
    l.fichesSuivi.filter((f) => fichePointePeriode(f, periode)),
  );
  const fichesFigees = fichesImpactees.filter(
    (f) => f.etat === 'signee' || f.etat === 'verrouillee',
  );

  if (fichesFigees.length === 0) {
    return { peut: true, raison: '', apprentisImpactes: 0 };
  }

  const verbe = operation === 'modification' ? 'modifier' : 'supprimer';
  return {
    peut: false,
    raison: `Impossible de ${verbe} : ${fichesFigees.length} fiche${fichesFigees.length > 1 ? 's' : ''} d'apprenti·e·s ${fichesFigees.length > 1 ? 'sont' : 'est'} déjà signée${fichesFigees.length > 1 ? 's' : ''} ou verrouillée${fichesFigees.length > 1 ? 's' : ''}. Déverrouillez-les d'abord via R10.`,
    apprentisImpactes: fichesFigees.length,
  };
}

/**
 * Détermine si une fiche de livret pointe sur cette période. On lie via
 * `periodeFormationId` quand présent, sinon via `numeroPeriode` (compat
 * fixtures héritées qui n'ont pas l'id de période).
 */
export function fichePointePeriode(fiche: FicheSuiviPeriode, periode: PeriodeFormation): boolean {
  if (fiche.periodeFormationId) return fiche.periodeFormationId === periode.id;
  return fiche.numeroPeriode === periode.numero;
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-numérotation après suppression
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renumérote les périodes de 1 à N en préservant l'ordre chronologique
 * (par `dateDebut`). Utilisé après suppression d'une période.
 */
export function renumeroterPeriodes(periodes: ReadonlyArray<PeriodeFormation>): PeriodeFormation[] {
  return [...periodes]
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
    .map((p, idx) => ({ ...p, numero: idx + 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Affichage
// ─────────────────────────────────────────────────────────────────────────────

export function libellePeriode(periode: PeriodeFormation): string {
  const base = `Période ${periode.numero}`;
  return periode.titre ? `${base} — ${periode.titre}` : base;
}

function formaterDate(iso: string): string {
  // Format français lisible — pas de dépendance externe.
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
