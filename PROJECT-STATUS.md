# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-05-06
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3)
**Pilote métier** : Guillaume FERRERI

---

## 1. En bref

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Accès** | Basic Auth `demo` / *(mdp partagé hors-canal)* |
| **Sprints livrés** | 1, 2, 3, 4 + 3 extensions hors-CDC (Coordo, Admin, import référentiels phase A/B) |
| **Sprint en cours** | Sprint 5 (export PDF + polish + DEMO scriptée) — **non démarré** |
| **Tests automatisés** | **134 / 134 ✓** sur 8 fichiers de tests |
| **Bundle JS gzippé** | 89 KB (cible CDC §19.1 : < 500 KB) |
| **Bundle CSS gzippé** | 4.85 KB (cible : < 50 KB) |
| **Préflight VPS** | 11 / 11 ✓ |
| **TypeScript** | strict, sans erreur |
| **ESLint** | sans erreur |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` (localStorage, schema v2)
- **Routing** : React Router v6
- **Tests** : Vitest 2 + Testing Library + jsdom
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
| **Conteneur livret** | `nginx:1.27-alpine`, 3 Mo RAM, 0% CPU, sur réseau `n8n_default` |
| **Web root** | `/var/www/livret/` (bind-mount RO côté conteneur) |
| **Compose** | `/docker/livret/docker-compose.yml` |
| **Basic Auth** | middleware Traefik (bcrypt) |

### Scripts de déploiement (`scripts/`)

| Fichier | Rôle |
|---|---|
| `.env.deploy.example` | Gabarit de configuration (domaine, IP, Basic Auth) |
| `.env.deploy` | Valeurs réelles — **JAMAIS committé** (dans `.gitignore`) |
| `setup-vps.sh` | Installation initiale du VPS — idempotent, à exécuter UNE fois |
| `docker-compose.livret.yml` | Compose du conteneur nginx + labels Traefik |
| `nginx-livret.conf` | Config Nginx du conteneur (SPA fallback, gzip, cache) |
| `deploy.sh` | Build + transfert (rsync ou tar+scp en fallback Windows) |
| `verifier-vps.sh` | 11 contrôles préflight (DNS, TLS, Basic Auth, headers, anti-tracker) |
| `README.md` | Procédure complète |

### Procédure de déploiement courante

```bash
# Build + déploiement (depuis la racine projet)
bash scripts/deploy.sh

