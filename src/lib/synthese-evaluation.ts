import type {
  FicheSuiviPeriode,
  LigneEvaluationFinaleCompetence,
  NiveauMaitrise,
  Referentiel,
} from '@/types';

/** Une entrée de synthèse par compétence : la dernière éval connue côté
 *  entreprise, accompagnée du numéro de période d'origine pour permettre à
 *  l'UI d'afficher « Vu en Période N ». (Juillet 2026 : la source centre a
 *  disparu avec le tableau de compétences des fiches centre.) */
export interface SyntheseCompetenceEntree {
  acquisEntreprise: NiveauMaitrise | null;
  /** Numéro de la dernière période où la cellule entreprise a été évaluée. */
  periodeEntreprise?: number;
}

/**
 * Synthèse de la grille « Synthèse » (anciennement « Évaluation finale ») à
 * partir des fiches de suivi par période.
 * Référence : cahier des charges v1.3, section 5.4 + simplification des
 * fiches centre (juillet 2026 — source unique : les fiches ENTREPRISE).
 *
 * `acquisEntreprise` <-- dernière `evaluationEntreprise` non-nulle des
 * fiches entreprise (`Livret.fichesSuivi`, évaluées par le tuteur).
 *
 * On parcourt les fiches dans l'ordre chronologique et on retient la DERNIÈRE
 * évaluation non-nulle (last-write-wins). La valeur 'non-fait' est ignorée
 * (compétence non abordée — pas un acquis).
 *
 * Cette fonction NE mute PAS le livret : elle retourne une suggestion affichée
 * à côté des saisies manuelles (héritage transparent).
 */
export function synthetiserCompetences(
  fichesEntreprise: FicheSuiviPeriode[],
  referentiel: Referentiel,
): Map<string, SyntheseCompetenceEntree> {
  const synthese = new Map<string, SyntheseCompetenceEntree>();

  // Initialiser à null pour toutes les compétences du référentiel
  for (const bloc of referentiel.blocs) {
    for (const c of bloc.competences) {
      synthese.set(c.id, { acquisEntreprise: null });
    }
  }

  // Dernière `evaluationEntreprise` non-nulle (last-write-wins).
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

  return synthese;
}

/**
 * Récupère la valeur effective d'une cellule de la grille de synthèse :
 * - la saisie manuelle si elle existe (non-null)
 * - sinon la valeur héritée des fiches via la synthèse
 *
 * `numeroPeriode` n'est renseigné que pour `source = 'synthese'` (utile pour
 * afficher « Vu en Période N » dans l'UI).
 */
export function valeurEffective(
  ligne: LigneEvaluationFinaleCompetence,
  synthese: Map<string, SyntheseCompetenceEntree>,
): {
  valeur: NiveauMaitrise | null;
  source: 'manuelle' | 'synthese' | 'aucune';
  numeroPeriode?: number;
} {
  if (ligne.acquisEntreprise !== null) {
    return { valeur: ligne.acquisEntreprise, source: 'manuelle' };
  }
  const heritage = synthese.get(ligne.competenceId);
  if (heritage && heritage.acquisEntreprise !== null) {
    return {
      valeur: heritage.acquisEntreprise,
      source: 'synthese',
      numeroPeriode: heritage.periodeEntreprise,
    };
  }
  return { valeur: null, source: 'aucune' };
}

/**
 * Garde-fou de la grille de synthèse (retours coordos juin 2026) : une valeur
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
  nouvelleValeur: NiveauMaitrise | null,
): boolean {
  if (nouvelleValeur === null) return false;
  return valeurEffective(ligne, synthese).source === 'synthese';
}
