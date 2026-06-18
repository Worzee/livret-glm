import type {
  Apprenti,
  EntretienTripartite,
  EntreeDeverrouillage,
  FicheSuiviPeriode,
  Livret,
  SelectionCompetencesEntreprise,
  SignaturesTripartite,
} from '@/types';
import {
  apprentiAyaKouame,
  apprentiLeaMartin,
  apprentiLucaBianchi,
  apprentiMinhNguyen,
  apprentiSofiaPereira,
  apprentiTheoDubois,
  apprentisDemo,
  formatriceSophieDubois,
} from './utilisateurs';
import { referentielCapCuisine } from './referentiel-cap-cuisine';
import { periodesCapCuisine, periodesCentreCapCuisine } from './formations';
import { QUESTIONS_BANQUE_INITIALE, idsQuestionsActives } from '@/lib/questions-entretien';
import { creerFichePeriodeVierge } from '@/lib/creation-livret';
import { questionsTrameE1 } from '@/lib/trame-entretien-1';

// Snapshot des entretiens de démo (13 juin 2026) : la formation CAP Cuisine
// ne retire aucune question → toutes les questions de la banque sont actives
// et toutes obligatoires (réponse exigée pour signer).
const QUESTIONS_E1_APPRENTI = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, [], 'apprenti');
const QUESTIONS_E1_MAITRE = idsQuestionsActives(QUESTIONS_BANQUE_INITIALE, [], 'maitre');
const QUESTIONS_E1_OBLIGATOIRES = [...QUESTIONS_E1_APPRENTI, ...QUESTIONS_E1_MAITRE];

/**
 * Livrets de démonstration — 6 apprenti·e·s, un livret par cas pédagogique.
 * Référence : cahier des charges v1.3, section 24.5.
 *
 * Cas démontrés :
 *   - Léa MARTIN     : cas principal (entretien complet, 2 fiches signées, 1 en cours)
 *   - Théo DUBOIS    : « bon élève » — toutes fiches signées et verrouillées
 *   - Sofia PEREIRA  : « alerte R7 » — entretien non initié → bandeau visible
 *   - Minh NGUYEN    : « démarrage » — entretien signé, 3 périodes héritées mais vierges
 *   - Aya KOUAMÉ     : « désaccord » — fiche déverrouillée avec motif (R10)
 *   - Luca BIANCHI   : « mi-parcours standard »
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — factorisation des structures vides
// ─────────────────────────────────────────────────────────────────────────────

const aucuneSignature: SignaturesTripartite = {
  apprenti: { signe: false },
  maitre: { signe: false },
  formateur: { signe: false },
};

const signaturesCompletes = (date: string): SignaturesTripartite => ({
  apprenti: { signe: true, dateSignature: date },
  maitre: { signe: true, dateSignature: date },
  formateur: { signe: true, dateSignature: date },
});

/** Initialise les lignes vides de l'évaluation finale depuis le référentiel. */
function lignesEvaluationFinaleVides() {
  return {
    competences: referentielCapCuisine.blocs
      .flatMap((b) => b.competences)
      .map((c) => ({
        competenceId: c.id,
        acquisEntreprise: null,
        acquisCentre: null,
      })),
  };
}

/**
 * Évaluations d'attitudes pour un entretien signé (retours coordos juin
 * 2026 : le maître évalue les attitudes à chaque entretien — R20 exige au
 * moins une évaluation pour signer). Les 6 attitudes du catalogue initial.
 */
function evaluationsAttitudesDemo(
  dominante: 'plus' | 'plusplus' = 'plus',
): Record<string, 'plusplus' | 'plus' | 'moins' | 'moinsmoins' | null> {
  return {
    a5: dominante,
    a6: 'plusplus',
  };
}

/**
 * Construit une sélection validée à une date donnée pour un livret démo dont
 * l'entretien tripartite est signé (les ids de compétences correspondent au
 * référentiel CAP Cuisine).
 */
function selectionValideeDemo(
  apprenti: Apprenti,
  ids: string[],
  dateIso: string,
): SelectionCompetencesEntreprise {
  return {
    ids,
    validePar: {
      formateurId: apprenti.formateurReferentId,
      maitreId: apprenti.maitreApprentissageId,
      dateIso,
    },
    modifieLe: dateIso,
    historiqueInvalidations: [],
  };
}

/**
 * Sélection initiale (13 juin 2026) pour les livrets sans entretien signé :
 * toutes les compétences du référentiel sont activées par défaut. Le maître /
 * tuteur décochera celles non abordées lors de l'E1.
 */
function selectionInitialeDemo(dateIso: string): SelectionCompetencesEntreprise {
  return {
    ids: referentielCapCuisine.blocs.flatMap((b) => b.competences).map((c) => c.id),
    modifieLe: dateIso,
    historiqueInvalidations: [],
  };
}

/** Construit un livret vierge (sans entretien, sans fiche) pour un·e apprenti·e. */
function livretVierge(apprenti: Apprenti, livretId: string): Livret {
  const lignesVides = lignesEvaluationFinaleVides();
  return {
    id: livretId,
    apprentiId: apprenti.id,
    formationId: apprenti.formationId,
    organisationSuivi: {
      evenements: [
        {
          id: 'evt-vierge-1',
          motif: 'reunion-rentree',
          date: '2025-09-04',
          commentaire: 'Salle Diderot',
        },
        {
          id: 'evt-vierge-2',
          motif: 'entretien-individuel',
          commentaire: 'À planifier',
        },
        {
          id: 'evt-vierge-3',
          motif: 'accueil-tuteur',
          date: '2025-09-15',
          commentaire: 'Journée tuteurs',
        },
        {
          id: 'evt-vierge-4',
          motif: 'restitution-activites',
          commentaire: 'Tous les 6 semaines en classe.',
        },
        {
          id: 'evt-vierge-5',
          motif: 'bilan-formation',
          commentaire: 'Bilan intermédiaire en janvier, bilan final en juin.',
        },
        {
          // Chantier #2 (mai 2026) : événement par défaut pour donner accès à
          // l'Entretien Tripartite 1 depuis la sidebar. Sofia, qui override
          // entièrement son `organisationSuivi`, n'hérite pas de cet
          // événement et conserve son cas « alerte R7 ».
          id: 'evt-vierge-6',
          motif: 'entretien-tripartite-1',
          date: '2025-10-28',
          modalite: 'presentiel',
          commentaire: 'Entretien tripartite n° 1 — dans les 2 mois suivant le contrat (R7).',
        },
      ],
      modifieLe: '2025-09-10T08:00:00.000Z',
      modifiePar: formatriceSophieDubois.id,
    },
    entretiens: { 1: null, 2: null, 3: null, 4: null },
    fichesSuivi: [],
    // Périodes en centre (17 juin 2026) — héritées du planning centre, vierges
    // par défaut ; les livrets démo peuvent les surcharger.
    fichesSuiviCentre: periodesCentreCapCuisine.map((p) =>
      creerFichePeriodeVierge(p, `fc-${livretId}-${p.id}`),
    ),
    evaluationFinaleCompetences: {
      lignes: lignesVides.competences,
      modifieLe: '2025-09-02T08:00:00.000Z',
    },
    // Démarre vierge par défaut ; les livrets démo dont l'entretien est signé
    // override ce champ avec `selectionValideeDemo(...)` plus bas.
    selectionCompetencesEntreprise: selectionInitialeDemo('2025-09-02T08:00:00.000Z'),
    // Choix des attitudes : se fera à l'E1 (13 juin 2026).
    attitudesSelectionnees: [],
    cloture: null,
    creeLe: '2025-09-02T08:00:00.000Z',
    modifieLe: '2025-09-02T08:00:00.000Z',
  };
}

