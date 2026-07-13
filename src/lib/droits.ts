import type { Role } from '@/types';

/**
 * Matrice des droits d'édition par rôle et par ressource.
 * Référence : cahier des charges v1.3, section 6.
 *
 * Cette fonction est l'UNIQUE source de vérité pour déterminer
 * si un rôle peut éditer un champ donné. NE PAS dupliquer cette
 * logique ailleurs dans le code (cf. CDC §16.10).
 */

/**
 * Liste exhaustive des ressources éditables du livret.
 * Une ressource = un champ ou groupe de champs ayant la même règle de droits.
 */
export type Ressource =
  // Module organisation du suivi (CDC §5.1). Retours coordos juin 2026 :
  // la gestion des événements (création / modification) est ouverte au coordo
  // en plus du formateur référent — c'est de l'organisation calendaire, pas
  // du contenu pédagogique.
  | 'organisation-suivi'
  /**
   * Suppression d'un événement de la page « Fiches de suivi » — réservée au
   * coordo et à l'admin (15 juin 2026). Le formateur référent crée et modifie
   * les événements mais ne peut pas les supprimer : acte destructif réservé à
   * la gouvernance (coordo / admin).
   */
  | 'organisation-suivi.supprimer'
  // Entretien tripartite (CDC §5.2)
  /**
   * Gestion de l'entretien : initialisation (bouton « Initialiser
   * l'entretien ») et date de l'entretien. Ouverte au formateur référent
   * ainsi qu'au coordo et à l'admin (18 juin 2026 — la coordination peut
   * amorcer un entretien quand le formateur tarde). La conduite pédagogique
   * (saisie des sections, signatures) reste réservée aux rôles métier.
   */
  | 'entretien.gestion'
  /**
   * Choix des attitudes retenues pour le livret, fait lors de l'entretien
   * (13 juin 2026) — décision collective actée par le maître / tuteur ET le
   * formateur référent ; figée à la 3ᵉ signature de l'entretien.
   * (Juillet 2026 : l'ÉVALUATION des attitudes a quitté l'entretien — cf.
   * `fiche.attitudes`.)
   */
  | 'entretien.attitudes-selection'
  | 'entretien.appreciation-maitre'
  | 'entretien.commentaires-apprenti'
  | 'entretien.commentaires-maitre'
  | 'entretien.commentaires-formateur'
  | 'entretien.signature-apprenti'
  | 'entretien.signature-maitre'
  | 'entretien.signature-formateur'
  /**
   * Saisie de la **trame officielle de l'entretien** (« première visite »,
   * refonte GRETA juin 2026) : questions conjointes par rubriques + grille
   * d'appréciation + commentaires. Co-saisie pendant l'entretien par le
   * formateur référent et le maître / tuteur ; l'apprenti·e consulte.
   */
  | 'entretien.trame'
  /**
   * Signature du représentant légal (apprenti·e mineur·e) à l'entretien —
   * apposée par le formateur référent qui conduit l'entretien (le représentant
   * légal n'est pas un rôle de l'application). Optionnelle, hors décompte R9.
   */
  | 'entretien.signature-representant-legal'
  /**
   * Sélection des compétences abordées en entreprise — toutes activées par
   * défaut, le **maître / tuteur seul** décoche celles non abordées
   * (13 juin 2026). Validée à la 3ᵉ signature de l'entretien (W1, cf. CDC
   * v1.5 addendum). L'invalidation R10 reste réservée au formateur référent
   * via `fiche.deverrouiller`.
   */
  | 'entretien.selection-competences-entreprise'
  // Fiche de suivi par période (CDC §5.3)
  /**
   * Zone de texte du suivi GRETA CFA renseignée par l'apprenti·e
   * (ce qu'il/elle retient de la période en centre).
   */
  | 'fiche.suivi-greta-cfa-apprenti'
  /**
   * Zone de texte du suivi GRETA CFA renseignée par le formateur référent
   * (contenus abordés, points d'attention pédagogiques).
   */
  | 'fiche.suivi-greta-cfa-formateur'
  | 'fiche.evaluation-entreprise' // colonne entreprise
  /**
   * Évaluation des ACTIVITÉS sur les fiches de période entreprise des
   * formations en mode activités (juillet 2026 — chantier #4). Miroir de
   * `fiche.evaluation-entreprise` : le maître / tuteur seul évalue.
   */
  | 'fiche.activites'
  /**
   * Évaluation des attitudes professionnelles retenues, sur chaque fiche de
   * période ENTREPRISE (juillet 2026 — l'évaluation quitte l'entretien
   * tripartite). Réservée au maître / tuteur, comme la colonne entreprise.
   */
  | 'fiche.attitudes'
  /**
   * Ajout / retrait d'une compétence à évaluer sur une fiche de période
   * (sélection des compétences travaillées pendant le stage). Ouvert au
   * formateur référent ET au maître / tuteur (17 juin 2026 : le tuteur, qui
   * encadre en entreprise, choisit les compétences abordées sur la période).
   */
  | 'fiche.ajouter-competence'
  | 'fiche.retour-apprenti'
  | 'fiche.observation-apprenti'
  | 'fiche.observation-maitre'
  | 'fiche.observation-formateur'
  | 'fiche.signature-apprenti'
  | 'fiche.signature-maitre'
  | 'fiche.signature-formateur'
  // Refonte mai 2026 (chantier #1) : la création/modification/suppression
  // d'une période passe désormais par le planning de la formation
  // (`admin.formations.modifier`) ; plus de gestion individuelle par fiche.
  | 'fiche.deverrouiller' // R10
  // Grille de synthèse des compétences (menu « Synthèse », CDC §5.4-5.5).
  // Juillet 2026 : la colonne centre a disparu avec le tableau de compétences
  // des fiches centre — seule reste la colonne entreprise. L'onglet
  // « Attitudes » reste une synthèse en lecture seule (évaluations portées
  // par les fiches de période entreprise, cf. `fiche.attitudes`).
  | 'grille-competences.entreprise'
  // Export et opérations administratives (CDC §5.6)
  | 'export-pdf'
  // Page « Accès mobile » (3 juillet 2026) : QR code de l'application à faire
  // scanner (tuteur en visite, présentation) — réservé à l'encadrement.
  | 'acces-mobile'
  // Suivi des points d'alerte de l'entretien par la coordination : marquer
  // « traité » un point remonté dans « À traiter » (8 juillet 2026). Acte de
  // GESTION (n'écrit rien dans l'entretien ni dans les évaluations) → coordo +
  // admin, conforme à la doctrine « coordo/admin sans droit pédagogique ».
  | 'point-alerte.traiter'
  // Documents administratifs nominatifs (10 juillet 2026 — demande direction ;
  // v2 13 juillet 2026 — réunion DG) : dépôt typé / retrait / flag « réservé »
  // par la coordination ; l'ATTESTATION (confirmation horodatée de prise de
  // connaissance, après lecture) est un acte personnel de l'apprenti·e —
  // coordo/admin exclus, doctrine inchangée.
  | 'documents.gerer'
  | 'documents.attester'
  | 'cloturer-livret'
  // ── Administration (rôle coordo, hors CDC v1.3 — extension métier) ────────
  | 'admin.utilisateurs.creer-apprenti'
  | 'admin.utilisateurs.creer-maitre'
  | 'admin.utilisateurs.creer-formateur'
  | 'admin.utilisateurs.creer-coordo'
  | 'admin.utilisateurs.modifier'
  | 'admin.utilisateurs.supprimer'
  /**
   * Import par lot d'utilisateur·rice·s depuis un fichier Excel.
   * Refonte mai 2026 : page `/admin/import-utilisateurs` réservée à
   * coordo + admin (le formateur peut créer un compte à la volée via la
   * modale standard, mais pas par lot).
   */
  | 'admin.utilisateurs.import-xlsx'
  | 'admin.formations.creer'
  | 'admin.formations.modifier'
  | 'admin.formations.supprimer'
  /** Associer un·e apprenti·e à une formation, un maître, un formateur. */
  | 'admin.affectations.gerer'
  /** Importer / supprimer / éditer les référentiels de compétences. */
  | 'admin.referentiels.gerer'
  /** CRUD sur les établissements (lieux de formation, URL Pronote). */
  | 'admin.etablissements.gerer'
  /**
   * Paramètres globaux de l'application (juillet 2026) — dont le seuil de
   * lignes évaluables par référentiel. Admin uniquement (décision pilote).
   */
  | 'admin.parametres.gerer'
  /** CRUD sur les entreprises d'accueil des apprenti·e·s (juin 2026). */
  | 'admin.entreprises.gerer'
  /**
   * CRUD sur le catalogue global des attitudes professionnelles (retours
   * coordos juin 2026 — évaluées par le maître lors de l'entretien).
   */
  | 'admin.attitudes.gerer'
  /**
   * Modèles d'activités (juillet 2026 — chantier #4) : import, mapping
   * activités ↔ compétences, choix du mode d'évaluation d'une formation.
   * Ingénierie de formation, pas de contenu pédagogique — coordo + admin,
   * cohérent avec `admin.referentiels.gerer`.
   */
  | 'admin.activites.gerer';

