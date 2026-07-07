import type { Apprenti, Livret } from '@/types';

/**
 * Réparation des livrets manquants (7 juillet 2026 — bug pilote).
 *
 * La politique de migration de l'étape 1 réinitialise chaque store aux
 * fixtures lors d'un bump de `VERSION_SCHEMA` — **store par store**. Un bump
 * de `livret-donnees` efface donc les livrets des apprenti·e·s créé·e·s par
 * l'utilisateur, alors que `livret-utilisateurs` (non bumpé) conserve leurs
 * comptes : l'apprenti·e apparaît au tableau de bord mais l'ouverture de son
 * livret retombe sur « Aucun·e apprenti·e sélectionné·e ».
 *
 * `apprentisSansLivret` identifie ces orphelin·e·s ;
 * `useLivretStore.reparerLivretsManquants()` recrée un livret vierge pour
 * chacun·e (planning hérité de la formation, sélections réalignées) — appelé
 * au montage de l'application (cf. `AppShell`).
 */
export function apprentisSansLivret(
  apprentis: Record<string, Apprenti>,
  livrets: Record<string, Livret>,
): Apprenti[] {
  const couverts = new Set(Object.values(livrets).map((l) => l.apprentiId));
  return Object.values(apprentis).filter((a) => !couverts.has(a.id));
}
