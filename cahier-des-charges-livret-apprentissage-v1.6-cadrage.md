# Cahier des charges v1.6 — Cadrage préalable

**Projet** : Livret d'apprentissage numérique GRETA Lyon Métropole
**Version** : 1.6 — cadrage (questions ouvertes à arbitrer avant développement)
**Date** : mai 2026
**Pilote métier** : Guillaume FERRERI
**Origine** : retours pilote post-livraison CDC v1.5 + lecture du rapport MCPFA du 7 mai 2026

---

## 0. Statut et portée de ce document

Ce document **n'est pas** un cahier des charges figé. C'est un **brouillon de cadrage** qui formalise les 5 chantiers à venir et liste les questions ouvertes auxquelles il faut répondre **avant** d'écrire la moindre ligne de code.

Quand toutes les questions ouvertes sont arbitrées, ce document devient le `cahier-des-charges-livret-apprentissage-v1.6.md` officiel — sur le modèle du v1.5.

L'**ampleur cumulée** de ces 5 chantiers est comparable à la CDC v1.5 entière. Il est recommandé de les attaquer dans une **nouvelle conversation Claude Code** après lecture commune de ce document.

---

## 1. Vue d'ensemble des 5 chantiers

| # | Chantier | Type | Risque |
|---|---|---|---|
| 1 | Périodes de stage par **formation** (héritées par tous les apprenti·e·s) | Refonte modèle + UI | 🟠 Moyen — touche `ModaleFichePeriode` et `creerLivretVierge` mais épargne CDC v1.5 §12 |
| 2 | **2 entretiens tripartites** déclenchés par événement | Refonte workflow R6 | 🔴 Élevé — touche entretien, organisation du suivi, R6→R9, sidebar |
| 3 | Suivi GRETA CFA en **2 champs texte libre** | Refonte composant | 🟢 Faible — composant isolé, migration de données simple |
| 4 | Modèle **Maître** : `entreprise` + `fonction` (texte libre) | Refonte modèle | 🟠 Moyen — impacte type, modale, fixtures, peut faire disparaître `Entreprise` |
| 5 | **Import Excel** des utilisateurs (apprentis, maîtres, formateurs) | Nouveau module | 🟠 Moyen — modèle Excel à définir, mais parser XLSX déjà en place |

---

## 2. Chantier 1 — Périodes de stage par formation

### Contexte

Aujourd'hui : le formateur référent crée / renomme / supprime les fiches de période **au cas par cas** par apprenti·e via `ModaleFichePeriode` (modale livrée en mai 2026).

Demain : le **nombre** et les **dates** des périodes sont définis **au niveau Formation** par l'admin ou le coordo, et **tous les apprenti·e·s** rattaché·e·s à cette formation héritent automatiquement de ces périodes.

> **Conservé** : la sélection des compétences abordées en entreprise à l'intérieur de chaque période reste **par stagiaire** (CDC v1.5 §12 inchangé).

### Modèle proposé

```ts
interface PeriodeStage {
  id: string;
  numeroPeriode: number;
  titre?: string;           // ex « Stage automne »
  dateDebut: string;        // ISO 8601
  dateFin: string;
}

interface Formation {
  // ... champs actuels
  periodesStage: PeriodeStage[];
}
```

À la création d'un livret, `creerLivretVierge` initialise `fichesSuivi` à partir de `formation.periodesStage`.

### Questions ouvertes

- **Q1.A** — Qui édite les périodes au niveau formation ? Admin seul ? Admin + coordo ? Formateur référent aussi ?
- **Q1.B** — Quand on modifie une période d'une formation (changer une date, en ajouter une, en supprimer une), quel impact sur les livrets déjà créés ?
  - Option a) Aucun impact — chaque livret garde ses propres dates (snapshot à la création)
  - Option b) Propagation automatique — toutes les fiches de période non encore signées sont mises à jour
  - Option c) Avertissement à l'utilisateur·rice avec choix de propager ou non
- **Q1.C** — Peut-on encore créer une fiche de période **ad hoc** pour un apprenti·e particulier (en plus de celles héritées) ? Cas d'usage : un parcours individualisé qui demande une période supplémentaire.
- **Q1.D** — Comment marquer une période comme « passée » / « en cours » / « à venir » dans la formation ? Champ `etat` au niveau formation, ou calculé à partir des dates ?
- **Q1.E** — Suppression d'une période côté formation : si des fiches saisies existent côté apprenti·e·s, on bloque ? On force la suppression avec confirmation ?

