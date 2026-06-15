import type { Apprenti, Coordo, Etablissement, Formateur, Formation, Maitre, Role } from '@/types';

/**
 * Filtrage des établissements visibles côté `/livret/pronote` selon le rôle
 * actif et l'identité de l'utilisateur·rice connecté·e.
 * Référence : refonte mai 2026.
 *
 * Règles :
 *   - **admin** : tous les établissements
 *   - **coordo** : établissements des formations dont il/elle a la charge
 *                  (via `Coordo.formationIds`)
 *   - **formateur** : établissements des promos qu'il/elle encadre
 *                     (via `Formateur.promoIds`)
 *   - **apprenti·e** : l'établissement de sa propre formation
 *   - **maître** : les établissements des formations de ses apprenti·e·s
 *
 * Si l'établissement n'a pas d'`urlPronote`, il est inclus dans la liste mais
 * sans bouton « Ouvrir » (la page utilisateur affichera la mention « URL non
 * configurée »). Cela évite à l'utilisateur·rice de croire que rien ne lui
 * est rattaché alors qu'il y a juste un trou de config admin.
 *
 * Pure fonction — testable sans React ni store.
 */

interface Contexte {
  role: Role;
  utilisateurId: string;
  formations: ReadonlyArray<Formation>;
  apprentis: ReadonlyArray<Apprenti>;
  maitres: ReadonlyArray<Maitre>;
  formateurs: ReadonlyArray<Formateur>;
  coordos: ReadonlyArray<Coordo>;
  etablissements: ReadonlyArray<Etablissement>;
}

export function etablissementsAccessibles(ctx: Contexte): Etablissement[] {
  const {
    role,
    utilisateurId,
    formations,
    apprentis,
    maitres,
    formateurs,
    coordos,
    etablissements,
  } = ctx;

  // Admin : tout.
  if (role === 'admin') {
    return trierParNom(etablissements);
  }

  // Détermine les ids de formations concernées par l'utilisateur·rice actif·ve.
  const idsFormations = new Set<string>();

  switch (role) {
    case 'apprenti': {
      const app = apprentis.find((a) => a.id === utilisateurId);
      if (app?.formationId) idsFormations.add(app.formationId);
      break;
    }
    case 'maitre': {
      const ma = maitres.find((m) => m.id === utilisateurId);
      if (ma) {
        for (const appId of ma.apprentiIds) {
          const app = apprentis.find((a) => a.id === appId);
          if (app?.formationId) idsFormations.add(app.formationId);
        }
      }
      break;
    }
    case 'formateur': {
      const fo = formateurs.find((f) => f.id === utilisateurId);
      if (fo) {
        for (const id of fo.promoIds) idsFormations.add(id);
      }
      break;
    }
    case 'coordo': {
      const co = coordos.find((c) => c.id === utilisateurId);
      if (co) {
        for (const id of co.formationIds) idsFormations.add(id);
      }
      break;
    }
  }

  // Collecte les `lieuId` des formations concernées.
  const idsLieux = new Set<string>();
  for (const f of formations) {
    if (idsFormations.has(f.id) && f.lieuId) idsLieux.add(f.lieuId);
  }

  return trierParNom(etablissements.filter((e) => idsLieux.has(e.id)));
}

function trierParNom(liste: ReadonlyArray<Etablissement>): Etablissement[] {
  return [...liste].sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR'));
}
