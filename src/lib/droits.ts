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
  // Module organisation du suivi (CDC §5.1)
  | 'organisation-suivi'
  // Entretien tripartite (CDC §5.2)
  | 'entretien.questions-apprenti'
  | 'entretien.questions-maitre'
  | 'entretien.appreciation-maitre'
  | 'entretien.demarches-administratives'
  | 'entretien.conditions-pratiques'
  | 'entretien.aides-demandees'
  | 'entretien.commentaires-apprenti'
  | 'entretien.commentaires-maitre'
  | 'entretien.commentaires-formateur'
  | 'entretien.signature-apprenti'
  | 'entretien.signature-maitre'
  | 'entretien.signature-formateur'
  // Fiche de suivi par période (CDC §5.3)
  | 'fiche.suivi-greta-cfa'
  | 'fiche.evaluation-entreprise' // colonne entreprise
  | 'fiche.evaluation-greta' // colonne centre
  | 'fiche.retour-apprenti'
  | 'fiche.observation-apprenti'
  | 'fiche.observation-maitre'
  | 'fiche.observation-formateur'
  | 'fiche.signature-apprenti'
  | 'fiche.signature-maitre'
  | 'fiche.signature-formateur'
  | 'fiche.creer-periode'
  | 'fiche.modifier-periode' // titre / dates
  | 'fiche.supprimer-periode'
  | 'fiche.deverrouiller' // R10
  // Grilles d'évaluation finales (CDC §5.4-5.5)
  | 'grille-competences.entreprise'
  | 'grille-competences.centre'
  | 'grille-attitudes.maitre'
  | 'grille-attitudes.formateur'
  // Export et opérations administratives (CDC §5.6)
  | 'export-pdf'
  | 'cloturer-livret'
  // ── Administration (rôle coordo, hors CDC v1.3 — extension métier) ────────
  | 'admin.utilisateurs.creer-apprenti'
  | 'admin.utilisateurs.creer-maitre'
  | 'admin.utilisateurs.creer-formateur'
  | 'admin.utilisateurs.creer-coordo'
  | 'admin.utilisateurs.modifier'
  | 'admin.utilisateurs.supprimer'
  | 'admin.formations.creer'
  | 'admin.formations.modifier'
  | 'admin.formations.supprimer'
  /** Associer un·e apprenti·e à une formation, un maître, un formateur. */
  | 'admin.affectations.gerer'
  /** Importer / supprimer / éditer les référentiels de compétences. */
  | 'admin.referentiels.gerer';

/**
 * Matrice statique : pour chaque ressource, l'ensemble des rôles autorisés.
 * Source : tableau §6 du cahier des charges.
 */
const MATRICE: Record<Ressource, ReadonlyArray<Role>> = {
  // Organisation du suivi : formateur uniquement
  'organisation-suivi': ['formateur'],

  // Entretien tripartite — questions/zones par rôle propriétaire
  'entretien.questions-apprenti': ['apprenti'],
  'entretien.questions-maitre': ['maitre'],
  'entretien.appreciation-maitre': ['maitre'],
  'entretien.demarches-administratives': ['formateur'],
  'entretien.conditions-pratiques': ['formateur'],
  'entretien.aides-demandees': ['formateur'],
  'entretien.commentaires-apprenti': ['apprenti'],
  'entretien.commentaires-maitre': ['maitre'],
  'entretien.commentaires-formateur': ['formateur'],
  'entretien.signature-apprenti': ['apprenti'],
  'entretien.signature-maitre': ['maitre'],
  'entretien.signature-formateur': ['formateur'],

  // Fiche de suivi
  'fiche.suivi-greta-cfa': ['formateur'],
  'fiche.evaluation-entreprise': ['maitre'],
  'fiche.evaluation-greta': ['formateur'],
  'fiche.retour-apprenti': ['apprenti'],
  'fiche.observation-apprenti': ['apprenti'],
  'fiche.observation-maitre': ['maitre'],
  'fiche.observation-formateur': ['formateur'],
  'fiche.signature-apprenti': ['apprenti'],
  'fiche.signature-maitre': ['maitre'],
  'fiche.signature-formateur': ['formateur'],
  // Création / suppression / modification de l'enveloppe d'une fiche de
  // période : formateur référent et coordo (besoin terrain : le coordo peut
  // ouvrir/fermer le calendrier des périodes en lieu et place du formateur).
  'fiche.creer-periode': ['formateur', 'coordo'],
  'fiche.modifier-periode': ['formateur', 'coordo'],
  'fiche.supprimer-periode': ['formateur', 'coordo'],
  'fiche.deverrouiller': ['formateur'],

  // Grilles d'évaluation finales
  // Compétences entreprise : maître éditable, formateur lecture seule (CDC §5.4)
  'grille-competences.entreprise': ['maitre'],
  // Compétences centre : formateur uniquement
  'grille-competences.centre': ['formateur'],
  // Attitudes : maître + formateur
  'grille-attitudes.maitre': ['maitre'],
  'grille-attitudes.formateur': ['formateur'],

  // Opérations administratives sur le livret
  'export-pdf': ['formateur'],
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
  'admin.formations.creer': ['coordo', 'admin'],
  'admin.formations.modifier': ['coordo', 'admin'],
  'admin.formations.supprimer': ['coordo', 'admin'],
  'admin.affectations.gerer': ['coordo', 'admin'],
  'admin.referentiels.gerer': ['coordo', 'admin'],
};

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
      return "Maître d'apprentissage";
    case 'formateur':
      return 'Formateur référent';
    case 'coordo':
      return 'Coordinateur·rice';
    case 'admin':
      return 'Administrateur·rice';
  }
}
