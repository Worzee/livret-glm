# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-05-10
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3) **livrée + extensions métier post-livraison**
**Pilote métier** : Guillaume FERRERI

---

## 1. En bref

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Accès** | Basic Auth `demo` / *(mdp partagé hors-canal)* |
| **Dépôt source** | https://github.com/Worzee/livret-glm (privé, branche `main` — synchronisée GitHub ↔ local ↔ VPS) |
| **Tests unitaires** | **272 / 272 ✓** (Vitest, 22 fichiers) |
| **Tests E2E** | **93 / 93 ✓** (Playwright — 81 desktop + 12 mobile Pixel 5) |
| **Bundle JS gzippé** | 125 KB (cible CDC §19.1 : < 500 KB → marge × 4) |
| **Bundle CSS gzippé** | 6,2 KB (cible : < 50 KB → marge × 8) |
| **Chunk PDF lazy** | 493 KB (chargé uniquement au clic « Exporter ») |
| **Préflight VPS** | 11 / 11 ✓ |
| **TypeScript** | strict, sans erreur |
| **ESLint** | sans erreur |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` — **6 stores** persistés en localStorage :
  - `livret-donnees` (schema v5) — livrets, fiches, entretiens, évaluations
  - `livret-role-actif` — rôle + maître actif
  - `livret-apprenti-actif` — id de l'apprenti·e affiché·e
  - `livret-utilisateurs` (schema v1) — apprenti·e·s, maîtres, formateurs, coordos, admins
  - `livret-formations` (schema v1) — formations (intitulé, niveau, dates, lieu, référentiel)
  - `livret-referentiels` (schema v1) — référentiels de compétences (Bloc → Sous-famille? → Compétence)
- **Routing** : React Router v6
- **PDF** : `@react-pdf/renderer` 4 (lazy-loaded — chunk séparé, chargé uniquement au clic « Exporter »)
- **XLSX** : `fflate` (~12 KB) pour la décompression ZIP, parser maison
- **Tests unitaires** : Vitest 2 + Testing Library + jsdom (env `node` pour les tests qui touchent au natif Uint8Array)
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
- **VPS root SSH par mot de passe** — à basculer en clé SSH (cf. §8.D)

---

## 4. Modules livrés

### Sprints CDC (1 → 5)

- **Sprint 1** — Socle Vite + React + TS + Tailwind, AppShell, role switcher 5 rôles, bandeau démo, matrice de droits §6, 6 routes, déploiement opérationnel
- **Sprint 2** — Fiches de suivi par période, tableau tri-colonnes (desktop + mobile empilé), référentiel CAP Cuisine, machine à états R15/R16/R17, persistance Zustand
- **Sprint 3** — Organisation du suivi (date + commentaire structurés), entretien tripartite complet, R6/R7/R8/R9, barres de progression
- **Sprint 4** — Grilles d'évaluation finales (compétences + attitudes), synthèse graphique CSS pure, pré-remplissage last-write-wins depuis les fiches, R23/R24
- **Sprint 5** — R22 clôture livret (14 tests TDD), R10 déverrouillage motivé (8 tests TDD), export PDF lazy 7 sections, démo minutée, polish UX

### Extensions hors-CDC v1.3 (négociées avec le pilote)

#### Rôle Coordo + Rôle Admin (extensions 1 + 2)

- 4ᵉ et 5ᵉ rôles dans le système (couleurs cyan-700 et indigo-700)
- 11 ressources `admin.*` dans la matrice de droits
- Pages CRUD réelles : utilisateurs ✓ + formations ✓ + affectations ✓ + référentiels ✓
- Fixtures : Martine LEFÈVRE (coordo), Guillaume FERRERI (admin)
- **Aucun droit pédagogique** pour ces deux rôles — testé exhaustivement (commentaires, niveaux, signatures, observations exclus)
- **Exception métier** : le formateur référent peut créer un·e apprenti·e + un maître (besoin terrain)

#### Import de référentiels — Phases A → E livrées

- **Phases A + B** : type `Competence.sousFamille?` + `Referentiel.niveauxColonnes?: 2 | 3` + parser CSV (encodage UTF-8/CP1252 auto, séparateur auto, 24 tests TDD)
- **Phase C** (UI) : `useReferentielsStore`, `ModaleImportReferentiel` (file ou textarea, workflow Aperçu → Importer avec stats détaillées + avertissement de remplacement), page `/admin/referentiels`, sidebar
- **Phase D** (rendering 3 niveaux) : `GrilleCompetences` groupe par sous-famille, `TableauTriColonnes.AjouterCompetence` optgroup `Bloc — Sous-famille`
- **Phase E** (XLSX) : dépendance `fflate`, parser XLSX maison (sharedStrings + sheet1, regex robustes, 16 tests TDD dont 4 d'intégration sur les fichiers du pilote), détection automatique CSV vs XLSX par signature ZIP
- **Workflow finalisé pilote** :
  - L'utilisateur·rice **choisit une formation existante** (et non un nom libre)
  - Helper `genererNomReferentiel(formation, date)` → libellé canonique `Referentiel_<intitulé>_<YYYY-MM-DD>`
  - À l'import, `formation.referentielId` est **mis à jour automatiquement** pour rattacher la nouvelle entrée
  - Le `Referentiel.source` est typé `'import-csv'` ou `'import-xlsx'` selon le format détecté (utile dans l'admin et en debug)
- **Tests d'intégration sur les fichiers exemples réels du pilote** (`exemple-{1,2}.{csv,xlsx}` dans `src/lib/__fixtures__/`) côté unitaire ET côté E2E (chargement via `setInputFiles`)

### Administration métier (post-livraison)

#### Étapes 1 → 4 — CRUD complet utilisateurs / formations / affectations / référentiels

- **CRUD apprenti·e·s** (étape 1) : `useUtilisateursStore`, helper `creation-livret`, validation incluant avertissement RQTH > 29 ans
- **CRUD maître / formateur / coordo** (étape 2) : modale unique paramétrée par rôle, suppression intelligente (refus si rattachements actifs), menu déroulant « Nouveau · nouvelle… » filtré par droits
- **Affectations** (étape 3, CDC §10.4) : table ligne-par-apprenti·e avec selects auto-save, indicateur ✓ vert, synchronisation `apprentiIds` du maître à la réaffectation, propagation `entrepriseId` + `formationId` au livret
- **Verrouillage des affectations** : `lib/affectation-verrou` (7 tests TDD) — verrou si fiches existantes / entretien initialisé / contrat démarré. Bouton « Déverrouiller temporairement » par ligne (état non persisté)
- **CRUD formations** (étape 4) : `useFormationsStore`, `ModaleFormation` (3 sections), suppression bloquée si apprenti·e·s rattaché·e·s (`formation-verrou`), référentiel optionnel à la création (suite retour pilote)

### Améliorations UX et fonctionnalités métier (post-livraison)

#### Cohérence des actions destructrices

9 actions destructrices/engageantes utilisent toutes une confirmation explicite : signature, suppression de compétence, suppression de ligne GRETA, clôture R22, réinit démo, suppression de compte, déverrouillage temporaire d'affectation, suppression de fiche de période, suppression de référentiel/formation. Une seule modale stricte : R10 (déverrouillage avec motif obligatoire ≥ 10 caractères).

#### Bugfix R21 (régression silencieuse)

Helper `peutEncoreEditerFiche(fiche, role)` dans `lib/transitions-fiche.ts` (6 tests TDD) — empêche un rôle de modifier ses zones après avoir signé. Mention UI explicite « Figée par signature ».

#### Refonte UX « Organisation du suivi »

Modèle `string` libre → `ChampOrganisationSuivi { date?, commentaire?, verrouille? }`. Toggle verrouiller/déverrouiller par champ. Schema localStorage v3 → v4.

#### Responsive mobile (cas d'usage terrain)

`MobileMenu` hamburger + drawer accessible (`role=dialog`, focus piégé, Esc), `RoleSwitcher` compact, touch targets ≥ 44 px (WCAG 2.5.5), audit Playwright dédié 12 tests sur Pixel 5.

#### Tableau de bord — 6 apprenti·e·s scénarisé·e·s (CDC §24.5)

Léa MARTIN (cas principal), Théo DUBOIS (« bon élève »), Sofia PEREIRA (« alerte R7 »), Minh NGUYEN (« démarrage »), Aya KOUAMÉ (« désaccord R10 »), Luca BIANCHI (« mi-parcours »). 2 maîtres : Karim BENALI + Hélène ROCHE. Sélecteur de maître côté `maitre`, recherche normalisée, badges démonstratifs.

#### Compétences abordées en entreprise (mai 2026)

Flag par compétence pour exclure du suivi en entreprise les compétences purement académiques :
- Type `Competence.evalueeEnEntreprise?: boolean` (défaut implicite `true`)
- Lib `competence-entreprise` (6 tests TDD)
- UI checkbox par compétence dans la page Référentiels, compteur par bloc
- `TableauTriColonnes.AjouterCompetence` n'expose que les compétences cochées ; les lignes déjà saisies pour des compétences décochées **restent visibles** (cohérence historique)
- Migration aussi de `TableauTriColonnes` vers le référentiel courant (résolu via la formation de l'apprenti·e actif·ve, fini le fixture en dur)

#### Création / renommage / suppression de fiches de période (mai 2026)

Le formateur référent et le coordo peuvent gérer les fiches :
- Type `FicheSuiviPeriode.titre?: string` (optionnel) — affichage `Période N — <titre>` ou `Période N` seul
- Droits : `fiche.creer-periode` étendu coordo + nouvelles ressources `fiche.modifier-periode` et `fiche.supprimer-periode`
- Lib `validation-fiche-periode` (15 tests TDD) : titre + dates + R11/R12/R13/R14, mode édition (auto-chevauchement ignoré), `peutSupprimerFichePeriode` (refus si verrouillée ou signée)
- Mutations store : `ajouterFichePeriode` (numéro auto), `modifierFichePeriode`, `supprimerFichePeriode`
- `ModaleFichePeriode` + bouton « + Nouvelle période » + boutons modifier/supprimer par carte (confirmation 2 clics)
- `FicheSuiviPeriodeDetail` affiche le titre custom dans le `<h1>` + bouton « Modifier » dans l'en-tête

---

## 5. Règles métier R1 → R24

Toutes les règles du CDC v1.3 sont implémentées et testées :

| Règle | Sujet | État |
|---|---|---|
| R1 | 1 livret par apprenti·e | ✓ implicite (modèle) |
| R2 | `contratFin > contratDebut` | ✓ type-level + validation modale |
| R3 | Apprenti·e voit son livret seul | ✓ matrice + `apprentis-accessibles` |
| R4 | Maître voit ses apprenti·e·s | ✓ matrice |
| R5 | Formateur voit sa promo | ✓ matrice |
| R6 | 1 entretien par livret | ✓ `initialiserEntretien` idempotent |
| R7 | Alerte si > 60 j sans entretien | ✓ 5 tests |
| R8 | Verrouillage progressif entretien | ✓ 2 tests |
| R9 | 3 signatures = tout figé | ✓ 1 test |
| **R10** | **Déverrouillage formateur + motif** | ✓ 8 tests TDD + modale UI + traçabilité |
| R11 | `dateFin > dateDebut` période | ✓ 3 tests |
| R12 | Pas de chevauchement | ✓ 4 tests |
| R13 | Création période N | ✓ 5 tests |
| R14 | Avertissement N créée avant N-1 signée | ✓ |
| R15 | 3 signatures fiche = signée | ✓ 3 tests |
| R16 | brouillon → en-cours auto | ✓ 2 tests |
| R17 | 15 j sans modif → verrouillée | ✓ 3 tests + bouton manuel |
| R18 | Signer son propre slot | ✓ matrice |
| R19 | Horodatage ISO 8601 au clic | ✓ dans `signer()` |
| R20 | Champs requis avant signature | ✓ 7 tests |
| **R21** | **Retrait signature impossible** | ✓ 6 tests TDD + bugfix UI |
| **R22** | **Clôture livret** | ✓ 14 tests TDD + bandeau 4 états |
| R23 | Synthèse temps réel | ✓ recalcul à chaque render |
| R24 | Apprenti·e consulte à tout moment | ✓ matrice + bandeau lecture |

---

## 6. Tests (272 unitaires + 93 E2E)

### Tests unitaires Vitest (22 fichiers)

| Fichier | Tests | Périmètre |
|---|---|---|
| `lib/droits.test.ts` | 37 | Matrice 44 ressources × 5 rôles, cohérence transverse |
| `lib/transitions-fiche.test.ts` | 20 | R15/R16/R17/R21 |
| `lib/validation-signature.test.ts` | 11 | R18/R20 par rôle |
| `lib/regles-periode.test.ts` | 15 | R11/R12/R13 |
| `lib/regles-entretien.test.ts` | 19 | R7/R8/R9 + progression |
| `lib/synthese-evaluation.test.ts` | 9 | Last-write-wins fiches → finales |
| `lib/stats-bloc.test.ts` | 6 | Compte des niveaux par bloc |
| `lib/import-referentiel.test.ts` | 24 | Parsing CSV (encodage CP1252, 2/3 cols, robustesse) |
| `lib/cloture-livret.test.ts` | 14 | R22 |
| `lib/deverrouillage-fiche.test.ts` | 8 | R10 |
| `lib/apprentis-accessibles.test.ts` | 18 | Filtre par rôle (R3) + tri fr-FR + recherche normalisée |
| `lib/etat-livret.test.ts` | 7 | Cas pédagogiques 6 apprenti·e·s |
| `lib/validation-apprenti.test.ts` | 9 | Saisie apprenti·e (avertissement RQTH) |
| `lib/validation-utilisateur-staff.test.ts` | 6 | Validation maître/formateur/coordo |
| `lib/affectation-verrou.test.ts` | 7 | Verrou affectation |
| `lib/validation-formation.test.ts` | 9 | Validation formation |
| `lib/formation-verrou.test.ts` | 4 | Verrou suppression formation |
| `lib/validation-import-referentiel.test.ts` | 8 | Saisie d'import + génération du libellé canonique |
| `lib/referentiel-verrou.test.ts` | 4 | Verrou suppression référentiel |
| `lib/parser-xlsx.test.ts` | 16 | Parser XLSX + tests d'intégration sur les 4 fichiers exemples du pilote |
| `lib/competence-entreprise.test.ts` | 6 | Flag `evalueeEnEntreprise` |
| `lib/validation-fiche-periode.test.ts` | 15 | Saisie fiche + `peutSupprimer` + `libelleFichePeriode` |

### Tests E2E Playwright (13 specs)

| Projet | Fichier | Tests | Périmètre |
|---|---|---|---|
| `chromium-desktop` | `sprint1-role-switcher.spec.ts` | 4 | Bandeau démo + role switcher 5 rôles |
| `chromium-desktop` | `sprint2-coedition.spec.ts` | 3 | Co-édition tri-colonnes + R21 |
| `chromium-desktop` | `sprint3-droits-entretien.spec.ts` | 3 | Droits granulaires entretien |
| `chromium-desktop` | `sprint4-evaluation-finale.spec.ts` | 5 | Grilles + synthèse + R22 |
| `chromium-desktop` | `sprint5-bout-en-bout.spec.ts` | 3 | Parcours complet + export PDF non vide |
| `chromium-desktop` | `tableau-de-bord-6-apprentis.spec.ts` | 13 | Liste par rôle + recherche + sélecteur maître + R3 |
| `chromium-desktop` | `admin-utilisateurs.spec.ts` | 7 | CRUD apprenti·e + verrous |
| `chromium-desktop` | `admin-utilisateurs-staff.spec.ts` | 10 | CRUD staff + droits formateur partiel |
| `chromium-desktop` | `admin-affectations.spec.ts` | 6 | Verrou + déverrouillage temporaire + réaffectation |
| `chromium-desktop` | `admin-formations.spec.ts` | 7 | CRUD formations + persistance |
| `chromium-desktop` | `admin-referentiels.spec.ts` | 12 | Import textarea, **import des 4 fichiers exemples réels (CSV+XLSX, 2/3 niveaux)**, association auto, toggle « abordée en entreprise », filtrage en aval |
| `chromium-desktop` | `fiches-periodes.spec.ts` | 8 | Création/renommage/suppression : droits, R13, blocage si signée, titre custom |
| `mobile-pixel5` | `audit-mobile.mobile.spec.ts` | 12 | Aucun débordement, hamburger, drawer, RoleSwitcher compact, modale R10 |

---

## 7. Architecture des fichiers

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
├── e2e/                            # tests Playwright (13 specs)
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css
    ├── types/index.ts              # CDC §7 + extensions (titre fiche, evalueeEnEntreprise, etc.)
    ├── lib/                        # 22 modules + 22 fichiers tests
    │   ├── droits.ts               # matrice §6 (44 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21
    │   ├── validation-signature.ts # R18/R20
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6/R7/R8/R9
    │   ├── synthese-evaluation.ts  # last-write-wins fiches → finales
    │   ├── stats-bloc.ts           # agrégation par bloc
    │   ├── cloture-livret.ts       # R22
    │   ├── deverrouillage-fiche.ts # R10
    │   ├── import-referentiel.ts   # pipelines CSV + XLSX
    │   ├── parser-xlsx.ts          # parser XLSX maison (sharedStrings + sheet1)
    │   ├── apprentis-accessibles.ts# filtre/tri/recherche par rôle
    │   ├── etat-livret.ts          # cas pédagogique pour badges tableau de bord
    │   ├── creation-livret.ts      # livret vierge réutilisable
    │   ├── validation-apprenti.ts  # saisie apprenti·e
    │   ├── validation-utilisateur-staff.ts
    │   ├── validation-formation.ts
    │   ├── validation-import-referentiel.ts # + genererNomReferentiel
    │   ├── validation-fiche-periode.ts      # + peutSupprimer + libelleFichePeriode
    │   ├── affectation-verrou.ts   # verrou affectation si livret actif
    │   ├── formation-verrou.ts     # verrou suppression formation
    │   ├── referentiel-verrou.ts   # verrou suppression référentiel
    │   ├── competence-entreprise.ts # flag « abordée en entreprise »
    │   ├── __fixtures__/           # exemple-{1,2}.{csv,xlsx} (fichiers du pilote)
    │   └── utils.ts
    ├── store/                      # 6 stores Zustand persistés
    │   ├── useUserStore.ts
    │   ├── useLivretStore.ts       # données livret (persist v5)
    │   ├── useApprentiActifStore.ts
    │   ├── useUtilisateursStore.ts # CRUD utilisateurs (persist v1)
    │   ├── useFormationsStore.ts   # CRUD formations (persist v1)
    │   └── useReferentielsStore.ts # CRUD référentiels (persist v1)
    ├── fixtures/
    │   ├── utilisateurs.ts         # 6 apprenti·e·s + 2 maîtres + Sophie + Martine + Guillaume
    │   ├── formations.ts           # CAP Cuisine 2025-2026
    │   ├── referentiel-cap-cuisine.ts
    │   └── livret-demo.ts          # 6 livrets scénarisés (CDC §24.5)
    ├── components/
    │   ├── admin/
    │   │   ├── ModaleApprenti.tsx
    │   │   ├── ModaleUtilisateurStaff.tsx
    │   │   ├── ModaleFormation.tsx
    │   │   └── ModaleImportReferentiel.tsx
    │   ├── layout/
    │   │   ├── AppShell.tsx, BandeauDemo.tsx, RoleSwitcher.tsx
    │   │   ├── Sidebar.tsx         # filtre admin par lien selon droits
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/                 # 8 composants réutilisables (BoutonSigner, BoutonSupprimer…)
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx, TableauTriColonnes.tsx
    │   │   ├── ZoneObservation.tsx, BlocSignatures.tsx
    │   │   ├── DialogDeverrouillage.tsx
    │   │   └── ModaleFichePeriode.tsx       # création + édition titre/dates
    │   ├── entretien/              # 8 sous-composants entretien tripartite
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx
    │   │   ├── GrilleCompetences.tsx        # groupement sous-famille (3 niveaux)
    │   │   ├── GrilleAttitudes.tsx
    │   │   └── BandeauCloture.tsx
    │   └── pdf/                    # export lazy (LivretPdf 7 sections)
    ├── pages/
    │   ├── TableauDeBord.tsx, NotFound.tsx, PagePlaceholder.tsx
    │   ├── OrganisationSuivi.tsx
    │   ├── EntretienTripartite.tsx
    │   ├── FicheSuiviPeriodes.tsx           # bouton + Nouvelle période + édition + suppression
    │   ├── FicheSuiviPeriodeDetail.tsx      # titre + bouton Modifier
    │   ├── EvaluationFinale.tsx             # résolution référentiel via store
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx      # CRUD 4 rôles
    │       ├── GestionFormations.tsx
    │       ├── GestionAffectations.tsx
    │       └── GestionReferentiels.tsx      # liste + import CSV/XLSX + checkboxes par compétence
    └── test/setup.ts
```

