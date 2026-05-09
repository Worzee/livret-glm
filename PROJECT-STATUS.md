# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-05-09
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3) **livrée + administration complète post-livraison (CRUD 4 rôles + formations + affectations)**
**Pilote métier** : Guillaume FERRERI

---

## 1. En bref

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Accès** | Basic Auth `demo` / *(mdp partagé hors-canal)* |
| **Dépôt source** | https://github.com/Worzee/livret-glm (privé, branche `main`) |
| **Dernier commit déployé** | `8bf0a9e` — verrouillage des affectations quand le livret est actif |
| **Sprints livrés** | **1, 2, 3, 4, 5** + 3 extensions hors-CDC (dont import référentiels phases A→E livrées : CSV + XLSX) + post-livraison (mobile, UX, 6 apprenti·e·s, tableau de bord, **administration : CRUD 4 rôles + formations + affectations + référentiels + verrouillages**) |
| **Tests unitaires** | **272 / 272 ✓** (Vitest, 22 fichiers) |
| **Tests E2E** | **93 / 93 ✓** (Playwright — 81 desktop + 12 mobile Pixel 5) |
| **Bundle JS gzippé** | 116 KB (cible CDC §19.1 : < 500 KB → marge × 4,3) |
| **Bundle CSS gzippé** | 5,9 KB (cible : < 50 KB → marge × 8,5) |
| **Chunk PDF lazy** | 495 KB (chargé uniquement au clic « Exporter ») |
| **Préflight VPS** | 11 / 11 ✓ |
| **TTFB VPS** | ~80 ms |
| **TypeScript** | strict, sans erreur |
| **ESLint** | sans erreur |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` — 6 stores persistés en localStorage :
  - `livret-donnees` (schema v5) — livrets, fiches, entretiens, évaluations
  - `livret-role-actif` (rôle + maître actif)
  - `livret-apprenti-actif` (id de l'apprenti·e affiché·e)
  - `livret-utilisateurs` (schema v1) — apprenti·e·s, maîtres, formateurs, coordos, admins
  - `livret-formations` (schema v1) — formations (intitulé, niveau, dates, lieu, référentiel)
  - `livret-referentiels` (schema v1) — référentiels de compétences (Bloc → Sous-famille? → Compétence)
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
- **R22 Clôture livret** : type `ClotureLivret`, lib `cloture-livret.ts` (4 fonctions, 14 tests TDD), composant `BandeauCloture` 4 états, R22 appliquée dans grilles compétences + attitudes
- **R10 Déverrouillage motivé** : type `EntreeDeverrouillage`, lib `deverrouillage-fiche.ts` (validation motif ≥ 10 caractères, 8 tests TDD), composant `DialogDeverrouillage` (modale a11y), historique consultable sous chaque fiche
- **Bouton « Réinitialiser la démo »** : footer, confirmation 2 clics + auto-annulation 10 s

#### Phase B — Export PDF
- `components/pdf/LivretPdf.tsx` (7 pages : garde, organisation, entretien, fiches × 3, évaluations, annexes)
- Lazy-loading via `React.lazy` (chunk séparé 495 KB gzip, chargé au clic)
- Garde-fou C14 (avertissement si livret > 50 pages estimées)
- Nom de fichier : `livret-apprentissage-NOM-Prenom-AAAA-MM-JJ.pdf`
- Visible uniquement pour le formateur (matrice droits `export-pdf`)

#### Phase C — Polish
- `DEMO.md` étoffé : script minuté 10 min + mode 5 min + plan B + checklist post-démo
- `README.md` utilisateur final
- `perf-sprint-5.md` : mesures bundle + procédure Lighthouse + cibles CDC

#### Phase D — Tests E2E Playwright initiaux
- 5 specs couvrant les sprints 1 à 5 (18 tests desktop)

### Améliorations post-Sprint 5 — UX et cohérence

#### Cohérence des actions destructrices (5 actions, 1 pattern)
- `BoutonSigner` : confirmation 2 clics avant signature (chaque slot, fiche + entretien)
- `BoutonSupprimer` : confirmation 2 clics avant suppression d'une ligne (variants `icon` / `text`)
- Bandeau R22 : confirmation 2 clics avec récapitulatif
- Modale R10 : motif obligatoire ≥ 10 caractères
- Réinitialisation démo : confirmation 2 clics + auto-annulation 10 s

#### Bugfix R21 (régression silencieuse)
- Avant : un rôle pouvait modifier ses zones (observation, colonnes du tableau) **après** avoir signé, ce qui invalidait sa signature *par effet de bord*
- Helper `peutEncoreEditerFiche(fiche, role)` dans `lib/transitions-fiche.ts` (6 tests TDD)
- Appliqué dans `ZoneObservation`, `TableauTriColonnes`, `SuiviGretaCfa`
- Mention UI explicite : « Figée par signature »

#### Refonte UX « Organisation du suivi »
- Modèle : `string` libre → `ChampOrganisationSuivi { date?, commentaire?, verrouille? }`
- UI : chaque carte coupée en deux (date picker natif + commentaire libre)
- **Toggle verrouiller / déverrouiller par champ** (sans modale, sans motif — simple toggle)
- Schema localStorage v3 → v4 (migration = reset, cohérent avec stratégie étape 1)

#### Responsive mobile (cas d'usage terrain)
- `MobileMenu` : hamburger + drawer accessible (`role=dialog`, focus piégé, Esc, fermeture auto)
- `RoleSwitcher` compact : icônes seules sur mobile, libellé visible à partir de `lg`
- Touch targets ≥ 44 px (norme WCAG 2.5.5)
- Audit Playwright dédié `e2e/audit-mobile.mobile.spec.ts` (12 tests sur Pixel 5)

### Améliorations post-Sprint 5 — Tableau de bord et fixtures

#### Tableau de bord — 6 apprenti·e·s (CDC §24.5)
- Fixtures étendues : Léa MARTIN (cas principal), Théo DUBOIS (« bon élève »), Sofia PEREIRA (« alerte R7 »), Minh NGUYEN (« démarrage »), Aya KOUAMÉ (« désaccord R10 »), Luca BIANCHI (« mi-parcours standard »)
- 2 maîtres d'apprentissage : Karim BENALI (Le Gourmet — Léa, Théo, Sofia) + Hélène ROCHE (La Brasserie du Rhône — Minh, Aya, Luca). Sophie DUBOIS reste formatrice unique de la promo
- Store `useApprentiActifStore` (id persisté) + hook `useApprentiActif()`
- Refonte `TableauDeBord` : liste filtrée par rôle (matrice §6) + recherche par nom/prénom (insensible casse + accents) + cartes avec badges démonstratifs
- Lib `apprentis-accessibles` (18 tests TDD) — filtre selon rôle, tri canonique fr-FR, recherche normalisée
- Lib `etat-livret` (7 tests TDD) — calcule un cas pédagogique pour les badges
- 7 pages livret + 2 grilles passées de `apprentiLeaMartin` en dur à `useApprentiActif()`
- Sélecteur de maître d'apprentissage en mode maître (bascule Karim ↔ Hélène, réinit l'apprenti·e actif·ve sur le 1ᵉʳ apprenti·e du nouveau maître)
- En rôle apprenti·e : on s'incarne dans l'apprenti·e actif·ve (workflow démo « regardez Sofia vue par chaque rôle ») — R3 toujours respectée

### Administration (post-livraison étape 1)

#### Étape 1 — CRUD apprenti·e·s
- Store `useUtilisateursStore` (Zustand persist) : 5 records indexés par id (apprentis / maitres / formateurs / coordos / admins). Initialisé depuis les fixtures.
- Helper `lib/creation-livret.ts` : crée un livret vierge réutilisable
- Lib `lib/validation-apprenti.ts` (9 tests TDD) : email, dates contrat, âge ∈ [15, 29] avec **avertissement non-bloquant > 29 ans** (RQTH, sportifs de haut niveau, créateurs d'entreprise, reconversion)
- `ajouterApprenti` crée l'apprenti·e + son livret vierge + propage la référence au maître
- `modifierApprenti` propage les changements de maître + de formation (vers le livret)
- `supprimerApprenti` retire le livret + les références maître + replie l'apprenti·e actif·ve
- Refonte `/admin/utilisateurs` : table avec recherche + filtre par rôle, édition par ligne, suppression avec confirmation 2 clics
- Modale `ModaleApprenti` (création + édition) : 3 sections (identité, contrat, affectation initiale). Validation côté UI, focus auto, Esc / clic arrière-plan / Annuler
- Bouton « Réinitialiser la démo » étend la portée du reset au store des utilisateurs

#### Étape 2 — CRUD maître / formateur / coordo
- Store étendu avec mutations CRUD pour les 3 rôles staff
- **Suppression intelligente avec cohérence référentielle** :
  - Maître : refusée si `apprentiIds.length > 0`
  - Formateur : refusée si des apprenti·e·s référencent ce formateur
  - Coordo : suppression libre
- Lib `lib/validation-utilisateur-staff.ts` (6 tests TDD) : validation partagée pour les 3 rôles ; `entrepriseId` obligatoire seulement pour le maître
- `ModaleUtilisateurStaff` (modale unique paramétrée par `role`) — évite la duplication entre les 3 modales
- Le bouton « + Nouvel·le apprenti·e » devient un menu déroulant « Nouveau · nouvelle… » avec 4 entrées. L'option Coordo n'apparaît que pour l'admin (droit exclusif)
- Édition par ligne fonctionnelle pour les 4 rôles ; le compte admin pilote (Guillaume FERRERI) n'est ni modifiable ni supprimable

#### Droits admin élargis au formateur référent
- Matrice §6 mise à jour : `creer-apprenti` et `creer-maitre` ouverts au formateur (besoin terrain : enregistrer un nouveau contrat sans attendre une intervention coordo)
- Sidebar : la section « Administration » filtre désormais lien par lien selon les droits. Le formateur voit « Utilisateurs » mais pas « Formations » ni « Affectations »
- Modification / suppression restent réservées coordo + admin

#### Étape 3 — Page d'affectations (CDC §10.4)
- Refonte de `/admin/affectations` : table avec une ligne par apprenti·e, selects auto-save pour formation / maître / formateur. Indicateur visuel ✓ vert pendant 1,5 s à chaque sauvegarde
- Recherche par nom + filtre par formation
- Synchronisation automatique des `apprentiIds` du maître à la réaffectation (l'ancien perd la référence, le nouveau la reçoit)
- Le changement de maître propage l'`entrepriseId` par défaut
- Le changement de formation propage le `formationId` au livret correspondant (cohérence référentiel)
- Accessible coordo + admin uniquement

#### Verrouillage des affectations (note de gouvernance)
- Lib `lib/affectation-verrou.ts` (7 tests TDD) : verrou actif si **au moins une fiche de période existe**, **l'entretien tripartite est initialisé**, ou **le contrat a démarré** (date courante ≥ contratDebut). Priorisation : fiches > entretien > contrat
- Page Affectations : selects désactivés + fond bleu pâle pour les lignes verrouillées. Bandeau d'info global indiquant le nombre d'apprenti·e·s protégé·e·s. Badge cadenas + tooltip raison
- **Bouton « Déverrouiller temporairement »** par ligne (confirmation 2 clics, auto-annulation 10 s). État non persisté — le verrou se réactive à chaque ouverture de la page
- Page Utilisateurs : suppression d'apprenti·e également bloquée si livret actif (cohérence)

#### Étape 4 — CRUD formations (boucle l'administration)
- Store `useFormationsStore` (Zustand persist v1) initialisé depuis les fixtures. Mutations CRUD avec cohérence référentielle : `supprimerFormation` retourne `false` si au moins un·e apprenti·e y est rattaché·e
- Lib `lib/validation-formation.ts` (9 tests TDD) : intitulé / niveau / année (avec **avertissement non-bloquant** si format ≠ « YYYY-YYYY ») / dates (cohérence fin > début) / référentiel / nom du lieu obligatoire ; adresse / CP / ville optionnels (cas centre virtuel)
- Lib `lib/formation-verrou.ts` (4 tests TDD) : verrou de suppression + raison lisible avec suffixe d'inclusivité cohérent
- `ModaleFormation` (création + édition) : 3 sections (identité, période, lieu). Datalist sur Niveau pour suggestions courantes (CAP, BAC PRO, BTS…) avec saisie libre conservée. Référentiel via select (sera connecté au futur `useReferentielsStore` quand l'extension 3 phase C sera livrée)
- Refonte `/admin/formations` : grille de cartes avec recherche multicritères (intitulé / niveau / année), édition par ligne, suppression avec confirmation 2 clics. Compteur d'apprenti·e·s rattaché·e·s par carte
- Le bouton « Réinitialiser la démo » étend la portée du reset au store des formations

---

## 5. Extensions hors-CDC v1.3 (négociées avec le pilote)

### Extension 1 — Rôle Coordo (coordinateur·rice administratif·ve)

- 4ᵉ rôle dans le système, couleur `#0e7490` (cyan-700)
- Section *Administration* dans la sidebar (Utilisateurs, Formations, Affectations)
- 11 ressources `admin.*` dans la matrice de droits (utilisateurs/formations/affectations/référentiels)
- Pages CRUD réelles : utilisateurs ✅ + formations ✅ + affectations ✅
- Fixture : Martine LEFÈVRE
- **Aucun droit pédagogique** (testé exhaustivement)

