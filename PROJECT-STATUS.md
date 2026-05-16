# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-05-17
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
| **Tests unitaires** | **313 / 313 ✓** (Vitest, 26 fichiers de test pour 28 modules `lib/`) |
| **Tests E2E** | **126 / 126 ✓** (Playwright — 114 desktop + 12 mobile Pixel 5, 17 specs) |
| **Bundle JS gzippé** | 127 KB (cible CDC §19.1 : < 500 KB → marge × 4) |
| **Bundle CSS gzippé** | 6,2 KB (cible : < 50 KB → marge × 8) |
| **Chunk PDF lazy** | 493 KB (chargé uniquement au clic « Exporter ») |
| **Préflight VPS** | 11 / 11 ✓ |
| **TypeScript** | strict, sans erreur |
| **ESLint** | sans erreur |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` — **8 stores** persistés en localStorage :
  - `livret-donnees` (schema v7) — livrets, fiches, entretiens, évaluations
  - `livret-role-actif` — rôle + maître actif
  - `livret-apprenti-actif` — id de l'apprenti·e affiché·e
  - `livret-utilisateurs` (schema v1) — apprenti·e·s, maîtres, formateurs, coordos, admins
  - `livret-formations` (schema v2) — formations (intitulé, niveau, dates, **lieuId**, référentiel)
  - `livret-referentiels` (schema v1) — référentiels de compétences (Bloc → Sous-famille? → Compétence)
  - `livret-banque-questions` (schema v1) — banque centrale des questions de l'entretien tripartite
  - `livret-etablissements` (schema v1) — lieux de formation + URL Pronote (gestion admin uniquement)
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
- **VPS root SSH par mot de passe** — à basculer en clé SSH (cf. §8.E)

---

## 4. Modules livrés

### Sprints CDC v1.3 (1 → 5) — livraison initiale

- **Sprint 1** — Socle Vite + React + TS + Tailwind, AppShell, role switcher 5 rôles, bandeau démo, matrice de droits §6, 6 routes, déploiement opérationnel
- **Sprint 2** — Fiches de suivi par période, tableau tri-colonnes (desktop + mobile empilé), référentiel CAP Cuisine, machine à états R15/R16/R17, persistance Zustand
- **Sprint 3** — Organisation du suivi, entretien tripartite complet, R6/R7/R8/R9, barres de progression
- **Sprint 4** — Grilles d'évaluation finales (compétences + attitudes), synthèse graphique CSS pure, pré-remplissage last-write-wins depuis les fiches, R23/R24
- **Sprint 5** — R22 clôture livret (14 tests TDD), R10 déverrouillage motivé (8 tests TDD), export PDF lazy 7 sections, démo minutée, polish UX

### Extensions hors-CDC v1.3 — négociées avec le pilote

#### Rôles Coordo + Admin

- 4ᵉ et 5ᵉ rôles dans le système (couleurs cyan-700 et indigo-700)
- 12 ressources `admin.*` dans la matrice (utilisateurs, formations, affectations, référentiels, banque-questions)
- Pages CRUD réelles : utilisateurs ✓ + formations ✓ + affectations ✓ + référentiels ✓ + banque-questions ✓
- Fixtures : Martine LEFÈVRE (coordo), Guillaume FERRERI (admin)
- **Aucun droit pédagogique** pour ces deux rôles — testé exhaustivement (commentaires, niveaux, signatures, observations exclus)
- **Exception métier** : le formateur référent peut créer un·e apprenti·e + un maître (besoin terrain)

#### Import de référentiels (CSV + XLSX)

- Phases A → E livrées : type `Competence.sousFamille?` + `Referentiel.niveauxColonnes?: 2 | 3` + parser CSV (encodage UTF-8/CP1252 auto, séparateur auto) + parser XLSX maison (`fflate` pour ZIP + sharedStrings + sheet1, regex robustes) + détection automatique CSV vs XLSX par signature ZIP
- Tests d'intégration sur les 4 fichiers exemples réels du pilote (`exemple-{1,2}.{csv,xlsx}` dans `src/lib/__fixtures__/`) côté unitaire ET E2E
- **Workflow finalisé** :
  - Formation à associer **optionnelle** : un référentiel peut être importé seul puis rattaché plus tard à 1 ou plusieurs formations (relation N:1 — `Formation.referentielId` côté formation)
    - Avec formation → libellé auto-généré `Referentiel_<intitulé>_<YYYY-MM-DD>` + rattachement automatique
    - Sans formation → champ « Nom du référentiel » libre (≥ 3 caractères)
  - La carte du référentiel affiche la (les) formation(s) qui l'utilise(nt) — ou « Aucune formation rattachée »
  - `Referentiel.source` typé `'import-csv'` ou `'import-xlsx'`

#### Tableau de bord — 6 apprenti·e·s scénarisé·e·s (CDC §24.5)

Léa MARTIN (cas principal), Théo DUBOIS (« bon élève »), Sofia PEREIRA (« alerte R7 »), Minh NGUYEN (« démarrage »), Aya KOUAMÉ (« désaccord R10 »), Luca BIANCHI (« mi-parcours »). 2 maîtres : Karim BENALI + Hélène ROCHE. Sélecteur de maître côté `maitre`, recherche normalisée, badges démonstratifs.

#### Responsive mobile (cas d'usage terrain)

`MobileMenu` hamburger + drawer accessible (`role=dialog`, focus piégé, Esc), `RoleSwitcher` compact, touch targets ≥ 44 px (WCAG 2.5.5), audit Playwright dédié 12 tests sur Pixel 5.

### Post-livraison mai 2026 — chantiers fonctionnels et UX

#### Renommages du menu principal (16 mai 2026)

Rationalisation du vocabulaire de la sidebar suite à un retour pilote :
- L'ancien **« Organisation du suivi »** (page modulaire d'événements) devient **« Fiches de suivi »** (libellé visible)
- L'ancien **« Fiches de suivi »** (cahier de période par alternance) devient **« Période en Entreprise »** (libellé visible)
- Les URLs internes (`/livret/organisation-suivi`, `/livret/fiches-suivi`) et les ressources techniques (matrice `'organisation-suivi'`, noms de fichiers/imports lib `organisation-suivi.ts`) **restent inchangés** — pas de migration nécessaire, juste un renommage UI cohérent (sidebar + titres de page + section PDF + tests E2E)

#### Établissements (lieux de formation) + Pronote WEB (17 mai 2026)

Refonte du modèle de données : les lieux de formation, jusque-là inline dans `Formation.lieu: Lieu`, deviennent des **entités à part entière** gérées en CRUD par l'administrateur·rice uniquement. Chaque établissement porte une URL Pronote optionnelle (le portail du lieu).

**Modèle** :
- Nouveau type `Etablissement { id, nom, adresse?, codePostal?, ville?, urlPronote? }`
- `Formation.lieu: Lieu` → `Formation.lieuId: string` (relation N:1)
- Nouveau store `useEtablissementsStore` (persist v1, CRUD admin uniquement, verrou suppression si formation rattachée)
- Lib `etablissement-verrou` (4 tests TDD)
- Migration : `useFormationsStore` bumpé v1 → v2 (reset complet, cohérent avec la stratégie projet)

**Page admin `/admin/etablissements`** (rôle `admin` uniquement, ressource matrice `admin.etablissements.gerer`) :
- CRUD complet (nom + adresse + code postal + ville + URL Pronote)
- Validation : nom ≥ 3 caractères, URL `https?://...` (optionnelle)
- Suppression bloquée si une formation référence l'établissement

