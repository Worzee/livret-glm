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

/**
 * Établissement (lieu de formation).
 * Référence : refonte mai 2026.
 *
 * Anciennement, chaque `Formation` portait son `lieu: Lieu` inline. Avec la
 * refonte Pronote/établissements, les lieux deviennent des entités à part
 * entière, gérés en CRUD par l'administrateur·rice uniquement. Chaque
 * établissement peut porter une `urlPronote` (le portail Pronote du lieu).
 *
 * La `Formation` référence désormais un établissement par id (`lieuId`).
 */
export interface Etablissement {
  id: string;
  /** Libellé court affiché dans les listes (ex : "GRETA Lyon Métropole — Site Diderot"). */
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  /** URL absolue du portail Pronote du lieu (https://…). Optionnelle. */
  urlPronote?: string;
}

/**
 * Une période d'alternance définie au niveau de la formation (refonte
 * mai 2026 — chantier #1).
 *
 * Le planning des périodes est désormais commun à tous les apprenti·e·s
 * d'une même promo et géré par le coordo / admin. Chaque période ici
 * matérialise UNE fiche de suivi dans chaque livret de la promo (créée
 * automatiquement à la sauvegarde du planning).
 */
export interface PeriodeFormation {
  id: string;
  /** Rang chronologique 1-based — calculé à l'ajout, modifiable via réordonnancement. */
  numero: number;
  /** Titre libre optionnel (ex : « Période d'automne »). */
  titre?: string;
  /** Date de début (ISO 8601 YYYY-MM-DD). */
  dateDebut: string;
  /** Date de fin (ISO 8601 YYYY-MM-DD). */
  dateFin: string;
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
  /** Id de l'établissement où se déroule la formation (cf. `Etablissement`). */
  lieuId: string;
  /**
   * Planning des périodes d'alternance — commun à tous les apprenti·e·s
   * de la promo. Géré par le coordo / admin uniquement (chantier mai 2026).
   * Chaque période génère une fiche dans le livret de chaque apprenti·e
   * (cf. `FicheSuiviPeriode.periodeFormationId`).
   */
  periodes: PeriodeFormation[];
  /**
   * Planning des **périodes en centre de formation** (17 juin 2026) — miroir
   * de `periodes` (entreprise). Indépendant (dates, nombre). Chaque période
   * génère une fiche dans `Livret.fichesSuiviCentre` ; les compétences y sont
   * évaluées par le formateur référent (cf. `FicheSuiviPeriode`).
   */
  periodesCentre: PeriodeFormation[];
}

