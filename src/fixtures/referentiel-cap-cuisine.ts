import type { Referentiel } from '@/types';

/**
 * Référentiel CAP Cuisine — extrait représentatif.
 * Référence : cahier des charges v1.3, Annexe A.
 *
 * Pour la maquette : 3 blocs × 3-4 compétences = 10 compétences au total,
 * + 6 attitudes professionnelles. Suffit à démontrer la co-édition sans
 * surcharger l'écran de démo.
 */
export const referentielCapCuisine: Referentiel = {
  id: 'ref-cap-cuisine',
  formation: 'CAP Cuisine',
  blocs: [
    {
      id: 'bc1',
      code: 'BC01',
      libelle: 'Organisation de la production de cuisine',
      competences: [
        {
          id: 'c1-1',
          code: 'C1.1',
          libelle: 'Réceptionner et stocker la marchandise',
          description:
            "Contrôler la conformité des livraisons, ranger selon les règles HACCP et la rotation des stocks.",
        },
        {
          id: 'c1-2',
          code: 'C1.2',
          libelle: 'Préparer, organiser et maintenir en état son poste de travail',
          description: "Mettre en place sa mise en place, entretenir l'environnement de travail.",
        },
        {
          id: 'c1-3',
          code: 'C1.3',
          libelle: 'Appliquer les démarches qualité, hygiène, santé, environnement',
          description: 'Respecter les protocoles HACCP, gérer les déchets, économiser les fluides.',
        },
      ],
    },
    {
      id: 'bc2',
      code: 'BC02',
      libelle: 'Réalisation de la production de cuisine',
      competences: [
        {
          id: 'c2-1',
          code: 'C2.1',
          libelle: 'Maîtriser les techniques culinaires de base',
          description: "Cuissons, sauces, taillages, fonds, jus.",
        },
        {
          id: 'c2-2',
          code: 'C2.2',
          libelle: 'Réaliser une production culinaire',
          description: 'Entrées, plats, desserts selon une fiche technique.',
        },
        {
          id: 'c2-3',
          code: 'C2.3',
          libelle: 'Analyser, contrôler la qualité, dresser et envoyer',
          description: 'Goûter, ajuster, dresser, communiquer avec le service.',
        },
        {
          id: 'c2-4',
          code: 'C2.4',
          libelle: 'Communiquer en situation professionnelle',
          description: 'Brigade, service, fournisseurs.',
        },
      ],
    },
    {
      id: 'bc3',
      code: 'BC03',
      libelle: 'Pâtisserie de restaurant',
      competences: [
        {
          id: 'c3-1',
          code: 'C3.1',
          libelle: 'Réaliser des pâtes de base',
          description: 'Brisée, sablée, à choux, feuilletée.',
        },
        {
          id: 'c3-2',
          code: 'C3.2',
          libelle: 'Réaliser des crèmes et appareils',
          description: 'Pâtissière, anglaise, mousses, parfaits.',
        },
        {
          id: 'c3-3',
          code: 'C3.3',
          libelle: "Dresser et envoyer un dessert à l'assiette",
          description: 'Composition, sauçage, décor.',
        },
      ],
    },
  ],
  attitudes: [
    { id: 'a1', libelle: 'Ponctualité et assiduité' },
    { id: 'a2', libelle: 'Respect des consignes et de la hiérarchie' },
    { id: 'a3', libelle: 'Qualité du travail fourni' },
    { id: 'a4', libelle: "Intégration dans l'équipe" },
    { id: 'a5', libelle: "Prise d'initiative et autonomie" },
    { id: 'a6', libelle: 'Communication professionnelle' },
  ],
};