---

## 8. Reste à faire

### A. Documentation — Formaliser CDC v1.5

Documenter les changements négociés depuis v1.3 :

- §4.1 : ajout des rôles **Coordo** et **Admin**
- §6 : nouvelles ressources de la matrice (admin.* + fiche.modifier-periode + fiche.supprimer-periode + admin.referentiels.gerer)
- §6 : `creer-apprenti` et `creer-maitre` ouverts au formateur référent ; `creer-periode`, `modifier-periode`, `supprimer-periode` ouverts au coordo
- §7.1 : types `Coordo`, `Admin`, `Lieu` ; `Formation` enrichi ; `FicheSuiviPeriode.titre?` ; `Competence.evalueeEnEntreprise?`
- §7.2 : `Competence.sousFamille?` (3 niveaux hiérarchiques optionnels)
- §10.4 : règle de gouvernance — affectations verrouillées dès le démarrage du contrat / fiches existantes / entretien initialisé
- §17.2 : entrées glossaire *Coordinateur·rice*, *Administrateur·rice*
- Nouvelle section : workflow d'import référentiels (CSV + XLSX, génération auto du libellé, association formation)
- Nouvelle section : flag « compétence abordée en entreprise »

→ noté dans `TODO-etape-2.md`.

### B. Évaluation finale et flag `evalueeEnEntreprise` (à arbitrer)

