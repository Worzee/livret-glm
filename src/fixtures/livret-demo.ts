import type {
  Apprenti,
  EntretienTripartite,
  EntreeDeverrouillage,
  FicheSuiviPeriode,
  Livret,
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
import { idsQuestionsInitiales } from '@/lib/questions-entretien';

/**
 * Livrets de démonstration — 6 apprenti·e·s, un livret par cas pédagogique.
 * Référence : cahier des charges v1.3, section 24.5.
 *
 * Cas démontrés :
 *   - Léa MARTIN     : cas principal (entretien complet, 2 fiches signées, 1 en cours)
 *   - Théo DUBOIS    : « bon élève » — toutes fiches signées et verrouillées
 *   - Sofia PEREIRA  : « alerte R7 » — entretien non initié → bandeau visible
 *   - Minh NGUYEN    : « démarrage » — entretien signé, aucune fiche
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

/** Initialise les lignes vides des évaluations finales depuis le référentiel. */
function lignesEvaluationFinaleVides() {
  return {
    competences: referentielCapCuisine.blocs
      .flatMap((b) => b.competences)
      .map((c) => ({
        competenceId: c.id,
        acquisEntreprise: null,
        acquisCentre: null,
      })),
    attitudes: referentielCapCuisine.attitudes.map((a) => ({
      attitudeId: a.id,
      evaluationMaitre: null,
      evaluationFormateur: null,
    })),
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
      ],
      modifieLe: '2025-09-10T08:00:00.000Z',
      modifiePar: formatriceSophieDubois.id,
    },
    entretienTripartite: null,
    fichesSuivi: [],
    evaluationFinaleCompetences: {
      lignes: lignesVides.competences,
      modifieLe: '2025-09-02T08:00:00.000Z',
    },
    evaluationFinaleAttitudes: {
      lignes: lignesVides.attitudes,
      modifieLe: '2025-09-02T08:00:00.000Z',
    },
    cloture: null,
    creeLe: '2025-09-02T08:00:00.000Z',
    modifieLe: '2025-09-02T08:00:00.000Z',
  };
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
  questionsApprentiSelectionnees: idsQuestionsInitiales('apprenti'),
  questionsMaitreSelectionnees: idsQuestionsInitiales('maitre'),
  reponsesApprenti: {
    'q-app-motivations':
      "Devenir cuisinière dans la restauration traditionnelle, idéalement à mon compte d'ici 10 ans.",
    'q-app-contact-entreprise':
      "J'ai connu Le Gourmet via une journée portes ouvertes du GRETA, puis un stage de 2 jours en juin 2025.",
    'q-app-connaissance-entreprise':
      "Je connaissais le restaurant comme cliente avec mes parents depuis quelques années.",
    'q-app-metier-representation':
      "Plus exigeant en rythme que je ne l'imaginais, mais le travail d'équipe me plaît beaucoup.",
    'q-app-difficultes-formation':
      'La technologie culinaire (vocabulaire spécifique) demande de la mémorisation.',
    'q-app-difficultes-autres': "Réveil tôt pour les services du midi, je m'adapte progressivement.",
    'q-app-ressenti-equipe':
      "Très bien intégrée dans la brigade. Karim me fait confiance et me confie des tâches variées.",
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes':
      'CAP Cuisine (3 apprenti·e·s formé·e·s sur les 8 dernières années).',
    'q-mai-objectifs-embauche':
      "Embauche envisagée à la fin du contrat si Léa confirme sa progression actuelle.",
    'q-mai-organisation-tutorat':
      "Tutorat réparti entre moi-même (Karim) et notre second de cuisine. Briefing hebdomadaire le lundi matin.",
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
    autres:
      "Aide premier équipement obtenue via la région (kit couteaux + tenue professionnelle).",
  },
  commentaires: {
    apprenti: "Merci à Karim et à l'équipe pour l'accueil. Hâte de progresser sur les 2 années.",
    maitre: "Profil sérieux et motivé. Bon dialogue avec le centre de formation.",
    formateur:
      "Cohérence parcours/projet. Tutorat solide en entreprise. Pas de point de vigilance particulier.",
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
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: [
    {
      id: 'sg-lea-1-1',
      nomCours: 'Technologie culinaire',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Découverte des familles de matières premières. Hygiène HACCP introductive.',
      evaluations: 'Contrôle continu : 14/20',
    },
    {
      id: 'sg-lea-1-2',
      nomCours: 'Travaux pratiques',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Tailles de légumes, fonds de cuisine, première mise en place complète.',
      evaluations: 'Évaluation finale : 13/20',
    },
  ],
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
    apprenti: 'Période très formatrice, équipe accueillante. J\'ai pris confiance progressivement.',
    maitre:
      "Léa est ponctuelle et appliquée. Elle gagne en autonomie semaine après semaine. À encourager sur la prise d'initiative.",
    formateur:
      "Bon démarrage. Cohérence visible entre les apprentissages au CFA et la pratique en entreprise.",
  },
  signatures: signaturesCompletes('2025-12-22T14:00:00.000Z'),
  etat: 'verrouillee',
  historiqueDeverrouillages: [],
};