### Impact technique anticipé

- Nouveau type `PeriodeStage` dans `types/index.ts`
- Bump `useFormationsStore` v2 → v3 (reset des fixtures)
- Refonte `ModaleFormation` (ajout d'un bloc « Périodes de stage » avec liste éditable)
- Dépouillement de `ModaleFichePeriode` (création manuelle disparaît, édition titre/dates reste éventuellement pour les fiches ad hoc — selon Q1.C)
- Refonte `creerLivretVierge` dans `lib/creation-livret.ts`
- Bump `useLivretStore` v8 → v9
- Adaptation de la matrice des droits : ressources `fiche.creer-periode` / `fiche.modifier-periode` / `fiche.supprimer-periode` → à migrer vers `formation.gerer-periodes` (réservé à admin/coordo)
- Adaptation E2E `fiches-periodes.spec.ts` (très probable)

---

## 3. Chantier 2 — 2 entretiens tripartites déclenchés par événement

### Contexte

Aujourd'hui : un seul entretien tripartite par livret (R6), initialisé via un bouton « Initialiser l'entretien » dans le menu Entretien tripartite.

Demain : **2 entretiens** par livret au maximum, créés **uniquement** à partir d'un événement « Entretien Tripartite 1 » ou « Entretien Tripartite 2 » dans le module Fiches de suivi. Sans cet événement, pas de menu correspondant dans la sidebar.

### Modèle proposé

```ts
type MotifOrganisationSuivi =
  | /* motifs existants */
  | 'entretien-tripartite-1'
  | 'entretien-tripartite-2'
  | 'autre';

interface Livret {
  // ... champs actuels
  entretienTripartite1: EntretienTripartite | null;
  entretienTripartite2: EntretienTripartite | null;
}
```

Quand un événement avec motif `entretien-tripartite-1` est créé dans `OrganisationSuivi.evenements`, le menu « Entretien Tripartite 1 » apparaît dans la sidebar et `entretienTripartite1` peut être initialisé. Idem pour le 2.

### Questions ouvertes

- **Q2.A** — Les 2 entretiens partagent-ils la **même banque de questions** (configurée dans `/admin/banque-questions`) ?
  - Option a) Oui, même catalogue, le formateur sélectionne les questions à poser pour chacun indépendamment
  - Option b) Banque séparée — 2 catalogues distincts gérés en admin
- **Q2.B** — L'entretien 2 peut-il **hériter** des saisies de l'entretien 1 (réponses apprenti, appréciation maître, démarches administratives) ?
  - Option a) Non, repart de zéro
  - Option b) Oui, pré-rempli à partir du 1 modifiable à la marge
  - Option c) Hérite des champs administratifs (formateur) seulement, réponses apprenti/maître repartent de zéro
- **Q2.C** — La **sélection des compétences abordées en entreprise** (CDC v1.5 §12) — où se fait-elle désormais ?
  - Option a) Reste figée à la 3ᵉ signature de l'entretien 1 (statu quo)
  - Option b) Se figerait à la 3ᵉ signature de l'entretien 2 (déplacement)
  - Option c) Peut être revue/figée à chaque entretien (1 puis 2 — comme un cycle)