`GrilleCompetences` montre encore la colonne « Acquis en entreprise » pour toutes les compétences, indépendamment du flag. À décider avec le pilote : faut-il désactiver/masquer cette colonne pour les compétences `evalueeEnEntreprise === false` ? La règle actuelle ne couvre que le tableau de suivi par période.

### C. R13 — choix de gouvernance (à arbitrer)

R13 reste actuellement bloquante : on ne peut créer la période N que si la N-1 est signée. À décider avec le pilote : faut-il l'assouplir en avertissement non-bloquant (le formateur peut créer même si N-1 non signée, à ses risques) ?

### D. Sécurité VPS — action côté pilote (urgent)

> Le mot de passe SSH root du VPS a été partagé en clair dans une conversation et doit être changé.

- [ ] `passwd` sur le VPS pour changer le mot de passe root
- [ ] Générer une clé SSH dédiée au déploiement (`ssh-keygen -t ed25519`)
- [ ] Pousser la clé publique sur le VPS (`ssh-copy-id`)
- [ ] Désactiver l'auth par mot de passe dans `/etc/ssh/sshd_config` (`PasswordAuthentication no`, `PermitRootLogin no` ou `prohibit-password`, `systemctl restart sshd`)
- [ ] Vérifier que le mot de passe Basic Auth est partagé via canal sécurisé
- [ ] Avant chaque démo importante : `bash scripts/verifier-vps.sh` doit retourner 11/11 OK

