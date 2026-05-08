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
 * Pour chaque bloc, compte le nombre de compétences à chaque niveau de maîtrise
 * (entreprise et centre). Ces stats alimentent la visualisation graphique
 * (barres empilées par bloc).
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
  centre: StatsNiveau;
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
 */
export function calculerStatsParBloc(
  referentiel: Referentiel,
  lignes: LigneEvaluationFinaleCompetence[],
  synthese: Map<string, { acquisEntreprise: NiveauMaitrise | null; acquisCentre: NiveauMaitrise | null }>,
): StatsBloc[] {
  const lignesParId = new Map(lignes.map((l) => [l.competenceId, l]));

  return referentiel.blocs.map((bloc) => {
    const ent = statsVides();
    const cen = statsVides();
    for (const c of bloc.competences) {
      const ligne = lignesParId.get(c.id) ?? {
        competenceId: c.id,
        acquisEntreprise: null,
        acquisCentre: null,
      };
      compterNiveau(valeurEffective(ligne, synthese, 'acquisEntreprise').valeur, ent);
      compterNiveau(valeurEffective(ligne, synthese, 'acquisCentre').valeur, cen);
    }
    return { bloc, entreprise: ent, centre: cen };
  });
}

/**
 * Petite fonction utilitaire — pourcentage entier d'un sous-ensemble.
 */
export function pourcent(partie: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((partie / total) * 100);
}
