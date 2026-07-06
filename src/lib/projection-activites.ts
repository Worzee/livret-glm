import type { FicheSuiviPeriode, ModeleActivites, Referentiel } from '@/types';
import type { SyntheseCompetenceEntree } from './synthese-evaluation';

/**
 * Projection activités → compétences (juillet 2026 — chantier
 * référentiels/compétences #4).
 *
 * En mode d'évaluation « activités », le tuteur évalue des activités sur les
 * fiches de période entreprise ; la grille « Synthèse » reste PAR COMPÉTENCES,
 * alimentée par le prisme des activités : chaque évaluation d'activité se
 * projette sur toutes les compétences que son mapping couvre.
 *
 * Règle arbitrée par le pilote (Q3) : **last-write-wins chronologique toutes
 * activités confondues** — si l'activité A couvre c1+c2 (« Maîtrisé » en P2)
 * et l'activité B couvre c2 (« Partiel » en P3), c2 vaut « Partiel », avec la
 * provenance « via activité B — Période 3 ». `'non-fait'` et les lignes non
 * évaluées sont ignorés (mêmes conventions que `synthetiserCompetences`) ;
 * les activités libres (sans `activiteId`) ne se projettent pas.
 *
 * Le résultat est compatible avec `valeurEffective` /
 * `confirmationRequisePourEcraserHeritage` de `synthese-evaluation` :
 * l'écrasement manuel dans la grille reste permis (arbitrage Q3).
 */

/** Entrée de synthèse enrichie de l'activité d'origine (provenance). */
export interface ProjectionCompetenceEntree extends SyntheseCompetenceEntree {
  /** Activité dont provient la dernière évaluation projetée. */
  activiteId?: string;
}

export function projeterActivites(
  fichesEntreprise: ReadonlyArray<FicheSuiviPeriode>,
  modele: ModeleActivites,
  referentiel: Referentiel,
): Map<string, ProjectionCompetenceEntree> {
  const projection = new Map<string, ProjectionCompetenceEntree>();

  // Initialiser à null pour toutes les compétences du référentiel — les
  // mappings orphelins (compétence disparue) sont ainsi ignorés d'office.
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      projection.set(c.id, { acquisEntreprise: null });
    }
  }

  const activitesParId = new Map(modele.activites.map((a) => [a.id, a]));

  // Parcours chronologique (numéro de période croissant) ; au sein d'une
  // fiche, l'ordre du tableau fait foi — la dernière écriture gagne.
  for (const fiche of [...fichesEntreprise].sort((a, b) => a.numeroPeriode - b.numeroPeriode)) {
    for (const ligne of fiche.suiviEntreprise) {
      if (!ligne.activiteId) continue;
      const activite = activitesParId.get(ligne.activiteId);
      if (!activite) continue;
      if (ligne.evaluationEntreprise === null || ligne.evaluationEntreprise === 'non-fait') {
        continue;
      }
      for (const competenceId of activite.competenceIds) {
        const cible = projection.get(competenceId);
        if (!cible) continue;
        cible.acquisEntreprise = ligne.evaluationEntreprise;
        cible.periodeEntreprise = fiche.numeroPeriode;
        cible.activiteId = activite.id;
      }
    }
  }

  return projection;
}
