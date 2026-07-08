# Chantier — Refonte des référentiels et des compétences

**Créé le** : 2026-07-06, à l'issue de la réunion direction (très positive)
**Statut** : modifications #1 à #3 livrées le 2026-07-06 ; **#4 (évaluation par
activités) implémentée le 2026-07-07** — les 9 questions de cadrage ont été tranchées
par le pilote en début de session #4 (cf. arbitrages en §0)
**Objet** : une « énorme phase de modification » est annoncée sur les référentiels et les
compétences. Ce document est la **carte complète du sous-système** telle qu'elle existe
aujourd'hui — à lire avant toute modification, pour ne pas ré-explorer le code et ne rien
casser des invariants.

---

## 0. Modifications livrées et arbitrages consignés

### Modification #1 — entretien tripartite unique et obligatoire (2026-07-06)

Décision pilote : **il n'y a plus qu'un seul entretien tripartite obligatoire** ; les
suivis ultérieurs se font via les **fiches de suivi existantes** (inchangées). Toutes les
mentions des entretiens 2 à 4 sont supprimées.

Arbitrages validés par le pilote en séance :

1. **Banque de questions supprimée entièrement** (page admin, store, lib, droits,
   `Formation.questionsRetirees`) — elle ne servait que les E2-E4, l'entretien unique
   repose sur la trame officielle GRETA (`src/lib/trame-entretien.ts`). L'historique git
   permet de la restaurer si un usage futur apparaît.
2. **Modalité présentiel/distanciel supprimée** — elle ne distinguait E1 (présentiel
   imposé) des E2-E4 (au choix). L'entretien unique se tient en présentiel (règle
   inchangée), le champ et le sélecteur disparaissent.

Décisions d'implémentation (sans consultation, dérivées de la demande) :
`Livret.entretiens` (Record 1-4) aplati en `Livret.entretien` ; route `/livret/entretien`
sans `:numero` ; motif unique `entretien-tripartite` ; libellés sans numérotation ;
suppression de `Formation.nombreEntretiens` et du séquencement E1→E4 ; renommage
`trame-entretien-1` → `trame-entretien` (ids de questions `e1-*` conservés stables) ;
fixture Yanis dotée d'un événement entretien planifié non initialisé (préserve le cas
« à initialiser » du centre d'alertes). Bumps `livret-donnees` v23 + `livret-formations`
v8. Détail complet dans PROJECT-STATUS.md §4 (vague du 6 juillet 2026).

### Modification #2 — limite de 40 lignes évaluables par référentiel (2026-07-06)

Décision pilote : **l'import d'un référentiel est limité à 40 lignes évaluables**
(au-delà, la saisie devient trop longue pour le tuteur en période entreprise). En cas de
dépassement, le coordo/admin choisit entre **agréger au niveau hiérarchique supérieur**
ou **cocher/décocher** jusqu'à la limite. Le seuil est **modifiable par l'admin seul**.

Arbitrages validés par le pilote en séance :

1. **Les 40 = compétences évaluables (feuilles)** — les blocs / sous-familles
   (regroupements d'affichage) ne comptent pas.
2. **Agrégation proposée uniquement en 3 niveaux** (les sous-familles deviennent les
   lignes évaluables, libellés fins conservés en description). En 2 niveaux, évaluer
   « au bloc » serait trop grossier → cochage manuel seul.
3. **Exclues conservées, non évaluables** (`Competence.exclue`) — trace du fichier
   officiel, réactivables depuis la page Référentiels tant que le seuil est respecté.
4. **Garde-fou à l'import uniquement** — un référentiel enregistré est forcément
   conforme puisqu'il est passé par l'import.

Implémentation : lib pure `limite-referentiel` (24 tests TDD), store
`useParametresStore` (`livret-parametres` v1, seuil défaut 40), ressource
`admin.parametres.gerer` (admin seul), résolution du dépassement dans
`ModaleImportReferentiel`, gestion post-import dans `ModaleCompetencesEvaluables`
(cascade de réalignement des sélections non validées), filtrage `referentielEvaluable`
aux frontières (grilles, fiches, sélection entreprise, PDF). Bump `livret-referentiels`
v4. Détail complet dans PROJECT-STATUS.md §4.

⚠ Mise à jour des invariants §7 : « l'évaluation porte toujours sur les feuilles »
devient « sur les feuilles **non exclues** » — consommer le référentiel via
`referentielEvaluable` (jamais `blocs` brut) dans toute nouvelle vue d'évaluation.

⚠ Les sections ci-dessous (§2, §7…) décrivent l'état AVANT cette modification pour ce qui
concerne les entretiens (E1..E4, `nombreEntretiens`) — les invariants référentiels /
compétences restent exacts.

### Modification #3 — périodes en centre simplifiées + menu « Synthèse » (2026-07-06)

Décision pilote : **les périodes en centre ne portent plus aucune évaluation de
compétences ni retour apprenti** — seules restent les deux observations de fin de
période (celle de l'apprenti·e, bloquante pour sa signature ; celle du formateur
référent, non bloquante). Conséquence directe : le menu « Évaluation finale »
devient « **Synthèse** » et ne présente plus que les compétences abordées en stage
et les attitudes professionnelles, **désormais évaluées à chaque période de
stage** ; la notion de « compétences abordées en centre » disparaît entièrement.

Arbitrages validés par le pilote en séance :

1. **Attitudes évaluées sur les périodes de stage uniquement** — l'évaluation
   (échelle ++/+/-/--) quitte l'entretien tripartite et se fait par le maître /
   tuteur sur chaque fiche de période entreprise. L'entretien conserve la
   **sélection** des attitudes (figée à la 3ᵉ signature) qui définit la liste à
   évaluer, ainsi que l'appréciation générale du maître (4 critères de la trame
   officielle).
