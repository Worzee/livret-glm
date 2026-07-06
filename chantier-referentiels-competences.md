# Chantier — Refonte des référentiels et des compétences

**Créé le** : 2026-07-06, à l'issue de la réunion direction (très positive)
**Statut** : cadrage à préciser avec le pilote en début de session
**Objet** : une « énorme phase de modification » est annoncée sur les référentiels et les
compétences. Ce document est la **carte complète du sous-système** telle qu'elle existe
aujourd'hui — à lire avant toute modification, pour ne pas ré-explorer le code et ne rien
casser des invariants.

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
- Total projet au 2026-07-06 : **636 unitaires / 204 E2E — tous verts**

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
