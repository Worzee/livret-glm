import type { Formation } from '@/types';

/**
 * Formations fictives de démonstration.
 * Référence : cahier des charges v1.3, sections 24 et 30 (annexes).
 */

export const formationCapCuisine: Formation = {
  id: 'f-cap-cuisine-2025',
  intitule: 'CAP Cuisine',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-cap-cuisine',
  dateDebut: '2025-09-02',
  dateFin: '2027-09-01',
  lieu: {
    nom: 'GRETA Lyon Métropole — Site Diderot',
    adresse: '41 rue Antoine Lumière',
    codePostal: '69008',
    ville: 'Lyon',
  },
};

/**
 * Toutes les formations connues, indexées par id.
 * Les sprints suivants permettront au coordo d'en créer de nouvelles.
 */
export const formationsDemo: Record<string, Formation> = {
  [formationCapCuisine.id]: formationCapCuisine,
};
