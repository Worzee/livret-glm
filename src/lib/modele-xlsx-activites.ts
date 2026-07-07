import { genererXlsx, type ModeleXlsx } from './generer-xlsx-modele';

/**
 * Gabarit Excel à remplir pour l'import d'un modèle d'activités (juillet
 * 2026 — chantier référentiels/compétences #4, complément post-livraison).
 *
 * Le coordo télécharge ce fichier depuis la page « Modèles d'activités »
 * (ou la modale d'import), le remplit — une activité par ligne — puis le
 * réimporte. Colonnes alignées sur le format attendu par
 * `import-modele-activites` (3 colonnes : Code optionnel, Libellé
 * obligatoire, Description optionnelle ; le mapping activités ↔ compétences
 * se fait ensuite dans l'éditeur — arbitrage pilote Q1).
 *
 * Réutilise le writer XLSX maison (`generer-xlsx-modele`, fflate) — mêmes
 * garanties de compatibilité (Excel 365, LibreOffice, Google Sheets) et de
 * re-parsabilité via `parserXlsxBuffer`.
 */

export const NOM_FICHIER_GABARIT_ACTIVITES = 'modele-activites.xlsx';

export const GABARIT_XLSX_ACTIVITES: ModeleXlsx = {
  entetes: ['Code', 'Libellé', 'Description'],
  // Lignes d'exemple à remplacer par les activités réelles de la formation.
  // Le code est optionnel (généré A1..An s'il est vide) ; seule la colonne
  // Libellé est obligatoire.
  exemples: [
    ['A1', 'Réceptionner et contrôler les livraisons', 'Contrôles, stockage, traçabilité.'],
    ['A2', 'Préparer et organiser son poste de travail', 'Mise en place, hygiène, sécurité.'],
    [
      'A3',
      'Réaliser une production complète',
      'Production selon les consignes et fiches techniques.',
    ],
  ],
};

/**
 * Construit le gabarit en mémoire — `Uint8Array` prêt à être proposé en
 * téléchargement via `Blob` + lien `download` (pattern ImportUtilisateurs).
 */
export function genererXlsxGabaritActivites(): Uint8Array {
  return genererXlsx(GABARIT_XLSX_ACTIVITES);
}
