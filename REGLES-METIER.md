# Règles métier R1 → R24 — Livret d'apprentissage GRETA Lyon Métropole

**Objet** : référentiel unique des 24 règles métier du livret, avec leur **énoncé
actuel**, leur **implémentation** (lib pure + tests) et l'**historique de leurs
évolutions** au fil des vagues. Les énoncés d'origine viennent du CDC v1.3 §8 ;
plusieurs règles ont évolué depuis (addendum v1.5 + chantiers mai → juillet 2026).

- Source d'origine : [`cahier-des-charges-livret-apprentissage-v1.3.md`](cahier-des-charges-livret-apprentissage-v1.3.md) §8
- État consolidé courant : [`PROJECT-STATUS.md`](PROJECT-STATUS.md) §5
- Dernière mise à jour de ce fichier : **2026-07-13**

> **Convention** : la logique de chaque règle vit dans une **lib pure testée** de
> `src/lib/` (TDD) ; les composants sont couverts par les E2E Playwright.

---

## Tableau de référence (état actuel)

| Règle | Sujet (énoncé actuel) | Implémentation |
| ----- | --------------------- | -------------- |
| **R1** | Un seul livret par apprenti·e (1 livret actif par contrat). | modèle + `apprentis-accessibles` |
| **R2** | `contratFin` strictement postérieure à `contratDebut`. | type + `validation-apprenti` |
| **R3** | L'apprenti·e ne consulte que son propre livret. | `droits` + `apprentis-accessibles` |
| **R4** | Le maître / tuteur ne voit que ses apprenti·e·s. | `droits` + `maitres-apprenti` |
| **R5** | Le formateur référent voit sa promo **et** ses référé·e·s direct·e·s. | `droits` + `apprentis-accessibles` |
| **R6** | **Un seul entretien tripartite, obligatoire, par livret.** | `regles-entretien` |
| **R7** | Alerte ambre (non bloquante) si l'entretien n'a pas eu lieu sous 60 j après `contratDebut`. | `regles-entretien` (`calculerAlerteR7`) |
| **R8** | Entretien éditable tant qu'aucune signature ; dès qu'un rôle signe, ses champs se figent, les autres continuent. | `regles-entretien` |
| **R9** | Les 3 signatures apposées → entretien entier en lecture seule. | `regles-entretien` |
| **R10** | Déverrouillage par le formateur référent avec **motif obligatoire** ; invalide les signatures, retour à `en-cours`, tracé dans l'historique. | `deverrouillage-fiche` |
| **R11** | `dateFin` de période strictement postérieure à `dateDebut`. | `regles-periode` / `validation-periode-formation` |
| **R12** | Pas de chevauchement entre deux périodes d'un même livret. | `regles-periode` / `validation-periode-formation` |
| **R13** | Création d'une période **gérée au niveau de la formation** (coordo / admin), cascade vers les livrets de la promo (assouplie — CDC v1.5 §14.B). | `validation-periode-formation` |
| **R14** | Avertissement (non bloquant) si une période N est créée avant la signature de N-1. | `regles-periode` |
| **R15** | Une fiche passe à `signée` quand **toutes les parties du lieu** ont signé : entreprise = apprenti·e + maître / tuteur ; centre = apprenti·e + formateur. | `transitions-fiche` (`SIGNATAIRES_PAR_LIEU`) |
| **R16** | `brouillon` → `en-cours` automatique dès la 1ʳᵉ modification. | `transitions-fiche` |
| **R17** | `signée` → `verrouillée` automatique après 15 j sans modification (bouton manuel formateur en maquette). | `transitions-fiche` |
| **R18** | Un rôle ne peut apposer que **sa propre** signature. | `droits` + `validation-signature` |
| **R19** | Toute signature est horodatée au clic (ISO 8601). | store `signer()` |
| **R20** | Champs obligatoires requis avant signature (variables par rôle, lieu et type — voir détail ci-dessous). | `validation-signature` + `regles-entretien` |
| **R21** | Retirer une signature est impossible, sauf via R10. | `transitions-fiche` |
| **R22** | Clôture du livret : dernière période `verrouillée` + clic explicite « Clôturer » du formateur. | `cloture-livret` |
| **R23** | Synthèse visuelle (par bloc) recalculée en temps réel à chaque saisie. | recalcul au render (`stats-bloc`) |
| **R24** | L'apprenti·e consulte ses évaluations à tout moment, même partielles. | `droits` + bandeau lecture |

