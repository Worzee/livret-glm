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
  apprentieCamilleMoreau,
  apprentiLeaMartin,
  apprentiLucaBianchi,
  apprentiMinhNguyen,
  apprentiSofiaPereira,
  apprentiTheoDubois,
  apprentiYanisBelkacem,
  apprentisDemo,
  formateurMarcTissier,
  formatriceSophieDubois,
} from './utilisateurs';
import type { Referentiel } from '@/types';
import { referentielCapCuisine } from './referentiel-cap-cuisine';
import { referentielBtsMhr } from './referentiel-bts-mhr';
import { periodesCapCuisine, periodesCentreBtsMhr, periodesCentreCapCuisine } from './formations';
import { creerFichePeriodeVierge } from '@/lib/creation-livret';
import { questionsTrame } from '@/lib/trame-entretien';

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
function lignesEvaluationFinaleVides(referentiel: Referentiel = referentielCapCuisine) {
  return {
    competences: referentiel.blocs
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
 * 2026 : le maître évalue les attitudes lors de l'entretien — R20 exige au
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
 * tuteur décochera celles non abordées lors de l'entretien.
 */
function selectionInitialeDemo(
  dateIso: string,
  referentiel: Referentiel = referentielCapCuisine,
): SelectionCompetencesEntreprise {
  return {
    ids: referentiel.blocs.flatMap((b) => b.competences).map((c) => c.id),
    modifieLe: dateIso,
    historiqueInvalidations: [],
  };
}

/** Construit un livret vierge (sans entretien, sans fiche) pour un·e apprenti·e. */
function livretVierge(
  apprenti: Apprenti,
  livretId: string,
  referentiel: Referentiel = referentielCapCuisine,
  periodesCentre = periodesCentreCapCuisine,
): Livret {
  const lignesVides = lignesEvaluationFinaleVides(referentiel);
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
          // l'Entretien Tripartite depuis la sidebar. Sofia, qui override
          // entièrement son `organisationSuivi`, n'hérite pas de cet
          // événement et conserve son cas « alerte R7 ».
          id: 'evt-vierge-6',
          motif: 'entretien-tripartite',
          date: '2025-10-28',
          commentaire: 'Entretien tripartite — dans les 2 mois suivant le contrat (R7).',
        },
      ],
      modifieLe: '2025-09-10T08:00:00.000Z',
      modifiePar: formatriceSophieDubois.id,
    },
    entretien: null,
    fichesSuivi: [],
    // Périodes en centre (17 juin 2026) — héritées du planning centre, vierges
    // par défaut ; les livrets démo peuvent les surcharger.
    fichesSuiviCentre: periodesCentre.map((p) =>
      creerFichePeriodeVierge(p, `fc-${livretId}-${p.id}`),
    ),
    evaluationFinaleCompetences: {
      lignes: lignesVides.competences,
      modifieLe: '2025-09-02T08:00:00.000Z',
    },
    // Démarre vierge par défaut ; les livrets démo dont l'entretien est signé
    // override ce champ avec `selectionValideeDemo(...)` plus bas.
    selectionCompetencesEntreprise: selectionInitialeDemo('2025-09-02T08:00:00.000Z', referentiel),
    // Choix des attitudes : se fera à l'entretien (13 juin 2026).
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
 * et des textes courts réalistes (surchageables par formation).
 */