**Page utilisateur `/livret/pronote`** (visible **tous rôles**) :
- Page explicative : présentation de Pronote, garantie sécurité (aucun stockage de credentials côté livret)
- **Filtrage par rôle** (lib `etablissements-accessibles`, 9 tests TDD) :
  - **admin** : tous les établissements
  - **coordo** : ceux où il/elle a au moins une formation rattachée (`Coordo.formationIds`)
  - **formateur** : ceux des promos qu'il/elle encadre (`Formateur.promoIds`)
  - **apprenti·e** : celui de sa formation
  - **maître** : ceux des formations de ses apprenti·e·s (déduplication)
- Chaque établissement avec URL est un lien `target="_blank" rel="noopener noreferrer"`
- Si pas d'URL configurée : affiché en lecture seule avec mention « URL Pronote non configurée »

**Modale Formation adaptée** :
- L'ancien bloc « Nom du lieu / Adresse / CP / Ville » (4 champs texte) est remplacé par un **select déroulant unique** « Lieu de formation » listant les établissements créés par l'admin
- Si aucun établissement n'a encore été créé : message guidant vers `/admin/etablissements`

**Suppression de l'ancien `usePronoteStore`** (liens Pronote plats sans rattachement) — remplacé par `Etablissement.urlPronote`.

