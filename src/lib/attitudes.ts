import type {
  AppreciationMaitre,
  AttitudeProfessionnelle,
  EntretienTripartite,
  NiveauAppreciation,
  NumeroEntretien,
} from '@/types';
import { NUMEROS_ENTRETIEN } from '@/types';
import { CRITERES_APPRECIATION_E1 } from './trame-entretien-1';
import { attitudesRetenues } from './selection-attitudes';

/**
 * Attitudes professionnelles — catalogue global + helpers.
 * Référence : retours coordos juin 2026.
 *
 * Les attitudes sortent du référentiel de compétences pour devenir un
 * **catalogue central unique** géré par l'admin (`/admin/attitudes`,
 * pattern banque de questions). Elles sont évaluées par le maître / tuteur
 * **à chaque entretien tripartite** (échelle ++/+/-/--) ; l'onglet
 * « Attitudes » de l'évaluation finale en devient une synthèse en lecture
 * seule (E1..E4).
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
 * défaut à chaque entretien tripartite. Les ids restants (a5..a16) sont
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
 * Indique si une attitude est évaluée dans au moins un entretien existant.
 * Utilisé pour bloquer la suppression depuis le catalogue (cohérence
 * référentielle), comme pour les questions de la banque.
 */
export function attitudeEstUtilisee(
  attitudeId: string,
  entretiens: ReadonlyArray<EntretienTripartite | null>,
): boolean {
  for (const e of entretiens) {
    if (!e) continue;
    const valeur = e.evaluationsAttitudes[attitudeId];
    if (valeur !== undefined && valeur !== null) return true;
  }
  return false;
}

/**
 * Au moins une attitude évaluée dans l'entretien ? Extension R20 (juin
 * 2026) : exigée pour que le maître / tuteur puisse signer.
 */
export function auMoinsUneAttitudeEvaluee(entretien: EntretienTripartite): boolean {
  return Object.values(entretien.evaluationsAttitudes).some((v) => v !== null && v !== undefined);
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
 * standardisée, évaluée à chaque entretien — trame officielle E1) sont des
 * attitudes évaluées d'office : ce sont les anciennes a1..a4 retirées du
 * catalogue le 18 juin 2026. Les synthèses (onglet « Attitudes » de
 * l'évaluation finale + PDF) doivent les récapituler AU-DESSUS des attitudes
 * optionnelles retenues à l'E1. Les libellés suivent la trame officielle
 * (`CRITERES_APPRECIATION_E1`).
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

export const ATTITUDES_OBLIGATOIRES: ReadonlyArray<AttitudeObligatoire> =
  CRITERES_APPRECIATION_E1.map((c) => ({
    cle: c.cle,
    libelle: c.libelle,
    description: DESCRIPTIONS_ATTITUDES_OBLIGATOIRES[c.cle],
  }));

/**
 * Ligne du tableau de synthèse des attitudes (UI de l'évaluation finale et
 * PDF) : une attitude × son niveau à chaque entretien.
 */
export interface LigneSyntheseAttitudes {
  /** `oblig-<cle>` pour un critère d'appréciation, id du catalogue sinon. */
  id: string;
  libelle: string;
  description?: string;
  obligatoire: boolean;
  /** Niveau par entretien — `null` si non évalué ou entretien absent. */
  niveaux: Record<NumeroEntretien, NiveauAppreciation | null>;
}

/**
 * Construit les lignes de la synthèse des attitudes : les 4 **obligatoires**
 * d'abord (lues dans l'appréciation générale du maître de chaque entretien),
 * puis les optionnelles retenues pour le livret (lues dans
 * `evaluationsAttitudes`), dans l'ordre du catalogue.
 */
export function lignesSyntheseAttitudes(
  catalogue: ReadonlyArray<AttitudeProfessionnelle>,
  selection: ReadonlyArray<string>,
  entretiens: Readonly<Record<NumeroEntretien, EntretienTripartite | null>>,
): LigneSyntheseAttitudes[] {
  const niveauxDepuis = (
    lire: (e: EntretienTripartite) => NiveauAppreciation | null | undefined,
  ): Record<NumeroEntretien, NiveauAppreciation | null> => {
    const niveaux = {} as Record<NumeroEntretien, NiveauAppreciation | null>;
    for (const n of NUMEROS_ENTRETIEN) {
      const e = entretiens[n];
      niveaux[n] = e ? (lire(e) ?? null) : null;
    }
    return niveaux;
  };

  const obligatoires = ATTITUDES_OBLIGATOIRES.map(
    (o): LigneSyntheseAttitudes => ({
      id: `oblig-${o.cle}`,
      libelle: o.libelle,
      description: o.description,
      obligatoire: true,
      niveaux: niveauxDepuis((e) => e.appreciationMaitre[o.cle]),
    }),
  );

  const optionnelles = attitudesRetenues(catalogue, selection).map(
    (a): LigneSyntheseAttitudes => ({
      id: a.id,
      libelle: a.libelle,
      description: a.description,
      obligatoire: false,
      niveaux: niveauxDepuis((e) => e.evaluationsAttitudes[a.id]),
    }),
  );

  return [...obligatoires, ...optionnelles];
}
