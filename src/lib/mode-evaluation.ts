import type {
  Formation,
  Livret,
  ModeEvaluation,
  ModeleActivites,
  Referentiel,
  SignaturesTripartite,
} from '@/types';
import { activitesSansCompetenceEvaluable } from './balayage-referentiel';

/**
 * Cycle de vie du mode d'évaluation d'une formation (juillet 2026 — chantier
 * référentiels/compétences #4, arbitrages pilote Q2 et Q6 ; **invariant révisé
 * le 10 juillet 2026 après démo direction** : la bascule en mode activités
 * n'exige plus le balayage complet du référentiel, seulement que chaque
 * activité fasse appel à au moins une compétence évaluable).
 *
 * Le mode (`competences` | `activites`) est porté par la formation, mais les
 * données (fiches, entretien, sélections) vivent dans les livrets. Deux
 * familles de gardes protègent leur cohérence :
 *
 *   1. **Bascule du mode** — libre dans les deux sens tant qu'AUCUNE saisie
 *      n'est signée dans la promo ; **verrouillée dès la première signature**
 *      (entretien ou fiche, entreprise ou centre) — pattern verrou maison.
 *   2. **Référentiel vivant** — tant qu'une formation rattachée est en mode
 *      activités : réimport du référentiel bloqué et changement de référentiel
 *      de la formation bloqué (les mappings deviendraient orphelins — des
 *      activités tomberaient à 0 compétence) ; **exclusion** d'une compétence
 *      bloquée si une activité n'est mappée QUE sur elle (elle tomberait à 0).
 *      La **réactivation** d'une compétence exclue est libre depuis le
 *      10 juillet 2026 : elle ne fait qu'ajouter une compétence évaluable et ne
 *      peut briser l'invariant (l'ancienne garde « balayage incomplet » est
 *      tombée avec l'exigence de balayage complet).
 *
 * Pures fonctions — pas d'effet de bord.
 */

export interface ResultatValidation {
  ok: boolean;
  /** Message lisible expliquant le refus. Défini uniquement si !ok. */
  raison?: string;
}

/** Mode d'évaluation effectif d'une formation (absent = compétences, historique). */
export function modeEffectif(formation: Formation | undefined): ModeEvaluation {
  return formation?.modeEvaluation ?? 'competences';
}

// ─────────────────────────────────────────────────────────────────────────────
// Verrou de bascule — première saisie signée dans la promo (Q2)
// ─────────────────────────────────────────────────────────────────────────────

function auMoinsUneSignature(signatures: SignaturesTripartite): boolean {
  return (
    signatures.apprenti.signe ||
    signatures.maitre.signe ||
    signatures.formateur.signe ||
    signatures.representantLegal?.signe === true
  );
}

/**
 * Le livret porte-t-il au moins une saisie signée (entretien ou fiche de
 * période, entreprise ou centre) ? Une seule signature suffit — c'est un
 * engagement d'une partie sur un contenu saisi dans le mode courant.
 */
export function livretAUneSaisieSignee(livret: Livret): boolean {
  if (livret.entretien && auMoinsUneSignature(livret.entretien.signatures)) return true;
  if (livret.fichesSuivi.some((f) => auMoinsUneSignature(f.signatures))) return true;
  if (livret.fichesSuiviCentre.some((f) => auMoinsUneSignature(f.signatures))) return true;
  return false;
}

/** Au moins un livret de la promo porte une saisie signée. */
export function promoAUneSaisieSignee(livrets: ReadonlyArray<Livret>): boolean {
  return livrets.some(livretAUneSaisieSignee);
}

export interface ArgumentsBasculeMode {
  formation: Formation;
  cible: ModeEvaluation;
  /** Modèle d'activités rattaché à la formation (requis pour cible = activités). */
  modele?: ModeleActivites;
  /** Référentiel de la formation (requis pour cible = activités). */
  referentiel?: Referentiel;
  /** Livrets des apprenti·e·s de la promo (verrou de première saisie signée). */
  livretsPromo: ReadonlyArray<Livret>;
}

/**
 * La formation peut-elle basculer vers le mode cible ?
 *   - refus si la cible est déjà le mode courant ;
 *   - refus dès la première saisie signée dans la promo (les deux sens — Q2) ;
 *   - vers `activites` : modèle rattaché requis, mappé sur LE référentiel de
 *     la formation, et **chaque activité mappée sur au moins une compétence
 *     évaluable** (10 juillet 2026 — le balayage complet n'est plus exigé).
 */