# Vérification
bash scripts/verifier-vps.sh
```

### Ce qui peut casser

- **Service DuckDNS gratuit** — best effort, peut tomber temporairement
- **Renouvellement Let's Encrypt** automatique par Traefik (vérifier les logs si > 60 j)
- **localStorage navigateur** — limite ~5 Mo, déjà géré (CDC §C1) avec modale d'export
- **VPS root SSH par mot de passe** : à basculer en clé SSH dès que possible (cf. §11)

---

## 4. Sprints livrés

### Sprint 1 — Socle + infrastructure + Skills

- [x] Projet Vite + React + TS + Tailwind + shadcn-ready initialisé
- [x] AppShell : header, role switcher, sidebar, footer
- [x] Bandeau démo non-dismissable (CDC §21.6)
- [x] 6 routes principales placeholder
- [x] Store Zustand `useUserStore` (rôle actif, persist)
- [x] Fixtures : 3 utilisateurs (Léa MARTIN, Karim BENALI, Sophie DUBOIS)
- [x] `lib/droits.ts` matrice §6 + tests TDD
- [x] Composant `ChampEditable` (wrapper droits)
- [x] VPS configuré, déploiement opérationnel, 11/11 préflight

### Sprint 2 — Fiches de suivi par période (cœur de valeur)

- [x] Liste + détail des fiches de période avec badges d'état
- [x] Sous-fiche **Suivi GRETA CFA** (formateur édite, ajout/suppression de lignes)
- [x] **Tableau tri-colonnes** complet (desktop = table / mobile = empilement par compétence)
- [x] Référentiel CAP Cuisine (3 blocs, 10 compétences, 6 attitudes)
- [x] Bloc signatures avec validation R20 + tooltip de blocage
- [x] Machine à états R15 / R16 / R17 (brouillon → en-cours → signée → verrouillée)
- [x] Persistance Zustand avec `persist` middleware (schema v2)
- [x] Indicateur "Enregistré" + détection localStorage indisponible (CDC §C3)
- [x] `useLivretStore` avec mutations granulaires (12+ actions)

### Sprint 3 — Organisation du suivi + Entretien tripartite

- [x] **Organisation du suivi** : 6 champs (réunion rentrée, entretien individuel, accueil tuteurs, visites, restitution, bilans)
- [x] **Entretien tripartite** complet :
  - En-tête pré-rempli depuis profil apprenti·e
  - 7 questions apprenti·e
  - 3 questions maître + boolean *déjà formé un·e apprenti·e*
  - Grille appréciation 4×4 (++/+/-/--)
  - 4 démarches admin oui/non + remarques
  - 4 conditions pratiques (textes)
  - 3 aides demandées oui/non + autres
  - 3 zones commentaires (1 par rôle)
  - Bloc signatures tripartite avec validerSignatureEntretien
- [x] R6 (un seul entretien par livret, initialisation idempotente)
- [x] R7 (bandeau ambre si > 60 j sans entretien complet)
- [x] R8 (verrouillage progressif par rôle après signature)
- [x] R9 (3 signatures = tout figé)
- [x] Barre de progression globale + 3 par rôle
- [x] Fixture Léa peuplée : entretien signé le 28/10/2025 (CDC §24.5)

### Sprint 4 — Grilles d'évaluation finales

- [x] Page `/livret/evaluation-finale` avec 2 onglets (Compétences / Attitudes)
- [x] **Grille compétences** par bloc (entreprise + centre)
- [x] **Grille attitudes** (++/+/-/-- par maître + formateur, commentaires)
- [x] **Synthèse graphique** par bloc — barres empilées CSS pures (pas de biblio externe)
- [x] **Pré-remplissage** depuis les fiches de suivi (last-write-wins) avec badge ✨ *Hérité des fiches*
- [x] R23 mise à jour temps réel
- [x] R24 apprenti·e voit en lecture seule
- [x] Mutations store : `setLigneCompetenceFinale`, `setLigneAttitudeFinale`

---

## 5. Extensions hors-CDC v1.3 (négociées avec le pilote)

### Extension 1 — Rôle Coordo (coordinateur·rice administratif·ve)

- [x] 4ᵉ rôle dans le système
- [x] Couleur `#0e7490` (cyan-700)
- [x] Section *Administration* dans la sidebar (Utilisateurs, Formations, Affectations)
- [x] 10 nouvelles ressources `admin.*` dans la matrice de droits
- [x] Pages placeholder (formulaires CRUD à venir en sprint dédié)
- [x] Fixture : Martine LEFÈVRE
- [x] **Aucun droit pédagogique** (testé exhaustivement)

### Extension 2 — Rôle Admin (super-utilisateur, vous)

- [x] 5ᵉ rôle dans le système
- [x] Couleur `#4338ca` (indigo-700) + icône 👑
- [x] Fixture : Guillaume FERRERI
- [x] Partage avec coordo : créer apprenti·e/maître/formateur, modifier/supprimer utilisateurs, gérer formations + affectations
- [x] **Droit exclusif** : créer un coordo
- [x] **Aucun droit pédagogique** (commentaires, niveaux, signatures, observations)
- [x] Tests TDD complets (10 cas) : pas un seul faux-positif côté pédagogie

### Extension 3 — Import de référentiels (Phase A + B sur 4)

- [x] **Phase A** : `Competence.sousFamille?: string` (groupement intermédiaire optionnel)
- [x] **Phase A** : `Referentiel.niveauxColonnes?: 2 \| 3` + `source?: ...` (métadonnées)
- [x] **Phase A** : ressource `admin.referentiels.gerer` (coordo + admin)
- [x] **Phase B** : `lib/import-referentiel.ts` complet avec :
  - Auto-détection encodage UTF-8 / Windows-1252 (cas Excel FR)
  - Auto-détection séparateur `;` / `,` / tab
  - Parser CSV minimal (sans dépendance externe, gère guillemets + BOM)
  - Auto-détection 2 vs 3 colonnes
  - Construction Referentiel + agrégation par bloc + ids uniques
  - Avertissements non-bloquants
  - Tests TDD : 24 / 24