function reponsesTrameDemo(
  idsNon: ReadonlyArray<string> = [],
  textes: Record<string, string> = TEXTES_TRAME_E1_DEMO,
): Record<string, string | boolean> {
  const non = new Set(idsNon);
  const out: Record<string, string | boolean> = {};
  for (const q of questionsTrame()) {
    if (q.type === 'oui-non') out[q.id] = !non.has(q.id);
    else out[q.id] = textes[q.id] ?? '';
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// Livret 1 : Léa MARTIN — cas principal (CDC §24.5)
// État au 09/05/2026 :
//   P1 (sept-déc 2025) : verrouillée
//   P2 (janv-fév 2026) : signée
//   P3 (mars-avril 2026) : EN COURS — l'apprenti·e a signé, le maître / tuteur
//                          pas encore (2 signataires depuis le 1ᵉʳ juillet
//                          2026 ; le formateur commente puis verrouille)
// ═════════════════════════════════════════════════════════════════════════════

const entretienLea: EntretienTripartite = {
  dateEntretien: '2025-10-28',
  // Trame officielle E1 (juin 2026) — 2 points d'alerte pour la démo :
  // absences non signalées selon les procédures + difficulté de logement.
  reponsesTrame: reponsesTrameDemo(['e1-org-absences', 'e1-diff-logement']),
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  appreciationMaitre: {
    ponctualite: 'plusplus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plusplus',
    commentaires:
      "Très bonne disposition d'esprit. À encourager sur la prise d'initiative en fin de service.",
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
    // 2 signataires (1ᵉʳ juillet 2026) : le maître / tuteur n'a pas encore
    // signé → la fiche reste « en cours » (cas démo de co-édition).
    apprenti: { signe: true, dateSignature: '2026-04-12T16:20:00.000Z' },
    maitre: { signe: false },
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
        motif: 'entretien-tripartite',
        date: '2025-10-28',
        commentaire: 'Réalisé le 28/10/2025 dans les locaux du restaurant Le Gourmet.',
      },
    ],
    modifieLe: '2025-09-10T08:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretien: entretienLea,
  fichesSuivi: [leaPeriode1, leaPeriode2, leaPeriode3],
  // Périodes en centre (17 juin 2026) : C1 signée, C2 en cours.
  fichesSuiviCentre: [leaCentre1, leaCentre2],
  // Attitudes retenues à l'entretien (13 juin 2026) — a9 pas encore évaluée.
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
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  appreciationMaitre: {
    ponctualite: 'plusplus',
    comprehensionConsignes: 'plusplus',
    qualiteTravail: 'plusplus',
    integration: 'plusplus',
    commentaires: 'Profil exceptionnel. Très autonome dès les premiers jours.',
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
  entretien: entretienTheo,
  fichesSuivi: [
    theoFiche(1, '2025-09-02', '2025-12-20', '2025-12-22T14:00:00.000Z'),
    theoFiche(2, '2026-01-06', '2026-02-14', '2026-02-16T10:30:00.000Z'),
    theoFiche(3, '2026-03-02', '2026-04-11', '2026-04-13T09:00:00.000Z'),
  ],
  // Attitudes retenues à l'entretien (13 juin 2026) — a9 pas encore évaluée.
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
  entretien: null,
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
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  appreciationMaitre: {
    ponctualite: 'plus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plusplus',
    commentaires: 'Très motivé, encore peu de recul vu la prise de poste récente.',
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
        motif: 'entretien-tripartite',
        date: '2026-04-20',
        commentaire: 'Réalisé en présentiel au CFA.',
      },
    ],
    modifieLe: '2026-04-20T16:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretien: entretienMinh,
  // Périodes héritées du planning de la formation (chantier #1) — encore
  // vierges : Minh vient de démarrer et n'a rempli aucune fiche.
  fichesSuivi: periodesCapCuisine.map((p) => creerFichePeriodeVierge(p, `fp-minh-${p.numero}`)),
  // Attitudes retenues à l'entretien (13 juin 2026) — a9 pas encore évaluée.
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
  entretien: {
    ...entretienTheo,
    dateEntretien: '2025-10-22',
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
  // P1 verrouillée, P2 déverrouillée (R10) ; P3 héritée du planning, vierge.
  fichesSuivi: [
    ayaPeriode1,
    ayaPeriode2,
    creerFichePeriodeVierge(periodesCapCuisine[2], 'fp-aya-3'),
  ],
  // Attitudes retenues à l'entretien (13 juin 2026) — a9 pas encore évaluée.
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
  evaluationsAttitudes: evaluationsAttitudesDemo(),
  appreciationMaitre: {
    ponctualite: 'plus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'plus',
    integration: 'plus',
    commentaires: 'Apprenti·e fiable, progression régulière.',
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
  entretien: entretienLuca,
  fichesSuivi: [lucaPeriode1, lucaPeriode2, lucaPeriode3],
  // Attitudes retenues à l'entretien (13 juin 2026) — a9 pas encore évaluée.
  attitudesSelectionnees: ['a5', 'a6', 'a9'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentiLucaBianchi,
    ['c1-1', 'c1-2', 'c1-3', 'c2-1', 'c2-2', 'c2-3', 'c3-1', 'c3-2', 'c3-3'],
    '2025-10-30T16:30:00.000Z',
  ),
  modifieLe: '2026-04-05T17:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Promo BTS MHR 2025-2027 (3 juillet 2026) — 2ᵉ formation de démo.
// Référentiel 3 niveaux, formateur Marc TISSIER.
//   - Camille MOREAU : mi-parcours riche — entretien signé, P1 verrouillée,
//     P2 signée (à verrouiller), P3 en cours, C1 signée, C2 en cours
//     (formateur pas signé)
//   - Yanis BELKACEM : « retard » — entretien jamais initialisé (alerte R7),
//     événement planifié en attente (cas « à initialiser »), P1 entamée mais
//     non signée alors que la période est terminée
// ═════════════════════════════════════════════════════════════════════════════

/** Signatures d'une fiche ENTREPRISE (2 parties depuis le 1ᵉʳ juillet 2026). */
const signaturesEntreprise = (date: string): SignaturesTripartite => ({
  apprenti: { signe: true, dateSignature: date },
  maitre: { signe: true, dateSignature: date },
  formateur: { signe: false },
});

/** Signatures d'une fiche CENTRE (apprenti·e + formateur référent). */
const signaturesCentre = (date: string): SignaturesTripartite => ({
  apprenti: { signe: true, dateSignature: date },
  maitre: { signe: false },
  formateur: { signe: true, dateSignature: date },
});

/** Textes de la trame adaptés au contexte salle / hôtellerie du BTS MHR. */
const TEXTES_TRAME_CAMILLE: Record<string, string> = {
  'e1-integ-accueil':
    "Accueil très structuré : journée d'intégration avec visite de l'hôtel et du restaurant.",
  'e1-integ-presentation':
    'Présentation des équipes de salle et de réception, des standards de service et du poste.',
  'e1-accomp-echanges':
    'Brief quotidien avant le service ; point hebdomadaire le jeudi avec la directrice de la restauration.',
  'e1-adeq-activites':
    'Accueil des clients, service au restaurant gastronomique, participation aux briefings.',
  'e1-adeq-difficultes':
    "L'anglais professionnel en situation de service reste à consolider - à travailler en centre.",
};

const entretienCamille: EntretienTripartite = {
  dateEntretien: '2025-10-21',
  reponsesTrame: reponsesTrameDemo([], TEXTES_TRAME_CAMILLE),
  // Attitudes retenues à l'entretien : hygiène/tenue exclues au profit du
  // relationnel.
  evaluationsAttitudes: { a7: 'plus', a9: 'plusplus', a10: 'moins', a12: 'plus' },
  appreciationMaitre: {
    ponctualite: 'plus',
    comprehensionConsignes: 'plus',
    qualiteTravail: 'moins',
    integration: 'plusplus',
    commentaires:
      'Très bon relationnel client. La rigueur des mises en place doit encore progresser — normal à ce stade.',
  },
  commentaires: {
    apprenti: "L'équipe m'a très bien intégrée, le rythme des services est soutenu mais motivant.",
    maitre: 'Profil prometteur pour la salle. Objectif : responsabiliser Camille sur un rang.',
    formateur: 'Alternance bien engagée. Programme anglais professionnel renforcé au centre.',
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2025-10-21T14:30:00.000Z' },
    maitre: { signe: true, dateSignature: '2025-10-21T14:35:00.000Z' },
    formateur: { signe: true, dateSignature: '2025-10-21T14:40:00.000Z' },
  },
};

const camillePeriode1: FicheSuiviPeriode = {
  id: 'fp-camille-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-bts-mhr-2025-p1',
  dateDebut: '2025-09-08',
  dateFin: '2025-12-19',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'se-camille-1-1',
      competenceId: 'mhr1-1',
      evaluationGreta: null,
      evaluationEntreprise: 'maitrise',
      retourApprenti: "L'accueil et le placement des clients sont devenus naturels.",
    },
    {
      id: 'se-camille-1-2',
      competenceId: 'mhr1-3',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Le service au guéridon demande encore de la pratique.',
    },
    {
      id: 'se-camille-1-3',
      competenceId: 'mhr1-5',
      evaluationGreta: null,
      evaluationEntreprise: 'maitrise',
      retourApprenti: "Les affichages allergènes n'ont plus de secret pour moi.",
    },
  ],
  observations: {
    apprenti: 'Première période dense : les services du soir sont exigeants mais formateurs.',
    maitre:
      'Camille a trouvé sa place en salle dès les premières semaines. Très bon contact client.',
    formateur: "Démarrage cohérent entre le centre et l'entreprise.",
  },
  signatures: signaturesEntreprise('2025-12-20T11:00:00.000Z'),
  etat: 'verrouillee',
  historiqueDeverrouillages: [],
};

const camillePeriode2: FicheSuiviPeriode = {
  id: 'fp-camille-2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-bts-mhr-2025-p2',
  dateDebut: '2026-01-05',
  dateFin: '2026-03-27',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'se-camille-2-1',
      competenceId: 'mhr1-2',
      evaluationGreta: null,
      evaluationEntreprise: 'maitrise',
      retourApprenti: 'Ventes additionnelles régulières sur les suggestions du chef.',
    },
    {
      id: 'se-camille-2-2',
      competenceId: 'mhr1-4',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Les accords mets-vins progressent grâce aux dégustations du mardi.',
    },
    {
      id: 'se-camille-2-3',
      competenceId: 'mhr3-1',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Je participe au calcul des ratios du restaurant chaque fin de mois.',
    },
  ],
  observations: {
    apprenti: 'Période riche : banquets, séminaires et premiers calculs de ratios.',
    maitre: 'Autonomie confirmée sur un rang. Camille encadre ponctuellement un commis.',
    formateur: '',
  },
  signatures: signaturesEntreprise('2026-03-28T10:30:00.000Z'),
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const camillePeriode3: FicheSuiviPeriode = {
  id: 'fp-camille-3',
  numeroPeriode: 3,
  periodeFormationId: 'pf-bts-mhr-2025-p3',
  dateDebut: '2026-04-27',
  dateFin: '2026-07-10',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'se-camille-3-1',
      competenceId: 'mhr2-1',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: "J'anime le briefing du midi une semaine sur deux.",
    },
    {
      id: 'se-camille-3-2',
      competenceId: 'mhr2-2',
      evaluationGreta: null,
      evaluationEntreprise: null,
      retourApprenti: "Tutorat des extras de l'été en cours.",
    },
  ],
  observations: {
    apprenti: 'Période en cours — gros volume avec la saison des terrasses.',
    maitre: '',
    formateur: '',
  },
  signatures: aucuneSignature,
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