/**
 * Matrice statique : pour chaque ressource, l'ensemble des rôles autorisés.
 * Source : tableau §6 du cahier des charges.
 */
const MATRICE: Record<Ressource, ReadonlyArray<Role>> = {
  // Organisation du suivi : formateur + coordo + admin (retours coordos
  // juin 2026 — gestion calendaire des événements, pas de contenu
  // pédagogique ; l'admin hérite comme pour les autres ressources de gestion)
  'organisation-suivi': ['formateur', 'coordo', 'admin'],
  // Suppression d'un événement : coordo + admin uniquement (15 juin 2026) —
  // le formateur référent crée / modifie mais ne supprime pas.
  'organisation-suivi.supprimer': ['coordo', 'admin'],

  // Entretien tripartite — questions/zones par rôle propriétaire
  // Initialisation + date de l'entretien : formateur + coordo + admin
  // (18 juin 2026 — la coordination peut amorcer un entretien).
  'entretien.gestion': ['formateur', 'coordo', 'admin'],
  // Champs du maître / tuteur : le formateur référent peut co-saisir
  // (1ᵉʳ juillet 2026 — réunion direction : il tient souvent le clavier en
  // séance). Les champs restent figés à la signature du MAÎTRE, et sa
  // signature reste exclusive.
  'entretien.attitudes-selection': ['maitre', 'formateur'],
  'entretien.appreciation-maitre': ['maitre', 'formateur'],
  'entretien.commentaires-apprenti': ['apprenti'],
  'entretien.commentaires-maitre': ['maitre', 'formateur'],
  'entretien.commentaires-formateur': ['formateur'],
  'entretien.signature-apprenti': ['apprenti'],
  'entretien.signature-maitre': ['maitre'],
  'entretien.signature-formateur': ['formateur'],
  // Trame officielle de l'entretien : co-saisie formateur + maître (juin 2026)
  'entretien.trame': ['formateur', 'maitre'],
  // Signature du représentant légal : le RESPONSABLE LÉGAL signe lui-même
  // (13 juillet 2026 — demande 5, identité remplie depuis son compte) ; le
  // formateur référent conserve la capacité historique (fallback en séance).
  'entretien.signature-representant-legal': ['formateur', 'responsable'],
  // Sélection des compétences abordées en entreprise : maître / tuteur +
  // formateur référent décochent (1ᵉʳ juillet 2026 — tout est coché par défaut).
  'entretien.selection-competences-entreprise': ['maitre', 'formateur'],

  // Fiche de suivi
  'fiche.suivi-greta-cfa-apprenti': ['apprenti'],
  'fiche.suivi-greta-cfa-formateur': ['formateur'],
  'fiche.evaluation-entreprise': ['maitre'],
  // Évaluation des activités (mode activités, juillet 2026 — chantier #4) :
  // miroir de la colonne d'évaluation entreprise, maître / tuteur seul.
  'fiche.activites': ['maitre'],
  // Attitudes professionnelles par période entreprise (juillet 2026) :
  // le maître / tuteur seul, comme la colonne d'évaluation entreprise.
  'fiche.attitudes': ['maitre'],
  // Ajout / retrait d'une compétence sur la fiche de période : formateur +
  // maître / tuteur (17 juin 2026)
  'fiche.ajouter-competence': ['formateur', 'maitre'],
  'fiche.retour-apprenti': ['apprenti'],
  'fiche.observation-apprenti': ['apprenti'],
  'fiche.observation-maitre': ['maitre'],
  'fiche.observation-formateur': ['formateur'],
  'fiche.signature-apprenti': ['apprenti'],
  'fiche.signature-maitre': ['maitre'],
  'fiche.signature-formateur': ['formateur'],
  'fiche.deverrouiller': ['formateur'],

  // Grille de synthèse des compétences (menu « Synthèse »)
  // Compétences entreprise : maître éditable, formateur lecture seule (CDC §5.4)
  'grille-competences.entreprise': ['maitre'],

  // Opérations administratives sur le livret
  // Export PDF (livret complet, période, entretien, fiches de suivi) : ouvert
  // au formateur référent, au coordo et à l'admin (16 juin 2026) — c'est une
  // sortie/consultation, pas du contenu pédagogique. Apprenti·e et maître exclus.
  'export-pdf': ['formateur', 'coordo', 'admin'],
  // Accès mobile (3 juillet 2026) : afficher le QR code d'accès à l'app pour
  // le faire scanner (tuteur en visite, démo direction). Pas de contenu
  // pédagogique — même trio que l'export PDF.
  'acces-mobile': ['formateur', 'coordo', 'admin'],
  // Suivi de gestion (8 juillet 2026) — pas de contenu pédagogique.
  'point-alerte.traiter': ['coordo', 'admin'],
  // Documents administratifs (10 juillet 2026) : dépôt par la coordination.
  // Attestation : l'apprenti·e MAJEUR·E, ou le RESPONSABLE LÉGAL en lieu et
  // place d'un·e mineur·e (13 juillet 2026 — demande 5). La matrice ouvre la
  // capacité aux deux rôles ; c'est `attestataireDocuments` (minorité,
  // recalculée au jour) qui tranche lequel est actif pour un·e apprenti·e.
  'documents.gerer': ['coordo', 'admin'],
  'documents.attester': ['apprenti', 'responsable'],
  'cloturer-livret': ['formateur'],

  // ── Administration (rôles coordo, admin et formateur partiel) ──────────
  // Coordo et admin partagent la gestion administrative complète.
  // Le formateur référent peut **créer** un·e apprenti·e ou un maître
  // d'apprentissage (besoin terrain : enregistrer un nouveau contrat sans
  // attendre une intervention coordo). Il ne peut ni modifier ni supprimer
  // les comptes existants — c'est le coordo qui assure la maintenance.
  // Seul l'admin peut créer un autre coordo (et reste l'autorité supérieure).
  'admin.utilisateurs.creer-apprenti': ['coordo', 'admin', 'formateur'],
  'admin.utilisateurs.creer-maitre': ['coordo', 'admin', 'formateur'],
  'admin.utilisateurs.creer-formateur': ['coordo', 'admin'],
  'admin.utilisateurs.creer-coordo': ['admin'], // exclusif admin
  'admin.utilisateurs.modifier': ['coordo', 'admin'],
  'admin.utilisateurs.supprimer': ['coordo', 'admin'],
  'admin.utilisateurs.import-xlsx': ['coordo', 'admin'],
  'admin.formations.creer': ['coordo', 'admin'],
  'admin.formations.modifier': ['coordo', 'admin'],
  'admin.formations.supprimer': ['coordo', 'admin'],
  'admin.affectations.gerer': ['coordo', 'admin'],
  'admin.referentiels.gerer': ['coordo', 'admin'],
  'admin.etablissements.gerer': ['admin'], // admin uniquement
  'admin.parametres.gerer': ['admin'], // admin uniquement (seuil référentiels, juillet 2026)
  'admin.entreprises.gerer': ['coordo', 'admin'], // coordo + admin (gestion des apprenti·e·s)
  'admin.attitudes.gerer': ['admin'], // admin uniquement
  // Modèles d'activités + mapping + choix du mode (juillet 2026 — chantier
  // #4) : ingénierie de formation, coordo + admin (cf. admin.referentiels.gerer).
  'admin.activites.gerer': ['coordo', 'admin'],
};

