import type { Admin, Apprenti, Coordo, Formateur, Maitre } from '@/types';

/**
 * Utilisateurs fictifs de démonstration.
 * Référence : cahier des charges v1.3, section 24 (seed data).
 *
 * Promo CAP Cuisine 2025-2026 — 6 apprenti·e·s répartis sur 2 entreprises :
 *   - Le Gourmet (Lyon 8e) → maître Karim BENALI : Léa, Théo, Sofia
 *   - La Brasserie du Rhône (Lyon 2e) → maître Hélène ROCHE : Minh, Aya, Luca
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
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
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
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
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
  maitreApprentissageId: 'u-maitre-karim',
  formateurReferentId: 'u-formateur-sophie',
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
  dateNaissance: '2007-02-19',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-brasserie-rhone',
  maitreApprentissageId: 'u-maitre-helene',
  formateurReferentId: 'u-formateur-sophie',
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
  maitreApprentissageId: 'u-maitre-helene',
  formateurReferentId: 'u-formateur-sophie',
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
  maitreApprentissageId: 'u-maitre-helene',
  formateurReferentId: 'u-formateur-sophie',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
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
  entrepriseId: 'e-le-gourmet',
  apprentiIds: [
    apprentiLeaMartin.id,
    apprentiTheoDubois.id,
    apprentiSofiaPereira.id,
  ],
};

export const maitreHeleneRoche: Maitre = {
  id: 'u-maitre-helene',
  role: 'maitre',
  nom: 'ROCHE',
  prenom: 'Hélène',
  email: 'helene.roche@brasserierhone.demo',
  telephone: '01 99 99 99 22',
  entrepriseId: 'e-brasserie-rhone',
  apprentiIds: [
    apprentiMinhNguyen.id,
    apprentiAyaKouame.id,
    apprentiLucaBianchi.id,
  ],
};

export const maitresDemo: Maitre[] = [maitreKarimBenali, maitreHeleneRoche];

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
  formationIds: ['f-cap-cuisine-2025'],
};

export const adminGuillaumeFerreri: Admin = {
  id: 'u-admin-guillaume',
  role: 'admin',
  nom: 'FERRERI',
  prenom: 'Guillaume',
  email: 'guillaume.ferreri@gmail.com',
};

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
} as const;

/** Lookup d'un apprenti·e par id. Retourne `undefined` si introuvable. */
export function getApprentiById(id: string): Apprenti | undefined {
  return apprentisDemo.find((a) => a.id === id);
}

/** Lookup d'un maître par id. Retourne `undefined` si introuvable. */
export function getMaitreById(id: string): Maitre | undefined {
  return maitresDemo.find((m) => m.id === id);
}