- [ ] **Phase C** : UI page `/admin/referentiels` (liste + modal d'import) — à faire
- [ ] **Phase D** : adapter `GrilleCompetences` et `TableauTriColonnes` pour grouper par `sousFamille` — à faire
- [ ] **Phase E** : support XLSX via dynamic import — différable

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
| R10 | Déverrouillage formateur + motif | partiel | bouton sans motif (sprint 5 polish) |
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
| R21 | Retrait signature impossible | ✓ | par design (formateur via R10) |
| R22 | Clôture livret | non | sprint 5 (bouton à ajouter) |
| R23 | Synthèse temps réel | ✓ | recalcul à chaque render |
| R24 | Apprenti·e consulte à tout moment | ✓ | matrice droits + bandeau lecture |

---

## 7. Tests (134 / 134 ✓)

| Fichier | Tests | Périmètre |
|---|---|---|
| `lib/droits.test.ts` | 36 | Matrice des 32 ressources × 5 rôles, cohérence transverse |
| `lib/transitions-fiche.test.ts` | 14 | Machine à états R15/R16/R17 + auto-verrou |
| `lib/validation-signature.test.ts` | 11 | R18/R20 par rôle métier + coordo/admin refusés |
| `lib/regles-periode.test.ts` | 15 | R11 (dates) + R12 (chevauchement) + R13 (création) |
| `lib/regles-entretien.test.ts` | 19 | R7/R8/R9 + validerSignatureEntretien + progression |
| `lib/synthese-evaluation.test.ts` | 9 | Last-write-wins depuis fiches + valeur effective |
| `lib/stats-bloc.test.ts` | 6 | Compte des niveaux par bloc + pourcentage |
| `lib/import-referentiel.test.ts` | 24 | Parsing CSV, encodage CP1252, 2/3 colonnes, robustesse |

**Aucun test E2E / Playwright pour l'instant** — prévu en sprint 5 (CDC §22.2.3, skill `webapp-testing`).

---

## 8. Architecture des fichiers

```
livret-apprentissage/
├── PROJECT-STATUS.md                # ce fichier
├── CONVENTIONS.md                   # règles de code (résumé CDC §16)
├── DEMO.md                          # script de démo (à étoffer sprint 5)
├── TODO-etape-2.md                  # captures de scope creep
├── design-system/
│   └── MASTER.md                    # design system complet (CDC §14)
├── scripts/
│   ├── .env.deploy.example
│   ├── setup-vps.sh, deploy.sh, verifier-vps.sh
│   ├── docker-compose.livret.yml, nginx-livret.conf
│   └── README.md
├── package.json, vite.config.ts, vitest.config.ts, tsconfig*.json
├── tailwind.config.ts, postcss.config.js, components.json
├── eslint.config.js, .prettierrc.json, .gitignore
├── index.html
├── cahier-des-charges-livret-apprentissage-v1.3.md  # source de vérité fonctionnelle
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css             # tokens shadcn + thème institutionnel
    ├── types/index.ts               # CDC §7 + extensions Coordo/Admin/Lieu
    ├── lib/
    │   ├── utils.ts                 # cn() helper
    │   ├── droits.ts                # matrice §6 (32 ressources × 5 rôles)
    │   ├── transitions-fiche.ts     # R15/R16/R17 machine à états
    │   ├── validation-signature.ts  # R18/R20 fiches de période
    │   ├── regles-periode.ts        # R11/R12/R13/R14
    │   ├── regles-entretien.ts      # R6/R7/R8/R9 + progression
    │   ├── synthese-evaluation.ts   # last-write-wins depuis fiches
    │   ├── stats-bloc.ts            # compte des niveaux par bloc
    │   ├── import-referentiel.ts    # parsing CSV + encodage + agrégation
    │   └── *.test.ts                # 8 fichiers de tests, 134 tests
    ├── store/
    │   ├── useUserStore.ts          # rôle actif (persist)
    │   └── useLivretStore.ts        # données livret (persist v2)
    ├── fixtures/
    │   ├── utilisateurs.ts          # 5 utilisateurs (1 par rôle)
    │   ├── formations.ts            # CAP Cuisine 2025-2026
    │   ├── referentiel-cap-cuisine.ts # 3 blocs, 10 compétences, 6 attitudes
    │   └── livret-demo.ts           # Léa : 3 périodes (verrouillée/signée/en-cours) + entretien signé
    ├── components/
    │   ├── ui/                      # (vide — shadcn/ui à la demande)
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── BandeauDemo.tsx
    │   │   ├── RoleSwitcher.tsx     # 5 boutons
    │   │   └── Sidebar.tsx          # 6 entrées livret + 3 admin (conditionnel)
    │   ├── common/
    │   │   ├── ChampEditable.tsx    # wrapper droits visuels
    │   │   ├── SelecteurNiveau.tsx  # 3 ou 4 niveaux color-coded
    │   │   ├── SelecteurAppreciation.tsx # 4 niveaux ++/+/-/--
    │   │   ├── BadgeEtatFiche.tsx   # 4 états avec icône
    │   │   ├── BarreProgression.tsx
    │   │   └── IndicateurEnregistrement.tsx
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx
    │   │   ├── TableauTriColonnes.tsx # cœur de la co-édition
    │   │   ├── ZoneObservation.tsx
    │   │   └── BlocSignatures.tsx
    │   ├── entretien/
    │   │   ├── CaseOuiNon.tsx
    │   │   ├── EntretienHeader.tsx
    │   │   ├── EntretienProgression.tsx
    │   │   ├── BandeauAlerteR7.tsx
    │   │   ├── SectionApprenti.tsx
    │   │   ├── SectionMaitre.tsx
    │   │   ├── SectionFormateur.tsx
    │   │   └── BlocSignaturesEntretien.tsx
    │   └── evaluation/
    │       ├── SyntheseBloc.tsx     # barres empilées par bloc
    │       ├── GrilleCompetences.tsx
    │       └── GrilleAttitudes.tsx
    ├── pages/
    │   ├── TableauDeBord.tsx
    │   ├── PagePlaceholder.tsx
    │   ├── NotFound.tsx
    │   ├── OrganisationSuivi.tsx
    │   ├── EntretienTripartite.tsx
    │   ├── FicheSuiviPeriodes.tsx
    │   ├── FicheSuiviPeriodeDetail.tsx
    │   ├── EvaluationFinale.tsx
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx
    │       ├── GestionFormations.tsx
    │       └── GestionAffectations.tsx
    └── test/setup.ts
```

---

## 9. Reste à faire

### A. Sprint 5 — CDC §26 (officiel)

| Livrable | Effort estimé |
|---|---|
| Export PDF complet (page de garde, organisation, entretien, périodes, évaluations finales, historique) via `@react-pdf/renderer` | 1 session |
| R22 — bouton "Clôturer le livret" (formateur, après dernière fiche verrouillée) | 0.25 session |
| R10 — modale de déverrouillage avec motif obligatoire + traçabilité | 0.25 session |
| Bouton "Réinitialiser les données de démonstration" (CDC §24.8) | 0.1 session |
| Tests Playwright via `webapp-testing` skill (5 scénarios CDC §22.2.3) | 0.5 session |
| README utilisateur final (Guillaume) | 0.25 session |
| `DEMO.md` étoffé : script 10 minutes minuté + plan B | 0.25 session |
| Lighthouse + Core Web Vitals (CDC §19) | 0.1 session |

### B. Import des référentiels — Phases C + D

| Tâche | Effort |
|---|---|
| `useReferentielStore` (Zustand persist) | 0.2 session |
| Page `/admin/referentiels` : liste + bouton import | 0.3 session |
| Modal d'import : `<input type=file>` + preview du rapport + confirmation | 0.5 session |
| Sidebar : entrée *Référentiels* dans section Administration | 0.05 session |
| Adapter `GrilleCompetences` pour grouper les leaves par `sousFamille` | 0.3 session |
| Adapter le sélecteur d'ajout de compétence dans `TableauTriColonnes` | 0.2 session |
| Support XLSX via dynamic import de SheetJS (optionnel) | 0.5 session |

### C. Données de démonstration enrichies (CDC §24)

Sprint 1 ne contient qu'1 apprenti·e (Léa). Le CDC §24.5 prévoit **6 apprenti·e·s** pour la démo direction :

| Apprenti·e | État démonstratif |
|---|---|
| MARTIN Léa (présente) | cas principal — entretien complet, 2 fiches signées, 1 en cours |
| DUBOIS Théo | cas "bon élève" — toutes fiches signées et verrouillées |
| PEREIRA Sofia | cas "alerte" — entretien non initié → R7 visible |
| NGUYEN Minh | cas "démarrage" — entretien signé, aucune fiche |
| KOUAMÉ Aya | cas "désaccord" — fiche déverrouillée avec motif (R10) |
| BIANCHI Luca | cas "mi-parcours standard" |

→ ~0.5 session pour enrichir les fixtures + adapter `TableauDeBord` (liste/recherche/filtre).

### D. Modules administratifs réels (sprint dédié post-étape 1)

Aujourd'hui placeholder dans `/admin/*`. Pour l'étape 2 :

- Formulaires CRUD utilisateurs (création apprenti / maître / formateur / coordo)
- Formulaires CRUD formations (création + édition + suppression)
- Écran d'affectation apprenti·e ↔ formation/maître/formateur
- Persistance Zustand (aujourd'hui en fixtures statiques)

→ noté dans `TODO-etape-2.md` (3 entrées datées).

### E. Mise à jour formelle du cahier des charges en v1.5

Trois changements négociés à intégrer dans le CDC officiel :

- §4.1 : ajout des rôles **Coordo** et **Admin**
- §6 : 11 nouvelles lignes de matrice (admin.* ressources)
- §7.1 : types `Coordo`, `Admin`, `Lieu` ; `Formation` enrichi (`dateDebut`, `dateFin`, `lieu`)
- §7.2 : `Competence.sousFamille?` (3 niveaux hiérarchiques optionnels)
- §17.2 : entrées glossaire *Coordinateur·rice*, *Administrateur·rice*

→ noté dans `TODO-etape-2.md`.

---

## 10. Limites connues (CDC §3 + observations)

- Pas d'authentification réelle — role switcher uniquement (étape 3)
- Pas de RGPD / RGAA conforme — bonnes pratiques seulement
- Pas de notifications email — étape 2
- Pas de multi-établissement — un seul GRETA fictif
- Pas d'API / import structuré CSV (sauf pour les référentiels, scope ajouté)
- Pas de backup automatique — données vivent dans le `localStorage` de chaque navigateur
- Pas de monitoring (Uptime Kuma, logs centralisés)
- Pas d'historique granulaire (CDC §12) — la traçabilité minimale `modifieLe` existe mais pas le journal détaillé

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
npm install            # première fois seulement
npm run dev            # serveur Vite sur http://localhost:5173
```

### Tests / qualité

```bash
npm test               # 134 tests Vitest
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

### Réinitialiser les données de démo (en attendant le bouton dédié)

Dans la console du navigateur (DevTools > Console) :
```js
localStorage.removeItem('livret-donnees');
localStorage.removeItem('livret-role-actif');
location.reload();
```

---

## 13. Skills Claude Code installés

Référence : CDC §22. Au démarrage du projet :

- ✓ `web-artifacts-builder` (Anthropic) — patterns React + shadcn/ui
- ✓ `webapp-testing` — Playwright (à mobiliser au sprint 5)
- ✓ `test-driven-development` — appliqué sur `droits.ts`, transitions, validation
- ✓ `brainstorming` (à mobiliser quand un arbitrage UX est nécessaire)
- ✓ `impeccable` (installé en cours de projet, pas encore sollicité)
- — `UI UX Pro Max` plugin : non installé pour l'instant

---

## 14. Décisions architecturales notables

- **Pas de NextJS / SSR** : SPA suffit pour la maquette, simplicité Vite
- **Pas de Redux / RTK** : Zustand est plus léger et adapté à la complexité actuelle
- **Pas de bibliothèque de charts** : barres empilées en CSS pur (gain bundle)
- **Pas de lib CSV externe** : parser de 50 lignes en TS pur (gain bundle)
- **Tests TDD ciblés** : matrice droits + transitions état + validation signatures + parser CSV. Composants UI non testés pour ne pas ralentir la maquette
- **Migration localStorage par bump de version** : v1 → v2 reset complet (pas de migration logicielle, données fictives)
- **Coordo et Admin = extensions explicites** : pas de fonctionnalité "secrète", tout est tracé dans `TODO-etape-2.md`
- **Bundle JS encore petit (89 KB)** : marge confortable pour ajouter `@react-pdf/renderer` (~100 KB gzippé) en sprint 5 sans dépasser la cible

---

## 15. Prochaine étape recommandée

Au choix selon priorité du pilote :

1. **Finir l'import des référentiels (Phases C + D)** — débloque la démo d'un référentiel CECRL réel, ~1 session
2. **Sprint 5 export PDF** — livrable contractuel CDC, ~1 session
3. **Enrichir les fixtures avec 6 apprenti·e·s** — débloque l'usage du tableau de bord et la démo R7, ~0.5 session

Recommandation : faire (3) puis (1) puis (2). Ça garantit que la démo finale est solide sans précipiter le PDF.

---

*Fin du document.*
