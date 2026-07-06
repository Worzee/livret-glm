import type {
  AppreciationMaitre,
  AttitudeProfessionnelle,
  EntretienTripartite,
  EvaluationsAttitudes,
  FicheSuiviPeriode,
  NiveauAppreciation,
} from '@/types';
import { CRITERES_APPRECIATION } from './trame-entretien';
import { attitudesRetenues } from './selection-attitudes';

/**
 * Attitudes professionnelles — catalogue global + helpers.
 * Référence : retours coordos juin 2026 + chantier référentiels/compétences
 * juillet 2026 (modification #3).
 *
 * Les attitudes sortent du référentiel de compétences pour devenir un
 * **catalogue central unique** géré par l'admin (`/admin/attitudes`).
 * Depuis juillet 2026, elles sont évaluées par le maître / tuteur **à chaque
 * période en entreprise** (échelle ++/+/-/--, sur la fiche de suivi) — le
 * choix des attitudes retenues reste fait à l'entretien tripartite. L'onglet
 * « Attitudes » de la Synthèse est une agrégation last-write-wins en lecture
 * seule de ces évaluations.
 *
 * Pures fonctions — pas d'effet de bord.
 */

/**
 * Catalogue par défaut — savoir-être transversaux de l'apprentissage,
 * formulations génériques valables pour toute spécialité (enrichi à la
 * demande du pilote, juin 2026).
 *
 * 18 juin 2026 : a1..a4 (ponctualité, respect des consignes, qualité du
 * travail, intégration) retirées — elles doublonnaient les 4 critères de
 * l'appréciation du maître / tuteur (« Synthèse de la période »), évalués par
 * défaut lors de l'entretien tripartite. Les ids restants (a5..a16) sont
 * conservés stables (référencés par les fixtures de démo). L'admin élague ou
 * complète librement depuis `/admin/attitudes`.
 */
export const ATTITUDES_INITIALES: ReadonlyArray<AttitudeProfessionnelle> = [
  {
    id: 'a5',
    libelle: "Prise d'initiative et autonomie",
    description: 'Sait agir seul·e à bon escient, sans attendre systématiquement une consigne.',
  },
  {
    id: 'a6',
    libelle: 'Communication professionnelle',
    description: "S'exprime correctement et adapte son langage à ses interlocuteurs.",
  },
  {
    id: 'a7',
    libelle: "Respect des règles d'hygiène et de sécurité",
    description: 'Applique les protocoles et porte les équipements de protection requis.',
  },
  {
    id: 'a8',
    libelle: 'Présentation et tenue professionnelle',
    description: 'Adopte une tenue et une présentation adaptées au poste et au contact client.',
  },
  {
    id: 'a9',
    libelle: 'Motivation et implication',
    description: "S'investit dans les tâches confiées et montre de l'intérêt pour le métier.",
  },
  {
    id: 'a10',
    libelle: 'Organisation et gestion du temps',
    description: 'Prépare son poste de travail, priorise et respecte les délais.',
  },
  {
    id: 'a11',
    libelle: "Capacité d'adaptation",
    description: 'Fait face aux imprévus et accepte les changements de poste ou de planning.',
  },
  {
    id: 'a12',
    libelle: 'Prise en compte des remarques',
    description: 'Écoute les retours, accepte la critique constructive et progresse.',
  },
  {
    id: 'a13',
    libelle: "Curiosité et volonté d'apprendre",
    description: "Pose des questions et s'intéresse au métier au-delà des tâches confiées.",
  },
  {
    id: 'a14',
    libelle: 'Soin du matériel et des locaux',
    description: "Utilise, entretient et range correctement l'équipement mis à disposition.",
  },
  {
    id: 'a15',
    libelle: 'Maîtrise de soi et gestion du stress',
    description: 'Garde son calme et un comportement adapté en situation de pression.',
  },
  {
    id: 'a16',
    libelle: 'Discrétion et confidentialité',
    description: "Respecte la confidentialité des informations de l'entreprise et des clients.",
  },
];

/**
 * Indique si une attitude est évaluée dans au moins une fiche de période
 * entreprise (juillet 2026 — les évaluations d'attitudes sont portées par
 * les fiches ; on passe l'ensemble des fiches entreprise de tous les
 * livrets). Utilisé pour bloquer la suppression depuis le catalogue
 * (cohérence référentielle).
 */
export function attitudeEstUtilisee(
  attitudeId: string,
  fiches: ReadonlyArray<FicheSuiviPeriode>,
): boolean {
  for (const f of fiches) {
    const valeur = f.evaluationsAttitudes?.[attitudeId];
    if (valeur !== undefined && valeur !== null) return true;
  }
  return false;
}

/**
 * Ids des attitudes retenues qui n'ont PAS encore été évaluées sur une fiche
 * de période entreprise (entrée absente ou `null`), dans l'ordre de la
 * sélection. R20 (juillet 2026) : la liste doit être vide pour que le
 * maître / tuteur signe la fiche.
 */
export function attitudesNonEvaluees(
  selection: ReadonlyArray<string>,
  evaluations: EvaluationsAttitudes | undefined,
): string[] {
  return selection.filter((id) => evaluations?.[id] === undefined || evaluations[id] === null);
}

/** Dernière évaluation connue d'une attitude + sa période d'origine. */
export interface SyntheseAttitudeEntree {
  niveau: NiveauAppreciation;
  numeroPeriode: number;
}

