import type { NiveauAppreciation, ReponsesEntretien } from '@/types';

/**
 * Trame officielle de l'entretien tripartite (« première visite »).
 * Référence : document GRETA « MAJ ENTRETIEN PREMIERE VISITE TRIPARTITE »
 * (réunion juin 2026).
 *
 * Cette trame est **figée** : document normé, défini ici en dur. Les
 * questions conjointes (maître + apprenti·e) sont organisées en rubriques
 * thématiques ; chaque question oui/non porte sa **polarité d'alerte**
 * (`alerteSi`) : dans les 4 premières rubriques un « Non » signale une
 * difficulté nécessitant une action du GRETA CFA (DDF / coordonnateur) ;
 * dans la rubrique « Difficultés éventuelles » c'est un « Oui » qui signale
 * la difficulté (7 juillet 2026, demande pilote : « Oui » = je rencontre un
 * problème — plus naturel que l'ancien « Oui » = situation satisfaisante).
 *
 * Juillet 2026 : l'entretien tripartite est désormais **unique et
 * obligatoire** (les entretiens 2 à 4 et leur banque de questions ont été
 * supprimés — le suivi ultérieur passe par les fiches de suivi). Les ids de
 * questions gardent leur préfixe historique `e1-` (stabilité des réponses).
 */

export type TypeQuestionTrame = 'texte' | 'oui-non';

export interface QuestionTrame {
  /** Id stable — clé des réponses (`EntretienTripartite.reponsesTrame`). */
  id: string;
  libelle: string;
  type: TypeQuestionTrame;
  /** Aide affichée sous la question (ex. action attendue en cas d'alerte). */
  aide?: string;
  /**
   * Polarité d'alerte des questions oui/non : la réponse indiquée déclenche
   * un point d'alerte (action DDF / coordonnateur) et s'affiche en rouge.
   * `'non'` = question formulée positivement (« … est connu ») ; `'oui'` =
   * question formulée en difficulté (« Logement » : Oui = problème).
   */
  alerteSi?: 'oui' | 'non';
}

export interface RubriqueTrame {
  id: string;
  titre: string;
  /** Texte d'introduction de la rubrique (consigne de remplissage). */
  intro?: string;
  questions: ReadonlyArray<QuestionTrame>;
}