/**
 * Liste exhaustive des ressources de la matrice — pour les tests transverses
 * (balayage « le responsable légal est en lecture seule partout », 13 juillet
 * 2026) et tout audit de couverture.
 */
export const TOUTES_RESSOURCES = Object.keys(MATRICE) as ReadonlyArray<Ressource>;

/**
 * Détermine si un rôle peut éditer une ressource donnée.
 *
 * Le rôle `admin` n'a PAS de droits sur le contenu pédagogique du livret
 * (commentaires, niveaux de maîtrise, compétences, signatures). Il est
 * inscrit explicitement dans la matrice pour les ressources d'administration
 * uniquement, plus le droit exclusif `admin.utilisateurs.creer-coordo`.
 *
 * @example
 * peutEditer('apprenti', 'fiche.retour-apprenti');     // true
 * peutEditer('admin', 'fiche.retour-apprenti');        // false (pédagogique)
 * peutEditer('admin', 'admin.utilisateurs.creer-coordo'); // true (exclusif)
 * peutEditer('coordo', 'admin.utilisateurs.creer-coordo'); // false
 */
export function peutEditer(role: Role, ressource: Ressource): boolean {
  return MATRICE[ressource].includes(role);
}

/**
 * Le coordo et l'admin (gouvernance) ne sont pas soumis au séquencement de
 * signature des périodes : ils peuvent consulter toutes les fiches de période
 * (entreprise et centre) même si la précédente n'est pas encore signée. C'est
 * un droit de supervision — l'édition du contenu pédagogique reste gardée par
 * la matrice ci-dessus (le coordo n'édite ni n'évalue les fiches).
 *
 * Ils peuvent en outre **forcer** l'affichage de toutes les périodes d'un lieu
 * pour **tous les rôles** (apprenti·e, tuteur, formateur) via le drapeau
 * `Livret.affichagePeriodesForce` (18 juin 2026).
 */
export function peutContournerSequencement(role: Role): boolean {
  return role === 'coordo' || role === 'admin';
}

/**
 * Retourne la liste des rôles métier autorisés sur une ressource.
 *
 * NB : `admin` n'est PAS retourné, même s'il a accès en pratique
 * (cf. peutEditer). Cette fonction sert à composer les tooltips d'aide
 * du type « Modifiable par : maître d'apprentissage », et il serait
 * trompeur d'y mentionner admin pour les rôles métier normaux.
 */
export function rolesAutorises(ressource: Ressource): ReadonlyArray<Role> {
  return MATRICE[ressource];
}

/**
 * Libellé humain d'un rôle, pour les messages d'interface.
 */
export function libelleRole(role: Role): string {
  switch (role) {
    case 'apprenti':
      return 'Apprenti·e';
    case 'maitre':
      return 'Maître / Tuteur';
    case 'formateur':
      return 'Formateur référent';
    case 'coordo':
      return 'Coordinateur·rice';
    case 'admin':
      return 'Administrateur·rice';
    case 'responsable':
      return 'Responsable légal';
  }
}
