# État du projet — Livret d'apprentissage GRETA Lyon Métropole

**Dernière mise à jour** : 2026-07-07 — **rubrique « Difficultés éventuelles » de l'entretien : polarité Oui/Non inversée (demande pilote — « Oui » = difficulté déclarée, en rouge avec icône d'alerte et repris dans le récapitulatif ; « Non » = norme, en vert ; consigne et PDF alignés, bump `livret-donnees` v26)**, après le **polish typographique global (demande pilote) : les tirets cadratins « — » des textes affichés sont remplacés par une ponctuation contextuelle (« : », parenthèses, « - », « … », virgule — détail §4)**, après le **chantier référentiels/compétences, modification #4 (décision pilote, 9 questions de cadrage arbitrées) : ÉVALUATION PAR ACTIVITÉS** — certaines formations s'évaluent par **activités** plutôt que par compétences (le référentiel reste impératif) : import de **modèles d'activités** (CSV/XLSX, activités seules), **mapping activités ↔ compétences dans l'UI** avec **jauge de balayage** (couverture complète du référentiel hors exclusions requise), **choix du mode d'évaluation par formation** (verrouillé dès la première saisie signée dans la promo, dans les deux sens), **fiches entreprise par activités** (sélection d'activités à l'entretien — mêmes règles que la sélection de compétences, activité libre autorisée, R20 adapté), **Synthèse toujours PAR COMPÉTENCES alimentée par la projection des activités** (last-write-wins chronologique, provenance « via activité X — Période N », écrasement manuel conservé), gardes du référentiel vivant (réimport / changement de référentiel / réactivation d'exclue bloqués en mode activités) ; **la promo CAP Cuisine passe en mode activités** (modèle de démo 6 activités, balayage 10/10) — arbitrages dans [`chantier-referentiels-competences.md`](chantier-referentiels-competences.md). Vague précédente (2026-07-06) : **chantier référentiels/compétences, modifications #1 à #3 (décisions pilote) : entretien tripartite UNIQUE et obligatoire (suppression des entretiens 2 à 4, du nombre d'entretiens par formation, de la banque de questions et de la modalité présentiel/distanciel — le suivi ultérieur passe par les fiches de suivi existantes), LIMITE DE 40 LIGNES ÉVALUABLES par référentiel à l'import (agrégation au niveau supérieur ou cochage manuel, exclusions conservées et gérables, seuil modifiable par l'admin seul), puis PÉRIODES EN CENTRE SIMPLIFIÉES + menu « SYNTHÈSE » (fiches centre réduites aux observations de fin de période — apprenti·e bloquante, formateur non ; attitudes professionnelles évaluées par le tuteur À CHAQUE période en entreprise, toutes exigées pour sa signature ; « Évaluation finale » renommée « Synthèse », restreinte aux compétences abordées en stage, colonne unique « Acquis en entreprise » — cadrage et arbitrages dans [`chantier-referentiels-competences.md`](chantier-referentiels-competences.md)).** Historique de la vague précédente (retours coordonnateurs pédagogiques — « Maître / Tuteur », affectation des questions par le coordo, jusqu'à 4 entretiens tripartites, motifs par rôle + séquencement, attitudes professionnelles par entretien + catalogue admin, confirmation avant écrasement d'une évaluation héritée, second maître / tuteur par apprenti·e, tri par année de formation sur le tableau de bord, **signature manuscrite tactile**, **répartition des apprenti·e·s entre coordos**, **questions de l'entretien gérées par formation**, **compétences activées par défaut + maître seul**, **bascule de périmètre coordo depuis l'administration**, **harmonisation du planning des périodes sur toute la promo**, **modalité présentiel/distanciel des entretiens + verrou de la fiche de suivi par signature**, **exports PDF par période / entretien / fiches de suivi**, **séquencement de visibilité des périodes**, **refonte de l'entretien tripartite 1 sur la trame officielle GRETA**, **ajout de compétences à la fiche de période ouvert au tuteur**, **fiche de période réduite à « Évaluation entreprise » + « Retour apprenti·e » (colonne GRETA CFA retirée)**, **périodes en centre de formation (miroir de l'entreprise)**, **récapitulatif personnel sur le tableau de bord apprenti·e**, **retrait des 4 attitudes redondantes avec l'appréciation maître (catalogue 16 → 12)**, **banque de questions réservée à l'admin**, **forçage de l'affichage des périodes par le coordo**, **import des référentiels CSV/XLSX mixtes 2/3 niveaux + affichage « libellé seul »**, **entreprise d'accueil gérée comme entité (choix par apprenti·e + traçabilité)**, **entreprise modifiable depuis les affectations**, **sélection de compétences réalignée « tout coché » au changement de référentiel + co-saisie des champs du tuteur par le formateur**, **entretien consultable en lecture seule avant initialisation**, **tableau de bord groupé par formation (sections repliables)**, **modale Planning épurée (formulaire d'ajout masqué, questions retirées)**, **retrait du suivi GRETA CFA de toutes les fiches (entreprise puis centre — tout se rédige dans les observations)**, **2 signatures en entreprise (apprenti·e + tuteur, le formateur commente et verrouille)**, **3 commentaires individuels sur l'entretien 1**, **grille de synthèse E1 colorée par niveau**, **récapitulatif des 4 attitudes obligatoires dans la synthèse des attitudes + PDF**, **en-tête des PDF scindé (Marianne à gauche, réseau GRETA CFA à droite, titre dessous)**, **PDF colorés (niveaux/appréciations/Oui-Non aux couleurs du site) + champs en ligne + tirets simples**, **2ᵉ promo de démo BTS MHR (référentiel 3 niveaux, 4 entretiens, 2ᵉ site)**, **tableau de pilotage coordo/admin (KPI par promo)**, **centre d'alertes par rôle**, **sélecteur de formateur actif**, **page « Accès mobile » (QR code, encadrement)**)
**Version applicative** : 0.1.0
**Phase CDC** : Étape 1 — maquette fonctionnelle (CDC v1.3) **livrée + 4 vagues post-livraison**
**Pilote métier** : Guillaume FERRERI

---

## 0. Résumé exécutif

### État global

L'**étape 1 du CDC v1.3 est livrée et déployée**, enrichie par 8 vagues post-livraison (CDC v1.5 + chantiers métier mai 2026 + retours coordonnateurs juin 2026 + réunion direction 1ᵉʳ juillet 2026). La maquette est fonctionnelle, accessible sur URL publique avec Basic Auth, et tous les flux pédagogiques sont testés en bout-en-bout : **678 tests unitaires + 205 tests E2E passent**, bundle JS gzippé ~184 KB. Aucune authentification réelle ni backend persistant pour l'instant — c'est précisément l'objet de l'étape 2.

### Ce qui est livré