export const TRAME_ENTRETIEN: ReadonlyArray<RubriqueTrame> = [
  {
    id: 'integration',
    titre: "Intégration de l'apprenti·e dans l'entreprise",
    questions: [
      {
        id: 'e1-integ-accueil',
        type: 'texte',
        libelle: "Comment l'accueil de l'apprenti·e dans l'entreprise s'est-il déroulé ?",
      },
      {
        id: 'e1-integ-presentation',
        type: 'texte',
        libelle:
          "De quelle façon l'entreprise, les équipes, le poste et les missions ont-ils été présentés à l'apprenti·e ?",
      },
      {
        id: 'e1-integ-regles',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: "Les règles de fonctionnement de l'entreprise sont connues de l'apprenti·e",
      },
      {
        id: 'e1-integ-poste',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: "L'apprenti·e connaît le poste / les activités demandées",
      },
      {
        id: 'e1-integ-contact',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: "L'apprenti·e sait à qui s'adresser en cas de difficulté / de besoin",
      },
    ],
  },
  {
    id: 'accompagnement',
    titre: "Accompagnement par le maître d'apprentissage",
    questions: [
      {
        id: 'e1-accomp-echanges',
        type: 'texte',
        libelle:
          "Comment le maître d'apprentissage organise-t-il les échanges avec son apprenti·e ? (diffusion des consignes, suivi, complétude du livret…)",
      },
      {
        id: 'e1-accomp-sensibilisation',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "Le maître d'apprentissage a participé à une réunion de sensibilisation organisée par le GRETA CFA et/ou a été destinataire des supports de sensibilisation",
        aide: "Si non, le formateur rappelle le rôle du maître d'apprentissage.",
      },
      {
        id: 'e1-accomp-presentation-formation',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "Le maître d'apprentissage a été destinataire d'une présentation de la formation et de ses objectifs",
        aide: 'Si non, le formateur présente la formation.',
      },
      {
        id: 'e1-accomp-livret',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: "Le livret d'apprentissage est complété",
        aide: "Si non, le formateur rappelle l'importance de le compléter régulièrement.",
      },
    ],
  },
  {
    id: 'adequation',
    titre: 'Adéquation des activités avec la formation préparée',
    questions: [
      {
        id: 'e1-adeq-activites',
        type: 'texte',
        libelle: "Quelles sont les activités confiées à l'apprenti·e ?",
        aide: "Reporter éventuellement les éléments figurant dans l'annexe de la promesse d'embauche.",
      },
      {
        id: 'e1-adeq-difficultes',
        type: 'texte',
        libelle:
          "L'apprenti·e rencontre-t-il·elle des difficultés dans l'exécution de ses activités qui nécessitent une remédiation en formation ? Des difficultés en formation qui pourraient être traitées en entreprise ?",
      },
      {
        id: 'e1-adeq-lien-diplome',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: 'Les activités sont en lien avec le diplôme préparé',
      },
      {
        id: 'e1-adeq-competences',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "L'apprenti·e peut mettre en œuvre ou développer les compétences visées par la formation",
      },
      {
        id: 'e1-adeq-decisions',
        type: 'texte',
        libelle: 'Si non, quelles sont les décisions prises pour la période suivante ?',
      },
    ],
  },
  {
    id: 'organisation-alternance',
    titre: "Organisation de l'alternance CFA / entreprise",
    questions: [
      {
        id: 'e1-org-calendrier',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "L'apprenti·e sait où trouver les informations sur son calendrier d'alternance (Pronote, livret d'apprentissage…)",
      },
      {
        id: 'e1-org-absences',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "Les absences et retards sont signalés par l'apprenti·e selon les procédures prévues (entreprise, GRETA CFA, justificatif d'absence…)",
      },
      {
        id: 'e1-org-coordonnees',
        type: 'oui-non',
        alerteSi: 'non',
        libelle: "Les coordonnées des interlocuteurs au CFA sont connues de l'entreprise",
      },
      {
        id: 'e1-org-infos',
        type: 'oui-non',
        alerteSi: 'non',
        libelle:
          "Les informations transmises par le CFA sont bien reçues par l'entreprise (attestations mensuelles, bulletins, mails…)",
      },
    ],
  },
  {
    id: 'difficultes',
    titre: "Difficultés éventuelles rencontrées par l'apprenti·e",
    intro:
      'Pour chaque point, cochez « Oui » si l’apprenti·e rencontre une difficulté, « Non » sinon. Un « Oui » est transmis au DDF ou au coordonnateur pour étudier la mise en place d’une action.',
    questions: [
      { id: 'e1-diff-logement', type: 'oui-non', alerteSi: 'oui', libelle: 'Logement' },
      { id: 'e1-diff-transport', type: 'oui-non', alerteSi: 'oui', libelle: 'Transport' },
      {
        id: 'e1-diff-financieres',
        type: 'oui-non',
        alerteSi: 'oui',
        libelle: 'Difficultés financières',
      },
      {
        id: 'e1-diff-informatique',
        type: 'oui-non',
        alerteSi: 'oui',
        libelle: "Accès à l'outil informatique",
      },
      {
        id: 'e1-diff-equipement',
        type: 'oui-non',
        alerteSi: 'oui',
        libelle: 'Équipement professionnel',
      },
      { id: 'e1-diff-autres', type: 'oui-non', alerteSi: 'oui', libelle: 'Autres' },
      {
        id: 'e1-diff-autres-precisions',
        type: 'texte',
        libelle: 'Autres difficultés (précisions)',
      },
    ],
  },
];

/**
 * Critères de la grille d'appréciation de fin d'entretien, enrichis des
 * descriptions par niveau (document GRETA). Les clés correspondent à
 * `AppreciationMaitre` ; l'échelle suit `NiveauAppreciation`.
 */
