import type { Admin, Apprenti, Coordo, Formateur, Maitre, ResponsableLegal } from '@/types';

/**
 * Utilisateurs fictifs de démonstration.
 * Référence : cahier des charges v1.3, section 24 (seed data).
 *
 * Promo CAP Cuisine 2025-2026 — 6 apprenti·e·s répartis sur 2 entreprises :
 *   - Le Gourmet (Lyon 8e) → maître Karim BENALI : Léa, Théo, Sofia
 *   - La Brasserie du Rhône (Lyon 2e) → maître Hélène ROCHE : Minh, Aya, Luca
 *
 * Luca a en plus Karim comme SECOND maître / tuteur (retours coordos juin
 * 2026 — démontre le double tutorat) : il apparaît donc chez les 2 maîtres.
 *
 * Chaque apprenti·e a un livret avec un état pédagogique distinct (cf.
 * `livret-demo.ts`) pour démontrer chaque cas du CDC §24.5.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Apprenti·e·s (6) — promo CAP Cuisine 2025-2026
// ─────────────────────────────────────────────────────────────────────────────

export const apprentiLeaMartin: Apprenti = {
  id: 'u-apprenti-lea',
  role: 'apprenti',
  nom: 'MARTIN',
  prenom: 'Léa',
  email: 'lea.martin@demo.fr',
  telephone: '01 99 99 99 01',
  dateNaissance: '2007-04-15',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-le-gourmet',
  historiqueEntreprises: [
    {
      id: 'aff-lea-1',
      entrepriseId: 'e-le-gourmet',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-martine',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const apprentiTheoDubois: Apprenti = {
  id: 'u-apprenti-theo',
  role: 'apprenti',
  nom: 'DUBOIS',
  prenom: 'Théo',
  email: 'theo.dubois@demo.fr',
  telephone: '01 99 99 99 11',
  dateNaissance: '2006-11-23',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-le-gourmet',
  historiqueEntreprises: [
    {
      id: 'aff-theo-1',
      entrepriseId: 'e-le-gourmet',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-martine',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const apprentiSofiaPereira: Apprenti = {
  id: 'u-apprenti-sofia',
  role: 'apprenti',
  nom: 'PEREIRA',
  prenom: 'Sofia',
  email: 'sofia.pereira@demo.fr',
  telephone: '01 99 99 99 12',
  dateNaissance: '2007-08-04',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-le-gourmet',
  historiqueEntreprises: [
    {
      id: 'aff-sofia-1',
      entrepriseId: 'e-le-gourmet',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-martine',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const apprentiMinhNguyen: Apprenti = {
  id: 'u-apprenti-minh',
  role: 'apprenti',
  nom: 'NGUYEN',
  prenom: 'Minh',
  email: 'minh.nguyen@demo.fr',
  telephone: '01 99 99 99 13',
  // MINEUR (13 juillet 2026 — demande 5) : 17 ans au moment de la démo — ses
  // documents administratifs sont attestés par ses responsables légaux.
  dateNaissance: '2009-03-15',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-brasserie-rhone',
  historiqueEntreprises: [
    {
      id: 'aff-minh-1',
      entrepriseId: 'e-brasserie-rhone',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-bernard',
      auteurNom: 'Bernard PETIT',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-helene',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-bernard',
  responsableLegalIds: ['u-responsable-thi', 'u-responsable-duc'],
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const apprentiAyaKouame: Apprenti = {
  id: 'u-apprenti-aya',
  role: 'apprenti',
  nom: 'KOUAMÉ',
  prenom: 'Aya',
  email: 'aya.kouame@demo.fr',
  telephone: '01 99 99 99 14',
  dateNaissance: '2006-06-30',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-brasserie-rhone',
  historiqueEntreprises: [
    {
      id: 'aff-aya-1',
      entrepriseId: 'e-brasserie-rhone',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-bernard',
      auteurNom: 'Bernard PETIT',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-helene',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-bernard',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const apprentiLucaBianchi: Apprenti = {
  id: 'u-apprenti-luca',
  role: 'apprenti',
  nom: 'BIANCHI',
  prenom: 'Luca',
  email: 'luca.bianchi@demo.fr',
  telephone: '01 99 99 99 15',
  dateNaissance: '2007-01-12',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-brasserie-rhone',
  // Changement d'entreprise en cours de contrat (démontre la traçabilité) :
  // Luca a démarré au Gourmet (avec Karim, resté second tuteur) puis a rejoint
  // la Brasserie du Rhône (avec Hélène).
  historiqueEntreprises: [
    {
      id: 'aff-luca-1',
      entrepriseId: 'e-le-gourmet',
      dateIso: '2025-09-02T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
    {
      id: 'aff-luca-2',
      entrepriseId: 'e-brasserie-rhone',
      dateIso: '2026-03-02T08:00:00.000Z',
      auteurId: 'u-coordo-bernard',
      auteurNom: 'Bernard PETIT',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-helene',
  // Double tutorat (juin 2026) : Karim suit aussi Luca (second maître).
  maitreApprentissageSecondId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
  coordoId: 'u-coordo-bernard',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

// ─────────────────────────────────────────────────────────────────────────────
// Apprenti·e·s (2) — promo BTS MHR 2025-2027 (3 juillet 2026)
// Suivis par Martine (coordo), formateur référent Marc TISSIER.
// ─────────────────────────────────────────────────────────────────────────────

export const apprentieCamilleMoreau: Apprenti = {
  id: 'u-apprenti-camille',
  role: 'apprenti',
  nom: 'MOREAU',
  prenom: 'Camille',
  email: 'camille.moreau@demo.fr',
  telephone: '01 99 99 99 16',
  dateNaissance: '2004-09-27',
  formationId: 'f-bts-mhr-2025',
  entrepriseId: 'e-hotel-continental',
  historiqueEntreprises: [
    {
      id: 'aff-camille-1',
      entrepriseId: 'e-hotel-continental',
      dateIso: '2025-09-08T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-nadia',
  formateurReferentId: 'u-formateur-marc',
  coordoId: 'u-coordo-martine',
  contratDebut: '2025-09-08',
  contratFin: '2027-08-31',
};

export const apprentiYanisBelkacem: Apprenti = {
  id: 'u-apprenti-yanis',
  role: 'apprenti',
  nom: 'BELKACEM',
  prenom: 'Yanis',
  email: 'yanis.belkacem@demo.fr',
  telephone: '01 99 99 99 17',
  dateNaissance: '2005-03-14',
  formationId: 'f-bts-mhr-2025',
  entrepriseId: 'e-table-halles',
  historiqueEntreprises: [
    {
      id: 'aff-yanis-1',
      entrepriseId: 'e-table-halles',
      dateIso: '2025-09-08T08:00:00.000Z',
      auteurId: 'u-coordo-martine',
      auteurNom: 'Martine LEFÈVRE',
      auteurRole: 'coordo',
    },
  ],
  maitreApprentissageId: 'u-maitre-julien',
  formateurReferentId: 'u-formateur-marc',
  coordoId: 'u-coordo-martine',
  contratDebut: '2025-09-08',
  contratFin: '2027-08-31',
};

/**
 * Liste plate des apprenti·e·s — facilite la consommation côté pages
 * (tableau de bord, lookup par id, etc.).
 */