const camilleCentre1: FicheSuiviPeriode = {
  id: 'fc-camille-c1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-bts-mhr-2025-c1',
  titre: 'Regroupement service & relation client',
  dateDebut: '2025-11-03',
  dateFin: '2025-11-14',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'sc-camille-c1-1',
      competenceId: 'mhr1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: null,
      retourApprenti: 'Ateliers accueil en anglais très utiles pour la clientèle étrangère.',
    },
    {
      id: 'sc-camille-c1-2',
      competenceId: 'mhr1-4',
      evaluationGreta: 'partiel',
      evaluationEntreprise: null,
      retourApprenti: 'Initiation sommellerie : les accords classiques sont acquis.',
    },
  ],
  observations: {
    apprenti: 'Regroupement intense, beaucoup de mises en situation.',
    formateur: 'Très bonne participation. Anglais professionnel en net progrès.',
  },
  signatures: signaturesCentre('2025-11-14T16:30:00.000Z'),
  etat: 'signee',
  historiqueDeverrouillages: [],
};

const camilleCentre2: FicheSuiviPeriode = {
  id: 'fc-camille-c2',
  numeroPeriode: 2,
  periodeFormationId: 'pf-bts-mhr-2025-c2',
  titre: "Regroupement gestion d'équipe",
  dateDebut: '2026-02-09',
  dateFin: '2026-02-20',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'sc-camille-c2-1',
      competenceId: 'mhr2-1',
      evaluationGreta: 'partiel',
      evaluationEntreprise: null,
      retourApprenti: 'Jeux de rôle de briefing : à retravailler sur la concision.',
    },
    {
      id: 'sc-camille-c2-2',
      competenceId: 'mhr3-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: null,
      retourApprenti: 'Les calculs de coûts matière sont maîtrisés sur tableur.',
    },
  ],
  observations: {
    apprenti: 'Regroupement gestion très concret, directement réutilisable en entreprise.',
    formateur: '',
  },
  signatures: {
    // La formatrice n'a pas encore signé → alimente le centre d'alertes de Marc.
    apprenti: { signe: true, dateSignature: '2026-02-20T16:00:00.000Z' },
    maitre: { signe: false },
    formateur: { signe: false },
  },
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