### Extension 2 — Rôle Admin (super-utilisateur, vous)

- 5ᵉ rôle, couleur `#4338ca` (indigo-700)
- Fixture : Guillaume FERRERI
- Partage avec coordo : créer apprenti·e/maître/formateur, modifier/supprimer utilisateurs, gérer formations + affectations
- **Droit exclusif** : créer un coordo
- **Aucun droit pédagogique** (commentaires, niveaux, signatures, observations)
- Tests TDD complets : pas un seul faux-positif côté pédagogie

### Extension 3 — Import de référentiels (Phases A → E livrées)

- **Phase A** : `Competence.sousFamille?: string` + `Referentiel.niveauxColonnes?: 2 | 3` + `source?` + ressource `admin.referentiels.gerer`
- **Phase B** : `lib/import-referentiel.ts` complet (parsing CSV maison, encodage UTF-8 / Windows-1252, séparateur auto, 24 tests TDD)
- **Phase C** : ✅ UI livrée
  - Store `useReferentielsStore` (Zustand persist v1) initialisé depuis le fixture CAP Cuisine
  - Lib `lib/validation-import-referentiel.ts` (8 tests TDD) : formation cible obligatoire, source (fichier ou texte) non vide, génération du libellé `Referentiel_<intituléFormation>_<YYYY-MM-DD>`
  - Lib `lib/referentiel-verrou.ts` (4 tests TDD) : suppression refusée si une formation y est rattachée
  - `ModaleImportReferentiel` : **select de la formation cible** (pas de saisie libre du nom), input file (CSV ou XLSX) **OU** textarea avec contenu collé, workflow en 2 temps (Aperçu → Importer) avec stats (blocs, compétences, sous-familles, encodage, format) + avertissement explicite si la formation est déjà rattachée à un autre référentiel
  - À l'import : la formation est **automatiquement mise à jour** (`formation.referentielId`) pour pointer vers le nouveau référentiel
  - Page `/admin/referentiels` : grille de cartes par référentiel avec compteurs + détail des blocs en `<details>` + bouton suppression 2 clics
  - Sidebar : entrée *Référentiels* sous Administration
