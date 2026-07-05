import type { Entreprise } from '@/types';

/**
 * Entreprises d'accueil fictives pour la démonstration (juin 2026).
 *
 * Les ids `e-le-gourmet` / `e-brasserie-rhone` correspondent aux entreprises
 * des maîtres des fixtures — ils résolvent les `apprentisDemo.entrepriseId`
 * existants. Deux entreprises supplémentaires étoffent la liste déroulante.
 */

export const entrepriseLeGourmet: Entreprise = {
  id: 'e-le-gourmet',
  raisonSociale: 'Restaurant Le Gourmet',
  siret: '491 234 567 00018',
  adresse: '12 rue Mercière',
  codePostal: '69002',
  ville: 'Lyon',
};

export const entrepriseBrasserieRhone: Entreprise = {
  id: 'e-brasserie-rhone',
  raisonSociale: 'La Brasserie du Rhône',
  siret: '512 987 654 00021',
  adresse: '3 quai Victor Augagneur',
  codePostal: '69003',
  ville: 'Lyon',
};

export const entrepriseBistrotCanuts: Entreprise = {
  id: 'e-bistrot-canuts',
  raisonSociale: 'Le Bistrot des Canuts',
  siret: '803 456 789 00012',
  adresse: '5 montée de la Grande Côte',
  codePostal: '69001',
  ville: 'Lyon',
};

export const entrepriseTableHalles: Entreprise = {
  id: 'e-table-halles',
  raisonSociale: 'La Table des Halles',
  adresse: '102 cours Lafayette',
  codePostal: '69003',
  ville: 'Lyon',
};

/** Entreprise hôtelière (3 juillet 2026) — accueille une apprentie du BTS MHR. */
export const entrepriseHotelContinental: Entreprise = {
  id: 'e-hotel-continental',
  raisonSociale: 'Hôtel Le Continental',
  siret: '324 654 987 00034',
  adresse: '8 rue Grolée',
  codePostal: '69002',
  ville: 'Lyon',
};

/** Indexées par id pour les lookups O(1). */
export const entreprisesDemo: Record<string, Entreprise> = {
  [entrepriseLeGourmet.id]: entrepriseLeGourmet,
  [entrepriseBrasserieRhone.id]: entrepriseBrasserieRhone,
  [entrepriseBistrotCanuts.id]: entrepriseBistrotCanuts,
  [entrepriseTableHalles.id]: entrepriseTableHalles,
  [entrepriseHotelContinental.id]: entrepriseHotelContinental,
};
