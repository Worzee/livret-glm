import type { Formation, PeriodeFormation } from '@/types';
import { etablissementSiteDiderot } from './etablissements';

/**
 * Formations fictives de démonstration.
 * Référence : cahier des charges v1.3, sections 24 et 30 (annexes).
 *
 * Refonte mai 2026 (chantier #1) : la formation porte désormais le
 * planning des périodes d'alternance — commun à tous les apprenti·e·s de
 * la promo. Chaque période matérialise une fiche dans chaque livret.
 */

/**
 * Planning des 3 périodes de démo pour la CAP Cuisine 2025-2026.
 * Reproduit les dates utilisées par les livrets existants (Léa, Théo, ...)
 * pour que les fiches déjà signées se rattachent à leur période parente.
 */
export const periodesCapCuisine: PeriodeFormation[] = [
  {
    id: 'pf-cap-cuisine-2025-p1',
    numero: 1,
    dateDebut: '2025-09-02',
    dateFin: '2025-12-20',
  },
  {
    id: 'pf-cap-cuisine-2025-p2',
    numero: 2,
    dateDebut: '2026-01-06',
    dateFin: '2026-02-14',
  },
  {
    id: 'pf-cap-cuisine-2025-p3',
    numero: 3,
    dateDebut: '2026-03-02',
    dateFin: '2026-04-11',
  },
];

/**
 * Planning des 2 périodes en CENTRE de formation (17 juin 2026) — regroupements
 * au CFA, distincts des périodes en entreprise. Les compétences y sont
 * évaluées par le formateur référent.
 */
export const periodesCentreCapCuisine: PeriodeFormation[] = [
  {
    id: 'pf-cap-cuisine-2025-c1',
    numero: 1,
    titre: "Regroupement d'automne",
    dateDebut: '2025-10-06',
    dateFin: '2025-10-17',
  },
  {
    id: 'pf-cap-cuisine-2025-c2',
    numero: 2,
    titre: "Regroupement d'hiver",
    dateDebut: '2026-01-19',
    dateFin: '2026-01-30',
  },
];

export const formationCapCuisine: Formation = {
  id: 'f-cap-cuisine-2025',
  intitule: 'CAP Cuisine',
  niveau: 'CAP',
  annee: '2025-2026',
  referentielId: 'ref-cap-cuisine',
  dateDebut: '2025-09-02',
  dateFin: '2027-09-01',
  lieuId: etablissementSiteDiderot.id,
  periodes: periodesCapCuisine,
  periodesCentre: periodesCentreCapCuisine,
  // Retours coordos juin 2026 : nombre d'entretiens tripartites (1 à 4).
  // Le CAP Cuisine reste au défaut historique de 2.
  nombreEntretiens: 2,
  // 13 juin 2026 : aucune question retirée par défaut — toutes les questions
  // de la banque sont présentes et obligatoires dans les entretiens.
  questionsRetirees: [],
};

/**
 * Toutes les formations connues, indexées par id.
 * Les sprints suivants permettront au coordo d'en créer de nouvelles.
 */
export const formationsDemo: Record<string, Formation> = {
  [formationCapCuisine.id]: formationCapCuisine,
};
