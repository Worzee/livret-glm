# Plan de portage — Livret d'apprentissage → Next.js 16 / o2switch (étape 2)

Livrable annoncé au §1 de [`chantier-deploiement-o2switch.md`](chantier-deploiement-o2switch.md)
(arbitrage du 2026-07-14 : portage Next.js 16 App Router + Prisma 6 + MariaDB
+ Auth.js v5). Rédigé le 2026-07-14 sur inventaire réel du code (57 modules
`src/lib/`, 12 stores, 55 types exportés, 31 specs E2E).

---

## 0. Principes directeurs

1. **Parité fonctionnelle stricte.** Le fonctionnel est gelé : le portage ne
   change ni écran, ni règle (R1-R24), ni URL. La seule nouveauté visible est
   l'authentification réelle. La demande 2 (entretiens individuels) sera la
   première vague fonctionnelle POST-bascule.
2. **Les 220 E2E sont le contrat.** Chaque vague de portage se termine quand
   les specs Playwright correspondantes repassent sur la nouvelle app
   (sélecteurs `data-testid` reconduits ; seuls les helpers d'authentification
   changent — cf. §5).
3. **Les libs pures ne se réécrivent pas.** `src/lib/` (57 modules, ~767
   tests Vitest) est framework-agnostique : copie telle quelle. C'est l'actif
   principal du projet.
4. **Les droits s'appliquent CÔTÉ SERVEUR.** La matrice `droits.ts`
   (57 ressources × 6 rôles) devient le garde de chaque Server Action
   (`requireDroit(session, ressource)`) ; le client ne fait plus qu'afficher.
5. **Parité o2switch dès le premier jour** (doctrine §2.5) : MariaDB (jamais
   Postgres), `output: 'standalone'`, headers via Next, Nuage pour les
   binaires, mêmes clés d'env qu'en prod.

---

## 1. Inventaire de réutilisation

### A. Copié tel quel

| Quoi | Volume | Note |
|---|---|---|
| `src/types/index.ts` | 55 types | Reste la lingua franca applicative ; sert aussi de source de dérivation du schéma Prisma |
| `src/lib/` + tests | 57 modules, 54 fichiers de tests | Y compris parsers CSV/XLSX maison, trame d'entretien, matrice de droits, règles R1-R24 |
| `src/fixtures/` | 8 livrets, 2 promos, utilisateurs, référentiels, documents | Devient `prisma/seed.ts` (mêmes données — les E2E comptent dessus) |

### B. Adapté légèrement

| Quoi | Adaptation |
|---|---|
| `src/components/` (8 dossiers) | Composants clients (`"use client"`), props inchangées ; les lectures de stores Zustand remplacées par des props/hooks de données |
| `src/pages/` → `app/` | Mêmes URLs (App.tsx fait foi pour la table de routage) ; les pages deviennent des Server Components qui chargent les données et passent aux composants clients |
| `src/components/pdf/` | Reste 100 % client, chargé en `next/dynamic` `ssr: false` (équivalent du lazy actuel) — wrapper `Text` anti-cadratins conservé |
| Styles / tokens de rôle | Migration Tailwind 3 → 4 (config CSS-first) — les utilities `couleur-role` et la variable `--ring` dynamique à re-vérifier visuellement |
| `e2e/` (31 specs) | Reconduites vague par vague ; 2 adaptations transverses seulement (auth + seed, cf. §5) |

### C. Réécrit

| Quoi | Devient |
|---|---|
| 12 stores Zustand persistés | 3 couches : schéma **Prisma** (§2) + **Server Actions** par domaine (mutations gardées par droits + libs pures) + lecture par Server Components |
| RoleSwitcher / sélecteurs « actif » (maître, formateur, responsable) | Sessions réelles Auth.js v5 : Entra (staff) + credentials (externes). Le « rôle actif » devient LE compte connecté |
| Bump `VERSION_SCHEMA` / reset fixtures | Migrations Prisma versionnées + seed |
| `scripts/deploy.sh` / `verifier-vps.sh` | Pipeline du kit (`build:deploy` + runbook §0-9) + préflight o2switch à écrire |

