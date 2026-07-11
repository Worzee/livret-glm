# Chantier — demandes de la direction GRETA (juillet 2026)

Cadrage des deux demandes formulées par la direction du GRETA Lyon Métropole
(transmises par le pilote le 2026-07-10). La demande 1 est **livrée** (vague du
2026-07-10) ; la demande 2 est **en attente d'arbitrages** (« on verra plus
tard » — pilote).

---

## Demande 1 — Documents administratifs (partie 1 du livret papier) ✅ LIVRÉE

> « Est-il possible d'ajouter une partie documents administratifs où mettre
> toute la partie 1 du livret papier actuel avec idéalement une case à cocher
> par les apprentis attestant qu'ils en ont pris connaissance ? »

### Arbitrages du pilote (session de cadrage 2026-07-10)

1. **Dépôt** : 1 ou plusieurs documents déposés par le **coordo ou l'admin**
   (ressource `documents.gerer`).
2. **Portée** : documents **NOMINATIFS, par apprenti·e** (chaque document
   contient des informations personnelles — convention, engagements…).
3. **Visibilité** : tous les rôles ayant accès au livret, **sauf** si le
   déposant coche « **Document réservé à l'apprenti·e** » → consultation
   restreinte à l'apprenti·e + coordo + admin (maître / tuteur et formateur
   référent exclus).
4. **Attestation** : l'apprenti·e **signe seul·e chaque document** — signature
   **manuscrite tactile** (pattern `BoutonSigner` / `ZoneSignature`),
   horodatée (R19), sans retrait possible. Ressource `documents.attester`
   (apprenti·e seul·e — doctrine coordo/admin sans droit pédagogique intacte).
5. **Obligatoire** : signature **obligatoire** — suivie par le centre
   d'alertes (« Document « X » : signature de l'apprenti·e attendue » —
   formateur hors documents réservés, coordo/admin tout) + bandeau sur le
   tableau de bord de l'apprenti·e + **rappel des documents signés dans le PDF
   de synthèse** (page « Documents administratifs » en tête du livret exporté ;
   les documents réservés y figurent SANS leur titre — le PDF circule).

### Implémentation (2026-07-10) — repères

- **Type** : `DocumentAdministratif` (`types/index.ts`) — attestation portée
  par le document (`SignaturePartie`).
- **Lib pure** : `documents-administratifs` (11 tests TDD) — visibilité,
  filtre par apprenti·e, verrou de suppression (document attesté
  insupprimable — esprit R21 ; on remplace en déposant un nouveau document),
  validation de dépôt (PDF/JPEG/PNG, ≤ 2 Mo).
- **Store** : `useDocumentsStore` (`livret-documents` v1) + fixtures (Léa ×2
  dont 1 réservé attesté/non attesté, Yanis ×1 non attesté) ; PDF de démo
  générés par `fixtures/pdf-demo.ts` (PDF 1 page valide, data-URL — ⚠ btoa
  exige du latin-1 strict, sanitisation intégrée).
- **UI** : page `/livret/documents` (sidebar tous rôles), modale de dépôt
  (`ModaleDepotDocument`), signature via `BoutonSigner` (nouvelles props
  `mentionRetrait` / `libelleBouton`), bandeau tableau de bord apprenti·e.
- **Matrice** : 55 → **57 ressources** (`documents.gerer`, `documents.attester`).

### ⚠ Stockage — maquette vs étape 2 (Nuage)

En maquette, le **fichier vit en data-URL dans le localStorage** (plafond
2 Mo/fichier — la limite navigateur ~5 Mo est partagée avec les livrets).
**En étape 2, les binaires partent sur Nuage** (Nextcloud national de
l'Éducation nationale, `apps.education.fr`, 100 Go, hébergé en France) via
**WebDAV depuis le backend** (o2switch) — le store ne conserve qu'une
référence. Configuration et doctrine : `STACK_GRETA_LYON.md` §3.4 (mot de
passe d'application dans `.env` serveur — jamais côté client) et §7.5-7.7
(RGPD : durée de conservation, purge effective, sous-traitance art. 28 —
pièces nominatives). Tracé dans `TODO-etape-2.md`.

---

## Demande 2 — Trames des entretiens individuels (mi-parcours / fin de parcours) ⏳ EN ATTENTE

> « Est-il possible d'intégrer en plus au livret les trames des entretiens
> individuels de mi-parcours et fin de parcours (accessibles coordo et
> formateur référent) ? »

**Faisabilité : oui** — nouveau menu « Entretiens individuels », deux trames
portées par le livret (pattern de la trame officielle de l'entretien
tripartite). Cohérent avec le chantier #1 : le tripartite unique = première
visite AVEC le maître ; ces entretiens individuels = un autre objet, sans le
tuteur.

### Questions à arbitrer AVANT de coder (pilote + direction)

1. **Doctrine des droits (structurant)** : « accessibles coordo et formateur »
   — le coordo **saisit** ou **consulte** ?
   - (a) formateur saisit, coordo lecture seule → doctrine « coordo sans
     droit pédagogique » intacte (option par défaut recommandée) ;
   - (b) le coordo peut conduire et saisir ces entretiens → exception
     documentée à la doctrine (défendable : accompagnement de parcours, pas
     évaluation de compétences) ;
   - (c) saisie aux deux, chacun le sien (traçabilité de l'auteur).
2. **Visibilité apprenti·e** : voit-il/elle le contenu ? Le co-signe-t-il/elle ?
   Confidentialité vis-à-vis du **maître / tuteur** (a priori oui — c'est le
   sens d'« individuel ») ?
3. **Trames officielles** : documents GRETA à fournir (rubriques / questions) —
   figées en dur comme `lib/trame-entretien` (pattern trame E1).
4. **Signatures** : aucune (compte-rendu) ou apprenti·e + conducteur ?
5. **Déclenchement** : reliés aux fiches de suivi (motifs d'organisation du
   suivi + alerte « à réaliser ») ou disponibles à tout moment ?
