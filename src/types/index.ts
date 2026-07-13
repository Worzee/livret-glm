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
export type Role = 'apprenti' | 'maitre' | 'formateur' | 'coordo' | 'admin' | 'responsable';

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

/**
 * Mode d'évaluation d'une formation (juillet 2026 — chantier
 * référentiels/compétences #4). Certaines formations ne se prêtent pas à une
 * évaluation « par compétences » : le tuteur évalue alors des **activités**
 * (modèle importé + mappé sur le référentiel), projetées vers les compétences
 * dans la grille « Synthèse ». Le référentiel de compétences reste impératif
 * dans les deux modes.
 *
 * Le passage en mode `activites` exige que **chaque activité du modèle fasse
 * appel à au moins une compétence évaluable** du référentiel (10 juillet 2026,
 * retour démo direction — le balayage complet n'est plus exigé ; les
 * compétences non couvertes n'apparaissent pas dans la Synthèse). La bascule
 * — dans les deux sens — est **verrouillée dès la première saisie signée**
 * dans la promo (cf. `lib/mode-evaluation`).
 */
export type ModeEvaluation = 'competences' | 'activites';

export interface Formation {
  id: string;
  intitule: string;
  /** Année académique (ex : "2025-2026"). */
  annee: string;
  niveau: string;
  referentielId: string;
  /**
   * Mode d'évaluation de la promo (juillet 2026 — chantier #4). Absent =
   * `'competences'` (comportement historique). `'activites'` exige un
   * `modeleActivitesId` dont le mapping balaie tout le référentiel.
   */
  modeEvaluation?: ModeEvaluation;
  /**
   * Modèle d'activités rattaché à la formation (cf. `ModeleActivites`,
   * `useActivitesStore`). Requis pour basculer en mode `activites`.
   */
  modeleActivitesId?: string;
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
  /**
   * Responsables légaux (13 juillet 2026 — réunion DG, demande 5) : 1 à 2
   * ids quand l'apprenti·e est inscrit·e mineur·e (obligatoire), absent ou
   * vide sinon. La minorité effective se recalcule à la date du jour
   * (`lib/minorite`) — les ids restent après la majorité (historique).
   */
  responsableLegalIds?: string[];
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

/**
 * Responsable légal d'un·e apprenti·e MINEUR·E (13 juillet 2026 — réunion DG,
 * demande 5). Saisi à l'inscription (manuelle ou import Excel) quand
 * l'apprenti·e est mineur·e : 1 obligatoire, 2 maximum, emails différents de
 * celui de l'apprenti·e. Une même personne (même email) peut couvrir
 * plusieurs apprenti·e·s (fratrie) — la relation est portée par
 * `Apprenti.responsableLegalIds`.
 *
 * Droits (tant que l'apprenti·e est mineur·e — recalcul à la date du jour,
 * cf. `lib/minorite`) : ATTESTE les documents administratifs en lieu et place
 * du mineur, signe le slot optionnel « représentant légal » de l'entretien
 * tripartite, et consulte tout le reste du livret en LECTURE SEULE.
 * À terme (étape 2) : ces données créeront les comptes des responsables.
 */
export interface ResponsableLegal extends Utilisateur {
  role: 'responsable';
  /** Lien de parenté (ex. « Mère », « Père », « Tuteur légal ») — optionnel. */
  lienParente?: string;
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
   * Compétence **exclue de l'évaluation** (juillet 2026 — limite du nombre de
   * lignes évaluables par référentiel, cf. `lib/limite-referentiel`).
   * Conservée dans le référentiel pour garder la trace du fichier officiel ;
   * réactivable depuis la page Référentiels tant que le total évaluable reste
   * sous le seuil. Absente/`false` = évaluable (comportement historique).
   * Les vues d'évaluation (grilles, fiches, sélection entreprise, PDF)
   * consomment le référentiel filtré via `referentielEvaluable`.
   */
  exclue?: boolean;
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
// 7.2 bis — Modèles d'activités (juillet 2026 — chantier #4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une activité professionnelle d'un modèle d'activités (mode d'évaluation
 * `activites`). Évaluée par le tuteur sur les fiches de période entreprise
 * (même échelle 4 niveaux que les compétences), puis **projetée** vers les
 * compétences qu'elle couvre dans la grille « Synthèse »
 * (cf. `lib/projection-activites`).
 */
export interface Activite {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  /**
   * Mapping activité → compétences couvertes (ids de compétences-feuilles du
   * référentiel du modèle). Renseigné **dans l'UI post-import** par le
   * coordo / admin (arbitrage pilote #4 — le fichier importé ne contient que
   * les activités). Vide tant que l'activité n'est pas mappée.
   */
  competenceIds: string[];
}

