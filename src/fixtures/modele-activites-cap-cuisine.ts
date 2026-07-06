import type { ModeleActivites } from '@/types';

/**
 * Modèle d'activités de démonstration — CAP Cuisine (juillet 2026, chantier
 * référentiels/compétences #4).
 *
 * 6 activités professionnelles couvrant les 10 compétences du référentiel
 * `ref-cap-cuisine` (balayage complet 10/10, hors exclusions) — la promo CAP
 * Cuisine 2025-2026 vit en mode d'évaluation « activités » (arbitrage pilote
 * Q9). Le mapping est celui qu'un coordo aurait saisi dans l'éditeur.
 */
export const modeleActivitesCapCuisine: ModeleActivites = {
  id: 'act-cap-cuisine',
  nom: 'Activités CAP Cuisine',
  referentielId: 'ref-cap-cuisine',
  source: 'fixture',
  activites: [
    {
      id: 'act-cap-a1',
      code: 'A1',
      libelle: 'Réceptionner et stocker les livraisons du jour',
      description: 'Contrôle des livraisons, rangement HACCP, rotation des stocks.',
      competenceIds: ['c1-1'],
    },
    {
      id: 'act-cap-a2',
      code: 'A2',
      libelle: 'Mettre en place et entretenir son poste de travail',
      description: 'Mise en place, nettoyage, démarche qualité-hygiène-environnement.',
      competenceIds: ['c1-2', 'c1-3'],
    },
    {
      id: 'act-cap-a3',
      code: 'A3',
      libelle: 'Réaliser une production culinaire complète',
      description: 'Techniques de base et production selon fiches techniques.',
      competenceIds: ['c2-1', 'c2-2'],
    },
    {
      id: 'act-cap-a4',
      code: 'A4',
      libelle: 'Dresser, contrôler et envoyer pendant le service',
      description: 'Contrôle qualité, dressage, communication avec la brigade et la salle.',
      competenceIds: ['c2-3', 'c2-4'],
    },
    {
      id: 'act-cap-a5',
      code: 'A5',
      libelle: 'Réaliser les bases de pâtisserie de restaurant',
      description: 'Pâtes de base, crèmes et appareils.',
      competenceIds: ['c3-1', 'c3-2'],
    },
    {
      id: 'act-cap-a6',
      code: 'A6',
      libelle: 'Préparer et envoyer les desserts à l’assiette',
      description: 'Composition, sauçage, décor et envoi.',
      competenceIds: ['c3-3'],
    },
  ],
};