const livretCamille: Livret = {
  ...livretVierge(
    apprentieCamilleMoreau,
    'livret-camille',
    referentielBtsMhr,
    periodesCentreBtsMhr,
  ),
  organisationSuivi: {
    evenements: [
      {
        id: 'evt-camille-1',
        motif: 'reunion-rentree',
        date: '2025-09-08',
        commentaire: 'Amphithéâtre du site Bellecour',
      },
      {
        id: 'evt-camille-2',
        motif: 'entretien-tripartite',
        date: '2025-10-21',
        commentaire: 'Entretien tripartite — dans les 2 mois suivant le contrat (R7).',
      },
      {
        id: 'evt-camille-3',
        motif: 'visite-entreprise',
        titre: 'Visite n°1',
        date: '2025-12-18',
        commentaire: "Point d'étape avec Nadia HAMDI avant les fêtes.",
      },
      {
        id: 'evt-camille-4',
        motif: 'bilan-formation',
        date: '2026-03-30',
        commentaire: 'Bilan de mi-parcours de 1ʳᵉ année (fiche de suivi dédiée).',
      },
      {
        id: 'evt-camille-6',
        motif: 'bilan-formation',
        commentaire: 'Bilan final prévu en juin 2027.',
      },
    ],
    modifieLe: '2026-06-25T09:00:00.000Z',
    modifiePar: formateurMarcTissier.id,
  },
  entretien: entretienCamille,
  fichesSuivi: [camillePeriode1, camillePeriode2, camillePeriode3],
  fichesSuiviCentre: [camilleCentre1, camilleCentre2],
  attitudesSelectionnees: ['a7', 'a9', 'a10', 'a12'],
  selectionCompetencesEntreprise: selectionValideeDemo(
    apprentieCamilleMoreau,
    ['mhr1-1', 'mhr1-2', 'mhr1-3', 'mhr1-4', 'mhr1-5', 'mhr2-1', 'mhr2-2', 'mhr3-1', 'mhr3-3'],
    '2025-10-21T14:40:00.000Z',
  ),
  creeLe: '2025-09-08T08:00:00.000Z',
  modifieLe: '2026-07-01T16:00:00.000Z',
};