Procédure complète dans `scripts/README.md` § *Sécurité*.

---

## 9. Limites connues (CDC §3 + observations)

- Pas d'authentification réelle — role switcher uniquement (étape 3 du programme)
- Pas de RGPD / RGAA strict — bonnes pratiques seulement
- Pas de notifications email — étape 2 du programme
- Pas de multi-établissement — un seul GRETA fictif
- Pas de backup automatique — données vivent dans le `localStorage` de chaque navigateur
- Pas de monitoring (Uptime Kuma, logs centralisés)
- Pas d'historique granulaire (CDC §12) — la traçabilité minimale `modifieLe` existe + historique R10 spécifique
- Le déverrouillage temporaire des affectations n'est pas tracé (pas d'audit log) — décision pragmatique pour la maquette

---

## 10. Comment relancer le projet

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
npm test               # 272 tests Vitest
npm run e2e            # 93 tests E2E Playwright (build + preview + tests)
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
['livret-donnees','livret-role-actif','livret-apprenti-actif',
 'livret-utilisateurs','livret-formations','livret-referentiels']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 11. Décisions architecturales notables

- **SPA Vite** (pas de SSR), **Zustand** (pas de Redux/RTK), **CSS pur** pour les charts (pas de biblio), **parser CSV/XLSX maison** (pas de SheetJS) — choix dictés par la cible bundle de la maquette
- **XLSX via `fflate`** (~12 KB) pour la décompression ZIP, parser XML maison sur regex robustes
- **PDF lazy-loaded** : `@react-pdf/renderer` dans un chunk séparé (493 KB gzip), chargé uniquement au clic « Exporter » → bundle initial 125 KB
- **Tests TDD ciblés** sur la logique métier pure (`lib/`) ; les composants UI sont testés via Playwright E2E
- **Migration localStorage par bump de version** : reset complet à chaque bump (pas de migration logicielle, données fictives)
- **6 stores Zustand persistés avec import croisé** : synchronisations cross-store dans les actions, cycle résolu par ESM
- **Cohérence référentielle protectrice** : suppressions bloquées en cascade (apprenti·e si livret actif, maître/formateur si rattachements, formation si apprenti·e·s, référentiel si formations rattachées, fiche-période si verrouillée ou signée)
- **Mobile-first responsive** : drawer + RoleSwitcher compact + audit Playwright dédié 12 tests
- **Sélecteurs E2E stables via `data-testid`** sur les modales admin (corrige une race-condition observée avec `getByLabel(/regex/)` sous suite full Playwright)