const leaPeriode2: FicheSuiviPeriode = {
  id: 'fp-lea-2',
  numeroPeriode: 2,
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: [
    {
      id: 'sg-lea-2-1',
      nomCours: 'Pâtisserie',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Pâtes de base, crème pâtissière, premiers desserts à l\'assiette.',
      evaluations: 'TP noté : 15/20',
    },
  ],
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
      retourApprenti: 'Pas encore eu l\'occasion de réaliser de la pâtisserie en service.',
    },
  ],
  observations: {
    apprenti: 'Période plus dense. J\'ai gagné en vitesse mais je dois soigner les finitions.',
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
  dateDebut: '2026-03-02',
  dateFin: '2026-04-11',
  suiviGretaCfa: [
    {
      id: 'sg-lea-3-1',
      nomCours: 'Cuisine méditerranéenne',
      nomFormateur: 'Sophie DUBOIS',
      contenu:
        'Spécialités du pourtour méditerranéen, légumes du soleil, herbes aromatiques, huiles parfumées.',
      evaluations: 'En cours',
    },
    {
      id: 'sg-lea-3-2',
      nomCours: 'Pâtisserie de restaurant',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Crèmes, mousses, parfaits glacés, dressage en assiette individuelle.',
    },
  ],
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
      retourApprenti: 'Le dressage à l\'assiette me prend encore beaucoup de temps en service.',
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
        commentaire: 'Premier point d\'étape avec Karim BENALI.',
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
    ],
    modifieLe: '2025-09-10T08:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretienTripartite: entretienLea,
  fichesSuivi: [leaPeriode1, leaPeriode2, leaPeriode3],
  modifieLe: '2026-04-12T18:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 2 : Théo DUBOIS — « bon élève »
// 3 fiches toutes signées + verrouillées, entretien signé
// Pas encore clôturé (parcours en cours, fin contrat 2027).
// ═════════════════════════════════════════════════════════════════════════════

