import type { Referentiel } from '@/types';

/**
 * Référentiel BTS Management en Hôtellerie-Restauration — extrait
 * représentatif à **3 niveaux** (Bloc → Sous-famille → Compétence),
 * comme les référentiels importés depuis Pronote (27 juin 2026).
 *
 * Démontre en démo :
 *   - l'affichage hiérarchique « libellé seul » (sous-familles en
 *     regroupements indentés) sur tous les écrans et le PDF ;
 *   - la structure MIXTE : certaines compétences sont des feuilles
 *     directes du bloc (sans sous-famille), comme dans les CSV réels.
 *
 * L'évaluation porte toujours sur les feuilles (`bloc.competences`).
 */
export const referentielBtsMhr: Referentiel = {
  id: 'ref-bts-mhr',
  formation: 'BTS Management en Hôtellerie-Restauration',
  niveauxColonnes: 3,
  blocs: [
    {
      id: 'mhr-b1',
      code: 'MHR01',
      libelle: 'Production et service en restauration',
      competences: [
        {
          id: 'mhr1-1',
          code: 'MHR1.1',
          sousFamille: 'Relation client et commercialisation',
          libelle: 'Accueillir et prendre en charge le client',
          description: 'De la réservation à la prise de congé, en français et en anglais.',
        },
        {
          id: 'mhr1-2',
          code: 'MHR1.2',
          sousFamille: 'Relation client et commercialisation',
          libelle: 'Conseiller le client et vendre les prestations',
          description: 'Argumentation, ventes additionnelles, gestion des réclamations.',
        },
        {
          id: 'mhr1-3',
          code: 'MHR1.3',
          sousFamille: 'Service des mets et des boissons',
          libelle: 'Organiser et réaliser le service des mets',
          description: 'Mise en place, service à table, coordination avec la cuisine.',
        },
        {
          id: 'mhr1-4',
          code: 'MHR1.4',
          sousFamille: 'Service des mets et des boissons',
          libelle: 'Réaliser le service des boissons et les accords',
          description: 'Bar, sommellerie de base, accords mets-boissons.',
        },
        {
          id: 'mhr1-5',
          code: 'MHR1.5',
          libelle: 'Appliquer la démarche qualité et la réglementation',
          description: 'Hygiène, sécurité, allergènes, affichages obligatoires.',
        },
      ],
    },
    {
      id: 'mhr-b2',
      code: 'MHR02',
      libelle: "Animation et gestion d'équipe",
      competences: [
        {
          id: 'mhr2-1',
          code: 'MHR2.1',
          sousFamille: "Animation d'équipe",
          libelle: 'Animer un briefing et coordonner la brigade de salle',
          description: 'Briefing de service, répartition des rangs, débriefing.',
        },
        {
          id: 'mhr2-2',
          code: 'MHR2.2',
          sousFamille: "Animation d'équipe",
          libelle: 'Accompagner la montée en compétences des équipiers',
          description: 'Tutorat des commis et stagiaires, transmission des standards.',
        },
        {
          id: 'mhr2-3',
          code: 'MHR2.3',
          libelle: 'Élaborer les plannings dans le respect du droit du travail',
          description: 'Rotations, coupures, repos hebdomadaires, saisonnalité.',
        },
      ],
    },
    {
      id: 'mhr-b3',
      code: 'MHR03',
      libelle: "Gestion de l'exploitation",
      competences: [
        {
          id: 'mhr3-1',
          code: 'MHR3.1',
          sousFamille: 'Pilotage économique',
          libelle: 'Calculer et analyser les coûts et les ratios',
          description: 'Coût matière, ratios personnel, ticket moyen, marge brute.',
        },
        {
          id: 'mhr3-2',
          code: 'MHR3.2',
          sousFamille: 'Pilotage économique',
          libelle: "Contribuer à l'élaboration des menus et des cartes",
          description: 'Structure de gamme, prix psychologiques, saisonnalité.',
        },
        {
          id: 'mhr3-3',
          code: 'MHR3.3',
          libelle: 'Gérer les approvisionnements et les stocks',
          description: 'Commandes, réceptions, inventaires, lutte anti-gaspillage.',
        },
      ],
    },
  ],
};
