import type { BlocCompetences, Competence, Referentiel } from '@/types';

/**
 * Limite du nombre de lignes évaluables par référentiel (juillet 2026 —
 * chantier référentiels/compétences #2, décision pilote).
 *
 * Au-delà du seuil (40 par défaut), la saisie des compétences devient trop
 * longue pour le tuteur lors des périodes en entreprise. À l'import, le
 * coordo / l'admin dispose de deux issues :
 *   1. **Agréger au niveau hiérarchique supérieur** (référentiels 3 niveaux
 *      uniquement) : chaque sous-famille devient la ligne évaluable, les
 *      libellés fins sont conservés dans sa description ;
 *   2. **Cocher / décocher** des compétences jusqu'à passer sous le seuil —
 *      les décochées sont conservées dans le référentiel avec `exclue: true`
 *      (trace du fichier officiel), réactivables plus tard tant que le total
 *      évaluable reste sous le seuil.
 *
 * Le seuil est un paramètre global (`useParametresStore`), modifiable
 * uniquement par l'admin (ressource `admin.parametres.gerer`).
 *
 * Pures fonctions — pas d'effet de bord.
 */

export const SEUIL_COMPETENCES_EVALUABLES_DEFAUT = 40;
export const SEUIL_COMPETENCES_MIN = 1;
export const SEUIL_COMPETENCES_MAX = 999;

/** Feuilles évaluables d'un bloc (les exclues ne comptent pas). */
export function competencesEvaluables(bloc: BlocCompetences): Competence[] {
  return bloc.competences.filter((c) => !c.exclue);
}

/** Nombre total de feuilles évaluables du référentiel. */
export function compterCompetencesEvaluables(referentiel: Referentiel): number {
  return referentiel.blocs.reduce((n, b) => n + competencesEvaluables(b).length, 0);
}

/** Nombre de feuilles exclues (conservées mais non évaluables). */
export function compterCompetencesExclues(referentiel: Referentiel): number {
  return referentiel.blocs.reduce((n, b) => n + b.competences.filter((c) => c.exclue).length, 0);
}

/** Le référentiel dépasse-t-il le seuil de lignes évaluables ? */
export function depasseSeuil(referentiel: Referentiel, seuil: number): boolean {
  return compterCompetencesEvaluables(referentiel) > seuil;
}

/**
 * Référentiel **filtré pour l'évaluation** : les feuilles exclues sont
 * retirées et les blocs vidés abandonnés. À appliquer aux frontières de
 * consommation (grilles, fiches, sélection entreprise, PDF, cascades de
 * réalignement) — le référentiel complet reste la source de vérité du store.
 * Renvoie la même référence quand aucune exclusion (pas de re-render inutile).
 */
export function referentielEvaluable(referentiel: Referentiel): Referentiel {
  if (compterCompetencesExclues(referentiel) === 0) return referentiel;
  return {
    ...referentiel,
    blocs: referentiel.blocs
      .map((b) => ({ ...b, competences: competencesEvaluables(b) }))
      .filter((b) => b.competences.length > 0),
  };
}

/**
 * L'agrégation au niveau supérieur n'a de sens que s'il existe un niveau
 * intermédiaire : au moins une feuille évaluable portant une sous-famille.
 * Pour un référentiel 2 niveaux, évaluer « au bloc » serait trop grossier
 * (arbitrage pilote) — seul le cochage manuel est proposé.
 */
export function peutAgregerAuNiveauSuperieur(referentiel: Referentiel): boolean {
  return referentiel.blocs.some((b) => competencesEvaluables(b).some((c) => c.sousFamille));
}

/**
 * Agrège le référentiel au niveau hiérarchique supérieur : dans chaque bloc,
 * chaque sous-famille devient UNE compétence évaluable (libellé = nom de la
 * sous-famille, description = libellés fins regroupés) ; les feuilles
 * directes (sans sous-famille) restent inchangées, à leur place. Une
 * sous-famille scindée en plusieurs runs est fusionnée en une seule ligne
 * (position du premier run). Le résultat est un référentiel 2 niveaux.
 */