export function peutBasculerMode(args: ArgumentsBasculeMode): ResultatValidation {
  const { formation, cible, modele, referentiel, livretsPromo } = args;

  if (modeEffectif(formation) === cible) {
    return { ok: false, raison: 'La formation est déjà dans ce mode d’évaluation.' };
  }

  if (promoAUneSaisieSignee(livretsPromo)) {
    return {
      ok: false,
      raison:
        'Bascule verrouillée : au moins une saisie signée existe dans la promo (entretien ou fiche de période). Le mode d’évaluation est figé dès la première signature.',
    };
  }

  if (cible === 'activites') {
    if (!modele || formation.modeleActivitesId !== modele.id) {
      return {
        ok: false,
        raison: 'Rattachez d’abord un modèle d’activités à la formation.',
      };
    }
    if (modele.referentielId !== formation.referentielId) {
      return {
        ok: false,
        raison:
          'Le modèle d’activités est mappé sur un autre référentiel que celui de la formation.',
      };
    }
    if (!referentiel) {
      return { ok: false, raison: 'Référentiel de la formation introuvable.' };
    }
    const sansCompetence = activitesSansCompetenceEvaluable(modele, referentiel);
    if (sansCompetence.length > 0) {
      const libelles = sansCompetence.map((a) => `« ${a.libelle} »`).join(', ');
      return {
        ok: false,
        raison: `${sansCompetence.length} activité${sansCompetence.length > 1 ? 's' : ''} sans compétence mappée (${libelles}) : chaque activité doit faire appel à au moins une compétence du référentiel pour passer en mode activités.`,
      };
    }
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gardes du référentiel vivant (Q6 — « bloquer l'action »)
// ─────────────────────────────────────────────────────────────────────────────

/** Formations rattachées au référentiel ET en mode activités. */
export function formationsEnModeActivites(
  referentielId: string,
  formations: ReadonlyArray<Formation>,
): Formation[] {
  return formations.filter(
    (f) => f.referentielId === referentielId && modeEffectif(f) === 'activites',
  );
}

/**
 * Le réimport (remplacement intégral) d'un référentiel est bloqué tant qu'une
 * formation rattachée est en mode activités : les ids de compétences changent,
 * le mapping deviendrait orphelin et des activités tomberaient à 0 compétence
 * évaluable (Q6, invariant révisé le 10 juillet 2026).
 */
export function peutReimporterReferentiel(
  referentielId: string,
  formations: ReadonlyArray<Formation>,
): ResultatValidation {
  const bloquantes = formationsEnModeActivites(referentielId, formations);
  if (bloquantes.length === 0) return { ok: true };
  const noms = bloquantes.map((f) => f.intitule).join(', ');
  return {
    ok: false,
    raison: `Réimport bloqué : ${noms} ${bloquantes.length > 1 ? 'sont' : 'est'} en mode activités sur ce référentiel. Repassez d’abord la formation en mode compétences (possible tant que rien n’est signé).`,
  };
}

/** Le changement de référentiel d'une formation est bloqué en mode activités (Q6). */
export function peutChangerReferentielFormation(formation: Formation): ResultatValidation {
  if (modeEffectif(formation) !== 'activites') return { ok: true };
  return {
    ok: false,
    raison:
      'Changement de référentiel bloqué : la formation est en mode activités (le mapping du modèle porte sur le référentiel actuel). Repassez d’abord en mode compétences.',
  };
}

/**
 * L'EXCLUSION d'une compétence est bloquée si une formation rattachée est en
 * mode activités ET qu'une activité de son modèle ne serait plus mappée sur
 * aucune compétence évaluable après l'exclusion (invariant du 10 juillet 2026 :
 * chaque activité fait appel à au moins une compétence). La RÉACTIVATION d'une
 * compétence exclue est libre du point de vue du mode : elle ne fait qu'ajouter
 * une compétence évaluable. (Les deux sens restent soumis au seuil de lignes
 * évaluables — `peutBasculerExclusion`, lib `limite-referentiel`.)
 */
export function peutExclureCompetence(
  competenceId: string,
  referentiel: Referentiel,
  formations: ReadonlyArray<Formation>,
  modeles: Record<string, ModeleActivites>,
): ResultatValidation {
  // Simule l'exclusion pour mesurer son effet sur les mappings.
  const simule: Referentiel = {
    ...referentiel,
    blocs: referentiel.blocs.map((b) => ({
      ...b,
      competences: b.competences.map((c) => (c.id === competenceId ? { ...c, exclue: true } : c)),
    })),
  };
  for (const f of formationsEnModeActivites(referentiel.id, formations)) {
    const modele = f.modeleActivitesId ? modeles[f.modeleActivitesId] : undefined;
    const enDefaut = activitesSansCompetenceEvaluable(modele, simule);
    if (enDefaut.length > 0) {
      const libelles = enDefaut.map((a) => `« ${a.libelle} »`).join(', ');
      return {
        ok: false,
        raison: `Exclusion bloquée : « ${f.intitule} » est en mode activités et ${enDefaut.length > 1 ? 'les activités' : "l'activité"} ${libelles} ne ${enDefaut.length > 1 ? 'seraient' : 'serait'} plus mappée${enDefaut.length > 1 ? 's' : ''} sur aucune compétence. Mappez-l${enDefaut.length > 1 ? 'es' : 'a'} d'abord sur une autre compétence.`,
      };
    }
  }
  return { ok: true };
}
