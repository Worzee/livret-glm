import type {
  BlocCompetences,
  LigneEvaluationFinaleCompetence,
  NiveauMaitrise,
  Referentiel,
} from '@/types';
import { valeurEffective } from './synthese-evaluation';

/**
 * Calcul des statistiques agrégées par bloc de compétences.
 * Référence : cahier des charges v1.3, sections 5.4 et 8.5 (R23).
 *
 * Pour chaque bloc, compte le nombre de compétences à chaque niveau de
 * maîtrise en entreprise (juillet 2026 : la colonne centre a disparu avec le
 * tableau de compétences des fiches centre). Ces stats alimentent la
 * visualisation graphique (barres empilées par bloc).
 */

export interface StatsNiveau {
  maitrise: number;
  partiel: number;
  nonMaitrise: number;
  /** Compétences sans évaluation (ni manuelle, ni hérité). */
  nonEvalue: number;
  /** Total des compétences du bloc. */
  total: number;
}

export interface StatsBloc {
  bloc: BlocCompetences;
  entreprise: StatsNiveau;
}

function compterNiveau(niveau: NiveauMaitrise | null, stats: StatsNiveau): void {
  switch (niveau) {
    case 'maitrise':
      stats.maitrise++;
      break;
    case 'partiel':
      stats.partiel++;
      break;
    case 'non-maitrise':
      stats.nonMaitrise++;
      break;
    case null:
      stats.nonEvalue++;
      break;
  }
  stats.total++;
}

function statsVides(): StatsNiveau {
  return { maitrise: 0, partiel: 0, nonMaitrise: 0, nonEvalue: 0, total: 0 };
}

/**
 * Calcule les stats par bloc en tenant compte des saisies manuelles ET de la
 * synthèse héritée des fiches de suivi (R23 : mise à jour temps réel).
 * Le référentiel passé ici doit déjà être restreint aux compétences
 * concernées (évaluables + sélection entreprise — cf.
 * `restreindreReferentielALaSelection`).
 */
export function calculerStatsParBloc(
  referentiel: Referentiel,
  lignes: LigneEvaluationFinaleCompetence[],
  synthese: Map<string, { acquisEntreprise: NiveauMaitrise | null }>,
): StatsBloc[] {
  const lignesParId = new Map(lignes.map((l) => [l.competenceId, l]));

  return referentiel.blocs.map((bloc) => {
    const ent = statsVides();
    for (const c of bloc.competences) {
      const ligne = lignesParId.get(c.id) ?? {
        competenceId: c.id,
        acquisEntreprise: null,
      };
      compterNiveau(valeurEffective(ligne, synthese).valeur, ent);
    }
    return { bloc, entreprise: ent };
  });
}

/**
 * Petite fonction utilitaire — pourcentage entier d'un sous-ensemble.
 */
export function pourcent(partie: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((partie / total) * 100);
}
