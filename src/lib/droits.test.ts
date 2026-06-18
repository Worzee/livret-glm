import { describe, expect, it } from 'vitest';
import { libelleRole, peutEditer, rolesAutorises, type Ressource } from './droits';
import type { Role } from '@/types';

const ROLES_METIER: Role[] = ['apprenti', 'maitre', 'formateur', 'coordo'];

/**
 * Tests TDD de la matrice des droits.
 * Référence : cahier des charges v1.3, section 6 (matrice exhaustive).
 *
 * Chaque assertion correspond à une cellule du tableau §6.
 * Une régression ici casse toute la démonstration.
 */

describe('peutEditer — droits par ressource (CDC §6)', () => {
  describe('Module organisation du suivi', () => {
    it('formateur, coordo et admin peuvent gérer organisation-suivi (juin 2026)', () => {
      expect(peutEditer('formateur', 'organisation-suivi')).toBe(true);
      expect(peutEditer('coordo', 'organisation-suivi')).toBe(true);
      expect(peutEditer('admin', 'organisation-suivi')).toBe(true);
      expect(peutEditer('apprenti', 'organisation-suivi')).toBe(false);
      expect(peutEditer('maitre', 'organisation-suivi')).toBe(false);
    });

    it('seuls le coordo et l’admin peuvent SUPPRIMER un événement (15 juin 2026)', () => {
      // Le formateur référent crée / modifie mais ne supprime pas.
      expect(peutEditer('formateur', 'organisation-suivi.supprimer')).toBe(false);
      expect(peutEditer('coordo', 'organisation-suivi.supprimer')).toBe(true);
      expect(peutEditer('admin', 'organisation-suivi.supprimer')).toBe(true);
      expect(peutEditer('apprenti', 'organisation-suivi.supprimer')).toBe(false);
      expect(peutEditer('maitre', 'organisation-suivi.supprimer')).toBe(false);
    });

    it("la gestion de l'entretien (initialisation, date) reste au formateur seul", () => {
      expect(peutEditer('formateur', 'entretien.gestion')).toBe(true);
      expect(peutEditer('coordo', 'entretien.gestion')).toBe(false);
      expect(peutEditer('apprenti', 'entretien.gestion')).toBe(false);
      expect(peutEditer('maitre', 'entretien.gestion')).toBe(false);
    });
  });

  describe('Entretien tripartite (CDC §5.2)', () => {
    it('apprenti·e édite ses propres questions et zones', () => {
      expect(peutEditer('apprenti', 'entretien.questions-apprenti')).toBe(true);
      expect(peutEditer('apprenti', 'entretien.commentaires-apprenti')).toBe(true);
      expect(peutEditer('apprenti', 'entretien.signature-apprenti')).toBe(true);
    });

    it('trame E1 : co-saisie formateur + maître ; signature représentant légal au formateur (juin 2026)', () => {
      expect(peutEditer('formateur', 'entretien.trame')).toBe(true);
      expect(peutEditer('maitre', 'entretien.trame')).toBe(true);
      expect(peutEditer('apprenti', 'entretien.trame')).toBe(false);
      expect(peutEditer('coordo', 'entretien.trame')).toBe(false);
      expect(peutEditer('admin', 'entretien.trame')).toBe(false);

      expect(peutEditer('formateur', 'entretien.signature-representant-legal')).toBe(true);
      expect(peutEditer('maitre', 'entretien.signature-representant-legal')).toBe(false);
      expect(peutEditer('coordo', 'entretien.signature-representant-legal')).toBe(false);
    });

    it('maître édite ses questions, son appréciation, son commentaire et sa signature', () => {
      expect(peutEditer('maitre', 'entretien.questions-maitre')).toBe(true);
      expect(peutEditer('maitre', 'entretien.appreciation-maitre')).toBe(true);
      expect(peutEditer('maitre', 'entretien.commentaires-maitre')).toBe(true);
      expect(peutEditer('maitre', 'entretien.signature-maitre')).toBe(true);
    });

    it('formateur édite démarches, conditions, aides, son commentaire et sa signature', () => {
      expect(peutEditer('formateur', 'entretien.demarches-administratives')).toBe(true);
      expect(peutEditer('formateur', 'entretien.conditions-pratiques')).toBe(true);
      expect(peutEditer('formateur', 'entretien.aides-demandees')).toBe(true);
      expect(peutEditer('formateur', 'entretien.commentaires-formateur')).toBe(true);
      expect(peutEditer('formateur', 'entretien.signature-formateur')).toBe(true);
    });

    it("aucun rôle ne peut éditer la zone d'un autre rôle", () => {
      expect(peutEditer('maitre', 'entretien.questions-apprenti')).toBe(false);
      expect(peutEditer('formateur', 'entretien.questions-apprenti')).toBe(false);
      expect(peutEditer('apprenti', 'entretien.appreciation-maitre')).toBe(false);
      expect(peutEditer('apprenti', 'entretien.demarches-administratives')).toBe(false);
      expect(peutEditer('maitre', 'entretien.demarches-administratives')).toBe(false);
    });

    it('seul l’apprenti peut signer pour l’apprenti (R18)', () => {
      expect(peutEditer('apprenti', 'entretien.signature-apprenti')).toBe(true);
      expect(peutEditer('maitre', 'entretien.signature-apprenti')).toBe(false);
      expect(peutEditer('formateur', 'entretien.signature-apprenti')).toBe(false);
    });

    it('le maître / tuteur seul édite la sélection des compétences abordées en entreprise (13 juin 2026)', () => {
      expect(peutEditer('maitre', 'entretien.selection-competences-entreprise')).toBe(true);
      expect(peutEditer('formateur', 'entretien.selection-competences-entreprise')).toBe(false);
      expect(peutEditer('apprenti', 'entretien.selection-competences-entreprise')).toBe(false);
      expect(peutEditer('coordo', 'entretien.selection-competences-entreprise')).toBe(false);
      expect(peutEditer('admin', 'entretien.selection-competences-entreprise')).toBe(false);
    });
  });

  describe('Fiche de suivi par période (CDC §5.3)', () => {
    it("formateur édite sa zone du suivi GRETA CFA et l'évaluation centre", () => {
      expect(peutEditer('formateur', 'fiche.suivi-greta-cfa-formateur')).toBe(true);
      expect(peutEditer('formateur', 'fiche.evaluation-greta')).toBe(true);
    });

    it('apprenti·e édite sa zone du suivi GRETA CFA (refonte mai 2026)', () => {
      expect(peutEditer('apprenti', 'fiche.suivi-greta-cfa-apprenti')).toBe(true);
      expect(peutEditer('formateur', 'fiche.suivi-greta-cfa-apprenti')).toBe(false);
      expect(peutEditer('maitre', 'fiche.suivi-greta-cfa-apprenti')).toBe(false);
      expect(peutEditer('apprenti', 'fiche.suivi-greta-cfa-formateur')).toBe(false);
    });

    it('maître édite la colonne évaluation entreprise', () => {
      expect(peutEditer('maitre', 'fiche.evaluation-entreprise')).toBe(true);
      expect(peutEditer('apprenti', 'fiche.evaluation-entreprise')).toBe(false);
      expect(peutEditer('formateur', 'fiche.evaluation-entreprise')).toBe(false);
    });

    it('ajout d’une compétence à la fiche : formateur ET maître / tuteur (17 juin 2026)', () => {
      expect(peutEditer('formateur', 'fiche.ajouter-competence')).toBe(true);
      expect(peutEditer('maitre', 'fiche.ajouter-competence')).toBe(true);
      expect(peutEditer('apprenti', 'fiche.ajouter-competence')).toBe(false);
      expect(peutEditer('coordo', 'fiche.ajouter-competence')).toBe(false);
      expect(peutEditer('admin', 'fiche.ajouter-competence')).toBe(false);
    });

    it('apprenti·e édite la colonne retour apprenti·e', () => {
      expect(peutEditer('apprenti', 'fiche.retour-apprenti')).toBe(true);
      expect(peutEditer('maitre', 'fiche.retour-apprenti')).toBe(false);
      expect(peutEditer('formateur', 'fiche.retour-apprenti')).toBe(false);
    });

    it("chaque rôle édite UNIQUEMENT sa zone d'observation", () => {
      expect(peutEditer('apprenti', 'fiche.observation-apprenti')).toBe(true);
      expect(peutEditer('maitre', 'fiche.observation-apprenti')).toBe(false);
      expect(peutEditer('formateur', 'fiche.observation-apprenti')).toBe(false);

      expect(peutEditer('maitre', 'fiche.observation-maitre')).toBe(true);
      expect(peutEditer('apprenti', 'fiche.observation-maitre')).toBe(false);
      expect(peutEditer('formateur', 'fiche.observation-maitre')).toBe(false);

      expect(peutEditer('formateur', 'fiche.observation-formateur')).toBe(true);
      expect(peutEditer('apprenti', 'fiche.observation-formateur')).toBe(false);
      expect(peutEditer('maitre', 'fiche.observation-formateur')).toBe(false);
    });

    it('la gestion calendaire passe désormais par le planning de formation', () => {
      // Refonte mai 2026 (chantier #1) : les ressources `fiche.creer-periode`,
      // `fiche.modifier-periode`, `fiche.supprimer-periode` ont été retirées
      // de la matrice. Le coordo/admin gère le planning via
      // `admin.formations.modifier` ; cette mutation propage en cascade
      // les fiches dans les livrets de la promo.
      expect(peutEditer('coordo', 'admin.formations.modifier')).toBe(true);
      expect(peutEditer('admin', 'admin.formations.modifier')).toBe(true);
      // Le formateur ne pilote plus le planning lui-même.
      expect(peutEditer('formateur', 'admin.formations.modifier')).toBe(false);
    });

    it('seul le formateur peut déverrouiller une fiche signée (R10)', () => {
      expect(peutEditer('formateur', 'fiche.deverrouiller')).toBe(true);
      expect(peutEditer('apprenti', 'fiche.deverrouiller')).toBe(false);
      expect(peutEditer('maitre', 'fiche.deverrouiller')).toBe(false);
      expect(peutEditer('coordo', 'fiche.deverrouiller')).toBe(false);
    });
  });

  describe("Grilles d'évaluation finales (CDC §5.4-5.5)", () => {
    it('seul le maître édite la grille compétences entreprise', () => {
      expect(peutEditer('maitre', 'grille-competences.entreprise')).toBe(true);
      expect(peutEditer('formateur', 'grille-competences.entreprise')).toBe(false);
      expect(peutEditer('apprenti', 'grille-competences.entreprise')).toBe(false);
    });

    it('seul le formateur édite la grille compétences centre', () => {
      expect(peutEditer('formateur', 'grille-competences.centre')).toBe(true);
      expect(peutEditer('maitre', 'grille-competences.centre')).toBe(false);
      expect(peutEditer('apprenti', 'grille-competences.centre')).toBe(false);
    });

    it("apprenti·e ne peut éditer aucune grille d'évaluation ni les attitudes", () => {
      expect(peutEditer('apprenti', 'grille-competences.entreprise')).toBe(false);
      expect(peutEditer('apprenti', 'grille-competences.centre')).toBe(false);
      expect(peutEditer('apprenti', 'entretien.attitudes')).toBe(false);
    });

    it('seul le maître évalue les attitudes professionnelles en entretien (juin 2026)', () => {
      expect(peutEditer('maitre', 'entretien.attitudes')).toBe(true);
      expect(peutEditer('formateur', 'entretien.attitudes')).toBe(false);
    });

    it("le choix des attitudes à l'E1 est partagé maître + formateur (13 juin 2026)", () => {
      expect(peutEditer('maitre', 'entretien.attitudes-selection')).toBe(true);
      expect(peutEditer('formateur', 'entretien.attitudes-selection')).toBe(true);
      expect(peutEditer('apprenti', 'entretien.attitudes-selection')).toBe(false);
      expect(peutEditer('coordo', 'entretien.attitudes-selection')).toBe(false);
      expect(peutEditer('admin', 'entretien.attitudes-selection')).toBe(false);
    });

    it("seul l'admin gère le catalogue des attitudes (juin 2026)", () => {
      expect(peutEditer('admin', 'admin.attitudes.gerer')).toBe(true);
      expect(peutEditer('coordo', 'admin.attitudes.gerer')).toBe(false);
      expect(peutEditer('formateur', 'admin.attitudes.gerer')).toBe(false);
    });
  });

  describe('Opérations administratives', () => {
    it("le formateur, le coordo et l'admin peuvent générer un export PDF (16 juin 2026)", () => {
      expect(peutEditer('formateur', 'export-pdf')).toBe(true);
      expect(peutEditer('coordo', 'export-pdf')).toBe(true);
      expect(peutEditer('admin', 'export-pdf')).toBe(true);
      expect(peutEditer('apprenti', 'export-pdf')).toBe(false);
      expect(peutEditer('maitre', 'export-pdf')).toBe(false);
    });

    it('seul le formateur peut clôturer le livret (R22)', () => {
      expect(peutEditer('formateur', 'cloturer-livret')).toBe(true);
      expect(peutEditer('apprenti', 'cloturer-livret')).toBe(false);
      expect(peutEditer('maitre', 'cloturer-livret')).toBe(false);
    });
  });

  describe('Cohérence transverse', () => {
    it('chaque ressource du livret est éditable par exactement 1 rôle métier (hors admin)', () => {
      // `organisation-suivi` sortie de la liste depuis juin 2026 (gestion
      // partagée formateur + coordo) — remplacée ici par `entretien.gestion`.
      // `export-pdf` sortie le 16 juin 2026 : devenue multi-rôle (formateur +
      // coordo + admin), elle n'est plus « éditable par un seul rôle métier ».
      const RESSOURCES_LIVRET: Ressource[] = [
        'entretien.gestion',
        'entretien.questions-apprenti',
        'entretien.questions-maitre',
        'fiche.evaluation-entreprise',
        'fiche.evaluation-greta',
        'fiche.retour-apprenti',
      ];
      RESSOURCES_LIVRET.forEach((r) => {
        const autorises = ROLES_METIER.filter((role) => peutEditer(role, r));
        expect(autorises.length).toBe(1);
      });
    });

    it("ni le coordo ni l'admin n'ont de droits sur le contenu pédagogique du livret", () => {
      // `organisation-suivi` sortie de la liste depuis juin 2026 : la gestion
      // des événements est calendaire/organisationnelle (ouverte au coordo),
      // pas pédagogique. La conduite de l'entretien (`entretien.gestion`)
      // reste pédagogique et figure dans la liste.
      const RESSOURCES_PEDAGOGIQUES: Ressource[] = [
        'entretien.gestion',
        'entretien.questions-apprenti',
        'entretien.questions-maitre',
        'entretien.appreciation-maitre',
        'entretien.demarches-administratives',
        'entretien.selection-competences-entreprise',
        'fiche.suivi-greta-cfa-apprenti',
        'fiche.suivi-greta-cfa-formateur',
        'fiche.evaluation-entreprise',
        'fiche.evaluation-greta',
        'fiche.ajouter-competence',
        'fiche.retour-apprenti',
        'fiche.observation-apprenti',
        'fiche.observation-maitre',
        'fiche.observation-formateur',
        'fiche.signature-apprenti',
        'fiche.signature-maitre',
        'fiche.signature-formateur',
        // Note : fiche.creer-periode / modifier-periode / supprimer-periode
        // ne sont PAS purement pédagogiques — ils relèvent de la gestion
        // calendaire et sont ouverts au coordo (besoin terrain : le coordo
        // peut ouvrir/fermer le calendrier des périodes en lieu et place
        // du formateur référent).
        'fiche.deverrouiller',
        'grille-competences.entreprise',
        'grille-competences.centre',
        'entretien.attitudes',
        'entretien.attitudes-selection',
        'entretien.trame',
        'entretien.signature-representant-legal',
        // `export-pdf` retiré le 16 juin 2026 : ouvert au coordo / admin (sortie
        // documentaire, pas de contenu pédagogique) — cf. test dédié plus haut.
        'cloturer-livret',
      ];
      RESSOURCES_PEDAGOGIQUES.forEach((r) => {
        expect(peutEditer('coordo', r)).toBe(false);
        expect(peutEditer('admin', r)).toBe(false);
      });
    });
  });
});