export function agregerAuNiveauSuperieur(referentiel: Referentiel): Referentiel {
  const blocs = referentiel.blocs.map((bloc) => {
    const sortie: Competence[] = [];
    // Sous-famille → ligne agrégée déjà émise (fusion des runs multiples).
    const parSousFamille = new Map<string, Competence>();
    let compteurSf = 0;
    for (const c of competencesEvaluables(bloc)) {
      if (!c.sousFamille) {
        sortie.push(c);
        continue;
      }
      const existante = parSousFamille.get(c.sousFamille);
      if (existante) {
        existante.description = `${existante.description} ; ${c.libelle}`;
        continue;
      }
      compteurSf += 1;
      const agregee: Competence = {
        id: `${bloc.id}-sf${compteurSf}`,
        code: `${bloc.code}.SF${compteurSf}`,
        libelle: c.sousFamille,
        description: `Regroupe : ${c.libelle}`,
        // Pas de `sousFamille` : la ligne agrégée EST le niveau supérieur.
      };
      parSousFamille.set(c.sousFamille, agregee);
      sortie.push(agregee);
    }
    return { ...bloc, competences: sortie };
  });
  return { ...referentiel, blocs, niveauxColonnes: 2 };
}

/**
 * Applique un ensemble d'exclusions : les feuilles listées reçoivent
 * `exclue: true`, les autres redeviennent évaluables (le drapeau est retiré).
 * Les feuilles restent dans le référentiel — trace du fichier officiel.
 */
export function appliquerExclusions(
  referentiel: Referentiel,
  idsExclus: ReadonlyArray<string> | ReadonlySet<string>,
): Referentiel {
  const exclus = idsExclus instanceof Set ? idsExclus : new Set(idsExclus);
  return {
    ...referentiel,
    blocs: referentiel.blocs.map((b) => ({
      ...b,
      competences: b.competences.map((c) => {
        if (exclus.has(c.id)) return { ...c, exclue: true };
        if (c.exclue) {
          const { exclue: _retire, ...sansDrapeau } = c;
          void _retire;
          return sansDrapeau;
        }
        return c;
      }),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seuil paramétrable (admin uniquement)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResultatValidation {
  ok: boolean;
  /** Message lisible expliquant le refus. Défini uniquement si !ok. */
  raison?: string;
}

/** Valide une valeur de seuil saisie par l'admin. */
export function validerSeuil(valeur: number): ResultatValidation {
  if (
    !Number.isInteger(valeur) ||
    valeur < SEUIL_COMPETENCES_MIN ||
    valeur > SEUIL_COMPETENCES_MAX
  ) {
    return {
      ok: false,
      raison: `Le seuil doit être un entier entre ${SEUIL_COMPETENCES_MIN} et ${SEUIL_COMPETENCES_MAX}.`,
    };
  }
  return { ok: true };
}

/**
 * Peut-on basculer l'état d'exclusion d'une compétence (page Référentiels,
 * post-import) ?
 *  - exclusion refusée s'il ne resterait plus aucune feuille évaluable ;
 *  - réactivation refusée si elle ferait dépasser le seuil.
 */
export function peutBasculerExclusion(
  referentiel: Referentiel,
  competenceId: string,
  seuil: number,
): ResultatValidation {
  const feuille = referentiel.blocs
    .flatMap((b) => b.competences)
    .find((c) => c.id === competenceId);
  if (!feuille) {
    return { ok: false, raison: 'Compétence introuvable dans ce référentiel.' };
  }
  const evaluables = compterCompetencesEvaluables(referentiel);
  if (feuille.exclue) {
    // Réactivation.
    if (evaluables + 1 > seuil) {
      return {
        ok: false,
        raison: `Impossible de réactiver : la limite de ${seuil} lignes évaluables serait dépassée. Excluez d'abord une autre compétence.`,
      };
    }
    return { ok: true };
  }
  // Exclusion.
  if (evaluables - 1 < 1) {
    return {
      ok: false,
      raison: 'Un référentiel doit conserver au moins une compétence évaluable.',
    };
  }
  return { ok: true };
}
