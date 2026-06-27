import type { BlocCompetences, Competence } from '@/types';

/**
 * Un groupe de compétences-feuilles partageant la même sous-famille, ou sans
 * sous-famille pour les feuilles directes d'un bloc.
 */
export interface GroupeCompetences {
  /** Sous-famille (regroupement non évaluable), ou undefined pour une feuille directe. */
  sousFamille?: string;
  competences: Competence[];
}

/**
 * Regroupe les compétences-feuilles d'un bloc par sous-famille **en préservant
 * l'ordre d'apparition**. Une nouvelle entrée est créée à chaque changement de
 * sous-famille : les feuilles directes (sans sous-famille) intercalées entre
 * deux sous-familles restent donc à leur place d'origine (référentiel mixte).
 *
 * Permet aux vues (page Référentiels, grille finale, sélecteur, PDF) d'afficher
 * la hiérarchie Bloc → sous-famille → feuille par indentation, sans dupliquer
 * la logique de groupement.
 */
export function grouperParSousFamille(bloc: BlocCompetences): GroupeCompetences[] {
  const groupes: GroupeCompetences[] = [];
  for (const c of bloc.competences) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.sousFamille === c.sousFamille) {
      dernier.competences.push(c);
    } else {
      groupes.push({ sousFamille: c.sousFamille, competences: [c] });
    }
  }
  return groupes;
}