export const apprentisDemo: Apprenti[] = [
  apprentiLeaMartin,
  apprentiTheoDubois,
  apprentiSofiaPereira,
  apprentiMinhNguyen,
  apprentiAyaKouame,
  apprentiLucaBianchi,
  apprentieCamilleMoreau,
  apprentiYanisBelkacem,
];

// ─────────────────────────────────────────────────────────────────────────────
// Maîtres d'apprentissage (2)
// ─────────────────────────────────────────────────────────────────────────────

export const maitreKarimBenali: Maitre = {
  id: 'u-maitre-karim',
  role: 'maitre',
  nom: 'BENALI',
  prenom: 'Karim',
  email: 'karim.benali@gourmet.demo',
  telephone: '01 99 99 99 02',
  entreprise: 'Restaurant Le Gourmet',
  fonction: 'Chef de cuisine',
  apprentiIds: [
    apprentiLeaMartin.id,
    apprentiTheoDubois.id,
    apprentiSofiaPereira.id,
    // Second maître de Luca (double tutorat juin 2026).
    apprentiLucaBianchi.id,
  ],
};

export const maitreHeleneRoche: Maitre = {
  id: 'u-maitre-helene',
  role: 'maitre',
  nom: 'ROCHE',
  prenom: 'Hélène',
  email: 'helene.roche@brasserierhone.demo',
  telephone: '01 99 99 99 22',
  entreprise: 'La Brasserie du Rhône',
  fonction: 'Cheffe de cuisine',
  apprentiIds: [apprentiMinhNguyen.id, apprentiAyaKouame.id, apprentiLucaBianchi.id],
};

// Tuteurs de la promo BTS MHR (3 juillet 2026) — profils salle / hôtellerie.

export const maitreNadiaHamdi: Maitre = {
  id: 'u-maitre-nadia',
  role: 'maitre',
  nom: 'HAMDI',
  prenom: 'Nadia',
  email: 'nadia.hamdi@continental.demo',
  telephone: '01 99 99 99 23',
  entreprise: 'Hôtel Le Continental',
  fonction: 'Directrice de la restauration',
  apprentiIds: [apprentieCamilleMoreau.id],
};

export const maitreJulienFaure: Maitre = {
  id: 'u-maitre-julien',
  role: 'maitre',
  nom: 'FAURE',
  prenom: 'Julien',
  email: 'julien.faure@tabledeshalles.demo',
  telephone: '01 99 99 99 24',
  entreprise: 'La Table des Halles',
  fonction: "Maître d'hôtel",
  apprentiIds: [apprentiYanisBelkacem.id],
};

export const maitresDemo: Maitre[] = [
  maitreKarimBenali,
  maitreHeleneRoche,
  maitreNadiaHamdi,
  maitreJulienFaure,
];

