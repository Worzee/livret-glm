import type {
  FicheSuiviPeriode,
  LigneEvaluationFinaleCompetence,
  NiveauMaitrise,
  Referentiel,
} from '@/types';

/** Une entrée de synthèse par compétence : la dernière éval connue côté
 *  centre et côté entreprise, accompagnée du numéro de période d'origine
 *  pour permettre à l'UI d'afficher « Vu en Période N ». */
export interface SyntheseCompetenceEntree {
  acquisEntreprise: NiveauMaitrise | null;
  acquisCentre: NiveauMaitrise | null;
  /** Numéro de la dernière période où la cellule entreprise a été évaluée. */
  periodeEntreprise?: number;
  /** Numéro de la dernière période où la cellule centre a été évaluée. */
  periodeCentre?: number;
}

/**
 * Synthèse de l'évaluation finale à partir des fiches de suivi par période.
 * Référence : cahier des charges v1.3, section 5.4.
 *
 * Deux sources distinctes depuis le 17 juin 2026 (périodes en centre) :
 * - `acquisEntreprise` <-- dernière `evaluationEntreprise` non-nulle des
 *   **fiches entreprise** (`Livret.fichesSuivi`, évaluées par le tuteur) ;
 * - `acquisCentre` <-- dernière `evaluationGreta` non-nulle des **fiches
 *   centre** (`Livret.fichesSuiviCentre`, évaluées par le formateur référent).
 *
 * Pour chaque source, on parcourt les fiches dans l'ordre chronologique et on
 * retient la DERNIÈRE évaluation non-nulle (last-write-wins). La valeur
 * 'non-fait' est ignorée (compétence non abordée — pas un acquis).
 *
 * Cette fonction NE mute PAS le livret : elle retourne une suggestion affichée
 * à côté des saisies manuelles (héritage transparent).
 */
export function synthetiserCompetences(
  fichesEntreprise: FicheSuiviPeriode[],
  fichesCentre: FicheSuiviPeriode[],
  referentiel: Referentiel,
): Map<string, SyntheseCompetenceEntree> {
  const synthese = new Map<string, SyntheseCompetenceEntree>();

  // Initialiser à null pour toutes les compétences du référentiel
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      synthese.set(c.id, { acquisEntreprise: null, acquisCentre: null });
    }
  }

  // Entreprise : dernière `evaluationEntreprise` non-nulle (last-write-wins).
  for (const fiche of [...fichesEntreprise].sort((a, b) => a.numeroPeriode - b.numeroPeriode)) {
    for (const ligne of fiche.suiviEntreprise) {
      if (!ligne.competenceId) continue;
      const cible = synthese.get(ligne.competenceId);
      if (!cible) continue;
      if (ligne.evaluationEntreprise !== null && ligne.evaluationEntreprise !== 'non-fait') {
        cible.acquisEntreprise = ligne.evaluationEntreprise;
        cible.periodeEntreprise = fiche.numeroPeriode;
      }
    }
  }

  // Centre : dernière `evaluationGreta` non-nulle (last-write-wins).
  for (const fiche of [...fichesCentre].sort((a, b) => a.numeroPeriode - b.numeroPeriode)) {
    for (const ligne of fiche.suiviEntreprise) {
      if (!ligne.competenceId) continue;
      const cible = synthese.get(ligne.competenceId);
      if (!cible) continue;
      if (ligne.evaluationGreta !== null && ligne.evaluationGreta !== 'non-fait') {
        cible.acquisCentre = ligne.evaluationGreta;
        cible.periodeCentre = fiche.numeroPeriode;
      }
    }
  }

  return synthese;
}

/**
 * Récupère la valeur effective d'une cellule de la grille finale :
 * - la saisie manuelle si elle existe (non-null)
 * - sinon la valeur héritée des fiches via la synthèse
 *
 * `numeroPeriode` n'est renseigné que pour `source = 'synthese'` (utile pour
 * afficher « Vu en Période N » dans l'UI).
 */
export function valeurEffective(
  ligne: LigneEvaluationFinaleCompetence,
  synthese: Map<string, SyntheseCompetenceEntree>,
  colonne: 'acquisEntreprise' | 'acquisCentre',
): {
  valeur: NiveauMaitrise | null;
  source: 'manuelle' | 'synthese' | 'aucune';
  numeroPeriode?: number;
} {
  if (ligne[colonne] !== null) {
    return { valeur: ligne[colonne], source: 'manuelle' };
  }
  const heritage = synthese.get(ligne.competenceId);
  if (heritage && heritage[colonne] !== null) {
    const numeroPeriode =
      colonne === 'acquisEntreprise' ? heritage.periodeEntreprise : heritage.periodeCentre;
    return { valeur: heritage[colonne], source: 'synthese', numeroPeriode };
  }
  return { valeur: null, source: 'aucune' };
}

/**
 * Garde-fou de la grille finale (retours coordos juin 2026) : une valeur
 * héritée des fiches de période ne doit pas être écrasée d'un simple clic.
 * Retourne `true` si la saisie `nouvelleValeur` remplacerait un héritage —
 * l'UI doit alors demander une confirmation explicite.
 *
 * - Effacement (`null`) : jamais de confirmation. Sur une cellule héritée
 *   c'est un no-op (la ligne est déjà à `null`) ; sur une saisie manuelle
 *   cela réactive l'héritage (comportement documenté de « Non renseigné »).
 * - Saisie manuelle existante : modifiable librement (l'héritage a déjà été
 *   écrasé en connaissance de cause).
 * - Toute valeur non-nulle sur une cellule héritée — même identique —
 *   demande confirmation : la cellule cesserait de suivre les fiches.
 */
export function confirmationRequisePourEcraserHeritage(
  ligne: LigneEvaluationFinaleCompetence,
  synthese: Map<string, SyntheseCompetenceEntree>,
  colonne: 'acquisEntreprise' | 'acquisCentre',
  nouvelleValeur: NiveauMaitrise | null,
): boolean {
  if (nouvelleValeur === null) return false;
  return valeurEffective(ligne, synthese, colonne).source === 'synthese';
}
