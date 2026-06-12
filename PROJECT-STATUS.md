# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-06-12 (retours coordonnateurs pédagogiques — « Maître / Tuteur », affectation des questions par le coordo, jusqu'à 4 entretiens tripartites, motifs par rôle + séquencement, attitudes professionnelles par entretien + catalogue admin, confirmation avant écrasement d'une évaluation héritée, second maître / tuteur par apprenti·e, tri par année de formation sur le tableau de bord, **signature manuscrite tactile**, **répartition des apprenti·e·s entre coordos**)
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3) **livrée + 4 vagues post-livraison**
**Pilote métier** : Guillaume FERRERI

---

## 0. Résumé exécutif

### État global

L'**étape 1 du CDC v1.3 est livrée et déployée**, enrichie par 4 vagues post-livraison (CDC v1.5 + chantiers métier mai 2026). La maquette est fonctionnelle, accessible sur URL publique avec Basic Auth, et tous les flux pédagogiques sont testés en bout-en-bout : **510 tests unitaires + 156 tests E2E passent**, bundle JS gzippé sous 150 KB. Aucune authentification réelle ni backend persistant pour l'instant — c'est précisément l'objet de l'étape 2.

### Ce qui est livré

| Phase                         | Périmètre                                                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Étape 1 (CDC v1.3)**        | 6 sprints : socle Vite/React/TS → fiches de période tri-colonnes → organisation du suivi + entretien tripartite → évaluations finales (compétences + attitudes) → clôture R22 + déverrouillage motivé R10 + export PDF                                          |
| **Vague avril → mi-mai 2026** | Administration métier complète : rôles Coordo + Admin (5 rôles au total), CRUD utilisateurs / formations / affectations / référentiels (import CSV + XLSX) / établissements / banque de questions                                                               |
| **Vague 17 mai 2026**         | Sélection par stagiaire des compétences abordées en entreprise (validation conjointe formateur + maître à la 3ᵉ signature de l'entretien, R10 motivé) — CDC v1.5 §12                                                                                            |
| **Vague fin mai 2026**        | 5 chantiers structurants : planning des périodes au niveau formation (cascade automatique vers les livrets), 2 entretiens tripartites par livret, import XLSX apprentis/maîtres/formateurs, suivi GRETA CFA en 2 zones texte, maître avec entreprise + fonction |
| **Polish 26 mai 2026**        | Équilibrage de la palette 5 rôles (Coordo orange foncé, Admin or foncé), bugfix PDF aligné UI, ~50 éléments graphiques colorisés par rôle                                                                                                                       |

### Chantiers identifiés cette session (2026-05-26)

| Chantier                              | Référence                                                                                                        | État                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Refonte PDF d'export**              | §8.D + [`TODO-etape-2.md`](TODO-etape-2.md)                                                                      | Périmètre à arbitrer avec le pilote                                                       |
| **Signature électronique manuscrite** | §8.E + [`TODO-etape-2.md`](TODO-etape-2.md) + CDC v1.5 §14.C                                                     | Confirmé pilote, à coupler étape 2                                                        |
| **Conformité RGPD**                   | §8.F + [`conformite-rgpd.md`](conformite-rgpd.md) + [`conformite-rgpd-etapes.docx`](conformite-rgpd-etapes.docx) | 33 obligations strictes + 9 recommandées (apprenti·e·s majeur·e·s ; AIPD non obligatoire) |

### Trajectoire étape 2 — prochaines étapes formalisées par le pilote

1. **SSO Microsoft Entra ID** pour les personnels GRETA (coordo, formateur, admin) — playbook déjà rédigé ([`playbook-sso-entra-greta.md`](playbook-sso-entra-greta.md)), gain ~1 jour de tâtonnement par rapport au projet Suivi Pédagogique
2. **Gestion des nouveaux comptes** créés sur la plateforme (apprenti·e·s, maîtres d'apprentissage — personnes hors annuaire GRETA) avec **validation par email** (lien d'activation signé, définition de mot de passe au premier clic, vérification d'unicité côté serveur)
3. **Gestion des mots de passe** : politique (longueur minimale, complexité, expiration du lien d'activation), réinitialisation par email (« mot de passe oublié »), page de changement depuis le profil, expiration optionnelle, **2FA optionnel** pour les rôles sensibles (admin, coordo)

Périmètre détaillé dans §12 et [`TODO-etape-2.md`](TODO-etape-2.md). Le chantier transverse de **conformité RGPD** (cf. [`conformite-rgpd.md`](conformite-rgpd.md)) doit être mené en parallèle pour valider juridiquement le passage en production.

### Où chercher quoi

| Question                                                        | Section / fichier                                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Aperçu général et démarrage                                     | [`README.md`](README.md)                                                                                  |
| Modules livrés et périmètre fonctionnel                         | §4                                                                                                        |
| Règles métier R1 → R24                                          | §5                                                                                                        |
| État des tests (510 unit + 156 E2E)                             | §6                                                                                                        |
| Architecture des fichiers                                       | §7                                                                                                        |
| Reste à faire                                                   | §8                                                                                                        |
| Limites connues                                                 | §9                                                                                                        |
| Comment relancer le projet                                      | §10                                                                                                       |
| Décisions architecturales                                       | §11                                                                                                       |
| Étape 2 détaillée                                               | §12                                                                                                       |
| Conformité RGPD                                                 | [`conformite-rgpd.md`](conformite-rgpd.md) + [`conformite-rgpd-etapes.docx`](conformite-rgpd-etapes.docx) |
| **Spec création comptes apprenti·e·s + maîtres (chantier 2.2)** | [`chantier-creation-comptes.md`](chantier-creation-comptes.md)                                            |
| Démo (script minuté + plan B)                                   | [`DEMO.md`](DEMO.md)                                                                                      |
| Conventions de code                                             | [`CONVENTIONS.md`](CONVENTIONS.md)                                                                        |
| Pistes reportées étape 2/3                                      | [`TODO-etape-2.md`](TODO-etape-2.md)                                                                      |

---

## 1. En bref

|                       |                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **URL publique**      | https://livret-glm.duckdns.org                                                                   |
| **Accès**             | Basic Auth `demo` / _(mdp partagé hors-canal)_                                                   |
| **Dépôt source**      | https://github.com/Worzee/livret-glm (privé, branche `main` — synchronisée GitHub ↔ local ↔ VPS) |
| **Tests unitaires**   | **510 / 510 ✓** (Vitest, 33 fichiers de test)                                                    |
| **Tests E2E**         | **156 / 156 ✓** (Playwright — 144 desktop + 12 mobile Pixel 5, 21 specs)                         |
| **Bundle JS gzippé**  | 148 KB (cible CDC §19.1 : < 500 KB → marge × 3,4)                                                |
| **Bundle CSS gzippé** | 6,5 KB (cible : < 50 KB → marge × 7)                                                             |
| **Chunk PDF lazy**    | 493 KB (chargé uniquement au clic « Exporter »)                                                  |
| **Préflight VPS**     | 11 / 11 ✓                                                                                        |
| **TypeScript**        | strict, sans erreur                                                                              |
| **ESLint**            | sans erreur                                                                                      |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables, palette 5 rôles équilibrée mai 2026)
- **State** : Zustand 5 + middleware `persist` — **9 stores** persistés en localStorage :
  - `livret-donnees` (schema v13) — livrets, fiches, **jusqu'à 4 entretiens tripartites par livret** (avec snapshots questions imposées/obligatoires + **évaluations des attitudes par entretien**), évaluations, sélection des compétences abordées en entreprise
  - `livret-role-actif` — rôle + maître actif
  - `livret-apprenti-actif` — id de l'apprenti·e affiché·e
  - `livret-utilisateurs` (schema v4) — apprenti·e·s (avec **second maître / tuteur optionnel** et **coordo de rattachement**, juin 2026), maîtres (avec `entreprise` + `fonction`), formateurs, coordos, admins
  - `livret-formations` (schema v4) — formations + **planning des périodes** au niveau formation (`lieuId`, référentiel, dates de promo, `periodes[]`, **`nombreEntretiens` 1-4**)
  - `livret-referentiels` (schema v2) — référentiels de compétences (Bloc → Sous-famille? → Compétence)
  - `livret-banque-questions` (schema v3) — banque centrale des questions de l'entretien tripartite, **affectées E1..E4 + obligatoires par le coordo** (juin 2026)
  - `livret-etablissements` (schema v1) — lieux de formation + URL Pronote (gestion admin uniquement)
  - `livret-attitudes` (schema v1) — **catalogue global des attitudes professionnelles** (gestion admin uniquement, juin 2026)
- **Routing** : React Router v6
- **PDF** : `@react-pdf/renderer` 4 (lazy-loaded — chargé uniquement au clic « Exporter », palette PDF alignée sur charte UI mai 2026)
- **XLSX** : `fflate` (~12 KB) pour la décompression ZIP **et la génération** (modèles d'import utilisateurs), parser maison
- **Tests unitaires** : Vitest 2 + Testing Library + jsdom (env `node` pour les tests qui touchent au natif Uint8Array)
- **Tests E2E** : Playwright 1.59 (Chromium-desktop + Pixel 5 émulation mobile)
- **Lint/Format** : ESLint 9 (flat config) + Prettier 3
- **Icônes** : lucide-react (exclusif, pas d'emojis)
- **Aucune dépendance d'analytics ou tracking** (CDC §20)

---

## 3. Infrastructure & déploiement

### VPS Hostinger (mutualisé avec d'autres projets GRETA)

|                      |                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **OS**               | Ubuntu 24.04 LTS                                                                             |
| **IP**               | 69.62.107.157                                                                                |
| **RAM / disque**     | 8 Go / 96 Go (10 Go utilisés)                                                                |
| **Reverse proxy**    | Traefik (Docker, port 80/443) — partagé avec n8n, pronote-tracker, amklelec, laremisevintage |
| **TLS**              | Let's Encrypt automatique via ACME challenge Traefik                                         |
| **DNS**              | DuckDNS (`livret-glm.duckdns.org`)                                                           |
| **Conteneur livret** | `nginx:1.27-alpine`, 3 Mo RAM, 0 % CPU, sur réseau `n8n_default`                             |
| **Web root**         | `/var/www/livret/` (bind-mount RO côté conteneur)                                            |
| **Compose**          | `/docker/livret/docker-compose.yml`                                                          |
| **Basic Auth**       | middleware Traefik (bcrypt)                                                                  |

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

### Extensions hors-CDC v1.3 (avril → mi-mai 2026)

#### Rôles Coordo + Admin

- 4ᵉ et 5ᵉ rôles dans le système (couleurs **orange foncé** et **or foncé** depuis l'équilibrage du 26 mai 2026 — auparavant cyan-700 et indigo-700)
- 13 ressources `admin.*` dans la matrice (utilisateurs, formations, affectations, référentiels, banque-questions, établissements, **import-xlsx**)
- Pages CRUD réelles : utilisateurs ✓ + formations ✓ + affectations ✓ + référentiels ✓ + banque-questions ✓ + établissements ✓ + **import-utilisateurs ✓**
- Fixtures : Martine LEFÈVRE (coordo), Guillaume FERRERI (admin)
- **Aucun droit pédagogique** pour ces deux rôles — testé exhaustivement (commentaires, niveaux, signatures, observations exclus)
- **Exception métier** : le formateur référent peut créer un·e apprenti·e + un maître (besoin terrain)

#### Import de référentiels (CSV + XLSX)

- Phases A → E livrées : type `Competence.sousFamille?` + `Referentiel.niveauxColonnes?: 2 | 3` + parser CSV (encodage UTF-8/CP1252 auto, séparateur auto) + parser XLSX maison (`fflate` pour ZIP + sharedStrings + sheet1, regex robustes) + détection automatique CSV vs XLSX par signature ZIP
- Tests d'intégration sur les 4 fichiers exemples réels du pilote
- Workflow finalisé (formation optionnelle, nom libre, relation N:1, affichage des formations rattachées)

#### Sélection des compétences abordées en entreprise — par stagiaire (CDC v1.5 §12)

- Décision conjointe formateur référent + maître d'apprentissage
- Validation automatique à la 3ᵉ signature de l'**Entretien Tripartite 1** (depuis chantier #2)
- Modification ultérieure : invalidation R10 motivée du formateur (≥ 10 caractères)
- Lib pure `selection-competences-entreprise` — 24 tests TDD
- Bump `useLivretStore` v7 → v8 (création initiale), reset complet

#### Renommages UI (16 mai 2026)

- « Organisation du suivi » → **« Fiches de suivi »** (libellé visible)
- « Fiches de suivi » → **« Période en Entreprise »** (libellé visible)
- URLs internes inchangées (pas de migration nécessaire)

#### Renommage UI (11 juin 2026 — retours coordonnateurs pédagogiques)

- « Maître d'apprentissage » → **« Maître / Tuteur »** (libellé visible partout : role switcher, trio header, modales admin, tableaux, entretien, PDF, messages R14/validation ; pluriel « Maîtres / Tuteurs » dans les filtres et l'import Excel)
- Identifiants techniques inchangés (`maitre`, `Maitre`, `maitreApprentissageId`…) — pas de migration localStorage
- Tests adaptés : `droits.test.ts`, `regles-periode.test.ts`, helpers + 7 specs E2E

#### Affectation des questions d'entretien par le coordo (11 juin 2026 — retours coordonnateurs pédagogiques)

Refonte du modèle de gouvernance des questions de l'entretien tripartite :

- **Affectation par le coordo** : chaque question de la banque porte `pourEntretien1` / `pourEntretien2` (cases « E1 / E2 » dans le tableau `/admin/banque-questions`) et `obligatoire` (nouvelle colonne entre Type et Actions)
- **Snapshot à l'initialisation** : un entretien fige sa configuration au moment où il est initialisé (`EntretienTripartite.questionsImposees` + `questionsObligatoires`) — les changements ultérieurs de la banque ne cascadent pas
- **Formateur en ajout seulement** : il peut ajouter des questions de la banque à un entretien, mais ne peut pas retirer celles affectées par le coordo (cases verrouillées + badge « Affectée » dans le sélecteur ; garde-fou côté store)
- **Obligatoire = non retirable + réponse exigée** (extension R20 entretien) : la signature de la cible concernée (apprenti·e ou maître) est bloquée tant que la réponse n'est pas renseignée — raison affichée dans l'encart ambre du bloc signatures ; badge « Obligatoire » sur la question
- Par défaut : les 11 questions historiques sont affectées à E1, les questions de suivi/bilan aussi à E2 ; 2 obligatoires (« motivations » apprenti, « déjà formé » maître)
- Une question créée par le coordo arrive **non affectée** (il la branche ensuite sur E1/E2 depuis le tableau) ; la modale d'édition ne touche pas à l'affectation
- Bumps : `livret-banque-questions` v1 → v2, `livret-donnees` v10 → v11 (reset)
- 20 tests TDD ajoutés (`questions-entretien` 14 → 29, `regles-entretien` 18 → 23) + 3 nouveaux scénarios E2E (cases coordo persistées, verrou sélecteur, snapshot + R20 bout-en-bout)

#### Jusqu'à 4 entretiens tripartites par livret (11 juin 2026 — retours coordonnateurs pédagogiques)

Pour les formations de 2 ans, le livret peut désormais porter jusqu'à **4 entretiens tripartites** :

- **Nombre défini par le coordo au niveau de la formation** (1 à 4, défaut 2) — dans la modale Planning, au même endroit que les périodes (`Formation.nombreEntretiens`)
- **Modèle refondu** : `Livret.entretien1`/`entretien2` remplacés par `entretiens: Record<1|2|3|4, EntretienTripartite | null>` ; banque de questions `pourEntretien1/2` remplacés par `pourEntretiens: NumeroEntretien[]` (cases E1..E4 dans le tableau ; questions de suivi/bilan affectées E2+E3+E4 par défaut)
- **Motifs filtrés** : l'organisation du suivi ne propose `Entretien Tripartite 1..N` que selon le nombre de la formation (2 nouveaux motifs `entretien-tripartite-3`/`-4`)
- **Verrou de réduction** : impossible de descendre en dessous du plus haut entretien déjà engagé (initialisé ou planifié) dans un livret de la promo — message explicite dans la modale (`lib/nombre-entretiens`, 13 tests TDD)
- **Inchangé** : R7 (alerte > 60 j) et l'auto-marquage de la sélection des compétences restent propres à E1 ; la route `/livret/entretien/:numero` rend un 404 au-delà du nombre de la formation ; PDF en boucle sur les entretiens existants
- Bumps : `livret-donnees` v11 → v12, `livret-formations` v3 → v4, `livret-banque-questions` v2 → v3
- +15 tests unitaires (lib `nombre-entretiens` + motifs + affectations) et +5 scénarios E2E (`entretiens-multiples.spec.ts`)

#### Événements de suivi gérables par le coordo et l'admin (11-12 juin 2026 — retours coordonnateurs pédagogiques)

- La ressource `organisation-suivi` (création / modification / suppression des événements de la page « Fiches de suivi ») passe de `formateur` seul à **`formateur` + `coordo` + `admin`** — gestion calendaire/organisationnelle, pas de contenu pédagogique
- **Nouvelle ressource `entretien.gestion`** (formateur uniquement) : l'initialisation des entretiens et l'édition de leur date — auparavant adossées à `organisation-suivi` — restent des actes pédagogiques fermés au coordo/admin. La doctrine « coordo/admin sans droit pédagogique » est préservée (test transverse adapté)
- **Liseré des cartes d'événements colorisé par rôle actif** : nouvelle utility CSS `.bordure-gauche-couleur-role` (variable `--ring`) remplace le violet formateur codé en dur — formateur violet, coordo orange, admin or
- Matrice : 46 → **47 ressources × 5 rôles**
- +1 test unitaire droits, +3 scénarios E2E (coordo gère un événement + liseré ; admin gère ; coordo ne peut pas initialiser un entretien)

#### Répartition des motifs par rôle + séquencement des entretiens (12 juin 2026 — retours coordonnateurs pédagogiques)

- **Motifs de création répartis par rôle** (`motifsProposablesPourRole`) : le formateur référent ne peut créer que les événements « Entretien Tripartite 1..N » ; le coordo et l'admin créent tous les motifs (réunions, visites, bilans, autre — et les entretiens aussi). La modification/suppression des événements existants reste partagée
- **Séquencement des entretiens** (`peutInitialiserEntretien`) : impossible d'initialiser l'entretien N tant que l'entretien N-1 n'est pas signé par les 3 parties (E1 toujours libre). Bouton désactivé avec raison explicite + garde dans le store (no-op) — l'événement peut en revanche être planifié à l'avance
- L'initialisation reste réservée au formateur (`entretien.gestion` inchangée)
- +9 tests unitaires, +2 scénarios E2E (motifs du formateur restreints ; blocage E3 si E2 non signé ; happy path E2 via E1 signé)

#### Attitudes professionnelles évaluées à chaque entretien + catalogue admin (12 juin 2026 — retours coordonnateurs pédagogiques)

Les attitudes professionnelles sortent du référentiel de compétences et de l'évaluation finale pour devenir un **catalogue global géré par l'admin**, évalué par le **maître / tuteur à chaque entretien tripartite** :

- **Nouveau store `useAttitudesStore`** (`livret-attitudes` v1) — catalogue par défaut de 6 attitudes (ponctualité, respect des consignes, qualité du travail, intégration, initiative, communication), CRUD admin sur la nouvelle page `/admin/attitudes` (libellé + description, suppression en 2 clics **bloquée si l'attitude est évaluée dans au moins un entretien**)
- **Évaluation dans l'entretien** : nouvelle section « Attitudes professionnelles » dans la zone Maître / Tuteur de chaque entretien (sélecteur ++/+/-/-- par attitude, stockée dans `EntretienTripartite.evaluationsAttitudes`) — nouvelle ressource `entretien.attitudes` (**maître seul**)
- **R20 étendue** : le maître ne peut pas signer un entretien sans avoir évalué **au moins une attitude** (raison explicite « Évaluez au moins une attitude professionnelle. »)
- **L'onglet « Attitudes » de l'évaluation finale devient une synthèse en lecture seule** (`SyntheseAttitudes` remplace `GrilleAttitudes`) : une ligne par attitude × une colonne par entretien E1..EN — la progression se lit d'un coup d'œil. Le modèle `Referentiel.attitudes` et `Livret.evaluationFinaleAttitudes` sont supprimés
- **PDF aligné** : les évaluations d'attitudes apparaissent dans chaque page d'entretien + tableau de synthèse sur la page d'évaluation finale
- Matrice : `grille-attitudes.maitre`/`grille-attitudes.formateur` retirées, `entretien.attitudes` + `admin.attitudes.gerer` ajoutées — **toujours 47 ressources × 5 rôles**
- Bumps : `livret-donnees` v12 → v13 (reset)
- +12 tests unitaires (lib `attitudes` 9 + droits + R20 maître), +4 scénarios E2E (`attitudes.spec.ts` : accès admin seul, CRUD, verrou de suppression, R20 bout-en-bout)

#### Séparateur visuel dans la grille de compétences (12 juin 2026 — retours coordonnateurs pédagogiques)

- Trait vertical entre les colonnes « Acquis en centre » et « Commentaire » de la grille de compétences (lisibilité de la frontière entreprise/centre vs annotations)

#### Retrait du bandeau de démonstration (12 juin 2026 — retours coordonnateurs pédagogiques)

- Le bandeau « MAQUETTE DE DÉMONSTRATION — Données fictives… » (CDC §21.6) est **retiré de l'interface** : le statut de démonstration est acquis pour toutes les parties prenantes
- La mention reste sur la **page de garde du PDF exporté** — un document qui circule hors plateforme doit continuer d'annoncer ses données fictives
- Specs E2E `sprint1-role-switcher` (4 → 3 tests, vérifie désormais l'absence du bandeau) et `sprint5-bout-en-bout` adaptés

#### Verrou : l'événement d'un entretien signé est insupprimable (12 juin 2026 — retours coordonnateurs pédagogiques)

- La fiche de suivi (événement « Entretien Tripartite N » de la page Fiches de suivi) **ne peut plus être supprimée dès que l'entretien correspondant est signé par au moins une partie** — elle trace un acte engagé
- `peutSupprimerEvenement` étendue (lib pure, bouton désactivé + raison en infobulle « signé par N partie(s) ») + garde no-op dans le store ; le verrou manuel existant prime (message « déverrouillez d'abord »)
- Un entretien initialisé mais non signé, ou non initialisé, reste librement supprimable ; les autres motifs ne sont pas concernés
- +6 tests unitaires (`organisation-suivi` 21 → 27), +1 scénario E2E

#### Logo officiel GRETA CFA (12 juin 2026)

- Le carré « GLM » de la maquette est remplacé par le **logo officiel du réseau GRETA CFA — Académie de Lyon** (Marianne + bandeau réseau) dans le header et sur la page de garde du PDF
- Asset : `src/assets/logo-greta.png` (483 Ko — PNG 4096×1234 extrait du SVG fourni ; la source `logo.svg` reste à la racine, ignorée par git). ⚠ À optimiser plus tard : une version redimensionnée (~800 px) ferait gagner ~400 Ko au premier chargement et au PDF exporté

#### Répartition des apprenti·e·s entre coordos (12 juin 2026 — retours coordonnateurs pédagogiques)

**Chaque coordo ne voit que les apprenti·e·s de son périmètre ; l'admin voit tout et répartit** :

- **Modèle** : `Apprenti.coordoId` optionnel — affecté par l'**admin seul** (nouvelle colonne « Coordinateur·rice » dans `/admin/affectations`, en lecture seule pour le coordo). Hors verrou d'affectation : la répartition est administrative, elle ne touche aucune donnée pédagogique. Un·e apprenti·e sans coordo n'est visible que de l'admin
- **Filtre partout** : tableau de bord, gestion des utilisateurs et gestion des affectations — les listes d'apprenti·e·s du coordo sont restreintes à son périmètre (`apprentisAccessibles` bascule de `Coordo.formationIds` vers `coordoId` ; `formationIds` reste utilisé pour l'accès Pronote/établissements)
- **Création** : un coordo qui crée un·e apprenti·e se l'affecte automatiquement ; l'admin choisit via un champ dédié de la modale (« — Aucun·e — » possible)
- **Sélecteur de coordo actif** sur le tableau de bord (rôle coordo, pattern du sélecteur de maître) : bascule Martine LEFÈVRE ↔ Bernard PETIT pour démontrer les périmètres
- Fixtures : 2ᵉ coordo **Bernard PETIT** — Martine suit Le Gourmet (Léa, Théo, Sofia), Bernard la Brasserie du Rhône (Minh, Aya, Luca)
- Bump `livret-utilisateurs` v3 → v4 (reset)
- +2 tests unitaires, +1 scénario E2E (répartition par l'admin → périmètres respectifs) et 4 tests E2E adaptés

#### Signature manuscrite tactile (12 juin 2026 — CDC v1.5 §14.C, volet maquette)

Le bouton « Signer » exige désormais un **tracé manuscrit** (doigt, stylet ou souris) :

- **`ZoneSignature`** (canvas pointer events, `touch-action: none`, rendu net au devicePixelRatio, lissage quadratique) — implémentation interne sans dépendance, intégrée à l'encart de confirmation du `BoutonSigner` (entretiens **et** fiches de période, un seul point d'entrée)
- **« Confirmer » désactivé tant que le tracé n'est pas significatif** (≥ 60 px cumulés — lib pure `signature-tactile`, écarte le clic accidentel) ; boutons Effacer / Annuler ; auto-annulation portée à 60 s
- **Stockage** : PNG (data-URL) dans `SignaturePartie.trace` — champ optionnel, les signatures historiques (fixtures) restent valides sans image. **Image statique uniquement** : pas de capture de la dynamique du tracé (vitesse/pression = biométrie, RGPD art. 9)
- **Restitution** : image dans les cartes de signature (UI) et dans le PDF d'export
- R19 (horodatage au clic) et R21 (retrait impossible hors R10) inchangées
- ⚠ **Valeur probante** : déclarative en maquette — deviendra une signature électronique « simple » (eIDAS) à l'étape 2 avec session authentifiée + horodatage serveur (cf. `TODO-etape-2.md`)
- +8 tests unitaires (lib `signature-tactile`), +4 scénarios E2E (`signature-tactile.spec.ts` : tracé exigé, persistance, annulation, rétrocompatibilité fixtures)

#### Tri / filtre par année de formation sur le tableau de bord (12 juin 2026 — retours coordonnateurs pédagogiques)

Préparation des tableaux de bord multi-promos (maître, formateur, coordo, admin) :

- **Sélecteur « Filtrer par année de formation »** à côté de la recherche par nom — liste les années académiques des formations des apprenti·e·s accessibles (+ « Toutes les années »), visible dès qu'il y a plus d'une carte
- **Tri des cartes** : promo la plus récente d'abord, puis NOM/prénom (`trierApprentisParAnneePuisNom`) ; l'année apparaît sur chaque carte à côté de l'intitulé de la formation — « CAP Cuisine (2025-2026) »
- 3 helpers purs dans `lib/apprentis-accessibles` (`anneesFormationsDisponibles`, `filtrerParAnneeFormation`, tri) — 6 tests TDD
- Bugfix au passage : `min-w-0` sur les cartes de la grille (item grid `min-width:auto`) — la ligne « formation · contrat » en nowrap faisait déborder la page de 5 px sur mobile
- +6 tests unitaires, +1 scénario E2E

#### Second maître / tuteur par apprenti·e (12 juin 2026 — retours coordonnateurs pédagogiques)

Un·e apprenti·e peut désormais avoir **2 maîtres / tuteurs** :

- **Modèle** : `Apprenti.maitreApprentissageSecondId` optionnel — le principal reste obligatoire et porte l'entreprise de référence (en-têtes, trio du header, PDF) ; le second a les **mêmes droits d'accès et d'édition** (lib `maitres-apprenti`, synchronisation des `apprentiIds` des deux maîtres dans le store)
- **Signature partagée** : le slot « Maître / Tuteur » des entretiens et fiches reste **unique** — n'importe lequel des deux signe au nom de l'entreprise (R9/R15 inchangées, pas de blocage si l'un est absent)
- **Entreprises libres** : le second peut être d'une autre entreprise (mise à disposition, groupement d'employeurs) — la sienne apparaît entre parenthèses sur la page de garde du PDF
- **UI** : 2ᵉ sélecteur « Second (optionnel) » dans `/admin/affectations` (même verrou que le principal, options croisées filtrées pour empêcher les doublons) + champ dans la modale apprenti·e ; validation « second ≠ principal »
- **Verrous existants étendus automatiquement** : suppression d'un maître bloquée s'il est second d'un·e apprenti·e (via `apprentiIds`)
- Fixture de démo : Luca BIANCHI a Hélène (principale) + Karim (second) — Karim voit donc 4 apprenti·e·s
- Bump `livret-utilisateurs` v2 → v3 (reset)
- +10 tests unitaires (lib `maitres-apprenti` 8 + validation 2), +1 scénario E2E (affectation d'un second maître → accès au livret) et 4 specs adaptés

#### Confirmation avant écrasement d'une évaluation héritée (12 juin 2026 — retours coordonnateurs pédagogiques)

Dans l'évaluation finale, la colonne « Acquis en entreprise » reporte automatiquement les fiches de période (badge « Vue en Période N ») — ces valeurs ne doivent pas être modifiables d'un simple clic :

- **Garde-fou `confirmationRequisePourEcraserHeritage`** (`lib/synthese-evaluation`) : remplacer une valeur héritée par une saisie non-nulle exige une confirmation explicite ; l'effacement (« Non renseigné ») et la modification d'une saisie déjà manuelle restent libres
- **Modale de confirmation** côté maître / tuteur : rappelle la valeur héritée, sa période d'origine et la nouvelle valeur ; tant qu'elle n'est pas confirmée, la cellule conserve le report automatique. Le retour à l'héritage via « Non renseigné » y est documenté
- La colonne « Acquis en centre » (formateur) reste à comportement inchangé — le helper est générique si la symétrie est demandée plus tard
- +6 tests unitaires (`synthese-evaluation` 12 → 18), +1 scénario E2E (modale annulée puis confirmée, badge d'héritage)

#### Corrections de fond découvertes au passage (11 juin 2026)

- **Script `npm run e2e` corrigé** : il ne rebuildait pas (`playwright test` seul) et testait donc un `dist/` obsolète — la doc affirmait le contraire. Désormais `npm run build && playwright test`.
- **6 specs E2E réalignées** sur les chantiers #1/#2 de fin mai (échecs masqués jusqu'ici par le dist obsolète) : compte d'événements de Léa (10), liens sidebar entretien ancrés sur « Entretien tripartite 1 », état vide Minh (« Aucune période planifiée »), accès entretien Sofia par URL directe, bouton « Fermer » de la modale planning ciblé sans ambiguïté.
- **Verrou d'affectation assoupli (`affectation-verrou.ts`)** — ⚠ à valider pilote (règle de gouvernance CDC v1.5 §10.4) : le critère « fiches existantes » ne compte plus que les fiches **sorties de l'état brouillon**. Depuis le chantier #1, les fiches sont auto-créées vierges à la création de l'apprenti·e : l'ancien critère verrouillait la suppression de tout compte fraîchement créé (même par erreur). R16 garantissant que toute modification fait passer une fiche de brouillon à en-cours, l'esprit de la règle (protéger le travail) est conservé. 9 tests TDD (au lieu de 7).

#### Établissements (lieux de formation) + Pronote WEB (17 mai 2026)

- Nouveau type `Etablissement { id, nom, adresse?, codePostal?, ville?, urlPronote? }`
- `Formation.lieu: Lieu` → `Formation.lieuId: string`
- Page admin `/admin/etablissements` (admin uniquement)
- Page utilisateur `/livret/pronote` (tous rôles, filtré par accès — lib `etablissements-accessibles`, 9 tests TDD)
- Suppression d'un établissement bloquée si formation rattachée (verrou 4 tests TDD)

#### Banque de questions de l'entretien tripartite

- Catalogue centralisé `/admin/banque-questions` (coordo + admin)
- Formateur référent sélectionne par livret les questions
- 14 tests TDD sur `questions-entretien`

#### Organisation du suivi modulaire

- Liste dynamique d'événements créés à la demande
- 9 motifs (`MotifOrganisationSuivi`) — dont **2 motifs entretien tripartite** ajoutés au chantier #2
- 13 tests TDD sur `organisation-suivi`

### Vague mai 2026 (chantiers 1 → 5, fin mai)

Cinq chantiers fonctionnels structurants livrés en cascade (ordre risque croissant) :

#### Chantier #4 — Modale maître : Entreprise + Fonction

- Type `Maitre.entrepriseId` → `entreprise` (texte libre) + `fonction` (texte libre), tous deux obligatoires
- Modale `ModaleUtilisateurStaff` adaptée — 2 champs côte à côte
- Fixtures démo : Karim BENALI = « Restaurant Le Gourmet » / « Chef de cuisine » ; Hélène ROCHE = « La Brasserie du Rhône » / « Cheffe de cuisine »
- PDF page de garde enrichi : 2 nouvelles lignes (Entreprise, Fonction du maître)
- Bump `useUtilisateursStore` v1 → v2

#### Chantier #3 — Suivi GRETA CFA : 2 zones de texte

- Ancien tableau `LigneSuiviGreta[]` (cours / formateur / contenu / évaluations) **retiré**
- Remplacé par 2 zones de texte libre dans chaque `FicheSuiviPeriode` :
  - Apprenti·e (« Ce que j'ai appris en centre cette période »)
  - Formateur référent (« Contenus abordés au CFA, points d'attention »)
- R20 formateur adaptée : « zone formateur non vide » au lieu de « ≥ 1 ligne »
- 2 nouvelles ressources matrice : `fiche.suivi-greta-cfa-apprenti` (apprenti) + `fiche.suivi-greta-cfa-formateur` (formateur)
- Ancienne ressource `fiche.suivi-greta-cfa` retirée
- Bump `useLivretStore` v8 → v9

#### Chantier #5 — Import XLSX apprentis / maîtres / formateurs

- Nouvelle page `/admin/import-utilisateurs` (coordo + admin)
- 3 modèles Excel téléchargeables auto-générés (lib `generer-xlsx-modele` — XLSX maison, parser-XLSX existant en round-trip)
- **Cellules date Excel** (numFmt `yyyy-mm-dd`) sur les colonnes Date de naissance / Début de contrat / Fin de contrat — évite les saisies texte ambiguës
- Parser-importer pipeline tout-ou-rien (refus complet si moindre erreur), normalisation des serial Excel
- 23 tests TDD `import-utilisateurs` + 13 tests TDD `generer-xlsx-modele`
- Apprenti importé sans affectation (formation/maître/formateur vides — à finaliser dans Affectations)

#### Chantier #1 — Planning des périodes au niveau formation

- Refonte structurante : la liste des périodes n'est plus créée par livret, elle vit sur la `Formation`
- Nouveau type `PeriodeFormation { id, numero, titre?, dateDebut, dateFin }` + `Formation.periodes: PeriodeFormation[]`
- Nouveau type `FicheSuiviPeriode.periodeFormationId` (référence vers la période parente)
- Modale dédiée `ModalePlanningPeriodes` (accessible via bouton « Planning ({N}) » sur chaque carte formation dans `/admin/formations`)
- 3 mutations store `ajouterPeriode` / `modifierPeriode` / `supprimerPeriode` avec **cascade automatique** vers tous les livrets de la promo
- Verrou modification/suppression refusé si au moins une fiche correspondante est signée ou verrouillée
- Lib `validation-periode-formation` — 16 tests TDD
- Page « Période en Entreprise » repassée en lecture seule sur le planning + bandeau d'info renvoyant vers `/admin/formations`
- 3 ressources matrice retirées : `fiche.creer-periode` / `fiche.modifier-periode` / `fiche.supprimer-periode` (gestion calendaire = `admin.formations.modifier`)
- Bump `useFormationsStore` v2 → v3 ; fixtures (Léa, Théo, Sofia, Minh, Aya, Luca) réécrites pour pointer vers les 3 périodes de la formation `f-cap-cuisine-2025`

#### Chantier #2 — 2 entretiens tripartites via événement organisation suivi

- Le plus gros chantier : refonte du modèle entretien
- `Livret.entretienTripartite` (unique) → `entretien1` + `entretien2` (deux entretiens par livret)
- 2 nouveaux motifs `MotifOrganisationSuivi` : `entretien-tripartite-1` et `entretien-tripartite-2`
- Page entretien : route refondue en `/livret/entretien/:numero`
- Liens **conditionnels** dans la sidebar (un lien par événement entretien existant dans l'organisation du suivi du livret actif)
- Bouton « Ouvrir cet entretien » sur les événements de motif `entretien-tripartite-{1|2}` dans `OrganisationSuivi`
- **Auto-marquage de la sélection compétences entreprise** à la 3ᵉ signature de **E1 uniquement** (E2 = bilan mi-parcours sans effet sur la sélection)
- **R7 (alerte > 60 j sans entretien) appliquée à E1** uniquement
- Section « Sélection des compétences abordées en entreprise » visible **uniquement dans E1**
- Toutes les mutations entretien du store prennent un paramètre `numero: 1 | 2`
- PDF : 2 sections entretien (E2 omis si null)
- Bump `useLivretStore` v9 → v10
- Fixtures : Léa a un événement E2 créé mais entretien vide (cas « à initialiser »), Sofia conserve son cas alerte R7 (override sans événement E1)

### Polish graphique — équilibrage palette par rôle (26 mai 2026)

Refonte de la cohérence visuelle pour identifier d'un coup d'œil le rôle actif et ses zones d'action :

**Palette redéfinie** (`tailwind.config.ts`) :

- 🔵 Apprenti : `#1e40af` (blue-800) — inchangé
- 🟢 Maître : `#059669` (emerald-600) — inchangé
- 🟣 Formateur : `#7c3aed` (violet-600) — inchangé
- 🟠 Coordo : `#0e7490` (cyan-700) → **`#c2410c` (orange-700)**
- 🟡 Admin : `#4338ca` (indigo-700) → **`#a16207` (yellow-700)**

**Bugfix PDF aligné UI** : `src/components/pdf/styles.ts` avait des couleurs incohérentes (apprenti=violet, maître=cyan, formateur=vert dans le PDF, alors que l'UI avait bleu/vert/violet). Maintenant aligné.

**~50 éléments graphiques** désormais colorisés par rôle, via 3 mécaniques :

- **Tokens explicites** dans `src/lib/couleurs-role.ts` : mappings `TEXTE_ROLE`, `BORDURES_ROLE`, `LIBELLES_ROLE`, etc. — pour les éléments où le rôle est connu statiquement
- **Variable CSS `--ring` dynamique** dans `index.css` : 5 classes `.role-actif-X` appliquées sur le wrapper AppShell qui redéfinissent `--ring` selon `roleActif` → tous les `focus-visible:ring-ring` du sous-arbre suivent automatiquement (boutons, cartes, inputs, selects)
- **Utilities CSS dérivées** de `--ring` : `.carte-survol-role`, `.actif-couleur-role`, `.texte-couleur-role`, `.bandeau-info-couleur-role`, `.bouton-plein-couleur-role`, `.bouton-leger-couleur-role` — couvrent les hover, sélection, boutons d'action, bandeaux d'info

**Couverture du polish** :

- Cartes signatures (bordures + icônes + texte « ✓ Signé » + bouton « Signer en tant que X »)
- Sections entretien (icônes en-tête + nom du rôle coloré)
- Zones d'observation (icônes ajoutées en en-tête)
- RoleSwitcher : icônes colorées **même en inactif** pour identification immédiate
- Mentions « Figée par signature » / « En attente de signature »
- Tableaux GestionUtilisateurs (bordure gauche colorée + libellé rôle)
- Liens sidebar actifs
- Cartes apprenti·e tableau de bord (hover + focus)
- Onglets Évaluation finale (Compétences / Attitudes)
- Boutons « + Nouveau X » de toutes les pages admin
- Boutons modales (Créer, Enregistrer)
- Boutons d'action propres au rôle (Initialiser entretien, Choisir questions, Clôturer livret → violet formateur ; Déverrouiller R10 → ambre conservé pour cohérence alerte)
- Bandeaux d'information contextuelle (planning par formation, import sans affectation, verrouillages, entretien validé)
- Icônes décoratives en-tête de pages
- Checkboxes (via `accent-[hsl(var(--ring))]`)
- Barre de progression (fallback)
- Bouton « Exporter le livret » PDF
- Boutons retour NotFound + AucunApprentiSelectionne

**Conservé en bleu (institutionnel)** : logo « GLM » du header AppShell, badges sémantiques d'état (signée / verrouillée / clôturée).

---

## 5. Règles métier R1 → R24

Toutes les règles du CDC v1.3 sont implémentées et testées. Quelques ajustements depuis l'addendum v1.5 :

| Règle   | Sujet                                                                                                                                                                                 | État                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| R1      | 1 livret par apprenti·e                                                                                                                                                               | ✓ implicite (modèle)                                      |
| R2      | `contratFin > contratDebut`                                                                                                                                                           | ✓ type-level + validation modale                          |
| R3      | Apprenti·e voit son livret seul                                                                                                                                                       | ✓ matrice + `apprentis-accessibles`                       |
| R4      | Maître voit ses apprenti·e·s                                                                                                                                                          | ✓ matrice                                                 |
| R5      | Formateur voit sa promo                                                                                                                                                               | ✓ matrice                                                 |
| **R6**  | **Jusqu'à 4 entretiens par livret — nombre défini par la formation (juin 2026)**                                                                                                      | ✓ E1..E4, verrou de réduction                             |
| **R7**  | **Alerte si > 60 j sans E1** (chantier #2 : ne concerne plus E2)                                                                                                                      | ✓ 5 tests                                                 |
| R8      | Verrouillage progressif entretien                                                                                                                                                     | ✓ par entretien                                           |
| R9      | 3 signatures = entretien figé                                                                                                                                                         | ✓ par entretien                                           |
| **R10** | **Déverrouillage formateur + motif**                                                                                                                                                  | ✓ 8 tests TDD + modale UI + traçabilité                   |
| R11     | `dateFin > dateDebut` période                                                                                                                                                         | ✓ 3 tests                                                 |
| R12     | Pas de chevauchement                                                                                                                                                                  | ✓ 4 tests                                                 |
| R13     | Création période N (assouplie — CDC v1.5 §14.B)                                                                                                                                       | ✓ chantier #1 : géré au niveau formation par coordo/admin |
| **R14** | **Avertissement N créée avant N-1 signée**                                                                                                                                            | ✓ 4 tests TDD (CDC v1.5 §14.B)                            |
| R15     | 3 signatures fiche = signée                                                                                                                                                           | ✓ 3 tests                                                 |
| R16     | brouillon → en-cours auto                                                                                                                                                             | ✓ 2 tests                                                 |
| R17     | 15 j sans modif → verrouillée                                                                                                                                                         | ✓ 3 tests + bouton manuel                                 |
| R18     | Signer son propre slot                                                                                                                                                                | ✓ matrice                                                 |
| R19     | Horodatage ISO 8601 au clic                                                                                                                                                           | ✓ dans `signer()`                                         |
| **R20** | **Champs requis avant signature** (chantier #3 : zone formateur GRETA CFA non vide ; juin 2026 : questions obligatoires répondues + ≥ 1 attitude évaluée pour le maître en entretien) | ✓ 18 tests fiche + R20 entretien dans `regles-entretien`  |
| **R21** | **Retrait signature impossible**                                                                                                                                                      | ✓ 6 tests TDD + bugfix UI                                 |
| **R22** | **Clôture livret**                                                                                                                                                                    | ✓ 14 tests TDD + bandeau 4 états                          |
| R23     | Synthèse temps réel                                                                                                                                                                   | ✓ recalcul à chaque render                                |
| R24     | Apprenti·e consulte à tout moment                                                                                                                                                     | ✓ matrice + bandeau lecture                               |

---

## 6. Tests (510 unitaires + 156 E2E)

### Tests unitaires Vitest (33 fichiers de test)

| Fichier                                        | Tests  | Périmètre                                                                                                                          |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lib/droits.test.ts`                           | 43     | Matrice 47 ressources × 5 rôles (organisation-suivi partagée, `entretien.gestion`, `entretien.attitudes`, `admin.attitudes.gerer`) |
| `lib/transitions-fiche.test.ts`                | 22     | R15/R16/R17/R21 + adaptation suivi GRETA texte                                                                                     |
| `lib/validation-signature.test.ts`             | 18     | R18/R20 — refonte chantier #3                                                                                                      |
| `lib/regles-periode.test.ts`                   | 18     | R11/R12/R13/R14                                                                                                                    |
| `lib/regles-entretien.test.ts`                 | 30     | R6/R7/R8/R9 (E1..E4) + R20 questions obligatoires + ≥ 1 attitude (maître) + séquencement `peutInitialiserEntretien` (juin 2026)    |
| `lib/attitudes.test.ts`                        | 9      | Catalogue par défaut + `attitudeEstUtilisee` + `auMoinsUneAttitudeEvaluee` (juin 2026)                                             |
| `lib/nombre-entretiens.test.ts`                | 12     | Bornes 1-4 + verrou de réduction + numéros disponibles (juin 2026)                                                                 |
| `lib/synthese-evaluation.test.ts`              | 18     | Last-write-wins fiches → finales + confirmation avant écrasement d'un héritage (juin 2026)                                         |
| `lib/stats-bloc.test.ts`                       | 6      | Compte des niveaux par bloc                                                                                                        |
| `lib/import-referentiel.test.ts`               | 24     | Parsing CSV (encodage CP1252, 2/3 cols)                                                                                            |
| `lib/cloture-livret.test.ts`                   | 14     | R22                                                                                                                                |
| `lib/deverrouillage-fiche.test.ts`             | 8      | R10                                                                                                                                |
| `lib/apprentis-accessibles.test.ts`            | 24     | Filtre par rôle (R3) + tri + recherche (Karim voit Luca en second — juin 2026)                                                     |
| `lib/maitres-apprenti.test.ts`                 | 8      | Double tutorat : ids des maîtres d'un·e apprenti·e + appartenance (juin 2026)                                                      |
| `lib/signature-tactile.test.ts`                | 8      | Longueur de tracé + seuil de signature significative (juin 2026)                                                                   |
| `lib/etat-livret.test.ts`                      | 13     | Cas pédagogiques 6 apprenti·e·s                                                                                                    |
| `lib/validation-apprenti.test.ts`              | 11     | Saisie apprenti·e + second maître ≠ principal (juin 2026)                                                                          |
| `lib/validation-utilisateur-staff.test.ts`     | 8      | Validation maître (entreprise + fonction — chantier #4)                                                                            |
| `lib/affectation-verrou.test.ts`               | 9      | Verrou affectation (fiches travaillées uniquement depuis le 11 juin 2026)                                                          |
| `lib/validation-formation.test.ts`             | 9      | Validation formation                                                                                                               |
| `lib/formation-verrou.test.ts`                 | 4      | Verrou suppression formation                                                                                                       |
| `lib/validation-import-referentiel.test.ts`    | 11     | Saisie d'import                                                                                                                    |
| `lib/referentiel-verrou.test.ts`               | 4      | Verrou suppression référentiel                                                                                                     |
| `lib/parser-xlsx.test.ts`                      | 16     | Parser XLSX (Node env pour fflate)                                                                                                 |
| `lib/selection-competences-entreprise.test.ts` | 24     | Sélection par livret CDC v1.5 §12                                                                                                  |
| `lib/validation-fiche-periode.test.ts`         | 16     | Saisie fiche + verrous                                                                                                             |
| `lib/organisation-suivi.test.ts`               | 27     | Catalogue motifs + motifs par rôle + verrou de suppression (entretien signé — juin 2026)                                           |
| `lib/questions-entretien.test.ts`              | 30     | Banque 11 questions + affectation E1..E4 + obligatoires + verrou retrait (juin 2026)                                               |
| `lib/etablissement-verrou.test.ts`             | 4      | Verrou suppression établissement                                                                                                   |
| `lib/etablissements-accessibles.test.ts`       | 8      | Filtrage par rôle Pronote                                                                                                          |
| **`lib/validation-periode-formation.test.ts`** | **16** | **Chantier #1 : R11/R12 + verrou modif/suppression période formation**                                                             |
| **`lib/generer-xlsx-modele.test.ts`**          | **13** | **Chantier #5 : round-trip XLSX + date Excel + serial conversion**                                                                 |
| **`lib/import-utilisateurs.test.ts`**          | **23** | **Chantier #5 : parsing 3 modèles + validation + politique tout-ou-rien**                                                          |

_Les modules `creation-livret.ts`, `couleurs-role.ts` et `utils.ts` sont couverts indirectement via les tests E2E._

### Tests E2E Playwright (21 specs)

156 tests (144 desktop + 12 mobile). Ajouts de juin 2026 : 3 scénarios « affectation des questions par le coordo », 5 scénarios « jusqu'à 4 entretiens », 3 scénarios « événements gérés par coordo/admin + liseré par rôle », 2 scénarios « motifs par rôle + séquencement », 4 scénarios « attitudes professionnelles » (`attitudes.spec.ts`), 1 scénario « confirmation avant écrasement d'un héritage ». Quelques specs ont été adaptés aux refontes :

- `fiches-periodes.spec.ts` : 8 tests réécrits pour le nouveau flow planning au niveau formation
- `sprint3-droits-entretien.spec.ts` : route `/livret/entretien/1`
- `entretien-selection-competences.spec.ts` : route `/livret/entretien/1` + auto-marquage E1 uniquement
- `banque-questions.spec.ts` : route `/livret/entretien/1`
- `audit-mobile.mobile.spec.ts` : route entretien numérotée
- `admin-utilisateurs-staff.spec.ts` : `staff-fonction` + valeurs entreprise réalistes

---

## 7. Architecture des fichiers

```
LIVRET APPRENTISSAGE/
├── README.md                       # mode d'emploi pilote
├── PROJECT-STATUS.md               # ce fichier
├── DEMO.md                         # script minuté 10 min + plan B
├── CONVENTIONS.md                  # règles de code (résumé CDC §16)
├── TODO-etape-2.md                 # captures de scope creep + pistes étape 2
├── perf-sprint-5.md                # mesures bundle + procédure Lighthouse
├── playbook-sso-entra-greta.md     # playbook SSO Entra (sera utilisé en étape 2)
├── cahier-des-charges-livret-apprentissage-v1.3.md
├── cahier-des-charges-livret-apprentissage-v1.5-addendum.md
├── design-system/MASTER.md         # palette équilibrée mai 2026
├── scripts/                        # déploiement VPS
├── e2e/                            # tests Playwright (21 specs)
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css            # variables CSS + utilities couleur-role
    ├── types/index.ts              # modèle (CDC §7 + chantiers mai 2026)
    ├── lib/                        # 36 modules + 33 fichiers tests
    │   ├── droits.ts               # matrice §6 (47 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21
    │   ├── validation-signature.ts # R18/R20 (zone GRETA texte chantier #3)
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6/R7 par entretien (chantier #2)
    │   ├── synthese-evaluation.ts  # last-write-wins fiches → finales
    │   ├── stats-bloc.ts           # agrégation par bloc
    │   ├── cloture-livret.ts       # R22
    │   ├── deverrouillage-fiche.ts # R10
    │   ├── import-referentiel.ts   # pipelines CSV + XLSX
    │   ├── parser-xlsx.ts          # parser XLSX maison
    │   ├── apprentis-accessibles.ts# filtre/tri/recherche par rôle
    │   ├── etat-livret.ts          # cas pédagogique tableau de bord
    │   ├── creation-livret.ts      # livret vierge + cascade planning formation
    │   ├── validation-apprenti.ts
    │   ├── validation-utilisateur-staff.ts  # +entreprise +fonction (chantier #4)
    │   ├── validation-formation.ts
    │   ├── validation-import-referentiel.ts
    │   ├── validation-fiche-periode.ts
    │   ├── validation-periode-formation.ts  # chantier #1
    │   ├── affectation-verrou.ts
    │   ├── formation-verrou.ts
    │   ├── referentiel-verrou.ts
    │   ├── selection-competences-entreprise.ts  # CDC v1.5 §12
    │   ├── organisation-suivi.ts   # +2 motifs entretien (chantier #2)
    │   ├── questions-entretien.ts
    │   ├── etablissement-verrou.ts
    │   ├── etablissements-accessibles.ts
    │   ├── generer-xlsx-modele.ts  # chantier #5 — XLSX writer maison
    │   ├── import-utilisateurs.ts  # chantier #5 — pipeline import
    │   ├── couleurs-role.ts        # polish — mappings Tailwind par rôle
    │   ├── __fixtures__/
    │   └── utils.ts
    ├── store/                      # 9 stores Zustand persistés
    │   ├── useUserStore.ts
    │   ├── useLivretStore.ts       # v10 — entretien1/entretien2 + suiviGretaCfa texte
    │   ├── useApprentiActifStore.ts
    │   ├── useUtilisateursStore.ts # v2 — Maitre.entreprise + fonction
    │   ├── useFormationsStore.ts   # v3 — periodes[] + cascade livrets
    │   ├── useReferentielsStore.ts # v2
    │   ├── useBanqueQuestionsStore.ts # v1
    │   └── useEtablissementsStore.ts # v1
    ├── fixtures/                   # 6 livrets démo + utilisateurs + formations + référentiels
    ├── components/
    │   ├── admin/
    │   │   ├── ModaleApprenti.tsx
    │   │   ├── ModaleUtilisateurStaff.tsx   # +entreprise +fonction
    │   │   ├── ModaleFormation.tsx
    │   │   ├── ModalePlanningPeriodes.tsx   # chantier #1
    │   │   ├── ModaleImportReferentiel.tsx
    │   │   └── ModaleQuestion.tsx
    │   ├── layout/
    │   │   ├── AppShell.tsx                 # wrapper avec classe role-actif-X
    │   │   ├── RoleSwitcher.tsx             # icônes inactives colorées
    │   │   ├── Sidebar.tsx                  # liens entretien dynamiques + lien actif coloré
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/                          # BoutonSigner (couleur rôle), BarreProgression…
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx            # chantier #3 — 2 zones texte
    │   │   ├── TableauTriColonnes.tsx
    │   │   ├── ZoneObservation.tsx          # +icônes en-tête colorées
    │   │   ├── BlocSignatures.tsx           # icônes + ✓ Signé colorés
    │   │   ├── DialogDeverrouillage.tsx
    │   │   └── ModaleFichePeriode.tsx       # legacy (chantier #1 a retiré son point d'entrée)
    │   ├── entretien/
    │   │   ├── SectionApprenti.tsx          # +icône GraduationCap colorée
    │   │   ├── SectionMaitre.tsx            # +icône HardHat colorée
    │   │   ├── SectionFormateur.tsx         # +icône UserCog colorée
    │   │   ├── SectionSelectionCompetences.tsx
    │   │   ├── BlocSignaturesEntretien.tsx  # icônes + ✓ Signé colorés
    │   │   └── SelecteurQuestions.tsx
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx
    │   │   ├── GrilleCompetences.tsx        # séparateur centre / commentaire (juin 2026)
    │   │   ├── SyntheseAttitudes.tsx        # synthèse lecture seule par entretien (juin 2026)
    │   │   └── BandeauCloture.tsx           # Clôturer en violet formateur
    │   └── pdf/                             # export lazy, palette alignée UI
    ├── pages/
    │   ├── TableauDeBord.tsx                # cartes avec hover couleur rôle
    │   ├── NotFound.tsx
    │   ├── OrganisationSuivi.tsx            # bouton « Ouvrir cet entretien »
    │   ├── EntretienTripartite.tsx          # route /livret/entretien/:numero
    │   ├── FicheSuiviPeriodes.tsx           # lecture seule (chantier #1)
    │   ├── FicheSuiviPeriodeDetail.tsx
    │   ├── EvaluationFinale.tsx             # onglets actifs couleur rôle
    │   ├── PronoteWeb.tsx
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx      # bordures gauches colorées
    │       ├── GestionFormations.tsx        # +bouton « Planning »
    │       ├── GestionAffectations.tsx
    │       ├── GestionReferentiels.tsx
    │       ├── GestionBanqueQuestions.tsx
    │       ├── GestionEtablissements.tsx
    │       └── ImportUtilisateurs.tsx       # chantier #5
    └── test/setup.ts
```

---

## 8. Reste à faire

### A. Sécurité VPS — action côté pilote (urgent)

> Le mot de passe SSH root du VPS a été partagé en clair dans une conversation et doit être changé.

- [ ] `passwd` sur le VPS pour changer le mot de passe root
- [ ] Générer une clé SSH dédiée au déploiement (`ssh-keygen -t ed25519`)
- [ ] Pousser la clé publique sur le VPS (`ssh-copy-id`)
- [ ] Désactiver l'auth par mot de passe dans `/etc/ssh/sshd_config` (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`, `systemctl restart sshd`)
- [ ] Vérifier que le mot de passe Basic Auth est partagé via canal sécurisé
- [ ] Avant chaque démo importante : `bash scripts/verifier-vps.sh` doit retourner 11/11 OK

Procédure complète dans `scripts/README.md` § _Sécurité_.

### B. Dette technique — code orphelin

Quelques composants/mutations devenus orphelins après les chantiers mai 2026 :

- `src/components/livret/ModaleFichePeriode.tsx` — remplacée par `ModalePlanningPeriodes` (chantier #1)
- `useLivretStore.ajouterFichePeriode` / `modifierFichePeriode` / `supprimerFichePeriode` — remplacées par la cascade depuis `useFormationsStore.ajouterPeriode` / `modifierPeriode` / `supprimerPeriode`

Detectable au prochain audit knip. Pas critique pour la démo.

### C. Documentation CDC

L'addendum v1.5 a été enrichi du journal des versions pour la vague mai 2026. Les évolutions futures (étape 2) feront l'objet d'un v2.0 dédié au moment du passage à l'authentification réelle.

### D. PDF d'export — refonte à prévoir

Revue UI/UX du PDF généré par le bouton « Exporter le livret » (`src/components/pdf/LivretPdf.tsx`, `styles.ts`, `BoutonExportPdf.tsx`). À mener avant la prochaine démo pilote. Périmètre à arbitrer : mise en page, typographie, ajout/retrait de sections, pagination, marges, identité visuelle de la page de garde, alignement charte palette mai 2026.

Cf. [`TODO-etape-2.md`](TODO-etape-2.md) (entrée 2026-05-26).

### E. Signature électronique manuscrite — chantier confirmé pilote

Zone de dessin tactile (au doigt) + souris sur `<canvas>` HTML5 — à coupler logiquement avec l'étape 2 (auth réelle pour le poids juridique de l'art. 1366 du Code civil) mais identifié comme priorité par le pilote. Bibliothèque candidate `signature_pad`. Intégration à anticiper dans la refonte PDF (cf. D) pour que la signature dessinée s'affiche dans l'export.

Cf. [`TODO-etape-2.md`](TODO-etape-2.md) et CDC v1.5 addendum §14.C.

### F. Conformité RGPD — chantier transverse étape 2

Liste recentrée sur les **33 obligations strictes** + 9 recommandations reportables (gouvernance, mentions d'information, droits des personnes, sécurité technique, sous-traitants, gestion d'incidents) consolidée dans [`conformite-rgpd.md`](conformite-rgpd.md). **Recentrage 2ᵉ passe (2026-05-26)** : retrait des mineurs (pas de livret numérique pour eux dans un premier temps) → **AIPD non obligatoire** (aucun des 9 critères CNIL rempli, cf. `conformite-rgpd.md` §5). Validation finale par le DPO du GRETA avant mise en production.

Trois phases identifiées : cadrage juridique en pré-production (registre, mentions, base légale, durées, inventaire sous-traitants), mise en œuvre technique à la mise en production étape 2 (hachage MdP, contrôle d'accès backend, journalisation, sauvegardes, DPA Microsoft + Mailjet), exploitation continue (revue des durées, purges automatiques, suivi CVE).

---

## 9. Limites connues (CDC §3 + observations)

- Pas d'authentification réelle — role switcher uniquement (passage prévu en étape 2 via SSO Entra ID)
- Pas de RGPD / RGAA strict — bonnes pratiques seulement
- Pas de notifications email — étape 2 (couplée à l'auth réelle)
- Pas de multi-établissement — un seul GRETA fictif
- Pas de backup automatique — données vivent dans le `localStorage` de chaque navigateur
- Pas de monitoring (Uptime Kuma, logs centralisés)
- Pas d'historique granulaire (CDC §12) — la traçabilité minimale `modifieLe` existe + historique R10 spécifique (déverrouillages fiches + invalidations sélection)
- Le déverrouillage temporaire des affectations n'est pas tracé (pas d'audit log) — décision pragmatique pour la maquette
- Sur les `<select>` natifs, l'option sélectionnée garde le style natif du navigateur (impossible à coloriser de manière fiable cross-OS) — à remplacer par un combobox custom en étape 2 si gênant

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
npm test               # 472 tests Vitest
npm run e2e            # 148 tests E2E Playwright (build + preview + tests)
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
[
  'livret-donnees',
  'livret-role-actif',
  'livret-apprenti-actif',
  'livret-utilisateurs',
  'livret-formations',
  'livret-referentiels',
  'livret-banque-questions',
  'livret-etablissements',
].forEach((k) => localStorage.removeItem(k));
location.reload();
```

---

## 11. Décisions architecturales notables

- **SPA Vite** (pas de SSR), **Zustand** (pas de Redux/RTK), **CSS pur** pour les charts (pas de biblio), **parser CSV/XLSX maison** (pas de SheetJS) — choix dictés par la cible bundle de la maquette
- **XLSX lecture + écriture** via `fflate` (~12 KB) : décompression ZIP pour le parser, recompression ZIP + XML maison pour la génération des modèles d'import utilisateurs (chantier #5). Cellules date Excel natives (numFmt `yyyy-mm-dd`).
- **PDF lazy-loaded** : `@react-pdf/renderer` dans un chunk séparé (493 KB gzip), chargé uniquement au clic « Exporter » → bundle initial 148 KB
- **Cascade Formation → Livrets** (chantier #1) : `useFormationsStore` modifie en cascade `useLivretStore` (création / modification / suppression de fiches dans tous les livrets de la promo). Lien fort via `FicheSuiviPeriode.periodeFormationId`.
- **2 entretiens par livret** (chantier #2) : `Livret.entretien1` + `entretien2`, mutations indexées par `numero: 1 | 2`. Auto-marquage de la sélection compétences à 3ᵉ signature E1 uniquement.
- **Tests TDD ciblés** sur la logique métier pure (`lib/`) ; les composants UI sont testés via Playwright E2E
- **Migration localStorage par bump de version** : reset complet à chaque bump (pas de migration logicielle, données fictives)
- **9 stores Zustand persistés avec import croisé** : synchronisations cross-store dans les actions, cycle résolu par ESM
- **Cohérence référentielle protectrice** : suppressions bloquées en cascade (apprenti·e si livret actif, maître/formateur si rattachements, formation si apprenti·e·s, référentiel si formations rattachées, période formation si fiches signées, événement organisation si verrouillé, question banque si utilisée, établissement si formation rattachée)
- **Palette par rôle** (équilibrage mai 2026) : 5 tokens dans `tailwind.config.ts` + variable CSS `--ring` dynamique au niveau du wrapper AppShell pour propager la couleur du rôle actif à tous les focus/hover/sélection. PDF aligné sur la même charte.
- **Mobile-first responsive** : drawer + RoleSwitcher compact + audit Playwright dédié 12 tests
- **Sélecteurs E2E stables via `data-testid`** sur les modales admin

---

## 12. Prochaine étape : Étape 2 (authentification réelle + comptes)

L'étape 1 du CDC v1.3 est **livrée et fonctionnelle**, enrichie par 4 vagues post-livraison. Pour passer en étape 2, le pilote a identifié 3 chantiers majeurs structurellement liés :

### 12.1 — SSO Microsoft Entra ID pour les personnels GRETA

- Connexion Microsoft 365 (OIDC `openid-client` v5) pour les comptes internes GRETA (coordo, formateur, admin)
- Tenant cible : `GRETA CFA Lyon Métropole` (ID `bc139aaa-fea0-465b-8d3d-be26ed74675d`)
- Le rôle est dérivé d'un mapping Entra ↔ rôle livret (groupes / claims)
- **Playbook complet déjà rédigé** : [`playbook-sso-entra-greta.md`](playbook-sso-entra-greta.md) — recette, pré-requis, pièges et parades issus du projet Suivi Pédagogique (gain ~1 jour de tâtonnement)
- Estimation : 1 jour bien rythmé

### 12.2 — Gestion des nouveaux comptes (création + validation email)

> **Spécification complète : [`chantier-creation-comptes.md`](chantier-creation-comptes.md)** — issue de la session de cadrage du 2026-05-26 avec le pilote. Toutes les décisions techniques actées (Mailjet, politique MdP option A, validité lien 7 jours, hashage argon2id, anti-énumération, rate limiting).

Pour les comptes **non couverts par le SSO** (apprenti·e·s + maîtres d'apprentissage = personnes hors GRETA), il faut un mécanisme de création avec validation par email :

- Création de compte côté admin/coordo (interface CRUD déjà en place — il faut ajouter le déclencheur email)
- Génération d'un **lien d'activation** envoyé par email à l'utilisateur·rice cible
- Définition du mot de passe au premier clic sur le lien (politique à définir : longueur min., complexité, expiration du lien)
- Vérification de l'unicité de l'email côté serveur (déjà côté client dans la maquette)
- **Stack mail à intégrer** : SMTP + templates (probablement via le VPS Hostinger, à coupler avec un service comme Brevo / Postmark / Mailjet)

### 12.3 — Gestion des mots de passe

- Stockage côté backend (bcrypt / argon2 — pas de mot de passe en localStorage)
- Réinitialisation par email (« Mot de passe oublié »)
- Changement de mot de passe depuis la page profil
- Expiration optionnelle (à définir avec le pilote — pratique métier)
- 2FA optionnel pour les rôles sensibles (admin, coordo) — à arbitrer

### 12.4 — Articulation des 3 chantiers

L'ordre logique recommandé :

1. **Backend minimal** (Node Express + bdd) en parallèle du frontend actuel — la maquette continue de tourner en mode démo localStorage le temps que le backend mature
2. **SSO Entra ID** (12.1) — couvre les comptes internes GRETA en premier (gain de friction maximal pour les utilisateurs cibles)
3. **Création + validation email** (12.2) + **gestion mot de passe** (12.3) — pour les comptes apprenti·e·s + maîtres d'apprentissage

D'autres pistes étape 2 sont listées dans [`TODO-etape-2.md`](TODO-etape-2.md), dont notamment la **signature manuscrite tactile** (chantier confirmé par le pilote — zone de dessin au doigt et à la souris sur `<canvas>` HTML5, gain de poids juridique avec l'auth réelle), les notifications email métier (entretien à programmer, fiche à signer, alerte R7…), l'historique granulaire (audit log toutes mutations) et le multi-établissement.

---

## 13. Archive — cadrage CDC v1.6 (26 mai 2026, chantiers livrés depuis)

Le document [`cahier-des-charges-livret-apprentissage-v1.6-cadrage.md`](cahier-des-charges-livret-apprentissage-v1.6-cadrage.md) cadrait le 26 mai 2026 les 5 chantiers « périodes par formation, 2 entretiens tripartites, suivi GRETA en texte libre, maître Entreprise/Fonction, import Excel utilisateurs ». **Ces 5 chantiers ont tous été livrés** dans la vague de fin mai 2026 (cf. §4 « Vague mai 2026 ») — le document est conservé comme archive du cadrage et des arbitrages (questions Q1.A à Q5.G).

---

_Étape 1 livrée + 4 vagues post-livraison (CDC v1.5 + chantiers métier mai 2026) : administration métier complète, organisation du suivi modulaire, **2 entretiens tripartites par livret**, **planning des périodes au niveau formation**, **import XLSX utilisateurs avec cellules date**, **suivi GRETA CFA en 2 zones texte**, **modale maître Entreprise + Fonction**, **équilibrage graphique 5 rôles**. Prochaine étape : SSO Entra + gestion comptes/mots de passe._