export interface CritereAppreciation {
  cle: 'ponctualite' | 'comprehensionConsignes' | 'qualiteTravail' | 'integration';
  libelle: string;
  descriptions: Record<NiveauAppreciation, string>;
}

export const CRITERES_APPRECIATION: ReadonlyArray<CritereAppreciation> = [
  {
    cle: 'ponctualite',
    libelle: 'Ponctualité / Assiduité',
    descriptions: {
      plusplus: "Arrive à l'heure, est assidu·e",
      plus: 'Présence régulière, ou absences justifiées',
      moins: 'Retards ou absences injustifiés',
      moinsmoins: 'Retards ou absences à répétition',
    },
  },
  {
    cle: 'comprehensionConsignes',
    libelle: 'Compréhension des consignes',
    descriptions: {
      plusplus: 'Les consignes sont comprises et appliquées',
      plus: 'Besoin de quelques explications complémentaires',
      moins: 'Ne va pas au bout de la consigne',
      moinsmoins: 'Difficultés de compréhension',
    },
  },
  {
    cle: 'qualiteTravail',
    libelle: 'Qualité du travail',
    descriptions: {
      plusplus: 'Conçoit et réalise en autonomie',
      plus: 'Bon travail mais contrôle nécessaire',
      moins: 'Réalise avec quelques erreurs',
      moinsmoins: 'Réalise avec de nombreuses erreurs',
    },
  },
  {
    cle: 'integration',
    libelle: "Intégration dans l'équipe",
    descriptions: {
      plusplus: 'Bonne intégration',
      plus: 'Intégration partielle, de son fait',
      moins: 'Intégration partielle, du fait des autres',
      moinsmoins: "Peu d'interactions",
    },
  },
];

/** Toutes les questions de la trame, à plat (ordre des rubriques). */
export function questionsTrame(): QuestionTrame[] {
  return TRAME_ENTRETIEN.flatMap((r) => [...r.questions]);
}

/** Une valeur de réponse est-elle renseignée pour un type de question donné ? */
export function reponseTrameRenseignee(
  type: TypeQuestionTrame,
  valeur: ReponsesEntretien[string] | undefined,
): boolean {
  if (valeur === undefined || valeur === null) return false;
  if (type === 'oui-non') return typeof valeur === 'boolean';
  return typeof valeur === 'string' && valeur.trim().length > 0;
}

/**
 * La réponse donnée à une question oui/non est-elle un point d'alerte ?
 * Suit la polarité de la question (`alerteSi`) : « Non » sur une question
 * formulée positivement, « Oui » sur une question formulée en difficulté
 * (rubrique « Difficultés éventuelles » — 7 juillet 2026). Consommée par
 * l'UI (surlignage + couleur des boutons) et le PDF.
 */
export function estReponseAlerte(
  question: QuestionTrame,
  valeur: ReponsesEntretien[string] | undefined,
): boolean {
  if (question.type !== 'oui-non' || typeof valeur !== 'boolean') return false;
  if (question.alerteSi === 'oui') return valeur === true;
  if (question.alerteSi === 'non') return valeur === false;
  return false;
}

/**
 * Points d'alerte de l'entretien : questions oui/non dont la réponse suit la
 * polarité d'alerte (`alerteSi`). Sert au récapitulatif de fin d'entretien et
 * au PDF (actions à mener par le DDF / coordonnateur).
 */
export function pointsAlerteTrame(reponses: ReponsesEntretien | undefined): QuestionTrame[] {
  if (!reponses) return [];
  return questionsTrame().filter((q) => estReponseAlerte(q, reponses[q.id]));
}

/**
 * Questions oui/non de la trame encore **sans réponse** (ni Oui ni Non). Utile
 * pour la progression et une éventuelle exigence de complétude avant signature.
 */
export function questionsOuiNonSansReponse(
  reponses: ReponsesEntretien | undefined,
): QuestionTrame[] {
  const r = reponses ?? {};
  return questionsTrame().filter(
    (q) => q.type === 'oui-non' && !reponseTrameRenseignee('oui-non', r[q.id]),
  );
}