2. **Signature du tuteur bloquée tant que TOUTES les attitudes retenues ne sont
   pas évaluées** sur la fiche de période entreprise (en plus des exigences R20
   existantes : ≥ 1 compétence abordée + observation non vide).
3. **Grille de synthèse limitée à la sélection entreprise** — seules les
   compétences cochées « abordées en entreprise » apparaissent, avec la colonne
   unique « Acquis en entreprise » ; héritage last-write-wins depuis les fiches
   conservé (badge « Vue en Période N »). `acquisCentre` disparaît du modèle.
4. **Fiches centre : 2 signatures conservées** (apprenti·e + formateur référent) —
   l'apprenti·e est bloqué·e si son observation est vide, le formateur signe même
   sans la sienne. Séquencement des périodes et déverrouillage R10 inchangés.

Décisions d'implémentation (sans consultation, dérivées de la demande) :

- **Modèle** : `LigneSuiviEntreprise.evaluationGreta` supprimée (elle n'était
  éditée qu'au centre) ; `LigneEvaluationFinaleCompetence.acquisCentre`
  supprimée ; `EntretienTripartite.evaluationsAttitudes` déplacée vers
  `FicheSuiviPeriode.evaluationsAttitudes?` (optionnelle — absente des fiches
  centre) ; les fiches centre gardent le type partagé avec
  `suiviEntreprise: []`.
- **Libs** : `synthetiserCompetences(fichesEntreprise, referentiel)` (source
  centre retirée), `valeurEffective`/`confirmationRequisePourEcraserHeritage`
  sans paramètre `colonne` ; `stats-bloc` entreprise seul ; nouveaux helpers
  `attitudesNonEvaluees`, `synthetiserAttitudes` (last-write-wins + période
  d'origine) et `restreindreReferentielALaSelection` (grille Synthèse) ;
  `lignesSyntheseAttitudes(catalogue, selection, entretien, fichesEntreprise)` ;
  `attitudeEstUtilisee` lit désormais les fiches ; `ficheEstVide` compte une
  évaluation d'attitude comme contenu.
- **R20 entretien** : le maître doit toujours avoir ≥ 1 critère d'appréciation
  ET une sélection d'attitudes non vide (le CHOIX reste l'exigence — c'est lui
  qui alimente l'évaluation par période) ; l'exigence « ≥ 1 attitude évaluée »
  disparaît de l'entretien.
- **Droits** : `fiche.attitudes` (maître seul) remplace `entretien.attitudes` ;
  `fiche.evaluation-greta` et `grille-competences.centre` supprimées.
- **Store** : mutations de lignes sans paramètre `lieu` (entreprise
  uniquement), `setEvaluationAttitudeFiche` (garde : attitude retenue),
  bump `livret-donnees` v24 (reset fixtures). `useAttitudesStore` bloque la
  suppression sur les évaluations des fiches.
- **Route** : `/livret/evaluation-finale` → `/livret/synthese`
  (redirection conservée), page `Synthese.tsx`, libellé menu « Synthèse ».
- **Fixtures** : fiches entreprise signées par le maître → TOUTES les
  attitudes retenues évaluées (cohérence R20) ; Léa P3 et Camille P3
  partiellement évaluées (cas démo du blocage) ; fiches centre réduites aux
  observations ; Camille a10 « - » en P1 puis « + » en P2 (démo
  last-write-wins avec période d'origine).
- **UI/PDF** : nouveau composant `SectionAttitudesFiche` (compteur « il
  reste N attitudes ») ; `TableauTriColonnes` déparamétré de `lieu` ;
  fiches centre = observations + signatures (PDF idem) ; grille Synthèse à
  colonne unique restreinte à la sélection (les non-sélectionnées
  disparaissent — l'ancien affichage grisé « saisie historique » disparaît
  avec elles) ; PDF : attitudes par période sur chaque page de fiche
  entreprise, synthèse avec colonne « Source » (Entretien / Période N).

⚠ Les sections ci-dessous (§2 à §8) décrivent l'état AVANT les modifications
#1 à #3 — en particulier `evaluationGreta`, `acquisCentre`, l'évaluation des
attitudes à l'entretien et le tableau de compétences des fiches centre ont
disparu avec la #3. Les invariants purement référentiels (feuilles non
exclues, sélection « tout coché », réimport = remplacement) restent exacts.

### Modification #4 — évaluation par ACTIVITÉS (implémentée le 2026-07-07)

**Principe (pilote, 2026-07-06)** : certaines formations ne sont pas adaptées à une
évaluation en « compétences » mais en « **activités** ». Le référentiel de compétences
reste **impératif et obligatoire**. Cinq chantiers annoncés :

1. **Import de « modèles d'activités »** pour une formation (fichier Excel — forme à
   discuter avec le pilote).
2. **Mapping activités ↔ compétences** par le coordo/admin, jusqu'au **balayage global**
   du référentiel (hors compétences exclues — modif #2).
3. Balayage complet → le coordo **choisit le mode d'évaluation** de la formation
   (compétences ou activités). L'entretien tripartite s'en trouve modifié.
4. Mode activités → **fiches entreprise par activités** : plus aucune compétence, le
   tuteur associe une ou plusieurs activités à la période et les évalue.
5. **Synthèse** : garde l'affichage PAR COMPÉTENCES, alimentées « par le prisme des
   activités » (projection activité → compétences couvertes).

#### Angles morts identifiés (session #3 du 2026-07-06 — à arbitrer AVANT de coder)

**A. Cycle de vie du MODE (critique).** Le mode est porté par la formation, les données
par les livrets. Bascule compétences → activités (ou l'inverse) alors que des entretiens
sont signés et des fiches remplies = perte/incohérence. Options : bascule **verrouillée
dès la première saisie signée** dans la promo (pattern verrou maison, recommandé), reset
avec confirmation, ou données mixtes. À trancher, dans LES DEUX SENS. Prévoir aussi le
changement de formation d'un·e apprenti·e entre deux promos de modes différents.

**B. Règle de projection activités → compétences (critique).** Si l'activité A couvre
c1+c2 (« Maîtrisé » en P2) et l'activité B couvre c2 (« Partiel » en P3), c2 vaut quoi ?
Proposition cohérente avec l'existant : **last-write-wins chronologique toutes activités
confondues** (P3 gagne), avec provenance « via activité B, Période 3 » affichée. La
saisie manuelle d'écrasement dans la grille Synthèse (+ modale de confirmation) doit-elle
rester possible en mode activités ? Nouvelle lib pure de projection à écrire en TDD.

**C. Couplage avec le référentiel vivant (critique).**
- **Réimport du référentiel** (= remplacement intégral, ids potentiellement changés) →
  mapping orphelin → balayage incomplet → le mode activités retombe-t-il automatiquement ?
  Étendre la cascade `realignerSurReferentiel` / l'avertissement de réimport.
- **Exclusions** : réactiver une compétence exclue APRÈS validation du balayage le rend
  incomplet (garde à ajouter côté page Référentiels / `peutBasculerExclusion`) ; exclure
  une compétence peut au contraire compléter le balayage d'un coup.
- **Seuil des 40 lignes** : motivé par la charge de saisie du tuteur — faut-il un seuil
  équivalent sur le nombre d'activités d'un modèle ?
- **Changement de référentiel d'une formation** : mapping à invalider, mode à retomber ?

**D. Sélection des compétences abordées en entreprise (CDC v1.5 §12).** En mode
activités, cette sélection (tout coché → maître décoche → validée à la 3ᵉ signature E1 →
R10 pour rouvrir) garde-t-elle un sens ? Hypothèse : c'est LA modification de l'entretien
annoncée — la section devient une **sélection d'activités prévues en entreprise** (mêmes
règles de validation/figeage ?), et la grille Synthèse (restreinte à la sélection depuis
la #3) se restreint aux **compétences couvertes par les activités retenues**. À valider.

**E. Fiches entreprise.** `LigneSuiviEntreprise.competenceId` → nouveau discriminant
`activiteId` ? Même échelle (Maîtrisé/Partiel/Non maîtrisé/Non fait) ? « Activité libre »
hors modèle (équivalent `libelleLibre`) autorisée ? R20 maître : « ≥ 1 activité évaluée »
remplace « ≥ 1 compétence abordée » ; les **attitudes par période (modif #3) restent
inchangées** (à confirmer) ; retour apprenti par ligne inchangé. Le sélecteur « Ajouter
une compétence » devient « Ajouter une activité » — gaté par quoi (cf. D) ?

**F. Fichier Excel et lieu du mapping.** Deux options : (a) mapping DANS le fichier
(colonne « codes des compétences couvertes » — fragile : les codes ne s'affichent plus
depuis juin, fichiers pilote à vérifier) ; (b) fichier = activités seules (code, libellé,
description) et **mapping entièrement dans l'UI** post-import (recommandé — c'est là que
la jauge de balayage prend son sens), avec éventuel pré-remplissage optionnel depuis le
fichier. Prévoir : réimport d'un modèle déjà mappé (remplacement + réalignement, pattern
référentiels), verrou de suppression (modèle utilisé), CSV en plus du XLSX (parser maison
`parser-xlsx` + pipeline `import-referentiel` réutilisables), validation de saisie.

**G. Droits.** Nouvelles ressources : `admin.activites.gerer` (import + mapping + choix
du mode — coordo + admin : ingénierie de formation, pas de contenu pédagogique, cohérent
avec `admin.referentiels.gerer`) ; `fiche.activites` (tuteur — miroir de
`fiche.evaluation-entreprise`). Matrice × 5 rôles + tests.

**H. UI.** Page/modale admin « Modèles d'activités » avec éditeur de mapping et **jauge
de balayage** (« X/Y compétences couvertes », liste des manquantes) conditionnant le
déblocage du choix de mode ; badge du mode sur les cartes formation (GestionFormations,
pilotage ?) ; alerte coordo « balayage incomplet » dans le centre d'alertes ?

**I. PDF.** Pages de fiches entreprise en mode activités (tableau Activité | Évaluation |
Retour), Synthèse par compétences avec provenance (« via activité X — Période N »).

**J. Fixtures & E2E.** Les compteurs E2E comptent les fixtures (8 apprenti·e·s, 2
formations, périmètres Martine 5/Bernard 3, Karim 4/Hélène 3, Sophie 6/Marc 2) — une 3ᵉ
formation de démo casserait les périmètres. Recommandation : faire vivre le mode
activités sur une promo existante OU assumer l'adaptation des compteurs. Bumps attendus :
nouveau store `livret-activites` v1, `livret-formations` v9 (mode + modeleActivitesId),
`livret-donnees` v25 (lignes de fiches).

#### Questions de cadrage pour le pilote (à poser en début de session #4)

1. **Forme du fichier Excel** : quelles colonnes ? Le mapping compétences est-il dans le
   fichier ou fait uniquement dans l'UI ? Un fichier d'exemple réel est-il disponible
   (comme les 4 fichiers référentiels de `src/lib/__fixtures__/`) ?
2. **Bascule du mode** : verrouillée dès la première saisie signée dans la promo ?
   Réversible tant que rien n'est signé ? Dans les deux sens ?
3. **Projection** : en cas de niveaux divergents sur une même compétence via plusieurs
   activités, last-write-wins chronologique ? Et la saisie manuelle d'écrasement dans la
   Synthèse reste-t-elle permise ?
4. **Entretien** : en mode activités, la sélection §12 devient-elle une sélection
   d'activités (mêmes règles : tout coché ?, validation 3ᵉ signature, R10) ou
   disparaît-elle ? Les attitudes par période restent-elles identiques ?
5. **Activité libre** hors modèle sur une fiche : autorisée (équivalent de l'activité
   ad hoc actuelle) ?
6. **Réimport / exclusions** : si le balayage redevient incomplet (réimport du
   référentiel, réactivation d'une compétence), le mode retombe-t-il en compétences ou
   bloque-t-on l'action tant que des livrets sont en mode activités ?
7. **Seuil** : limite du nombre d'activités par modèle (équivalent des 40 lignes) ?
8. **Échelle** : mêmes 4 niveaux entreprise pour évaluer une activité ?
9. **Démo** : quelle promo de démo passe en mode activités (existante ou nouvelle) ?

#### Arbitrages du pilote (2026-07-06, début de session #4 — les 9 questions tranchées)

1. **Fichier** : activités seules (code, libellé, description) — le **mapping se fait
   entièrement dans l'UI** post-import (option recommandée). Pas de fichier d'exemple
   réel fourni ; formats CSV + XLSX via le pipeline existant (`parser-xlsx`).
2. **Bascule du mode** : **verrouillée dès la première saisie signée** dans la promo,
   dans les deux sens ; libre tant que rien n'est signé (pattern verrou maison).
3. **Projection** : **last-write-wins chronologique toutes activités confondues**,
   provenance « via activité X — Période N » affichée ; l'écrasement manuel dans la
   grille Synthèse (avec modale de confirmation) **reste permis**.
4. **Entretien** : la sélection §12 devient une **sélection d'activités prévues en
   entreprise, mêmes règles** (tout coché par défaut, le maître décoche, validée à la
   3ᵉ signature, R10 pour rouvrir) ; la grille Synthèse se restreint aux compétences
   couvertes par les activités retenues ; **attitudes par période (modif #3) inchangées**.
5. **Activité libre** : **autorisée** (équivalent `libelleLibre`) — évaluée sur la
   fiche, sans projection vers la Synthèse.
6. **Balayage redevenant incomplet** : **action bloquée** (réimport du référentiel,
   réactivation d'une compétence exclue, changement de référentiel de la formation)
   tant que la formation est en mode activités — pattern `referentiel-verrou`,
   message explicite au coordo/admin.
7. **Seuil** : **pas de limite** du nombre d'activités par modèle.
8. **Échelle** : **mêmes 4 niveaux** entreprise (Maîtrisé / Partiel / Non maîtrisé /
   Non fait) — réutilise `NiveauMaitriseEntreprise`, projection directe.
9. **Démo** : la promo **CAP Cuisine** passe en mode activités (fixtures existantes
   converties, périmètres E2E préservés au mieux).

#### Implémentation (2026-07-07) — repères pour les vagues suivantes

- **Types** : `ModeleActivites` / `Activite` (mapping `competenceIds` par activité,
  `referentielId` porté par le modèle), `Formation.modeEvaluation` +
  `modeleActivitesId`, `LigneSuiviEntreprise.activiteId?` (exclusif de
  `competenceId` ; `libelleLibre` = activité libre non projetée),
  `Livret.selectionActivitesEntreprise` (type partagé avec la sélection de
  compétences — mêmes helpers).
- **Libs pures (TDD)** : `import-modele-activites` (CSV/XLSX, 1-3 colonnes,
  libellé maître), `balayage-referentiel` (jauge + manquantes + orphelines),
  `projection-activites` (LWW chronologique, provenance `activiteId` +
  `periodeEntreprise`, compatible `valeurEffective`), `mode-evaluation`
  (verrou de bascule « première saisie signée », gardes réimport / changement
  de référentiel / réactivation d'exclue), `modele-activites-verrou`,
  `selection-activites-entreprise` (réalignement sur le MODÈLE + restriction
  de la Synthèse aux compétences couvertes), `validation-import-modele-activites`.
- **Droits** : `admin.activites.gerer` (coordo + admin), `fiche.activites`
  (maître — évaluation des lignes d'activités).
- **Stores** : `useActivitesStore` (`livret-activites` v1, fixture
  `act-cap-cuisine` 6 activités / balayage 10/10) ; `livret-formations` v9 ;
  `livret-donnees` v25 ; `ajouterReferentiel` retourne désormais un
  `ResultatValidation` (réimport bloqué en mode activités) ; validation des
  DEUX sélections à la 3ᵉ signature de l'entretien ; cascades de réalignement
  des sélections d'activités (réimport modèle, rattachement, changement de
  formation d'un·e apprenti·e, création d'apprenti·e).
- **UI** : page `/admin/activites` (import + éditeur de mapping + jauge +
  bascule du mode par formation), badge mode sur les cartes formation,
  `SectionSelectionActivites` à l'entretien, `TableauTriColonnes` mode-aware
  (« Ajouter une activité », activité libre), Synthèse projetée avec
  provenance « Via activité X — Période N » (écrasement manuel conservé).
- **PDF** : `LivretPdfProps.modeleActivites?` — fiches entreprise par
  activités, Synthèse avec colonne Source « via “activité” — Période N ».
- **Fixtures** : lignes des fiches CAP converties en activités (collision
  Luca P3 c2-3/c2-4 → a4 résolue par une activité libre « Inventaire de fin
  de mois »), sélections d'activités validées (a6 écartée chez Léa/Minh/Aya),
  Sofia « tout coché » non validé ; BTS inchangé (mode compétences).
- **Gabarit Excel à remplir** (complément post-livraison du 2026-07-07, demande
  pilote) : lib `modele-xlsx-activites` (réutilise le writer
  `generer-xlsx-modele`, boucle fermée testée gabarit →
  `construireModeleActivites`), bouton « Télécharger le gabarit Excel » sur
  `/admin/activites` + lien dans la modale d'import (`modele-activites.xlsx`).
- **Non fait (hors périmètre arbitré)** : alerte « balayage incomplet » au
  centre d'alertes (inutile tant que les gardes imposent le balayage complet
  en mode activités) ; seuil d'activités par modèle (Q7 : pas de limite).

---

## 1. Questions de cadrage à poser au pilote AVANT de coder

Le périmètre exact des modifications n'est pas encore connu. Points à clarifier :

1. **Structure** : les 3 niveaux actuels (Bloc → Sous-famille optionnelle → Compétence)
   suffisent-ils, ou faut-il plus de profondeur / des champs supplémentaires (coefficients,
   critères d'évaluation par compétence, référence au référentiel officiel RNCP…) ?
2. **Échelle d'évaluation** : `maitrise / partiel / non-maitrise (/ non-fait en entreprise)`
   évolue-t-elle (4 niveaux ? libellés différents par formation ? échelle numérique ?) ?
3. **Import** : nouveaux formats de fichiers ? Colonnes supplémentaires ? Mise à jour d'un
   référentiel déjà utilisé par des livrets en cours (aujourd'hui : réimport = remplacement
   intégral + réalignement des sélections non validées) ?
4. **Cycle de vie** : versionnement des référentiels ? Un livret démarré sur la v1 d'un
   référentiel doit-il suivre la v2 ou rester figé ?
5. **Migration** : que deviennent les livrets de démo existants (fiches, sélections,
   évaluations finales pointant des `competenceId`) si les ids changent ?
6. **Évaluation par période vs finale** : la mécanique « last-write-wins fiches → évaluation
   finale » (badge « Vue en Période N ») est-elle conservée ?

---

## 2. Modèle de données actuel (`src/types/index.ts`)

```
Referentiel {
  id, formation: string,
  niveauxColonnes?: 2 | 3          // métadonnée d'origine d'import
  blocs: BlocCompetences[]
}
BlocCompetences { id, code, libelle, competences: Competence[] }
Competence {
  id, code, libelle, description?,
  sousFamille?: string             // regroupement d'AFFICHAGE (3 niveaux) — non évaluable
}
NiveauMaitrise = 'maitrise' | 'partiel' | 'non-maitrise'
NiveauMaitriseEntreprise = NiveauMaitrise | 'non-fait'
```

**Invariant central : l'évaluation porte toujours sur les FEUILLES** (`bloc.competences`).
Les sous-familles ne sont que des regroupements d'affichage (indentation). Un référentiel
« mixte » a des compétences avec et sans `sousFamille` dans le même bloc.

Références aux compétences ailleurs dans le modèle (couplages par `competenceId`) :

- `FicheSuiviPeriode.suiviEntreprise[]: LigneSuiviEntreprise { competenceId?, libelleLibre?,
  evaluationGreta, evaluationEntreprise, retourApprenti }` — fiches entreprise ET centre
- `Livret.evaluationFinaleCompetences.lignes[]: { competenceId, acquisEntreprise, acquisCentre }`
  — initialisées depuis le référentiel à la création du livret
- `Livret.selectionCompetencesEntreprise: { ids[], validePar?, historiqueInvalidations[] }`
  — CDC v1.5 §12, « tout coché » par défaut, validée à la 3ᵉ signature de l'E1, R10 pour rouvrir

## 3. Les libs du domaine (toutes pures, TDD)

| Fichier (`src/lib/`)                    | Responsabilité                                                                 | Tests |
| --------------------------------------- | ------------------------------------------------------------------------------ | ----- |
| `import-referentiel.ts`                 | Pipeline CSV/XLSX → `Referentiel` : décodage UTF-8/CP1252, séparateur auto, `detecterNiveauxColonnes` (3 dès qu'une ligne a une 3ᵉ colonne), construction ligne à ligne (mixte 2/3), `estXlsxBuffer` | 27 |
| `parser-xlsx.ts`                        | Parser XLSX maison (fflate, sharedStrings, sheet1) — env node dans les tests    | 16 |
| `validation-import-referentiel.ts`      | Validation de la saisie d'import (nom, fichier/texte, formation cible)          | 11 |
| `referentiel-verrou.ts`                 | Suppression bloquée si une formation référence le référentiel                   | 4 |
| `grouper-competences.ts`                | `grouperParSousFamille(bloc)` — ordre source préservé, feuilles directes intercalées ; utilisé par TOUS les affichages (UI + PDF) | 3 |
| `selection-competences-entreprise.ts`   | Sélection par livret : `creerSelectionInitiale` (tout coché), `toggleCompetence`, `marquerValidee` (3ᵉ signature E1), `invaliderAvecMotif` (R10), `realignerSurReferentiel` (import/changement de référentiel → réaligne les sélections NON validées) | 32 |
| `synthese-evaluation.ts`                | Last-write-wins fiches → évaluation finale (`synthetiserCompetences`, `valeurEffective`, confirmation avant écrasement d'un héritage) | 20 |
| `stats-bloc.ts`                         | Compteurs par bloc (maîtrisé/en cours/non maîtrisé/non évalué × entreprise/centre) | 6 |

## 4. Stores et cascades (⚠ effets de bord inter-stores)

- **`useReferentielsStore`** (`livret-referentiels`, **v3**) : CRUD ; `ajouterReferentiel`
  écrase si l'id existe (réimport) ; suppression gardée par `referentiel-verrou`.
- **Cascades de réalignement (1ᵉʳ juillet 2026)** — 3 points d'entrée qui appellent
  `realignerSurReferentiel` sur les sélections non validées :
  1. import d'un référentiel (nouveau ou réimport du même id) — `useReferentielsStore`
  2. changement de `referentielId` d'une formation — `useFormationsStore.modifierFormation`
  3. changement de formation d'un·e apprenti·e — `useUtilisateursStore.modifierApprenti`
     (via `realignerSelectionLivret`)
- **`useLivretStore`** (`livret-donnees`, **v22**) : `evaluationFinaleCompetences.lignes`
  créées depuis le référentiel par `creerLivretVierge` / fixtures ; PAS re-synchronisées si
  le référentiel change ensuite (les lignes orphelines sont simplement ignorées à l'affichage
  — point de vigilance si la refonte touche les ids).
- **Politique de migration localStorage : bump de `VERSION_SCHEMA` = reset complet aux
  fixtures** (données fictives, pas de migration logicielle). Toute modification des fixtures
  ou du modèle persisté exige un bump du (des) store(s) concerné(s).

## 5. Interfaces (UI + PDF) qui affichent des compétences

- `pages/admin/GestionReferentiels.tsx` + `ModaleImportReferentiel.tsx` — cartes, import,
  verrou de suppression, formations rattachées
- `components/livret/TableauTriColonnes.tsx` — fiches de période (2 colonnes), sélecteur
  « Ajouter une compétence à la fiche » (formateur + maître, gaté par la sélection validée)
- `components/entretien/SectionSelectionCompetences.tsx` — sélection E1 (maître seul décide,
  co-saisie formateur depuis le 1ᵉʳ juillet)
- `components/evaluation/GrilleCompetences.tsx` + `SyntheseBloc.tsx` — évaluation finale
  (héritage des fiches, badge « Vue en Période N », confirmation d'écrasement)
- `components/pdf/LivretPdf.tsx` — `construireLignesGrillePdf` (sous-familles en lignes
  d'en-tête indentées), tableaux de fiches, stats par bloc colorées
- **Affichage « libellé seul » partout** (27 juin 2026) : les codes générés ne s'affichent
  pas ; la hiérarchie passe par l'indentation / le regroupement `grouperParSousFamille`.

## 6. Fixtures de référence

- `fixtures/referentiel-cap-cuisine.ts` — 2 niveaux, 3 blocs, 10 compétences (`c1-1`…`c3-3`)
- `fixtures/referentiel-bts-mhr.ts` — **3 niveaux**, 3 blocs, 10 feuilles, 5 sous-familles +
  3 feuilles directes (`mhr1-1`…`mhr3-3`) — structure mixte de référence
- 8 livrets de démo dont les fiches / sélections / évaluations pointent ces ids — **ids
  stables requis** tant qu'on ne bump pas `livret-donnees`
- 4 fichiers d'exemple réels du pilote utilisés par les tests d'intégration d'import
  (voir `src/lib/__fixtures__/`)

## 7. Règles métier et invariants à ne pas casser

| Invariant | Où |
| --- | --- |
| Évaluation sur les feuilles uniquement (sous-familles = affichage) | partout |
| Sélection « tout coché » à la création + réalignement au changement de référentiel (sélections NON validées seulement) | `selection-competences-entreprise` |
| Validation de la sélection à la 3ᵉ signature E1 ; réouverture = invalidation R10 motivée (formateur, ≥ 10 caractères, tracée) | store livret |
| Suppression d'un référentiel bloquée si formation rattachée | `referentiel-verrou` |
| Réimport du même id = remplacement + avertissement UI + réalignement | `useReferentielsStore` |
| Last-write-wins fiches → finale, confirmation avant écrasement d'un héritage | `synthese-evaluation` |
| Snapshot : les entretiens initialisés figent leurs questions ; même esprit à respecter si on fige des versions de référentiels | pattern maison |
| Détection 3 niveaux : dès que l'en-tête OU une ligne a une 3ᵉ colonne renseignée | `detecterNiveauxColonnes` |

## 8. Tests impactés par toute modification du domaine

- **Unitaires (~119 tests directs)** : `import-referentiel` 27, `parser-xlsx` 16,
  `validation-import-referentiel` 11, `referentiel-verrou` 4, `grouper-competences` 3,
  `selection-competences-entreprise` 32, `synthese-evaluation` 20, `stats-bloc` 6
- **E2E** : `admin-referentiels.spec.ts` (import, remplacement, verrou),
  `entretien-selection-competences.spec.ts`, `sprint2-coedition.spec.ts` (fiches),
  `sprint4-evaluation-finale.spec.ts`, `fiches-periodes*.spec.ts`, `pilotage-alertes.spec.ts`
  (compte sur les fixtures BTS)
- Total projet au 2026-07-06 (après modification #3) : **611 unitaires / 196 E2E — tous verts**
- Total projet au 2026-07-07 (après modification #4 + gabarit Excel) : **676 unitaires /
  205 E2E — tous verts** (+58 unitaires sur les 7 libs du chantier #4 +3 sur le gabarit
  XLSX, +3 droits, +2 validation-signature ; nouveau spec `admin-activites.spec.ts`
  — 9 scénarios dont la boucle gabarit → réimport —, refonte
  `entretien-selection-competences.spec.ts`)
- Total projet au 2026-07-07 (après les demandes pilote hors chantier — polarité Oui/Non
  de la rubrique « Difficultés » + auto-réparation des livrets manquants) : **682 unitaires /
  206 E2E — tous verts** (49 fichiers de test, 29 specs E2E)

## 9. Checklist de la procédure de modification type (rituel maison)

1. Cadrer avec le pilote (§1) et consigner les arbitrages ici
2. Types (`src/types/index.ts`) → libs pures en TDD → stores (+ **bump VERSION_SCHEMA** des
   stores touchés, commentaire de version daté) → fixtures (ids stables ou bump livret) →
   UI → PDF
3. `npm run typecheck` && `npx vitest run` && `npm run build` (le build prod voit des erreurs
   que `tsc --noEmit` rate) && `npm run e2e` (JAMAIS deux suites Playwright en parallèle)
4. Vérification visuelle (captures via spec Playwright temporaire, supprimé ensuite)
5. Documenter : PROJECT-STATUS.md (§0 date + tableau des vagues, §2 versions, §4 module,
   §6 compteurs de tests, §7 arborescence) + README (compteurs) + ce fichier
6. Commit conventionnel en français + push + `bash scripts/deploy.sh` + `verifier-vps.sh`
