# Livret d'apprentissage — GRETA Lyon Métropole

Maquette fonctionnelle (étape 1 du CDC v1.3, livrée + vagues post-livraison) d'un livret
d'apprentissage dématérialisé. SPA Vite + React 18 + TypeScript strict, 10 stores Zustand
persistés en localStorage, **sans backend ni auth réelle** (c'est l'étape 2). Déployée sur
https://livret-glm.duckdns.org (Basic Auth). Pilote métier : Guillaume FERRERI.

## Où chercher quoi

- **État complet du projet** (modules livrés, règles R1-R24, architecture, reste à faire) :
  `PROJECT-STATUS.md` — LE document de référence, à maintenir à chaque vague
- Conventions de code : `CONVENTIONS.md` · Script de démo : `DEMO.md` (à réécrire, périmé)
- Pistes étape 2 (SSO, comptes, mots de passe) : `TODO-etape-2.md`, `playbook-sso-entra-greta.md`,
  `chantier-creation-comptes.md`, `conformite-rgpd.md`
- **Chantier en cours — refonte référentiels/compétences** : `chantier-referentiels-competences.md`
  (carte du sous-système + questions de cadrage + checklist)
- `STACK_GRETA_LYON.md` et `_kit-deploiement-o2switch/` : doctrine portefeuille Greta,
  **volontairement non commités** — ne pas les ajouter à un commit du livret

## Commandes

```bash
npm run dev            # Vite sur :5173
npm test               # Vitest (611 tests au 2026-07-06)
npm run e2e            # build + Playwright (196 tests) — c'est LA validation de référence
npm run typecheck      # tsc --noEmit — ⚠ le build prod (tsc -b) voit PLUS que lui
npm run build          # à passer avant tout push
npm run lint && npm run format
bash scripts/deploy.sh          # build + déploiement VPS
bash scripts/verifier-vps.sh    # 11 contrôles préflight (doit rendre 11/11)
```

## Doctrine de travail (rituel d'une vague de modifications)

1. **Logique métier = lib pure dans `src/lib/` en TDD** ; les composants sont testés par
   les E2E Playwright. Sélecteurs E2E stables via `data-testid`.
2. **Migration localStorage = bump de `VERSION_SCHEMA`** du store touché (reset complet aux
   fixtures, pas de migration logicielle) + commentaire de version daté dans le store.
   Toute modification de fixtures persiste seulement après bump.
3. **Droits** : toute nouvelle capacité passe par une ressource dans `src/lib/droits.ts`
   (matrice × 5 rôles) + test dans `droits.test.ts`. Doctrine : coordo/admin n'ont AUCUN
   droit pédagogique (saisies, signatures, évaluations).
4. **Vérification visuelle** : spec Playwright temporaire qui capture des screenshots (ou
   télécharge le PDF et le rasterise via pdf.js CDN), lu puis supprimé. Ne JAMAIS lancer
   deux suites Playwright en parallèle (port 4173 et localStorage partagés → échecs en masse).
5. **Documentation à chaque vague** : PROJECT-STATUS.md (ligne « Dernière mise à jour »,
   tableau des vagues §0, versions §2, bloc module §4, compteurs de tests §6, arborescence §7)
   + compteurs du README. Les compteurs de tests doivent refléter la réalité mesurée.
6. **Livraison** : commit conventionnel en français (`feat(scope): …`, corps détaillé),
   push sur `main`, puis `deploy.sh` + `verifier-vps.sh` (11/11). Le pilote attend ce cycle
   complet en fin de vague.

## Pièges connus

- `tsc --noEmit` passe mais `npm run build` échoue : typages plus stricts en build (ex.
  unions de props react-pdf). Toujours builder avant de conclure.
- Les E2E comptent les fixtures (8 apprenti·e·s, 2 formations, périmètres Martine 5 /
  Bernard 3, Karim 4 / Hélène 3, Sophie 6 / Marc 2) — toute fixture ajoutée casse des
  compteurs à adapter.
- Le PDF (`src/components/pdf/LivretPdf.tsx`) utilise un wrapper `Text` local qui remplace
  les « — » par « - » : ne pas importer `Text` de react-pdf directement dans ce fichier.
- Prettier reformate parfois des fichiers non touchés : écarter ce churn des commits.
- `npm run e2e` rebuilde ; `npx playwright test` seul teste le dernier `dist/` (périmé si
  on a modifié le code sans rebuilder).
