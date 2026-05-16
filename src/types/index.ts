/**
 * Types métier du livret d'apprentissage.
 * Référence : cahier des charges v1.3, section 7 (Modèle de données).
 *
 * Ces types sont la SOURCE UNIQUE de la structure de données.
 * Ne pas dupliquer ailleurs sans validation explicite (cf. CDC §0).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 7.1 — Entités principales
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rôles utilisateur du système (hiérarchie du moins puissant au plus puissant).
 *
 * - `apprenti`   : la personne en formation (vue restreinte à son livret)
 * - `maitre`     : tuteur entreprise (encadre 1..N apprenti·e·s)
 * - `formateur`  : formateur référent pédagogique (suit 1..N promos)
 * - `coordo`     : coordinateur GRETA — gère comptes, formations, affectations.
 *                  Lecture seule sur les livrets.
 * - `admin`      : super-utilisateur (typiquement le pilote du dispositif).
 *                  Hérite de tous les droits des autres rôles + peut créer
 *                  des coordos + saisir les données réservées aux rôles métier.
 *                  Ne possède pas de slot de signature en propre : signe au
 *                  nom des 3 rôles métier.
 */
export type Role = 'apprenti' | 'maitre' | 'formateur' | 'coordo' | 'admin';

export interface Utilisateur {
  id: string;
  role: Role;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

export interface Lieu {
  /** Libellé court affiché dans les listes (ex : "GRETA Lyon Métropole — Site Diderot"). */
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

export interface Formation {
  id: string;
  intitule: string;
  /** Année académique (ex : "2025-2026"). */
  annee: string;
  niveau: string;
  referentielId: string;
  /** Date de début de la promo (ISO 8601 YYYY-MM-DD). */
  dateDebut: string;
  /** Date de fin de la promo (ISO 8601 YYYY-MM-DD). */
  dateFin: string;
  /** Lieu principal du centre de formation (le coordo peut le modifier). */
  lieu: Lieu;
}

export interface Entreprise {
  id: string;
  raisonSociale: string;
  siret?: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

export interface Apprenti extends Utilisateur {
  role: 'apprenti';
  dateNaissance: string;
  formationId: string;
  entrepriseId: string;
  maitreApprentissageId: string;
  formateurReferentId: string;
  contratDebut: string;
  contratFin: string;
}

export interface Maitre extends Utilisateur {
  role: 'maitre';
  entrepriseId: string;
  apprentiIds: string[];
}

export interface Formateur extends Utilisateur {
  role: 'formateur';
  promoIds: string[];
}

export interface Coordo extends Utilisateur {
  role: 'coordo';
  /** Liste des formations sur lesquelles le coordo a autorité administrative. */
  formationIds: string[];
}

export interface Admin extends Utilisateur {
  role: 'admin';
}

export type NiveauMaitrise = 'maitrise' | 'partiel' | 'non-maitrise';
export type NiveauMaitriseEntreprise = NiveauMaitrise | 'non-fait';
export type NiveauAppreciation = 'plusplus' | 'plus' | 'moins' | 'moinsmoins';

// ─────────────────────────────────────────────────────────────────────────────
// 7.2 — Référentiel de compétences
// ─────────────────────────────────────────────────────────────────────────────

export interface Competence {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  /**
   * Groupement intermédiaire optionnel — utilisé quand le référentiel a
   * 3 niveaux hiérarchiques (Bloc → Sous-famille → Compétence/leaf).
   * Quand absent, le référentiel est plat (Bloc → Compétence/leaf).
   * L'évaluation se fait toujours au niveau leaf (cette Compétence elle-même).
   */
  sousFamille?: string;
  /**
   * Indique si la compétence est abordée en période en entreprise. Quand
   * `false`, elle ne doit pas apparaître dans le sélecteur de la fiche
   * « Suivi de la formation en entreprise ». Quand `true` ou `undefined`
   * (défaut implicite, rétrocompat avec les anciens référentiels), elle
   * est éligible à l'évaluation tri-colonnes.
   *
   * Le pilotage se fait depuis la page `/admin/referentiels` (case à
   * cocher par compétence). Les imports CSV/XLSX laissent ce champ
   * `undefined` → la compétence est par défaut abordée en entreprise.
   */
  evalueeEnEntreprise?: boolean;
}

export interface BlocCompetences {
  id: string;
  code: string;
  libelle: string;
  competences: Competence[];
}

export interface AttitudeProfessionnelle {
  id: string;
  libelle: string;
  description?: string;
}

export interface Referentiel {
  id: string;
  formation: string;
  blocs: BlocCompetences[];
  attitudes: AttitudeProfessionnelle[];
  /**
   * Métadonnée d'origine : nombre de niveaux hiérarchiques détectés à l'import.
   *   - 2 : Bloc → Compétence
   *   - 3 : Bloc → Sous-famille → Compétence
   * Détermine l'affichage (groupé ou plat).
   */
  niveauxColonnes?: 2 | 3;
  /** Indication de la source d'origine, utile en debug et dans l'admin. */
  source?: 'fixture' | 'import-csv' | 'import-xlsx' | 'edition-manuelle';
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.3 — Livret d'apprentissage
// ─────────────────────────────────────────────────────────────────────────────

export interface SignaturePartie {
  signe: boolean;
  dateSignature?: string;
}

export interface SignaturesTripartite {
  apprenti: SignaturePartie;
  maitre: SignaturePartie;
  formateur: SignaturePartie;
}

/**
 * Motifs disponibles pour les événements de l'organisation du suivi (CDC §5.1).
 *
 * Le formateur référent peut ajouter un nombre arbitraire d'événements (ex.
 * 3 visites en entreprise distinctes). Le motif `'autre'` autorise toute
 * occasion non couverte par les motifs standards (conseil de classe, sortie
 * pédagogique, période d'examen, etc.).
 */
export type MotifOrganisationSuivi =
  | 'reunion-rentree'
  | 'entretien-individuel'
  | 'accueil-tuteur'
  | 'visite-entreprise'
  | 'restitution-activites'
  | 'bilan-formation'
  | 'autre';

/**
 * Un événement planifié dans l'organisation du suivi (CDC §5.1, refonte
 * modulaire mai 2026).
 *
 * Anciennement, `OrganisationSuivi` portait 6 champs nommés rigides ; les
 * livrets sont désormais alimentés via une liste dynamique d'événements créés
 * à la demande par le formateur référent. Plusieurs événements peuvent
 * partager le même motif (ex. plusieurs visites en entreprise) — le `titre`
 * optionnel permet de les distinguer dans la liste.
 */
export interface EvenementOrganisationSuivi {
  /** Identifiant stable (UUID court) — clé React et cible des mutations. */
  id: string;
  /** Catégorie de l'événement (cf. `MotifOrganisationSuivi`). */
  motif: MotifOrganisationSuivi;
  /** Titre libre — utile pour distinguer plusieurs cartes d'un même motif. */
  titre?: string;
  /** Date principale au format ISO 8601 (YYYY-MM-DD), optionnelle. */
  date?: string;
  /** Commentaire libre — lieu, modalités, dates secondaires, etc. */
  commentaire?: string;
  /**
   * Verrou local de l'événement — quand `true`, le titre, la date et le
   * commentaire passent en lecture seule jusqu'à un déverrouillage explicite.
   */
  verrouille?: boolean;
}

export interface OrganisationSuivi {
  /** Liste ordonnée des événements créés (ordre d'ajout). */
  evenements: EvenementOrganisationSuivi[];
  modifieLe: string;
  modifiePar: string;
}

/**
 * Banque de questions de l'entretien tripartite (CDC §5.2, refonte mai 2026).
 *
 * Les questions posées à l'apprenti·e et au maître d'apprentissage ne sont
 * plus codées en dur : elles vivent dans une banque centrale gérée par les
 * coordinateur·rice·s + administrateur·rice·s. Pour chaque livret, le
 * formateur référent sélectionne (et ordonne) les questions à poser.
 *
 * Les réponses sont indexées par `questionId` pour rester robustes au
 * renommage des questions ; le type de la valeur dépend du `type` de la
 * question.
 */
export type CibleQuestion = 'apprenti' | 'maitre';

export type TypeQuestion = 'texte-court' | 'texte-long' | 'oui-non';

export interface QuestionBanque {
  id: string;
  /** À qui la question s'adresse — détermine la section dans laquelle elle apparaît. */
  cible: CibleQuestion;
  /** Format attendu de la réponse. */
  type: TypeQuestion;
  /** Libellé affiché à l'utilisateur·rice. */
  libelle: string;
  /** Aide de saisie facultative (placeholder). Ignorée pour le type oui-non. */
  placeholder?: string;
}

/**
 * Réponse à une question de l'entretien.
 *  - texte-court / texte-long → string
 *  - oui-non                  → boolean | null (null = pas répondu)
 */
export type ValeurReponseEntretien = string | boolean | null;

/**
 * Réponses indexées par `questionId`. Une entrée manquante = pas répondu.
 */
export type ReponsesEntretien = Record<string, ValeurReponseEntretien>;

export interface AppreciationMaitre {
  ponctualite?: NiveauAppreciation;
  comprehensionConsignes?: NiveauAppreciation;
  qualiteTravail?: NiveauAppreciation;
  integration?: NiveauAppreciation;
  commentaires?: string;
}

export interface DemarchesAdministratives {
  contratSigne: boolean | null;
  visiteMedicale: boolean | null;
  permisConduire: boolean | null;
  voiture: boolean | null;
  remarques?: string;
}

export interface ConditionsPratiques {
  hebergementCentre?: string;
  hebergementEntreprise?: string;
  transportCentre?: string;
  transportEntreprise?: string;
}

export interface AidesDemandees {
  logement: boolean | null;
  premierEquipement: boolean | null;
  permis: boolean | null;
  autres?: string;
}

export interface CommentairesEntretien {
  apprenti?: string;
  maitre?: string;
  formateur?: string;
}

export interface EntretienTripartite {
  dateEntretien?: string;
  /**
   * IDs des questions sélectionnées par le formateur référent pour chaque
   * cible. L'ordre du tableau détermine l'ordre d'affichage. Vide = aucune
   * question sélectionnée (le formateur doit en choisir avant la saisie).
   */
  questionsApprentiSelectionnees: string[];
  questionsMaitreSelectionnees: string[];
  /** Réponses indexées par `questionId` (cf. `ReponsesEntretien`). */
  reponsesApprenti: ReponsesEntretien;
  reponsesMaitre: ReponsesEntretien;
  appreciationMaitre: AppreciationMaitre;
  demarchesAdministratives: DemarchesAdministratives;
  conditionsPratiques: ConditionsPratiques;
  aidesDemandees: AidesDemandees;
  commentaires: CommentairesEntretien;
  signatures: SignaturesTripartite;
}

export type EtatFiche = 'brouillon' | 'en-cours' | 'signee' | 'verrouillee';

export interface LigneSuiviGreta {
  id: string;
  nomCours: string;
  nomFormateur: string;
  contenu: string;
  evaluations?: string;
}

export interface LigneSuiviEntreprise {
  id: string;
  competenceId: string | null; // null si activité ad hoc
  libelleLibre?: string; // si hors référentiel
  evaluationGreta: NiveauMaitrise | null;
  evaluationEntreprise: NiveauMaitriseEntreprise | null;
  retourApprenti: string;
}

export interface ObservationsFiche {
  apprenti?: string;
  maitre?: string;
  formateur?: string;
}

export interface FicheSuiviPeriode {
  id: string;
  numeroPeriode: number;
  /**
   * Titre libre optionnel. Quand renseigné, l'UI affiche
   * « Période N — <titre> » (ex. « Période 2 — Stage automne »). Quand vide
   * ou absent, l'UI affiche « Période N » seul. Édité par le formateur
   * référent ou le coordo.
   */
  titre?: string;
  dateDebut: string;
  dateFin: string;
  suiviGretaCfa: LigneSuiviGreta[];
  suiviEntreprise: LigneSuiviEntreprise[];
  observations: ObservationsFiche;
  signatures: SignaturesTripartite;
  etat: EtatFiche;
  /**
   * Historique des déverrouillages effectués par le formateur référent (R10).
   * Empilé chronologiquement (le plus récent en dernier).
   * Sert à l'audit et à l'export PDF.
   */
  historiqueDeverrouillages: EntreeDeverrouillage[];
}

export interface LigneEvaluationFinaleCompetence {
  competenceId: string;
  acquisEntreprise: NiveauMaitrise | null;
  acquisCentre: NiveauMaitrise | null;
  commentaire?: string;
}

export interface EvaluationFinaleCompetences {
  lignes: LigneEvaluationFinaleCompetence[];
  modifieLe: string;
}

export interface LigneEvaluationFinaleAttitude {
  attitudeId: string;
  evaluationMaitre: NiveauAppreciation | null;
  evaluationFormateur: NiveauAppreciation | null;
  commentaireMaitre?: string;
  commentaireFormateur?: string;
}

export interface EvaluationFinaleAttitudes {
  lignes: LigneEvaluationFinaleAttitude[];
  modifieLe: string;
}

/**
 * Clôture du livret (R22).
 * Quand le formateur référent clique « Clôturer le livret » alors que toutes les
 * fiches de période sont verrouillées, ce bloc est rempli et l'ensemble du
 * livret passe en lecture seule (grilles d'évaluation finales incluses).
 * `null` tant que le livret n'a pas été clôturé.
 */
export interface ClotureLivret {
  dateCloture: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: Role;
}

/**
 * Trace d'un déverrouillage de fiche de période (R10).
 * Conservée sur la fiche pour assurer la traçabilité (auditabilité du dispositif).
 */
export interface EntreeDeverrouillage {
  id: string;
  dateIso: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: Role;
  /** Motif obligatoire (R10 — confirmation explicite). */
  motif: string;
}

export interface Livret {
  id: string;
  apprentiId: string;
  formationId: string;
  organisationSuivi: OrganisationSuivi;
  entretienTripartite: EntretienTripartite | null;
  fichesSuivi: FicheSuiviPeriode[];
  evaluationFinaleCompetences: EvaluationFinaleCompetences;
  evaluationFinaleAttitudes: EvaluationFinaleAttitudes;
  /** R22 — null tant que le livret n'a pas été clôturé. */
  cloture: ClotureLivret | null;
  creeLe: string;
  modifieLe: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12 — Historique et traçabilité
// ─────────────────────────────────────────────────────────────────────────────

export type ActionHistorique = 'creation' | 'modification' | 'signature' | 'deverrouillage';

export interface EntreeHistorique {
  id: string;
  livretId: string;
  ressource: string;
  action: ActionHistorique;
  ancienneValeur?: unknown;
  nouvelleValeur?: unknown;
  auteurId: string;
  auteurRole: Role;
  auteurNom: string;
  dateIso: string;
  motif?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 13 — Liens externes Pronote WEB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lien externe vers un espace Pronote WEB. Configuré par les rôles `coordo`
 * et `admin` depuis la page `/admin/pronote`. Chaque utilisateur·rice de la
 * maquette retrouve la liste des liens disponibles sur `/livret/pronote` et
 * s'identifie ensuite avec ses propres credentials côté Pronote.
 *
 * Plusieurs liens peuvent coexister (espace élèves, espace enseignants, etc.).
 */
export interface LienPronote {
  id: string;
  /** Libellé court affiché sur le bouton (ex : « Espace élèves »). */
  libelle: string;
  /** URL absolue (https://…). */
  url: string;
  /** Description facultative pour aiguiller l'utilisateur·rice. */
  description?: string;
}
