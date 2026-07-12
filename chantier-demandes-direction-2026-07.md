# Chantier — demandes de la direction GRETA (juillet 2026)

Cadrage des deux demandes formulées par la direction du GRETA Lyon Métropole
(transmises par le pilote le 2026-07-10). La demande 1 est **livrée** (vague du
2026-07-10) ; la demande 2 est **cadrée** (arbitrages du 2026-07-12), en
attente des **trames officielles GRETA** avant de coder.

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

## Demande 2 — Trames des entretiens individuels (mi-parcours / fin de parcours) 🔶 CADRÉE

> « Est-il possible d'intégrer en plus au livret les trames des entretiens
> individuels de mi-parcours et fin de parcours (accessibles coordo et
> formateur référent) ? »

**Faisabilité : oui** — nouveau menu « Entretiens individuels », deux trames
portées par le livret (pattern de la trame officielle de l'entretien
tripartite). Cohérent avec le chantier #1 : le tripartite unique = première
visite AVEC le maître ; ces entretiens individuels = un autre objet, sans le
tuteur.

### Arbitrages du pilote (session de cadrage 2026-07-12)

1. **Doctrine des droits** : option (b) — le **coordo peut conduire et
   saisir** ces entretiens, comme le formateur référent. **Exception
   documentée** à la doctrine « coordo sans droit pédagogique » : l'entretien
   individuel relève de l'accompagnement de parcours, pas de l'évaluation de
   compétences. Le **conducteur est tracé** sur chaque compte-rendu (imposé
   aussi par la signature, cf. point 3).
2. **Visibilité** : l'**apprenti·e consulte** son entretien ; le **maître /
   tuteur n'y a pas accès** (c'est le sens d'« individuel »). Coordo,
   formateur référent et admin y accèdent.
3. **Signatures** : **apprenti·e + conducteur** — double signature manuscrite
   tactile horodatée (pattern `BoutonSigner` / `ZoneSignature`, comme les
   documents administratifs de la demande 1).
4. **Déclenchement** : **reliés aux fiches de suivi** — motifs d'organisation
   du suivi + alerte « entretien à réaliser » dans le centre d'alertes.

### Reste à fournir AVANT de coder

- **Trames officielles GRETA** (mi-parcours et fin de parcours) : rubriques et
  questions — à figer en dur comme `lib/trame-entretien` (pattern trame E1).
  **Seul prérequis externe** ; c'est au pilote de transmettre les documents.

### Notes d'implémentation (à trancher en début de vague)

- **Conducteur** : proposition — celui (formateur ou coordo) qui **initialise**
  l'entretien en devient le conducteur ; lui seul appose la signature côté
  encadrement (l'autre consulte). La saisie des champs reste ouverte aux deux
  (arbitrage 1) tant que non signé.
- **Exception doctrine** : le test transverse « ni coordo ni admin n'ont de
  droits pédagogiques » (`droits.test.ts`) devra exclure les ressources
  `entretien-individuel.*` avec commentaire daté ; à refléter aussi dans
  `REGLES-METIER.md` et le §3 du CLAUDE.md (doctrine).
- **PDF du livret complet** : le maître / tuteur n'a pas accès à ces
  entretiens, mais le PDF exporté circule — inclure le contenu complet, ou
  seulement l'état (réalisé le … / signatures), comme les documents réservés
  de la demande 1 (listés sans titre) ? À arbitrer avec le pilote au moment
  de coder.