### D. Non porté

- `ModaleFichePeriode.tsx` + mutations orphelines `useLivretStore` (dette
  connue, PROJECT-STATUS §8.B) — le portage la solde gratuitement.
- Bandeau démo / `BoutonReinitialiserDemo` (un mode démo serveur pourra
  exister via variable d'env, à trancher en V0).
- `persist` localStorage et tout le mécanisme de migration par reset.

---

## 2. Schéma de données — les 12 stores deviennent ~22 tables

**Principe d'arbitrage relationnel vs JSON** : relationnel pour tout ce qui se
filtre, se compte ou se joint (utilisateurs, formations, fiches, documents,
compétences…) ; colonne JSON pour ce qui se lit toujours d'un bloc et ne se
requête jamais transversalement (réponses de la trame d'entretien, objets
signature, historiques R10). Les **signatures PNG** (~10-20 Ko) restent en
base (TEXT) ; les **documents administratifs** (≤ 2 Mo) partent sur **Nuage**
(WebDAV), la base ne garde que la référence (doctrine §3.4).

| Store actuel | Tables Prisma | Notes |
|---|---|---|
| `livret-utilisateurs` v7 | `users` + `apprenti_responsables` (N:M) | Table unique, enum `role` (6 valeurs), champs spécifiques nullables ; 2 FK maître (principal/second), FK formateur/coordo/entreprise/formation ; `entra_oid` unique nullable (staff SSO) ; rattachement fratrie = N:M responsables |
| `livret-formations` v9 | `formations`, `periodes_formation` | Périodes entreprise + centre distinguées par un champ `lieu` ; mode d'évaluation + FK modèle d'activités |
| `livret-referentiels` v4 | `referentiels`, `blocs`, `competences` | `sousFamille`, `exclue` (limite lignes évaluables) portés tels quels |
| `livret-activites` v1 | `modeles_activites`, `activites`, `activite_competences` (N:M) | Le mapping activité ↔ compétences devient une table de jointure |
| `livret-attitudes` v3 | `attitudes` | Catalogue global (12) |
| `livret-parametres` v1 | `parametres` | Table clé-valeur (seuil lignes évaluables) |
| `livret-etablissements` v2 | `etablissements` | + URL Pronote |
| `livret-entreprises` v2 | `entreprises`, `affectations_entreprise` | Historique de traçabilité conservé en table (requêté par apprenti·e) |
| `livret-donnees` v26 | `livrets`, `fiches_suivi`, `lignes_suivi`, `entretiens`, `selections_entreprise` | Fiches entreprise/centre en une table (`lieu`) ; réponses de trame, commentaires, signatures, éval. attitudes par période : **JSON** ; sélection compétences/activités : table + historique R10 en JSON ; clôture / déverrouillages / points d'alerte traités / affichage forcé : colonnes JSON du livret |
| `livret-documents` v4 | `documents_administratifs`, `documents_formation`, `attestations` | Fichier = référence Nuage (`cheminNuage` remplace `dataUrl`) ; attestations indexées par apprenti·e (table — requêtées pour compteurs x/y et alertes) |
| `livret-role-actif`, `livret-apprenti-actif` | — (aucune table) | Remplacés par la session Auth.js et par l'URL / la sélection en page |
| *(nouveau — chantier 2.2/2.3)* | `activation_tokens`, `password_reset_tokens`, `login_attempts`, `audit_log` | Spécifiés dans `chantier-creation-comptes.md` §6 — `audit_log` couvre aussi l'obligation RGPD de journalisation |

Le schéma détaillé (types de colonnes, index, contraintes) est le premier
livrable de la vague V1 — dérivé mécaniquement de `src/types/index.ts`.

---

## 3. Architecture applicative cible

- **`app/`** : mêmes URLs qu'aujourd'hui (`/`, `/livret/…`, `/admin/…`) +
  routes d'auth (`/login`, `/activer/[token]`, `/mot-de-passe-oublie`).
  Layout = portage d'`AppShell` + `Sidebar` (la classe `role-actif-X` dérive
  de la session).
