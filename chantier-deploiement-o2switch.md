# Chantier — Déploiement o2switch (étape 2) : prérequis administratifs

**Phase lancée le 2026-07-13** (décision pilote). LE document de suivi de la
bascule VPS → o2switch : décisions, checklist des prérequis administratifs,
marqueurs du kit, brouillon de note DPO, séquence du chantier technique.

---

## 0. Décisions du 2026-07-13 (pilote)

| # | Décision | Détail |
|---|---|---|
| 1 | **Gel du périmètre fonctionnel** | La maquette (étape 1 + vagues post-livraison, dernière : réunion DG du 2026-07-13) est fonctionnellement close. Plus de vague fonctionnelle avant la bascule — sauf demande DG résiduelle de la série « en cours de recueil ». |
| 2 | **Demande 2 reportée post-déploiement** | Les entretiens individuels mi/fin de parcours (cadrés le 2026-07-12) attendent toujours les trames officielles GRETA. Ils seront implémentés **une seule fois, dans la stack cible étape 2** (backend réel), au lieu d'être codés en maquette puis portés. Arbitrages conservés : `chantier-demandes-direction-2026-07.md` (demande 2). |
| 3 | **Lancement des prérequis administratifs** | Ce document (§2). Aucun de ces lots n'écrit une ligne de code — ils se mènent en parallèle et certains ont des délais externes longs (DPO en tête). |

---

## 1. Cible et références

- **Cible pérenne** : **o2switch (application) + Nuage (fichiers)** — doctrine
  portefeuille `STACK_GRETA_LYON.md` §1.1 (fichier local, **non commité**).
  Le VPS Hostinger actuel est l'étage d'amorçage transitoire (§2.5) : il reste
  en service jusqu'à la bascule DNS, puis est décommissionné pour ce projet.
- **Kit de déploiement** : `_kit-deploiement-o2switch/` (local, **non
  commité**) — issu du projet ASR, **validé en production le 2026-06-23**.
  Runbook : `docs/DEPLOIEMENT_O2SWITCH.md` du kit.
- **Specs étape 2 déjà rédigées** : `playbook-sso-entra-greta.md` (SSO Entra),
  `chantier-creation-comptes.md` (comptes + email, décisions Mailjet actées),
  `conformite-rgpd.md` (33 obligations + réexamen mineurs), `TODO-etape-2.md`.

### ✅ Arbitrage d'architecture — TRANCHÉ le 2026-07-14 : portage Next.js

La maquette est une **SPA Vite + React sans backend** ; le kit et la doctrine
ciblent **Next.js 16 standalone + Prisma 6 + MariaDB 11.4 + Auth.js v5**.
**Décision pilote du 2026-07-14** (sur analyse du kit) : **option 1 — portage
de l'application dans Next.js 16 (App Router)**. L'option écartée : front
Vite conservé + API séparée.

Justification (analyse du kit, 2026-07-14) :

- **Le kit n'est pas un kit o2switch générique, c'est un kit Next.js** : ses
  pièces (`start.cjs` Passenger, `package-standalone.mjs`, snippets
  `next.config.ts`/Prisma, runbook + tableau de dépannage d'erreurs
  réellement rencontrées sur ASR) sont toutes spécifiques au mode
  `output: "standalone"`. L'option 2 aurait rejoué la campagne
  d'apprentissage o2switch déjà soldée : 2 applications à faire cohabiter
  sur cPanel, CORS/cookies cross-origin sur le callback OIDC, headers à
  poser à 2 endroits, auth openid-client recodée à la main, zéro runbook.
- **L'actif à préserver n'est pas le code des stores** : les 12 stores
  localStorage doivent être réécrits quoi qu'il arrive pour parler au
  serveur. Ce qui se préserve vraiment se porte aussi bien dans Next.js :
  **libs pures `src/lib/`** (R1-R24, framework-agnostiques, tests Vitest
  compris), composants de présentation, sélecteurs `data-testid` des E2E.