- **Q2.D** — Un événement « Entretien Tripartite 1 » créé peut-il être **supprimé** ? Si oui, que devient l'entretien rattaché (saisies perdues ?).
- **Q2.E** — Doit-on imposer un ordre chronologique strict entre les 2 entretiens (E2 obligatoirement après E1) ?
- **Q2.F** — Que devient la **règle R7** (alerte 60 j sans entretien) ? S'applique-t-elle au seul entretien 1 ? Aux deux ?
- **Q2.G** — Renoncer au 2ᵉ entretien : autorisé ? Si oui, comment le marquer (juste « pas d'événement créé » ou bouton dédié) ?

### Impact technique anticipé

- Refonte type `Livret` (1 → 2 entretiens)
- Bump `useLivretStore` v8 → v9 ou v10
- 2 nouveaux motifs dans `MotifOrganisationSuivi` + nouvelles règles d'unicité par livret
- Refonte page `EntretienTripartite.tsx` (probablement 2 onglets ou 2 routes distinctes)
- Refonte sidebar `Sidebar.tsx` (entrées conditionnelles selon les événements)
- Refonte R6 dans `regles-entretien.ts`
- Refonte de la lib `selection-competences-entreprise.ts` selon Q2.C
- Fixtures démo réécrites (au moins certains apprenti·e·s doivent avoir 2 entretiens)
- E2E majeurs à adapter : `entretien-selection-competences.spec.ts`, etc.

---

## 4. Chantier 3 — Suivi GRETA CFA en champs texte libre

### Contexte

Aujourd'hui : `FicheSuiviPeriode.suiviGretaCfa: LigneSuiviGreta[]` — tableau structuré avec colonnes nomCours / nomFormateur / contenu / évaluations.

Demain : 2 zones texte libre — une saisie apprenti, une saisie formateur référent.

### Modèle proposé

```ts
interface SuiviGretaCfaTexte {
  apprenti: string;     // saisie libre par l'apprenti·e (vécu, retours)
  formateur: string;    // saisie libre par le formateur (contenus, observations)
}

interface FicheSuiviPeriode {
  // ... champs actuels
  suiviGretaCfa: SuiviGretaCfaTexte;
}
```

### Questions ouvertes

- **Q3.A** — Longueur maximale des champs texte (UI) ? Pas de limite stricte, juste un nombre indicatif ?
- **Q3.B** — Format autorisé : texte brut, ou markdown léger (sauts de ligne, listes) ?
- **Q3.C** — Quel impact sur la **règle de signature formateur** ? Aujourd'hui elle exige `suiviGretaCfa.length > 0` (≥ 1 ligne). Demain elle devient probablement `formateur.trim().length > 0` (zone non vide).
- **Q3.D** — Le champ apprenti est-il **obligatoire** pour signer la fiche côté apprenti·e ? (Aujourd'hui la signature apprenti exige ≥ 1 retour dans suiviEntreprise + observation apprenti non vide.)
- **Q3.E** — Migration des données : que fait-on des saisies structurées déjà en localStorage ? Reset (cohérent avec stratégie projet) ?

### Impact technique anticipé

- Refonte type `LigneSuiviGreta` → suppression, remplacé par `SuiviGretaCfaTexte`
- Refonte composant [`SuiviGretaCfa.tsx`](src/components/livret/SuiviGretaCfa.tsx) : 2 textareas avec droits par rôle
- Adaptation `validation-signature.ts` (règle formateur)
- Bump `useLivretStore` v8 → v9
- Adaptation fixtures (livret-demo)
- Adaptation export PDF (section « Suivi de la formation au GRETA CFA »)
- Tests TDD : `validation-signature.test.ts`

---

## 5. Chantier 4 — Modèle Maître : Entreprise + Fonction (texte libre)

### Contexte

Aujourd'hui : `Maitre.entrepriseId: string` (référence vers le type `Entreprise`). La modale `ModaleUtilisateurStaff` propose un select déroulant pour choisir l'entreprise.

Demain : 2 champs **texte libre** dans la modale Maître :
- **Entreprise** (nom textuel)
- **Fonction** (intitulé du poste du maître)

### Modèle proposé

```ts
interface Maitre extends Utilisateur {
  role: 'maitre';
  entreprise: string;       // nouveau, texte libre
  fonction: string;         // nouveau, texte libre
  apprentiIds: string[];
  // entrepriseId disparaît
}
```

### Questions ouvertes

- **Q4.A** — Que devient le type `Entreprise` ? Suppression totale, ou conservation pour usage futur ?
- **Q4.B** — L'`apprenti.entrepriseId` (référence à l'entreprise du contrat d'apprentissage) — devient-il aussi un texte libre `entreprise`, ou disparaît-il complètement (puisque le maître porte déjà le nom de l'entreprise) ?
- **Q4.C** — Format attendu pour « Fonction » : libre ou liste suggérée (« Tuteur », « Maître d'apprentissage », « Gérant·e », etc.) ?
- **Q4.D** — Migration : que fait-on des `Maitre.entrepriseId` existants en localStorage ? Reset standard ?

### Impact technique anticipé

- Refonte type `Maitre` (et potentiellement `Apprenti` selon Q4.B)
- Suppression possible du type `Entreprise` et de la lib associée
- Refonte modale `ModaleUtilisateurStaff.tsx`
- Bump `useUtilisateursStore` v1 → v2 (reset)
- Adaptation fixtures (livret-demo, utilisateurs)
- Adaptation export PDF (page de garde, section apprenti)
- Adaptation E2E (`admin-utilisateurs-staff.spec.ts`)

---

## 6. Chantier 5 — Import Excel des utilisateurs

### Contexte

Aujourd'hui : création utilisateur à la main via modales admin (`ModaleApprenti`, `ModaleUtilisateurStaff`).

Demain : module d'import en masse depuis un fichier Excel pour créer apprenti·e·s, maîtres et formateurs en une fois.

### Modèle Excel — à définir avec le pilote

Trois feuilles distinctes (probablement) :
- **Apprentis** : nom, prénom, email, téléphone, date de naissance, formation, entreprise (texte), maître d'apprentissage (référence ou texte ?), formateur référent (référence), dates contrat
- **Maîtres** : nom, prénom, email, téléphone, entreprise (texte), fonction (texte)
- **Formateurs** : nom, prénom, email, téléphone

### Questions ouvertes

- **Q5.A** — **Format du modèle Excel** : 3 feuilles séparées, ou 1 feuille avec colonne `role` ?
- **Q5.B** — Gestion des références croisées (apprenti → maître) : on demande l'email du maître pour faire le lien, ou une autre clé ?
- **Q5.C** — Workflow d'import :
  - Option a) Import en 2 étapes : prévisualisation des données → validation → création
  - Option b) Import direct avec rapport d'erreurs