const entretienTheo: EntretienTripartite = {
  dateEntretien: '2025-10-15',
  questionsApprentiSelectionnees: idsQuestionsInitiales('apprenti'),
  questionsMaitreSelectionnees: idsQuestionsInitiales('maitre'),
  reponsesApprenti: {
    'q-app-motivations':
      'Reprendre la cuisine familiale italienne (mes grands-parents) en y ajoutant des techniques actuelles.',
    'q-app-contact-entreprise': 'Mon oncle connaissait Karim. Première rencontre en juillet 2025.',
    'q-app-connaissance-entreprise':
      "Pas de visite préalable, mais bonne réputation auprès de mes proches.",
    'q-app-metier-representation':
      'Conforme à mes attentes. Je découvre le rythme du soir.',
    'q-app-difficultes-formation': 'Aucune particulière jusqu\'ici.',
    'q-app-difficultes-autres': '',
    'q-app-ressenti-equipe': "Excellent. Karim et l'équipe sont très pédagogues.",
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes': 'CAP Cuisine.',
    'q-mai-objectifs-embauche': 'Embauche très probable à la fin du contrat.',
    'q-mai-organisation-tutorat':
      'Mêmes modalités que pour Léa (briefing hebdo, tutorat partagé).',
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

const theoFiche = (numero: number, debut: string, fin: string, signatureDate: string): FicheSuiviPeriode => ({
  id: `fp-theo-${numero}`,
  numeroPeriode: numero,
  dateDebut: debut,
  dateFin: fin,
  suiviGretaCfa: [
    {
      id: `sg-theo-${numero}-1`,
      nomCours: numero === 1 ? 'Technologie culinaire' : numero === 2 ? 'Pâtisserie' : 'Cuisine méditerranéenne',
      nomFormateur: 'Sophie DUBOIS',
      contenu:
        numero === 1
          ? 'Bases hygiène, taillages, fonds.'
          : numero === 2
            ? 'Pâtes, crèmes, premiers desserts.'
            : 'Spécialités méditerranéennes.',
      evaluations: numero === 1 ? '17/20' : numero === 2 ? '18/20' : '17/20',
    },
  ],
  suiviEntreprise:
    numero === 1
      ? [
          {
            id: `se-theo-${numero}-1`,
            competenceId: 'c1-1',
            evaluationGreta: 'maitrise',
            evaluationEntreprise: 'maitrise',
            retourApprenti: 'Très à l\'aise avec les contrôles de réception.',
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
  entretienTripartite: entretienTheo,
  fichesSuivi: [
    theoFiche(1, '2025-09-02', '2025-12-20', '2025-12-22T14:00:00.000Z'),
    theoFiche(2, '2026-01-06', '2026-02-14', '2026-02-16T10:30:00.000Z'),
    theoFiche(3, '2026-03-02', '2026-04-11', '2026-04-13T09:00:00.000Z'),
  ],
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
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: [
    {
      id: 'sg-sofia-1-1',
      nomCours: 'Technologie culinaire',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Hygiène, taillages, fonds.',
      evaluations: '11/20',
    },
  ],
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
    apprenti: 'J\'ai eu du mal à m\'intégrer au début. Mieux depuis la Toussaint.',
    maitre: 'Démarrage difficile, à reprendre lors de l\'entretien tripartite.',
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
  entretienTripartite: null,
  fichesSuivi: [sofiaPeriode1],
  modifieLe: '2025-12-15T11:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 4 : Minh NGUYEN — « démarrage »
// Entretien tripartite signé récemment, AUCUNE fiche de période créée.
// Cas réaliste pour un apprenti·e fraîchement démarré·e en cours d'année.
// ═════════════════════════════════════════════════════════════════════════════

const entretienMinh: EntretienTripartite = {
  dateEntretien: '2026-04-20',
  questionsApprentiSelectionnees: idsQuestionsInitiales('apprenti'),
  questionsMaitreSelectionnees: idsQuestionsInitiales('maitre'),
  reponsesApprenti: {
    'q-app-motivations': 'Devenir cuisinier dans la restauration asiatique-fusion.',
    'q-app-contact-entreprise':
      "J'ai déposé une candidature spontanée au début du mois de février 2026.",
    'q-app-connaissance-entreprise':
      "J'ai mangé plusieurs fois à la Brasserie du Rhône. J'aime leur carte.",
    'q-app-metier-representation': 'Plus physique que je ne l\'imaginais.',
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
    ],
    modifieLe: '2026-04-20T16:00:00.000Z',
    modifiePar: formatriceSophieDubois.id,
  },
  entretienTripartite: entretienMinh,
  fichesSuivi: [],
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
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: [
    {
      id: 'sg-aya-1-1',
      nomCours: 'Technologie culinaire',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Hygiène, taillages, fonds.',
      evaluations: '13/20',
    },
  ],
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
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: [
    {
      id: 'sg-aya-2-1',
      nomCours: 'Pâtisserie',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Pâtes, crèmes, desserts à l\'assiette.',
      evaluations: '12/20',
    },
  ],
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
    maitre:
      'Période globalement OK. Point de désaccord sur le dressage à clarifier ensemble.',
    formateur:
      "Désaccord identifié sur C2-3. Fiche déverrouillée le 10/03/2026 pour permettre une nouvelle évaluation après visite (cf. historique).",
  },
  // Signatures invalidées par le déverrouillage R10/R21.
  signatures: aucuneSignature,
  etat: 'en-cours',
  historiqueDeverrouillages: [ayaDeverrouillagePeriode2],
};

const livretAya: Livret = {
  ...livretVierge(apprentiAyaKouame, 'livret-aya'),
  entretienTripartite: {
    ...entretienTheo,
    dateEntretien: '2025-10-22',
    reponsesApprenti: {
      ...entretienTheo.reponsesApprenti,
      'q-app-motivations': 'Travailler dans la restauration de brigade, viser le Bac Pro à terme.',
      'q-app-contact-entreprise':
        'Candidature spontanée. Hélène a accepté après un essai d\'une journée.',
    },
    appreciationMaitre: {
      ponctualite: 'plus',
      comprehensionConsignes: 'plus',
      qualiteTravail: 'plus',
      integration: 'plus',
      commentaires: 'Profil sérieux, sait défendre ses idées.',
    },
    commentaires: {
      apprenti: 'Bonne ambiance d\'équipe, je me sens à ma place.',
      maitre: 'À surveiller sur la prise de feedback.',
      formateur: 'Cohérence parcours/projet OK.',
    },
    signatures: signaturesCompletes('2025-10-22T17:30:00.000Z'),
  },
  fichesSuivi: [ayaPeriode1, ayaPeriode2],
  modifieLe: '2026-03-10T11:30:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
// Livret 6 : Luca BIANCHI — « mi-parcours standard »
// 2 fiches signées, 1 en cours. Entretien signé. Profil neutre, sans alerte.
// ═════════════════════════════════════════════════════════════════════════════

const entretienLuca: EntretienTripartite = {
  dateEntretien: '2025-10-30',
  questionsApprentiSelectionnees: idsQuestionsInitiales('apprenti'),
  questionsMaitreSelectionnees: idsQuestionsInitiales('maitre'),
  reponsesApprenti: {
    'q-app-motivations': "Devenir cuisinier de bistrot, peut-être ouvrir mon affaire à terme.",
    'q-app-contact-entreprise': "J'ai trouvé l'annonce sur le site du GRETA.",
    'q-app-connaissance-entreprise': 'Je connaissais l\'enseigne par réputation.',
    'q-app-metier-representation': "Conforme à mes attentes, rythme soutenu mais gérable.",
    'q-app-difficultes-formation': 'La pâtisserie demande un peu plus d\'attention.',
    'q-app-difficultes-autres': '',
    'q-app-ressenti-equipe': 'Bonne intégration progressive.',
  },
  reponsesMaitre: {
    'q-mai-deja-forme': true,
    'q-mai-diplomes-deja-formes': 'CAP Cuisine + Bac Pro.',
    'q-mai-objectifs-embauche': 'Possibilité d\'embauche à confirmer.',
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
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: [
    {
      id: 'sg-luca-1-1',
      nomCours: 'Technologie culinaire',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Hygiène, taillages, fonds.',
      evaluations: '14/20',
    },
  ],
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
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: [
    {
      id: 'sg-luca-2-1',
      nomCours: 'Pâtisserie',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Pâtes, crèmes, premiers desserts.',
      evaluations: '13/20',
    },
  ],
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
      retourApprenti: 'Pas encore d\'occasion en service de pâtisserie.',
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
  dateDebut: '2026-03-02',
  dateFin: '2026-04-11',
  suiviGretaCfa: [
    {
      id: 'sg-luca-3-1',
      nomCours: 'Cuisine méditerranéenne',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Spécialités méditerranéennes.',
      evaluations: 'En cours',
    },
  ],
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
  entretienTripartite: entretienLuca,
  fichesSuivi: [lucaPeriode1, lucaPeriode2, lucaPeriode3],
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

/** Recherche le livret correspondant à un apprenti·e. Retourne `undefined` si aucun. */
export function getLivretByApprentiId(apprentiId: string): Livret | undefined {
  return Object.values(livretsDemo).find((l) => l.apprentiId === apprentiId);
}

// Compatibilité ascendante : Léa reste exportée pour les anciens usages.
export const livretLeaMartin: Livret = livretLea;
export { aucuneSignature };

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
