import type {
  FicheSuiviPeriode,
  LigneEvaluationFinaleCompetence,
  NiveauMaitrise,
  Referentiel,
} from '@/types';

/**
 * Synthèse de l'évaluation finale à partir des fiches de suivi par période.
 * Référence : cahier des charges v1.3, section 5.4.
 *
 * Pour chaque compétence du référentiel, on parcourt les fiches dans l'ordre
 * chronologique et on retient la DERNIÈRE évaluation non-nulle (last-write-wins).
 *
 * - colonne `acquisCentre` <-- dernière `evaluationGreta` non-nulle
 * - colonne `acquisEntreprise` <-- dernière `evaluationEntreprise` non-nulle
 *   (la valeur 'non-fait' est ignorée, considérée comme "pas encore une évaluation
 *   finale d'acquis")
 *
 * Cette fonction NE mute PAS le livret : elle retourne une suggestion qui sera
 * affichée à côté des saisies manuelles (héritage transparent).
 */
export function synthetiserCompetences(
  fiches: FicheSuiviPeriode[],
  referentiel: Referentiel,
): Map<string, { acquisEntreprise: NiveauMaitrise | null; acquisCentre: NiveauMaitrise | null }> {
  const synthese = new Map<
    string,
    { acquisEntreprise: NiveauMaitrise | null; acquisCentre: NiveauMaitrise | null }
  >();

  // Initialiser à null pour toutes les compétences du référentiel
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      synthese.set(c.id, { acquisEntreprise: null, acquisCentre: null });
    }
  }

  // Parcourir les fiches dans l'ordre chronologique
  const fichesTriees = [...fiches].sort((a, b) => a.numeroPeriode - b.numeroPeriode);
  for (const fiche of fichesTriees) {
    for (const ligne of fiche.suiviEntreprise) {
      if (!ligne.competenceId) continue;
      const cible = synthese.get(ligne.competenceId);
      if (!cible) continue;
      // Centre : tous les niveaux maîtrise/partiel/non-maîtrise
      if (ligne.evaluationGreta !== null) {
        cible.acquisCentre = ligne.evaluationGreta;
      }
      // Entreprise : on ignore 'non-fait' (pas encore évalué)
      if (ligne.evaluationEntreprise !== null && ligne.evaluationEntreprise !== 'non-fait') {
        cible.acquisEntreprise = ligne.evaluationEntreprise;
      }
    }
  }

  return synthese;
}

/**
 * Récupère la valeur effective d'une cellule de la grille finale :
 * - la saisie manuelle si elle existe (non-null)
 * - sinon la valeur héritée des fiches via la synthèse
 */
export function valeurEffective(
  ligne: LigneEvaluationFinaleCompetence,
  synthese: Map<string, { acquisEntreprise: NiveauMaitrise | null; acquisCentre: NiveauMaitrise | null }>,
  colonne: 'acquisEntreprise' | 'acquisCentre',
): { valeur: NiveauMaitrise | null; source: 'manuelle' | 'synthese' | 'aucune' } {
  if (ligne[colonne] !== null) {
    return { valeur: ligne[colonne], source: 'manuelle' };
  }
  const heritage = synthese.get(ligne.competenceId);
  if (heritage && heritage[colonne] !== null) {
    return { valeur: heritage[colonne], source: 'synthese' };
  }
  return { valeur: null, source: 'aucune' };
}