// ─────────────────────────────────────────────────────────────────────────────
// Formateur référent — un·e seul·e pour la promo (cohérent CFA)
// ─────────────────────────────────────────────────────────────────────────────

export const formatriceSophieDubois: Formateur = {
  id: 'u-formateur-sophie',
  role: 'formateur',
  nom: 'DUBOIS',
  prenom: 'Sophie',
  email: 'sophie.dubois@greta-demo.fr',
  telephone: '01 99 99 99 03',
  promoIds: ['f-cap-cuisine-2025'],
};

/** Formateur référent de la promo BTS MHR (3 juillet 2026). */
export const formateurMarcTissier: Formateur = {
  id: 'u-formateur-marc',
  role: 'formateur',
  nom: 'TISSIER',
  prenom: 'Marc',
  email: 'marc.tissier@greta-demo.fr',
  telephone: '01 99 99 99 06',
  promoIds: ['f-bts-mhr-2025'],
};

export const formateursDemo: Formateur[] = [formatriceSophieDubois, formateurMarcTissier];

// ─────────────────────────────────────────────────────────────────────────────
// Coordo + Admin (extensions hors-CDC v1.3)
// ─────────────────────────────────────────────────────────────────────────────

export const coordoMartineLefevre: Coordo = {
  id: 'u-coordo-martine',
  role: 'coordo',
  nom: 'LEFÈVRE',
  prenom: 'Martine',
  email: 'martine.lefevre@greta-demo.fr',
  telephone: '01 99 99 99 04',
  // Martine coordonne aussi la promo BTS MHR (3 juillet 2026) — accès Pronote.
  formationIds: ['f-cap-cuisine-2025', 'f-bts-mhr-2025'],
};

/**
 * Second coordo (juin 2026) — démontre la répartition des apprenti·e·s par
 * l'admin : Martine suit l'équipe du Gourmet (Léa, Théo, Sofia), Bernard
 * celle de la Brasserie du Rhône (Minh, Aya, Luca). Chaque coordo ne voit
 * que son périmètre (`Apprenti.coordoId`).
 */
export const coordoBernardPetit: Coordo = {
  id: 'u-coordo-bernard',
  role: 'coordo',
  nom: 'PETIT',
  prenom: 'Bernard',
  email: 'bernard.petit@greta-demo.fr',
  telephone: '01 99 99 99 05',
  formationIds: ['f-cap-cuisine-2025'],
};

export const coordosDemo: Coordo[] = [coordoMartineLefevre, coordoBernardPetit];

export const adminGuillaumeFerreri: Admin = {
  id: 'u-admin-guillaume',
  role: 'admin',
  nom: 'FERRERI',
  prenom: 'Guillaume',
  email: 'guillaume.ferreri@gmail.com',
};

// ─────────────────────────────────────────────────────────────────────────────
// Responsables légaux (13 juillet 2026 — réunion DG, demande 5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les deux responsables légaux de Minh NGUYEN (apprenti MINEUR de démo) —
 * ils attestent ses documents administratifs en lieu et place et consultent
 * son livret en lecture seule. Thi est la responsable par défaut du sélecteur.
 */
export const responsableThiNguyen: ResponsableLegal = {
  id: 'u-responsable-thi',
  role: 'responsable',
  nom: 'NGUYEN',
  prenom: 'Thi',
  email: 'thi.nguyen@demo.fr',
  telephone: '01 99 99 99 21',
  lienParente: 'Mère',
};

export const responsableDucNguyen: ResponsableLegal = {
  id: 'u-responsable-duc',
  role: 'responsable',
  nom: 'NGUYEN',
  prenom: 'Duc',
  email: 'duc.nguyen@demo.fr',
  telephone: '01 99 99 99 22',
  lienParente: 'Père',
};

export const responsablesDemo: ResponsableLegal[] = [responsableThiNguyen, responsableDucNguyen];

/**
 * Catalogue des utilisateurs accessibles via le role switcher (CDC §4.2).
 * 5 rôles : 3 métier + coordo + admin (super-utilisateur).
 *
 * Choix du « représentant » par rôle :
 *   - apprenti  : Léa (cas démo principal)
 *   - maitre    : Karim (3 apprenti·e·s — démontre la valeur "ses apprenti·e·s")
 *   - formateur : Sophie (toute la promo)
 *   - coordo    : Martine
 *   - admin     : Guillaume
 */
export const utilisateursDemo = {
  apprenti: apprentiLeaMartin,
  maitre: maitreKarimBenali,
  formateur: formatriceSophieDubois,
  coordo: coordoMartineLefevre,
  admin: adminGuillaumeFerreri,
  // Responsable légal par défaut (13 juillet 2026 — demande 5) : Thi NGUYEN,
  // mère de Minh (apprenti mineur de démo).
  responsable: responsableThiNguyen,
} as const;

// Note : `getApprentiById` / `getMaitreById` ont été déplacés vers
// `useUtilisateursStore` (sous `getApprentiByIdFromStore` / `getMaitreByIdFromStore`).
// La résolution passe désormais par le store live, qui inclut les utilisateurs
// créés à la volée via /admin/utilisateurs (et pas seulement les fixtures).