- **Server Actions par domaine**, calquées sur les stores actuels (un fichier
  d'actions par domaine : utilisateurs, formations, livret, entretien,
  documents…). Squelette systématique :
  `session → requireDroit(ressource) → lib pure (validation/règle) → Prisma → revalidate`.
  Les gardes croisées des stores (cascades, verrous de suppression) migrent
  dans ces actions — les libs `*-verrou.ts` existent déjà et se réutilisent.
- **`proxy.ts`** (middleware Next 16) : protection des routes par session +
  redirection `/login` ; headers de sécurité via `next.config.ts` (snippet A
  du kit).
- **Écran « compte en attente d'affectation »** pour un utilisateur tenant
  authentifié sans App Role ni compte applicatif (écart E4 de la fiche Entra).
- **Uploads** : Server Action → validation (lib `documents-administratifs`)
  → `putDocument()` WebDAV Nuage (doctrine §10.8) → référence en base.
  `bodySizeLimit` à 4 Mo (marge sur la limite métier de 2 Mo).

---

## 4. Ordre des vagues de portage

Chaque vague se termine par : tests Vitest verts (libs copiées) + specs E2E
de la vague vertes + `pnpm build:deploy` qui passe. Estimations grossières,
à recaler après V0-V1.

| Vague | Contenu | Specs E2E reprises | Estimation |
|---|---|---|---|
| **V0 — Bootstrap** | Kit déroulé (fichiers, snippets, marqueurs §3 du chantier), MariaDB Docker dev, copie types + libs + tests Vitest, page login squelette | — | ~0,5 j |
| **V1 — Socle données + auth** | Schéma Prisma complet + migrations + seed (fixtures actuelles), Auth.js credentials (comptes seedés) + provider Entra conditionnel, JIT + écran « en attente », `requireDroit`, AppShell/Sidebar | `sprint1-role-switcher` (adapté login), navigation | ~2-3 j |
| **V2 — Administration** | Pages admin : utilisateurs (+staff), formations (+planning), affectations, référentiels (+limite), activités (+mapping/mode), établissements, entreprises, attitudes, paramètres, import XLSX (+responsables légaux à l'import) | `admin-*`, `etablissements`, `entreprises`, `import-utilisateurs`, `limite-referentiel`, `responsables-legaux` (partie admin) | ~2-3 j |
| **V3 — Livret pédagogique** | Tableau de bord (+pilotage, alertes, récap apprenti·e), fiches de période entreprise/centre, organisation du suivi, entretien tripartite complet (trame, sélections, signatures tactiles, points d'alerte), synthèse, clôture R22 / déverrouillage R10 | `sprint2-5`, `fiches-periodes*`, `organisation-suivi`, `entretien-*`, `attitudes`, `signature-tactile`, `pilotage-alertes`, `tableau-de-bord-*`, `header-trio` | ~3-4 j |
| **V4 — Documents + Nuage** | Documents nominatifs + formation, attestations après lecture, attestataire responsable légal, stockage WebDAV Nuage | `documents-administratifs`, `responsables-legaux` (partie documents) | ~1-2 j |
| **V5 — PDF + mobile** | Export PDF lazy (7 sections + documents), page Accès mobile (QR), audit responsive | `export-pdf`, `acces-mobile`, `audit-mobile` | ~1-2 j |
| **V6 — Comptes externes + emails** | Chantiers 2.2/2.3 : activation par email, mot de passe oublié, rate limiting, `audit_log` (spec `chantier-creation-comptes.md` — SMTP à ré-arbitrer, lot E) | nouvelles specs (activation, reset) | ~2-3 j |
| **V7 — Déploiement + recette** | Runbook kit §0-9 sur `livret.gretacfalyon.com`, préflight o2switch (successeur de `verifier-vps.sh`), recette pilote, bascule | rejeu complet | ~1 j |

**Total : ~13-18 jours de développement.** Le VPS actuel reste en ligne
(démo) pendant toute la durée ; bascule DNS en V7 seulement.

---

## 5. Stratégie de reprise des E2E

Les 31 specs sont le filet de non-régression. Deux changements transverses,
tout le reste est reconduit :

1. **Authentification** : `e2e/helpers.ts` remplace le clic RoleSwitcher
   (aria-label) par une connexion réelle — `seConnecter(page, 'coordo')`
   se loge via les comptes seedés (credentials en test ; le SSO Entra se
   teste à la main en recette, pas en CI). Le « responsable actif » et le
   « formateur actif » deviennent des connexions de comptes distincts.
2. **Données** : le reset localStorage par spec devient un **reset de la base
   de test par spec** (base MariaDB dédiée + `prisma migrate reset --skip-seed`
   + seed rapide, ou endpoint de reset activé par variable d'env de test).
   Le piège « ne jamais lancer 2 suites Playwright en parallèle » demeure
   (base partagée).

Les compteurs de fixtures (8 apprenti·e·s, périmètres, Minh mineur…) restent
exacts puisque le seed reprend les fixtures actuelles.

---

## 6. Micro-décisions à trancher en V0

| # | Question | Recommandation |
|---|---|---|
| 1 | Dépôt : nouveau repo vs monorepo | **Nouveau dépôt privé** (ex. `livret-glm-app`) bootstrappé par le kit ; l'actuel `livret-glm` reste la maquette de référence jusqu'au décommissionnement |
| 2 | Tailwind 3 conservé vs 4 | **v4** (stack du kit) — migrer les tokens de rôles en config CSS-first, vérification visuelle dédiée |
| 3 | Zustand côté client ? | **Non** — état serveur via Server Components ; état UI éphémère en React local. Aucun store global |
| 4 | Signatures PNG | **En base (TEXT)** — petites, lues avec leur fiche ; seuls les documents vont sur Nuage |
| 5 | Mode démo post-bascule | Variable d'env (seed de démo + bannière) — utile pour les présentations sans données réelles, à confirmer |

---

## 7. Risques identifiés

- **Migration Tailwind 4** : la mécanique de tokens par rôle (`--ring`
  dynamique, ~50 utilities colorisées) est le point le plus « visuel » du
  portage → vérification visuelle systématique en V1 (doctrine du rituel).
- **react-pdf sous Next** : pattern connu (`next/dynamic`, `ssr: false`),
  mais à valider dès V0 sur un PDF miniature (le chunk de 494 Ko doit rester
  lazy).
- **Réécriture des helpers E2E** : c'est LE coût caché du portage — à faire
  proprement en V1 (tout le reste en dépend).
- **`bodySizeLimit` / uploads Passenger** : valider en V7 qu'un PDF de 2 Mo
  passe de bout en bout (Server Action → Nuage) sur o2switch.

---

## 8. Journal

| Date | Événement |
|---|---|
| 2026-07-14 | Plan rédigé (inventaire réel : 57 libs, 12 stores, 55 types, 31 specs). En attente du GO pilote pour V0. |
| 2026-07-14 | **V0 LIVRÉE** (GO pilote, micro-décisions §6 validées telles quelles) : dépôt local `../livret-glm-app` (commit `6f3cd34`) — Next 16.2.10 / React 19 / Tailwind 4 / shadcn, kit intégralement appliqué, Prisma 6 (binaryTargets CloudLinux, artefact v7 supprimé), **types + 57 libs + fixtures portés : 767/767 tests Vitest verts** (+ fflate), login squelette, MariaDB dev prêt (Docker éteint ce jour). **Risque react-pdf LEVÉ** (blob généré en navigateur sur le build standalone, chunk lazy séparé, 0 erreur console) ; smoke standalone OK (200/200/307 + headers). Écart documenté : `noUncheckedIndexedAccess` désactivé (150 erreurs sur code porté — dette légère post-portage). **Prochaine vague : V1** (schéma Prisma + auth + seed). |
| 2026-07-14 | **Dépôt GitHub créé et poussé** : `Worzee/livret-glm-app` (privé — via l'API avec le jeton git local, gh CLI absent). `main` suivie, 2 commits. |
