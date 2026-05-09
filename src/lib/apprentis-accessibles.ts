import type { Apprenti, Coordo, Formateur, Maitre, Utilisateur } from '@/types';

/**
 * Détermine la liste des apprenti·e·s qu'un·e utilisateur·rice peut consulter,
 * en fonction de son rôle et de ses affectations.
 * Référence : cahier des charges v1.3, sections 6 (matrice droits) et 10.3.
 *
 * Règles :
 *   - apprenti  → uniquement lui/elle-même (R3)
 *   - maitre    → ses apprenti·e·s (champ `apprentiIds`)
 *   - formateur → la promo dont il/elle est référent·e (champ `promoIds`,
 *                 résolu via `formationId` de l'apprenti·e)
 *   - coordo    → tous les apprenti·e·s des formations qu'il/elle gère
 *                 (champ `formationIds`)
 *   - admin     → tous les apprenti·e·s du dispositif
 */
export function apprentisAccessibles(
  utilisateur: Utilisateur,
  apprentis: Apprenti[],
): Apprenti[] {
  switch (utilisateur.role) {
    case 'apprenti':
      return apprentis.filter((a) => a.id === utilisateur.id);
    case 'maitre': {
      const ids = new Set((utilisateur as Maitre).apprentiIds);
      return apprentis.filter((a) => ids.has(a.id));
    }
    case 'formateur': {
      const promos = new Set((utilisateur as Formateur).promoIds);
      return apprentis.filter((a) => promos.has(a.formationId));
    }
    case 'coordo': {
      const formations = new Set((utilisateur as Coordo).formationIds);
      return apprentis.filter((a) => formations.has(a.formationId));
    }
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

/**
 * Filtre des apprenti·e·s par requête textuelle (nom, prénom).
 * Insensible à la casse et aux accents (Intl.Collator base-sensitivity).
 * Retourne la liste d'origine si la requête est vide.
 */
export function filtrerApprentis(apprentis: Apprenti[], requete: string): Apprenti[] {
  const q = requete.trim();
  if (!q) return apprentis;
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
  const qn = normalize(q);
  return apprentis.filter((a) => {
    const nomComplet = normalize(`${a.prenom} ${a.nom}`);
    const inverse = normalize(`${a.nom} ${a.prenom}`);
    return nomComplet.includes(qn) || inverse.includes(qn);
  });
}