export interface Entreprise {
  id: string;
  raisonSociale: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

/**
 * Affectation datée d'un·e apprenti·e à une entreprise (juin 2026). L'historique
 * de ces affectations permet de tracer un changement d'entreprise en cours de
 * contrat. La dernière entrée correspond à l'entreprise actuelle
 * (`Apprenti.entrepriseId`).
 */
export interface AffectationEntreprise {
  id: string;
  entrepriseId: string;
  /** Date ISO de prise d'effet de l'affectation. */
  dateIso: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: Role;
}

export interface Apprenti extends Utilisateur {
  role: 'apprenti';
  dateNaissance: string;
  formationId: string;
  entrepriseId: string;
  /**
   * Historique daté des affectations d'entreprise (juin 2026). Toujours non
   * vide après création : la 1ʳᵉ entrée est l'affectation initiale, chaque
   * changement d'`entrepriseId` en ajoute une. Optionnel pour la rétrocompat
   * des données persistées avant le bump v5 (reset aux fixtures).
   */
  historiqueEntreprises?: AffectationEntreprise[];
  /** Maître / tuteur principal — affiché dans les en-têtes et le PDF. */
  maitreApprentissageId: string;
  /**
   * Second maître / tuteur optionnel (retours coordos juin 2026) — mêmes
   * droits d'accès et d'édition que le principal, slot de signature
   * « Maître / Tuteur » partagé. Peut être d'une autre entreprise.
   */
  maitreApprentissageSecondId?: string;
  formateurReferentId: string;
  /**
   * Coordinateur·rice pédagogique en charge de l'apprenti·e (juin 2026).
   * Affecté·e par l'admin (gestion des affectations) — chaque coordo ne voit
   * que les apprenti·e·s de son périmètre, l'admin voit tout. `undefined` :
   * apprenti·e non réparti·e, visible de l'admin seul (côté coordo).
   */
  coordoId?: string;
  contratDebut: string;
  contratFin: string;
}

export interface Maitre extends Utilisateur {
  role: 'maitre';
  /** Nom commercial de l'entreprise dans laquelle le maître exerce (texte libre). */
  entreprise: string;
  /** Fonction du maître dans l'entreprise (ex. « Chef de cuisine », « Responsable de salle »). */
  fonction: string;
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

/**
 * Attitude professionnelle — catalogue global géré par l'admin (retours
 * coordos juin 2026, page `/admin/attitudes`). Évaluées par le maître /
 * tuteur lors de l'entretien tripartite. Anciennement portées par le
 * référentiel de compétences.
 */
export interface AttitudeProfessionnelle {
  id: string;
  libelle: string;
  description?: string;
}

export interface Referentiel {
  id: string;
  formation: string;
  blocs: BlocCompetences[];
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
  /**
   * Signature manuscrite tactile (doigt / stylet / souris) — PNG en
   * data-URL, capturé à la confirmation (juin 2026, CDC v1.5 §14.C).
   * Absent sur les signatures antérieures au chantier (fixtures incluses) :
   * l'UI affiche alors le « ✓ Signé » historique. Image statique uniquement
   * (pas de dynamique du tracé — RGPD art. 9).
   */
  trace?: string;
}

export interface SignaturesTripartite {
  apprenti: SignaturePartie;
  maitre: SignaturePartie;
  formateur: SignaturePartie;
  /**
   * Représentant légal de l'apprenti·e (mineur·e) — 4e signataire **optionnel**,
   * participe « en cas de besoin » (trame officielle de l'entretien tripartite,
   * juin 2026). N'entre PAS dans le décompte des 3 signatures obligatoires (R9,
   * séquencement des périodes…). `undefined` pour les fiches de période.
   */
  representantLegal?: SignaturePartie;
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
  /**
   * L'entretien tripartite — unique et obligatoire (juillet 2026 : les
   * entretiens 2 à 4 ont été supprimés, le suivi ultérieur passe par les
   * fiches de suivi). Typiquement dans les 2 mois suivant la signature du
   * contrat — cf. R7. La création de cet événement donne accès à l'ouverture
   * de l'entretien via le bouton « Ouvrir cet entretien » sur la carte.
   */
  | 'entretien-tripartite'
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
 * Réponse à une question de la trame de l'entretien tripartite.
 *  - texte  → string
 *  - oui-non → boolean | null (null = pas répondu)
 * (Juillet 2026 : la banque de questions qui servait les entretiens 2 à 4 a
 * été supprimée avec eux — l'entretien unique repose sur la trame officielle
 * GRETA, cf. `src/lib/trame-entretien.ts`.)
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

export interface CommentairesEntretien {
  apprenti?: string;
  maitre?: string;
  formateur?: string;
}

/**
 * L'entretien tripartite — unique et obligatoire (juillet 2026 : les
 * entretiens 2 à 4 ont été supprimés, le suivi ultérieur passe par les
 * fiches de suivi). Repose sur la trame officielle GRETA « première
 * visite » (cf. `src/lib/trame-entretien.ts`), co-saisie par le formateur
 * référent et le maître pendant l'entretien.
 */
export interface EntretienTripartite {
  dateEntretien?: string;
  /**
   * Évaluations des attitudes professionnelles par le maître / tuteur
   * (retours coordos juin 2026). Au moins une évaluation est exigée pour
   * que le maître signe (extension R20).
   */
  evaluationsAttitudes: EvaluationsAttitudes;
  /**
   * Réponses à la trame officielle (« première visite », refonte GRETA
   * juin 2026), indexées par id de question de `TRAME_ENTRETIEN`.
   */
  reponsesTrame: ReponsesEntretien;
  appreciationMaitre: AppreciationMaitre;
  commentaires: CommentairesEntretien;
  signatures: SignaturesTripartite;
}

export type EtatFiche = 'brouillon' | 'en-cours' | 'signee' | 'verrouillee';

/**
 * Lieu d'une fiche de suivi par période (17 juin 2026). Détermine la
 * collection du livret (`fichesSuivi` vs `fichesSuiviCentre`), les signataires
 * attendus (entreprise : apprenti·e + maître + formateur ; centre :
 * apprenti·e + formateur) et la colonne d'évaluation éditée
 * (`evaluationEntreprise` vs `evaluationGreta`).
 *
 * Convention transverse : les helpers de logique et les mutations du store
 * prennent `lieu` en paramètre **optionnel, défaut `'entreprise'`** — les
 * appels historiques (entreprise) restent inchangés ; le centre passe
 * explicitement `'centre'`.
 */
export type LieuFiche = 'entreprise' | 'centre';

/**
 * Forçage de l'affichage des périodes par la coordination (18 juin 2026).
 * Quand un lieu est à `true`, **toutes** les périodes de ce lieu sont visibles
 * par **tous les rôles** (apprenti·e, tuteur, formateur), court-circuitant le
 * séquencement de signature. Décidé par le coordo / admin au cas par cas
 * (retard de signature, etc.). Absent / `false` : séquencement normal.
 */
export interface AffichagePeriodesForce {
  entreprise?: boolean;
  centre?: boolean;
}

/**
 * Suivi de la formation au GRETA CFA pour une période donnée.
 *
 * Refonte mai 2026 : ancien tableau `LigneSuiviGreta[]` remplacé par 2 zones
 * de texte libre, l'une renseignée par l'apprenti·e (ce qu'il/elle retient
 * de la période en centre), l'autre par le formateur référent (contenus
 * abordés, points d'attention). R20 formateur exige désormais que `formateur`
 * soit non vide ; le champ `apprenti` reste optionnel pour la signature
 * (pas de fardeau supplémentaire côté apprenti·e).
 */
export interface SuiviGretaCfa {
  apprenti?: string;
  formateur?: string;
  /** Horodatage ISO 8601 de la dernière modification (pour debug/audit). */
  modifieLe?: string;
}

export interface LigneSuiviEntreprise {
  id: string;
  competenceId: string | null; // null si activité ad hoc
  libelleLibre?: string; // si hors référentiel
  /**
   * Évaluation côté CFA. Accepte les 4 niveaux entreprise (incl. `'non-fait'`)
   * pour signaler une compétence non abordée pendant la période côté centre,
   * par symétrie avec l'évaluation entreprise. La grille finale n'utilise
   * que les 3 vrais niveaux (`NiveauMaitrise`) — `'non-fait'` est ignoré au
   * niveau de la synthèse last-write-wins.
   */
  evaluationGreta: NiveauMaitriseEntreprise | null;
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
   * ou absent, l'UI affiche « Période N » seul.
   *
   * Refonte mai 2026 (chantier #1) : ce champ est désormais propagé depuis
   * `PeriodeFormation.titre` au niveau de la formation — il n'est plus
   * édité par fiche individuellement.
   */
  titre?: string;
  /**
   * Référence vers la période parente définie sur la formation. Présent
   * pour toutes les fiches créées via le planning de formation. `undefined`
   * uniquement pour les fixtures héritées de l'ancienne maquette
   * (compatibilité — toléré le temps de la transition).
   */
  periodeFormationId?: string;
  dateDebut: string;
  dateFin: string;
  suiviGretaCfa: SuiviGretaCfa;
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

/**
 * Évaluations des attitudes professionnelles d'un entretien tripartite
 * (retours coordos juin 2026) : les attitudes sont évaluées par le
 * **maître / tuteur** lors de l'entretien tripartite (échelle ++/+/-/--),
 * indexées par `attitudeId` du catalogue global (`useAttitudesStore`). Une
 * entrée manquante ou `null` = non évaluée. L'onglet « Attitudes » de
 * l'évaluation finale est une synthèse en lecture seule de ces évaluations.
 */
export type EvaluationsAttitudes = Record<string, NiveauAppreciation | null>;

/**
 * Ids des attitudes professionnelles retenues pour un livret (13 juin 2026).
 * Le choix se fait **lors de l'entretien tripartite** (maître / tuteur +
 * formateur référent), se fige à sa 3ᵉ signature (pattern sélection des
 * compétences), puis ces attitudes y sont évaluées par le maître.
 * Vide tant que le choix n'a pas été fait.
 */
export type AttitudesSelectionnees = string[];

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

/**
 * Sélection des compétences abordées en entreprise pour un livret donné
 * (CDC v1.5 addendum — mai 2026).
 *
 * Décision conjointe formateur référent + maître d'apprentissage, validée à
 * la 3ᵉ signature de l'entretien tripartite. La sélection figée détermine :
 *   - les compétences proposées par le sélecteur de `TableauTriColonnes`
 *   - les compétences évaluables sur la colonne « Acquis en entreprise »
 *     de `GrilleCompetences` (grille finale)
 *
 * Réversibilité : une fois validée, la sélection n'est modifiable qu'au prix
 * d'un acte explicite (R10 — déverrouillage motivé par le formateur).
 *
 * Le sous-objet est toujours présent dans `Livret` (init vide à la création).
 * `validePar` reste `undefined` tant que les 3 signatures de l'entretien ne
 * sont pas apposées.
 */
export interface SelectionCompetencesEntreprise {
  /** IDs des compétences sélectionnées (sous-ensemble du référentiel du livret). */
  ids: string[];
  /**
   * Trace de validation conjointe. `undefined` tant que les 3 signatures de
   * l'entretien tripartite ne sont pas apposées. Auto-rempli par
   * `signerEntretien` quand la 3ᵉ signature tombe.
   */
  validePar?: {
    formateurId: string;
    maitreId: string;
    /** Horodatage ISO 8601 du moment de validation (3ᵉ signature). */
    dateIso: string;
  };
  modifieLe: string;
  /**
   * Historique des invalidations R10 — mêmes structure et sémantique que
   * `FicheSuiviPeriode.historiqueDeverrouillages`. Empilé chronologiquement
   * (le plus récent en dernier).
   */
  historiqueInvalidations: EntreeDeverrouillage[];
}

export interface Livret {
  id: string;
  apprentiId: string;
  formationId: string;
  organisationSuivi: OrganisationSuivi;
  /**
   * L'entretien tripartite — unique et obligatoire (juillet 2026 : les
   * entretiens 2 à 4 ont été supprimés, le suivi ultérieur passe par les
   * fiches de suivi). Généré via un événement de motif `entretien-tripartite`
   * dans l'organisation du suivi. Signature des 3 parties → fige la sélection
   * des compétences abordées en entreprise (auto-marquage cf. CDC v1.5 §12) ;
   * R7 : alerte > 60 j après le début du contrat. `null` tant que non
   * initialisé.
   */
  entretien: EntretienTripartite | null;
  fichesSuivi: FicheSuiviPeriode[];
  /**
   * Fiches des **périodes en centre de formation** (17 juin 2026) — miroir de
   * `fichesSuivi` (entreprise), héritées du planning `Formation.periodesCentre`.
   * Mêmes structure et règles (séquencement, déverrouillage) ; côté contenu,
   * les compétences sont évaluées par le formateur (`evaluationGreta` de chaque
   * ligne) et l'apprenti·e renseigne son retour. Signatures : formateur +
   * apprenti·e (le maître / tuteur n'est pas concerné par le centre).
   */
  fichesSuiviCentre: FicheSuiviPeriode[];
  /**
   * Forçage de l'affichage des périodes par la coordination (18 juin 2026) —
   * cf. `AffichagePeriodesForce`. Optionnel : absent = séquencement normal.
   */
  affichagePeriodesForce?: AffichagePeriodesForce;
  evaluationFinaleCompetences: EvaluationFinaleCompetences;
  /** Sélection des compétences abordées en entreprise (cf. SelectionCompetencesEntreprise). */
  selectionCompetencesEntreprise: SelectionCompetencesEntreprise;
  /**
   * Attitudes professionnelles retenues pour ce livret (13 juin 2026) —
   * choisies à l'entretien tripartite (maître + formateur), figées à sa
   * 3ᵉ signature, puis évaluées par le maître. Cf. `AttitudesSelectionnees`.
   */
  attitudesSelectionnees: AttitudesSelectionnees;
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