### Extensions hors numérotation (13 juillet 2026 — réunion DG, demandes 3-5)

Sans créer de nouvelle règle numérotée, la vague du 13 juillet 2026 étend
l'**esprit** de plusieurs règles au module **documents administratifs** et au
**6ᵉ rôle « Responsable légal »** :

- **Attestation de prise de connaissance des documents** : horodatée au clic
  (esprit **R19**), sans retrait possible — un document attesté est
  insupprimable, on le remplace en redéposant le même type (esprit **R21**).
  Conditionnée à la **lecture préalable** du document par l'attestataire.
  Implémentation : `documents-administratifs` + `useDocumentsStore`.
- **Attestataire selon la minorité** : l'apprenti·e **majeur·e** atteste
  lui/elle-même ; pour un·e **mineur·e** (minorité recalculée au jour —
  `minorite`), le **responsable légal** atteste en lieu et place (un seul des
  deux suffit). Implémentation : `attestataireDocuments`.
- **Périmètre du responsable légal** (analogue de R4/R5) : il ne voit que
  son / ses enfants (`Apprenti.responsableLegalIds` — fratrie possible), en
  **lecture seule** sur tout le livret sauf l'attestation des documents et la
  signature du slot « représentant légal » de l'entretien (balayage exhaustif
  de la matrice en test). Implémentation : `apprentis-accessibles` + `droits`.
- **Obligation de dépôt** : 4 types de documents obligatoires par apprenti·e
  (anomalie « dépôt à effectuer » au centre d'alertes coordo/admin tant qu'un
  type manque) — couverte par un dépôt nominatif OU un document de FORMATION
  (dépôt en masse, le nominatif prime). Implémentation :
  `typesObligatoiresManquants` + `documentsEffectifsApprenti`.

Cadrage complet : [`chantier-demandes-direction-2026-07.md`](chantier-demandes-direction-2026-07.md).

### Détail R20 — champs obligatoires avant signature (état juillet 2026)

| Contexte | Rôle | Exigences |
| -------- | ---- | --------- |
| Fiche **entreprise** | Maître / tuteur | ≥ 1 compétence **ou** activité abordée évaluée + observation non vide + **toutes les attitudes retenues** évaluées |
| Fiche **entreprise** | Apprenti·e | Observation de fin de période non vide |
| Fiche **centre** | Apprenti·e | Observation de fin de période non vide (bloquante) |
| Fiche **centre** | Formateur référent | Aucune exigence (il signe librement) |
| **Entretien** | Maître / tuteur | ≥ 1 critère d'appréciation + choix des attitudes non vide |
| **Entretien** | Apprenti·e / formateur | Aucune exigence de champ |

---

## Historique des évolutions par règle

Seules les règles ayant évolué depuis le CDC v1.3 figurent ici. Les autres (R1-R5,
R8, R9, R11, R12, R16, R18, R19, R21, R23, R24) sont conformes à leur énoncé d'origine.

### R6 — nombre d'entretiens tripartites

