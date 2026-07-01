import type { Apprenti, Formateur, Maitre, Utilisateur } from '@/types';

/**
 * Détermine la liste des apprenti·e·s qu'un·e utilisateur·rice peut consulter,
 * en fonction de son rôle et de ses affectations.
 * Référence : cahier des charges v1.3, sections 6 (matrice droits) et 10.3.
 *
 * Règles :
 *   - apprenti  → uniquement lui/elle-même (R3)
 *   - maitre    → ses apprenti·e·s (champ `apprentiIds`)
 *   - formateur → la promo dont il/elle est référent·e (champ `promoIds`,
 *                 résolu via `formationId` de l'apprenti·e) **ET** les
 *                 apprenti·e·s dont il/elle est directement référent·e
 *                 (`Apprenti.formateurReferentId` — fix 1ᵉʳ juillet 2026 :
 *                 `promoIds` n'est pas maintenu pour les formations créées en
 *                 ligne, une apprentie devenait invisible de son formateur)
 *   - coordo    → les apprenti·e·s qui lui sont affecté·e·s par l'admin
 *                 (champ `Apprenti.coordoId` — juin 2026 ; un·e apprenti·e
 *                 sans coordo n'est visible que de l'admin)
 *   - admin     → tous les apprenti·e·s du dispositif
 */
export function apprentisAccessibles(utilisateur: Utilisateur, apprentis: Apprenti[]): Apprenti[] {
  switch (utilisateur.role) {
    case 'apprenti':
      return apprentis.filter((a) => a.id === utilisateur.id);
    case 'maitre': {
      const ids = new Set((utilisateur as Maitre).apprentiIds);
      return apprentis.filter((a) => ids.has(a.id));
    }
    case 'formateur': {
      const promos = new Set((utilisateur as Formateur).promoIds);
      return apprentis.filter(
        (a) => promos.has(a.formationId) || a.formateurReferentId === utilisateur.id,
      );
    }
    case 'coordo':
      return apprentis.filter((a) => a.coordoId === utilisateur.id);
    case 'admin':
      return [...apprentis];
  }
}

/** Tri canonique par NOM puis prénom, sensible aux accents fr-FR. */
export function trierApprentis(apprentis: Apprenti[]): Apprenti[] {
  const collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });
  return [...apprentis].sort(
    (a, b) => collator.compare(a.nom, b.nom) || collator.compare(a.prenom, b.prenom),
  );
}

/** Vue minimale d'une formation pour le tri/filtre par année du tableau de bord. */
type FormationAvecAnnee = { annee: string };

/**
 * Années académiques distinctes des formations des apprenti·e·s donnés,
 * triées de la plus récente à la plus ancienne (retours coordos juin 2026 —
 * tableau de bord multi-promos). Une formation introuvable est ignorée.
 */
export function anneesFormationsDisponibles(
  apprentis: Apprenti[],
  formations: Record<string, FormationAvecAnnee>,
): string[] {
  const annees = new Set<string>();
  for (const a of apprentis) {
    const annee = formations[a.formationId]?.annee;
    if (annee) annees.add(annee);
  }
  // Format homogène « AAAA-AAAA » → le tri lexicographique inversé donne la
  // promo la plus récente en premier.
  return [...annees].sort().reverse();
}

/**
 * Filtre les apprenti·e·s par année académique de leur formation.
 * `'toutes'` retourne la liste d'origine (y compris les apprenti·e·s dont la
 * formation est introuvable — on ne masque jamais de carte par défaut).
 */
export function filtrerParAnneeFormation(
  apprentis: Apprenti[],
  formations: Record<string, FormationAvecAnnee>,
  annee: string | 'toutes',
): Apprenti[] {
  if (annee === 'toutes') return apprentis;
  return apprentis.filter((a) => formations[a.formationId]?.annee === annee);
}

/**
 * Tri du tableau de bord : année de formation décroissante (promo la plus
 * récente d'abord), puis NOM/prénom. Les apprenti·e·s sans formation résolue
 * passent en fin de liste.
 */
export function trierApprentisParAnneePuisNom(
  apprentis: Apprenti[],
  formations: Record<string, FormationAvecAnnee>,
): Apprenti[] {
  const collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });
  return [...apprentis].sort((a, b) => {
    const anneeA = formations[a.formationId]?.annee ?? '';
    const anneeB = formations[b.formationId]?.annee ?? '';
    return (
      anneeB.localeCompare(anneeA) ||
      collator.compare(a.nom, b.nom) ||
      collator.compare(a.prenom, b.prenom)
    );
  });
}

/** Vue minimale d'une formation pour le groupement du tableau de bord. */
type FormationPourGroupe = { intitule: string; annee: string };

export interface GroupeFormation {
  /** `''` quand la formation de l'apprenti·e est introuvable (non affecté·e). */
  formationId: string;
  /** « CAP Cuisine (2025-2026) » — ou « Sans formation » pour le groupe orphelin. */
  libelle: string;
  apprentis: Apprenti[];
}

/**
 * Regroupe les apprenti·e·s par formation pour le tableau de bord
 * (1ᵉʳ juillet 2026 — réunion direction : sections dépliables par formation).
 *
 *   - Groupes triés par année décroissante (promo récente d'abord) puis
 *     intitulé fr-FR ; les apprenti·e·s sans formation résolue terminent la
 *     liste dans un groupe « Sans formation ».
 *   - Apprenti·e·s triés par NOM/prénom au sein de chaque groupe.
 */
export function grouperParFormation(
  apprentis: Apprenti[],
  formations: Record<string, FormationPourGroupe>,
): GroupeFormation[] {
  const parId = new Map<string, Apprenti[]>();
  for (const a of apprentis) {
    const id = formations[a.formationId] ? a.formationId : '';
    const liste = parId.get(id);
    if (liste) liste.push(a);
    else parId.set(id, [a]);
  }
  const collator = new Intl.Collator('fr-FR', { sensitivity: 'base' });
  return [...parId.entries()]
    .map(([formationId, liste]): GroupeFormation => {
      const f = formations[formationId];
      return {
        formationId,
        libelle: f ? `${f.intitule} (${f.annee})` : 'Sans formation',
        apprentis: trierApprentis(liste),
      };
    })
    .sort((a, b) => {
      // « Sans formation » toujours en dernier.
      if (!a.formationId !== !b.formationId) return a.formationId ? -1 : 1;
      const anneeA = formations[a.formationId]?.annee ?? '';
      const anneeB = formations[b.formationId]?.annee ?? '';
      return anneeB.localeCompare(anneeA) || collator.compare(a.libelle, b.libelle);
    });
}

/**
 * Filtre des apprenti·e·s par requête textuelle (nom, prénom).
 * Insensible à la casse et aux accents (Intl.Collator base-sensitivity).
 * Retourne la liste d'origine si la requête est vide.
 */
export function filtrerApprentis(apprentis: Apprenti[], requete: string): Apprenti[] {
  const q = requete.trim();
  if (!q) return apprentis;
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const qn = normalize(q);
  return apprentis.filter((a) => {
    const nomComplet = normalize(`${a.prenom} ${a.nom}`);
    const inverse = normalize(`${a.nom} ${a.prenom}`);
    return nomComplet.includes(qn) || inverse.includes(qn);
  });
}