/** Textes de démonstration pour les questions « texte » de la trame E1. */
const TEXTES_TRAME_E1_DEMO: Record<string, string> = {
  'e1-integ-accueil':
    "Accueil chaleureux : l'apprenti·e a été présenté·e à l'équipe dès son arrivée.",
  'e1-integ-presentation':
    'Visite des locaux, présentation du poste, des missions et des consignes de sécurité.',
  'e1-accomp-echanges':
    'Point hebdomadaire le lundi ; consignes orales complétées par une fiche de tâches.',
  'e1-adeq-activites': 'Mise en place, taillage des légumes, aide à la production du service.',
  'e1-adeq-difficultes':
    "Rapidité d'exécution encore à consolider — point de vigilance à travailler en centre.",
};

/**
 * Réponses de démonstration à la trame de l'entretien 1 : toutes les oui/non à
 * « Oui » sauf les ids passés dans `idsNon` (qui déclenchent un point d'alerte),
 * et des textes courts réalistes.
 */
function reponsesTrameDemo(idsNon: ReadonlyArray<string> = []): Record<string, string | boolean> {
  const non = new Set(idsNon);
  const out: Record<string, string | boolean> = {};
  for (const q of questionsTrameE1()) {
    if (q.type === 'oui-non') out[q.id] = !non.has(q.id);
    else out[q.id] = TEXTES_TRAME_E1_DEMO[q.id] ?? '';
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// Livret 1 : Léa MARTIN — cas principal (CDC §24.5)
// État au 09/05/2026 :
//   P1 (sept-déc 2025) : verrouillée
//   P2 (janv-fév 2026) : signée
//   P3 (mars-avril 2026) : EN COURS — apprenti·e + maître ont rempli, le
//                          formateur n'a pas encore validé
// ═════════════════════════════════════════════════════════════════════════════

const entretienLea: EntretienTripartite = {
  dateEntretien: '2025-10-28',
  // Trame officielle E1 (juin 2026) — 2 points d'alerte pour la démo :
  // absences non signalées selon les procédures + difficulté de logement.
  reponsesTrame: reponsesTrameDemo(['e1-org-absences', 'e1-diff-logement']),
  questionsApprentiSelectionnees: [...QUESTIONS_E1_APPRENTI],
  questionsMaitreSelectionnees: [...QUESTIONS_E1_MAITRE],
  questionsImposees: [...QUESTIONS_E1_APPRENTI, ...QUESTIONS_E1_MAITRE],
  questionsObligatoires: [...QUESTIONS_E1_OBLIGATOIRES],
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  reponsesApprenti: {
    'q-app-motivations':
      "Devenir cuisinière dans la restauration traditionnelle, idéalement à mon compte d'ici 10 ans.",
    'q-app-contact-entreprise':
      "J'ai connu Le Gourmet via une journée portes ouvertes du GRETA, puis un stage de 2 jours en juin 2025.",
    'q-app-connaissance-entreprise':
      'Je connaissais le restaurant comme cliente avec mes parents depuis quelques années.',
    'q-app-metier-representation':
      "Plus exigeant en rythme que je ne l'imaginais, mais le travail d'équipe me plaît beaucoup.",
    'q-app-difficultes-formation':
      'La technologie culinaire (vocabulaire spécifique) demande de la mémorisation.',
    'q-app-difficultes-autres':
      "Réveil tôt pour les services du midi, je m'adapte progressivement.",
    'q-app-ressenti-equipe':
      'Très bien intégrée dans la brigade. Karim me fait confiance et me confie des tâches variées.',
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes':
      'CAP Cuisine (3 apprenti·e·s formé·e·s sur les 8 dernières années).',
    'q-mai-objectifs-embauche':
      'Embauche envisagée à la fin du contrat si Léa confirme sa progression actuelle.',
    'q-mai-organisation-tutorat':
      'Tutorat réparti entre moi-même (Karim) et notre second de cuisine. Briefing hebdomadaire le lundi matin.',
  },
  appreciationMaitre: {
    ponctualite: 'plusplus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plusplus',
    commentaires:
      "Très bonne disposition d'esprit. À encourager sur la prise d'initiative en fin de service.",
  },
  demarchesAdministratives: {
    contratSigne: true,
    visiteMedicale: true,
    permisConduire: false,
    voiture: false,
    remarques: 'Visite médicale réalisée le 12/09/2025. Permis prévu en 2026.',
  },
  conditionsPratiques: {
    hebergementCentre: 'Domicile parental — Lyon 8e (15 min en métro).',
    hebergementEntreprise: 'Idem (domicile parental).',
    transportCentre: 'Métro ligne D + tramway T1.',
    transportEntreprise: 'Métro ligne D directe.',
  },
  aidesDemandees: {
    logement: false,
    premierEquipement: true,
    permis: false,
    autres: 'Aide premier équipement obtenue via la région (kit couteaux + tenue professionnelle).',
  },
  commentaires: {
    apprenti: "Merci à Karim et à l'équipe pour l'accueil. Hâte de progresser sur les 2 années.",
    maitre: 'Profil sérieux et motivé. Bon dialogue avec le centre de formation.',
    formateur:
      'Cohérence parcours/projet. Tutorat solide en entreprise. Pas de point de vigilance particulier.',
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2025-10-28T15:30:00.000Z' },
    maitre: { signe: true, dateSignature: '2025-10-28T15:35:00.000Z' },
    formateur: { signe: true, dateSignature: '2025-10-28T15:40:00.000Z' },
  },
};

const leaPeriode1: FicheSuiviPeriode = {
  id: 'fp-lea-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-cap-cuisine-2025-p1',
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: {
    apprenti:
      "Découverte du métier au CFA. L'hygiène HACCP et les taillages sont bien rentrés ; les fonds demandent encore de la pratique.",
    formateur:
      'Technologie culinaire : familles de matières premières, hygiène HACCP introductive. Travaux pratiques : tailles de légumes, fonds, première mise en place complète. Contrôle continu 14/20, évaluation finale 13/20. Profil sérieux.',
  },
  suiviEntreprise: [
    {
      id: 'se-lea-1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti:
        "J'ai appris à contrôler les bons de livraison et à respecter le FIFO en chambre froide.",
    },
    {
      id: 'se-lea-1-2',
      competenceId: 'c1-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'partiel',
      retourApprenti:
        "Mise en place rapide pour le service de midi. Je manque encore d'autonomie en fin de service.",
    },
    {
      id: 'se-lea-1-3',
      competenceId: 'c2-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'partiel',
      retourApprenti:
        'Cuissons à la poêle bien acquises. Les fonds bruns demandent encore de la pratique.',
    },
  ],
  observations: {
    apprenti: "Période très formatrice, équipe accueillante. J'ai pris confiance progressivement.",
    maitre:
      "Léa est ponctuelle et appliquée. Elle gagne en autonomie semaine après semaine. À encourager sur la prise d'initiative.",
    formateur:
      'Bon démarrage. Cohérence visible entre les apprentissages au CFA et la pratique en entreprise.',
  },
  signatures: signaturesCompletes('2025-12-22T14:00:00.000Z'),
  etat: 'verrouillee',
  historiqueDeverrouillages: [],
};

const leaPeriode2: FicheSuiviPeriode = {
  id: 'fp-lea-2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-cap-cuisine-2025-p2',
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: {
    apprenti:
      "Premiers desserts à l'assiette. La crème pâtissière reste un point que je dois consolider.",
    formateur:
      "Pâtisserie : pâtes de base, crème pâtissière, premiers desserts à l'assiette. TP noté 15/20, progression visible.",
  },
  suiviEntreprise: [
    {
      id: 'se-lea-2-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: "J'ai dressé seule plusieurs entrées du menu déjeuner.",
    },
    {
      id: 'se-lea-2-2',
      competenceId: 'c2-3',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'partiel',
      retourApprenti: "Le dressage demande de la précision, je m'améliore.",
    },
    {
      id: 'se-lea-2-3',
      competenceId: 'c3-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'non-fait',
      retourApprenti: "Pas encore eu l'occasion de réaliser de la pâtisserie en service.",
    },
  ],
  observations: {
    apprenti: "Période plus dense. J'ai gagné en vitesse mais je dois soigner les finitions.",
    maitre: 'Progression nette. Léa prend des initiatives sur la mise en place.',
    formateur: 'Adéquation CFA/entreprise correcte. À renforcer côté pâtisserie en entreprise.',
  },
  signatures: signaturesCompletes('2026-02-16T10:30:00.000Z'),
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const leaPeriode3: FicheSuiviPeriode = {
  id: 'fp-lea-3',
  numeroPeriode: 3,
  periodeFormationId: 'pf-cap-cuisine-2025-p3',
  dateDebut: '2026-03-02',
  dateFin: '2026-04-11',
  suiviGretaCfa: {
    apprenti:
      'Période riche entre cuisine méditerranéenne et pâtisserie de restaurant. Beaucoup à retenir sur les herbes aromatiques et le dressage individuel.',
    formateur:
      'Cuisine méditerranéenne (légumes du soleil, herbes aromatiques, huiles parfumées) + pâtisserie de restaurant (crèmes, mousses, parfaits glacés, dressage en assiette). Évaluation finale en cours.',
  },
  suiviEntreprise: [
    {
      id: 'se-lea-3-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti:
        "J'ai pu réaliser plusieurs plats principaux du menu. Très satisfaite du résultat.",
    },
    {
      id: 'se-lea-3-2',
      competenceId: 'c2-3',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: "Le dressage à l'assiette me prend encore beaucoup de temps en service.",
    },
    {
      id: 'se-lea-3-3',
      competenceId: 'c3-2',
      evaluationGreta: null,
      evaluationEntreprise: null,
      retourApprenti: '',
    },
  ],
  observations: {
    apprenti: "Beaucoup de progrès cette période sur l'autonomie. J'ai hâte de la suite.",
    maitre: 'Léa monte clairement en compétence. Bonne gestion du stress en coup de feu.',
    formateur: '',
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2026-04-12T16:20:00.000Z' },
    maitre: { signe: true, dateSignature: '2026-04-12T18:00:00.000Z' },
    formateur: { signe: false },
  },
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

// Périodes EN CENTRE de Léa (17 juin 2026) — évaluées par le formateur
// référent, signées par l'apprenti·e + le formateur (pas de maître au CFA).
//   C1 (Regroupement d'automne, oct. 2025) : signée 2/2
//   C2 (Regroupement d'hiver, janv. 2026)  : EN COURS (formateur pas signé)
const leaCentre1: FicheSuiviPeriode = {
  id: 'fc-lea-c1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-cap-cuisine-2025-c1',
  titre: "Regroupement d'automne",
  dateDebut: '2025-10-06',
  dateFin: '2025-10-17',
  suiviGretaCfa: {
    apprenti:
      "Deux semaines intenses au CFA. J'ai consolidé les taillages et découvert les fonds de sauce.",
    formateur:
      "Regroupement d'automne : approfondissement de l'hygiène HACCP, taillages, fonds de base. Travaux pratiques quotidiens, contrôle continu 14/20.",
  },
  suiviEntreprise: [
    {
      id: 'sc-lea-c1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: null,
      retourApprenti: 'Les contrôles de réception sont maintenant un réflexe.',
    },
    {
      id: 'sc-lea-c1-2',
      competenceId: 'c2-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: null,
      retourApprenti: "Les fonds bruns me demandent encore de l'attention.",
    },
  ],
  observations: {
    apprenti: 'Regroupement très formateur, bonne dynamique de groupe.',
    formateur: 'Léa progresse bien au centre. À consolider sur les fonds.',
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2025-10-17T16:00:00.000Z' },
    maitre: { signe: false },
    formateur: { signe: true, dateSignature: '2025-10-17T16:10:00.000Z' },
  },
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const leaCentre2: FicheSuiviPeriode = {
  id: 'fc-lea-c2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-cap-cuisine-2025-c2',
  titre: "Regroupement d'hiver",
  dateDebut: '2026-01-19',
  dateFin: '2026-01-30',
  suiviGretaCfa: {
    apprenti:
      'Regroupement axé pâtisserie. La crème pâtissière reste un point que je dois consolider.',
    formateur:
      "Regroupement d'hiver : pâtisserie de base (pâtes, crèmes), desserts à l'assiette. Évaluation en cours.",
  },
  suiviEntreprise: [
    {
      id: 'sc-lea-c2-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: null,
      retourApprenti: "J'ai bien réussi les dressages d'entrées en atelier.",
    },
    {
      id: 'sc-lea-c2-2',
      competenceId: 'c2-3',
      evaluationGreta: 'partiel',
      evaluationEntreprise: null,
      retourApprenti: 'La précision du dressage progresse régulièrement.',
    },
  ],
  observations: {
    apprenti: 'Beaucoup de pratique, je gagne en régularité.',
    formateur: '',
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2026-01-30T16:00:00.000Z' },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

const livretLea: Livret = {
  ...livretVierge(apprentiLeaMartin, 'livret-lea'),
  organisationSuivi: {
    evenements: [
      {
        id: 'evt-lea-1',
        motif: 'reunion-rentree',
        date: '2025-09-04',
        commentaire: 'Salle Diderot',
      },
      {
        id: 'evt-lea-2',
        motif: 'entretien-individuel',
        commentaire: 'À planifier',
      },
      {
        id: 'evt-lea-3',
        motif: 'accueil-tuteur',
        date: '2025-09-15',
        commentaire: 'Journée tuteurs',
      },
      {
        id: 'evt-lea-4',
        motif: 'visite-entreprise',
        titre: 'Visite n°1',
        date: '2025-11-12',
        commentaire: "Premier point d'étape avec Karim BENALI.",
      },
      {
        id: 'evt-lea-5',
        motif: 'visite-entreprise',
        titre: 'Visite n°2',
        date: '2026-02-04',
        commentaire: 'Bilan mi-parcours en cuisine.',
      },
      {
        id: 'evt-lea-6',
        motif: 'visite-entreprise',
        titre: 'Visite n°3 (prévue)',
        date: '2026-05-12',
      },
      {
        id: 'evt-lea-7',
        motif: 'restitution-activites',
        commentaire: 'Tous les 6 semaines en classe.',
      },
      {
        id: 'evt-lea-8',
        motif: 'bilan-formation',
        commentaire: 'Bilan intermédiaire en janvier, bilan final en juin.',
      },
      {
        id: 'evt-lea-9',
        motif: 'entretien-tripartite-1',
        date: '2025-10-28',
        modalite: 'presentiel',
        commentaire: 'Réalisé le 28/10/2025 dans les locaux du restaurant Le Gourmet.',
      },
      {
        id: 'evt-lea-10',
        motif: 'entretien-tripartite-2',
        date: '2026-05-15',
        // E2 en distanciel (visio) — démontre la modalité au choix (15 juin 2026).
        modalite: 'distanciel',
        commentaire: 'Bilan mi-parcours — à initialiser et préparer (prévu en visio).',
      },
    ],
    modifieLe: '2025-09-10T08:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  // Événement E2 créé mais entretien encore vide — démontre le cas
  // « à initialiser » (E3/E4 hors périmètre : la formation est à 2 entretiens).
  entretiens: { 1: entretienLea, 2: null, 3: null, 4: null },
  fichesSuivi: [leaPeriode1, leaPeriode2, leaPeriode3],
  // Périodes en centre (17 juin 2026) : C1 signée, C2 en cours.
  fichesSuiviCentre: [leaCentre1, leaCentre2],
  // Attitudes retenues à l'E1 (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiLeaMartin,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-1', 'c3-2'],
    '2025-10-28T15:40:00.000Z',
  ),
  modifieLe: '2026-04-12T18:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 2 : Théo DUBOIS — « bon élève »
// 3 fiches toutes signées + verrouillées, entretien signé
// Pas encore clôturé (parcours en cours, fin contrat 2027).
// ═════════════════════════════════════════════════════════════════════════════

const entretienTheo: EntretienTripartite = {
  dateEntretien: '2025-10-15',
  reponsesTrame: reponsesTrameDemo(),
  questionsApprentiSelectionnees: [...QUESTIONS_E1_APPRENTI],
  questionsMaitreSelectionnees: [...QUESTIONS_E1_MAITRE],
  questionsImposees: [...QUESTIONS_E1_APPRENTI, ...QUESTIONS_E1_MAITRE],
  questionsObligatoires: [...QUESTIONS_E1_OBLIGATOIRES],
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  reponsesApprenti: {
    'q-app-motivations':
      'Reprendre la cuisine familiale italienne (mes grands-parents) en y ajoutant des techniques actuelles.',
    'q-app-contact-entreprise': 'Mon oncle connaissait Karim. Première rencontre en juillet 2025.',
    'q-app-connaissance-entreprise':
      'Pas de visite préalable, mais bonne réputation auprès de mes proches.',
    'q-app-metier-representation': 'Conforme à mes attentes. Je découvre le rythme du soir.',
    'q-app-difficultes-formation': "Aucune particulière jusqu'ici.",
    'q-app-difficultes-autres': '',
    'q-app-ressenti-equipe': "Excellent. Karim et l'équipe sont très pédagogues.",
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes': 'CAP Cuisine.',
    'q-mai-objectifs-embauche': 'Embauche très probable à la fin du contrat.',
    'q-mai-organisation-tutorat': 'Mêmes modalités que pour Léa (briefing hebdo, tutorat partagé).',
  },
  appreciationMaitre: {
    ponctualite: 'plusplus',
    comprehensionConsignes: 'plusplus',
    qualiteTravail: 'plusplus',
    integration: 'plusplus',
    commentaires: 'Profil exceptionnel. Très autonome dès les premiers jours.',
  },
  demarchesAdministratives: {
    contratSigne: true,
    visiteMedicale: true,
    permisConduire: true,
    voiture: false,
    remarques: 'Tous documents en règle.',
  },
  conditionsPratiques: {
    hebergementCentre: 'Studio en colocation Lyon 7e.',
    hebergementEntreprise: 'Idem.',
    transportCentre: 'Vélo + tramway T2.',
    transportEntreprise: 'Vélo principalement.',
  },
  aidesDemandees: {
    logement: true,
    premierEquipement: true,
    permis: false,
    autres: 'Aide au logement APL en cours.',
  },
  commentaires: {
    apprenti: 'Très motivé pour les 2 prochaines années.',
    maitre: 'Excellente recrue. RAS.',
    formateur: 'Profil très solide. À suivre pour éventuelle inscription Bac Pro.',
  },
  signatures: signaturesCompletes('2025-10-15T17:00:00.000Z'),
};

const theoFiche = (
  numero: number,
  debut: string,
  fin: string,
  signatureDate: string,
): FicheSuiviPeriode => ({
  id: `fp-theo-${numero}`,
  numeroPeriode: numero,
  periodeFormationId: `pf-cap-cuisine-2025-p${numero}`,
  dateDebut: debut,
  dateFin: fin,
  suiviGretaCfa: {
    apprenti:
      numero === 1
        ? "Bases du métier rapidement intégrées, je me sens à l'aise au CFA."
        : numero === 2
          ? 'Pâtisserie agréable, je gagne en automatisme sur les gestes.'
          : "Cuisine méditerranéenne très inspirante, je prends de l'aisance en dressage.",
    formateur:
      numero === 1
        ? 'Technologie culinaire : hygiène HACCP, taillages, fonds. Niveau 17/20, profil moteur de la promo.'
        : numero === 2
          ? 'Pâtisserie : pâtes, crèmes, premiers desserts. Niveau 18/20, excellente progression.'
          : 'Cuisine méditerranéenne : spécialités du pourtour méditerranéen. Niveau 17/20.',
  },
  suiviEntreprise:
    numero === 1
      ? [
          {
            id: `se-theo-${numero}-1`,
            competenceId: 'c1-1',
            evaluationGreta: 'maitrise',
            evaluationEntreprise: 'maitrise',
            retourApprenti: "Très à l'aise avec les contrôles de réception.",
          },
          {
            id: `se-theo-${numero}-2`,
            competenceId: 'c1-2',
            evaluationGreta: 'maitrise',
            evaluationEntreprise: 'maitrise',
            retourApprenti: 'Mise en place rapide et propre.',
          },
          {
            id: `se-theo-${numero}-3`,
            competenceId: 'c2-1',
            evaluationGreta: 'maitrise',
            evaluationEntreprise: 'maitrise',
            retourApprenti: 'Les techniques de base sont acquises.',
          },
        ]
      : numero === 2
        ? [
            {
              id: `se-theo-${numero}-1`,
              competenceId: 'c2-2',
              evaluationGreta: 'maitrise',
              evaluationEntreprise: 'maitrise',
              retourApprenti: 'Production complète sur le menu déjeuner.',
            },
            {
              id: `se-theo-${numero}-2`,
              competenceId: 'c3-1',
              evaluationGreta: 'maitrise',
              evaluationEntreprise: 'maitrise',
              retourApprenti: 'Pâtes de base maîtrisées rapidement.',
            },
          ]
        : [
            {
              id: `se-theo-${numero}-1`,
              competenceId: 'c2-3',
              evaluationGreta: 'maitrise',
              evaluationEntreprise: 'maitrise',
              retourApprenti: 'Dressage soigné, tempo rapide en service.',
            },
            {
              id: `se-theo-${numero}-2`,
              competenceId: 'c3-2',
              evaluationGreta: 'maitrise',
              evaluationEntreprise: 'maitrise',
              retourApprenti: 'Crèmes et mousses très bien réussies.',
            },
          ],
  observations: {
    apprenti: 'Période très satisfaisante.',
    maitre: 'Progression rapide et constante.',
    formateur: 'Élève moteur de la promo.',
  },
  signatures: signaturesCompletes(signatureDate),
  etat: 'verrouillee',
  historiqueDeverrouillages: [],
});

const livretTheo: Livret = {
  ...livretVierge(apprentiTheoDubois, 'livret-theo'),
  entretiens: { 1: entretienTheo, 2: null, 3: null, 4: null },
  fichesSuivi: [
    theoFiche(1, '2025-09-02', '2025-12-20', '2025-12-22T14:00:00.000Z'),
    theoFiche(2, '2026-01-06', '2026-02-14', '2026-02-16T10:30:00.000Z'),
    theoFiche(3, '2026-03-02', '2026-04-11', '2026-04-13T09:00:00.000Z'),
  ],
  // Attitudes retenues à l'E1 (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiTheoDubois,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-1', 'c3-2', 'c3-3'],
    '2025-10-15T17:00:00.000Z',
  ),
  modifieLe: '2026-04-13T09:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 3 : Sofia PEREIRA — « alerte R7 »
// L'entretien tripartite n'a JAMAIS été initié → bandeau R7 visible
// (contratDebut = 2025-09-02, butoir = 2025-11-01, on est largement après).
// 1 fiche en brouillon (apprenti·e a commencé à remplir).
// ═════════════════════════════════════════════════════════════════════════════

const sofiaPeriode1: FicheSuiviPeriode = {
  id: 'fp-sofia-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-cap-cuisine-2025-p1',
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: {
    apprenti:
      "Démarrage difficile au CFA. J'ai eu du mal à suivre le rythme au début, ça va un peu mieux depuis la Toussaint.",
    formateur:
      "Technologie culinaire : hygiène HACCP, taillages, fonds. Niveau 11/20. Soutien individualisé à prévoir, à reprendre lors de l'entretien tripartite (non encore tenu).",
  },
  suiviEntreprise: [
    {
      id: 'se-sofia-1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Encore en apprentissage des contrôles de réception.',
    },
    {
      id: 'se-sofia-1-2',
      competenceId: 'c1-2',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: '',
    },
  ],
  observations: {
    apprenti: "J'ai eu du mal à m'intégrer au début. Mieux depuis la Toussaint.",
    maitre: "Démarrage difficile, à reprendre lors de l'entretien tripartite.",
    formateur: '',
  },
  signatures: aucuneSignature,
  etat: 'brouillon',
  historiqueDeverrouillages: [],
};

const livretSofia: Livret = {
  ...livretVierge(apprentiSofiaPereira, 'livret-sofia'),
  organisationSuivi: {
    evenements: [
      {
        id: 'evt-sofia-1',
        motif: 'reunion-rentree',
        date: '2025-09-04',
        commentaire: 'Salle Diderot',
      },
      {
        id: 'evt-sofia-2',
        motif: 'entretien-individuel',
        commentaire: 'Reporté plusieurs fois — à reprogrammer en urgence.',
      },
      {
        id: 'evt-sofia-3',
        motif: 'accueil-tuteur',
        date: '2025-09-15',
        commentaire: 'Journée tuteurs',
      },
      {
        id: 'evt-sofia-4',
        motif: 'visite-entreprise',
        commentaire: 'Aucune visite réalisée à ce jour.',
      },
      {
        id: 'evt-sofia-5',
        motif: 'restitution-activites',
        commentaire: 'Tous les 6 semaines en classe.',
      },
    ],
    modifieLe: '2025-09-10T08:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretiens: { 1: null, 2: null, 3: null, 4: null },
  // P1 entamée (brouillon) ; P2 et P3 héritées du planning mais encore vierges.
  fichesSuivi: [
    sofiaPeriode1,
    creerFichePeriodeVierge(periodesCapCuisine[1], 'fp-sofia-2'),
    creerFichePeriodeVierge(periodesCapCuisine[2], 'fp-sofia-3'),
  ],
  modifieLe: '2025-12-15T11:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 4 : Minh NGUYEN — « démarrage »
// Entretien tripartite signé récemment ; les 3 périodes du planning de la
// formation sont héritées mais encore VIERGES (brouillon, aucune compétence
// ni signature). Cas réaliste d'un·e apprenti·e fraîchement démarré·e en
// cours d'année qui n'a pas encore rempli ses fiches de période.
// ═════════════════════════════════════════════════════════════════════════════

const entretienMinh: EntretienTripartite = {
  dateEntretien: '2026-04-20',
  reponsesTrame: reponsesTrameDemo(),
  questionsApprentiSelectionnees: [...QUESTIONS_E1_APPRENTI],
  questionsMaitreSelectionnees: [...QUESTIONS_E1_MAITRE],
  questionsImposees: [...QUESTIONS_E1_APPRENTI, ...QUESTIONS_E1_MAITRE],
  questionsObligatoires: [...QUESTIONS_E1_OBLIGATOIRES],
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  reponsesApprenti: {
    'q-app-motivations': 'Devenir cuisinier dans la restauration asiatique-fusion.',
    'q-app-contact-entreprise':
      "J'ai déposé une candidature spontanée au début du mois de février 2026.",
    'q-app-connaissance-entreprise':
      "J'ai mangé plusieurs fois à la Brasserie du Rhône. J'aime leur carte.",
    'q-app-metier-representation': "Plus physique que je ne l'imaginais.",
    'q-app-difficultes-formation': '',
    'q-app-difficultes-autres': '',
    'q-app-ressenti-equipe': 'Bonne intégration, équipe accueillante.',
  },
  reponsesMaitre: {
    'q-mai-deja-forme': false,
    'q-mai-diplomes-deja-formes': '',
    'q-mai-objectifs-embauche': 'À évaluer en fin de contrat.',
    'q-mai-organisation-tutorat': 'Tutorat par moi-même (Hélène) + sous-cheffe.',
  },
  appreciationMaitre: {
    ponctualite: 'plus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plusplus',
    commentaires: 'Très motivé, encore peu de recul vu la prise de poste récente.',
  },
  demarchesAdministratives: {
    contratSigne: true,
    visiteMedicale: true,
    permisConduire: false,
    voiture: false,
    remarques: 'Visite médicale réalisée le 15/04/2026.',
  },
  conditionsPratiques: {
    hebergementCentre: 'Domicile parental — Vénissieux.',
    hebergementEntreprise: 'Idem.',
    transportCentre: 'Métro D + bus.',
    transportEntreprise: 'Métro D directe.',
  },
  aidesDemandees: {
    logement: false,
    premierEquipement: true,
    permis: true,
    autres: 'Demande de permis en cours auprès de la région.',
  },
  commentaires: {
    apprenti: 'Hâte de commencer concrètement les périodes de suivi.',
    maitre: 'Intégration prometteuse.',
    formateur: 'Cohérence parcours/projet validée.',
  },
  signatures: signaturesCompletes('2026-04-20T16:00:00.000Z'),
};

const livretMinh: Livret = {
  ...livretVierge(apprentiMinhNguyen, 'livret-minh'),
  organisationSuivi: {
    evenements: [
      {
        id: 'evt-minh-1',
        motif: 'reunion-rentree',
        date: '2025-09-04',
        commentaire: 'Salle Diderot — Minh absent (intégration tardive)',
      },
      {
        id: 'evt-minh-2',
        motif: 'entretien-individuel',
        date: '2026-04-20',
        commentaire: 'Réalisé suite à la prise de poste fin mars 2026.',
      },
      {
        id: 'evt-minh-3',
        motif: 'accueil-tuteur',
        commentaire: 'Hélène ROCHE intégrée à mi-parcours.',
      },
      {
        id: 'evt-minh-4',
        motif: 'visite-entreprise',
        date: '2026-04-25',
        commentaire: 'Première visite après prise de poste.',
      },
      {
        id: 'evt-minh-5',
        motif: 'restitution-activites',
        commentaire: 'Tous les 6 semaines en classe.',
      },
      {
        id: 'evt-minh-6',
        motif: 'entretien-tripartite-1',
        date: '2026-04-20',
        modalite: 'presentiel',
        commentaire: 'Réalisé en présentiel au CFA.',
      },
    ],
    modifieLe: '2026-04-20T16:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretiens: { 1: entretienMinh, 2: null, 3: null, 4: null },
  // Périodes héritées du planning de la formation (chantier #1) — encore
  // vierges : Minh vient de démarrer et n'a rempli aucune fiche.
  fichesSuivi: periodesCapCuisine.map((p) => creerFichePeriodeVierge(p, `fp-minh-${p.numero}`)),
  // Attitudes retenues à l'E1 (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiMinhNguyen,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-2'],
    '2026-04-20T16:00:00.000Z',
  ),
  modifieLe: '2026-04-20T16:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 5 : Aya KOUAMÉ — « désaccord » (R10)
// Une fiche signée puis verrouillée a été DÉVERROUILLÉE par le formateur
// (motif consigné). Les signatures ont été invalidées et la fiche est retournée
// en `en-cours`. Historique R10 visible dans le livret.
// ═════════════════════════════════════════════════════════════════════════════

const ayaPeriode1: FicheSuiviPeriode = {
  id: 'fp-aya-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-cap-cuisine-2025-p1',
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: {
    apprenti: "Période OK au CFA. J'ai bien suivi les cours, sans difficulté particulière.",
    formateur:
      'Technologie culinaire : hygiène HACCP, taillages, fonds. Niveau 13/20, progression régulière.',
  },
  suiviEntreprise: [
    {
      id: 'se-aya-1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'OK sur les contrôles.',
    },
    {
      id: 'se-aya-1-2',
      competenceId: 'c2-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'Techniques de base acquises.',
    },
  ],
  observations: {
    apprenti: 'Période OK.',
    maitre: 'Progression correcte.',
    formateur: 'RAS sur cette période.',
  },
  signatures: signaturesCompletes('2025-12-22T14:00:00.000Z'),
  etat: 'verrouillee',
  historiqueDeverrouillages: [],
};

const ayaDeverrouillagePeriode2: EntreeDeverrouillage = {
  id: 'dv-aya-1',
  dateIso: '2026-03-10T11:30:00.000Z',
  auteurId: formatriceSophieDubois.id,
  auteurNom: `${formatriceSophieDubois.prenom} ${formatriceSophieDubois.nom}`,
  auteurRole: 'formateur',
  motif:
    "Désaccord exprimé par l'apprenti·e sur l'évaluation entreprise C2-3 (dressage). À réévaluer après la visite du 12/03/2026.",
};

const ayaPeriode2: FicheSuiviPeriode = {
  id: 'fp-aya-2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-cap-cuisine-2025-p2',
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: {
    apprenti:
      "Pâtisserie un peu plus difficile pour moi. J'ai besoin de plus d'entraînement pour automatiser les gestes.",
    formateur:
      "Pâtisserie : pâtes, crèmes, desserts à l'assiette. Niveau 12/20. Mise en place d'un soutien sur les gestes techniques.",
  },
  suiviEntreprise: [
    {
      id: 'se-aya-2-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'Production OK sur le menu midi.',
    },
    {
      id: 'se-aya-2-2',
      competenceId: 'c2-3',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'non-maitrise',
      retourApprenti:
        "Je ne suis pas d'accord avec l'évaluation de l'entreprise sur le dressage. Plusieurs services sans retour négatif.",
    },
  ],
  observations: {
    apprenti:
      "L'évaluation entreprise sur le dressage me semble injuste. Je demande à en discuter lors de la visite.",
    maitre: 'Période globalement OK. Point de désaccord sur le dressage à clarifier ensemble.',
    formateur:
      'Désaccord identifié sur C2-3. Fiche déverrouillée le 10/03/2026 pour permettre une nouvelle évaluation après visite (cf. historique).',
  },
  // Signatures invalidées par le déverrouillage R10/R21.
  signatures: aucuneSignature,
  etat: 'en-cours',
  historiqueDeverrouillages: [ayaDeverrouillagePeriode2],
};

const livretAya: Livret = {
  ...livretVierge(apprentiAyaKouame, 'livret-aya'),
  entretiens: {
    1: {
      ...entretienTheo,
      dateEntretien: '2025-10-22',
      reponsesApprenti: {
        ...entretienTheo.reponsesApprenti,
        'q-app-motivations':
          'Travailler dans la restauration de brigade, viser le Bac Pro à terme.',
        'q-app-contact-entreprise':
          "Candidature spontanée. Hélène a accepté après un essai d'une journée.",
      },
      appreciationMaitre: {
        ponctualite: 'plus',
        comprehensionConsignes: 'plus',
        qualiteTravail: 'plus',
        integration: 'plus',
        commentaires: 'Profil sérieux, sait défendre ses idées.',
      },
      commentaires: {
        apprenti: "Bonne ambiance d'équipe, je me sens à ma place.",
        maitre: 'À surveiller sur la prise de feedback.',
        formateur: 'Cohérence parcours/projet OK.',
      },
      signatures: signaturesCompletes('2025-10-22T17:30:00.000Z'),
    },
    2: null,
    3: null,
    4: null,
  },
  // P1 verrouillée, P2 déverrouillée (R10) ; P3 héritée du planning, vierge.
  fichesSuivi: [
    ayaPeriode1,
    ayaPeriode2,
    creerFichePeriodeVierge(periodesCapCuisine[2], 'fp-aya-3'),
  ],
  // Attitudes retenues à l'E1 (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiAyaKouame,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-1', 'c3-2'],
    '2025-10-22T17:30:00.000Z',
  ),
  modifieLe: '2026-03-10T11:30:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 6 : Luca BIANCHI — « mi-parcours standard »
// 2 fiches signées, 1 en cours. Entretien signé. Profil neutre, sans alerte.
// ═════════════════════════════════════════════════════════════════════════════

const entretienLuca: EntretienTripartite = {
  dateEntretien: '2025-10-30',
  reponsesTrame: reponsesTrameDemo(),
  questionsApprentiSelectionnees: [...QUESTIONS_E1_APPRENTI],
  questionsMaitreSelectionnees: [...QUESTIONS_E1_MAITRE],
  questionsImposees: [...QUESTIONS_E1_APPRENTI, ...QUESTIONS_E1_MAITRE],
  questionsObligatoires: [...QUESTIONS_E1_OBLIGATOIRES],
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  reponsesApprenti: {
    'q-app-motivations': 'Devenir cuisinier de bistrot, peut-être ouvrir mon affaire à terme.',
    'q-app-contact-entreprise': "J'ai trouvé l'annonce sur le site du GRETA.",
    'q-app-connaissance-entreprise': "Je connaissais l'enseigne par réputation.",
    'q-app-metier-representation': 'Conforme à mes attentes, rythme soutenu mais gérable.',
    'q-app-difficultes-formation': "La pâtisserie demande un peu plus d'attention.",
    'q-app-difficultes-autres': '',
    'q-app-ressenti-equipe': 'Bonne intégration progressive.',
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes': 'CAP Cuisine + Bac Pro.',
    'q-mai-objectifs-embauche': "Possibilité d'embauche à confirmer.",
    'q-mai-organisation-tutorat': 'Tutorat par moi-même, briefing de service.',
  },
  appreciationMaitre: {
    ponctualite: 'plus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plus',
    commentaires: 'Apprenti·e fiable, progression régulière.',
  },
  demarchesAdministratives: {
    contratSigne: true,
    visiteMedicale: true,
    permisConduire: true,
    voiture: true,
    remarques: '',
  },
  conditionsPratiques: {
    hebergementCentre: 'Domicile parental — Villeurbanne.',
    hebergementEntreprise: 'Idem.',
    transportCentre: 'Tramway T1.',
    transportEntreprise: 'Voiture personnelle.',
  },
  aidesDemandees: {
    logement: false,
    premierEquipement: true,
    permis: false,
  },
  commentaires: {
    apprenti: "Période d'adaptation passée, je me sens à l'aise.",
    maitre: 'Progression conforme aux attentes.',
    formateur: 'Cohérence parcours/projet OK. Profil suivi standard.',
  },
  signatures: signaturesCompletes('2025-10-30T16:30:00.000Z'),
};

const lucaPeriode1: FicheSuiviPeriode = {
  id: 'fp-luca-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-cap-cuisine-2025-p1',
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: {
    apprenti:
      'Premières semaines au CFA dans une ambiance studieuse. Bonne progression sur les techniques de base.',
    formateur:
      'Technologie culinaire : hygiène HACCP, taillages, fonds. Niveau 14/20, profil régulier.',
  },
  suiviEntreprise: [
    {
      id: 'se-luca-1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'Contrôles de réception OK.',
    },
    {
      id: 'se-luca-1-2',
      competenceId: 'c1-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Mise en place propre, gain de vitesse en cours.',
    },
    {
      id: 'se-luca-1-3',
      competenceId: 'c2-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Cuissons à consolider.',
    },
  ],
  observations: {
    apprenti: 'Première période formatrice, je gagne en confiance.',
    maitre: 'Bon démarrage, progression régulière.',
    formateur: 'Adéquation CFA/entreprise correcte.',
  },
  signatures: signaturesCompletes('2025-12-21T15:00:00.000Z'),
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const lucaPeriode2: FicheSuiviPeriode = {
  id: 'fp-luca-2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-cap-cuisine-2025-p2',
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: {
    apprenti:
      "Pâtisserie agréable, on travaille beaucoup en binôme. Premiers desserts à l'assiette réussis.",
    formateur: 'Pâtisserie : pâtes, crèmes, premiers desserts. Niveau 13/20.',
  },
  suiviEntreprise: [
    {
      id: 'se-luca-2-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'Production complète sur le menu déjeuner.',
    },
    {
      id: 'se-luca-2-2',
      competenceId: 'c3-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'non-fait',
      retourApprenti: "Pas encore d'occasion en service de pâtisserie.",
    },
  ],
  observations: {
    apprenti: 'Période plus dense.',
    maitre: 'Progression nette en production salée.',
    formateur: 'Renforcer côté pâtisserie en entreprise.',
  },
  signatures: signaturesCompletes('2026-02-17T11:00:00.000Z'),
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const lucaPeriode3: FicheSuiviPeriode = {
  id: 'fp-luca-3',
  numeroPeriode: 3,
  periodeFormationId: 'pf-cap-cuisine-2025-p3',
  dateDebut: '2026-03-02',
  dateFin: '2026-04-11',
  suiviGretaCfa: {
    apprenti:
      'Période en cours sur la cuisine méditerranéenne. Beaucoup de découvertes côté herbes et légumes du soleil.',
    formateur:
      'Cuisine méditerranéenne : spécialités du pourtour méditerranéen. Évaluation en cours.',
  },
  suiviEntreprise: [
    {
      id: 'se-luca-3-1',
      competenceId: 'c2-3',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Dressage en progression, vitesse à améliorer.',
    },
    {
      id: 'se-luca-3-2',
      competenceId: 'c2-4',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: '',
    },
  ],
  observations: {
    apprenti: 'Période en cours, encore quelques semaines.',
    maitre: 'Bonne dynamique.',
    formateur: '',
  },
  signatures: aucuneSignature,
  etat: 'brouillon',
  historiqueDeverrouillages: [],
};

const livretLuca: Livret = {
  ...livretVierge(apprentiLucaBianchi, 'livret-luca'),
  entretiens: { 1: entretienLuca, 2: null, 3: null, 4: null },
  fichesSuivi: [lucaPeriode1, lucaPeriode2, lucaPeriode3],
  // Attitudes retenues à l'E1 (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiLucaBianchi,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-1', 'c3-2', 'c3-3'],
    '2025-10-30T16:30:00.000Z',
  ),
  modifieLe: '2026-04-05T17:00:00.000Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue final
// ─────────────────────────────────────────────────────────────────────────────

/** Tous les livrets de démonstration, indexés par id. */
export const livretsDemo: Record<string, Livret> = {
  [livretLea.id]: livretLea,
  [livretTheo.id]: livretTheo,
  [livretSofia.id]: livretSofia,
  [livretMinh.id]: livretMinh,
  [livretAya.id]: livretAya,
  [livretLuca.id]: livretLuca,
};

// Sanity check à la compilation : un livret par apprenti·e démo.
const _verifIntegrite: void = (() => {
  const ids = new Set(Object.values(livretsDemo).map((l) => l.apprentiId));
  for (const a of apprentisDemo) {
    if (!ids.has(a.id)) {
      throw new Error(`Fixture incohérente : pas de livret pour ${a.id}`);
    }
  }
})();
void _verifIntegrite;