- **CDC v1.3** : un seul entretien tripartite par livret.
- **Fin mai 2026** (chantier #2) : passage à **2 entretiens** par livret.
- **11 juin 2026** : jusqu'à **4 entretiens**, nombre défini par la formation (verrou de réduction).
- **6 juillet 2026** (chantier référentiels/compétences #1, décision pilote) : **retour à un entretien tripartite UNIQUE et obligatoire** — le suivi ultérieur passe par les fiches de suivi. Suppression des entretiens 2 à 4, du nombre par formation, de la banque de questions et de la modalité présentiel/distanciel.

### R7 — alerte entretien tardif (> 60 j)

- **CDC v1.3** : alerte ambre si l'entretien tripartite n'a pas eu lieu sous 60 j.
- **Chantier #2** : alerte restreinte à **E1** (les entretiens de bilan n'étaient pas concernés).
- **6 juillet 2026** : l'entretien étant redevenu unique, l'alerte porte sur **cet entretien unique**.

### R10 — déverrouillage motivé

- **CDC v1.3** : le formateur référent déverrouille une fiche signée, motif obligatoire, invalidation des signatures, traçabilité.
- **CDC v1.5 §12** : la mécanique R10 gouverne aussi l'**invalidation de la sélection des compétences (puis des activités) abordées en entreprise** une fois validée à l'entretien (motif ≥ 10 caractères, réservé au formateur).

### R13 — création d'une période

- **CDC v1.3** : création d'une fiche de période N conditionnée (entretien présent, N-1 signée/verrouillée, dates cohérentes).
- **Fin mai 2026** (chantier #1) : le **planning des périodes migre au niveau de la formation** (coordo / admin), avec cascade automatique vers tous les livrets de la promo. La règle porte désormais sur la cohérence R11/R12 des périodes de la formation.

### R14 — avertissement période N avant N-1 signée

- **CDC v1.3 / v1.5 §14.B** : message d'avertissement (jamais bloquant) inchangé dans son principe ; s'applique au séquencement de visibilité des périodes (une période reste masquée tant que la précédente n'est pas signée par toutes les parties du lieu).

### R15 — fiche « signée » = toutes les parties

- **CDC v1.3** : une fiche passe à `signée` quand **les 3 parties** ont signé.
- **17 juin 2026** : introduction des **périodes en centre** — signature à **2 parties** au centre (apprenti·e + formateur).
- **1ᵉʳ juillet 2026** (réunion direction) : en **entreprise**, signature à **2 parties** (apprenti·e + maître / tuteur) ; le formateur référent **ne signe plus** les fiches entreprise (il appose un commentaire global optionnel puis **verrouille**). Paramétrage par `SIGNATAIRES_PAR_LIEU`.

### R17 — verrouillage automatique

- **CDC v1.3** : `signée` → `verrouillée` après 15 j (bouton manuel formateur en maquette).
- **Note juillet 2026** : le verrouillage manuel reste l'acte du formateur y compris en entreprise, où il ne signe plus (R15).

### R20 — champs obligatoires avant signature

- **CDC v1.3** : liste de champs obligatoires par rôle et type de fiche (dont « suivi GRETA CFA »).
- **Fin mai 2026** (chantier #3) : suivi GRETA CFA passé en 2 zones texte ; R20 formateur adaptée.
- **12 juin 2026** : R20 entretien étendue — le maître doit évaluer **≥ 1 attitude** pour signer.
- **1ᵉʳ juillet 2026** : « suivi GRETA CFA » **retiré de toutes les fiches** ; en entreprise, le maître ne signe plus contre la zone supprimée.
- **6 juillet 2026** (chantier #3) : refonte majeure — au **centre**, l'apprenti·e signe contre sa seule observation et le formateur **sans exigence** ; en **entreprise**, le maître doit évaluer **toutes les attitudes retenues** (déplacées de l'entretien vers chaque période) ; à l'**entretien**, l'exigence devient « ≥ 1 critère d'appréciation + choix des attitudes non vide » (l'évaluation des attitudes ayant migré sur les fiches).

### R22 — clôture du livret

- **CDC v1.3** : livret clôturé quand la dernière période est `verrouillée` + clic « Clôturer » du formateur ; grille d'évaluation éditable jusque-là.
- **6 juillet 2026** : l'« Évaluation finale » devient la **« Synthèse »** (compétences restreintes à la sélection entreprise, colonne unique « Acquis en entreprise ») ; la logique de clôture R22 est inchangée.

---

_Ce fichier est un miroir de référence : toute modification d'une règle doit être
répercutée ici **et** dans [`PROJECT-STATUS.md`](PROJECT-STATUS.md) §5._