- **Phase D** : ✅ rendering 3-niveaux livré
  - `GrilleCompetences` : groupement visuel par sous-famille (en-tête de section dans chaque bloc) quand `niveauxColonnes === 3`
  - `TableauTriColonnes.AjouterCompetence` : optgroup par paire `Bloc — Sous-famille` quand le référentiel est à 3 niveaux
- **Phase E** : ✅ support XLSX livré
  - Dépendance `fflate` (~12 KB minifié) pour la décompression ZIP
  - `lib/parser-xlsx.ts` : parser XLSX maison (`sharedStrings.xml` + `sheet1.xml`, regex robustes ; pas de DOMParser pour rester léger), 11 tests TDD
  - `importerReferentielDepuisXlsxBuffer` (3 tests TDD) + détection automatique du format via signature ZIP (`PK\x03\x04`) côté UI
  - 5 tests d'intégration sur les **vrais fichiers exemples du pilote** (`exemple-{1,2}.{csv,xlsx}` dans `src/lib/__fixtures__/`) : 2 et 3 niveaux × CSV et XLSX
  - 4 tests E2E qui chargent ces vrais fichiers via `setInputFiles` et vérifient l'aperçu + l'import effectif

#### Connexion via le store

- `EvaluationFinale` résout désormais le référentiel via `formation.referentielId` → `useReferentielsStore` (fallback sur le CAP Cuisine si la formation n'a pas encore de référentiel)
- `TableauTriColonnes` (fiche de suivi en entreprise) résout aussi le référentiel via la formation de l'apprenti·e actif·ve. Le sélecteur d'ajout filtre désormais sur `evalueeEnEntreprise` (cf. ci-dessous)
- `ModaleFormation` liste les référentiels disponibles depuis le store (plus de constante figée)
- `BoutonReinitialiserDemo` reset également le store des référentiels

#### Gestion des fiches de période par le formateur ou le coordo (mai 2026)

Suite à un retour pilote, le formateur référent (ou le coordo) peut **créer**, **renommer** et **supprimer** des fiches de suivi par période :

- Type `FicheSuiviPeriode.titre?: string` (optionnel) — affichage `Période N — <titre>` quand renseigné, `Période N` seul sinon
- Droits : `fiche.creer-periode` étendu au coordo + nouvelles ressources `fiche.modifier-periode` et `fiche.supprimer-periode` (formateur + coordo)
- Lib `lib/validation-fiche-periode.ts` (15 tests TDD) : valide la saisie en réutilisant les règles R11/R12/R13/R14, gère le mode édition (chevauchement avec soi-même ignoré), `peutSupprimerFichePeriode` (refuse si fiche verrouillée ou signée), helper `libelleFichePeriode`
- Mutations store : `ajouterFichePeriode` (numéro auto-attribué = max+1), `modifierFichePeriode` (titre + dates), `supprimerFichePeriode`
- `ModaleFichePeriode` (création + édition) : titre optionnel + dates, validation côté UI, `key` au remount frais (cohérent avec les autres modales admin)
- Page `FicheSuiviPeriodes` refondue : bouton « + Nouvelle période » (visible si droit), boutons modifier/supprimer par carte, confirmation 2 clics avec auto-annulation 10 s, message d'erreur visuel quand suppression bloquée
- Page `FicheSuiviPeriodeDetail` : affiche le titre custom dans le `<h1>`, bouton « Modifier » dans l'en-tête (ouvre la même modale)
- 8 tests E2E `fiches-periodes.spec.ts` : création coordo + formateur, droits apprenti·e, renommage, suppression bloquée signée, suppression libre brouillon, R13 (entretien non initialisé), titre custom dans le détail

#### Compétences abordées en entreprise (mai 2026)

Suite à un retour pilote, ajout d'un flag par compétence pour exclure du suivi en entreprise les compétences purement académiques :

- Type `Competence.evalueeEnEntreprise?: boolean` (défaut implicite `true` pour la rétrocompatibilité)
- Lib `lib/competence-entreprise.ts` (6 tests TDD) : helper `estEvalueeEnEntreprise` + `filtrerCompetencesEvalueesEnEntreprise`
- Page `/admin/referentiels` : checkbox par compétence dans la `<details>` « Voir et configurer les compétences ». Compteur par bloc (`X/N abordées en entreprise`). Compétence décochée affichée en barré + grisé.
- Action store `setCompetenceEvalueeEnEntreprise(referentielId, competenceId, valeur)` — persistée via Zustand
- `TableauTriColonnes.AjouterCompetence` n'expose que les compétences `evalueeEnEntreprise === true`. Les lignes déjà saisies pour une compétence devenue « non abordée » restent visibles (cohérence historique, pas de suppression de travail validé)
- 2 tests E2E : toggle persistant + filtrage du sélecteur en aval

---

## 6. Règles métier implémentées (CDC §8)

| Règle | Sujet | État | Tests |
|---|---|---|---|
| R1 | 1 livret par apprenti·e | ✓ | implicite (modèle) |
| R2 | `contratFin > contratDebut` | ✓ | type-level + validation modale |
| R3 | Apprenti·e voit son livret seul | ✓ | matrice droits + `apprentis-accessibles` |
| R4 | Maître voit ses apprenti·e·s | ✓ | matrice droits |
| R5 | Formateur voit sa promo | ✓ | matrice droits |
| R6 | 1 entretien par livret | ✓ | `initialiserEntretien` idempotent |
| R7 | Alerte si > 60 j sans entretien | ✓ | 5 tests |
| R8 | Verrouillage progressif entretien | ✓ | 2 tests (`peutEncoreEditer`) |
| R9 | 3 signatures = tout figé | ✓ | 1 test |
| **R10** | **Déverrouillage formateur + motif** | ✓ | 8 tests TDD + modale UI + traçabilité |
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
| **R21** | **Retrait signature impossible** | ✓ | 6 tests TDD `peutEncoreEditerFiche` + bugfix UI |
| **R22** | **Clôture livret** | ✓ | 14 tests TDD + bandeau 4 états + grilles figées |
| R23 | Synthèse temps réel | ✓ | recalcul à chaque render |
| R24 | Apprenti·e consulte à tout moment | ✓ | matrice droits + bandeau lecture |

**Toutes les règles R1 → R24 sont implémentées et testées.**

---

## 7. Tests (272 unitaires + 93 E2E)

### Tests unitaires Vitest (272 / 272 ✓ — 22 fichiers)

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
| `lib/validation-apprenti.test.ts` | 9 | Saisie apprenti·e (email, dates, âge avec avertissement RQTH, affectations) |
| `lib/validation-utilisateur-staff.test.ts` | 6 | Validation maître / formateur / coordo (champs communs + entrepriseId conditionnel) |
| `lib/affectation-verrou.test.ts` | 7 | Verrou des affectations : fiches existantes, entretien initié, contrat démarré, priorisation |
| `lib/validation-formation.test.ts` | 9 | Validation formation (intitulé, niveau, année avec avertissement format, dates, référentiel, lieu) |
| `lib/formation-verrou.test.ts` | 4 | Verrou de suppression formation : aucun·e/1/N apprenti·e·s rattaché·e·s, suffixe pluriel |
| `lib/validation-import-referentiel.test.ts` | 8 | Saisie d'import : formation cible obligatoire, source fichier/texte, génération du libellé `Referentiel_<intitulé>_<YYYY-MM-DD>` |
| `lib/referentiel-verrou.test.ts` | 4 | Verrou de suppression référentiel : aucune/1/N formations rattachées, pluriel |
| `lib/parser-xlsx.test.ts` | 16 | Parser XLSX (sharedStrings + sheet1) : 2/3 colonnes, sparses, entités XML, signature ZIP, pipeline complet, **tests d'intégration sur les 4 fichiers exemples du pilote** |
| `lib/competence-entreprise.test.ts` | 6 | Flag `evalueeEnEntreprise` : défaut implicite (rétrocompat), filtre, ordre préservé |
| `lib/validation-fiche-periode.test.ts` | 15 | Saisie d'une fiche : titre optionnel, dates, R11 (fin > début), R12 (chevauchement), R13 (entretien + dernière fiche signée), édition (auto-chevauchement ignoré), `peutSupprimerFichePeriode`, `libelleFichePeriode` |

### Tests E2E Playwright (93 / 93 ✓)

| Projet | Fichier | Tests | Périmètre |
|---|---|---|---|
| `chromium-desktop` | `sprint1-role-switcher.spec.ts` | 4 | Bandeau démo + role switcher 5 rôles |
| `chromium-desktop` | `sprint2-coedition.spec.ts` | 3 | Co-édition tri-colonnes + R21 |
| `chromium-desktop` | `sprint3-droits-entretien.spec.ts` | 3 | Droits granulaires entretien |
| `chromium-desktop` | `sprint4-evaluation-finale.spec.ts` | 5 | Grilles + synthèse + R22 |
| `chromium-desktop` | `sprint5-bout-en-bout.spec.ts` | 3 | Parcours complet + export PDF non vide |
| `chromium-desktop` | `tableau-de-bord-6-apprentis.spec.ts` | 13 | Liste par rôle + recherche + badges + navigation + sélecteur maître + R3 |
| `chromium-desktop` | `admin-utilisateurs.spec.ts` | 7 | Accès, création/édition apprenti·e, suppression bloquée vs libre |
| `chromium-desktop` | `admin-utilisateurs-staff.spec.ts` | 10 | Menu de création, CRUD staff, suppression bloquée par cohérence, accès formateur partiel |
| `chromium-desktop` | `admin-affectations.spec.ts` | 6 | Verrou par défaut, déverrouillage temporaire, réaffectation, synchronisation, déblocage suppression Karim |
| `chromium-desktop` | `admin-formations.spec.ts` | 7 | Accès, création, suppression bloquée si rattachement, suppression libre, édition, persistance reload, visibilité dans Affectations |
| `chromium-desktop` | `admin-referentiels.spec.ts` | 12 | Accès, fixture CAP, import textarea, **import des 4 fichiers exemples réels (CSV + XLSX, 2 et 3 niveaux)**, suppression bloquée, association auto à la formation, **toggle « abordée en entreprise » + filtrage en aval**, persistance reload |
| `chromium-desktop` | `fiches-periodes.spec.ts` | 8 | Création/renommage/suppression : droits formateur+coordo, blocage apprenti·e, R13 (entretien non initialisé), suppression bloquée si signée, suppression libre brouillon, titre custom dans le détail |
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
├── e2e/                            # tests Playwright (10 specs)
│   ├── helpers.ts                  # resetState + selectRole
│   ├── sprint1-role-switcher.spec.ts
│   ├── sprint2-coedition.spec.ts
│   ├── sprint3-droits-entretien.spec.ts
│   ├── sprint4-evaluation-finale.spec.ts
│   ├── sprint5-bout-en-bout.spec.ts
│   ├── tableau-de-bord-6-apprentis.spec.ts
│   ├── admin-utilisateurs.spec.ts
│   ├── admin-utilisateurs-staff.spec.ts
│   ├── admin-affectations.spec.ts
│   └── audit-mobile.mobile.spec.ts # projet mobile-pixel5 uniquement
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json                    # scripts: dev, test, e2e, e2e:ui, lint…
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css
    ├── types/index.ts              # CDC §7 + ChampOrganisationSuivi + ClotureLivret + EntreeDeverrouillage
    ├── lib/                        # logique métier pure (22 modules + 22 fichiers tests)
    │   ├── droits.ts               # matrice §6 (33 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21
    │   ├── validation-signature.ts # R18/R20
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6/R7/R8/R9 + progression
    │   ├── synthese-evaluation.ts  # last-write-wins fiches → finales
    │   ├── stats-bloc.ts           # agrégation par bloc
    │   ├── cloture-livret.ts       # R22 (clôture)
    │   ├── deverrouillage-fiche.ts # R10 (motif obligatoire)
    │   ├── import-referentiel.ts   # pipelines CSV + XLSX (encodage, format auto)
    │   ├── parser-xlsx.ts          # parser XLSX maison (sharedStrings + sheet1)
    │   ├── competence-entreprise.ts # flag « abordée en entreprise » + filtres
    │   ├── validation-fiche-periode.ts # saisie fiche (titre + dates + R11/R12/R13), peutSupprimer, libelle
    │   ├── apprentis-accessibles.ts# filtre/tri/recherche par rôle
    │   ├── etat-livret.ts          # cas pédagogique pour badges tableau de bord
    │   ├── creation-livret.ts      # livret vierge réutilisable
    │   ├── validation-apprenti.ts  # saisie apprenti·e (avec avertissements)
    │   ├── validation-utilisateur-staff.ts # saisie maître/formateur/coordo
    │   ├── validation-formation.ts # saisie formation (intitulé, dates, lieu)
    │   ├── validation-import-referentiel.ts # saisie d'import (nom, contenu CSV)
    │   ├── affectation-verrou.ts   # verrou affectation si livret actif
    │   ├── formation-verrou.ts     # verrou suppression formation si rattachements
    │   ├── referentiel-verrou.ts   # verrou suppression référentiel si formations rattachées
    │   └── utils.ts                # cn() helper
    ├── store/                      # 6 stores Zustand persistés
    │   ├── useUserStore.ts         # rôle actif + maître actif
    │   ├── useLivretStore.ts       # données livret (persist v5)
    │   ├── useApprentiActifStore.ts# id apprenti·e affiché·e
    │   ├── useUtilisateursStore.ts # CRUD utilisateurs (persist v1)
    │   ├── useFormationsStore.ts   # CRUD formations (persist v1)
    │   └── useReferentielsStore.ts # CRUD référentiels (persist v1)
    ├── fixtures/
    │   ├── utilisateurs.ts         # 6 apprenti·e·s + 2 maîtres + Sophie + Martine + Guillaume
    │   ├── formations.ts           # CAP Cuisine 2025-2026
    │   ├── referentiel-cap-cuisine.ts
    │   └── livret-demo.ts          # 6 livrets scénarisés (CDC §24.5)
    ├── components/
    │   ├── ui/                     # vide (shadcn à la demande)
    │   ├── admin/
    │   │   ├── ModaleApprenti.tsx  # CRUD apprenti·e (3 sections)
    │   │   ├── ModaleUtilisateurStaff.tsx # CRUD maître/formateur/coordo
    │   │   ├── ModaleFormation.tsx # CRUD formation (3 sections)
    │   │   └── ModaleImportReferentiel.tsx # import CSV avec aperçu
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── BandeauDemo.tsx
    │   │   ├── RoleSwitcher.tsx
    │   │   ├── Sidebar.tsx         # filtre admin par lien selon droits
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/
    │   │   ├── ChampEditable.tsx
    │   │   ├── SelecteurNiveau.tsx, SelecteurAppreciation.tsx
    │   │   ├── BadgeEtatFiche.tsx, BarreProgression.tsx
    │   │   ├── IndicateurEnregistrement.tsx
    │   │   ├── BoutonSigner.tsx, BoutonSupprimer.tsx
    │   │   └── AucunApprentiSelectionne.tsx
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx, TableauTriColonnes.tsx
    │   │   ├── ZoneObservation.tsx, BlocSignatures.tsx
    │   │   └── DialogDeverrouillage.tsx
    │   ├── entretien/              # 8 sous-composants entretien tripartite
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx
    │   │   ├── GrilleCompetences.tsx, GrilleAttitudes.tsx
    │   │   └── BandeauCloture.tsx
    │   └── pdf/                    # export lazy (LivretPdf 7 sections)
    ├── pages/
    │   ├── TableauDeBord.tsx       # 6 cartes + recherche + sélecteur maître
    │   ├── PagePlaceholder.tsx, NotFound.tsx
    │   ├── OrganisationSuivi.tsx
    │   ├── EntretienTripartite.tsx
    │   ├── FicheSuiviPeriodes.tsx, FicheSuiviPeriodeDetail.tsx
    │   ├── EvaluationFinale.tsx
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx # CRUD 4 rôles + verrou suppression
    │       ├── GestionFormations.tsx   # CRUD formations + verrou suppression
    │       ├── GestionAffectations.tsx # selects auto-save + verrou
    │       └── GestionReferentiels.tsx # liste + import CSV + verrou suppression
    └── test/setup.ts
```

---

## 9. Reste à faire

### A. ~~Données de démonstration enrichies (CDC §24.5)~~ — ✅ livré

Les 6 apprenti·e·s sont en place avec leurs livrets scénarisés. Cf. section *Tableau de bord — 6 apprenti·e·s*.

### B. ~~CRUD utilisateurs + page d'affectations~~ — ✅ livré

| Sous-tâche | État |
|---|---|
| CRUD utilisateurs (4 rôles) | ✅ étapes 1 + 2 |
| Page d'affectation apprenti·e ↔ formation/maître/formateur | ✅ étape 3 |
| Persistance Zustand des utilisateurs | ✅ `useUtilisateursStore` |
| Verrouillage des affectations si livret actif | ✅ `affectation-verrou` |

### C. ~~CRUD formations~~ — ✅ livré

| Sous-tâche | État |
|---|---|
| Store `useFormationsStore` (Zustand persist) avec mutations CRUD | ✅ |
| Modale `ModaleFormation` : intitulé, niveau, année, dates, lieu, référentiel | ✅ |
| Page `/admin/formations` : grille de cartes + bouton + édition par ligne | ✅ |
| Cohérence : suppression bloquée si des apprenti·e·s y sont rattaché·e·s | ✅ `formation-verrou` |
| Tests TDD (validation + verrou) | ✅ 9 + 4 tests |
| Tests E2E (`admin-formations.spec.ts`) | ✅ 7 tests |

### D. ~~Import des référentiels — Phases C + D~~ — ✅ livré

| Sous-tâche | État |
|---|---|
| `useReferentielsStore` (Zustand persist v1) | ✅ |
| Page `/admin/referentiels` : grille de cartes + bouton import + suppression 2 clics | ✅ |
| Modale d'import : `<input type=file>` + textarea de fallback + Aperçu / Importer | ✅ |
| Sidebar : entrée *Référentiels* dans Administration | ✅ |
| `GrilleCompetences` : regroupement par sous-famille si 3 niveaux | ✅ |
| `TableauTriColonnes` : optgroup `Bloc — Sous-famille` si 3 niveaux | ✅ |
| `EvaluationFinale` + `ModaleFormation` : résolution via store | ✅ |
| Tests TDD (validation + verrou) | ✅ 5 + 4 tests |
| Tests E2E (`admin-referentiels.spec.ts`) | ✅ 6 tests |
| Support XLSX via dynamic import de SheetJS (optionnel) | différable |

### E. Mise à jour formelle du cahier des charges en v1.5

Changements négociés à intégrer dans le CDC officiel :

- §4.1 : ajout des rôles **Coordo** et **Admin**
- §6 : 11 nouvelles lignes de matrice (admin.* ressources). Mise à jour : `creer-apprenti` et `creer-maitre` ouverts au formateur référent
- §7.1 : types `Coordo`, `Admin`, `Lieu` ; `Formation` enrichi
- §7.2 : `Competence.sousFamille?` (3 niveaux hiérarchiques optionnels)
- §10.4 : règle de gouvernance — affectations verrouillées dès le démarrage du contrat / fiches existantes / entretien initialisé
- §17.2 : entrées glossaire *Coordinateur·rice*, *Administrateur·rice*

→ noté dans `TODO-etape-2.md`.

---

## 10. Limites connues (CDC §3 + observations)

- Pas d'authentification réelle — role switcher uniquement (étape 3 du programme)
- Pas de RGPD / RGAA strict — bonnes pratiques seulement
- Pas de notifications email — étape 2 du programme
- Pas de multi-établissement — un seul GRETA fictif
- Pas d'API / import structuré CSV (sauf pour les référentiels — UI à venir)
- Pas de backup automatique — données vivent dans le `localStorage` de chaque navigateur
- Pas de monitoring (Uptime Kuma, logs centralisés)
- Pas d'historique granulaire (CDC §12) — la traçabilité minimale `modifieLe` existe + historique R10 spécifique
- Le déverrouillage temporaire des affectations n'est pas tracé (pas d'audit log) — décision pragmatique pour la maquette

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
- [ ] Vérifier que le mot de passe Basic Auth est partagé via canal sécurisé
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
npm test               # 209 tests Vitest
npm run e2e            # 66 tests E2E Playwright (build + preview + tests)
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
localStorage.removeItem('livret-apprenti-actif');
localStorage.removeItem('livret-utilisateurs');
location.reload();
```

---

## 13. Skills Claude Code installés

Référence : CDC §22.

- ✓ `web-artifacts-builder` (Anthropic) — patterns React + shadcn/ui
- ✓ `webapp-testing` — Playwright (mobilisé en sprint 5 phase D + post-livraison)
- ✓ `test-driven-development` — appliqué sur droits, transitions, validations, cloture, déverrouillage, accessibles, état livret, validation apprenti·e/staff, affectation-verrou
- ✓ `brainstorming` (à mobiliser pour arbitrages UX)
- ✓ `impeccable` (installé)

---

## 14. Décisions architecturales notables

- **Pas de NextJS / SSR** : SPA suffit pour la maquette, simplicité Vite
- **Pas de Redux / RTK** : Zustand est plus léger
- **Pas de bibliothèque de charts** : barres empilées en CSS pur (gain bundle)
- **Pas de lib CSV externe** : parser de 50 lignes en TS pur (gain bundle)
- **PDF lazy-loaded** : `@react-pdf/renderer` dans un chunk séparé (495 KB gzip), chargé uniquement au clic « Exporter ». Le bundle initial reste à 109 KB
- **Tests TDD ciblés** : matrice droits, transitions, validation signatures, parser CSV, clôture, déverrouillage, filtres tableau de bord, état livret, validation modales, verrou affectation. Composants UI testés via E2E (Playwright) plutôt qu'unitairement
- **Migration localStorage par bump de version** : reset complet à chaque bump (pas de migration logicielle, données fictives). `livret-donnees` v5, `livret-utilisateurs` v1, `livret-apprenti-actif` v1
- **Cohérence du pattern de friction** : 8 actions destructrices/engageantes utilisent toutes une confirmation explicite (signature, suppression compétence, suppression ligne GRETA, clôture, réinit, suppression compte, déverrouillage temporaire affectation, retrait apprenti·e du store). Une seule modale stricte (R10 — la plus engageante avec motif obligatoire ≥ 10 caractères)
- **Stores Zustand multiples + import croisé** : `useUserStore`, `useLivretStore`, `useApprentiActifStore`, `useUtilisateursStore`. Synchronisations cross-store dans les actions (cycle d'import résolu par ESM, jamais à l'init du module)
- **Cohérence référentielle protectrice** : la suppression d'un maître / formateur / apprenti·e en cours de contrat est bloquée. Toute modification d'affectation après démarrage du contrat est verrouillée par défaut, déverrouillage temporaire possible mais non persisté
- **Coordo et Admin = extensions explicites** : pas de fonctionnalité « secrète », tout est tracé dans `TODO-etape-2.md`
- **Mobile-first responsive** : navigation par drawer, RoleSwitcher compact, audit Playwright 12 tests dédiés

---

## 15. Prochaine étape recommandée

L'étape 1 du CDC v1.3 est **livrée et fonctionnelle**. L'administration métier est complète (CRUD 4 rôles + formations + affectations + référentiels CSV/XLSX avec toggle compétences abordées en entreprise) avec verrouillages de cohérence référentielle à toutes les couches.

Reste à finir :

1. **Formaliser CDC v1.5** — documenter les changements négociés (rôles Coordo/Admin, ressources admin, règle de verrouillage des affectations §10.4, import référentiels CSV+XLSX, flag `evalueeEnEntreprise`)
2. **Évaluation finale et flag `evalueeEnEntreprise`** : `GrilleCompetences` montre encore la colonne « Acquis en entreprise » pour toutes les compétences. À décider avec le pilote : faut-il désactiver/masquer la colonne entreprise pour les compétences `evalueeEnEntreprise === false` ? La règle actuelle ne couvre que le tableau de suivi par période.

La sécurité VPS reste une action côté pilote (cf. §11).

---

*Étape 1 livrée — Sprint 5 + post-livraison (mobile + verrouillage UX + 6 apprenti·e·s + administration complète : 4 rôles + formations + affectations + référentiels) — cahier des charges v1.3.*