- Sur o2switch, **les headers de sécurité ne peuvent être posés que par
  l'application** (LiteSpeed géré par o2switch) — pattern intégré au
  snippet A du kit.

Conséquences : bootstrap par le kit (fichiers copiés, snippets fusionnés,
marqueurs §3), schéma Prisma dérivé de `src/types/index.ts` (les 12 stores
deviennent des tables), matrice `droits.ts` réappliquée **côté serveur**.
**Plan de portage : LIVRÉ le 2026-07-14** —
[`plan-portage-nextjs.md`](plan-portage-nextjs.md) (inventaire de
réutilisation, schéma cible ~22 tables, vagues V0-V7, stratégie E2E).

---

## 2. Prérequis administratifs — checklist

Responsable par défaut : **Guillaume FERRERI** (pilote, Global Admin tenant).
Les lots sont indépendants et parallélisables. Cocher + dater à l'avancement.

### Lot A — RGPD / DPO ⏸ DIFFÉRÉ à la mise en ligne (décision pilote 2026-07-14)

La demande 5 (2026-07-13) a **réintroduit les mineurs** → le critère CNIL
« personnes vulnérables » est actif et l'**AIPD redevient vraisemblablement
obligatoire** (`conformite-rgpd.md`, encadré de tête + §5).

> ⏸ **Décision pilote (2026-07-14)** : la note DPO partira une fois
> l'application en ligne — **aucune donnée d'apprenti·e réelle avant début
> septembre 2026**. Garde-fou associé : la mise **en ligne** (données de
> démo / fixtures) n'attend pas le DPO, mais la mise **en données réelles**
> (rentrée 2026) reste conditionnée à sa validation (AIPD mineurs).
> ⚠ Risque calendrier assumé : une réponse DPO peut prendre des semaines et
> l'été est une période creuse — si elle tarde, c'est l'entrée des données
> de la rentrée qui glisse, pas la mise en ligne.

- [ ] Contacter le **DPO du GRETA** : transmettre la note du §4 (brouillon prêt)
- [ ] **3ᵉ passe de `conformite-rgpd.md` avec le DPO** : requalification AIPD
      (mineurs), base légale des données des représentants légaux, mentions
      d'information spécifiques (apprenti·e·s mineur·e·s + responsables)
- [ ] **AIPD** si confirmée requise (conduite avec le DPO — modèle CNIL)
- [ ] Registre des traitements : fiche livret (+ documents nominatifs, cf.
      `STACK_GRETA_LYON.md` §7.5) transmise au DPO
