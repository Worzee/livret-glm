# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-05-09
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3) **livrée**
**Pilote métier** : Guillaume FERRERI

---

## 1. En bref

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Accès** | Basic Auth `demo` / *(mdp partagé hors-canal)* |
| **Dépôt source** | https://github.com/Worzee/livret-glm (privé, branche `main`) |
| **Sprints livrés** | **1, 2, 3, 4, 5** + 3 extensions hors-CDC + post-livraison (mobile, UX, verrouillage par champ, **6 apprenti·e·s + tableau de bord**) |
| **Tests unitaires** | **187 / 187 ✓** (Vitest, 12 fichiers) |
| **Tests E2E** | **40 / 40 ✓** (Playwright — 28 desktop + 12 mobile Pixel 5) |
| **Bundle JS gzippé** | 101 KB (cible CDC §19.1 : < 500 KB → marge × 4,9) |
| **Bundle CSS gzippé** | 5,2 KB (cible : < 50 KB → marge × 9,6) |
| **Chunk PDF lazy** | 495 KB (chargé uniquement au clic « Exporter ») |
| **Préflight VPS** | 11 / 11 ✓ |
| **TTFB VPS** | ~80 ms |
| **TypeScript** | strict, sans erreur |
| **ESLint** | sans erreur |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` (localStorage, schema **v4**)
- **Routing** : React Router v6
- **PDF** : `@react-pdf/renderer` 4 (lazy-loaded — chargé uniquement au clic « Exporter »)
- **Tests unitaires** : Vitest 2 + Testing Library + jsdom
- **Tests E2E** : Playwright 1.59 (Chromium-desktop + Pixel 5 émulation mobile)
- **Lint/Format** : ESLint 9 (flat config) + Prettier 3
- **Icônes** : lucide-react (exclusif, pas d'emojis)
- **Aucune dépendance d'analytics ou tracking** (CDC §20)

---

## 3. Infrastructure & déploiement

### VPS Hostinger (mutualisé avec d'autres projets GRETA)

| | |
|---|---|
| **OS** | Ubuntu 24.04 LTS |
| **IP** | 69.62.107.157 |
| **RAM / disque** | 8 Go / 96 Go (10 Go utilisés) |
| **Reverse proxy** | Traefik (Docker, port 80/443) — partagé avec n8n, pronote-tracker, amklelec, laremisevintage |
| **TLS** | Let's Encrypt automatique via ACME challenge Traefik |
| **DNS** | DuckDNS (`livret-glm.duckdns.org`) |
| **Conteneur livret** | `nginx:1.27-alpine`, 3 Mo RAM, 0 % CPU, sur réseau `n8n_default` |
| **Web root** | `/var/www/livret/` (bind-mount RO côté conteneur) |
| **Compose** | `/docker/livret/docker-compose.yml` |
| **Basic Auth** | middleware Traefik (bcrypt) |

### Scripts de déploiement (`scripts/`)

| Fichier | Rôle |
|---|---|
| `.env.deploy.example` | Gabarit (domaine, IP, Basic Auth) |
| `.env.deploy` | Valeurs réelles — **JAMAIS committé** (gitignored) |
| `setup-vps.sh` | Installation initiale du VPS — idempotent, à exécuter UNE fois |
| `docker-compose.livret.yml` | Compose du conteneur Nginx + labels Traefik |
| `nginx-livret.conf` | Config Nginx du conteneur (SPA fallback, gzip, cache) |
| `deploy.sh` | Build + transfert (rsync ou tar+scp en fallback Windows) |
| `verifier-vps.sh` | 11 contrôles préflight (DNS, TLS, Basic Auth, headers, anti-tracker) |
| `README.md` | Procédure complète |

### Procédure de déploiement courante

```bash
bash scripts/deploy.sh             # build + déploie sur le VPS
bash scripts/deploy.sh --no-build  # redéploiement rapide d'un dist/ existant
bash scripts/verifier-vps.sh       # 11 contrôles préflight
```

### Ce qui peut casser

- **Service DuckDNS gratuit** — best effort, peut tomber temporairement
- **Renouvellement Let's Encrypt** automatique par Traefik (vérifier les logs si > 60 j)
- **localStorage navigateur** — limite ~5 Mo, déjà géré (CDC §C1)
- **VPS root SSH par mot de passe** : à basculer en clé SSH dès que possible (cf. §11)

---

## 4. Sprints livrés

### Sprint 1 — Socle + infrastructure + Skills

- Projet Vite + React + TS + Tailwind + shadcn-ready initialisé
- AppShell : header, role switcher, sidebar, footer
- Bandeau démo non-dismissable (CDC §21.6)
- 6 routes principales placeholder
- Store Zustand `useUserStore` (rôle actif, persist)
- Fixtures : 5 utilisateurs (apprenti, maître, formateur, coordo, admin)
- `lib/droits.ts` matrice §6 + tests TDD
- VPS configuré, déploiement opérationnel, 11/11 préflight

### Sprint 2 — Fiches de suivi par période (cœur de valeur)

- Liste + détail des fiches de période avec badges d'état
- Sous-fiche **Suivi GRETA CFA** (formateur édite, ajout/suppression de lignes)
- **Tableau tri-colonnes** complet (desktop = table / mobile = empilement par compétence)
- Référentiel CAP Cuisine (3 blocs, 10 compétences, 6 attitudes)
- Bloc signatures avec validation R20 + tooltip de blocage
- Machine à états R15 / R16 / R17 (brouillon → en-cours → signée → verrouillée)
- Persistance Zustand avec `persist` middleware
- `useLivretStore` avec mutations granulaires

### Sprint 3 — Organisation du suivi + Entretien tripartite

- **Organisation du suivi** : 6 champs (réunion rentrée, entretien individuel, accueil tuteurs, visites, restitution, bilans)
- **Entretien tripartite** complet (questions apprenti·e/maître, appréciations, démarches, signatures)
- R6, R7 (alerte si > 60 j sans entretien), R8 (verrouillage progressif), R9 (3 sig = tout figé)
- Barre de progression globale + 3 par rôle
- Fixture Léa peuplée : entretien signé le 28/10/2025 (CDC §24.5)

### Sprint 4 — Grilles d'évaluation finales

- Page `/livret/evaluation-finale` avec 2 onglets (Compétences / Attitudes)
- **Grille compétences** par bloc (entreprise + centre)
- **Grille attitudes** (++/+/-/-- par maître + formateur, commentaires)
- **Synthèse graphique** par bloc — barres empilées CSS pures (pas de biblio externe)
- **Pré-remplissage** depuis les fiches de suivi (last-write-wins) avec badge ✨ *Hérité des fiches*
- R23 mise à jour temps réel
- R24 apprenti·e voit en lecture seule

### Sprint 5 — Export PDF + polish + démo

#### Phase A — Briques métier
- **R22 Clôture livret** : type `ClotureLivret`, lib `cloture-livret.ts` (4 fonctions, 14 tests TDD), composant `BandeauCloture` 4 états (gris / vert avec bouton / vert avec confirmation / bleu si clôturé), R22 appliquée dans grilles compétences + attitudes
- **R10 Déverrouillage motivé** : type `EntreeDeverrouillage`, lib `deverrouillage-fiche.ts` (validation motif ≥ 10 caractères, 8 tests TDD), composant `DialogDeverrouillage` (modale a11y, focus piégé, Esc), historique consultable sous chaque fiche
- **Bouton « Réinitialiser la démo »** : footer, confirmation 2 clics + auto-annulation 10 s + reset rôle vers formateur

#### Phase B — Export PDF
- `npm install @react-pdf/renderer`
- `components/pdf/LivretPdf.tsx` (7 pages : garde, organisation, entretien, fiches × 3, évaluations, annexes)
- `components/pdf/styles.ts` + `format.ts` (helpers de formatage)
- `components/pdf/BoutonExportPdf.tsx` + `ExportPdfLazy.tsx` (lazy via `React.lazy`)
- Garde-fou C14 (avertissement si livret > 50 pages estimées)
- Nom de fichier : `livret-apprentissage-NOM-Prenom-AAAA-MM-JJ.pdf`
- Visible uniquement pour le formateur (matrice droits `export-pdf`)

#### Phase C — Polish
- **`DEMO.md`** étoffé : script minuté 10 min + mode 5 min + plan B + checklist post-démo
- **`README.md`** utilisateur final (9 sections : démarrage, commandes, structure, sécurité…)
- **`perf-sprint-5.md`** : mesures bundle + TTFB + procédure Lighthouse manuelle + cibles CDC

#### Phase D — Tests E2E Playwright (5 scénarios CDC §22.2.3)
- `e2e/sprint1-role-switcher.spec.ts` (4 tests) : bandeau démo, role switcher 5 rôles
- `e2e/sprint2-coedition.spec.ts` (3 tests) : co-édition tri-colonnes + R21
- `e2e/sprint3-droits-entretien.spec.ts` (3 tests) : droits granulaires entretien
- `e2e/sprint4-evaluation-finale.spec.ts` (5 tests) : grilles + synthèse + R22
- `e2e/sprint5-bout-en-bout.spec.ts` (3 tests) : parcours complet + export PDF non vide
- Total : **18 tests desktop ✓** en ~10 s

### Améliorations post-Sprint 5

#### Cohérence des actions destructrices (5 actions, 1 pattern)
- **`BoutonSigner`** (composant commun) : confirmation 2 clics avant signature (apposée à chaque slot, fiche + entretien)
- **`BoutonSupprimer`** (composant commun) : confirmation 2 clics avant suppression d'une ligne — appliqué au tableau tri-colonnes (variants `icon` / `text`) ET au Suivi GRETA CFA
- Bandeau R22 : confirmation 2 clics avec récapitulatif
- Modale R10 : motif obligatoire ≥ 10 caractères
- Réinitialisation démo : confirmation 2 clics + auto-annulation 10 s

#### Bugfix R21 (régression silencieuse découverte en revue)
- Avant : un rôle pouvait modifier ses zones (observation, colonnes du tableau) **après** avoir signé, ce qui invalidait sa signature *par effet de bord*
- Helper `peutEncoreEditerFiche(fiche, role)` dans `lib/transitions-fiche.ts` (6 tests TDD)
- Appliqué dans `ZoneObservation`, `TableauTriColonnes`, `SuiviGretaCfa`
- Mention UI explicite : « Figée par signature » au lieu de simple « Lecture seule »

#### Refonte UX « Organisation du suivi »
- Modèle de données : `string` libre → `ChampOrganisationSuivi { date?, commentaire?, verrouille? }`
- UI : chaque carte coupée en deux (date picker natif + commentaire libre)
- **Toggle verrouiller / déverrouiller par champ** (sans modale, sans motif — simple toggle)
- Schema localStorage v3 → v4 (migration = reset, cohérent avec stratégie étape 1)
- PDF mis à jour pour afficher proprement date + commentaire

#### Tableau de bord — 6 apprenti·e·s (CDC §24.5)
- Fixtures étendues : Léa MARTIN (cas principal), Théo DUBOIS (« bon élève »), Sofia PEREIRA (« alerte R7 »), Minh NGUYEN (« démarrage »), Aya KOUAMÉ (« désaccord R10 »), Luca BIANCHI (« mi-parcours standard »)
- 2 maîtres d'apprentissage : Karim BENALI (Le Gourmet — Léa, Théo, Sofia) + Hélène ROCHE (La Brasserie du Rhône — Minh, Aya, Luca). Sophie DUBOIS reste formatrice unique de la promo
- Nouveau store `useApprentiActifStore` (id persisté en localStorage) + hook `useApprentiActif()` — résout l'apprenti·e affiché·e en tenant compte du rôle (R3 : un·e apprenti·e ne consulte que son propre livret)
- Refonte `TableauDeBord` : liste filtrée par rôle (matrice §6) + recherche par nom/prénom (insensible à la casse et aux accents) + cartes avec badges démonstratifs
- Lib `apprentis-accessibles` (18 tests TDD) — filtre selon rôle, tri canonique fr-FR, recherche normalisée
- Lib `etat-livret` (7 tests TDD) — calcule un cas pédagogique (cloture, alerte-r7, desaccord, demarrage, toutes-signees, en-cours) pour l'affichage des badges
- 7 pages livret + 2 grilles d'évaluation passées de `apprentiLeaMartin` en dur à `useApprentiActif()` ; composant partagé `AucunApprentiSelectionne` pour l'état dégradé
- 10 nouveaux tests E2E `tableau-de-bord-6-apprentis` : compte par rôle, recherche, badges, navigation, cas Minh (état vide) + cas Sofia (alerte R7)
- Bouton « Réinitialiser la démo » étendu : remet aussi l'apprenti·e actif·ve à Léa

#### Responsive mobile (cas d'usage terrain)
- **`MobileMenu`** : bouton hamburger + drawer overlay accessible (`role=dialog`, focus piégé, Esc, fermeture auto après navigation)
- **`RoleSwitcher` compact** : icônes seules sur mobile, libellé visible à partir de `lg` (1024 px)
- Header simplifié sur petit écran (logo + role switcher en icônes + hamburger)
- Touch targets ≥ 44 px (norme WCAG 2.5.5)
- Audit Playwright dédié `e2e/audit-mobile.mobile.spec.ts` (12 tests sur Pixel 5 393×851) : aucun débordement horizontal sur les 5 pages principales, navigation mobile validée
- **Fix bug** : icônes du rôle actif devenaient invisibles sur mobile après tap (le `:hover` mobile écrasait `bg-role-X`) — `hover:bg-background` retiré de l'état actif

---

## 5. Extensions hors-CDC v1.3 (négociées avec le pilote)

### Extension 1 — Rôle Coordo (coordinateur·rice administratif·ve)

- 4ᵉ rôle dans le système, couleur `#0e7490` (cyan-700)
- Section *Administration* dans la sidebar (Utilisateurs, Formations, Affectations)
- 10 nouvelles ressources `admin.*` dans la matrice de droits
- Pages placeholder (formulaires CRUD à venir en sprint dédié)
- Fixture : Martine LEFÈVRE
- **Aucun droit pédagogique** (testé exhaustivement)