/**
 * Agrège les évaluations d'attitudes des fiches de période entreprise en
 * last-write-wins (même mécanique que `synthetiserCompetences`) : pour chaque
 * attitude, la DERNIÈRE évaluation non-nulle dans l'ordre chronologique des
 * périodes, avec le numéro de période d'origine (« Vu en Période N »).
 * Les attitudes jamais évaluées sont absentes de la map.
 */
export function synthetiserAttitudes(
  fiches: ReadonlyArray<FicheSuiviPeriode>,
): Map<string, SyntheseAttitudeEntree> {
  const synthese = new Map<string, SyntheseAttitudeEntree>();
  for (const fiche of [...fiches].sort((a, b) => a.numeroPeriode - b.numeroPeriode)) {
    for (const [attitudeId, niveau] of Object.entries(fiche.evaluationsAttitudes ?? {})) {
      if (niveau === null || niveau === undefined) continue;
      synthese.set(attitudeId, { niveau, numeroPeriode: fiche.numeroPeriode });
    }
  }
  return synthese;
}

/**
 * Indique si une attitude est retenue dans la sélection d'au moins un livret
 * (13 juin 2026 — le choix se fait à l'E1). Avec `attitudeEstUtilisee`,
 * bloque la suppression depuis le catalogue admin : on ne retire pas du
 * catalogue une attitude qu'un livret référence.
 */
export function attitudeEstSelectionnee(
  attitudeId: string,
  selections: ReadonlyArray<ReadonlyArray<string>>,
): boolean {
  return selections.some((ids) => ids.includes(attitudeId));
}

/**
 * Attitudes professionnelles **obligatoires** (3 juillet 2026).
 *
 * Les 4 critères de l'appréciation générale du maître / tuteur (grille
 * standardisée de la trame officielle de l'entretien) sont des attitudes
 * évaluées d'office : ce sont les anciennes a1..a4 retirées du catalogue le
 * 18 juin 2026. Les synthèses (onglet « Attitudes » de l'évaluation finale +
 * PDF) doivent les récapituler AU-DESSUS des attitudes optionnelles retenues
 * à l'entretien. Les libellés suivent la trame officielle
 * (`CRITERES_APPRECIATION`).
 */
export interface AttitudeObligatoire {
  /** Clé du critère dans `AppreciationMaitre`. */
  cle: keyof Omit<AppreciationMaitre, 'commentaires'>;
  libelle: string;
  description: string;
}

const DESCRIPTIONS_ATTITUDES_OBLIGATOIRES: Record<AttitudeObligatoire['cle'], string> = {
  ponctualite: "Arrive à l'heure et fait preuve d'assiduité.",
  comprehensionConsignes: 'Comprend les consignes données et les applique.',
  qualiteTravail: "Réalise un travail de qualité, avec le niveau d'autonomie attendu.",
  integration: "S'intègre dans l'équipe de l'entreprise.",
};

export const ATTITUDES_OBLIGATOIRES: ReadonlyArray<AttitudeObligatoire> = CRITERES_APPRECIATION.map(
  (c) => ({
    cle: c.cle,
    libelle: c.libelle,
    description: DESCRIPTIONS_ATTITUDES_OBLIGATOIRES[c.cle],
  }),
);

/**
 * Ligne du tableau de synthèse des attitudes (UI de la Synthèse et PDF) :
 * une attitude × son dernier niveau connu.
 */
export interface LigneSyntheseAttitudes {
  /** `oblig-<cle>` pour un critère d'appréciation, id du catalogue sinon. */
  id: string;
  libelle: string;
  description?: string;
  obligatoire: boolean;
  /**
   * Dernier niveau connu — appréciation de l'entretien pour les
   * obligatoires, last-write-wins des fiches entreprise pour les
   * optionnelles. `null` si jamais évalué.
   */
  niveau: NiveauAppreciation | null;
  /**
   * Période d'origine de l'évaluation (« Vu en Période N ») — optionnelles
   * évaluées sur une fiche uniquement ; absent pour les obligatoires
   * (évaluées à l'entretien) et les attitudes jamais évaluées.
   */
  numeroPeriode?: number;
}

/**
 * Construit les lignes de la synthèse des attitudes : les 4 **obligatoires**
 * d'abord (lues dans l'appréciation générale du maître à l'entretien), puis
 * les optionnelles retenues pour le livret (agrégées last-write-wins depuis
 * les fiches de période entreprise — juillet 2026), dans l'ordre du
 * catalogue.
 */
export function lignesSyntheseAttitudes(
  catalogue: ReadonlyArray<AttitudeProfessionnelle>,
  selection: ReadonlyArray<string>,
  entretien: EntretienTripartite | null,
  fichesEntreprise: ReadonlyArray<FicheSuiviPeriode>,
): LigneSyntheseAttitudes[] {
  const obligatoires = ATTITUDES_OBLIGATOIRES.map(
    (o): LigneSyntheseAttitudes => ({
      id: `oblig-${o.cle}`,
      libelle: o.libelle,
      description: o.description,
      obligatoire: true,
      niveau: entretien ? (entretien.appreciationMaitre[o.cle] ?? null) : null,
    }),
  );

  const synthese = synthetiserAttitudes(fichesEntreprise);
  const optionnelles = attitudesRetenues(catalogue, selection).map((a): LigneSyntheseAttitudes => {
    const entree = synthese.get(a.id);
    return {
      id: a.id,
      libelle: a.libelle,
      description: a.description,
      obligatoire: false,
      niveau: entree?.niveau ?? null,
      numeroPeriode: entree?.numeroPeriode,
    };
  });

  return [...obligatoires, ...optionnelles];
}