describe('Administration — droits du rôle coordo', () => {
  it('coordo, admin et formateur peuvent créer un·e apprenti·e', () => {
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-apprenti')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.creer-apprenti')).toBe(true);
    // Le formateur référent peut enregistrer un nouveau contrat sans
    // attendre une intervention coordo (besoin terrain).
    expect(peutEditer('formateur', 'admin.utilisateurs.creer-apprenti')).toBe(true);
    // L'apprenti·e et le maître ne peuvent pas créer.
    expect(peutEditer('apprenti', 'admin.utilisateurs.creer-apprenti')).toBe(false);
    expect(peutEditer('maitre', 'admin.utilisateurs.creer-apprenti')).toBe(false);
  });

  it("coordo, admin et formateur peuvent créer un maître d'apprentissage", () => {
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-maitre')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.creer-maitre')).toBe(true);
    expect(peutEditer('formateur', 'admin.utilisateurs.creer-maitre')).toBe(true);
    expect(peutEditer('apprenti', 'admin.utilisateurs.creer-maitre')).toBe(false);
    expect(peutEditer('maitre', 'admin.utilisateurs.creer-maitre')).toBe(false);
  });

  it('seuls coordo et admin peuvent créer un formateur référent (pas le formateur)', () => {
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-formateur')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.creer-formateur')).toBe(true);
    expect(peutEditer('formateur', 'admin.utilisateurs.creer-formateur')).toBe(false);
  });

  it("le coordo NE peut PAS créer un autre coordo (réservé à l'admin — droit exclusif)", () => {
    // Cf. tests dédiés au rôle Admin pour la version positive de cette règle.
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-coordo')).toBe(false);
    expect(peutEditer('formateur', 'admin.utilisateurs.creer-coordo')).toBe(false);
  });

  it('seul le coordo modifie ou supprime un compte utilisateur', () => {
    expect(peutEditer('coordo', 'admin.utilisateurs.modifier')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.supprimer')).toBe(true);
    expect(peutEditer('formateur', 'admin.utilisateurs.modifier')).toBe(false);
    expect(peutEditer('formateur', 'admin.utilisateurs.supprimer')).toBe(false);
  });

  it("import XLSX d'utilisateur·rice·s : coordo + admin uniquement", () => {
    // Refonte mai 2026 : nouvelle ressource `admin.utilisateurs.import-xlsx`.
    // Le formateur peut créer un compte à la volée via la modale mais
    // PAS importer par lot (action structurelle).
    expect(peutEditer('coordo', 'admin.utilisateurs.import-xlsx')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.import-xlsx')).toBe(true);
    expect(peutEditer('formateur', 'admin.utilisateurs.import-xlsx')).toBe(false);
    expect(peutEditer('maitre', 'admin.utilisateurs.import-xlsx')).toBe(false);
    expect(peutEditer('apprenti', 'admin.utilisateurs.import-xlsx')).toBe(false);
  });

  it('seul le coordo gère les formations (création, modification, suppression)', () => {
    expect(peutEditer('coordo', 'admin.formations.creer')).toBe(true);
    expect(peutEditer('coordo', 'admin.formations.modifier')).toBe(true);
    expect(peutEditer('coordo', 'admin.formations.supprimer')).toBe(true);
    expect(peutEditer('formateur', 'admin.formations.creer')).toBe(false);
    expect(peutEditer('apprenti', 'admin.formations.modifier')).toBe(false);
    expect(peutEditer('maitre', 'admin.formations.supprimer')).toBe(false);
  });

  it('seul le coordo gère les affectations apprenti·e ↔ formation/maître/formateur', () => {
    expect(peutEditer('coordo', 'admin.affectations.gerer')).toBe(true);
    expect(peutEditer('apprenti', 'admin.affectations.gerer')).toBe(false);
    expect(peutEditer('maitre', 'admin.affectations.gerer')).toBe(false);
    expect(peutEditer('formateur', 'admin.affectations.gerer')).toBe(false);
  });
});

