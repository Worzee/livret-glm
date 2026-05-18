# Cahier des charges v1.5 — Addendum au v1.3

**Projet** : Livret d'apprentissage numérique GRETA Lyon Métropole
**Version** : 1.5 — addendum (extensions métier post-livraison v1.3)
**Date** : mai 2026
**Pilote métier** : Guillaume FERRERI (GRETA Lyon Métropole)
**Exécutant** : Claude Code (agent de développement)

---

## 0. Statut et portée de cet addendum

Ce document **complète** le cahier des charges v1.3 (`cahier-des-charges-livret-apprentissage-v1.3.md`) ; il ne le remplace pas. L'étape 1 du v1.3 a été **livrée et déployée**, puis enrichie par trois vagues d'extensions métier négociées avec le pilote et déployées dans la foulée :

- **Vague 1 (avril → début mai 2026)** : administration métier complète (rôles Coordo + Admin, CRUD utilisateurs / formations / affectations, import référentiels CSV/XLSX)
- **Vague 2 (mi-mai 2026)** : refontes structurantes (organisation du suivi modulaire, banque de questions d'entretien, établissements + Pronote WEB, renommages UI)
- **Vague 3 (17 mai 2026)** : sélection par stagiaire des compétences abordées en entreprise (décision conjointe formateur+maître validée à la 3ᵉ signature de l'entretien tripartite, R10 motivé) — remplace l'ancien flag global au niveau référentiel

Ce v1.5 fait la **synthèse écrite** de ces évolutions pour les sceller dans le CDC officiel. Quand une section du v1.3 est modifiée, la nouvelle version la **remplace intégralement** ; quand il s'agit d'un ajout, c'est mentionné explicitement.

Les **règles métier R1 → R24** du v1.3 restent toutes en vigueur et implémentées.

---

## Table des matières

- [0. Statut et portée de cet addendum](#0-statut-et-portée-de-cet-addendum)
- [1. Vue d'ensemble des évolutions](#1-vue-densemble-des-évolutions)
- [2. §4 — Rôles utilisateur étendus à 5](#2-§4--rôles-utilisateur-étendus-à-5)
- [3. §5.1 — Fiches de suivi (ex « Organisation du suivi ») — refonte modulaire](#3-§51--fiches-de-suivi-ex-organisation-du-suivi--refonte-modulaire)
- [4. §5.2 — Entretien tripartite avec banque de questions](#4-§52--entretien-tripartite-avec-banque-de-questions)
- [5. §5.3 — Période en Entreprise (ex « Fiche de suivi par période ») — renommage UI](#5-§53--période-en-entreprise-ex-fiche-de-suivi-par-période--renommage-ui)
- [6. §5.7 — Nouvelle section : Pronote WEB](#6-§57--nouvelle-section--pronote-web)
- [7. §6 — Matrice des droits étendue (47 ressources × 5 rôles)](#7-§6--matrice-des-droits-étendue-47-ressources--5-rôles)
- [8. §7.1 — Modèle de données enrichi](#8-§71--modèle-de-données-enrichi)
- [9. §10.4 — Verrouillage des affectations (règle de gouvernance)](#9-§104--verrouillage-des-affectations-règle-de-gouvernance)
- [10. §17.2 — Glossaire enrichi](#10-§172--glossaire-enrichi)
- [11. Nouvelle annexe : workflow d'import référentiels](#11-nouvelle-annexe--workflow-dimport-référentiels)
- [12. Nouvelle annexe : sélection par stagiaire des compétences abordées en entreprise](#12-nouvelle-annexe--sélection-par-stagiaire-des-compétences-abordées-en-entreprise)
- [13. Polish UX (trio header, mobile, cohérence destructive)](#13-polish-ux-trio-header-mobile-cohérence-destructive)
- [14. Arbitrages métier ouverts](#14-arbitrages-métier-ouverts)
- [15. Décisions architecturales notables (depuis v1.3)](#15-décisions-architecturales-notables-depuis-v13)
- [16. Synthèse des changements de modèle (migrations localStorage)](#16-synthèse-des-changements-de-modèle-migrations-localstorage)
- [17. Journal des versions](#17-journal-des-versions)

---

## 1. Vue d'ensemble des évolutions

| Domaine | Évolution | Section impactée du v1.3 |
|---|---|---|
| Rôles | Ajout Coordo + Admin (5 rôles) | §4 |
| Organisation du suivi | Refonte modulaire (liste d'événements à la demande) | §5.1 |
| Organisation du suivi | Renommage UI : « Organisation du suivi » → **« Fiches de suivi »** | §5.1 |
| Entretien tripartite | Refonte : banque de questions configurable + sélection par livret | §5.2 |
| Fiches de période | Renommage UI : « Fiches de suivi » → **« Période en Entreprise »** | §5.3 |
| Fiches de période | Création / renommage / suppression par formateur + coordo | §5.3 |
| Pronote WEB | Nouvelle section : portail externe par établissement, filtré par rôle | **nouvelle §5.7** |
| Référentiels | Import CSV + XLSX (formation optionnelle, relation N:1) | nouvelle annexe |
| Compétences en entreprise | **Sélection par stagiaire** (validation conjointe formateur+maître à la 3ᵉ signature entretien, R10 motivé) — remplace l'ancien flag global | nouvelle annexe §12 |
| Matrice droits | 44 → **47 ressources × 5 rôles** | §6 |
| Modèle de données | Nouveaux types `Coordo`, `Admin`, `Etablissement`, `EvenementOrganisationSuivi`, `QuestionBanque` | §7.1 |
| Modèle de données | `Lieu` inline → `Etablissement` référencé par `Formation.lieuId` | §7.1 |
| Affectations | Verrouillage automatique dès le démarrage du contrat / fiches existantes / entretien initialisé | nouvelle §10.4 |
| UX | Trio contextuel header (apprenti·e / maître / formateur) | polish |
| UX | Audit mobile complet + corrections tableaux admin | polish |
| UX | Cohérence des actions destructrices (confirmation 2 clics partout) | polish |

---

## 2. §4 — Rôles utilisateur étendus à 5

**Remplace §4.1 du v1.3.**

Le système distingue désormais **5 rôles** au lieu de 3 :

1. **Apprenti·e** — la personne en formation (vue restreinte à son livret)
2. **Maître d'apprentissage** — tuteur entreprise (encadre 1..N apprenti·e·s)
3. **Formateur référent** — pédagogique GRETA (suit 1..N promos)
4. **Coordinateur·rice** (« coordo ») — gère comptes, formations, affectations.
   Lecture seule sur les livrets pédagogiques (aucun droit sur les contenus pédagogiques).
5. **Administrateur·rice** (« admin ») — super-utilisateur typique pilote.
   Hérite des droits de tous les rôles + peut créer des coordos + signer au nom des 3 rôles métier (pas de slot de signature en propre).

### Couleurs UI

| Rôle | Tailwind token |
|---|---|
| apprenti·e | `role-apprenti` (bleu) |
| maître | `role-maitre` (vert) |
| formateur | `role-formateur` (violet) |
| coordo | `role-coordo` (cyan-700) |
| admin | `role-admin` (indigo-700) |

### Aucun droit pédagogique pour coordo et admin

**Règle stricte** : les rôles `coordo` et `admin` ne peuvent **pas** éditer les contenus pédagogiques (commentaires, niveaux de maîtrise, signatures, observations, réponses d'entretien, évaluations). Ils consultent en lecture seule. Testé exhaustivement via `lib/droits.test.ts` (cohérence transverse).

### Exception métier — création de comptes par le formateur référent

Le formateur référent peut **créer** un·e apprenti·e et un maître (besoin terrain — enregistrer rapidement un nouveau contrat sans attendre une intervention coordo). Il ne peut ni modifier ni supprimer les comptes existants (maintenance réservée au coordo).

### Fixtures démo

- **Coordo** : Martine LEFÈVRE
- **Admin** : Guillaume FERRERI
- 1 formateur (Sophie DUBOIS), 2 maîtres (Karim BENALI, Hélène ROCHE), 6 apprenti·e·s scénarisé·e·s (cf. §24.5 du v1.3 : Léa, Théo, Sofia, Minh, Aya, Luca).

---

## 3. §5.1 — Fiches de suivi (ex « Organisation du suivi ») — refonte modulaire

**Remplace §5.1 du v1.3.**

### Changement de libellé UI

L'ancienne page « Organisation du suivi » est **renommée « Fiches de suivi »** dans le menu et le titre de la page. L'URL interne (`/livret/organisation-suivi`) et la ressource matrice (`'organisation-suivi'`) restent inchangées pour préserver les liens historiques.

### Refonte modulaire

Les 6 cadres rigides du v1.3 (Réunion de rentrée, Entretien individuel, Accueil des tuteurs, Visites en entreprise, Restitution des activités, Bilans de formation) sont **remplacés par une liste dynamique d'événements** créés à la demande par le formateur référent.

### Modèle

```typescript
type MotifOrganisationSuivi =
  | 'reunion-rentree'
  | 'entretien-individuel'
  | 'accueil-tuteur'
  | 'visite-entreprise'
  | 'restitution-activites'
  | 'bilan-formation'
  | 'autre';

interface EvenementOrganisationSuivi {
  id: string;
  motif: MotifOrganisationSuivi;
  titre?: string;  // ex : « Visite n°1 — novembre 2025 »
  date?: string;
  commentaire?: string;
  verrouille?: boolean;
}

interface OrganisationSuivi {
  evenements: EvenementOrganisationSuivi[];
  modifieLe: string;
  modifiePar: string;
}
```

### Règles fonctionnelles

- **Multi-occurrences d'un même motif autorisées** (ex. 3 visites en entreprise distinctes), différenciées par le `titre` optionnel.
- **Création / suppression** réservée au formateur référent (ressource matrice `organisation-suivi`).
- **Verrou de suppression** : un événement verrouillé doit d'abord être déverrouillé avant suppression (helper `peutSupprimerEvenement`).
- Catalogue de motifs centralisé dans `lib/organisation-suivi.ts` (libellé, description, placeholder de commentaire) — extensible par le pilote en mode développement.

### Migration

Reset complet du `localStorage` du store livret (bump v5 → v6) au premier chargement. Les fixtures démo sont réécrites en mode modulaire (Léa porte 8 événements scénarisés dont 3 visites titrées).

---

## 4. §5.2 — Entretien tripartite avec banque de questions

**Remplace §5.2 du v1.3.**

### Refonte

Les **questions posées à l'apprenti·e et au maître d'apprentissage** ne sont plus codées en dur. Elles vivent dans une **banque centrale** gérée en CRUD par les coordos et admins. Pour chaque livret, le **formateur référent sélectionne** (et ordonne) les questions à poser.

### Modèle

```typescript
type CibleQuestion = 'apprenti' | 'maitre';
type TypeQuestion = 'texte-court' | 'texte-long' | 'oui-non';

interface QuestionBanque {
  id: string;
  cible: CibleQuestion;
  type: TypeQuestion;
  libelle: string;
  placeholder?: string;
}

interface EntretienTripartite {
  dateEntretien?: string;
  questionsApprentiSelectionnees: string[];  // ids, ordre = affichage
  questionsMaitreSelectionnees: string[];
  reponsesApprenti: Record<string, string | boolean | null>;  // indexées par questionId
  reponsesMaitre: Record<string, string | boolean | null>;
  appreciationMaitre: AppreciationMaitre;     // 4 critères en dur (inchangé)
  demarchesAdministratives: DemarchesAdministratives;
  conditionsPratiques: ConditionsPratiques;
  aidesDemandees: AidesDemandees;
  commentaires: CommentairesEntretien;
  signatures: SignaturesTripartite;
}
```

### Banque initiale

Pré-remplie avec les **11 questions historiques du v1.3 reformulées de manière neutre** (suppression des marqueurs de domaine « brigade », « cuisine », « CFA » → formulations génériques type « votre équipe en entreprise », « centre de formation »). Permet à la maquette de fonctionner pour toute spécialité GRETA.

### 3 types de réponse supportés

| Type | Composant UI | Stockage |
|---|---|---|
| `texte-court` | `<input type="text">` | `string` |
| `texte-long` | `<textarea>` | `string` |
| `oui-non` | 2 boutons exclusifs (composant `CaseOuiNon`) | `boolean \| null` |

### Bloc « Appréciation maître » reste en dur

Les 4 critères standardisés (Ponctualité / Compréhension des consignes / Qualité du travail / Intégration dans l'équipe) restent codés en dur dans `SectionMaitre.tsx`. Ce sont des éléments standardisés du livret CDC, pas des questions configurables.

### Page d'administration `/admin/banque-questions`

Réservée aux rôles coordo + admin (matrice `admin.banque-questions.gerer`). CRUD complet, suppression bloquée si la question est référencée par au moins un entretien (cohérence référentielle).

### Migration

Reset complet du store livret (bump v6 → v7).

---

## 5. §5.3 — Période en Entreprise (ex « Fiche de suivi par période ») — renommage UI

**Précise §5.3 du v1.3.**

### Renommage UI

- **Menu sidebar** : « Fiches de suivi » devient **« Période en Entreprise »**
- **Titre de page** : « Fiches de suivi par période » devient **« Période en Entreprise »**
- **PDF** : titre de section « Fiche de suivi — Période N » devient **« Période en Entreprise n° N »**

L'URL interne (`/livret/fiches-suivi`) et le nom technique du type (`FicheSuiviPeriode`) restent inchangés.

### Création / renommage / suppression par formateur + coordo (ajout)

Le formateur référent **et le coordo** peuvent maintenant gérer les fiches :
- Type `FicheSuiviPeriode.titre?: string` (optionnel) — affichage `Période N — <titre>` ou `Période N` seul.
- Nouvelles ressources matrice : `fiche.creer-periode`, `fiche.modifier-periode`, `fiche.supprimer-periode` (ouvertes aux 2 rôles).
- Lib `validation-fiche-periode` (16 tests TDD) : titre + dates + R11/R12/R13/R14, mode édition, `peutSupprimerFichePeriode` (refus si verrouillée ou signée). **R13 assouplie + R14 activée** (cf. §14.B) : la création de N est autorisée même si N-1 n'est pas signée, avec avertissement non bloquant sur dateDebut listant les parties manquantes.
- Composant `ModaleFichePeriode` + bouton « + Nouvelle période » + boutons modifier/supprimer par carte (confirmation 2 clics).

### Sous-fiche « Suivi de la formation au GRETA CFA »

Journal pédagogique côté centre de formation, éditable par le formateur référent uniquement. Verrou par signature R21 (figé dès que le formateur a signé sa partie). Inchangé fonctionnellement par rapport au v1.3.

---

## 6. §5.7 — Nouvelle section : Pronote WEB

**Nouvelle section, n'existe pas dans le v1.3.**

### Objectif

Permettre à chaque utilisateur·rice d'accéder en un clic au **portail Pronote de son ou ses établissement(s) GRETA** depuis le livret, sans avoir à mémoriser ou retrouver l'URL manuellement.

### Page utilisateur `/livret/pronote`

Visible pour **tous les rôles**. Affiche :
- Un bloc explicatif (qu'est-ce que Pronote, garantie de sécurité — le livret ne stocke aucun credential)
- La liste des établissements rattachés à l'utilisateur·rice avec lien `target="_blank" rel="noopener noreferrer"` vers chaque URL Pronote configurée
- Pour un établissement sans URL configurée : affichage en lecture seule avec mention explicite

### Filtrage par rôle

| Rôle | Établissements visibles |
|---|---|
| Admin | Tous (vision globale) |
| Coordo | Ceux où il/elle a au moins une formation rattachée (`Coordo.formationIds`) |
| Formateur référent | Ceux des promos qu'il/elle encadre (`Formateur.promoIds`) |
| Apprenti·e | L'établissement de sa formation |
| Maître | Les établissements des formations de ses apprenti·e·s (avec déduplication) |

Implémenté dans `lib/etablissements-accessibles.ts` (9 tests TDD).

### Pas de SSO côté maquette

Chaque utilisateur·rice s'identifie ensuite avec ses **propres credentials Pronote** côté portail. Le livret ne stocke aucun mot de passe et n'effectue aucune authentification déléguée.

### Page d'administration `/admin/etablissements`

Réservée au rôle **admin uniquement** (matrice `admin.etablissements.gerer`). CRUD complet :
- Nom de l'établissement (obligatoire, ≥ 3 caractères)
- Adresse, code postal, ville (optionnels)
- URL Pronote (optionnelle, format `https?://...`)
- Suppression bloquée si au moins une formation référence l'établissement (verrou `etablissement-verrou`, 4 tests TDD).

### Refonte de la modale Formation

L'ancien bloc « Nom du lieu / Adresse / CP / Ville » (4 champs texte libres) est remplacé par un **select déroulant unique « Lieu de formation »** listant les établissements créés par l'admin. Si aucun établissement n'a encore été créé : message guidant vers `/admin/etablissements`.

---

## 7. §6 — Matrice des droits étendue (47 ressources × 5 rôles)

**Remplace §6 du v1.3 (qui listait 33 ressources × 3 rôles).**

La matrice est statique et déterministe — un seul point de définition dans `lib/droits.ts`.

### Nouvelles ressources (au-delà du v1.3)

**Administration métier** :
- `admin.utilisateurs.creer-apprenti` : coordo + admin + **formateur** (exception métier)
- `admin.utilisateurs.creer-maitre` : coordo + admin + **formateur** (exception métier)
- `admin.utilisateurs.creer-formateur` : coordo + admin
- `admin.utilisateurs.creer-coordo` : **admin uniquement**
- `admin.utilisateurs.modifier` : coordo + admin
- `admin.utilisateurs.supprimer` : coordo + admin
- `admin.formations.creer` / `.modifier` / `.supprimer` : coordo + admin
- `admin.affectations.gerer` : coordo + admin
- `admin.referentiels.gerer` : coordo + admin
- `admin.banque-questions.gerer` : coordo + admin
- `admin.etablissements.gerer` : **admin uniquement**

**Fiches de période enrichies** :
- `fiche.modifier-periode` : formateur + coordo
- `fiche.supprimer-periode` : formateur + coordo
- `fiche.creer-periode` : étendu au coordo (était formateur seul en v1.3)

**Sélection des compétences abordées en entreprise** (CDC v1.5 §12) :
- `entretien.selection-competences-entreprise` : **formateur + maître** (co-édition tant que la sélection n'est pas validée)
- L'invalidation R10 motivée réutilise la ressource existante `fiche.deverrouiller` (formateur uniquement)

### Tests de cohérence

- `lib/droits.test.ts` (38 tests) vérifie que l'admin n'apparaît **jamais** dans la matrice pour les ressources pédagogiques (commentaires, niveaux, signatures, observations, **sélection des compétences en entreprise**).

---

## 8. §7.1 — Modèle de données enrichi

**Complète §7.1 du v1.3.**

### Nouveaux types

```typescript
// Rôles étendus
type Role = 'apprenti' | 'maitre' | 'formateur' | 'coordo' | 'admin';

interface Coordo extends Utilisateur {
  role: 'coordo';
  formationIds: string[];  // formations dont il/elle a la charge
}

interface Admin extends Utilisateur {
  role: 'admin';
}

// Établissement (lieu de formation) — remplace l'ancien Lieu inline
interface Etablissement {
  id: string;
  nom: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  urlPronote?: string;  // portail Pronote du lieu
}

// Formation — lieuId remplace lieu inline
interface Formation {
  id: string;
  intitule: string;
  annee: string;        // ex : "2025-2026"
  niveau: string;       // ex : "CAP", "BAC PRO"
  referentielId: string;
  dateDebut: string;    // ISO 8601 YYYY-MM-DD
  dateFin: string;
  lieuId: string;       // référence vers Etablissement
}

// Fiche de période — titre optionnel
interface FicheSuiviPeriode {
  // ... (champs v1.3 inchangés)
  titre?: string;       // ex : « Période 2 — Stage automne »
}

// Compétence (le flag global `evalueeEnEntreprise` a été retiré — cf. §12)
interface Competence {
  id: string;
  code: string;
  libelle: string;
  sousFamille?: string;          // hiérarchie 3 niveaux (Bloc → Sous-famille → Compétence)
}

// Sélection des compétences abordées en entreprise — par livret (cf. §12)
interface SelectionCompetencesEntreprise {
  ids: string[];                              // sous-ensemble du référentiel
  validePar?: {
    formateurId: string;
    maitreId: string;
    dateIso: string;
  };
  modifieLe: string;
  historiqueInvalidations: EntreeDeverrouillage[];
}

// Référentiel — 2 ou 3 niveaux
interface Referentiel {
  id: string;
  formation: string;
  blocs: BlocCompetences[];
  attitudes: Attitude[];
  niveauxColonnes?: 2 | 3;       // 2 par défaut, 3 si sous-famille présente
  source?: 'fixture' | 'import-csv' | 'import-xlsx' | 'edition-manuelle';
}
```

### Refonte structurante

```typescript
// OrganisationSuivi — refonte modulaire
interface OrganisationSuivi {
  evenements: EvenementOrganisationSuivi[];  // au lieu de 6 champs nommés
  modifieLe: string;
  modifiePar: string;
}

// EntretienTripartite — questions sélectionnées + réponses indexées
interface EntretienTripartite {
  // ...
  questionsApprentiSelectionnees: string[];  // ids dans l'ordre d'affichage
  questionsMaitreSelectionnees: string[];
  reponsesApprenti: Record<string, string | boolean | null>;
  reponsesMaitre: Record<string, string | boolean | null>;
  // ... reste inchangé (appréciation, démarches, etc.)
}

// Livret — nouveau sous-objet selectionCompetencesEntreprise (cf. §12)
interface Livret {
  // ... (champs v1.3 inchangés)
  selectionCompetencesEntreprise: SelectionCompetencesEntreprise;
}
```

---

## 9. §10.4 — Verrouillage des affectations (règle de gouvernance)

**Nouvelle sous-section, n'existe pas dans le v1.3.**

### Règle

Les affectations d'un·e apprenti·e (formation, maître, formateur, entreprise) sont **automatiquement verrouillées** dès qu'au moins l'une des conditions suivantes est remplie :
1. Le contrat d'apprentissage a démarré (`contratDebut <= aujourd'hui`)
2. Au moins une fiche de période existe pour l'apprenti·e
3. L'entretien tripartite a été initialisé

Justification : éviter qu'un changement d'affectation casse silencieusement l'historique pédagogique en cours.

### Bouton « Déverrouiller temporairement »

Présent sur chaque ligne verrouillée de la page `/admin/affectations`. Permet au coordo de corriger une erreur de saisie initiale (état non persisté — se réactive automatiquement à la prochaine ouverture de page). Pas d'audit log (décision pragmatique pour la maquette).

### Implémentation

- `lib/affectation-verrou.ts` (7 tests TDD)
- UI : indicateur 🔒 par ligne + tooltip explicitant la raison

---

## 10. §17.2 — Glossaire enrichi

**Complète §17.2 du v1.3.**

| Terme | Définition |
|---|---|
| **Apprenti·e** | Personne en formation par apprentissage. Détient un livret par contrat. |
| **Maître d'apprentissage** | Tuteur·rice côté entreprise. Encadre 1 à N apprenti·e·s. |
| **Formateur référent** | Pédagogue GRETA. Suit 1 à N promotions. |
| **Coordinateur·rice** (coordo) | Gestionnaire administratif GRETA. CRUD utilisateurs / formations / affectations. Lecture seule sur les contenus pédagogiques. |
| **Administrateur·rice** (admin) | Super-utilisateur (typiquement le pilote du dispositif). Hérite des droits + peut créer des coordos + signer au nom des 3 rôles métier. **Seul rôle pouvant gérer les établissements.** |
| **Établissement** | Lieu de formation (ex : « GRETA Lyon Métropole — Site Diderot »). Porte une URL Pronote optionnelle. Géré par l'admin. |
| **Formation** | Cursus identifié (ex : « CAP Cuisine 2025-2026 »). Référence un établissement (`lieuId`) et un référentiel optionnel. |
| **Référentiel** | Liste structurée de compétences (Bloc → [Sous-famille] → Compétence). Importable en CSV ou XLSX. |
| **Promo** | Synonyme de formation pour une année académique donnée. |
| **Banque de questions** | Catalogue centralisé des questions posables à l'apprenti·e et au maître lors de l'entretien tripartite. |
| **Période en entreprise** | Anciennement « Fiche de suivi par période ». Cahier de bord d'une période d'alternance (compétences travaillées en entreprise + cours suivis au CFA). |
| **Pronote WEB** | Portail externe Pronote de l'établissement. Chaque utilisateur·rice s'y identifie avec ses propres credentials. |

---

## 11. Nouvelle annexe : workflow d'import référentiels

**Nouvelle annexe, complète §7.2 du v1.3.**

### Formats supportés

- **CSV** : encodage UTF-8 ou Windows-1252 (auto-détecté), séparateur `;` ou `,` (auto-détecté), 1ʳᵉ ligne ignorée (en-têtes)
- **XLSX** : parser maison via `fflate` (~12 KB pour la décompression ZIP), pas de dépendance SheetJS — détection automatique par signature ZIP

### Structure attendue

- **2 colonnes** : `Bloc;Compétence` (référentiel plat)
- **3 colonnes** : `Bloc;Sous-famille;Compétence` (référentiel à 3 niveaux, ex CECRL : A1.1;Compréhension orale;Reconnaître des mots…)

### Workflow

1. Le coordo (ou admin) ouvre `/admin/referentiels` → bouton « Importer un référentiel »
2. **Sélection de formation optionnelle** :
   - Si une formation est choisie → libellé auto-généré `Referentiel_<intitulé>_<YYYY-MM-DD>` + `formation.referentielId` mis à jour automatiquement
   - Sinon → champ « Nom du référentiel » libre (≥ 3 caractères) ; le référentiel est créé orphelin et pourra être rattaché plus tard depuis la page Formations
3. Choix du fichier (CSV ou XLSX) **OU** copier-coller du contenu CSV dans un textarea (test rapide)
4. Aperçu : stats (nb blocs, nb compétences, encodage détecté, format détecté)
5. Validation : import effectif

### Relation N:1

Un référentiel peut être référencé par **plusieurs formations** (`Formation.referentielId` pointe vers un référentiel partagé). La carte du référentiel dans `/admin/referentiels` affiche la liste des formations qui l'utilisent.

### Verrou de suppression

Un référentiel ne peut être supprimé tant qu'au moins une formation y est rattachée (`referentiel-verrou`, 4 tests TDD).

### Tests d'intégration

4 fichiers exemples réels du pilote (`exemple-{1,2}.{csv,xlsx}`) testés côté unitaire ET E2E (chargement via `setInputFiles`).

---

## 12. Nouvelle annexe : sélection par stagiaire des compétences abordées en entreprise

**Nouvelle annexe, complète §5.3 et §5.4 du v1.3.** Refonte complète (mai 2026, suite à l'arbitrage §14.A) — remplace l'ancien flag global `Competence.evalueeEnEntreprise` qui figurait dans la version initiale de cet addendum.

### Constat à l'origine de la refonte

Le flag initial vivait au niveau du référentiel : une compétence était soit « toujours abordée en entreprise », soit « jamais abordée ». Or, le pilote a expliqué que dans la réalité :

1. **Le choix est par stagiaire**, pas par référentiel — le même CAP Cuisine peut donner lieu à des sélections différentes selon l'entreprise d'accueil (restaurant traditionnel vs. brasserie, par exemple).
2. **C'est une décision conjointe** formateur référent + maître d'apprentissage, qui se prend au moment où ils se rencontrent — c'est-à-dire à l'**entretien tripartite**.

### Workflow retenu (W1 — intégration entretien)

| Étape | Acteur | Action |
|---|---|---|
| 1. Création livret | (auto) | Sélection vierge `{ ids: [], validePar: undefined }` |
| 2. Avant entretien | — | Bandeau « sélection non validée » sur fiches + grille finale masquée |
| 3. Init entretien | Formateur | Section « Compétences abordées en entreprise » apparaît, cases vierges éditables |
| 4. Co-édition | Formateur + Maître | Cochent/décochent ensemble ; l'apprenti·e voit en lecture seule |
| 5. 3ᵉ signature | (auto) | `validePar = { formateurId, maitreId, dateIso }` ; sélection figée |
| 6. Cascade UI | (auto) | Sélecteur d'ajout `TableauTriColonnes` activé ; `GrilleCompetences` s'affiche en grisant les non-sélectionnées |
| 7. Invalidation R10 | Formateur (seul, motif ≥ 10 car.) | `validePar` retirée, trace empilée dans `historiqueInvalidations`, sélection redevient éditable |

### Modèle de données

```typescript
interface SelectionCompetencesEntreprise {
  ids: string[];                              // sous-ensemble du référentiel
  validePar?: {                               // undefined tant que non validée
    formateurId: string;
    maitreId: string;
    dateIso: string;
  };
  modifieLe: string;
  historiqueInvalidations: EntreeDeverrouillage[];
}

interface Livret {
  // ... (existant)
  selectionCompetencesEntreprise: SelectionCompetencesEntreprise;
}
```

Le flag `Competence.evalueeEnEntreprise` est **retiré** (bump `livret-referentiels` v1 → v2).

### Cascade fonctionnelle

| Composant | Sélection non validée | Sélection validée |
|---|---|---|
| `EntretienTripartite` | Section visible, cases éditables (formateur + maître), badge « Sélection en cours — N/M » | Cases désactivées, badge « Validée le … par … », bouton « Modifier (motif requis) » pour le formateur |
| `TableauTriColonnes` | Bandeau d'avertissement, sélecteur d'ajout masqué, lignes existantes affichées | Sélecteur d'ajout filtré sur la sélection ; lignes pour compétences ensuite décochées restent visibles (cohérence historique) |
| `GrilleCompetences` (évaluation finale) | Page entière remplacée par un message dédié | Cellule « Acquis en entreprise » grisée + « — » pour compétences non sélectionnées ; **option a1** : si saisie historique existe (compétence cochée puis décochée via R10), la valeur reste visible en lecture seule grisée |

### Matrice de droits

Une seule nouvelle ressource : `entretien.selection-competences-entreprise` → `['formateur', 'maitre']`. L'invalidation R10 réutilise la ressource existante `fiche.deverrouiller` (formateur uniquement).

### Helpers (lib pure)

`src/lib/selection-competences-entreprise.ts` — 24 tests TDD :

```typescript
creerSelectionVierge(maintenant?: Date)
estValidee(sel)
estSelectionnee(sel, competenceId)
peutEtreEditee(sel)                                    // === !estValidee
toggleCompetence(sel, competenceId, maintenant?)       // immuable
marquerValidee(sel, formateurId, maitreId, maintenant?)
invaliderAvecMotif(sel, { id, auteurId, auteurNom, auteurRole, motif, maintenant? })
nettoyerApresMajReferentiel(sel, referentiel, maintenant?)  // retire les ids orphelins
competencesNonSelectionneesAvecSaisie(sel, lignesFinales)   // pour option a1
```

### Auto-marquage à la 3ᵉ signature

L'action `signerEntretien` du `useLivretStore` détecte la 3ᵉ signature et appelle automatiquement `marquerValidee` en récupérant les ids du formateur référent et du maître d'apprentissage depuis l'apprenti·e du livret (lecture cross-store `useUtilisateursStore.getState().apprentis`). Si la sélection est déjà validée, ou si l'apprenti·e n'est pas trouvé, le no-op s'applique silencieusement.

### Cas non couverts (reportés à l'étape 2)

- **Re-validation conjointe après invalidation R10** : la maquette autorise actuellement le formateur seul à figer une sélection revue. Une vraie ré-validation à 2 (formateur + maître) nécessitera un mécanisme dédié quand l'authentification réelle sera en place.
- **Notifications** : pas d'alerte mail au maître quand le formateur invalide la sélection.

---

## 13. Polish UX (trio header, mobile, cohérence destructive)

### 13.1 Trio contextuel dans le header

Sous la ligne « Connecté en tant que … », une seconde ligne affiche les **3 personnes du trio pédagogique** rattachées à l'apprenti·e actif·ve :
- 🎓 Apprenti·e (couleur `role-apprenti`)
- ⛑ Maître d'apprentissage (couleur `role-maitre`)
- ⚙ Formateur référent (couleur `role-formateur`)

Mise à jour automatique au switch d'apprenti·e. Visible desktop et mobile (bandeau dédié sous le header sur < lg).

### 13.2 Responsive mobile + audit Playwright

- `MobileMenu` hamburger + drawer accessible (`role=dialog`, focus piégé, Esc)
- `RoleSwitcher` compact (icônes seules sur < md)
- Touch targets ≥ 44 px (WCAG 2.5.5)
- Audit Playwright dédié sur émulation Pixel 5 (393×851) : 12 tests

**Corrections récentes (mai 2026)** suite à audit screenshots fullPage :
- Page Gestion utilisateurs : colonne Email masquée sur < md (repliée sous le nom)
- Page Gestion affectations (6 colonnes) : indicateur visuel de scroll horizontal + `min-w-[42rem]`

### 13.3 Cohérence des actions destructrices

10 actions destructrices/engageantes utilisent toutes une **confirmation explicite à 2 clics** (pas de `window.confirm`) :
1. Signature R20
2. Suppression de compétence
3. Suppression de ligne GRETA
4. Clôture R22
5. Réinit démo
6. Suppression de compte utilisateur
7. Déverrouillage temporaire d'affectation
8. Suppression de fiche de période
9. Suppression de référentiel / formation / établissement
10. Suppression d'événement organisation / question banque

**Seule exception** : R10 (déverrouillage de fiche signée) utilise une modale stricte avec motif obligatoire ≥ 10 caractères + traçabilité historique.

---

## 14. Arbitrages métier ouverts

Points en attente de décision pilote (issus du §8 du PROJECT-STATUS.md) :

### 14.A — ~~Évaluation finale et flag `evalueeEnEntreprise`~~ ✅ tranché et livré (mai 2026)

Refonte complète — cf. §12 « Sélection par stagiaire des compétences abordées en entreprise ». La question initiale (« doit-on griser la colonne entreprise pour les compétences non abordées ? ») a évolué en un chantier de fond : le choix passe **au niveau du livret** (par stagiaire) avec validation conjointe formateur+maître à la 3ᵉ signature de l'entretien.

### 14.B — ~~R13 : choix de gouvernance~~ ✅ tranché et livré (18 mai 2026)

R13 a été **assouplie** : seule l'absence d'entretien tripartite reste bloquante. La création de la période N est désormais autorisée même si N-1 n'est pas encore signée, accompagnée d'un **avertissement R14 non bloquant** listant les parties qui n'ont pas encore signé (apprenti·e / maître d'apprentissage / formateur·rice référent·e).

Motivation : sur le terrain, les périodes d'alternance sont calendaires (planning annuel CFA), pas conditionnées par la signature. Bloquer la création de P2 jusqu'à signature de P1 par les 3 parties peut paralyser l'apprenti·e pendant le retard d'un signataire (cas typique : maître d'apprentissage en vacances pendant la transition CFA → entreprise).

L'avertissement apparaît en bordure ambre sous le champ « Date de début » de la modale `ModaleFichePeriode`, avec le message :

> *« La période N n'a pas encore été signée par [parties manquantes énumérées]. Vous pouvez créer la nouvelle période, mais pensez à finaliser la précédente (R14). »*

Le mécanisme s'aligne ainsi avec l'**intention originelle du v1.3** (qui spécifiait déjà R14 comme avertissement non bloquant, en contradiction avec R13 strict — la maquette livrée avait initialement choisi le côté strict, ce reset rééquilibre).

Implémentation : `lib/regles-periode.ts` peuple `avertissements: string[]` quand N-1 n'est pas en `signee`/`verrouillee` ; `lib/validation-fiche-periode.ts` propage dans `avertissements.dateDebut` ; `ModaleFichePeriode` affiche le bandeau ambre via le mécanisme `Champ` déjà en place. 7 tests TDD ajoutés (4 sur `regles-periode`, 3 sur `validation-fiche-periode`).

### 14.C — Signature manuscrite tactile (étape 2 recommandée)

Capture du tracé au doigt sur `<canvas>` HTML5 (compatible tactile + souris). Coût estimé : 1,5 à 2 jours. **Reporté à l'étape 2** (auth réelle) où la combinaison signature manuscrite + session authentifiée + horodatage serveur acquiert un poids juridique (art. 1366 du Code civil).

### 14.D — Sécurité VPS (urgent, côté pilote)

> Le mot de passe SSH root du VPS a été partagé en clair et doit être changé.

Actions à mener par le pilote :
- [ ] `passwd` sur le VPS pour changer le mot de passe root
- [ ] Générer une clé SSH dédiée au déploiement (`ssh-keygen -t ed25519`)
- [ ] Pousser la clé publique sur le VPS (`ssh-copy-id`)
- [ ] Désactiver l'auth par mot de passe (`PasswordAuthentication no`, `PermitRootLogin prohibit-password`)
- [ ] Vérifier le partage du mot de passe Basic Auth via canal sécurisé

---

## 15. Décisions architecturales notables (depuis v1.3)

- **8 stores Zustand persistés** (au lieu de 4 en v1.3) : livret-donnees (v8), livret-role-actif, livret-apprenti-actif, livret-utilisateurs (v1), livret-formations (v2), livret-referentiels (v2), livret-banque-questions (v1), livret-etablissements (v1).
- **Cohérence référentielle protectrice** : suppressions bloquées en cascade (apprenti·e si livret actif, maître/formateur si rattachements, formation si apprenti·e·s, référentiel si formations rattachées, fiche-période si verrouillée ou signée, événement organisation si verrouillé, question banque si utilisée par un entretien, établissement si formation rattachée).
- **Parser XLSX maison** via `fflate` (~12 KB pour la décompression ZIP) — pas de dépendance SheetJS (qui pèse 600+ KB).
- **Tests TDD ciblés** sur la logique métier pure (`lib/` — 26 fichiers de tests pour 28 modules) ; les composants UI sont testés via Playwright E2E (18 specs).
- **Migration localStorage par bump de version** : reset complet à chaque bump (pas de migration logicielle, données fictives — cohérent avec la stratégie de l'étape 1).
- **Sélecteurs E2E stables via `data-testid`** sur les modales admin (corrige une race-condition observée avec `getByLabel(/regex/)` sous suite full Playwright).
- **Couplage atomique signature ↔ validation** : `signerEntretien` détecte la 3ᵉ signature de l'entretien tripartite et applique en une seule mutation l'auto-marquage de la sélection des compétences abordées en entreprise (lecture cross-store `useUtilisateursStore` pour résoudre les ids formateur/maître depuis l'apprenti·e du livret).

---

## 16. Synthèse des changements de modèle (migrations localStorage)

| Store | v1.3 | v1.5 | Migration |
|---|---|---|---|
| `livret-donnees` | v3 | **v8** | Reset complet à chaque bump (v3→v4 : OrganisationSuivi avec date/commentaire, v4→v5 : 6 apprenti·e·s scénarisés, v5→v6 : OrganisationSuivi modulaire, v6→v7 : entretien banque questions, v7→v8 : `selectionCompetencesEntreprise` par livret + auto-marquage à la 3ᵉ signature entretien) |
| `livret-formations` | v1 (Formation.lieu inline) | **v2** | Reset (Formation.lieuId vers useEtablissementsStore) |
| `livret-utilisateurs` | non existant | **v1** | Création |
| `livret-referentiels` | non existant | **v2** | v1→v2 : retrait du flag `Competence.evalueeEnEntreprise` (cf. §12 — passage de la sélection au niveau livret) |
| `livret-banque-questions` | non existant | **v1** | Création |
| `livret-etablissements` | non existant | **v1** | Création (extraction de l'ancien `Lieu` inline) |

---

## 17. Journal des versions

| Version | Date | Auteur | Changements |
|---|---|---|---|
| 1.0 à 1.3 | avril 2026 | Guillaume + Claude | Cf. §31 du document `cahier-des-charges-livret-apprentissage-v1.3.md`. |
| **1.5** (addendum) | **mai 2026** | Guillaume + Claude | **Extensions métier post-livraison v1.3** : ajout rôles Coordo + Admin ; refonte modulaire de l'organisation du suivi (renommée « Fiches de suivi ») ; refonte de l'entretien tripartite avec banque de questions configurable ; renommage UI « Fiches de suivi » → « Période en Entreprise » ; nouvelle section §5.7 Pronote WEB avec établissements gérés par l'admin ; matrice droits étendue à **47 ressources × 5 rôles** ; règle §10.4 verrouillage des affectations ; workflow d'import référentiels CSV + XLSX (relation N:1 + nom libre) ; **sélection par stagiaire des compétences abordées en entreprise** (décision conjointe formateur+maître, validation auto à la 3ᵉ signature entretien, R10 motivé — remplace l'ancien flag global) ; **R13 assouplie + R14 activée** (18 mai 2026 — création de période N autorisée si N-1 non signée, avertissement non bloquant listant les parties manquantes) ; polish UX (trio header, audit mobile, cohérence destructive). 8 stores Zustand persistés (au lieu de 4). **342 tests unitaires, 131 tests E2E**. |

> **Note** : il n'y a pas de v1.4 publiée — la numérotation passe directement de v1.3 à v1.5 pour refléter l'ampleur des évolutions cumulées.

---

*Fin de l'addendum v1.5. Pour la spécification initiale, se référer au document `cahier-des-charges-livret-apprentissage-v1.3.md`.*
