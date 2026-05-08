import type { Admin, Apprenti, Coordo, Formateur, Maitre } from '@/types';

/**
 * Utilisateurs fictifs de démonstration.
 * Référence : cahier des charges v1.3, section 24 (seed data).
 *
 * Sprint 1 : un seul apprenti·e (Léa MARTIN), un maître, un formateur.
 * Les sprints suivants étofferont à 6 apprenti·e·s.
 */

export const apprentiLeaMartin: Apprenti = {
  id: 'u-apprenti-1',
  role: 'apprenti',
  nom: 'MARTIN',
  prenom: 'Léa',
  email: 'lea.martin@demo.fr',
  telephone: '01 99 99 99 01',
  dateNaissance: '2007-04-15',
  formationId: 'f-cap-cuisine-2025',
  entrepriseId: 'e-le-gourmet',
  maitreApprentissageId: 'u-maitre-1',
  formateurReferentId: 'u-formateur-1',
  contratDebut: '2025-09-02',
  contratFin: '2027-09-01',
};

export const maitreKarimBenali: Maitre = {
  id: 'u-maitre-1',
  role: 'maitre',
  nom: 'BENALI',
  prenom: 'Karim',
  email: 'karim.benali@gourmet.demo',
  telephone: '01 99 99 99 02',
  entrepriseId: 'e-le-gourmet',
  apprentiIds: ['u-apprenti-1'],
};

export const formatriceSophieDubois: Formateur = {
  id: 'u-formateur-1',
  role: 'formateur',
  nom: 'DUBOIS',
  prenom: 'Sophie',
  email: 'sophie.dubois@greta-demo.fr',
  telephone: '01 99 99 99 03',
  promoIds: ['f-cap-cuisine-2025'],
};

export const coordoMartineLefevre: Coordo = {
  id: 'u-coordo-1',
  role: 'coordo',
  nom: 'LEFÈVRE',
  prenom: 'Martine',
  email: 'martine.lefevre@greta-demo.fr',
  telephone: '01 99 99 99 04',
  formationIds: ['f-cap-cuisine-2025'],
};

export const adminGuillaumeFerreri: Admin = {
  id: 'u-admin-1',
  role: 'admin',
  nom: 'FERRERI',
  prenom: 'Guillaume',
  email: 'guillaume.ferreri@gmail.com',
};

/**
 * Catalogue des utilisateurs accessibles via le role switcher (CDC §4.2).
 * 5 rôles : 3 métier + coordo + admin (super-utilisateur).
 */
export const utilisateursDemo = {
  apprenti: apprentiLeaMartin,
  maitre: maitreKarimBenali,
  formateur: formatriceSophieDubois,
  coordo: coordoMartineLefevre,
  admin: adminGuillaumeFerreri,
} as const;
