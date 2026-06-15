import type {
  EtatFiche,
  NiveauAppreciation,
  NiveauMaitrise,
  NiveauMaitriseEntreprise,
} from '@/types';

/**
 * Helpers de formatage pour le PDF du livret.
 * Aucune dépendance UI — uniquement chaînes et conversions.
 */

export function formaterDateCourte(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formaterDateLongue(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formaterDateHeure(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function libelleNiveau(
  n: NiveauMaitrise | NiveauMaitriseEntreprise | null | undefined,
): string {
  switch (n) {
    case 'maitrise':
      return 'Maîtrisé';
    case 'partiel':
      return 'En cours';
    case 'non-maitrise':
      return 'Non maîtrisé';
    case 'non-fait':
      return 'Non fait';
    default:
      return '—';
  }
}

export function libelleAppreciation(n: NiveauAppreciation | null | undefined): string {
  switch (n) {
    case 'plusplus':
      return '++';
    case 'plus':
      return '+';
    case 'moins':
      return '−';
    case 'moinsmoins':
      return '−−';
    default:
      return '—';
  }
}

export function libelleEtatFiche(e: EtatFiche): string {
  switch (e) {
    case 'brouillon':
      return 'Brouillon';
    case 'en-cours':
      return 'En cours';
    case 'signee':
      return 'Signée';
    case 'verrouillee':
      return 'Verrouillée';
  }
}

export function couleurEtatFiche(e: EtatFiche): string {
  switch (e) {
    case 'brouillon':
      return '#94a3b8';
    case 'en-cours':
      return '#0e7490';
    case 'signee':
      return '#16a34a';
    case 'verrouillee':
      return '#1e3a8a';
  }
}

export function libelleOuiNon(b: boolean | null | undefined): string {
  if (b === null || b === undefined) return '—';
  return b ? 'Oui' : 'Non';
}

export function nomFichierPdf(nom: string, prenom: string, dateIso?: string): string {
  const safe = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  const date = (dateIso ? new Date(dateIso) : new Date()).toISOString().slice(0, 10);
  return `livret-apprentissage-${safe(nom).toUpperCase()}-${safe(prenom)}-${date}.pdf`;
}

/** Estime grossièrement le nombre de pages pour avertir au-delà de 50. */
export function estimerNombrePages(nbFiches: number, nbHistorique: number): number {
  // Page de garde + organisation + entretien = 3
  // 1 fiche ≈ 1.5 pages (suivi + tableau + signatures)
  // Évaluation finale ≈ 2 pages
  // Annexes ≈ 1 page si historique
  return 3 + Math.ceil(nbFiches * 1.5) + 2 + (nbHistorique > 0 ? 1 : 0);
}