- **Q5.D** — Doublons détectés (même email déjà existant) : skip, écraser, ou demander à l'utilisateur ?
- **Q5.E** — Erreurs partielles (3 lignes OK, 1 ligne KO) : on importe les 3 bonnes et on signale la mauvaise ? Tout ou rien ?
- **Q5.F** — Ressource matricée : qui a le droit d'importer ? Admin seul ? Coordo aussi ?
- **Q5.G** — Doit-on fournir un fichier modèle Excel téléchargeable à l'utilisateur ? Avec quelles colonnes, dans quel ordre ?

### Impact technique anticipé

- Réutilisation de `lib/parser-xlsx.ts` (déjà en place pour les référentiels)
- Nouvelle lib `lib/import-utilisateurs.ts` (validation, normalisation, détection des doublons)
- Nouvelle modale `ModaleImportUtilisateurs.tsx` (probablement multi-étapes)
- Nouvelle ressource matricée `admin.utilisateurs.import-excel`
- Tests TDD : parsing, validation, gestion des doublons
- Fichier exemple Excel à créer (dans `src/lib/__fixtures__/` ?)
- E2E : nouveau spec `admin-import-utilisateurs.spec.ts`

---

## 7. Ordre de bataille recommandé

Si tous les chantiers sont validés, voici l'ordre suggéré pour minimiser les conflits et débloquer rapidement les bénéfices terrain :

1. **Chantier 4** (Maître Entreprise/Fonction) — petit, isolé, débloque immédiatement la modale staff
2. **Chantier 3** (Suivi GRETA CFA texte) — petit, isolé, débloque la saisie côté apprenti·e
3. **Chantier 1** (Périodes par formation) — moyen, prépare le terrain pour le chantier 2
4. **Chantier 2** (2 entretiens via événements) — gros, à faire **après** le 1 pour éviter les conflits sur l'organisation du suivi
5. **Chantier 5** (Import Excel) — gros mais isolé, peut être démarré en parallèle des autres

---

## 8. Décision de gouvernance

> ⚠️ **Ces 5 chantiers nécessitent une session Claude Code dédiée**, démarrant par la lecture de ce document de cadrage + du `PROJECT-STATUS.md` à jour.

**Prochaine étape pilote** :
1. Arbitrer les **questions Q1.A à Q5.G** (idéalement par écrit, en éditant ce document)
2. Valider l'**ordre de bataille** (§7)
3. Définir le **modèle Excel** pour le chantier 5 (§6, Q5.G)
4. Ouvrir une nouvelle conversation Claude Code avec en entrée : « Lis `PROJECT-STATUS.md` et `cahier-des-charges-livret-apprentissage-v1.6-cadrage.md`. On démarre par le chantier X. »

Une fois tous les chantiers livrés, ce document de cadrage sera **archivé** et remplacé par un addendum CDC v1.6 officiel (sur le modèle du v1.5).

---

*Document généré le 26 mai 2026 — clôture de la session « post-MCPFA » (cf. PROJECT-STATUS §13).*
