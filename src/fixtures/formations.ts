import type { Formation } from '@/types';
import { etablissementSiteDiderot } from './etablissements';

/**
 * Formations fictives de démonstration.
 * Référence : cahier des charges v1.3, sections 24 et 30 (annexes).
 *
 * Refonte mai 2026 : `lieu` inline remplacé par `lieuId` qui pointe vers
 * une entrée du store `useEtablissementsStore`.
 */

export const formationCapCuisine: Formation = {
  id: 'f-cap-cuisine-2025',
  intitule: 'CAP Cuisine',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-cap-cuisine',
  dateDebut: '2025-09-02',
  dateFin: '2027-09-01',
  lieuId: etablissementSiteDiderot.id,
};

/**
 * Toutes les formations connues, indexées par id.
 * Les sprints suivants permettront au coordo d'en créer de nouvelles.
 */
export const formationsDemo: Record<string, Formation> = {
  [formationCapCuisine.id]: formationCapCuisine,
};
