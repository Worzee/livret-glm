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
 * Un champ de l'organisation du suivi (CDC §5.1).
 * Date principale optionnelle (ISO 8601 YYYY-MM-DD) + commentaire libre.
 *
 * Pour les cas multi-dates (visites en entreprise, bilans semestriels), la
 * date principale porte la première occurrence et les autres sont énumérées
 * dans le commentaire. Pour les cas sans date précise (restitution périodique,
 * bilans à planifier), la date reste vide.
 */
export interface ChampOrganisationSuivi {
  /** Date principale au format ISO 8601 (YYYY-MM-DD), optionnelle. */
  date?: string;
  /** Commentaire libre — lieu, modalités, dates secondaires, etc. */
  commentaire?: string;
  /**
   * Verrou local du champ — quand `true`, la date et le commentaire passent
   * en lecture seule jusqu'à un déverrouillage explicite. Aucune validation
   * supplémentaire (ni motif, ni confirmation) : c'est un simple toggle.
   *
   * Compatibilité ascendante : un livret persisté en v4 sans ce champ vaut
   * `undefined` ≡ déverrouillé. Pas besoin de bumper VERSION_SCHEMA.
   */
  verrouille?: boolean;
}

export interface OrganisationSuivi {
  reunionRentree: ChampOrganisationSuivi;
  entretienIndividuel: ChampOrganisationSuivi;
  accueilTuteurs: ChampOrganisationSuivi;
  visitesEntreprise: ChampOrganisationSuivi;
  restitutionActivites: ChampOrganisationSuivi;
  bilansFormation: ChampOrganisationSuivi;
  modifieLe: string;
  modifiePar: string;
}

export interface ReponsesApprentiEntretien {
  motivations?: string;
  contactEntreprise?: string;
  connaissanceEntreprise?: string;
  metierVsRepresentation?: string;
  difficultesDisciplines?: string;
  difficultesAutres?: string;
  ressenti?: string;
}

export interface ReponsesMaitreEntretien {
  dejaFormeApprenti: boolean | null;
  siOuiDiplomes?: string;
  objectifsEmbauche?: string;
  organisationAccueil?: string;
}

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
  reponsesApprenti: ReponsesApprentiEntretien;
  reponsesMaitre: ReponsesMaitreEntretien;
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