### Extension 2 — Rôle Admin (super-utilisateur, vous)

- 5ᵉ rôle, couleur `#4338ca` (indigo-700) + icône 👑
- Fixture : Guillaume FERRERI
- Partage avec coordo : créer apprenti·e/maître/formateur, modifier/supprimer utilisateurs, gérer formations + affectations
- **Droit exclusif** : créer un coordo
- **Aucun droit pédagogique** (commentaires, niveaux, signatures, observations)
- Tests TDD complets (10 cas) : pas un seul faux-positif côté pédagogie

### Extension 3 — Import de référentiels (Phase A + B sur 4)

- **Phase A** : `Competence.sousFamille?: string` + `Referentiel.niveauxColonnes?: 2 | 3` + `source?` + ressource `admin.referentiels.gerer`
- **Phase B** : `lib/import-referentiel.ts` complet (parsing CSV maison, encodage UTF-8 / Windows-1252, séparateur auto, 24 / 24 tests TDD)
- **Phase C** : UI page `/admin/referentiels` (liste + modal d'import) — **à faire**
- **Phase D** : adapter `GrilleCompetences` et `TableauTriColonnes` pour grouper par `sousFamille` — **à faire**
- **Phase E** : support XLSX via dynamic import — différable

---

## 6. Règles métier implémentées (CDC §8)

| Règle | Sujet | État | Tests |
|---|---|---|---|
| R1 | 1 livret par apprenti·e | ✓ | implicite (modèle) |
| R2 | `contratFin > contratDebut` | ✓ | type-level |
| R3 | Apprenti·e voit son livret seul | ✓ | matrice droits |
| R4 | Maître voit ses apprenti·e·s | ✓ | matrice droits |
| R5 | Formateur voit sa promo | ✓ | matrice droits |
| R6 | 1 entretien par livret | ✓ | `initialiserEntretien` idempotent |
| R7 | Alerte si > 60 j sans entretien | ✓ | 5 tests |
| R8 | Verrouillage progressif entretien | ✓ | 2 tests (`peutEncoreEditer`) |
| R9 | 3 signatures = tout figé | ✓ | 1 test |
| **R10** | **Déverrouillage formateur + motif** | ✓ | **8 tests TDD + modale UI + traçabilité** |
| R11 | `dateFin > dateDebut` période | ✓ | 3 tests |
| R12 | Pas de chevauchement | ✓ | 4 tests |
| R13 | Création période N | ✓ | 5 tests |
| R14 | Avertissement N créée avant N-1 signée | ✓ | code dans `verifierCreationPeriode` |
| R15 | 3 signatures fiche = signée | ✓ | 3 tests |
| R16 | brouillon → en-cours auto | ✓ | 2 tests |
| R17 | 15 j sans modif → verrouillée | ✓ | 3 tests + bouton manuel |
| R18 | Signer son propre slot | ✓ | testé matrice |
| R19 | Horodatage ISO 8601 au clic | ✓ | dans `signer()` du store |
| R20 | Champs requis avant signature | ✓ | 7 tests `validerSignature` |
| **R21** | **Retrait signature impossible** | ✓ | **6 tests TDD `peutEncoreEditerFiche` + bugfix UI** |
| **R22** | **Clôture livret** | ✓ | **14 tests TDD + bandeau 4 états + grilles figées** |
| R23 | Synthèse temps réel | ✓ | recalcul à chaque render |
| R24 | Apprenti·e consulte à tout moment | ✓ | matrice droits + bandeau lecture |

**Toutes les règles R1 → R24 sont implémentées et testées.**

---

## 7. Tests (187 unitaires + 40 E2E)

### Tests unitaires Vitest (187 / 187 ✓)

| Fichier | Tests | Périmètre |
|---|---|---|
| `lib/droits.test.ts` | 36 | Matrice 32 ressources × 5 rôles, cohérence transverse |
| `lib/transitions-fiche.test.ts` | 20 | R15/R16/R17 + auto-verrou + R21 (`peutEncoreEditerFiche`) |
| `lib/validation-signature.test.ts` | 11 | R18/R20 par rôle métier + coordo/admin refusés |
| `lib/regles-periode.test.ts` | 15 | R11 (dates) + R12 (chevauchement) + R13 (création) |
| `lib/regles-entretien.test.ts` | 19 | R7/R8/R9 + validerSignatureEntretien + progression |
| `lib/synthese-evaluation.test.ts` | 9 | Last-write-wins depuis fiches + valeur effective |
| `lib/stats-bloc.test.ts` | 6 | Compte des niveaux par bloc + pourcentage |
| `lib/import-referentiel.test.ts` | 24 | Parsing CSV, encodage CP1252, 2/3 colonnes, robustesse |
| `lib/cloture-livret.test.ts` | 14 | R22 (estCloture, peutCloturer, motifBlocage, creerCloture) |
| `lib/deverrouillage-fiche.test.ts` | 8 | R10 (validation motif min/max) |
| `lib/apprentis-accessibles.test.ts` | 18 | Filtre par rôle (R3) + tri fr-FR + recherche normalisée |
| `lib/etat-livret.test.ts` | 7 | Cas pédagogiques 6 apprenti·e·s (CDC §24.5) + priorisation |

### Tests E2E Playwright (40 / 40 ✓)

| Projet | Fichier | Tests | Périmètre |
|---|---|---|---|
| `chromium-desktop` | `sprint1-role-switcher.spec.ts` | 4 | Bandeau démo + role switcher 5 rôles |
| `chromium-desktop` | `sprint2-coedition.spec.ts` | 3 | Co-édition tri-colonnes + R21 |
| `chromium-desktop` | `sprint3-droits-entretien.spec.ts` | 3 | Droits granulaires entretien |
| `chromium-desktop` | `sprint4-evaluation-finale.spec.ts` | 5 | Grilles + synthèse + R22 |
| `chromium-desktop` | `sprint5-bout-en-bout.spec.ts` | 3 | Parcours complet + export PDF non vide |
| `chromium-desktop` | `tableau-de-bord-6-apprentis.spec.ts` | 10 | Liste par rôle + recherche + badges + navigation Aya/Minh/Sofia |
| `mobile-pixel5` | `audit-mobile.mobile.spec.ts` | 12 | Aucun débordement horizontal, hamburger, drawer, RoleSwitcher compact, modale R10 dans largeur écran |

---

## 8. Architecture des fichiers

```
LIVRET APPRENTISSAGE/
├── README.md                       # mode d'emploi pilote
├── PROJECT-STATUS.md               # ce fichier
├── DEMO.md                         # script minuté 10 min + plan B
├── CONVENTIONS.md                  # règles de code (résumé CDC §16)
├── TODO-etape-2.md                 # captures de scope creep
├── perf-sprint-5.md                # mesures bundle + procédure Lighthouse
├── cahier-des-charges-livret-apprentissage-v1.3.md
├── design-system/MASTER.md
├── scripts/                        # déploiement VPS
│   ├── .env.deploy.example
│   ├── setup-vps.sh, deploy.sh, verifier-vps.sh
│   ├── docker-compose.livret.yml, nginx-livret.conf
│   └── README.md
├── e2e/                            # tests Playwright
│   ├── helpers.ts                  # resetState + selectRole
│   ├── sprint1-role-switcher.spec.ts
│   ├── sprint2-coedition.spec.ts
│   ├── sprint3-droits-entretien.spec.ts
│   ├── sprint4-evaluation-finale.spec.ts
│   ├── sprint5-bout-en-bout.spec.ts
│   └── audit-mobile.mobile.spec.ts # projet mobile-pixel5 uniquement
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json                    # scripts: dev, test, e2e, e2e:ui, lint…
├── vite.config.ts, vitest.config.ts, tsconfig*.json
├── tailwind.config.ts, postcss.config.js, components.json
├── eslint.config.js, .prettierrc.json, .gitignore
├── index.html
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css
    ├── types/index.ts              # CDC §7 + ChampOrganisationSuivi + ClotureLivret + EntreeDeverrouillage
    ├── lib/                        # logique métier pure
    │   ├── droits.ts               # matrice §6 (32 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21 (machine + non-régression)
    │   ├── validation-signature.ts # R18/R20
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6/R7/R8/R9 + progression
    │   ├── synthese-evaluation.ts  # last-write-wins fiches → finales
    │   ├── stats-bloc.ts           # agrégation par bloc
    │   ├── cloture-livret.ts       # R22 (clôture)
    │   ├── deverrouillage-fiche.ts # R10 (motif obligatoire)
    │   ├── import-referentiel.ts   # parsing CSV (encodage, 2/3 cols)
    │   ├── utils.ts                # cn() helper
    │   └── *.test.ts               # 10 fichiers de tests, 162 tests
    ├── store/
    │   ├── useUserStore.ts         # rôle actif (persist)
    │   └── useLivretStore.ts       # données livret (persist v4)
    ├── fixtures/
    │   ├── utilisateurs.ts         # 5 utilisateurs (1 par rôle)
    │   ├── formations.ts           # CAP Cuisine 2025-2026
    │   ├── referentiel-cap-cuisine.ts
    │   └── livret-demo.ts          # Léa : 3 périodes + entretien signé
    ├── components/
    │   ├── ui/                     # vide (shadcn à la demande)
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── BandeauDemo.tsx
    │   │   ├── RoleSwitcher.tsx    # compact mobile, libellé lg+
    │   │   ├── Sidebar.tsx         # exporte aussi MobileMenu
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/
    │   │   ├── ChampEditable.tsx
    │   │   ├── SelecteurNiveau.tsx
    │   │   ├── SelecteurAppreciation.tsx
    │   │   ├── BadgeEtatFiche.tsx
    │   │   ├── BarreProgression.tsx
    │   │   ├── IndicateurEnregistrement.tsx
    │   │   ├── BoutonSigner.tsx    # confirmation 2 clics avant signer
    │   │   └── BoutonSupprimer.tsx # confirmation 2 clics avant supprimer
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx
    │   │   ├── TableauTriColonnes.tsx
    │   │   ├── ZoneObservation.tsx
    │   │   ├── BlocSignatures.tsx
    │   │   └── DialogDeverrouillage.tsx # modale R10
    │   ├── entretien/
    │   │   ├── CaseOuiNon.tsx
    │   │   ├── EntretienHeader.tsx
    │   │   ├── EntretienProgression.tsx
    │   │   ├── BandeauAlerteR7.tsx
    │   │   ├── SectionApprenti.tsx
    │   │   ├── SectionMaitre.tsx
    │   │   ├── SectionFormateur.tsx
    │   │   └── BlocSignaturesEntretien.tsx
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx
    │   │   ├── GrilleCompetences.tsx
    │   │   ├── GrilleAttitudes.tsx
    │   │   └── BandeauCloture.tsx  # bandeau R22 (4 états)
    │   └── pdf/                    # export lazy
    │       ├── styles.ts
    │       ├── format.ts
    │       ├── LivretPdf.tsx       # 7 sections complètes
    │       ├── ExportPdfLazy.tsx   # PDFDownloadLink wrapper
    │       └── BoutonExportPdf.tsx # lazy + garde-fou C14
    ├── pages/
    │   ├── TableauDeBord.tsx
    │   ├── PagePlaceholder.tsx
    │   ├── NotFound.tsx
    │   ├── OrganisationSuivi.tsx   # date picker + commentaire + toggle verrou
    │   ├── EntretienTripartite.tsx
    │   ├── FicheSuiviPeriodes.tsx
    │   ├── FicheSuiviPeriodeDetail.tsx # historique R10 affiché
    │   ├── EvaluationFinale.tsx    # bouton export PDF + bandeau R22
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx
    │       ├── GestionFormations.tsx
    │       └── GestionAffectations.tsx
    └── test/setup.ts
```

---

## 9. Reste à faire

### ~~A. Données de démonstration enrichies (CDC §24.5)~~ — ✅ livré (post-Sprint 5)

Les 6 apprenti·e·s sont en place avec leurs livrets scénarisés. Cf. section *Tableau de bord — 6 apprenti·e·s*.

### B. Import des référentiels — Phases C + D

| Tâche | Effort |
|---|---|
| `useReferentielStore` (Zustand persist) | 0,2 session |
| Page `/admin/referentiels` : liste + bouton import | 0,3 session |
| Modal d'import : `<input type=file>` + preview du rapport + confirmation | 0,5 session |
| Sidebar : entrée *Référentiels* dans section Administration | 0,05 session |
| Adapter `GrilleCompetences` pour grouper les leaves par `sousFamille` | 0,3 session |
| Adapter le sélecteur d'ajout de compétence dans `TableauTriColonnes` | 0,2 session |
| Support XLSX via dynamic import de SheetJS (optionnel) | 0,5 session |

### C. Modules administratifs réels (sprint dédié post-étape 1)

Aujourd'hui placeholder dans `/admin/*`. Pour l'étape 2 :

- Formulaires CRUD utilisateurs (création apprenti / maître / formateur / coordo)
- Formulaires CRUD formations (création + édition + suppression)
- Écran d'affectation apprenti·e ↔ formation/maître/formateur
- Persistance Zustand (aujourd'hui en fixtures statiques)

→ noté dans `TODO-etape-2.md`.

### D. Mise à jour formelle du cahier des charges en v1.5

Trois changements négociés à intégrer dans le CDC officiel :

- §4.1 : ajout des rôles **Coordo** et **Admin**
- §6 : 11 nouvelles lignes de matrice (admin.* ressources)
- §7.1 : types `Coordo`, `Admin`, `Lieu` ; `Formation` enrichi
- §7.2 : `Competence.sousFamille?` (3 niveaux hiérarchiques optionnels)
- §17.2 : entrées glossaire *Coordinateur·rice*, *Administrateur·rice*

→ noté dans `TODO-etape-2.md`.

---

## 10. Limites connues (CDC §3 + observations)

- Pas d'authentification réelle — role switcher uniquement (étape 3)
- Pas de RGPD / RGAA strict — bonnes pratiques seulement
- Pas de notifications email — étape 2
- Pas de multi-établissement — un seul GRETA fictif
- Pas d'API / import structuré CSV (sauf pour les référentiels, scope ajouté)
- Pas de backup automatique — données vivent dans le `localStorage` de chaque navigateur
- Pas de monitoring (Uptime Kuma, logs centralisés)
- Pas d'historique granulaire (CDC §12) — la traçabilité minimale `modifieLe` existe + historique R10 spécifique

---

## 11. Sécurité — actions à prendre par le pilote

> **Urgent** : le mot de passe SSH root du VPS a été partagé en clair dans une conversation et doit être changé.

- [ ] `passwd` sur le VPS pour changer le mot de passe root
- [ ] Générer une clé SSH dédiée au déploiement (`ssh-keygen -t ed25519`)
- [ ] Pousser la clé publique sur le VPS (`ssh-copy-id`)
- [ ] Désactiver l'auth par mot de passe dans `/etc/ssh/sshd_config` :
  - `PasswordAuthentication no`
  - `PermitRootLogin no` (ou `prohibit-password`)
  - `systemctl restart sshd`
- [ ] Vérifier que le mot de passe Basic Auth est partagé via canal sécurisé (gestionnaire de mots de passe, Signal — jamais en clair par mail)
- [ ] Avant chaque démo importante : `bash scripts/verifier-vps.sh` doit retourner 11/11 OK

Procédure complète dans `scripts/README.md` § *Sécurité*.

---

## 12. Comment relancer le projet

### Pré-requis machine

- Node.js ≥ 20 (testé avec v24)
- npm ≥ 10
- bash (Git Bash sur Windows)
- ssh + scp (pour le déploiement)

### Démarrage en local

```bash
git clone https://github.com/Worzee/livret-glm.git
cd livret-glm
npm install            # première fois seulement (~30 s)
npm run dev            # serveur Vite sur http://localhost:5173
```

### Tests / qualité

```bash
npm test               # 162 tests Vitest
npm run e2e            # 30 tests E2E Playwright (build + preview + tests)
npm run e2e:ui         # UI Playwright pour debug
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run format         # Prettier (écriture)
```

### Build et déploiement

```bash
npm run build                      # produit dist/
bash scripts/deploy.sh             # build + déploie sur le VPS
bash scripts/deploy.sh --no-build  # redéploiement rapide
bash scripts/verifier-vps.sh       # 11 contrôles préflight
```

### Réinitialiser les données de démo

Depuis l'app : footer → bouton **« Réinitialiser la démo »** (2 clics).

Ou en console DevTools :
```js
localStorage.removeItem('livret-donnees');
localStorage.removeItem('livret-role-actif');
location.reload();
```

---

## 13. Skills Claude Code installés

Référence : CDC §22.

- ✓ `web-artifacts-builder` (Anthropic) — patterns React + shadcn/ui
- ✓ `webapp-testing` — Playwright (mobilisé en sprint 5 phase D)
- ✓ `test-driven-development` — appliqué sur droits, transitions, validations, cloture, déverrouillage
- ✓ `brainstorming` (à mobiliser pour arbitrages UX)
- ✓ `impeccable` (installé, encore peu sollicité)

---

## 14. Décisions architecturales notables

- **Pas de NextJS / SSR** : SPA suffit pour la maquette, simplicité Vite
- **Pas de Redux / RTK** : Zustand est plus léger
- **Pas de bibliothèque de charts** : barres empilées en CSS pur (gain bundle)
- **Pas de lib CSV externe** : parser de 50 lignes en TS pur (gain bundle)
- **PDF lazy-loaded** : `@react-pdf/renderer` dans un chunk séparé (495 KB gzip), chargé uniquement au clic « Exporter ». Le bundle initial reste à 94 KB.
- **Tests TDD ciblés** : matrice droits + transitions + validation signatures + parser CSV + cloture + déverrouillage. Composants UI testés via E2E (Playwright) plutôt qu'unitairement.
- **Migration localStorage par bump de version** : v1 → v2 → v3 → v4 reset complet à chaque bump (pas de migration logicielle, données fictives)
- **Cohérence du pattern de friction** : 5 actions destructrices/engageantes utilisent toutes une confirmation explicite (signature, suppression compétence, suppression ligne GRETA, clôture, réinit). Une seule modale stricte (R10 — la plus engageante avec motif obligatoire).
- **Coordo et Admin = extensions explicites** : pas de fonctionnalité « secrète », tout est tracé dans `TODO-etape-2.md`
- **Mobile-first responsive** : navigation par drawer, RoleSwitcher compact, audit Playwright 12 tests dédiés.

---

## 15. Prochaine étape recommandée

L'étape 1 du CDC v1.3 est **livrée et fonctionnelle**. Les 6 apprenti·e·s + tableau de bord sont en place.

Reste à faire pour enrichir la démo :

1. **Finir l'import des référentiels (Phases C + D)** — débloque la démo d'un référentiel réel via UI. ~1 session.
2. **Modules administratifs réels** (CRUD utilisateurs / formations / affectations) — sprint dédié post-étape 1.

La sécurité VPS reste une action côté pilote (cf. §11).

---

*Étape 1 livrée — Sprint 5 + post-livraison (mobile + verrouillage + cohérence UX + 6 apprenti·e·s) — cahier des charges v1.3.*