/**
 * Modèle d'activités d'une formation (juillet 2026 — chantier #4). Importé
 * depuis un fichier CSV/XLSX (activités seules : code, libellé, description),
 * puis mappé activité par activité sur le référentiel dans l'UI. Le passage
 * de la formation en mode `activites` exige que **chaque activité soit mappée
 * sur au moins une compétence évaluable** (10 juillet 2026 — la couverture
 * complète du référentiel n'est plus exigée ; cf. `lib/balayage-referentiel`).
 */
export interface ModeleActivites {
  id: string;
  /** Nom du modèle (visible dans l'admin, ex : « Activités CAP Cuisine »). */
  nom: string;
  /**
   * Référentiel sur lequel porte le mapping — celui de la formation cible au
   * moment de l'import. Le rattachement à une formation exige la concordance
   * (`Formation.referentielId === ModeleActivites.referentielId`).
   */
  referentielId: string;
  activites: Activite[];
  /** Indication de la source d'origine, utile en debug et dans l'admin. */
  source?: 'fixture' | 'import-csv' | 'import-xlsx';
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
   * Réponses à la trame officielle (« première visite », refonte GRETA
   * juin 2026), indexées par id de question de `TRAME_ENTRETIEN`.
   * (Juillet 2026 : l'évaluation des attitudes professionnelles a quitté
   * l'entretien — elle se fait désormais sur chaque fiche de période
   * entreprise ; l'entretien conserve le CHOIX des attitudes.)
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
 * attendus (entreprise : apprenti·e + maître ; centre : apprenti·e +
 * formateur) et le contenu (juillet 2026 — entreprise : tableau de
 * compétences + attitudes + observations ; centre : observations seules).
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
  /**
   * Activité du modèle évaluée sur la période (juillet 2026 — chantier #4,
   * formations en mode `activites`). Exclusif de `competenceId` : une ligne
   * porte SOIT une compétence (mode compétences), SOIT une activité (mode
   * activités), soit ni l'un ni l'autre (`libelleLibre` — ligne ad hoc,
   * autorisée dans les deux modes ; en mode activités elle n'est PAS projetée
   * vers la Synthèse faute de mapping).
   */
  activiteId?: string;
  libelleLibre?: string; // si hors référentiel
  /**
   * Évaluation par le maître / tuteur. `'non-fait'` signale une compétence
   * non abordée pendant la période — ignorée par la synthèse last-write-wins
   * de la grille « Synthèse » qui n'utilise que les 3 vrais niveaux.
   * (Juillet 2026 : `evaluationGreta` a été supprimée avec le tableau de
   * compétences des fiches centre — les lignes de suivi n'existent plus
   * qu'en entreprise.)
   */
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
  /**
   * Lignes de suivi des compétences — **fiches entreprise uniquement**
   * (juillet 2026 : les fiches centre n'ont plus de tableau de compétences,
   * seules restent les observations de fin de période — le tableau reste
   * vide `[]` sur les fiches centre).
   */
  suiviEntreprise: LigneSuiviEntreprise[];
  /**
   * Évaluations des attitudes professionnelles retenues pour le livret,
   * par le maître / tuteur, **à chaque période en entreprise** (juillet
   * 2026 — l'évaluation quitte l'entretien tripartite). Indexées par
   * `attitudeId` du catalogue global. Entrée manquante ou `null` = non
   * évaluée. R20 : TOUTES les attitudes retenues doivent être évaluées
   * pour que le maître signe la fiche. Absent sur les fiches centre.
   */
  evaluationsAttitudes?: EvaluationsAttitudes;
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

/**
 * Ligne de la grille de synthèse des compétences (menu « Synthèse »,
 * anciennement « Évaluation finale » — juillet 2026). Une seule colonne
 * subsiste : « Acquis en entreprise » (la colonne centre a disparu avec le
 * tableau de compétences des fiches centre). La grille ne présente que les
 * compétences de la sélection entreprise.
 */
export interface LigneEvaluationFinaleCompetence {
  competenceId: string;
  acquisEntreprise: NiveauMaitrise | null;
  commentaire?: string;
}

export interface EvaluationFinaleCompetences {
  lignes: LigneEvaluationFinaleCompetence[];
  modifieLe: string;
}

/**
 * Évaluations des attitudes professionnelles (échelle ++/+/-/--), indexées
 * par `attitudeId` du catalogue global (`useAttitudesStore`). Une entrée
 * manquante ou `null` = non évaluée. Juillet 2026 : portées par **chaque
 * fiche de période entreprise** (`FicheSuiviPeriode.evaluationsAttitudes`,
 * saisies par le maître / tuteur) — l'onglet « Attitudes » de la Synthèse
 * en est une agrégation last-write-wins en lecture seule.
 */
export type EvaluationsAttitudes = Record<string, NiveauAppreciation | null>;

/**
 * Ids des attitudes professionnelles retenues pour un livret (13 juin 2026).
 * Le choix se fait **lors de l'entretien tripartite** (maître / tuteur +
 * formateur référent), se fige à sa 3ᵉ signature (pattern sélection des
 * compétences), puis ces attitudes sont évaluées par le maître **à chaque
 * période en entreprise** (juillet 2026). Vide tant que le choix n'a pas
 * été fait.
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

/**
 * Sélection des **activités prévues en entreprise** pour un livret dont la
 * formation est en mode `activites` (juillet 2026 — chantier #4, arbitrage
 * pilote Q4). Miroir exact de `SelectionCompetencesEntreprise` : tout coché
 * par défaut (toutes les activités du modèle), le maître / tuteur décoche,
 * validée à la 3ᵉ signature de l'entretien tripartite, invalidation R10
 * motivée pour rouvrir. La grille « Synthèse » se restreint aux compétences
 * couvertes par les activités retenues.
 *
 * Les `ids` référencent des `Activite.id` du modèle de la formation.
 */
export type SelectionActivitesEntreprise = SelectionCompetencesEntreprise;

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
   * Fiches des **périodes en centre de formation** (17 juin 2026, simplifiées
   * en juillet 2026) — héritées du planning `Formation.periodesCentre`. Mêmes
   * règles de cycle de vie que l'entreprise (séquencement, déverrouillage R10) ;
   * côté contenu, il ne reste que les **observations de fin de période**
   * (apprenti·e : bloquante pour sa signature ; formateur : non bloquante) —
   * plus aucune évaluation de compétence ni retour apprenti. Signatures :
   * formateur + apprenti·e (le maître / tuteur n'est pas concerné).
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
   * Sélection des activités prévues en entreprise (juillet 2026 — chantier
   * #4, mode `activites` uniquement ; cf. `SelectionActivitesEntreprise`).
   * Toujours présent (init vide à la création) — repeuplée « tout coché »
   * depuis le modèle quand la formation passe en mode activités.
   */
  selectionActivitesEntreprise: SelectionActivitesEntreprise;
  /**
   * Attitudes professionnelles retenues pour ce livret (13 juin 2026) —
   * choisies à l'entretien tripartite (maître + formateur), figées à sa
   * 3ᵉ signature, puis évaluées par le maître. Cf. `AttitudesSelectionnees`.
   */
  attitudesSelectionnees: AttitudesSelectionnees;
  /**
   * Points d'alerte de l'entretien tripartite (réponses signalant une
   * difficulté — cf. `pointsAlerteTrame`) que la coordination a marqués
   * « traités » (8 juillet 2026, demande pilote). Liste des **ids de questions
   * de la trame** déjà pris en charge ; les points d'alerte restants remontent
   * dans « À traiter » du tableau de bord coordo / admin. Ce suivi vit **hors
   * de `entretien`** — l'entretien lui-même reste strictement inchangé.
   * Optionnel : absent = aucun point traité.
   */
  pointsAlerteTraites?: string[];
  /** R22 — null tant que le livret n'a pas été clôturé. */
  cloture: ClotureLivret | null;
  creeLe: string;
  modifieLe: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents administratifs (10 juillet 2026 — demande direction ;
// v2 le 13 juillet 2026 — réunion DG : typologie + attestation sans signature)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Typologie des documents administratifs (13 juillet 2026 — réunion DG).
 * Les 4 premiers types sont OBLIGATOIRES pour chaque apprenti·e (anomalie
 * dans le centre d'alertes coordo/admin tant qu'ils ne sont pas déposés puis
 * attestés) ; `autre` couvre les dépôts hors typologie (titre libre, seul
 * type qui accepte le flag « réservé à l'apprenti·e »).
 */
export type TypeDocumentAdministratif =
  | 'contrat-pedagogique'
  | 'protection-donnees'
  | 'droit-image'
  | 'reglement-interieur'
  | 'autre';

/**
 * Attestation de prise de connaissance d'un document par l'apprenti·e
 * (13 juillet 2026 — réunion DG : simple confirmation horodatée, esprit R19,
 * SANS signature manuscrite). Sans retrait possible (esprit R21) ; possible
 * uniquement après consultation du document (`consulteParApprentiLe`).
 */
export interface AttestationLecture {
  attestee: boolean;
  /** Horodatage ISO 8601 de l'attestation. */
  dateAttestation?: string;
  /**
   * Auteur·rice de l'attestation (13 juillet 2026 — demande 5) : l'apprenti·e
   * majeur·e, ou un responsable légal en lieu et place d'un·e mineur·e.
   * Absent sur les attestations antérieures (fixtures incluses) — l'UI
   * affiche alors le libellé historique « par l'apprenti·e ».
   */
  attesteParId?: string;
  attesteParNom?: string;
  attesteParRole?: Role;
}

/**
 * Document administratif NOMINATIF d'un·e apprenti·e (partie 1 du livret
 * papier), déposé par la coordination (coordo / admin) sous un type de la
 * typologie ; l'apprenti·e atteste en avoir pris connaissance après lecture
 * (attestation simple horodatée, rappelée dans le PDF de synthèse).
 *
 * Un seul document actif par type obligatoire : redéposer le même type
 * REMPLACE l'ancien document et remet l'attestation à zéro (arbitrage
 * 2026-07-13).
 *
 * Visibilité : tous les rôles ayant accès au livret, SAUF si `reserveApprenti`
 * (type « autre » uniquement) — le document n'est alors consultable que par
 * l'apprenti·e, le coordo et l'admin (maître / tuteur et formateur exclus —
 * cf. `lib/documents-administratifs`).
 *
 * ⚠ Maquette (étape 1) : le fichier vit en data-URL dans le localStorage
 * (taille plafonnée à l'import). En étape 2, le binaire part sur **Nuage**
 * (Nextcloud apps.education.fr) via WebDAV et `dataUrl` devient une référence
 * — cf. STACK_GRETA_LYON.md §3.4 et TODO-etape-2.md.
 */
export interface DocumentAdministratif {
  id: string;
  /** Apprenti·e concerné·e — le document est nominatif. */
  apprentiId: string;
  /** Type du document — détermine le libellé affiché (hors « autre »). */
  type: TypeDocumentAdministratif;
  /**
   * Titre lisible, saisi uniquement pour le type « autre » (les 4 types
   * obligatoires tirent leur libellé de la typologie — `libelleDocument`).
   */
  titre?: string;
  nomFichier: string;
  /** Type MIME du fichier (PDF ou image — cf. `TYPES_DOCUMENT_AUTORISES`). */
  mimeType: string;
  /** Taille du fichier en octets (plafonnée à l'import). */
  taille: number;
  /** Contenu du fichier en data-URL (maquette — étape 2 : référence Nuage). */
  dataUrl: string;
  /** Consultation restreinte à l'apprenti·e + coordo + admin (« autre » seul). */
  reserveApprenti: boolean;
  deposeParId: string;
  deposeParNom: string;
  deposeParRole: Role;
  /** Horodatage ISO 8601 du dépôt. */
  deposeLe: string;
  /**
   * Horodatage ISO 8601 de la PREMIÈRE consultation du document par
   * l'apprenti·e — prérequis de l'attestation (« lu et attesté »,
   * 13 juillet 2026). `undefined` tant que l'apprenti·e n'a pas ouvert le
   * fichier.
   */
  consulteParApprentiLe?: string;
  /**
   * Attestation de prise de connaissance par l'apprenti·e — confirmation
   * horodatée sans signature manuscrite (13 juillet 2026), sans retrait
   * possible. `attestee: false` tant que l'apprenti·e n'a pas attesté.
   */
  attestation: AttestationLecture;
}

/**
 * Document administratif déposé AU NIVEAU FORMATION (13 juillet 2026 —
 * réunion DG, demande 4) : stocké une seule fois, visible de tous les
 * apprenti·e·s actuels et futurs de la formation (dépôt en masse — ex.
 * règlement intérieur). Tous les types SAUF « contrat-pedagogique »
 * (nominatif par nature) ; jamais « réservé » (document générique).
 *
 * Chaque apprenti·e consulte puis atteste individuellement : les lectures et
 * attestations sont portées par le document, indexées par `apprentiId`.
 * Un document nominatif du même type PRIME sur le document de formation pour
 * l'apprenti·e concerné·e (cf. `lib/documents-administratifs`,
 * `documentsEffectifsApprenti`). Redéposer le même type pour la formation
 * REMPLACE le document (toutes les attestations repartent de zéro) ;
 * suppression verrouillée dès la première attestation (esprit R21).
 */
export interface DocumentFormation {
  id: string;
  /** Formation concernée — le document vaut pour toute la promo. */
  formationId: string;
  /** Type du document — jamais `contrat-pedagogique` (nominatif par nature). */
  type: TypeDocumentAdministratif;
  /** Titre lisible, saisi uniquement pour le type « autre ». */
  titre?: string;
  nomFichier: string;
  mimeType: string;
  taille: number;
  /** Contenu du fichier en data-URL (maquette — étape 2 : référence Nuage). */
  dataUrl: string;
  deposeParId: string;
  deposeParNom: string;
  deposeParRole: Role;
  /** Horodatage ISO 8601 du dépôt. */
  deposeLe: string;
  /**
   * Première consultation du document par chaque apprenti·e (« lu et
   * attesté ») — clé : id de l'apprenti·e, valeur : horodatage ISO 8601.
   */
  consultations: Record<string, string>;
  /** Attestations individuelles — clé : id de l'apprenti·e. */
  attestations: Record<string, AttestationLecture>;
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