- [ ] **DPA sous-traitants** : Microsoft (tenant Azure), Mailjet (à
      l'inscription — hébergement UE à vérifier), o2switch (hébergeur)
- [ ] **DPA / clause art. 28 prestataire** (développeur) intégrée à la
      convention — cf. `STACK_GRETA_LYON.md` §7.7
- [ ] Mentions légales + politique de confidentialité (pages publiques) rédigées
- [ ] Procédure incident (notification CNIL < 72 h) documentée

### Lot B — Nuage (stockage des fichiers)

- [ ] **Compte fonctionnel d'établissement** sur `apps.education.fr` (jamais
      un compte nominatif d'agent — il porte le traitement)
- [ ] **Mot de passe d'application** WebDAV généré (Paramètres → Sécurité) —
      conservé par le responsable informatique, destiné au `.env` serveur
      (jamais côté client, jamais commité)
- [ ] Dossier racine applicatif créé (`/livret-apprentissage`) — prévoir un
      sous-dossier par promo pour les documents de formation (dépôt en masse)
- [ ] Décision **sauvegarde séparée** des fichiers Nuage (hors JetBackup)
- [ ] Durées de conservation des documents définies (purge effective — §7.6)

### Lot C — Microsoft Entra ID (SSO personnels GRETA) ⏸ EN PAUSE (2026-07-14)

Procédure détaillée : `playbook-sso-entra-greta.md` phase B +
`STACK_GRETA_LYON.md` §4.4. Tenant : `GRETA CFA Lyon Métropole`
(`bc139aaa-fea0-465b-8d3d-be26ed74675d`). **Fiche d'exécution pré-remplie :
§2bis ci-dessous.**

> ⏸ Mis en pause le 2026-07-14 (réordonnancement pilote) : à dérouler **juste
> avant le chantier SSO** (étape 4 de la séquence §5), une fois le domaine
> o2switch acté — l'App Registration pourra alors être créée directement avec
> la bonne redirect URI. La fiche §2bis reste valable telle quelle.

- [ ] **App Registration dédiée** « Livret d'apprentissage — GRETA CFA Lyon
      Métropole » (single tenant, une App Registration PAR projet)
- [ ] Redirect URIs **Web** (pattern Auth.js v5 — cf. §2bis, écart E2)
- [ ] **App Roles** créés : `Admin`, `Coordo`, `Formateur` (les apprenti·e·s,
      maîtres et responsables légaux sont hors tenant → login classique,
      chantiers 2.2/2.3)
- [ ] **Client Secret** 24 mois + **rappel agenda à 18 mois** (rotation)
- [ ] Claims optionnels `given_name`, `family_name`, `email`
- [ ] **Admin consent** accordé pour l'organisation (piège P2 du playbook)
- [ ] « Affectation requise » = **No** (JIT — rôle par défaut : cf. §2bis, écart E4)
- [ ] **Client ID relevé** dans la fiche §2bis (le secret, lui, va au coffre)

### Lot D — o2switch / cPanel

Accès et identifiants : `STACK_GRETA_LYON.md` §2.4 (non commité).

- [x] **Domaine définitif ACTÉ (2026-07-14)** : `livret.gretacfalyon.com`
- [ ] Créer le sous-domaine dans cPanel (Domaines — Document Root par défaut)
- [ ] **AutoSSL** vérifié actif sur le domaine
- [ ] **Base MariaDB** créée en `utf8mb4` + collation `utf8mb4_unicode_ci`
      (⚠ pas le défaut `latin1` — piège §8.1 de la stack)
- [ ] **Utilisateur MySQL** dédié, mot de passe **alphanumérique** (piège kit)
- [ ] **Node.js App** créée : version **22.x** (⚠ pas la 10.24.1 par défaut),
      mode Production — la racine exacte sera fixée au chantier technique
- [ ] **2FA cPanel** activé sur les comptes admin
- [ ] **JetBackup** : quotidien, rétention ≥ 30 j, chiffré
- [ ] Adresse email de contact / notifications du projet créée (marqueur
      `<EMAIL-CONTACT>` — pattern ASR : `glm.livret@ac-lyon.fr` ? à valider)

### Lot E — Emails transactionnels (chantiers 2.2/2.3)

Décision « Mailjet » actée dans `chantier-creation-comptes.md` §1 (mai 2026,
formule gratuite 200 emails/jour) — **à ré-arbitrer** :

- [ ] ⚠ **Ré-arbitrage Mailjet vs SMTP académique** (découverte kit,
      2026-07-14) : ASR tourne en production sur le **relais académique**
      (`smtps.region-academique-auvergne-rhone-alpes.fr`, 587/STARTTLS,
      compte `@ac-lyon.fr` — cf. `env.example` du kit). Un sous-traitant de
      moins (pas de DPA Mailjet, pas de SPF/DKIM à poser), dossier RGPD
      allégé. La décision Mailjet prédate ce retour d'expérience. Les points
      suivants ne valent que si Mailjet est finalement confirmé :
- [ ] Compte Mailjet créé (avec l'email fonctionnel du projet)
- [ ] **Domaine d'envoi validé** : SPF + DKIM posés sur le DNS du domaine
- [ ] DPA Mailjet accepté (recoupe le lot A)
- [ ] ⚠ Re-cadrage de la **décision 7** (« majeurs uniquement », invalidée le
      2026-07-13 par la demande 5) : les mineurs et responsables légaux entrent
      au périmètre des comptes — à re-trancher avec le pilote au chantier 2.2

### Lot F — Divers

- [ ] **Trames officielles GRETA** (entretiens mi/fin de parcours) — toujours
      à obtenir, pour la demande 2 **post-déploiement**
- [ ] Sécurité VPS (PROJECT-STATUS §8.A) : mot de passe root à changer +
      passage en clé SSH — le VPS reste exposé jusqu'à la bascule
- [ ] Arbitrage **refonte du PDF d'export** (§8.D) : avant la bascule (dernier
      chantier maquette) ou après (dans la stack cible) — à trancher
- [ ] Sort des **données de démo** : a priori fixtures re-seedées dans MariaDB
      (aucune donnée réelle en maquette — rien à migrer), à confirmer

---

## 2bis. Lot C — fiche d'exécution Entra ID (2026-07-13)

Base : `playbook-sso-entra-greta.md` phase B (~20 min, portail
<https://entra.microsoft.com>, compte Global Admin). Les **4 écarts** entre le
playbook (écrit en mai 2026 pour la stack VPS/Express/openid-client) et la
doctrine o2switch (juin 2026, plus récente) sont réconciliés ici — c'est cette
fiche qui fait foi pour le livret.

### Écarts vs playbook (réconciliés)

| # | Sujet | Playbook (mai 2026) | Retenu pour le livret (doctrine o2switch) |
|---|---|---|---|
| E1 | Bibliothèque OIDC | `openid-client` v5 (D6) | **Auth.js v5**, provider `microsoft-entra-id` (`STACK_GRETA_LYON.md` §4.3 : « pas openid-client brut ») |
| E2 | Redirect URI | `https://<domaine>/auth/callback` | Pattern Auth.js : **`/api/auth/callback/microsoft-entra-id`** |
| E3 | App Roles | `Admin` / `Reader` | **`Admin` / `Coordo` / `Formateur`** (rôles internes GRETA du livret ; pas de rôle « lecteur » dans la matrice) |
| E4 | Rôle JIT par défaut | `lecteur` | ⚠ Aucun rôle du livret n'est anodin (le formateur crée apprenti·e·s et maîtres). Recommandation : « Affectation requise = No » (doctrine) MAIS l'utilisateur tenant **sans App Role** arrive sur un écran « **compte en attente d'affectation** » (aucun droit). À figer au chantier technique — sans impact sur l'App Registration. |

La phase A du playbook (DNS/Traefik/HTTPS sur VPS) ne concerne pas ce lot ;
sur o2switch elle est remplacée par cPanel/AutoSSL + middleware Next.js (§6.2
de la stack). Les phases C-E (code) relèvent du chantier technique.

### Pas-à-pas portail (valeurs pré-remplies)

1. **App registrations → + New registration**
   - Nom : `Livret d'apprentissage — GRETA CFA Lyon Métropole`
   - Supported account types : **Single tenant**
   - Redirect URI (type **Web**) :
     - `http://localhost:3000/api/auth/callback/microsoft-entra-id` (dev)
   - **Register**, puis onglet **Authentication → + Add URI** :
     - `https://livret-glm.duckdns.org/api/auth/callback/microsoft-entra-id`
       (amorçage VPS — recommandé, coût nul)
     - `https://livret.gretacfalyon.com/api/auth/callback/microsoft-entra-id`
       (domaine ACTÉ le 2026-07-14 — lot D ; les 3 URIs peuvent donc être
       créées d'un coup au déroulé de la fiche)
2. **Relever les identifiants** (page Overview) → fiche de relevé ci-dessous
3. **Certificates & secrets → + New client secret**
   - Description : `livret-prod-2026` · Expiration : **24 months**
   - ⚠ Copier la **Value** immédiatement (affichée une seule fois — piège P6)
     → coffre / futur `.env` serveur. **JAMAIS dans le dépôt, ni dans une
     conversation.**
   - 📅 Poser le **rappel agenda janvier 2028** (rotation à 18 mois)
4. **App roles → + Create app role** (× 3) :

   | Display name | Value | Allowed member types | Description |
   |---|---|---|---|
   | Admin | `Admin` | Users/Groups | Administration complète du livret |
   | Coordo | `Coordo` | Users/Groups | Coordonnateur·rice pédagogique |
   | Formateur | `Formateur` | Users/Groups | Formateur·rice référent·e |

5. **Token configuration → + Add optional claim** → Token type **ID** →
   cocher `given_name`, `family_name`, `email` (piège P3 : sinon display
   names vides au JIT)
6. **Enterprise applications →** l'app **→ Properties** →
   « Assignment required? » = **No** → Save (décision D3 / piège P5)
7. **Enterprise applications →** l'app **→ Permissions** →
   **Grant admin consent for GRETA CFA Lyon Métropole** (parade proactive du
   piège P2 — évite l'écran « approbation administrateur requise » aux
   premiers utilisateurs)
8. **Users and groups → + Add user/group** : s'assigner le rôle **Admin**
   (les coordos/formateurs réels seront assignés au fil du rollout)

### Fiche de relevé (à compléter après la phase portail)

| Donnée | Variable `.env` cible (Auth.js v5) | Valeur |
|---|---|---|
| Application (client) ID | `AUTH_MICROSOFT_ENTRA_ID_ID` | _à relever_ |
| Directory (tenant) ID | `AUTH_MICROSOFT_ENTRA_ID_ISSUER` = `https://login.microsoftonline.com/bc139aaa-fea0-465b-8d3d-be26ed74675d/v2.0` | acquis |
| Client Secret (Value) | `AUTH_MICROSOFT_ENTRA_ID_SECRET` | 🔒 coffre uniquement |
| Date de création du secret / échéance rotation | — | _à relever_ / +18 mois |

**Critère de sortie du lot C** : App Registration créée avec les 3 App Roles,
claims optionnels posés, admin consent accordé, secret au coffre + rappel
agenda, Client ID reporté dans la fiche ci-dessus.

---

## 3. Marqueurs du kit — pré-remplissage

À reporter dans le « Rechercher/Remplacer » du kit (`README.md` §1 du kit) au
démarrage du chantier technique :

| Marqueur | Valeur proposée | Statut |
|---|---|---|
| `<PROJET>` | `livret` | proposé |
| `<DOMAINE>` | `livret.gretacfalyon.com` | **ACTÉ (2026-07-14)** |
| `<USER>` | compte cPanel Greta — cf. `STACK_GRETA_LYON.md` §2.4 | acquis |
| `<BASE>` | `<USER>_livret` | proposé |
| `<DB-USER>` | user MySQL GLM existant ou dédié `<USER>_livret` | **à trancher (lot D)** |
| `<EMAIL-CONTACT>` | `glm.livret@ac-lyon.fr` | **à valider (lot D)** |
| `<MDP>` | jamais écrit ailleurs que dans le `.env` serveur | — |

---

## 4. Brouillon de note au DPO — ⏸ envoi différé à la mise en ligne (décision 2026-07-14)

> **Objet : Livret d'apprentissage dématérialisé — réexamen RGPD avant mise
> en production (réintroduction d'apprentis mineurs)**
>
> Bonjour,
>
> Le GRETA Lyon Métropole prépare la mise en production du livret
> d'apprentissage dématérialisé (aujourd'hui en maquette de démonstration,
> sans données réelles). Une analyse de conformité a été préparée en mai 2026
> (33 obligations strictes identifiées — document `conformite-rgpd.md`
> disponible sur demande) ; elle concluait à la non-obligation d'AIPD, le
> périmètre excluant alors les mineurs.
>
> **Ce point a changé** : à la demande de la direction (réunion du 13 juillet
> 2026), l'application accueillera des **apprentis mineurs**, avec saisie des
> coordonnées de leurs **responsables légaux** (1 à 2 par apprenti : identité,
> email, téléphone, lien de parenté) qui disposeront d'un compte propre. Le
> critère CNIL « personnes vulnérables » nous semble donc désormais rempli.
>
> Nous sollicitons votre appui sur quatre points avant toute mise en
> production :
> 1. la **requalification de l'AIPD** (vraisemblablement requise) et, le cas
>    échéant, sa conduite ;
> 2. la **base légale** du traitement des données des responsables légaux ;
> 3. les **mentions d'information** spécifiques (mineurs + représentants) ;
> 4. la validation du **registre des traitements** et des **DPA
>    sous-traitants** (Microsoft Entra ID, Mailjet, o2switch).
>
> Le calendrier cible prévoit le déploiement sur l'hébergement o2switch du
> GRETA à l'issue de ces validations. Nous restons disponibles pour une
> présentation de l'outil.
>
> Bien cordialement,
> Guillaume FERRERI — pilote métier du projet

---

## 5. Séquence du chantier technique (après / en parallèle des prérequis)

> Détail opérationnel : [`plan-portage-nextjs.md`](plan-portage-nextjs.md)
> (vagues V0-V7, critères de sortie, estimations — livré le 2026-07-14).

Reprise de PROJECT-STATUS §12.4 + doctrine du kit :

1. ✅ **Arbitrage d'architecture** (§1) — TRANCHÉ le 2026-07-14 : portage Next.js
2. **Bootstrap stack cible** (kit : fichiers copiés, snippets fusionnés,
   marqueurs remplacés) + modèle de données Prisma dérivé des types actuels
   (`src/types/index.ts` — les 12 stores deviennent des tables)
3. **Backend minimal + MariaDB** — la maquette VPS continue de tourner pendant
   la maturation
4. **SSO Entra ID** (chantier 2.1 — playbook, ~1 jour) : personnels GRETA
5. **Comptes + email + mots de passe** (chantiers 2.2/2.3 — spec
   `chantier-creation-comptes.md`) : apprenti·e·s, maîtres, **responsables
   légaux** (décision 7 re-cadrée)
6. **Binaires sur Nuage** (WebDAV) : documents administratifs nominatifs + de
   formation, signatures PNG
7. **Recette, bascule DNS, décommissionnement du VPS** (préflight adapté)
8. **Demande 2 — entretiens individuels** : première vague fonctionnelle
   post-déploiement, dès réception des trames officielles

---

## 6. Journal de la phase

| Date | Événement |
|---|---|
| 2026-07-13 | Création du document. Décision pilote : gel du fonctionnel, report de la demande 2 post-déploiement, lancement des prérequis administratifs (§2). |
| 2026-07-13 | **Lot C ouvert** (décision pilote : commencer par Entra). Fiche d'exécution §2bis rédigée sur la base du playbook, 4 écarts réconciliés avec la doctrine o2switch (Auth.js v5, pattern de redirect URI, App Roles Admin/Coordo/Formateur, rôle JIT par défaut « en attente d'affectation »). Phase portail à dérouler par le pilote. |
| 2026-07-14 | **Réordonnancement pilote** : lot C mis en pause (sera déroulé juste avant le chantier SSO, domaine connu) ; priorités = 1) note DPO, 2) domaine + ressources cPanel, 3) chantier technique. |
| 2026-07-14 | **Arbitrage d'architecture TRANCHÉ** (pilote, sur analyse du kit) : **portage Next.js 16 App Router** — le kit est intégralement spécifique à Next.js standalone, l'option « Vite + API séparée » aurait rejoué les pièges o2switch déjà soldés par ASR. §1 mis à jour avec la justification. Découverte connexe : ASR utilise le SMTP académique en prod → ré-arbitrage Mailjet ajouté au lot E. Prochain livrable : plan de portage. |
| 2026-07-14 | **Domaine ACTÉ** : `livret.gretacfalyon.com` (lot D — marqueur `<DOMAINE>` figé, redirect URI Entra définitive connue). |
| 2026-07-14 | **Note DPO différée à la mise en ligne** (décision pilote — aucune donnée apprenti·e avant début septembre 2026). Garde-fou : mise en ligne avec fixtures sans attendre le DPO, mais **pas de données réelles avant sa validation** (AIPD mineurs). Le chemin critique de la phase devient le **chantier technique**. |
| 2026-07-14 | **Plan de portage LIVRÉ** ([`plan-portage-nextjs.md`](plan-portage-nextjs.md)) : inventaire de réutilisation (57 libs copiées telles quelles, composants adaptés, 12 stores réécrits en Prisma/Server Actions), schéma cible ~22 tables, 8 vagues V0-V7 (~13-18 j), stratégie E2E (auth + seed), 5 micro-décisions pour V0. En attente du GO pilote pour V0 (bootstrap). |
| 2026-07-14 | **V0 (bootstrap) LIVRÉE** — GO pilote, micro-décisions validées. Nouveau projet `livret-glm-app` (Next 16/React 19/Tailwind 4, kit appliqué, Prisma 6 CloudLinux) ; **767/767 tests métier verts dans la nouvelle stack** ; risque react-pdf levé ; smoke standalone OK. Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). Dépôt GitHub : `Worzee/livret-glm-app` (privé, poussé). |
| 2026-07-14 | **V1 (socle données + auth) LIVRÉE** — schéma Prisma 13 tables, seed fixtures (19 utilisateurs / 8 livrets), Auth.js v5 dual + JIT Entra + écran attente, matrice de droits appliquée CÔTÉ SERVEUR, 767 Vitest + 9 E2E smoke verts, parcours vérifié sur le build de production. Piège `trustHost` capitalisé dans la doctrine (§8.3). Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). |
| 2026-07-14 | **V2 (administration) LIVRÉE** — les 10 modules admin portés (utilisateurs + cascades, formations + planning, affectations, entreprises, référentiels + limite + paramètres, activités, établissements, attitudes, import Excel). Parsing CSV/XLSX conservé côté client (libs isomorphes), actions serveur gardées par la matrice. 767 Vitest + 94 E2E verts. Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). |
| 2026-07-14 | **V3 (livret pédagogique) LIVRÉE** — la plus grosse vague du plan, en 5 modules : tableau de bord complet (pilotage, alertes, récap apprenti·e, « apprenti·e actif·ve » = cookie re-validé par périmètre), fiches de période entreprise/centre (co-édition, signatures tactiles, R10/R17/R20/R21 côté serveur), organisation du suivi (verrous R9), entretien tripartite (trame, sélections §12, R8/R9, auto-marquage), synthèse + clôture R22. Patterns capitalisés : auto-save débouncé, cases optimistes à file séquentielle. **767 Vitest + 192 E2E verts** (6 fixme restants → V4 documents / V5 PDF). Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). Prochaines vagues : V4 (documents + Nuage), V5 (PDF + mobile). |
| 2026-07-14 | **V4 (documents + Nuage) LIVRÉE** — le binaire quitte la base (doctrine §3.4) : couche stockage WebDAV Nuage en fetch natif (§10.8, repli disque local en dev — pilote choisi par `NEXTCLOUD_WEBDAV_URL`, prêt à basculer dès que le compte fonctionnel du **lot B** sera fourni), colonne `cheminFichier` en base, routes de consultation gardées (session + périmètre + flag « réservé »), attestataire mineur·e/responsable re-validé côté serveur, dépôt en masse actif sur la page Formations. **767 Vitest + 203 E2E verts** (3 fixme restants → V5 PDF). Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). Prochaine vague : V5 (PDF + mobile), puis V6 (comptes externes + emails), V7 (déploiement + recette). |