const yanisPeriode1: FicheSuiviPeriode = {
  id: 'fp-yanis-1',
  numeroPeriode: 1,
  periodeFormationId: 'pf-bts-mhr-2025-p1',
  dateDebut: '2025-09-08',
  dateFin: '2025-12-19',
  suiviGretaCfa: {},
  suiviEntreprise: [
    {
      id: 'se-yanis-1-1',
      competenceId: 'mhr1-1',
      evaluationGreta: null,
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Je commence à prendre les réservations téléphoniques.',
    },
  ],
  observations: {
    apprenti: "Découverte du restaurant, on m'a confié le poste des petits-déjeuners.",
    maitre: '',
    formateur: '',
  },
  // Période terminée depuis décembre mais fiche jamais signée → alimente le
  // centre d'alertes de Yanis (apprenti) et Julien FAURE (tuteur).
  signatures: aucuneSignature,
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

const livretYanis: Livret = {
  ...livretVierge(apprentiYanisBelkacem, 'livret-yanis', referentielBtsMhr, periodesCentreBtsMhr),
  // Entretien jamais initialisé alors que le contrat court depuis septembre
  // 2025 → alerte R7 visible chez Marc TISSIER et Martine. L'événement
  // « Entretien Tripartite » existe (sans date) → cas « planifié : à
  // initialiser » dans le centre d'alertes de Marc.
  organisationSuivi: {
    evenements: [
      {
        id: 'evt-yanis-1',
        motif: 'reunion-rentree',
        date: '2025-09-08',
        commentaire: 'Amphithéâtre du site Bellecour',
      },
      {
        id: 'evt-yanis-2',
        motif: 'accueil-tuteur',
        date: '2025-09-22',
        commentaire: 'Journée tuteurs — Julien FAURE excusé (à reprogrammer).',
      },
      {
        id: 'evt-yanis-3',
        motif: 'entretien-individuel',
        commentaire: "À planifier d'urgence avec le tuteur.",
      },
      {
        id: 'evt-yanis-4',
        motif: 'entretien-tripartite',
        commentaire: "À programmer d'urgence — délai R7 dépassé.",
      },
    ],
    modifieLe: '2025-09-22T10:00:00.000Z',
    modifiePar: formateurMarcTissier.id,
  },
  fichesSuivi: [
    yanisPeriode1,
    creerFichePeriodeVierge(
      { id: 'pf-bts-mhr-2025-p2', numero: 2, dateDebut: '2026-01-05', dateFin: '2026-03-27' },
      'fp-yanis-2',
    ),
    creerFichePeriodeVierge(
      { id: 'pf-bts-mhr-2025-p3', numero: 3, dateDebut: '2026-04-27', dateFin: '2026-07-10' },
      'fp-yanis-3',
    ),
  ],
  modifieLe: '2026-01-10T09:00:00.000Z',
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
  [livretCamille.id]: livretCamille,
  [livretYanis.id]: livretYanis,
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
