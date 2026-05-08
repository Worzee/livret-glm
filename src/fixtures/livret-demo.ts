import type {
  EntretienTripartite,
  FicheSuiviPeriode,
  Livret,
  SignaturesTripartite,
} from '@/types';
import { apprentiLeaMartin } from './utilisateurs';
import { referentielCapCuisine } from './referentiel-cap-cuisine';

/**
 * Livret de démonstration de Léa MARTIN.
 * Référence : cahier des charges v1.3, section 24.5 (cas principal).
 *
 * État pédagogique au 15/03/2026 :
 *   - Période 1 (sept-dec 2025) : signée par les 3 parties, verrouillée
 *   - Période 2 (jan-fev 2026)  : signée par les 3 parties
 *   - Période 3 (mars-avril 2026) : EN COURS — apprenti·e + maître ont rempli,
 *                                  le formateur n'a pas encore validé.
 *                                  → scénario idéal pour la démo.
 */

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

// ─────────────────────────────────────────────────────────────────────────────
// Entretien tripartite de Léa — réalisé le 28/10/2025, signé par les 3 parties
// (CDC §24.5 cas principal de démonstration)
// ─────────────────────────────────────────────────────────────────────────────
const entretienLea: EntretienTripartite = {
  dateEntretien: '2025-10-28',
  reponsesApprenti: {
    motivations:
      "Devenir cuisinière dans la restauration traditionnelle, idéalement à mon compte d'ici 10 ans.",
    contactEntreprise:
      "J'ai connu Le Gourmet via une journée portes ouvertes du GRETA, puis un stage de 2 jours en juin 2025.",
    connaissanceEntreprise:
      "Je connaissais le restaurant comme cliente avec mes parents depuis quelques années.",
    metierVsRepresentation:
      "Plus exigeant en rythme que je ne l'imaginais, mais le travail d'équipe me plaît beaucoup.",
    difficultesDisciplines: 'La technologie culinaire (vocabulaire spécifique) demande de la mémorisation.',
    difficultesAutres: "Réveil tôt pour les services du midi, je m'adapte progressivement.",
    ressenti:
      "Très bien intégrée dans la brigade. Karim me fait confiance et me confie des tâches variées.",
  },
  reponsesMaitre: {
    dejaFormeApprenti: true,
    siOuiDiplomes: 'CAP Cuisine (3 apprenti·e·s formé·e·s sur les 8 dernières années).',
    objectifsEmbauche:
      "Embauche envisagée à la fin du contrat si Léa confirme sa progression actuelle.",
    organisationAccueil:
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

// ─────────────────────────────────────────────────────────────────────────────
// Période 1 — Sept à Déc 2025 — verrouillée
// ─────────────────────────────────────────────────────────────────────────────
const periode1: FicheSuiviPeriode = {
  id: 'fp-1',
  numeroPeriode: 1,
  dateDebut: '2025-09-02',
  dateFin: '2025-12-20',
  suiviGretaCfa: [
    {
      id: 'sg-1-1',
      nomCours: 'Technologie culinaire',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Découverte des familles de matières premières. Hygiène HACCP introductive.',
      evaluations: 'Contrôle continu : 14/20',
    },
    {
      id: 'sg-1-2',
      nomCours: 'Travaux pratiques',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Tailles de légumes, fonds de cuisine, première mise en place complète.',
      evaluations: 'Évaluation finale : 13/20',
    },
  ],
  suiviEntreprise: [
    {
      id: 'se-1-1',
      competenceId: 'c1-1',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti:
        "J'ai appris à contrôler les bons de livraison et à respecter le FIFO en chambre froide.",
    },
    {
      id: 'se-1-2',
      competenceId: 'c1-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'partiel',
      retourApprenti:
        "Mise en place rapide pour le service de midi. Je manque encore d'autonomie en fin de service.",
    },
    {
      id: 'se-1-3',
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

// ─────────────────────────────────────────────────────────────────────────────
// Période 2 — Jan à Fév 2026 — signée
// ─────────────────────────────────────────────────────────────────────────────
const periode2: FicheSuiviPeriode = {
  id: 'fp-2',
  numeroPeriode: 2,
  dateDebut: '2026-01-06',
  dateFin: '2026-02-14',
  suiviGretaCfa: [
    {
      id: 'sg-2-1',
      nomCours: 'Pâtisserie',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Pâtes de base, crème pâtissière, premiers desserts à l\'assiette.',
      evaluations: 'TP noté : 15/20',
    },
  ],
  suiviEntreprise: [
    {
      id: 'se-2-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti: "J'ai dressé seule plusieurs entrées du menu déjeuner.",
    },
    {
      id: 'se-2-2',
      competenceId: 'c2-3',
      evaluationGreta: 'partiel',
      evaluationEntreprise: 'partiel',
      retourApprenti: "Le dressage demande de la précision, je m'améliore.",
    },
    {
      id: 'se-2-3',
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

// ─────────────────────────────────────────────────────────────────────────────
// Période 3 — Mars à Avril 2026 — EN COURS (cœur de la démo)
// ─────────────────────────────────────────────────────────────────────────────
const periode3: FicheSuiviPeriode = {
  id: 'fp-3',
  numeroPeriode: 3,
  dateDebut: '2026-03-02',
  dateFin: '2026-04-11',
  suiviGretaCfa: [
    {
      id: 'sg-3-1',
      nomCours: 'Cuisine méditerranéenne',
      nomFormateur: 'Sophie DUBOIS',
      contenu:
        'Spécialités du pourtour méditerranéen, légumes du soleil, herbes aromatiques, huiles parfumées.',
      evaluations: 'En cours',
    },
    {
      id: 'sg-3-2',
      nomCours: 'Pâtisserie de restaurant',
      nomFormateur: 'Sophie DUBOIS',
      contenu: 'Crèmes, mousses, parfaits glacés, dressage en assiette individuelle.',
    },
  ],
  suiviEntreprise: [
    {
      id: 'se-3-1',
      competenceId: 'c2-2',
      evaluationGreta: 'maitrise',
      evaluationEntreprise: 'maitrise',
      retourApprenti:
        "J'ai pu réaliser plusieurs plats principaux du menu. Très satisfaite du résultat.",
    },
    {
      id: 'se-3-2',
      competenceId: 'c2-3',
      evaluationGreta: null, // formateur n'a pas encore évalué
      evaluationEntreprise: 'partiel',
      retourApprenti: 'Le dressage à l\'assiette me prend encore beaucoup de temps en service.',
    },
    {
      id: 'se-3-3',
      competenceId: 'c3-2',
      evaluationGreta: null,
      evaluationEntreprise: null, // ni l'un ni l'autre n'ont évalué
      retourApprenti: '',
    },
  ],
  observations: {
    apprenti: "Beaucoup de progrès cette période sur l'autonomie. J'ai hâte de la suite.",
    maitre:
      'Léa monte clairement en compétence. Bonne gestion du stress en coup de feu.',
    formateur: '', // formateur n'a pas encore renseigné
  },
  signatures: {
    apprenti: { signe: true, dateSignature: '2026-04-12T16:20:00.000Z' },
    maitre: { signe: true, dateSignature: '2026-04-12T18:00:00.000Z' },
    formateur: { signe: false }, // ← le formateur n'a pas encore signé
  },
  etat: 'en-cours',
  historiqueDeverrouillages: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Livret complet de Léa
// ─────────────────────────────────────────────────────────────────────────────
export const livretLeaMartin: Livret = {
  id: 'livret-lea',
  apprentiId: apprentiLeaMartin.id,
  formationId: apprentiLeaMartin.formationId,
  organisationSuivi: {
    reunionRentree: { date: '2025-09-04', commentaire: 'Salle Diderot' },
    entretienIndividuel: { commentaire: 'À planifier' },
    accueilTuteurs: { date: '2025-09-15', commentaire: 'Journée tuteurs' },
    visitesEntreprise: {
      date: '2025-11-12',
      commentaire: 'Puis le 04/02/2026 et le 12/05/2026 (prévue).',
    },
    restitutionActivites: { commentaire: 'Tous les 6 semaines en classe.' },
    bilansFormation: { commentaire: 'Bilan intermédiaire en janvier, bilan final en juin.' },
    modifieLe: '2025-09-10T08:00:00.000Z',
    modifiePar: 'u-formateur-1',
  },
  entretienTripartite: entretienLea,
  fichesSuivi: [periode1, periode2, periode3],
  evaluationFinaleCompetences: {
    lignes: referentielCapCuisine.blocs
      .flatMap((b) => b.competences)
      .map((c) => ({
        competenceId: c.id,
        acquisEntreprise: null,
        acquisCentre: null,
      })),
    modifieLe: '2025-09-02T08:00:00.000Z',
  },
  evaluationFinaleAttitudes: {
    lignes: referentielCapCuisine.attitudes.map((a) => ({
      attitudeId: a.id,
      evaluationMaitre: null,
      evaluationFormateur: null,
    })),
    modifieLe: '2025-09-02T08:00:00.000Z',
  },
  cloture: null,
  creeLe: '2025-09-02T08:00:00.000Z',
  modifieLe: '2026-04-12T18:00:00.000Z',
};

/** Pour l'instant un seul livret de démo. */
export const livretsDemo: Record<string, Livret> = {
  [livretLeaMartin.id]: livretLeaMartin,
};

// Pour la persistance : exposer une copie immutable utilisée comme état initial.
export { aucuneSignature };