describe('rolesAutorises', () => {
  it('retourne la liste exacte des rôles autorisés', () => {
    expect(rolesAutorises('organisation-suivi')).toEqual(['formateur', 'coordo', 'admin']);
    expect(rolesAutorises('fiche.evaluation-entreprise')).toEqual(['maitre']);
    expect(rolesAutorises('fiche.retour-apprenti')).toEqual(['apprenti']);
  });
});

describe('libelleRole', () => {
  it('retourne un libellé humain pour chaque rôle', () => {
    expect(libelleRole('apprenti')).toBe('Apprenti·e');
    expect(libelleRole('maitre')).toBe('Maître / Tuteur');
    expect(libelleRole('formateur')).toBe('Formateur référent');
    expect(libelleRole('coordo')).toBe('Coordinateur·rice');
    expect(libelleRole('admin')).toBe('Administrateur·rice');
  });
});

describe('Admin — droits administratifs uniquement (pas de pédagogie)', () => {
  it('admin partage avec coordo la création des comptes apprenti·e / maître / formateur', () => {
    expect(peutEditer('admin', 'admin.utilisateurs.creer-apprenti')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.creer-maitre')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.creer-formateur')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-apprenti')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-maitre')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-formateur')).toBe(true);
  });

  it("seul l'admin peut créer un coordinateur·rice (droit exclusif)", () => {
    expect(peutEditer('admin', 'admin.utilisateurs.creer-coordo')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.creer-coordo')).toBe(false);
    expect(peutEditer('formateur', 'admin.utilisateurs.creer-coordo')).toBe(false);
    expect(peutEditer('maitre', 'admin.utilisateurs.creer-coordo')).toBe(false);
    expect(peutEditer('apprenti', 'admin.utilisateurs.creer-coordo')).toBe(false);
  });

  it("admin et coordo partagent la modification et la suppression d'utilisateurs", () => {
    expect(peutEditer('admin', 'admin.utilisateurs.modifier')).toBe(true);
    expect(peutEditer('admin', 'admin.utilisateurs.supprimer')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.modifier')).toBe(true);
    expect(peutEditer('coordo', 'admin.utilisateurs.supprimer')).toBe(true);
  });

  it('admin et coordo partagent la gestion des formations', () => {
    expect(peutEditer('admin', 'admin.formations.creer')).toBe(true);
    expect(peutEditer('admin', 'admin.formations.modifier')).toBe(true);
    expect(peutEditer('admin', 'admin.formations.supprimer')).toBe(true);
    expect(peutEditer('coordo', 'admin.formations.creer')).toBe(true);
  });

  it('admin et coordo partagent la gestion des affectations', () => {
    expect(peutEditer('admin', 'admin.affectations.gerer')).toBe(true);
    expect(peutEditer('coordo', 'admin.affectations.gerer')).toBe(true);
  });

  it("admin n'a AUCUN droit sur la signature pédagogique", () => {
    expect(peutEditer('admin', 'fiche.signature-apprenti')).toBe(false);
    expect(peutEditer('admin', 'fiche.signature-maitre')).toBe(false);
    expect(peutEditer('admin', 'fiche.signature-formateur')).toBe(false);
    expect(peutEditer('admin', 'entretien.signature-apprenti')).toBe(false);
  });

  it("admin n'a AUCUN droit sur les évaluations / commentaires / observations", () => {
    expect(peutEditer('admin', 'fiche.evaluation-entreprise')).toBe(false);
    expect(peutEditer('admin', 'fiche.evaluation-greta')).toBe(false);
    expect(peutEditer('admin', 'fiche.retour-apprenti')).toBe(false);
    expect(peutEditer('admin', 'fiche.observation-apprenti')).toBe(false);
    expect(peutEditer('admin', 'fiche.observation-maitre')).toBe(false);
    expect(peutEditer('admin', 'fiche.observation-formateur')).toBe(false);
    expect(peutEditer('admin', 'entretien.questions-apprenti')).toBe(false);
    expect(peutEditer('admin', 'entretien.appreciation-maitre')).toBe(false);
    expect(peutEditer('admin', 'grille-competences.entreprise')).toBe(false);
    expect(peutEditer('admin', 'entretien.attitudes')).toBe(false);
  });

  it('rolesAutorises liste correctement les rôles admin par ressource', () => {
    // Création apprenti·e + maître ouverte au formateur (besoin terrain).
    expect(rolesAutorises('admin.utilisateurs.creer-apprenti')).toEqual([
      'coordo',
      'admin',
      'formateur',
    ]);
    expect(rolesAutorises('admin.utilisateurs.creer-maitre')).toEqual([
      'coordo',
      'admin',
      'formateur',
    ]);
    // Création formateur reste réservée coordo + admin.
    expect(rolesAutorises('admin.utilisateurs.creer-formateur')).toEqual(['coordo', 'admin']);
    // Création coordo : exclusif admin.
    expect(rolesAutorises('admin.utilisateurs.creer-coordo')).toEqual(['admin']);
    expect(rolesAutorises('admin.formations.creer')).toEqual(['coordo', 'admin']);
  });

  it('rolesAutorises ne mentionne PAS admin sur les ressources pédagogiques', () => {
    expect(rolesAutorises('fiche.evaluation-entreprise')).toEqual(['maitre']);
    expect(rolesAutorises('fiche.retour-apprenti')).toEqual(['apprenti']);
    expect(rolesAutorises('cloturer-livret')).toEqual(['formateur']);
  });
});