#### Banque de questions de l'entretien tripartite

Refonte complète : les questions ne sont plus codées en dur, elles vivent dans une **banque centrale** (CRUD coordo + admin sur `/admin/banque-questions`). Le **formateur référent sélectionne par livret** les questions à poser pour l'apprenti·e et le maître.
- Types : `QuestionBanque { id, cible, type, libelle, placeholder? }` — 3 types (`texte-court`, `texte-long`, `oui-non`)
- `EntretienTripartite` adapté : `questionsApprentiSelectionnees: string[]` + `questionsMaitreSelectionnees: string[]` + réponses indexées par `questionId`
- Lib `questions-entretien` (14 tests TDD) : catalogue par défaut **11 questions reformulées de façon neutre** + helpers `idsQuestionsInitiales` / `reponseEstRenseignee` / `nettoyerReponses` / `questionEstUtilisee`
- Store `useBanqueQuestionsStore` (CRUD + persist v1, suppression bloquée si question référencée)
- UI : modale `SelecteurQuestions` avec réordonnancement ↑/↓, réponses orphelines nettoyées automatiquement
- Bloc « Appréciation maître » (4 critères ++/+/-/--) reste **en dur** (élément standardisé CDC §5.2)
- PDF adapté pour itérer sur les questions sélectionnées

#### Organisation du suivi modulaire

Refonte complète : passage des 6 cadres rigides à une **liste dynamique d'événements** créée à la demande par le formateur référent.
- Types : `MotifOrganisationSuivi` (7 valeurs : `reunion-rentree`, `entretien-individuel`, `accueil-tuteur`, `visite-entreprise`, `restitution-activites`, `bilan-formation`, `autre`) et `EvenementOrganisationSuivi { id, motif, titre?, date?, commentaire?, verrouille? }`
- `OrganisationSuivi` simplifié : `evenements: []`
- Lib `organisation-suivi` (13 tests TDD) : catalogue + helpers `metadonneesMotif` / `libelleEvenement` / `creerEvenementVierge` / `peutSupprimerEvenement`
- 3 mutations granulaires `ajouter` / `modifier` / `supprimerEvenementOrganisation`
- **Plusieurs cadres du même motif autorisés** (ex. 3 visites distinctes) avec titre custom optionnel
- Verrou de suppression : un événement verrouillé doit d'abord être déverrouillé
- Fixtures démo réécrites : Léa porte 8 événements scénarisés (5 standards + 3 visites titrées)

#### Trio contextuel dans le header

Sous « Connecté en tant que … », une seconde ligne affiche les **3 personnes du trio pédagogique** rattachées à l'apprenti·e actif·ve (apprenti / maître / formateur), avec icônes et couleurs des rôles correspondants. Mise à jour automatique au switch d'apprenti·e. **Visible desktop + mobile** (bandeau dédié sous le header sur < lg).

#### Création / renommage / suppression de fiches de période

Le formateur référent et le coordo peuvent gérer les fiches :
- Type `FicheSuiviPeriode.titre?: string` — affichage `Période N — <titre>` ou `Période N` seul
- Droits étendus : `fiche.creer-periode` au coordo + nouvelles ressources `fiche.modifier-periode` et `fiche.supprimer-periode`
- Lib `validation-fiche-periode` (15 tests TDD) : titre + dates + R11/R12/R13/R14, mode édition, `peutSupprimerFichePeriode`
- `ModaleFichePeriode` + boutons modifier/supprimer par carte (confirmation 2 clics)

#### Compétences abordées en entreprise

Flag par compétence pour exclure du suivi en entreprise les compétences purement académiques :
- `Competence.evalueeEnEntreprise?: boolean` (défaut implicite `true`)
- Lib `competence-entreprise` (6 tests TDD)
- UI checkbox par compétence dans la page Référentiels
- `TableauTriColonnes.AjouterCompetence` n'expose que les compétences cochées ; lignes déjà saisies pour des compétences décochées **restent visibles** (cohérence historique)

#### Audit mobile + corrections tableaux admin

Audit Playwright Pixel 5 (393×851) sur 11 captures fullPage + viewport. Corrections livrées :
- Page Gestion utilisateurs : colonne Email masquée sur < md, repliée sous le nom, padding réduit
- Page Gestion affectations (6 colonnes) : indicateur visuel de scroll horizontal + `min-w-[42rem]` pour garantir le scroll franc