| Phase                                        | Périmètre                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Étape 1 (CDC v1.3)**                       | 6 sprints : socle Vite/React/TS → fiches de période tri-colonnes → organisation du suivi + entretien tripartite → évaluations finales (compétences + attitudes) → clôture R22 + déverrouillage motivé R10 + export PDF                                                                                                  |
| **Vague avril → mi-mai 2026**                | Administration métier complète : rôles Coordo + Admin (5 rôles au total), CRUD utilisateurs / formations / affectations / référentiels (import CSV + XLSX) / établissements / banque de questions                                                                                                                       |
| **Vague 17 mai 2026**                        | Sélection par stagiaire des compétences abordées en entreprise (validation conjointe formateur + maître à la 3ᵉ signature de l'entretien, R10 motivé) — CDC v1.5 §12                                                                                                                                                    |
| **Vague fin mai 2026**                       | 5 chantiers structurants : planning des périodes au niveau formation (cascade automatique vers les livrets), 2 entretiens tripartites par livret, import XLSX apprentis/maîtres/formateurs, suivi GRETA CFA en 2 zones texte, maître avec entreprise + fonction                                                         |
| **Polish 26 mai 2026**                       | Équilibrage de la palette 5 rôles (Coordo orange foncé, Admin or foncé), bugfix PDF aligné UI, ~50 éléments graphiques colorisés par rôle                                                                                                                                                                               |
| **Vague juin 2026** (retours coordonnateurs) | « Maître / Tuteur » + 2ᵉ tuteur, jusqu'à 4 entretiens, attitudes (catalogue admin, choix à l'E1 + évaluation par entretien), répartition apprenti·e·s ↔ coordos, tri par année au tableau de bord, **signature manuscrite tactile**, logo officiel GRETA CFA, verrous (entretien signé, héritage). Détail §4 |
| **Vague 17-18 juin 2026** (retours coordonnateurs) | **Périodes en centre de formation** (miroir de l'entreprise, évaluées par le formateur, signature à 2 parties), **récapitulatif personnel du tableau de bord apprenti·e**, **retrait des 4 attitudes redondantes** (catalogue 16 → 12), **banque de questions réservée à l'admin**, **forçage de l'affichage des périodes par le coordo**. Détail §4 |
| **Vague 27-28 juin 2026** (corrections & entreprise) | **Import des référentiels CSV/XLSX mixtes 2/3 niveaux** corrigé + affichage « libellé seul » (codes masqués, hiérarchie par indentation), **entreprise d'accueil gérée comme entité** (page admin dédiée, choix par apprenti·e dans une liste déroulante + **traçabilité** des changements), **entreprise modifiable depuis la page Affectations**. Détail §4 |
| **Vague 1ᵉʳ juillet 2026** (réunion direction GRETA) | **Sélection de compétences réalignée « tout coché »** quand le référentiel change + **co-saisie des champs du tuteur par le formateur** (tous entretiens, signature exclue), **entretien consultable en lecture seule** dès l'événement de suivi (initialisation = ouverture de la saisie), **tableau de bord groupé par formation** (sections repliables — formateur/coordo/admin), **modale Planning épurée** (formulaire d'ajout masqué derrière un bouton, erreurs après tentative, questions gérées uniquement dans la banque admin), **retrait du suivi GRETA CFA de toutes les fiches** (entreprise puis centre — tout se rédige dans les observations), **2 signatures en entreprise** (apprenti·e + maître / tuteur — le formateur appose un commentaire global optionnel puis verrouille), **3 commentaires individuels sur l'entretien 1** (apprenti·e / tuteur / formateur, chacun figé à la signature de son auteur), **grille de synthèse E1 colorée par niveau** (vert → rouge, comme les attitudes), fix **visibilité d'un·e apprenti·e chez son formateur référent** (relation directe, promoIds non maintenu). Détail §4 |
| **3 juillet 2026** (modification technique) | **Récapitulatif des 4 attitudes obligatoires** (critères de l'appréciation générale du maître / tuteur — trame officielle E1) **en tête de la synthèse des attitudes**, au-dessus des attitudes optionnelles retenues : onglet « Attitudes professionnelles » de l'évaluation finale + tableau de synthèse du PDF d'évaluation finale + section attitudes des PDF d'entretien. **En-tête des PDF scindé** : Marianne à gauche, réseau GRETA CFA à droite, titre du document en dessous. **PDF colorés et compactés** : niveaux / appréciations / Oui-Non aux couleurs du site, champs « label : valeur » en ligne (13 → 12 pages sur le livret de démo), tirets longs remplacés par des tirets simples, fix des 3 signatures d'entretien. Détail §4 |
| **3 juillet 2026** (préparation démo direction) | **2ᵉ promo de démo BTS MHR 2025-2027** (référentiel **3 niveaux** avec sous-familles, **4 entretiens**, 2ᵉ site Bellecour, 2 apprenti·e·s, 2 tuteurs, formateur Marc TISSIER — fait vivre le groupement par formation, le tri par année et les périmètres), **tableau de pilotage coordo/admin** (KPI du périmètre : fiches signées entreprise/centre, entretiens réalisés, alertes R7, clôtures + mini-stats par groupe de formation), **centre d'alertes par rôle** (« À traiter » : signatures attendues, fiches à verrouiller, entretiens à initialiser, R7, affectations incomplètes — clic = navigation directe), **sélecteur de formateur actif** (Sophie ↔ Marc, pattern du sélecteur de maître), **page « Accès mobile »** (QR code de l'application à faire scanner au tuteur en visite — menu réservé formateur/coordo/admin). Détail §4 |
| **6 juillet 2026** (chantier référentiels/compétences #1) | **Entretien tripartite UNIQUE et obligatoire** (décision pilote) : le suivi ultérieur passe par les **fiches de suivi existantes**. Suppression des **entretiens 2 à 4** (`Livret.entretiens` → `Livret.entretien`, plus de séquencement), du **nombre d'entretiens par formation** (`Formation.nombreEntretiens` + section de la modale Planning + lib `nombre-entretiens`), de la **banque de questions** (page admin, store, lib `questions-entretien`, `Formation.questionsRetirees`, sections questions apprenti·e/maître/formateur des entretiens, champs démarches/conditions/aides) et de la **modalité présentiel/distanciel** (l'entretien se tient en présentiel — règle E1 inchangée). L'entretien unique = trame officielle GRETA (« première visite »). Motif d'organisation du suivi unique `entretien-tripartite`. Détail §4 |
| **6 juillet 2026** (chantier référentiels/compétences #2) | **Limite de 40 lignes évaluables par référentiel** (décision pilote — au-delà, la saisie devient trop longue pour le tuteur en période entreprise) : à l'import, si le fichier dépasse le seuil, deux issues — **agréger au niveau hiérarchique supérieur** (3 niveaux : chaque sous-famille devient la ligne évaluable, libellés fins en description) ou **cocher/décocher** jusqu'à la limite. Les décochées sont **conservées** (`Competence.exclue`) et **gérables post-import** (modale « Lignes évaluables », cascade de réalignement des sélections non validées). **Seuil paramétrable par l'admin uniquement** (store `livret-parametres`, ressource `admin.parametres.gerer`, encart sur la page Référentiels). Détail §4 |
| **6 juillet 2026** (chantier référentiels/compétences #3) | **Périodes en centre simplifiées + menu « Synthèse »** (décision pilote) : les fiches centre ne portent **plus aucune évaluation de compétence ni retour apprenti** — seules restent les **observations de fin de période** (apprenti·e bloquante pour sa signature, formateur non bloquante) et les 2 signatures. Les **attitudes professionnelles** (retenues à l'entretien) sont désormais **évaluées par le maître / tuteur à CHAQUE période en entreprise** — TOUTES exigées pour sa signature (R20). L'« Évaluation finale » devient « **Synthèse** » (`/livret/synthese`) : compétences **restreintes à la sélection entreprise**, colonne unique « Acquis en entreprise », onglet Attitudes en agrégation last-write-wins avec période d'origine. Détail §4 |
| **7 juillet 2026** (chantier référentiels/compétences #4) | **Évaluation par ACTIVITÉS** (décision pilote — 9 questions de cadrage arbitrées en début de session) : **modèles d'activités** importés par formation (CSV/XLSX, activités seules — code/libellé/description), **mapping activités ↔ compétences dans l'UI** (page `/admin/activites`, jauge de balayage « X/Y compétences couvertes »), **mode d'évaluation par formation** (`competences` \| `activites`) débloqué au **balayage complet** et **verrouillé dès la première saisie signée** dans la promo (les deux sens). En mode activités : **sélection d'activités prévues en entreprise à l'entretien** (mêmes règles §12 — tout coché, maître décoche, figée à la 3ᵉ signature, R10), **fiches entreprise par activités** (« Ajouter une activité », **activité libre** hors modèle autorisée — non projetée), **Synthèse PAR COMPÉTENCES alimentée par la projection** (last-write-wins chronologique toutes activités confondues, provenance « **Via activité X — Période N** », écrasement manuel avec confirmation conservé), **gardes du référentiel vivant** (réimport, changement de référentiel, réactivation d'une compétence exclue non mappée : bloqués tant qu'une formation rattachée est en mode activités). **La promo CAP Cuisine passe en mode activités** (modèle `act-cap-cuisine`, 6 activités, balayage 10/10) ; le BTS MHR reste en mode compétences. Détail §4 |

### Chantiers identifiés cette session (2026-05-26)

| Chantier                              | Référence                                                                                                        | État                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Refonte PDF d'export**              | §8.D + [`TODO-etape-2.md`](TODO-etape-2.md)                                                                      | Périmètre à arbitrer avec le pilote                                                              |
| **Signature électronique manuscrite** | §8.E + [`TODO-etape-2.md`](TODO-etape-2.md) + CDC v1.5 §14.C                                                     | **Volet maquette livré (juin 2026)** — tracé tactile capturé ; valeur probante à coupler étape 2 |
| **Conformité RGPD**                   | §8.F + [`conformite-rgpd.md`](conformite-rgpd.md) + [`conformite-rgpd-etapes.docx`](conformite-rgpd-etapes.docx) | 33 obligations strictes + 9 recommandées (apprenti·e·s majeur·e·s ; AIPD non obligatoire)        |

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
| État des tests (678 unit + 205 E2E)                             | §6                                                                                                        |
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
| **Chantier référentiels / compétences (cadrage + carte du sous-système)** | [`chantier-referentiels-competences.md`](chantier-referentiels-competences.md)                    |
| Paramétrage des sessions Claude Code (doctrine, commandes, pièges)         | [`CLAUDE.md`](CLAUDE.md)                                                                          |

---

## 1. En bref

|                       |                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **URL publique**      | https://livret-glm.duckdns.org                                                                   |
| **Accès**             | Basic Auth `demo` / _(mdp partagé hors-canal)_                                                   |
| **Dépôt source**      | https://github.com/Worzee/livret-glm (privé, branche `main` — synchronisée GitHub ↔ local ↔ VPS) |
| **Tests unitaires**   | **678 / 678 ✓** (Vitest, 48 fichiers de test)                                                    |
| **Tests E2E**         | **205 / 205 ✓** (Playwright — Chromium desktop + mobile Pixel 5, 28 specs)                       |
| **Bundle JS gzippé**  | 184 KB (cible CDC §19.1 : < 500 KB → marge × 2,7)                                                |
| **Bundle CSS gzippé** | 6,5 KB (cible : < 50 KB → marge × 7)                                                             |
| **Chunk PDF lazy**    | 494 KB (chargé uniquement au clic « Exporter »)                                                  |
| **Préflight VPS**     | 11 / 11 ✓                                                                                        |
| **TypeScript**        | strict, sans erreur                                                                              |
| **ESLint**            | sans erreur                                                                                      |

---

## 2. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables, palette 5 rôles équilibrée mai 2026)
- **State** : Zustand 5 + middleware `persist` — **11 stores** persistés en localStorage :
  - `livret-donnees` (schema v25) — livrets, fiches **entreprise** (compétences **ou activités selon le mode de la formation** + **évaluations des attitudes par période** — juillet 2026) **+ centre de formation** (`fichesSuiviCentre`, **observations de fin de période seules**), **l'entretien tripartite unique et obligatoire** (`Livret.entretien` — trame officielle GRETA), synthèse des compétences (colonne entreprise seule), sélection des compétences abordées en entreprise **+ sélection des activités prévues en entreprise** (mode activités — chantier #4), **forçage d'affichage des périodes** (`affichagePeriodesForce`)
  - `livret-role-actif` — rôle + maître / coordo / formateur actifs
  - `livret-apprenti-actif` — id de l'apprenti·e affiché·e
  - `livret-utilisateurs` (schema v6) — apprenti·e·s (avec **second maître / tuteur optionnel**, **coordo de rattachement**, **entreprise d'accueil par id + historique des affectations** juin 2026), maîtres (avec `entreprise` + `fonction`), formateurs, coordos, admins
  - `livret-formations` (schema v9) — formations + **planning des périodes** au niveau formation (`lieuId`, référentiel, dates de promo, `periodes[]` **+ `periodesCentre[]`**) + **mode d'évaluation** (`modeEvaluation` + `modeleActivitesId` — chantier #4, juillet 2026)
  - `livret-referentiels` (schema v4) — référentiels de compétences (Bloc → Sous-famille? → Compétence, **`Competence.exclue?` — limite des lignes évaluables**)
  - `livret-activites` (schema v1) — **modèles d'activités** (chantier #4, juillet 2026) : activités importées par formation + mapping vers les compétences du référentiel (fixture `act-cap-cuisine`, 6 activités, balayage 10/10)
  - `livret-parametres` (schema v1) — **paramètres globaux** : seuil de lignes évaluables par référentiel (40 par défaut, admin uniquement — juillet 2026)
  - `livret-etablissements` (schema v2) — lieux de formation + URL Pronote (gestion admin uniquement)
  - `livret-entreprises` (schema v2) — **entreprises d'accueil des apprenti·e·s** (raison sociale, SIRET, adresse ; gestion coordo + admin, juin 2026)
  - `livret-attitudes` (schema v3) — **catalogue global des attitudes professionnelles** (12 attitudes par défaut — a1..a4 retirées car redondantes avec les critères de l'appréciation maître ; gestion admin uniquement, juin 2026)
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

- La ressource `organisation-suivi` (création / modification des événements de la page « Fiches de suivi ») passe de `formateur` seul à **`formateur` + `coordo` + `admin`** — gestion calendaire/organisationnelle, pas de contenu pédagogique _(la suppression en est détachée le 15 juin, cf. ci-dessous)_
- **Nouvelle ressource `entretien.gestion`** (formateur uniquement) : l'initialisation des entretiens et l'édition de leur date — auparavant adossées à `organisation-suivi` — restent des actes pédagogiques fermés au coordo/admin. La doctrine « coordo/admin sans droit pédagogique » est préservée (test transverse adapté)
- **Liseré des cartes d'événements colorisé par rôle actif** : nouvelle utility CSS `.bordure-gauche-couleur-role` (variable `--ring`) remplace le violet formateur codé en dur — formateur violet, coordo orange, admin or
- Matrice : 46 → **47 ressources × 5 rôles**
- +1 test unitaire droits, +3 scénarios E2E (coordo gère un événement + liseré ; admin gère ; coordo ne peut pas initialiser un entretien)
- **Suivi 15 juin 2026 — suppression réservée au coordo / admin** : la suppression d'un événement est détachée dans une ressource dédiée `organisation-suivi.supprimer` (coordo + admin uniquement). Le formateur référent crée et modifie les événements mais ne peut plus les **supprimer** (acte destructif de gouvernance — le bouton corbeille n'apparaît plus pour lui). Matrice : 48 → **49 ressources** ; +1 test droits, +1 scénario E2E (« le formateur ne voit pas le bouton supprimer ») + 2 specs de suppression repassées en coordo

#### Exports PDF par période, entretien et fiches de suivi (16 juin 2026 — retours coordonnateurs pédagogiques)

- En plus de l'export du **livret complet** (page Évaluation finale), trois nouveaux exports PDF ciblés, sur le même rendu : **une période** (page détail d'une période), **un entretien tripartite** (page entretien) et **les fiches de suivi** (événements de la page du même nom)
- Architecture : les sections `Page*` de `LivretPdf` sont exportées et recomposées en 3 documents (`PeriodePdf`, `EntretienPdf`, `FichesSuiviPdf`) ; `BoutonExportPdf` et `ExportPdfLazy` deviennent génériques (prop `variante`) — le bundle lourd `@react-pdf` reste **lazy-loadé** (chunk séparé, bundle initial quasi inchangé)
- Plomberie mutualisée dans un hook `useDonneesLivretPdf` (identité, formation, référentiel, établissement, banque de questions, attitudes), réutilisé par les 3 pages
- **Droits** : `export-pdf` étendu de `formateur` à **`formateur` + `coordo` + `admin`** (sortie documentaire, pas de contenu pédagogique) — apprenti·e et maître exclus. Vaut aussi pour l'export du livret complet existant
- Aucun changement de schéma de données (pas de reset) ; +5 scénarios E2E (`export-pdf.spec.ts`), tests de droits adaptés

#### Ajout de compétences à la fiche de période ouvert au tuteur (17 juin 2026 — retours coordonnateurs pédagogiques)

- Le **maître / tuteur** peut désormais **sélectionner les compétences travaillées** sur une fiche de période (ajout / retrait dans le tableau de suivi en entreprise) — c'est lui qui encadre en entreprise. Auparavant réservé au formateur référent
- Nouvelle ressource `fiche.ajouter-competence` → `['formateur', 'maitre']` (pédagogique : coordo / admin exclus). Matrice : 51 → **52 ressources**
- `TableauTriColonnes` : le sélecteur « Ajouter une compétence à la fiche » suit le rôle actif pour le verrou (chacun ajoute tant qu'il peut encore éditer sa part, avant signature). Toujours conditionné à la validation de la sélection des compétences abordées en entreprise
- Aucun changement de schéma (pas de reset) ; +1 test droits, +2 E2E (tuteur peut ajouter ; apprenti·e ne peut pas)
- **Suivi 17 juin 2026 — colonne « Évaluation GRETA CFA » retirée des fiches de période** : pendant le stage, seuls le **tuteur** (« Évaluation entreprise ») et l'**apprenti·e** (« Retour apprenti·e ») renseignent ; le centre n'évalue plus sur la période (il évalue à l'évaluation finale). `TableauTriColonnes` passe de 3 à 2 colonnes (desktop + mobile) et le tableau de la fiche dans le PDF de même. Le champ `evaluationGreta` reste au modèle (compat / synthèse) ; pas de reset. +1 E2E

#### Périodes en centre de formation — miroir de l'entreprise (17 juin 2026 — retours coordonnateurs pédagogiques)

Les périodes de regroupement **au centre de formation (CFA)** obtiennent leur propre suivi, miroir des périodes en entreprise :

- **Planning distinct** au niveau formation (`Formation.periodesCentre`, section dédiée de la modale Planning) ; chaque période cascade une fiche dans `Livret.fichesSuiviCentre` (ids `fc-…`)
- **Évaluation par le formateur référent** : la fiche centre porte la colonne `evaluationGreta` (vs `evaluationEntreprise` côté tuteur) ; l'apprenti·e garde sa colonne « Retour »
- **Signature à 2 parties** : apprenti·e + formateur (le maître / tuteur n'intervient pas au CFA). Séquencement de visibilité, déverrouillage R10 et verrou de planning suivent la même logique, paramétrés par un `lieu: 'entreprise' | 'centre'` (type `LieuFiche`)
- **Synthèse finale** : l'« acquis en centre » de l'évaluation finale hérite désormais des **fiches centre** (et non plus du champ `evaluationGreta` des fiches entreprise)
- **Pages + PDF + sidebar** : pages « Période en Centre » (liste + détail, routes `/livret/fiches-suivi-centre`), lien sidebar dédié, pages PDF des périodes centre + variante d'export `periode-centre`
- **Approche** : paramétrage par `lieu` plutôt que duplication (composants `TableauTriColonnes` / `BlocSignatures` / pages / store / libs réutilisés). Bumps `livret-donnees` v19 → v20, `livret-formations` v5 → v6 (reset)
- Fixtures de démo : 2 regroupements pour Léa (automne signé, hiver en cours) ; tests unitaires (blocs « centre » des libs paramétrées) + E2E `fiches-periodes-centre.spec.ts`

#### Récapitulatif personnel sur le tableau de bord apprenti·e (18 juin 2026 — retours coordonnateurs pédagogiques)

Le rôle apprenti·e n'a qu'un seul livret (le sien) : la liste de sélection du tableau de bord est remplacée, **pour ce rôle uniquement**, par un récapitulatif personnel :

- **3 cartes** : « Ma formation » (diplôme, CFA, contrat, maître / tuteur + entreprise, formateur), « Mes échéances » (prochain entretien + date, période en cours entreprise *et* centre, fin de contrat), « Ma progression » (jauges fiches signées entreprise + centre, entretiens réalisés)
- **Bandeau d'alerte R7** en tête si le 1ᵉʳ entretien est en retard ; **accès rapides** vers les sections du livret ; auto-sélection de l'apprenti·e actif·ve pour la navigation. Les autres rôles conservent la liste de sélection
- Logique testable isolée dans `lib/recap-apprenti.ts` (prochain entretien, période en cours, progressions, jours restants — 10 tests) ; composant `TableauBordApprenti`. Aucun changement de schéma ; E2E `tableau-de-bord-6-apprentis` adaptés au récap

#### Retrait des 4 attitudes redondantes avec l'appréciation maître (18 juin 2026 — retours coordonnateurs pédagogiques)

- Les attitudes `a1..a4` (ponctualité, respect des consignes, qualité du travail, intégration) sont **retirées du catalogue** : elles doublonnaient les 4 critères de l'**appréciation du maître / tuteur** (section « Synthèse de la période »), évalués par défaut à chaque entretien. Catalogue ramené de **16 à 12 attitudes** ; les ids restants (`a5..a16`) sont conservés **stables** (référencés par les fixtures)
- Fixtures de démo nettoyées (`attitudesSelectionnees`, `evaluationsAttitudes`) ; bumps `livret-attitudes` v2 → v3 et `livret-donnees` v20 → v21 (reset) ; tests unitaires + E2E (`attitudes.spec.ts`, `sprint4-evaluation-finale.spec.ts`) adaptés

#### Banque de questions réservée à l'admin (18 juin 2026 — retours coordonnateurs pédagogiques)

- Le droit `admin.banque-questions.gerer` passe de `['coordo', 'admin']` à **`['admin']`** : le coordo ne voit plus le lien dans la sidebar et l'accès direct affiche « Accès réservé à l'administration ». Le coordo **conserve** le retrait de questions *par formation* (modale Planning) — mécanisme distinct du catalogue global
- Aucun changement de schéma (pas de reset) ; +1 test de droits, `banque-questions.spec.ts` adapté (accès admin)

#### Forçage de l'affichage des périodes par le coordo (18 juin 2026 — retours coordonnateurs pédagogiques)

- Sur la page « Période en Entreprise / en Centre », le **coordo / admin** dispose d'un interrupteur **« Forcer l'affichage de toutes les périodes »**. Activé, toutes les périodes du lieu deviennent visibles par **tous les rôles** (apprenti·e, tuteur, formateur), court-circuitant le séquencement de signature — avec un bandeau d'information côté apprenti·e / tuteur
- **Par livret** (apprenti·e précis·e) et **par lieu** (entreprise / centre indépendants) : drapeau `Livret.affichagePeriodesForce` (champ optionnel → pas de reset) ; mutation `setAffichagePeriodesForce` ; `voirTout = supervision coordo/admin (peutContournerSequencement) OU forçage actif`
- Le coordo / admin (supervision) voyait déjà toutes les périodes ; le forçage étend cette visibilité à tous les rôles. +1 scénario E2E

#### Import des référentiels CSV/XLSX mixtes 2/3 niveaux + affichage « libellé seul » (27 juin 2026 — retours pilote)

L'import d'un référentiel à 3 colonnes (`Bloc ; Compétence ; Compétence détaillée`) dont seules certaines lignes renseignent la 3ᵉ colonne (fichier « mixte », ex. CSV Pronote BTS) basculait à tort en 2 niveaux : la colonne détaillée était ignorée et les compétences de niveau 2 multi-détails apparaissaient en doublon.

- **Détection** (`import-referentiel.ts`) : 3 niveaux dès que l'en-tête a 3 colonnes **ou** qu'au moins une ligne renseigne une 3ᵉ colonne (fini la bascule « à la majorité »)
- **Construction ligne par ligne** : 3ᵉ colonne remplie → la 2ᵉ devient une **sous-famille** (regroupement non évaluable), la 3ᵉ la **compétence-feuille** ; 3ᵉ colonne vide → la 2ᵉ colonne est elle-même la feuille (plus aucune compétence perdue, plus de doublon)
- **Affichage « libellé seul »** : les codes générés ne sont plus affichés (le code métier, quand il existe, figure déjà en tête de libellé) ; la hiérarchie passe par l'**indentation / le regroupement par sous-famille** sur tous les écrans (page Référentiels, évaluation par période + sélecteur d'ajout, grille finale, synthèse par bloc, sélection compétences entretien, export PDF). Utilitaire partagé `lib/grouper-competences.ts`
- L'évaluation porte toujours sur les **feuilles** (`bloc.competences`) : niveau 3 quand il existe, sinon niveau 2 — les sous-familles ne sont que des regroupements d'affichage
- +6 tests unitaires (`grouper-competences` 3, parser mixte 3) ; 3 specs E2E adaptées aux libellés. Aucun changement de schéma

#### Entreprise d'accueil gérée comme entité + choix et traçabilité par apprenti·e (28 juin 2026 — retours pilote)

L'entreprise d'accueil, jusque-là un texte libre dérivé du maître, devient une **entité gérée** sélectionnable et traçable :

- **Entité `Entreprise`** (raison sociale, SIRET, adresse) gérée sur une nouvelle page **`/admin/entreprises`** (droit `admin.entreprises.gerer` → **coordo + admin**), avec verrou de suppression si une entreprise héberge un·e apprenti·e (`lib/entreprise-verrou.ts`). Store `useEntreprisesStore` + fixtures (Le Gourmet, La Brasserie du Rhône + 2)
- **Choix par apprenti·e** : le champ entreprise de la modale apprenti·e devient une **liste déroulante** (fin de la synchro forcée depuis le maître — l'entreprise est un choix indépendant)
- **Traçabilité** : `Apprenti.historiqueEntreprises` (entreprise, date, auteur) — entrée initiale à la création, nouvelle entrée à chaque changement ; affichée dans la modale d'édition. Logique pure testée (`lib/historique-entreprise.ts`). Luca démontre un changement Gourmet → Brasserie
- **Affichage résolu** : ligne « Entreprise d'accueil » au tableau de bord apprenti·e (raison sociale, ville, ancienneté, mention si changement) et sur la page de garde PDF
- Bump `livret-utilisateurs` v4 → v5 + nouveau store `livret-entreprises` v1 (reset). +8 tests unitaires (verrou 2, historique 6) ; +7 E2E (`entreprises.spec.ts`)

#### Entreprise modifiable depuis la page Affectations (28 juin 2026 — retours pilote)

- La colonne « Entreprise » de `/admin/affectations` passe d'un **id technique en lecture seule** à une **liste déroulante** (raison sociale) auto-sauvegardée, comme les autres colonnes ; le changement alimente l'historique d'entreprise (traçabilité)
- **Bug corrigé** : changer le maître ne réécrit plus `entrepriseId` (l'ancien couplage y mettait un *nom* au lieu d'un id). L'entreprise suit le **verrou des affectations** (déverrouillage temporaire pour un contrat démarré)
- +1 scénario E2E (changement d'entreprise depuis Affectations)

#### Sélection de compétences réalignée + co-saisie des champs du tuteur (1ᵉʳ juillet 2026 — réunion direction)

- **Réalignement « tout coché »** : la sélection des compétences abordées en entreprise (non validée) est réalignée automatiquement sur le référentiel effectif quand celui-ci change — import d'un référentiel (nouveau ou réimport du même id), changement de référentiel d'une formation, changement de formation d'un·e apprenti·e. Corrige le trou où un import laissait toutes les cases décochées (ids orphelins). Fonction pure `realignerSurReferentiel` + actions `realignerSelectionsFormation` / `realignerSelectionLivret` branchées dans les 3 stores ; les sélections validées restent intouchées (R10)
- **Co-saisie par le formateur** : le formateur référent édite les champs du maître / tuteur dans **tous** les entretiens (questions, grille d'appréciation, évaluations des attitudes, commentaire libre, sélection des compétences) — il tient souvent le clavier en séance. Sa **signature maître reste exclusive** ; les champs se figent toujours à la signature du maître. Matrice : `entretien.*-maitre`, `entretien.attitudes`, `entretien.selection-competences-entreprise` → `['maitre', 'formateur']`
- +6 tests unitaires, +2 E2E (import → tout coché ; co-saisie de la grille du maître)

#### Entretien consultable en lecture seule avant initialisation (1ᵉʳ juillet 2026 — réunion direction)

- Dès que l'événement « Entretien Tripartite N » existe dans les fiches de suivi, l'entretien complet (trame E1 ou sections apprenti / maître / formateur, questions de la formation) est **consultable par tous les rôles en lecture seule** — bandeau explicatif + champs désactivés via `<fieldset disabled>` (aucun composant de section modifié), sans bloc signatures ni export
- L'**initialisation** (formateur / coordo, séquencement conservé) ouvre la saisie ; le bouton vit dans le bandeau. Sans événement créé, l'écran d'attente reste. `entretienVierge` exporté du store pour fabriquer l'aperçu (non persisté)
- +1 E2E (aperçu apprenti·e sans bouton init / formateur avec bouton, champs désactivés)

#### Fix : apprenti·e visible chez son formateur référent (1ᵉʳ juillet 2026)

- Le filtre du tableau de bord formateur reposait sur `Formateur.promoIds`, **jamais maintenu** pour les formations créées en ligne : une apprentie d'une nouvelle formation était invisible de sa formatrice alors que `formateurReferentId` pointait bien vers elle. Le formateur voit désormais ses promos **OU** ses référé·e·s direct·e·s
- +2 tests unitaires (référent direct hors promo)

#### Tableau de bord groupé par formation (1ᵉʳ juillet 2026 — réunion direction)

- Pour **formateur, coordo et admin**, les cartes apprenti·e·s sont regroupées en **sections par formation** (« Intitulé (année) · N apprenti·e·s »), **dépliables / repliables** (`details`/`summary` natifs, ouvertes par défaut). Groupes triés promo récente d'abord, apprenti·e·s par nom ; les non-affecté·e·s terminent dans « Sans formation ». Les filtres nom / année s'appliquent au contenu des groupes
- Le maître / tuteur conserve la grille plate, l'apprenti·e son récapitulatif personnel. Helper pur `grouperParFormation` + grille extraite en composant partagé
- +4 tests unitaires, +1 E2E (replier / déplier, grille plate maître)

#### Modale Planning épurée (1ᵉʳ juillet 2026 — réunion direction)

- Les zones « Ajouter une période » (entreprise et centre) sont **masquées par défaut** derrière un bouton dédié (« Ajouter une période en entreprise » / « en centre ») ; « Annuler » referme. Les erreurs de champs obligatoires n'apparaissent qu'**après une tentative** d'ajout (plus de rouge à l'ouverture) ; les erreurs de cohérence R11/R12 s'affichent dès la saisie incohérente
- La section « **Questions de l'entretien tripartite** » (retrait par formation) est **retirée de la modale** : les questions se gèrent uniquement dans la banque de questions côté admin. Le mécanisme `Formation.questionsRetirees` reste dans le modèle, sans UI pour le moment

#### Retrait du « Suivi GRETA CFA » de toutes les fiches (1ᵉʳ juillet 2026 — réunion direction)

- La zone « Suivi de la formation au GRETA CFA » est retirée **partout** — d'abord des fiches entreprise (doublon avec les périodes en centre), puis des fiches en centre elles-mêmes : **tout se rédige dans les « Observations de fin de période »** (page + PDF). Le composant `SuiviGretaCfa` est supprimé ; le champ de données reste dans le modèle (saisies conservées, pas de bump)
- La règle de signature R20 du formateur suit : au centre, ≥ 1 compétence évaluée + observation (plus d'exigence sur la zone supprimée)

#### 2 signatures en entreprise — le formateur commente et verrouille (1ᵉʳ juillet 2026 — réunion direction)

- Une période en entreprise est **signée dès que l'apprenti·e ET le maître / tuteur** ont signé. Le **formateur référent ne signe plus** les fiches entreprise : sa carte disparaît du bloc signatures, sa zone d'observation devient un **« commentaire global (optionnel) »** éditable jusqu'au verrouillage, et il **verrouille** la période signée (bandeau existant)
- `SIGNATAIRES_PAR_LIEU.entreprise = ['apprenti', 'maitre']` — compteurs, état « signée », **séquencement**, verrouillage auto R17, avertissements R14 et PDF suivent automatiquement. Garde défensive R20 : une « signature formateur » en entreprise est refusée avec un message explicite. (Cette vague remplace le correctif du 28 juin qui autorisait la signature formateur sans évaluation.)
- Fixture P3 de Léa ajustée (l'apprentie a signé, le tuteur pas encore — récit de démo conservé) ; 7 cas unitaires réécrits + 2 nouveaux, +1 E2E (« le formateur ne signe plus mais verrouille »)

#### 3 commentaires individuels sur l'entretien tripartite 1 (1ᵉʳ juillet 2026 — réunion direction)

- Le commentaire global en bas de la trame E1 devient **3 commentaires individuels** (apprenti·e, maître / tuteur, formateur référent), au style des observations de fiches (liseré couleur rôle). Chacun édite le sien (le formateur co-saisit celui du tuteur), et chaque commentaire se **fige à la signature de son auteur**. Aucune perte : l'ancien commentaire global vivait dans le champ du formateur
- **PDF unifié** : les 3 commentaires figurent pour tous les entretiens (E1 affichait une « Synthèse » unique). +1 E2E

#### Grille de synthèse E1 colorée par niveau (1ᵉʳ juillet 2026)

- Les cartes de la « Synthèse de la période et bilan de l'intégration » prenaient un vert uniforme (rôle maître) quelle que soit l'appréciation : elles adoptent le **code couleur du sélecteur des attitudes** — ++ vert foncé, + vert clair, − orange, −− rouge (bordure / fond / liseré du niveau sélectionné, symboles colorés en permanence)

#### Récapitulatif des 4 attitudes obligatoires dans la synthèse des attitudes (3 juillet 2026 — modification technique)

La synthèse des attitudes professionnelles n'affichait que les attitudes **optionnelles** retenues à l'E1 — les 4 critères de l'appréciation générale du maître / tuteur (ponctualité, compréhension des consignes, qualité du travail, intégration — anciennes a1..a4, retirées du catalogue le 18 juin car évaluées d'office) n'y figuraient pas :

- **Lib pure** : `ATTITUDES_OBLIGATOIRES` (libellés alignés sur la trame officielle E1 via `CRITERES_APPRECIATION_E1`, descriptions dédiées) + `lignesSyntheseAttitudes()` — construit les lignes de synthèse avec les 4 **obligatoires en tête** (niveaux lus dans `appreciationMaitre` de chaque entretien), puis les optionnelles retenues (niveaux lus dans `evaluationsAttitudes`), dans l'ordre du catalogue
- **UI** (onglet « Attitudes professionnelles » de l'évaluation finale) : le tableau s'ouvre sur les 4 obligatoires, badge « Obligatoire » ; il est désormais toujours affiché (une note remplace l'ancien état vide quand aucune optionnelle n'est retenue)
- **PDF** : le tableau de synthèse de la page Évaluation finale reprend les mêmes lignes (suffixe « (obligatoire) ») ; sur les pages d'entretien, l'ancien bloc « Appréciations (maître) » fusionne dans « Attitudes professionnelles (maître) » — obligatoires au-dessus des optionnelles, commentaires d'appréciation conservés
- Aucun changement de schéma (pas de reset) ; +6 tests unitaires (`attitudes` 10 → 16), +1 scénario E2E (`sprint4-evaluation-finale.spec.ts`)

#### En-tête des PDF scindé — Marianne / réseau GRETA CFA (3 juillet 2026 — modification technique)

La page de garde (commune aux 4 exports PDF : livret complet, période, entretien, fiches de suivi) adoptait le logo officiel d'un seul tenant, avec le titre à sa droite :

- **Logo scindé en 2 assets** : `logo-republique-francaise.png` (Marianne, 27 Ko) à **gauche** et `logo-reseau-greta-cfa.png` (réseau GRETA CFA — Académie de Lyon, 83 Ko) à **droite** de la même rangée (`justifyContent: space-between`) ; le **titre « Livret d'apprentissage / GRETA Lyon Métropole » passe sous la rangée** de logos
- Assets produits par découpe automatique du PNG officiel (détection de la bande vide entre les blocs, recadrage serré, hauteur 400 px) — le PDF n'embarque plus le PNG de 483 Ko (le header de l'UI, lui, l'utilise toujours)
- Aucun changement de schéma ni de test (rendu visuel vérifié sur le PDF généré)

#### PDF colorés, textes élargis, tirets simples (3 juillet 2026 — retours pilote)

Trois évolutions de lisibilité sur **tous les exports PDF** :

- **Couleurs alignées sur le site** : niveaux de maîtrise (« Maîtrisé » vert / « En cours » orange / « Non maîtrisé » rouge — tokens `colors.niveau` de tailwind.config) dans les tableaux de fiches et d'évaluation finale + compteurs de la synthèse par bloc ; **appréciations ++/+/-/-- en pastilles pleines** (tokens `colors.appreciation`, comme le sélecteur de l'UI) sur les attitudes des entretiens et le tableau de synthèse ; **Oui vert / Non rouge** (questions, démarches, aides). Helpers `styleNiveau` / `PastilleAppreciation` / `ChampOuiNon` / `LigneStats`
- **Champs en ligne pleine largeur** : `Champ` passe de deux colonnes (label fixe 140 pt → retours à la ligne inutiles sur les questions longues, ex. « L'apprenti·e connaît le poste / les activités demandées ») à un texte fluide « label : valeur » ; marges verticales des titres resserrées. Livret de démo : 13 → **12 pages**
- **Tirets longs remplacés** : wrapper `Text` local à `LivretPdf.tsx` — toute chaîne rendue dans un PDF voit ses « — » remplacés par « - » (littéraux, données, helpers), métadonnées `Document` comprises
- **Fix au passage** : la vague du 1ᵉʳ juillet (2 signataires par lieu de fiche) avait aussi retiré la carte « Formateur référent » du bloc signatures des **entretiens** dans le PDF — un entretien tripartite se signe à 3 (R9). `BlocSignaturesPdf` sans `lieu` réaffiche les 3 cartes
- Aucun changement de schéma ; rendu vérifié page par page sur le PDF généré (E1, fiches, évaluation finale)

#### 2ᵉ promo de démo : BTS MHR 2025-2027 avec référentiel 3 niveaux (3 juillet 2026 — préparation démo direction)

Les fixtures ne comptaient qu'une formation (CAP Cuisine) : le groupement par formation, le tri par année et les périmètres coordo ne montraient qu'un seul groupe. Une **2ᵉ promo complète** les fait vivre :

- **Référentiel `ref-bts-mhr` à 3 niveaux** (Bloc → Sous-famille → Compétence, 5 sous-familles + 3 feuilles directes = structure mixte comme les CSV Pronote) — l'affichage hiérarchique « libellé seul » se démontre sur tous les écrans et le PDF
- **Formation BTS Management en Hôtellerie-Restauration 2025-2027** : 2 ans, **4 entretiens tripartites** (le maximum), 3 périodes entreprise + 2 regroupements centre, **2ᵉ établissement** (site Bellecour) et **2ᵉ entreprise hôtelière** (Hôtel Le Continental)
- **Camille MOREAU** (mi-parcours riche) : E1 signé sur la trame officielle, **E2 signé** (questions banque, progression des attitudes E1 → E2 visible dans la synthèse), **E3 initialisé signé par l'apprentie seule**, P1 verrouillée, P2 signée, P3 en cours, C1 signée, C2 en cours — alimente le centre d'alertes de son tuteur et de son formateur
- **Yanis BELKACEM** (cas « retard ») : aucun événement E1 (**2ᵉ alerte R7** de la démo), P1 entamée jamais signée alors que la période est finie
- Staff : maîtres **Nadia HAMDI** (Continental) et **Julien FAURE** (Table des Halles), formateur **Marc TISSIER**, promo rattachée à Martine (périmètre coordo : 5 apprenti·e·s vs 3 pour Bernard)
- Bumps : `livret-donnees` v21 → v22, `livret-utilisateurs` v5 → v6, `livret-formations` v6 → v7, `livret-referentiels` v2 → v3, `livret-etablissements` v1 → v2, `livret-entreprises` v1 → v2 (reset)
- Helpers de fixtures paramétrés par référentiel (`livretVierge`, sélections, trame) ; tests `apprentis-accessibles` adaptés aux 8 apprenti·e·s (+1 test périmètre Marc)

#### Tableau de pilotage coordo / admin + centre d'alertes par rôle (3 juillet 2026 — préparation démo direction)

Le tableau de bord parle désormais le langage du pilotage :

- **Bandeau de KPI** (coordo / admin, lib pure `lib/pilotage.ts` — 7 tests) sur le périmètre actif : apprenti·e·s suivis (+ clôturés), **fiches entreprise et centre signées** (x/y + %), **entretiens réalisés / attendus** (selon `nombreEntretiens` de chaque formation), **alertes R7** ; **mini-stats par groupe de formation** dans l'en-tête de chaque section (fiches, entretiens, badge ambre « N alertes R7 »)
- **Centre d'alertes « À traiter »** (lib pure `lib/alertes.ts` — 12 tests) : chaque rôle voit ce qui attend SON action — apprenti·e / maître / formateur : **signatures attendues** (fiches entamées dont la période est échue, entretiens initialisés non signés) ; formateur : + **fiches signées à verrouiller**, **entretiens planifiés à initialiser** (séquencement respecté), **alertes R7** ; coordo / admin : R7 + **affectations incomplètes** (aucun droit pédagogique — doctrine inchangée). Un clic **active l'apprenti·e et navigue** vers la page cible
- **Sélecteur de formateur actif** (Sophie DUBOIS ↔ Marc TISSIER, pattern du sélecteur de maître) : `useUserStore.formateurActifId` + `setFormateurActif` — chaque formateur ne voit que sa promo ; sans lui, la promo BTS était invisible côté formateur
- Composants `BandeauPilotage` + `CentreAlertes` (`components/dashboard/`) ; +19 tests unitaires, +6 scénarios E2E (`pilotage-alertes.spec.ts`)

#### Page « Accès mobile » — QR code d'accès à l'application (3 juillet 2026)

En visite d'entreprise, le formateur référent affiche cette page et le maître / tuteur **scanne le QR code** avec son téléphone : il arrive sur l'application sans saisir d'URL (sert aussi en présentation — la salle teste sur ses propres téléphones) :

- **Nouvelle entrée de menu « Accès mobile »** (section Livret de la sidebar, icône QR) réservée à l'encadrement : nouvelle ressource `acces-mobile` → **formateur + coordo + admin** (même trio que l'export PDF ; matrice 53 → 54 ressources). L'apprenti·e et le maître qui forcent l'URL voient « Accès réservé à l'encadrement »
- **QR code SVG** de l'URL courante de l'application (`window.location.origin` — s'adapte automatiquement à l'environnement : VPS aujourd'hui, o2switch demain), généré par `qrcode-generator` (zéro dépendance, ~6 Ko gzippés, correction d'erreur M) ; fond blanc + zone de silence pour un scan fiable, URL en clair + bouton « Copier le lien »
- **Identifiants volontairement non affichés** (mention « se communiquent oralement ») ; à l'étape 2 (auth réelle), la page évoluera vers un **lien d'invitation à jeton** — noté dans `TODO-etape-2.md`
- +1 test de droits, +2 scénarios E2E (`acces-mobile.spec.ts` — menu + QR + URL pour l'encadrement ; menu absent et accès refusé pour apprenti·e / maître)

#### Refonte de l'entretien tripartite 1 sur la trame officielle GRETA (16 juin 2026 — réunion GRETA)

- L'**entretien 1** (« première visite ») adopte la **trame officielle** issue d'une réunion GRETA, **figée** (non éditable par le coordo pour le moment) : `lib/trame-entretien-1.ts` — 5 rubriques thématiques (intégration, accompagnement, adéquation, organisation de l'alternance, difficultés), ~25 questions **conjointes** (maître + apprenti·e), texte ou oui/non
- **Points d'alerte** : une réponse « Non » signale une difficulté ; un **récapitulatif en fin d'entretien** liste les actions à mener (DDF / coordonnateur) — `pointsAlerteTrameE1`
- **Grille d'appréciation enrichie** des descriptions par niveau (++/+/−/−−) ; **représentant légal** ajouté en 4e signataire **optionnel** (hors décompte R9), apposé par le formateur
- **Conservés à E1** : choix des attitudes professionnelles + évaluation, sélection des compétences abordées en entreprise. **Retirés de E1** : démarches administratives, conditions pratiques, aides demandées (les entretiens 2 à 4 les conservent, avec la banque de questions)
- Modèle : `EntretienTripartite.reponsesTrame` + `SignaturesTripartite.representantLegal` ; mutations `setReponseTrameEntretien` + signature `representantLegal` ; droits `entretien.trame` (formateur + maître) et `entretien.signature-representant-legal` (formateur). Matrice : 49 → **51 ressources**
- Validation de signature adaptée pour E1 (plus de questions banque ni de démarches exigées) ; PDF de l'entretien 1 refondu sur la trame + récap d'alertes
- Bump `livret-donnees` v18 → v19 (reset) ; +12 tests unitaires (`trame-entretien-1` 11, droits 1), +5 E2E (`entretien-1-trame.spec.ts`) ; 3 specs adaptées (questions banque déplacées vers E2, attitudes E1)

#### Séquencement de visibilité des périodes (16 juin 2026 — retours coordonnateurs pédagogiques)

- Une période en entreprise n'est **visible que tant que la période précédente a été signée par les 3 parties** (apprenti·e + maître / tuteur + formateur·rice). La première période est toujours visible ; les suivantes apparaissent au fur et à mesure des signatures
- Helpers purs dans `regles-periode` : `periodeSigneeTroisParties`, `periodesVisibles`, `estPeriodeVisible`, `nbPeriodesMasquees`
- Page liste « Période en Entreprise » : n'affiche que les périodes visibles + un encart annonçant les périodes encore masquées (sans dévoiler leur contenu). Page détail : accès par URL directe gardé (écran « Période non accessible »)
- Un déverrouillage R10 (qui invalide les signatures) **re-masque** les périodes suivantes — comportement voulu
- Aucun changement de schéma (pas de reset) ; +9 tests unitaires (`regles-periode`), +1 scénario E2E (accès direct bloqué) + 3 specs adaptées (Minh : seule P1 visible ; Aya : P3 masquée ; cascade planning vérifiée sur Théo, toutes périodes signées)

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

#### Compétences abordées en entreprise : tout activé par défaut, maître seul décide (13 juin 2026 — modification technique)

- **Défaut « tout activé »** : à la création d'un livret, toutes les compétences du référentiel sont retenues (`creerSelectionInitiale`) — au lieu d'une sélection vierge. Le maître / tuteur n'a plus qu'à **retirer** les compétences non abordées en entreprise
- **Maître seul** : la ressource `entretien.selection-competences-entreprise` passe de `['formateur', 'maitre']` à **`['maitre']`**. Le formateur référent consulte (cases désactivées). L'invalidation R10 (après validation) reste au formateur
- Validation à la 3ᵉ signature de l'E1 et gating de la grille finale **inchangés**
- Fixtures : le livret vierge (Minh) démarre avec toutes les compétences cochées ; les livrets E1 signés gardent leur sélection validée
- Bump `livret-donnees` v15 → v16 (reset)
- +3 tests unitaires (`creerSelectionInitiale`), droits + 1 scénario E2E adaptés (maître décoche, formateur lecture seule)

#### Questions de l'entretien gérées par formation (13 juin 2026 — modification technique)

La banque de questions devient un **pur catalogue** et l'affectation migre au niveau formation :

- **Modèle** : `QuestionBanque` perd `pourEntretiens` et `obligatoire` (la question ne porte plus que son identité). `Formation.questionsRetirees: string[]` les remplace. Par défaut, **toute** question de la banque est posée dans **tous** les entretiens de la formation et sa réponse est **obligatoire** pour signer ; le coordo retire les questions non pertinentes (binaire : présente/obligatoire ou retirée)
- **Snapshot d'initialisation** (`idsQuestionsActives`) : à l'init d'un entretien, on injecte toutes les questions actives (non retirées) de la formation, toutes imposées + obligatoires
- **Banque (`/admin/banque-questions`)** : CRUD pur (libellé, cible, type) — colonnes E1..E4 et « Obligatoire » supprimées. Réservée coordo/admin (inchangé)
- **Modale Planning** (page Formations) : nouvelle section « Questions de l'entretien » — cases à cocher (cochée = incluse/obligatoire, décochée = retirée pour la formation) ; `toggleQuestionRetiree`. Sans effet sur les entretiens déjà initialisés (snapshot figé)
- **Formateur en lecture seule** : suppression du bouton « Choisir les questions », du composant `SelecteurQuestions` et de la mutation `setQuestionsSelectionnees`. Il conduit l'entretien avec le jeu défini par le coordo
- Bumps : `livret-banque-questions` v3 → v4, `livret-formations` v4 → v5, `livret-donnees` v14 → v15 (reset)
- Tests : `questions-entretien` refondu (30 → 21), `banque-questions.spec` réécrit (retrait par formation, formateur lecture seule), helpers de signature E2E adaptés (toutes les questions obligatoires)

#### Choix des attitudes à l'entretien tripartite 1 (13 juin 2026 — retours coordonnateurs pédagogiques)

Le catalogue n'est plus évalué en entier : **les attitudes à évaluer se choisissent lors de l'E1, puis sont évaluées à chaque entretien** :

- **Modèle** : `Livret.attitudesSelectionnees` (ids du catalogue) — nouvelle section « Choix des attitudes professionnelles » dans l'E1, cases à cocher co-éditées par le **maître / tuteur et le formateur référent** (nouvelle ressource `entretien.attitudes-selection`, matrice 47 → 48)
- **Figé à la 3ᵉ signature de l'E1** (pattern sélection des compétences) — bandeau « Choix figé », cases désactivées, garde no-op dans le store
- **Évaluées dès l'E1** : la grille du maître (chaque entretien), la synthèse de l'évaluation finale et le PDF ne présentent que les attitudes retenues ; R20 inchangée (≥ 1 évaluée pour signer), avec une raison dédiée orientant vers le choix tant que la sélection est vide
- **Verrou admin étendu** : une attitude retenue dans un livret (même non évaluée) ne peut plus être supprimée du catalogue
- Fixtures : les livrets dont l'E1 est signé retiennent a1..a6 + a9 (non évaluée — illustre le « — » de la synthèse)
- Bump `livret-donnees` v13 → v14 (reset)
- +10 tests unitaires (lib `selection-attitudes` 9 + droits), +2 scénarios E2E (choix à l'E1 filtre la grille du maître ; choix figé après 3 signatures)

#### Catalogue des attitudes professionnelles enrichi (13 juin 2026)

- Le catalogue par défaut passe de **6 à 16 attitudes**, chacune avec une **description concrète** (aide à l'évaluation) : aux 6 historiques (ponctualité, consignes, qualité, intégration, initiative, communication — ids `a1..a6` stables) s'ajoutent hygiène/sécurité, tenue professionnelle, motivation, organisation, adaptation, prise en compte des remarques, curiosité, soin du matériel, maîtrise de soi, discrétion/confidentialité
- Formulations transversales (valables tous secteurs) — l'admin élague ou complète librement depuis `/admin/attitudes`
- Bump `livret-attitudes` v1 → v2 (reset du catalogue)

#### Import XLSX : rattachement au coordo importateur (12 juin 2026 — retours coordonnateurs pédagogiques)

- Les apprenti·e·s **importé·e·s via Excel par un coordo rejoignent automatiquement son périmètre** (`coordoId` = importateur — sinon ils lui seraient invisibles) ; un admin importe sans coordo et répartit ensuite. L'absence d'affectation **pédagogique** auto (formation, maître, formateur) reste inchangée. La création manuelle (modale) faisait déjà l'auto-affectation
- L'auteur du livret créé suit désormais l'utilisateur·rice actif·ve (l'id admin était codé en dur)
- **Bugfix au passage** : la confirmation « Import terminé — N comptes créés » ne s'affichait jamais (`reinitialiser()` l'écrasait juste après sa pose)
- +2 scénarios E2E (`import-utilisateurs.spec.ts` — fichier XLSX généré dans le test avec la lib de modèles du projet)

#### Verrou : l'événement d'un entretien signé est insupprimable (12 juin 2026 — retours coordonnateurs pédagogiques)

- La fiche de suivi (événement « Entretien Tripartite N » de la page Fiches de suivi) **ne peut plus être supprimée dès que l'entretien correspondant est signé par au moins une partie** — elle trace un acte engagé
- `peutSupprimerEvenement` étendue (lib pure, bouton désactivé + raison en infobulle « signé par N partie(s) ») + garde no-op dans le store ; le verrou manuel existant prime (message « déverrouillez d'abord »)
- Un entretien initialisé mais non signé, ou non initialisé, reste librement supprimable ; les autres motifs ne sont pas concernés
- +6 tests unitaires (`organisation-suivi` 21 → 27), +1 scénario E2E

#### Logo officiel GRETA CFA (12 juin 2026)

- Le carré « GLM » de la maquette est remplacé par le **logo officiel du réseau GRETA CFA — Académie de Lyon** (Marianne + bandeau réseau) dans le header et sur la page de garde du PDF
- Asset : `src/assets/logo-greta.png` (483 Ko — PNG 4096×1234 extrait du SVG fourni ; la source `logo.svg` reste à la racine, ignorée par git). ⚠ À optimiser plus tard côté **UI** : une version redimensionnée (~800 px) ferait gagner ~400 Ko au premier chargement. _Le PDF n'utilise plus ce fichier depuis le 3 juillet 2026 (en-tête scindé en 2 assets légers, cf. plus haut)_

#### Répartition des apprenti·e·s entre coordos (12 juin 2026 — retours coordonnateurs pédagogiques)

**Chaque coordo ne voit que les apprenti·e·s de son périmètre ; l'admin voit tout et répartit** :

- **Modèle** : `Apprenti.coordoId` optionnel — affecté par l'**admin seul** (nouvelle colonne « Coordinateur·rice » dans `/admin/affectations`, en lecture seule pour le coordo). Hors verrou d'affectation : la répartition est administrative, elle ne touche aucune donnée pédagogique. Un·e apprenti·e sans coordo n'est visible que de l'admin
- **Filtre partout** : tableau de bord, gestion des utilisateurs et gestion des affectations — les listes d'apprenti·e·s du coordo sont restreintes à son périmètre (`apprentisAccessibles` bascule de `Coordo.formationIds` vers `coordoId` ; `formationIds` reste utilisé pour l'accès Pronote/établissements)
- **Création** : un coordo qui crée un·e apprenti·e se l'affecte automatiquement ; l'admin choisit via un champ dédié de la modale (« — Aucun·e — » possible)
- **Sélecteur de coordo actif** (composant partagé `SelecteurCoordoActif`, rôle coordo, pattern du sélecteur de maître) : bascule Martine LEFÈVRE ↔ Bernard PETIT pour démontrer les périmètres. Présent sur le **tableau de bord** mais aussi sur les pages **gestion des affectations** et **gestion des utilisateurs** — on peut donc changer de périmètre sans repasser par l'accueil (retour coordo : « je ne pouvais pas changer de coordo depuis la page Affectations »)
- Fixtures : 2ᵉ coordo **Bernard PETIT** — Martine suit Le Gourmet (Léa, Théo, Sofia), Bernard la Brasserie du Rhône (Minh, Aya, Luca)
- Bump `livret-utilisateurs` v3 → v4 (reset)
- +2 tests unitaires, +2 scénarios E2E (répartition par l'admin → périmètres respectifs ; bascule de périmètre directement depuis la page Affectations) et 4 tests E2E adaptés

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
- **Suivi 15 juin 2026 — harmonisation** : à la livraison de ce chantier, seuls certains livrets de démo avaient les 3 périodes matérialisées (Minh 0, Sofia 1, Aya 2) — reliquat de l'ancien modèle « fiches par livret ». Désormais **tous** les livrets de la promo héritent des 3 périodes (Minh/Sofia/Aya complétés en brouillon vierge), conformément au modèle. Helper `creerFichePeriodeVierge` extrait de `creerLivretVierge` et réutilisé par les fixtures ; le cas pédagogique « démarrage » redéfini (« aucune fiche **entamée** » au lieu de « 0 fiche », sinon il devenait inatteignable) ; bump `livret-donnees` v16 → v17 (reset)

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
- **Suivi 15 juin 2026 — modalité + verrou par signature** : chaque événement entretien tripartite porte désormais une **modalité de déroulement** (`EvenementOrganisationSuivi.modalite`) — E1 imposé en **présentiel**, E2..E4 au choix (sélecteur présentiel / distanciel directement sur la fiche de suivi). Et dès qu'un entretien est **signé par les 3 parties**, sa fiche de suivi est **entièrement figée** (titre, date, commentaire et modalité en lecture seule, sans déverrouillage — cohérent avec R9). Helpers purs `modaliteImposee` / `modaliteEffective` / `evenementFigeParSignature` ; modalité reflétée dans l'export PDF ; bump `livret-donnees` v17 → v18 (reset). Fixture : l'E2 de Léa est en distanciel pour la démonstration

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

### Vague 7 juillet 2026 — polarité de la rubrique « Difficultés » (demande pilote)

#### « Oui » = difficulté déclarée sur la rubrique « Difficultés éventuelles » (7 juillet 2026)

L'ancienne logique (« Oui » = situation satisfaisante) prêtait à confusion : sur cette
rubrique, l'apprenti·e répond désormais **« Oui » s'il/elle rencontre une difficulté**
(bouton **rouge** avec icône d'alerte, ligne surlignée, reprise dans le récapitulatif
« Points d'alerte » et transmission DDF / coordonnateur) et **« Non »** devient la norme
(**vert**). Les 4 autres rubriques de la trame gardent leur polarité historique
(« Non » = alerte).

- **Lib** : `QuestionTrame.alerteSiNon` généralisé en **`alerteSi: 'oui' | 'non'`** ;
  nouveau helper **`estReponseAlerte(question, valeur)`** (consommé par l'UI et le PDF) ;
  `pointsAlerteTrame` suit la polarité ; consigne de la rubrique réécrite
- **UI** : `CaseOuiNon` accepte une **polarité** (`oui-negatif` : « Oui » rouge avec
  icône d'alerte, « Non » vert avec ✓ — classes Tailwind littérales) ; surlignage ambre
  et aide contextuelle suivent `estReponseAlerte` ; bandeau d'aide de la trame
  généralisé (« Une réponse signalée en rouge indique une difficulté… »)
- **PDF** : `ChampOuiNon` colore selon la polarité (un « Oui » de difficulté est rouge)
- **Fixtures** : `reponsesTrameDemo(idsAlerte)` suit la polarité — la difficulté
  logement de Léa est désormais stockée `true` (même sémantique, 2 points d'alerte
  inchangés) ; bump **`livret-donnees` v26** (reset)
- Tests : **678 unitaires** (+2 : polarité par rubrique, `estReponseAlerte`) ;
  **205 E2E** inchangés (le spec `entretien-trame` couvre déjà le récapitulatif)

### Vague 7 juillet 2026 — polish typographique (demande pilote)

#### Remplacement contextuel des tirets cadratins « — » (7 juillet 2026)

Vérification globale du site : les ~160 tirets cadratins des textes affichés ont été
remplacés par une ponctuation adaptée au contexte — « : » pour les couples
libellé / détail (« Sélection validée : 5 activités sur 6 », « Aperçu prêt : … »,
raisons des verrous), « ( ) » pour les provenances et suffixes d'état
(« Via activité « X » (Période N) », « (complet ✓) », « (du … au …) »), « - » pour
les noms composés (« GRETA Lyon Métropole - Site Diderot », « - Démo ») et les
placeholders de valeur vide (« - »), « … » pour les options de select (« Choisir… »
remplace « — Choisir — »), virgule / point-virgule dans la prose des fixtures.
Libellés de la trame : « Ponctualité / Assiduité », « Autres difficultés
(précisions) ». Le PDF gardait déjà un rendu « - » (wrapper `Text` qui convertit
les « — », conservé en défense pour les saisies utilisateur) : ses sources sont
alignées. Les commentaires de code et titres de tests (non visibles) sont
inchangés. 14 specs E2E et 3 tests unitaires resynchronisés — compteurs
inchangés (676 unitaires / 205 E2E).

### Vague 7 juillet 2026 — chantier référentiels/compétences #4

#### Évaluation par activités (7 juillet 2026 — décision pilote, 9 questions de cadrage arbitrées)

Certaines formations ne se prêtent pas à une évaluation « par compétences » : le tuteur
évalue alors des **activités** (Q8 : même échelle 4 niveaux), le **référentiel de
compétences restant impératif** — la Synthèse reste PAR COMPÉTENCES, alimentée « par le
prisme des activités ». Arbitrages pilote (détail dans
[`chantier-referentiels-competences.md`](chantier-referentiels-competences.md)) :
fichier = activités seules, **mapping 100 % dans l'UI** (Q1) ; **bascule du mode
verrouillée dès la première saisie signée** dans la promo, les deux sens (Q2) ;
projection **last-write-wins chronologique** avec provenance, **écrasement manuel
conservé** (Q3) ; la sélection §12 devient une **sélection d'activités aux mêmes
règles**, attitudes par période inchangées (Q4) ; **activité libre autorisée** (Q5) ;
actions rendant le balayage incomplet **bloquées** (Q6) ; **pas de seuil** d'activités
(Q7) ; **la promo CAP Cuisine passe en mode activités** (Q9).

- **Modèle** : `ModeleActivites` (id, nom, `referentielId`, `activites[]`) / `Activite` (code, libellé, description?, **`competenceIds[]`** — mapping) ; `Formation.modeEvaluation?` (`'competences'` \| `'activites'`) + `Formation.modeleActivitesId?` ; `LigneSuiviEntreprise.activiteId?` (exclusif de `competenceId` ; `libelleLibre` = activité libre non projetée) ; `Livret.selectionActivitesEntreprise` (type partagé avec la sélection de compétences — mêmes helpers de validation / invalidation R10)
- **Libs pures (TDD)** : **`import-modele-activites`** (CSV/XLSX 1-3 colonnes, libellé maître, pipeline partagé avec les référentiels), **`balayage-referentiel`** (`calculerBalayage` : couvertes / manquantes / orphelines, `complet` hors exclusions), **`projection-activites`** (`projeterActivites` : LWW chronologique toutes activités confondues, `'non-fait'` ignoré, provenance `activiteId` + `periodeEntreprise` — compatible `valeurEffective` / confirmation d'écrasement), **`mode-evaluation`** (`peutBasculerMode` — verrou « première saisie signée » + balayage complet + concordance modèle/référentiel ; `peutReimporterReferentiel`, `peutChangerReferentielFormation`, `peutReactiverCompetence`), **`modele-activites-verrou`** (suppression bloquée si rattaché, remplacement bloqué en mode activités), **`selection-activites-entreprise`** (`realignerSurModele`, `competencesCouvertesParSelection`, restriction de la Synthèse), **`validation-import-modele-activites`** (formation cible obligatoire, nom `Activites_<intitulé>_<date>`) ; `validerSignature` prend le mode (message maître « ≥ 1 activité » — même prédicat)
- **Droits** : **`admin.activites.gerer`** (coordo + admin — ingénierie de formation) ; **`fiche.activites`** (maître seul — miroir de `fiche.evaluation-entreprise`)
- **Stores** : nouveau **`useActivitesStore`** (`livret-activites` v1 — CRUD modèles, `setMappingActivite` gardé par le balayage quand une formation est en mode activités, réimport avec cascade de réalignement) ; `useFormationsStore` : **`setModeEvaluation`** (gardes + réalignement « tout coché » des sélections d'activités au passage en mode activités), **`attacherModeleActivites`** (concordance de référentiel), `modifierFormation` refuse le changement de référentiel en mode activités ; `useReferentielsStore.ajouterReferentiel` retourne un `ResultatValidation` (réimport bloqué en mode activités) et `basculerExclusionCompetence` refuse la réactivation d'une compétence non mappée ; `useLivretStore` : sélection d'activités (toggle / set / invalidation R10 / réalignements), `ajouterLigneActiviteEntreprise`, **les DEUX sélections validées à la 3ᵉ signature de l'entretien** ; cascades à la création d'apprenti·e et au changement de formation (angle mort A du cadrage)
- **UI** : page **`/admin/activites`** (« Modèles d'activités » — sidebar coordo/admin) : cartes par modèle (**jauge de balayage** avec liste des manquantes et mappings orphelins, **éditeur de mapping** par activité en cases à cocher, **bascule du mode par formation rattachée** avec raisons de refus affichées, verrou de suppression), **`ModaleImportModeleActivites`** (formation cible obligatoire, aperçu, remplacement signalé) ; **badge du mode** sur les cartes de la page Formations ; **`SectionSelectionActivites`** à l'entretien (remplace la sélection de compétences en mode activités) ; `TableauTriColonnes` mode-aware (« Ajouter une activité… » restreint à la sélection validée, activité libre, libellés résolus dans le modèle, droit `fiche.activites`) ; Synthèse : grille restreinte aux **compétences couvertes par les activités retenues**, héritage par projection avec badge « **Via activité X — Période N** », modale d'écrasement nommant l'activité ; import référentiel bloqué pour une formation en mode activités (bandeau)
- **PDF** : `LivretPdfProps.modeleActivites?` (résolu par `useDonneesLivretPdf`) — pages de fiches entreprise en tableau « Activité \| Évaluation \| Retour », Synthèse avec colonne Source « via “activité” — Période N » (colonne élargie en mode activités)
- **Fixtures** : `modele-activites-cap-cuisine` (6 activités mappées sur les 10 compétences CAP — balayage 10/10) ; formation CAP en mode activités ; lignes des fiches CAP converties en activités (collision Luca P3 résolue par l'activité libre « Inventaire de fin de mois en économat » — cas démo Q5) ; sélections d'activités validées (a6 « desserts » écartée chez Léa/Minh/Aya), Sofia « tout coché » non validée ; BTS MHR inchangé (mode compétences, sélection d'activités vide)
- Bumps : `livret-donnees` v24 → v25, `livret-formations` v8 → v9, nouveau `livret-activites` v1 (resets)
- **Gabarit Excel à remplir** (complément post-livraison du 7 juillet) : lib `modele-xlsx-activites` (writer XLSX maison réutilisé, boucle fermée testée gabarit → réimport), bouton « Télécharger le gabarit Excel » sur la page + lien dans la modale d'import (`modele-activites.xlsx`)
- Tests : **676 unitaires** (48 fichiers — +58 sur les 7 nouvelles libs du chantier #4 +3 gabarit XLSX, droits 52, validation-signature 24) ; **205 E2E / 28 specs** (nouveau `admin-activites.spec.ts` 9 scénarios dont la boucle gabarit → réimport ; `entretien-selection-competences` refondu en mode activités ; `sprint4` adapté à la provenance de la projection ; `admin-referentiels` recentré sur le BTS)

### Vague 6 juillet 2026 — chantier référentiels/compétences #3

#### Périodes en centre simplifiées + menu « Synthèse » (6 juillet 2026 — décision pilote)

Les périodes en centre ne portent **plus aucune évaluation de compétence ni retour
apprenti** — seules restent les deux **observations de fin de période** (apprenti·e :
bloquante pour sa signature ; formateur : non bloquante) et les 2 signatures
(séquencement et R10 inchangés). Les **attitudes professionnelles** quittent l'entretien
tripartite : retenues à l'entretien (choix figé à la 3ᵉ signature, inchangé), elles sont
désormais **évaluées par le maître / tuteur à CHAQUE période en entreprise** — TOUTES
exigées pour sa signature (extension R20, décision pilote). Conséquence directe :
l'« Évaluation finale » devient « **Synthèse** », restreinte aux **compétences abordées
en stage** (sélection entreprise) avec la **colonne unique « Acquis en entreprise »**.

- **Modèle** : `LigneSuiviEntreprise.evaluationGreta` et `LigneEvaluationFinaleCompetence.acquisCentre` supprimées ; `EntretienTripartite.evaluationsAttitudes` → `FicheSuiviPeriode.evaluationsAttitudes?` (fiches entreprise uniquement) ; les fiches centre gardent le type partagé avec `suiviEntreprise: []`
- **Libs** : `synthetiserCompetences(fichesEntreprise, referentiel)` (source centre retirée), `valeurEffective` / `confirmationRequisePourEcraserHeritage` sans paramètre `colonne`, `stats-bloc` entreprise seul ; nouveaux helpers `attitudesNonEvaluees` (R20 fiche), `synthetiserAttitudes` (last-write-wins + période d'origine), `restreindreReferentielALaSelection` (grille Synthèse) ; `lignesSyntheseAttitudes(…, fichesEntreprise)` ; `attitudeEstUtilisee` lit les fiches ; `ficheEstVide` compte une évaluation d'attitude ; `validerSignature` : apprenti·e centre = observation seule, formateur centre = aucune exigence, maître entreprise = + toutes les attitudes retenues ; `validerSignatureEntretien` : l'exigence « ≥ 1 attitude évaluée » disparaît (le CHOIX non vide reste exigé)
- **Droits** : **`fiche.attitudes`** (maître seul) remplace `entretien.attitudes` ; `fiche.evaluation-greta` et `grille-competences.centre` supprimées
- **Store** : `setEvaluationAttitudeFiche` (garde : attitude retenue), mutations de lignes sans paramètre `lieu` (entreprise uniquement), `setEvaluationAttitude` (entretien) retirée ; `useAttitudesStore.supprimerAttitude` bloque sur les évaluations des fiches
- **UI** : nouveau composant **`SectionAttitudesFiche`** (échelle ++/+/-/--, compteur « il reste N attitudes à évaluer avant votre signature ») ; fiche centre = observations + signatures (plus de `TableauTriColonnes`, déparamétré de `lieu`) ; page **`Synthese.tsx`** (route `/livret/synthese`, redirection depuis l'ancienne URL, libellés sidebar / tableau de bord apprenti·e), grille restreinte à la sélection (les compétences non sélectionnées disparaissent — l'affichage grisé « saisie historique » disparaît avec elles), `SyntheseBloc` à barre unique, `SyntheseAttitudes` avec source (« Entretien tripartite » / « Période N »)
- **PDF** : pages fiches centre réduites aux observations, attitudes de la période sur chaque page de fiche entreprise, page « Synthèse » à colonne unique restreinte à la sélection avec colonne « Source » (Période N / final), attitudes en tableau « Dernier niveau / Source » — livret de démo 12 → 11 pages
- **Fixtures** : fiches entreprise signées par le maître → toutes les attitudes retenues évaluées (cohérence R20) ; Léa P3 (2 restantes) et Camille P3 (3 restantes) partielles — cas démo du blocage ; Camille a10 « - » en P1 puis « + » en P2 (démo last-write-wins) ; 4 fiches centre réduites aux observations
- Bumps : `livret-donnees` v23 → v24 (reset)
- Tests : **611 unitaires** (40 fichiers — validation-signature 22, attitudes 21, selection-competences 36, transitions-fiche 31, synthese-evaluation 15, regles-entretien 19, droits 49) ; **196 E2E / 27 specs** (sprint4 refondu sur la Synthèse + redirection, fiches centre simplifiées + signature formateur non bloquée, attitudes évaluées sur la fiche avec compteur R20)

### Vague 6 juillet 2026 — chantier référentiels/compétences #2

#### Limite des lignes évaluables par référentiel (6 juillet 2026 — décision pilote)

Au-delà de **40 compétences évaluables**, la saisie devient trop longue pour le tuteur
lors des périodes en entreprise. Arbitrages pilote : seules les **feuilles** comptent
(les blocs / sous-familles sont des regroupements d'affichage) ; l'agrégation n'est
proposée que s'il existe un niveau intermédiaire (3 niveaux) ; les exclues sont
**conservées et réactivables** ; le garde-fou s'applique **à l'import uniquement**.

- **Modèle** : `Competence.exclue?: boolean` — feuille conservée mais retirée de toutes les vues d'évaluation via `referentielEvaluable` (grilles, fiches, sélection entreprise, PDF, cascades de réalignement)
- **Lib pure `limite-referentiel`** (24 tests TDD) : `compterCompetencesEvaluables`, `referentielEvaluable`, `peutAgregerAuNiveauSuperieur` / `agregerAuNiveauSuperieur` (sous-famille → ligne évaluable, libellés fins en description, fusion des runs scindés), `appliquerExclusions`, `validerSeuil` (1..999), `peutBasculerExclusion` (≥ 1 évaluable, réactivation refusée au-delà du seuil)
- **Import** (`ModaleImportReferentiel`) : bandeau de dépassement + option A « Garder le niveau supérieur (M lignes) » (si 3 niveaux) + option B cochage manuel avec compteur live « X / seuil » — bouton Importer bloqué tant que le seuil n'est pas respecté
- **Post-import** (`ModaleCompetencesEvaluables`, page Référentiels) : cases à cocher par bloc/sous-famille, gardes du store (`basculerExclusionCompetence`), réalignement des sélections non validées des formations rattachées (même cascade qu'un réimport) ; cartes « X compétences évaluables (+Y exclues) », exclues barrées dans « Voir les compétences »
- **Seuil paramétrable** : nouveau store `useParametresStore` (`livret-parametres` v1, défaut 40), ressource **`admin.parametres.gerer`** (admin seul) — encart sur la page Référentiels (input admin / lecture seule coordo)
- Bumps : `livret-referentiels` v3 → v4 (reset fixtures — inchangées, toutes sous le seuil)
- Tests : **602 unitaires** (40 fichiers — +24 `limite-referentiel`, +1 droits) ; **193 E2E / 27 specs** (nouveau spec `limite-referentiel.spec.ts` : 4 scénarios — seuil admin/coordo, import 2 niveaux > 40 avec cochage, agrégation 3 niveaux, seuil abaissé + gestion post-import)

### Vague 6 juillet 2026 — chantier référentiels/compétences #1

#### Entretien tripartite unique et obligatoire (6 juillet 2026 — décision pilote)

Première modification du chantier référentiels/compétences : **il n'y a plus qu'un seul
entretien tripartite obligatoire** — les suivis ultérieurs se font via les **fiches de
suivi existantes**. Toutes les mentions des entretiens 2 à 4 sont supprimées.

- **Modèle** : `Livret.entretiens: Record<1..4, EntretienTripartite | null>` → `Livret.entretien: EntretienTripartite | null` ; suppression de `NumeroEntretien`, `NUMEROS_ENTRETIEN`, `ModaliteEntretien`, `Formation.nombreEntretiens`, `Formation.questionsRetirees` ; motif d'organisation du suivi unique **`entretien-tripartite`** (ex `entretien-tripartite-{1..4}`)
- **Type `EntretienTripartite` allégé** : l'entretien unique repose sur la **trame officielle GRETA** (« première visite ») — les champs `questionsApprentiSelectionnees` / `questionsMaitreSelectionnees` / `questionsImposees` / `questionsObligatoires` / `reponsesApprenti` / `reponsesMaitre` / `demarchesAdministratives` / `conditionsPratiques` / `aidesDemandees` (qui ne servaient que les E2-E4) disparaissent ; restent `dateEntretien`, `reponsesTrame`, `evaluationsAttitudes`, `appreciationMaitre`, `commentaires`, `signatures` (+ représentant légal)
- **Banque de questions supprimée** (arbitrage pilote — plus aucun consommateur) : page admin `/admin/banque-questions`, `useBanqueQuestionsStore`, `ModaleQuestion`, lib `questions-entretien`, ressources de droits `entretien.questions-*` / `entretien.demarches-administratives` / `entretien.conditions-pratiques` / `entretien.aides-demandees` / `admin.banque-questions.gerer`
- **Modalité présentiel/distanciel supprimée** (arbitrage pilote) : elle ne distinguait E1 (présentiel imposé) des E2-E4 (au choix) — l'entretien unique se tient en présentiel, comportement inchangé
- **Libs simplifiées** : `regles-entretien` (plus de séquencement — R6 devient « un seul entretien par livret » ; `validerSignatureEntretien` sans banque : apprenti·e et formateur signent sans exigence, le maître garde ≥ 1 critère + ≥ 1 attitude ; `calculerProgression` retirée), `organisation-suivi` (`estMotifEntretienTripartite`, catalogue à 8 motifs), `alertes` / `pilotage` / `recap-apprenti` / `etat-livret` / `affectation-verrou` sur l'entretien unique ; suppression de `nombre-entretiens` ; renommage `trame-entretien-1` → **`trame-entretien`** (exports sans suffixe E1 ; ids de questions `e1-*` conservés stables)
- **UI** : route **`/livret/entretien`** (sans `:numero`), page à trame unique, lien sidebar unique « Entretien tripartite », suppression de `SectionApprenti` / `SectionMaitre` / `SectionFormateur` / `EntretienProgression` / `SectionTrameEntretien1` → **`SectionTrameEntretien`**, modale Planning sans section « Entretiens tripartites », synthèse des attitudes à **colonne unique**, cartes d'organisation du suivi sans sélecteur de modalité
- **PDF** : une seule section entretien (trame), variante d'export `{ type: 'entretien' }` sans numéro, tableau de synthèse des attitudes à colonne unique
- **Fixtures** : les 8 livrets passent à l'entretien unique (Camille : E1 conservé, E2/E3 supprimés) ; **Yanis** gagne un événement « Entretien Tripartite » planifié non initialisé (fait vivre l'alerte « à initialiser » chez Marc TISSIER)
- Bumps : `livret-donnees` v22 → v23, `livret-formations` v7 → v8 (reset) ; clé localStorage `livret-banque-questions` orpheline (ignorée)
- Tests : **577 unitaires** (39 fichiers — suppression de `nombre-entretiens` 12 et `questions-entretien` 21, refontes `regles-entretien` 30 → 20, `organisation-suivi` 41 → 28, `droits` 51 → 50, `pilotage` 7 → 6, `recap-apprenti` 10 → 9) ; **189 E2E / 26 specs** (suppression de `banque-questions.spec.ts` et `entretiens-multiples.spec.ts`, renommage `entretien-1-trame` → `entretien-trame`, `signature-tactile` / `attitudes` / `sprint3` rejoués sur l'entretien de Sofia)

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
| R15     | Fiche signée = toutes les signatures du lieu (entreprise : apprenti·e + maître / tuteur — 1ᵉʳ juillet 2026 ; centre : apprenti·e + formateur)                                          | ✓ par lieu                                                |
| R16     | brouillon → en-cours auto                                                                                                                                                             | ✓ 2 tests                                                 |
| R17     | 15 j sans modif → verrouillée                                                                                                                                                         | ✓ 3 tests + bouton manuel                                 |
| R18     | Signer son propre slot                                                                                                                                                                | ✓ matrice                                                 |
| R19     | Horodatage ISO 8601 au clic                                                                                                                                                           | ✓ dans `signer()`                                         |
| **R20** | **Champs requis avant signature** (juillet 2026 : au centre, observation apprenti·e seule — le formateur signe sans exigence ; en entreprise, maître = ≥ 1 compétence abordée + observation + **TOUTES les attitudes retenues évaluées** ; entretien : ≥ 1 critère d'appréciation + choix des attitudes non vide) | ✓ 22 tests fiche + R20 entretien dans `regles-entretien`  |
| **R21** | **Retrait signature impossible**                                                                                                                                                      | ✓ 6 tests TDD + bugfix UI                                 |
| **R22** | **Clôture livret**                                                                                                                                                                    | ✓ 14 tests TDD + bandeau 4 états                          |
| R23     | Synthèse temps réel                                                                                                                                                                   | ✓ recalcul à chaque render                                |
| R24     | Apprenti·e consulte à tout moment                                                                                                                                                     | ✓ matrice + bandeau lecture                               |

---

## 6. Tests (678 unitaires + 205 E2E)

### Tests unitaires Vitest (48 fichiers de test)

| Fichier                                        | Tests  | Périmètre                                                                                                                                                           |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/droits.test.ts`                           | 49     | Matrice des ressources × 5 rôles (organisation-suivi partagée, `entretien.gestion`, **co-saisie des champs du maître par le formateur (1ᵉʳ juillet)**, **`fiche.attitudes` maître seul (6 juillet — remplace `entretien.attitudes` et `grille-competences.centre`)**) |
| `lib/selection-attitudes.test.ts`              | 9      | Choix des attitudes à l'entretien : verrou 3ᵉ signature + toggle + filtre catalogue (13 juin 2026)                                                                  |
| `lib/transitions-fiche.test.ts`                | 31     | R15/R16/R17/R21 par lieu — **2 signataires en entreprise (1ᵉʳ juillet 2026)** ; **une évaluation d'attitude sort du brouillon (6 juillet 2026)**                     |
| `lib/validation-signature.test.ts`             | 22     | R18/R20 par lieu — **centre : observation apprenti·e seule, formateur sans exigence ; entreprise : TOUTES les attitudes retenues exigées pour le maître (6 juillet 2026)** |
| `lib/regles-periode.test.ts`                   | 36     | R11/R12/R13/R14 + séquencement de visibilité par lieu (**2 signatures débloquent la suivante — 1ᵉʳ juillet 2026**)                                                  |
| `lib/regles-entretien.test.ts`                 | 19     | R6 (entretien unique)/R7/R8/R9 + signature maître (≥ 1 critère + choix des attitudes non vide — leur évaluation vit sur les fiches depuis le 6 juillet 2026)        |
| `lib/trame-entretien.test.ts`                  | 11     | Trame officielle de l'entretien : réponses par rubrique + points d'alerte `pointsAlerteTrame` (16 juin 2026)                                                        |
| `lib/attitudes.test.ts`                        | 21     | Catalogue par défaut (12 attitudes) + `attitudeEstUtilisee` (fiches) + **`attitudesNonEvaluees` (R20 fiche) + `synthetiserAttitudes` (last-write-wins + période) + lignes de synthèse (6 juillet 2026)**  |
| `lib/recap-apprenti.test.ts`                   | 9      | **Tableau de bord apprenti·e (18 juin) : échéance de l'entretien, période en cours, progressions, jours restants**                                                  |
| `lib/synthese-evaluation.test.ts`              | 15     | Last-write-wins fiches entreprise → Synthèse + confirmation avant écrasement d'un héritage (**source centre retirée le 6 juillet 2026**)                            |
| `lib/stats-bloc.test.ts`                       | 6      | Compte des niveaux par bloc                                                                                                                                         |
| `lib/import-referentiel.test.ts`               | 27     | Parsing CSV (encodage CP1252, 2/3 cols + **mixte 2/3 niveaux**)                                                                                                                             |
| `lib/cloture-livret.test.ts`                   | 14     | R22                                                                                                                                                                 |
| `lib/deverrouillage-fiche.test.ts`             | 8      | R10                                                                                                                                                                 |
| `lib/apprentis-accessibles.test.ts`            | 33     | Filtre par rôle (R3) + tri + recherche + **référent direct hors promoIds** + **groupement par formation** + **périmètre du 2ᵉ formateur (3 juillet 2026)**          |
| **`lib/pilotage.test.ts`**                      | **6**  | **KPI du tableau de bord coordo/admin : fiches signées, entretien réalisé/attendu (1 par livret), alertes R7, clôtures (3 juillet 2026)** |
| **`lib/alertes.test.ts`**                       | **12** | **Centre d'alertes par rôle : signatures attendues, verrouillages, initialisations, R7, affectations incomplètes (3 juillet 2026)** |
| `lib/maitres-apprenti.test.ts`                 | 8      | Double tutorat : ids des maîtres d'un·e apprenti·e + appartenance (juin 2026)                                                                                       |
| `lib/signature-tactile.test.ts`                | 8      | Longueur de tracé + seuil de signature significative (juin 2026)                                                                                                    |
| `lib/etat-livret.test.ts`                      | 13     | Cas pédagogiques 6 apprenti·e·s                                                                                                                                     |
| `lib/validation-apprenti.test.ts`              | 11     | Saisie apprenti·e + second maître ≠ principal (juin 2026)                                                                                                           |
| `lib/validation-utilisateur-staff.test.ts`     | 8      | Validation maître (entreprise + fonction — chantier #4)                                                                                                             |
| `lib/affectation-verrou.test.ts`               | 9      | Verrou affectation (fiches travaillées uniquement depuis le 11 juin 2026)                                                                                           |
| `lib/validation-formation.test.ts`             | 9      | Validation formation                                                                                                                                                |
| `lib/formation-verrou.test.ts`                 | 4      | Verrou suppression formation                                                                                                                                        |
| `lib/validation-import-referentiel.test.ts`    | 11     | Saisie d'import                                                                                                                                                     |
| `lib/referentiel-verrou.test.ts`               | 4      | Verrou suppression référentiel                                                                                                                                      |
| `lib/parser-xlsx.test.ts`                      | 16     | Parser XLSX (Node env pour fflate)                                                                                                                                  |
| `lib/selection-competences-entreprise.test.ts` | 36     | Sélection par livret CDC v1.5 §12 + tout activé par défaut + **réalignement sur changement de référentiel (1ᵉʳ juillet 2026)** + **`restreindreReferentielALaSelection` (grille Synthèse, 6 juillet 2026)** |
| `lib/validation-fiche-periode.test.ts`         | 16     | Saisie fiche + verrous                                                                                                                                              |
| `lib/organisation-suivi.test.ts`               | 28     | Catalogue 8 motifs + motifs par rôle + verrou de suppression + **verrou de la fiche par signature de l'entretien**                                                   |
| `lib/etablissement-verrou.test.ts`             | 4      | Verrou suppression établissement                                                                                                                                    |
| `lib/etablissements-accessibles.test.ts`       | 8      | Filtrage par rôle Pronote                                                                                                                                           |
| **`lib/validation-periode-formation.test.ts`** | **18** | **Chantier #1 : R11/R12 + verrou modif/suppression période formation**                                                                                              |
| **`lib/generer-xlsx-modele.test.ts`**          | **13** | **Chantier #5 : round-trip XLSX + date Excel + serial conversion**                                                                                                  |
| **`lib/import-utilisateurs.test.ts`**          | **23** | **Chantier #5 : parsing 3 modèles + validation + politique tout-ou-rien**                                                                                           |
| **`lib/grouper-competences.test.ts`**          | **3**  | **Groupement des compétences par sous-famille (ordre source préservé, feuilles directes intercalées)** |
| **`lib/entreprise-verrou.test.ts`**            | **2**  | **Verrou de suppression d'une entreprise rattachée à un·e apprenti·e** |
| **`lib/historique-entreprise.test.ts`**        | **6**  | **Traçabilité des affectations d'entreprise (création, changement, anti-doublon)** |
| **`lib/balayage-referentiel.test.ts`**         | **11** | **Jauge de balayage du mapping (couvertes / manquantes / orphelines, exclusions — chantier #4)** |
| **`lib/projection-activites.test.ts`**         | **6**  | **Projection activités → compétences (LWW chronologique, provenance, non-fait ignoré — chantier #4)** |
| **`lib/mode-evaluation.test.ts`**              | **16** | **Verrous du mode d'évaluation (première saisie signée, balayage complet, gardes référentiel — chantier #4)** |
| **`lib/modele-activites-verrou.test.ts`**      | **4**  | **Verrous suppression / remplacement d'un modèle d'activités (chantier #4)** |
| **`lib/import-modele-activites.test.ts`**      | **9**  | **Pipeline d'import des modèles d'activités (1-3 colonnes, codes générés, avertissements — chantier #4)** |
| **`lib/selection-activites-entreprise.test.ts`** | **8** | **Réalignement de la sélection d'activités sur le modèle + restriction de la Synthèse (chantier #4)** |
| **`lib/validation-import-modele-activites.test.ts`** | **4** | **Validation du formulaire d'import (formation cible obligatoire, nom canonique — chantier #4)** |

_Les modules `creation-livret.ts`, `couleurs-role.ts` et `utils.ts` sont couverts indirectement via les tests E2E._

### Tests E2E Playwright (28 specs)

205 tests (Chromium desktop + mobile Pixel 5). **Vague du 7 juillet 2026 (évaluation par activités — chantier #4)** : nouveau spec `admin-activites.spec.ts` (8 scénarios — accès refusé formateur, carte du modèle CAP avec jauge 10/10 et badge de mode, verrou de bascule « saisie signée » (Q2), import d'un modèle pour le BTS avec balayage incomplet → bascule désactivée, progression de la jauge dans l'éditeur de mapping, badges de mode sur la page Formations, réimport de référentiel bloqué en mode activités (Q6), verrou de suppression du modèle rattaché) ; `entretien-selection-competences.spec.ts` refondu — la promo CAP vit en mode activités (section « Activités prévues en entreprise », bandeaux et sélecteur « Ajouter une activité » sur les fiches, Synthèse restreinte aux compétences couvertes avec provenance « Via activité — Période N »), la mécanique compétences (réalignement au réimport) rejouée sur le BTS via Yanis ; `sprint4-evaluation-finale.spec.ts` adapté à la provenance de la projection (badge + modale d'écrasement nommant l'activité) ; `admin-referentiels.spec.ts` : les imports « pour une formation » ciblent le BTS (le référentiel CAP est figé). **Vague du 6 juillet 2026 (périodes en centre simplifiées + Synthèse)** : `sprint4-evaluation-finale.spec.ts` refondu sur la page « Synthèse » (+ 1 scénario « redirection de l'ancienne URL », + 1 « plus de colonne Acquis en centre », attitudes agrégées par période avec badge « Période N ») ; `fiches-periodes-centre.spec.ts` : fiche centre réduite aux observations (+ 1 scénario « le formateur signe sans exigence, l'apprenti·e reste bloqué·e ») ; `attitudes.spec.ts` : évaluation déplacée sur la fiche entreprise (compteur « il reste N attitudes », raison R20 « toutes les retenues ») ; `entretien-selection-competences` : la compétence non sélectionnée disparaît de la grille ; libellé/route « Synthèse » propagés (`sprint1`, `sprint5`, `pilotage-alertes`, `audit-mobile`) ; marqueur d'initialisation d'entretien déplacé vers la section de choix (`signature-tactile`, `sprint3`). **Vague du 6 juillet 2026 (limite des lignes évaluables)** : nouveau spec `limite-referentiel.spec.ts` (4 scénarios — seuil admin/coordo, import 2 niveaux > 40 avec cochage manuel, agrégation au niveau supérieur, seuil abaissé + gestion post-import des exclusions). **Vague du 6 juillet 2026 (entretien unique)** : suppression de `banque-questions.spec.ts` et `entretiens-multiples.spec.ts`, renommage `entretien-1-trame.spec.ts` → `entretien-trame.spec.ts`, route unique `/livret/entretien` partout ; `signature-tactile` / `attitudes` / `sprint3-droits-entretien` rejoués sur l'entretien frais de Sofia (celui de Léa est signé 3/3) ; `pilotage-alertes` adapté (alerte « à initialiser » portée par Yanis, entretien unique de Camille) ; `organisation-suivi` sans modalité (9 événements chez Léa). Ajouts de juin 2026 : 2 scénarios « ajout de compétence à la fiche ouvert au tuteur » + 1 « disparition de la colonne Évaluation GRETA CFA sur la fiche » (`entretien-selection-competences.spec.ts`), 3 scénarios « affectation des questions par le coordo », 5 scénarios « jusqu'à 4 entretiens », 3 scénarios « événements gérés par coordo/admin + liseré par rôle », 2 scénarios « motifs par rôle + séquencement », 4 scénarios « attitudes professionnelles » (`attitudes.spec.ts`), 1 scénario « confirmation avant écrasement d'un héritage », 1 scénario « bascule de périmètre coordo depuis la page Affectations », 2 scénarios « modalité présentiel/distanciel + verrou de la fiche de suivi par signature », 1 scénario « suppression d'un événement réservée au coordo/admin », 5 scénarios « exports PDF par période / entretien / fiches de suivi » (`export-pdf.spec.ts` — boutons par rôle + téléchargements non vides), 1 scénario « séquencement de visibilité des périodes » (accès direct à une période masquée bloqué), 5 scénarios « refonte de l'entretien 1 sur la trame officielle GRETA » (`entretien-1-trame.spec.ts` — rubriques, points d'alerte, représentant légal). **Ajouts des 17-18 juin 2026** : 4 scénarios « périodes en centre de formation » (`fiches-periodes-centre.spec.ts` — planning centre, page liste / détail, export PDF), 1 « forçage de l'affichage des périodes par le coordo », 1 « banque de questions réservée à l'admin », `tableau-de-bord-6-apprentis` adapté au récap apprenti·e, `attitudes` / `sprint4-evaluation-finale` adaptés au catalogue 12 attitudes. **Ajouts des 27-28 juin 2026** : nouveau spec `entreprises.spec.ts` (8 scénarios — CRUD entreprises, verrou, choix dans la modale apprenti·e, récap dashboard, traçabilité du changement, changement depuis Affectations) ; `admin-referentiels` / `entretien-selection-competences` / `sprint4-evaluation-finale` adaptés à l'affichage « libellé seul ». **Ajouts du 1ᵉʳ juillet 2026** : 2 scénarios « réalignement de la sélection + co-saisie du formateur » (`entretien-selection-competences`, `sprint3-droits-entretien`), 1 « aperçu lecture seule de l'entretien » (`entretiens-multiples`), 1 « tableau de bord groupé par formation » (`tableau-de-bord-6-apprentis`), 1 « pas d'erreur rouge avant tentative » + 1 « la modale Planning n'expose plus les questions » (`fiches-periodes`, `banque-questions`), 1 « suivi GRETA CFA absent de toutes les fiches (entreprise et centre) », 1 « le formateur ne signe plus mais verrouille », 1 « 3 commentaires individuels sur l'E1 » (`entretien-1-trame`) ; `sprint2-coedition` adapté aux 2 signataires. **Ajouts du 3 juillet 2026** : 1 scénario « les 4 attitudes obligatoires ouvrent la synthèse, au-dessus des optionnelles » (`sprint4-evaluation-finale.spec.ts`) ; nouveau spec `pilotage-alertes.spec.ts` (6 scénarios — KPI coordo + mini-stats par groupe, centre d'alertes formateur, navigation au clic, bascule de formateur Marc TISSIER, alertes du périmètre BTS, référentiel 3 niveaux + E3 sur le livret de Camille) ; `tableau-de-bord-6-apprentis` / `admin-affectations` / `admin-utilisateurs` adaptés aux 8 apprenti·e·s. Quelques specs ont été adaptés aux refontes :

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
├── e2e/                            # tests Playwright (28 specs)
├── playwright.config.ts            # 2 projets (desktop + mobile)
├── package.json
└── src/
    ├── main.tsx, App.tsx, vite-env.d.ts
    ├── styles/index.css            # variables CSS + utilities couleur-role
    ├── types/index.ts              # modèle (CDC §7 + chantiers mai 2026)
    ├── lib/                        # 51 modules + 48 fichiers tests
    │   ├── droits.ts               # matrice §6 (50 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    # R15/R16/R17/R21
    │   ├── validation-signature.ts # R18/R20 par lieu (+ attitudes retenues, juillet 2026)
    │   ├── regles-periode.ts       # R11/R12/R13/R14
    │   ├── regles-entretien.ts     # R6 (entretien unique)/R7/R8/R9
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
    │   ├── selection-activites-entreprise.ts    # sélection d'activités + restriction Synthèse (chantier #4)
    │   ├── limite-referentiel.ts   # limite des lignes évaluables (juillet 2026)
    │   ├── import-modele-activites.ts     # pipeline CSV/XLSX des modèles d'activités (chantier #4)
    │   ├── validation-import-modele-activites.ts # formation cible obligatoire (chantier #4)
    │   ├── balayage-referentiel.ts # jauge de couverture du mapping (chantier #4)
    │   ├── projection-activites.ts # projection activités → compétences, LWW + provenance (chantier #4)
    │   ├── mode-evaluation.ts      # verrous du mode d'évaluation (chantier #4)
    │   ├── modele-activites-verrou.ts     # verrous suppression/remplacement d'un modèle (chantier #4)
    │   ├── modele-xlsx-activites.ts       # gabarit Excel à remplir pour l'import (chantier #4)
    │   ├── organisation-suivi.ts   # motif entretien unique (6 juillet 2026)
    │   ├── trame-entretien.ts      # trame officielle de l'entretien (ex trame-entretien-1)
    │   ├── etablissement-verrou.ts
    │   ├── etablissements-accessibles.ts
    │   ├── generer-xlsx-modele.ts  # chantier #5 — XLSX writer maison
    │   ├── import-utilisateurs.ts  # chantier #5 — pipeline import
    │   ├── grouper-competences.ts  # regroupement par sous-famille (27 juin)
    │   ├── entreprise-verrou.ts    # verrou suppression entreprise (28 juin)
    │   ├── historique-entreprise.ts # traçabilité des affectations (28 juin)
    │   ├── pilotage.ts             # KPI coordo/admin du tableau de bord (3 juillet)
    │   ├── alertes.ts              # centre d'alertes par rôle (3 juillet)
    │   ├── couleurs-role.ts        # polish — mappings Tailwind par rôle
    │   ├── __fixtures__/
    │   └── utils.ts
    ├── store/                      # 11 stores Zustand persistés
    │   ├── useUserStore.ts
    │   ├── useLivretStore.ts       # v25 — sélection d'activités + lignes activiteId (chantier #4)
    │   ├── useApprentiActifStore.ts
    │   ├── useUtilisateursStore.ts # v6 — +historiqueEntreprises +promo BTS (8 apprenti·e·s)
    │   ├── useFormationsStore.ts   # v9 — modeEvaluation + modeleActivitesId (chantier #4)
    │   ├── useReferentielsStore.ts # v4 — CAP Cuisine + BTS MHR + exclusions (limite lignes évaluables)
    │   ├── useActivitesStore.ts    # v1 — modèles d'activités + mapping (chantier #4)
    │   ├── useParametresStore.ts   # v1 — seuil de lignes évaluables (admin, juillet 2026)
    │   ├── useAttitudesStore.ts    # v3 — catalogue 12 attitudes (a1..a4 retirées)
    │   ├── useEtablissementsStore.ts # v1
    │   └── useEntreprisesStore.ts  # v1 — entreprises d'accueil (28 juin)
    ├── fixtures/                   # 8 livrets démo (6 CAP + 2 BTS MHR) + utilisateurs + formations + 2 référentiels (dont BTS 3 niveaux)
    ├── components/
    │   ├── admin/
    │   │   ├── ModaleApprenti.tsx
    │   │   ├── ModaleUtilisateurStaff.tsx   # +entreprise +fonction
    │   │   ├── ModaleFormation.tsx
    │   │   ├── ModalePlanningPeriodes.tsx   # chantier #1
    │   │   ├── ModaleImportReferentiel.tsx  # + blocage mode activités (chantier #4)
    │   │   └── ModaleImportModeleActivites.tsx # import des modèles d'activités (chantier #4)
    │   ├── layout/
    │   │   ├── AppShell.tsx                 # wrapper avec classe role-actif-X
    │   │   ├── RoleSwitcher.tsx             # icônes inactives colorées
    │   │   ├── Sidebar.tsx                  # lien entretien conditionnel + lien actif coloré
    │   │   └── BoutonReinitialiserDemo.tsx
    │   ├── common/                          # BoutonSigner (couleur rôle), BarreProgression…
    │   ├── livret/
    │   │   ├── SuiviGretaCfa.tsx            # chantier #3 — 2 zones texte
    │   │   ├── TableauTriColonnes.tsx       # fiches ENTREPRISE seules (juillet 2026)
    │   │   ├── SectionAttitudesFiche.tsx    # attitudes par période entreprise (juillet 2026)
    │   │   ├── ZoneObservation.tsx          # +icônes en-tête colorées
    │   │   ├── BlocSignatures.tsx           # icônes + ✓ Signé colorés (+ R20 attitudes)
    │   │   ├── DialogDeverrouillage.tsx
    │   │   └── ModaleFichePeriode.tsx       # legacy (chantier #1 a retiré son point d'entrée)
    │   ├── entretien/
    │   │   ├── SectionTrameEntretien.tsx    # trame officielle (rubriques + grille + alertes)
    │   │   ├── SectionSelectionCompetences.tsx
    │   │   ├── SectionSelectionActivites.tsx # sélection d'activités en mode activités (chantier #4)
    │   │   ├── SectionSelectionAttitudes.tsx
    │   │   └── BlocSignaturesEntretien.tsx  # icônes + ✓ Signé colorés (+ représentant légal)
    │   ├── evaluation/
    │   │   ├── SyntheseBloc.tsx             # barre unique entreprise (juillet 2026)
    │   │   ├── GrilleCompetences.tsx        # colonne unique, restreinte à la sélection (juillet 2026)
    │   │   ├── SyntheseAttitudes.tsx        # agrégation par période + origine (juillet 2026)
    │   │   └── BandeauCloture.tsx           # Clôturer en violet formateur
    │   └── pdf/                             # export lazy, palette alignée UI
    ├── pages/
    │   ├── TableauDeBord.tsx                # cartes avec hover couleur rôle
    │   ├── NotFound.tsx
    │   ├── OrganisationSuivi.tsx            # bouton « Ouvrir cet entretien »
    │   ├── EntretienTripartite.tsx          # route /livret/entretien (entretien unique)
    │   ├── FicheSuiviPeriodes.tsx           # lecture seule (chantier #1)
    │   ├── FicheSuiviPeriodeDetail.tsx
    │   ├── Synthese.tsx                     # ex-EvaluationFinale — /livret/synthese (juillet 2026)
    │   ├── PronoteWeb.tsx
    │   ├── AccesMobile.tsx                  # QR code d'accès (encadrement — 3 juillet)
    │   └── admin/
    │       ├── GestionUtilisateurs.tsx      # bordures gauches colorées
    │       ├── GestionFormations.tsx        # +bouton « Planning »
    │       ├── GestionAffectations.tsx
    │       ├── GestionReferentiels.tsx
    │       ├── GestionActivites.tsx         # modèles d'activités + mode d'évaluation (chantier #4)
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
npm test               # 636 tests Vitest
npm run e2e            # 196 tests E2E Playwright (build + preview + tests)
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
  'livret-parametres',
  'livret-etablissements',
  'livret-entreprises',
  'livret-attitudes',
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
- **10 stores Zustand persistés avec import croisé** : synchronisations cross-store dans les actions, cycle résolu par ESM
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
