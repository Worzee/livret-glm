import type { Etablissement } from '@/types';

/**
 * Établissements (lieux de formation) fictifs pour la démonstration.
 * Référence : refonte mai 2026.
 *
 * Pas d'URL Pronote pré-configurée — l'administrateur·rice les renseigne
 * depuis la page /admin/etablissements après la première charge.
 */

export const etablissementSiteDiderot: Etablissement = {
  id: 'eta-site-diderot',
  nom: 'GRETA Lyon Métropole — Site Diderot',
  adresse: '41 rue Antoine Lumière',
  codePostal: '69008',
  ville: 'Lyon',
};

/** 2ᵉ site (3 juillet 2026) — accueille le BTS MHR, démontre le multi-sites. */
export const etablissementSiteBellecour: Etablissement = {
  id: 'eta-site-bellecour',
  nom: 'GRETA Lyon Métropole — Site Bellecour',
  adresse: '18 place Bellecour',
  codePostal: '69002',
  ville: 'Lyon',
};

/** Indexée par id pour les lookups O(1). */
export const etablissementsDemo: Record<string, Etablissement> = {
  [etablissementSiteDiderot.id]: etablissementSiteDiderot,
  [etablissementSiteBellecour.id]: etablissementSiteBellecour,
};