#### Cohérence des actions destructrices

10 actions destructrices/engageantes utilisent toutes une confirmation explicite (signature, suppression de compétence/ligne GRETA/compte/fiche/référentiel/formation/événement organisation/question banque, clôture R22, déverrouillage temporaire d'affectation). Une seule modale stricte : R10 (déverrouillage avec motif obligatoire ≥ 10 caractères).

#### Bugfix R21 (régression silencieuse)

Helper `peutEncoreEditerFiche(fiche, role)` dans `lib/transitions-fiche.ts` (6 tests TDD) — empêche un rôle de modifier ses zones après avoir signé. Mention UI explicite « Figée par signature ».

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

## 6. Tests (313 unitaires + 126 E2E)

### Tests unitaires Vitest (26 fichiers de test pour 28 modules `lib/`)

| Fichier | Tests | Périmètre |
|---|---|---|
| `lib/droits.test.ts` | 37 | Matrice **46 ressources × 5 rôles**, cohérence transverse (45 + admin.etablissements.gerer, − admin.pronote.gerer remplacé) |
| `lib/transitions-fiche.test.ts` | 20 | R15/R16/R17/R21 |
| `lib/validation-signature.test.ts` | 11 | R18/R20 par rôle |
| `lib/regles-periode.test.ts` | 15 | R11/R12/R13 |
| `lib/regles-entretien.test.ts` | 19 | R7/R8/R9 + progression (adapté aux questions sélectionnées) |
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
| `lib/validation-import-referentiel.test.ts` | 11 | Saisie d'import (formation optionnelle, nom libre conditionnel) + génération du libellé canonique |
| `lib/referentiel-verrou.test.ts` | 4 | Verrou suppression référentiel |
| `lib/parser-xlsx.test.ts` | 16 | Parser XLSX + tests d'intégration sur les 4 fichiers exemples du pilote |
| `lib/competence-entreprise.test.ts` | 6 | Flag `evalueeEnEntreprise` |
| `lib/validation-fiche-periode.test.ts` | 15 | Saisie fiche + `peutSupprimer` + `libelleFichePeriode` |
| `lib/organisation-suivi.test.ts` | 13 | Catalogue motifs + helpers + verrou `peutSupprimerEvenement` |
| `lib/questions-entretien.test.ts` | 14 | Catalogue 11 questions par défaut (formulation neutre) + helpers |
| `lib/etablissement-verrou.test.ts` | 4 | Verrou suppression d'un établissement référencé par une formation |
| `lib/etablissements-accessibles.test.ts` | 9 | Filtrage par rôle des établissements visibles sur `/livret/pronote` |

*Les modules `creation-livret.ts` et `utils.ts` sont couverts indirectement via les tests E2E.*

### Tests E2E Playwright (17 specs)

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
| `chromium-desktop` | `admin-referentiels.spec.ts` | 14 | Import textarea, **import des 4 fichiers exemples réels (CSV+XLSX, 2/3 niveaux)**, association auto, toggle « abordée en entreprise », import sans formation (orphelin), affichage des formations rattachées |
| `chromium-desktop` | `fiches-periodes.spec.ts` | 8 | Création/renommage/suppression : droits, R13, blocage si signée, titre custom |
| `chromium-desktop` | `organisation-suivi.spec.ts` | 7 | Refonte modulaire : ajout par motif, multi-occurrences, suppression 2 clics, persistance, **verrou suppression si événement verrouillé** |
| `chromium-desktop` | `header-trio-contextuel.spec.ts` | 4 | Trio apprenti·e / maître / formateur dans le header — affichage par défaut, mise à jour au switch d'apprenti·e |
| `chromium-desktop` | `banque-questions.spec.ts` | 7 | CRUD admin banque + sélection questions par formateur référent + lecture seule apprenti·e + verrou suppression si utilisée |
| `chromium-desktop` | `etablissements.spec.ts` | 13 | CRUD admin établissements (admin uniquement) + URL Pronote + filtrage par rôle sur `/livret/pronote` + verrou suppression + visibilité menu |
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
├── e2e/                            # tests Playwright (16 specs)
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css
    ├── types/index.ts              # CDC §7 + extensions (titre fiche, evalueeEnEntreprise, EvenementOrganisationSuivi, QuestionBanque, etc.)
    ├── lib/                        # 28 modules + 26 fichiers tests
    │   ├── droits.ts               # matrice §6 (46 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21
    │   ├── validation-signature.ts # R18/R20
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6/R7/R8/R9 (adapté aux questions sélectionnées)
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
    │   ├── organisation-suivi.ts   # catalogue motifs + helpers + verrou suppression
    │   ├── questions-entretien.ts  # catalogue 11 questions par défaut + helpers
    │   ├── etablissement-verrou.ts # verrou suppression établissement (cf. formations)
    │   ├── etablissements-accessibles.ts # filtrage par rôle pour /livret/pronote
    │   ├── __fixtures__/           # exemple-{1,2}.{csv,xlsx} (fichiers du pilote)
    │   └── utils.ts
    ├── store/                      # 8 stores Zustand persistés
    │   ├── useUserStore.ts
    │   ├── useLivretStore.ts       # données livret (persist v7)
    │   ├── useApprentiActifStore.ts
    │   ├── useUtilisateursStore.ts # CRUD utilisateurs (persist v1)
    │   ├── useFormationsStore.ts   # CRUD formations (persist v2 — refonte lieuId)
    │   ├── useReferentielsStore.ts # CRUD référentiels (persist v1)
    │   ├── useBanqueQuestionsStore.ts # CRUD banque questions entretien (persist v1)
    │   └── useEtablissementsStore.ts # CRUD établissements + URL Pronote (persist v1, admin uniquement)
    ├── fixtures/
    │   ├── utilisateurs.ts         # 6 apprenti·e·s + 2 maîtres + Sophie + Martine + Guillaume
    │   ├── formations.ts           # CAP Cuisine 2025-2026 (lieuId vers etablissementsDemo)
    │   ├── etablissements.ts       # 1 établissement par défaut (Site Diderot)
    │   ├── referentiel-cap-cuisine.ts
    │   └── livret-demo.ts          # 6 livrets scénarisés (CDC §24.5)
    ├── components/
    │   ├── admin/
    │   │   ├── ModaleApprenti.tsx
    │   │   ├── ModaleUtilisateurStaff.tsx
    │   │   ├── ModaleFormation.tsx
    │   │   ├── ModaleImportReferentiel.tsx
    │   │   └── ModaleQuestion.tsx          # CRUD banque questions
    │   ├── layout/
    │   │   ├── AppShell.tsx, BandeauDemo.tsx, RoleSwitcher.tsx
    │   │   ├── Sidebar.tsx                 # filtre admin par lien selon droits
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/                         # composants réutilisables (BoutonSigner, BoutonSupprimer…)
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx, TableauTriColonnes.tsx
    │   │   ├── ZoneObservation.tsx, BlocSignatures.tsx
    │   │   ├── DialogDeverrouillage.tsx
    │   │   └── ModaleFichePeriode.tsx       # création + édition titre/dates
    │   ├── entretien/
    │   │   ├── SectionApprenti.tsx          # questions dynamiques (banque)
    │   │   ├── SectionMaitre.tsx            # questions dynamiques + appréciation 4 critères en dur
    │   │   └── SelecteurQuestions.tsx       # modale sélection + réordonnancement ↑/↓
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx
    │   │   ├── GrilleCompetences.tsx        # groupement sous-famille (3 niveaux)
    │   │   ├── GrilleAttitudes.tsx
    │   │   └── BandeauCloture.tsx
    │   └── pdf/                             # export lazy (LivretPdf 7 sections, banque injectée)
    ├── pages/
    │   ├── TableauDeBord.tsx, NotFound.tsx, PagePlaceholder.tsx
    │   ├── OrganisationSuivi.tsx           # liste modulaire d'événements (libellé UI : « Fiches de suivi »)
    │   ├── EntretienTripartite.tsx
    │   ├── FicheSuiviPeriodes.tsx          # libellé UI : « Période en Entreprise »
    │   ├── FicheSuiviPeriodeDetail.tsx
    │   ├── EvaluationFinale.tsx
    │   ├── PronoteWeb.tsx                  # page explicative + liens externes (tous rôles)
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx
    │       ├── GestionFormations.tsx
    │       ├── GestionAffectations.tsx
    │       ├── GestionReferentiels.tsx
    │       ├── GestionBanqueQuestions.tsx  # CRUD banque questions entretien
    │       └── GestionEtablissements.tsx   # CRUD établissements + URL Pronote (admin uniquement)
    └── test/setup.ts
```

---

## 8. Reste à faire

### A. Documentation — Formaliser CDC v1.5

Documenter dans le CDC officiel toutes les évolutions négociées depuis v1.3 :

- §4.1 : ajout des rôles **Coordo** et **Admin**
- §5.1 : refonte modulaire de l'organisation du suivi (liste d'événements à la demande, multi-occurrences d'un même motif autorisées, catalogue de 7 motifs)
- §5.2 : refonte de l'entretien tripartite — banque centrale de questions (CRUD coordo + admin), **sélection par livret** par le formateur référent, 3 types de réponse (texte court / texte long / oui-non), bloc « Appréciation maître » 4 critères inchangé
- §6 : 46 ressources de matrice (admin.* + fiche.modifier-periode + fiche.supprimer-periode + admin.referentiels.gerer + admin.banque-questions.gerer + admin.etablissements.gerer (admin uniquement))
- §6 : `creer-apprenti` et `creer-maitre` ouverts au formateur référent ; `creer/modifier/supprimer-periode` ouverts au coordo
- §7.1 : types `Coordo`, `Admin`, **`Etablissement`** (remplace `Lieu`) ; `Formation.lieuId: string` (référence vers `useEtablissementsStore`) ; `FicheSuiviPeriode.titre?` ; `Competence.evalueeEnEntreprise?` ; refonte `OrganisationSuivi { evenements: [] }` + types `MotifOrganisationSuivi` / `EvenementOrganisationSuivi` ; refonte `EntretienTripartite` avec questions sélectionnées + réponses indexées par questionId + types `QuestionBanque` / `CibleQuestion` / `TypeQuestion`
- §7.2 : `Competence.sousFamille?` (3 niveaux hiérarchiques optionnels)
- §10.4 : règle de gouvernance — affectations verrouillées dès le démarrage du contrat / fiches existantes / entretien initialisé
- §17.2 : entrées glossaire *Coordinateur·rice*, *Administrateur·rice*
- Nouvelle section : workflow d'import référentiels (CSV + XLSX, formation optionnelle, génération auto du libellé OU nom libre, affichage N:1 sur la carte)
- Nouvelle section : flag « compétence abordée en entreprise »
- Nouvelle section : **« Établissements »** (lieux de formation) — gestion CRUD réservée à l'admin, chaque établissement porte une URL Pronote optionnelle, `Formation.lieuId` remplace `Formation.lieu` inline
- Nouvelle section : **« Pronote WEB »** — page utilisateur visible tous rôles, filtrage par rôle via les établissements rattachés (formationIds / promoIds / apprentiIds), ouverture nouvel onglet (pas de SSO côté maquette)
- Renommage UI : « Organisation du suivi » → « Fiches de suivi » ; « Fiches de suivi » → « Période en Entreprise » (libellés visibles uniquement — URLs internes et ressources matrice inchangées)

→ noté dans `TODO-etape-2.md`.

### B. Évaluation finale et flag `evalueeEnEntreprise` (à arbitrer)

`GrilleCompetences` montre encore la colonne « Acquis en entreprise » pour toutes les compétences, indépendamment du flag. À décider avec le pilote : faut-il désactiver/masquer cette colonne pour les compétences `evalueeEnEntreprise === false` ? La règle actuelle ne couvre que le tableau de suivi par période.

### C. R13 — choix de gouvernance (à arbitrer)

R13 reste actuellement bloquante : on ne peut créer la période N que si la N-1 est signée. À décider avec le pilote : faut-il l'assouplir en avertissement non-bloquant ?

### D. Pistes d'évolution discutées, non engagées

Idées soulevées en revue mais reportées (typiquement à l'étape 2, qui apporte l'authentification réelle) :

#### Signature manuscrite tactile (canvas au doigt)

À la place du clic + confirmation actuel, capturer le tracé manuscrit du·de la signataire sur un `<canvas>` HTML5 (compatible tactile + souris).

- **Coût estimé** : 1,5 à 2 jours (composant canvas via `signature_pad` ~5 KB gzip + modale plein écran sur mobile + insertion PNG dans `LivretPdf` + tests E2E + migration `Signature = { signe, dateSignature, image?: dataURL }`)
- **Bénéfice étape 1** : polish UX uniquement (la signature actuelle est déjà claire avec horodatage ISO + confirmation 2 clics)
- **Bénéfice étape 2** : substantiel — combinée à une session authentifiée et un horodatage serveur, la signature manuscrite acquiert un poids juridique (Loi 2000-230, art. 1366 du Code civil)
- **Piège anticipé** : poids du stockage. Une signature PNG 400×150 px en base64 ≈ 10-20 KB → vite 1-2 Mo sur la limite localStorage 5 Mo. Solutions possibles : compression, réduction de résolution, ou stockage SVG vectoriel
- **Recommandation actuelle** : reporter à l'étape 2 quand l'auth réelle arrive — l'investissement aura alors sa pleine valeur

### E. Sécurité VPS — action côté pilote (urgent)

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
npm test               # 313 tests Vitest
npm run e2e            # 126 tests E2E Playwright (build + preview + tests)
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
 'livret-utilisateurs','livret-formations','livret-referentiels',
 'livret-banque-questions','livret-etablissements']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## 11. Décisions architecturales notables

- **SPA Vite** (pas de SSR), **Zustand** (pas de Redux/RTK), **CSS pur** pour les charts (pas de biblio), **parser CSV/XLSX maison** (pas de SheetJS) — choix dictés par la cible bundle de la maquette
- **XLSX via `fflate`** (~12 KB) pour la décompression ZIP, parser XML maison sur regex robustes
- **PDF lazy-loaded** : `@react-pdf/renderer` dans un chunk séparé (493 KB gzip), chargé uniquement au clic « Exporter » → bundle initial 127 KB
- **Tests TDD ciblés** sur la logique métier pure (`lib/`) ; les composants UI sont testés via Playwright E2E
- **Migration localStorage par bump de version** : reset complet à chaque bump (pas de migration logicielle, données fictives)
- **8 stores Zustand persistés avec import croisé** : synchronisations cross-store dans les actions, cycle résolu par ESM
- **Cohérence référentielle protectrice** : suppressions bloquées en cascade (apprenti·e si livret actif, maître/formateur si rattachements, formation si apprenti·e·s, référentiel si formations rattachées, fiche-période si verrouillée ou signée, événement organisation si verrouillé, question banque si utilisée par un entretien, établissement si formation rattachée)
- **Mobile-first responsive** : drawer + RoleSwitcher compact + audit Playwright dédié 12 tests + corrections récentes sur les tableaux admin
- **Sélecteurs E2E stables via `data-testid`** sur les modales admin (corrige une race-condition observée avec `getByLabel(/regex/)` sous suite full Playwright)

---

## 12. Prochaine étape recommandée

L'étape 1 du CDC v1.3 est **livrée et fonctionnelle**, étendue par 2 vagues post-livraison (administration métier + refonte modulaire des sections principales) :

- administration métier complète : CRUD 4 rôles + formations + affectations + référentiels CSV/XLSX + banque de questions + **établissements (lieux de formation + URLs Pronote)**
- verrouillages de cohérence référentielle à toutes les couches
- organisation du suivi modulaire (liste dynamique d'événements) — libellé UI « Fiches de suivi »
- entretien tripartite avec banque de questions configurable + sélection par livret
- trio contextuel dans le header (apprenti·e / maître / formateur)
- audit mobile complet + corrections tableaux admin
- page Pronote WEB filtrée par rôle (apprenti·e voit son établissement, coordo ses formations rattachées, formateur ses promos, maître ceux de ses apprenti·e·s, admin tout)

Il reste à faire :

1. **Formaliser CDC v1.5** — rassembler dans le CDC officiel toutes les évolutions négociées depuis v1.3 (cf. §8.A — liste exhaustive)
2. **Arbitrages métier ouverts** :
   - Évaluation finale et `evalueeEnEntreprise` (cf. §8.B)
   - R13 stricte ou avertissement (cf. §8.C)
3. **Sécurité VPS** — actions côté pilote (clé SSH, désactivation password auth — cf. §8.E)

---

*Étape 1 livrée — Sprint 5 + post-livraison complète : mobile + verrouillage UX + 6 apprenti·e·s + administration (CRUD 4 rôles + formations + affectations + référentiels CSV/XLSX + banque de questions) + flag « compétence abordée en entreprise » + gestion modulaire des fiches de période, de l'organisation du suivi et des questions d'entretien — cahier des charges v1.3.*