---

## 12. Prochaine étape recommandée

L'étape 1 du CDC v1.3 est **livrée et fonctionnelle**. L'administration métier est complète (CRUD 4 rôles + formations + affectations + référentiels CSV/XLSX) avec :
- verrouillages de cohérence référentielle à toutes les couches,
- toggle « compétence abordée en entreprise » par compétence,
- gestion complète des fiches de période par le formateur référent et le coordo (création, renommage, suppression).

Il reste à faire :

1. **Formaliser CDC v1.5** — rassembler dans le CDC officiel toutes les évolutions négociées depuis v1.3 (rôles Coordo/Admin, ressources étendues, import référentiels CSV+XLSX, flag `evalueeEnEntreprise`, titre fiche, droits coordo sur les fiches, règle §10.4 verrouillage des affectations)
2. **Arbitrages métier ouverts** :
   - Évaluation finale et `evalueeEnEntreprise` (cf. §8.B)
   - R13 stricte ou avertissement (cf. §8.C)
3. **Sécurité VPS** — actions côté pilote (clé SSH, désactivation password auth — cf. §8.D)

---

*Étape 1 livrée — Sprint 5 + post-livraison complète : mobile + verrouillage UX + 6 apprenti·e·s + administration (CRUD 4 rôles + formations + affectations + référentiels CSV/XLSX) + flag « compétence abordée en entreprise » + gestion des fiches de période — cahier des charges v1.3.*
