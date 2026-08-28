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

- [x] **Compte fonctionnel d'établissement** sur `apps.education.fr` —
      **ACTÉ le 2026-07-18** : `glmreferentnumerique` (compte fonctionnel,
      pas nominatif ✓), WebDAV
      `https://nuage15.apps.education.fr/remote.php/dav/files/glmreferentnumerique`
- [x] Dossier racine applicatif — **`/LIVRET APPRENTISSAGE`** (existant,
      2026-07-18 ; `NEXTCLOUD_FILES_BASEPATH` configuré tel quel) — prévoir
      un sous-dossier par promo pour les documents de formation (le code les
      crée seul au dépôt en masse)
- [x] **Mot de passe d'application** WebDAV généré (`livret-glm-app`) et
      **TESTÉ le 2026-07-18** : `npx tsx scripts/tester-nuage.ts` →
      dépôt/relecture/suppression OK via le vrai code de stockage (espace
      du nom de dossier géré). Identifiants dans `.env.nuage` (non commité,
      poste pilote) — à recopier dans le `.env` serveur à la bascule
      (runbook §6). ⚠ Jamais dans le `.env` de dev (le reset E2E purgerait
      le Nuage réel)
- [x] 📎 **VALIDÉ EN ÉCRITURE DEPUIS LE SERVEUR le 2026-07-26 — le lot B est
      CLOS techniquement.** Le test du 2026-07-18 partait du POSTE PILOTE et
      la lecture seule avait été vérifiée à la bascule ; **écrire est une
      autre opération, et c'est celle du quotidien des formateurs**. WebDAV
      brut depuis `~/apps/livret` : PUT 201 → GET 200 contenu identique →
      DELETE 204. `.stockage-dev/` **VIDE** : aucun dépôt n'est jamais tombé
      en repli disque local depuis la bascule (le repli est d'ailleurs moins
      traître qu'en SMTP — une écriture qui échoue LÈVE une erreur,
      `storage.ts:79`). Puis dépôts RÉELS en production depuis l'interface :
      **989 Ko et 1 800 Ko**, retrouvés dans l'arborescence aux bonnes
      tailles sous `…/apprentis/u-apprenti-<id>/`, noms anonymisés
      `docadm-<hash>.pdf` (l'interface conservant le nom d'origine), puis
      **relus par « Consulter » — première relecture d'un fichier écrit par
      l'APPLICATION** et non par le seed. Refus au-delà de 2 Mo confirmé.
      ⚠ **Piège de méthode** : ne jamais conclure sur les uploads depuis un
      POST `curl` — ils renvoient un `307 → /login` inexpliqué à TOUTE taille
      (y compris 2 Mo, et même vers une page publique que le proxy ne
      redirige pas), ce qui a produit une fausse alerte « tous les dépôts
      sont cassés » ; ni le bug de cache o2switch ni l'en-tête
      `Expect: 100-continue` ne l'expliquent. **Seul le dépôt réel depuis
      l'interface fait foi.** Mesure de volume fiable en revanche :
      multipart de 2 à 12 Mo tous acceptés intégralement → aucune limite
      d'infrastructure sous 12 Mo.
- [x] **Quota Nuage relevé le 2026-07-26 : 100 Go** — le pire cas absolu
      (200 apprenti·e·s × 5 documents × 10 Mo) en occupe 10 %. Aucune
      contrainte de stockage ; débloque le passage de la limite de dépôt à
      10 Mo (lot de modifications post-recette)
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
- [x] Sous-domaine créé dans cPanel (Document Root par défaut) — **2026-07-18
      (bascule)**, serveur `pif.o2switch.net`
- [x] **SSL actif** — certificat Let's Encrypt™ généré le 2026-07-18
      (préflight : TLS valide > 30 j, HSTS, redirection 80→443 posée en
      `.htaccess` — capitalisé au runbook §10)
- [x] **Base MariaDB** `tlxn8907_livret` créée — 2026-07-18 (migrations
      importées via phpMyAdmin : 15 tables, `charset=utf8mb4` dans la
      `DATABASE_URL`)
- [x] **Utilisateur MySQL** dédié `tlxn8907_livret`, mot de passe
      **alphanumérique** — 2026-07-18
- [x] **Node.js App** créée : Node **22**, mode Production, racine
      `apps/livret`, startup `start.cjs` — 2026-07-18 (⚠ piège vécu : si
      les pages statiques o2switch répondent à la place de l'app, re-Save
      de l'Application URL + Restart)
- [ ] **2FA cPanel** activé sur les comptes admin
- [ ] **JetBackup** : quotidien, rétention ≥ 30 j, chiffré
- [x] Adresse email de contact / notifications du projet — **ACTÉE le
      2026-07-18 : `glm-referentnumerique@ac-lyon.fr`** (boîte fonctionnelle
      académique existante, lettre DSI du 11/04/2023 `glmrefnum.pdf`,
      compte `glmrefnum`, webmail `webmail.ac-lyon.fr`). Remplace le
      marqueur `<EMAIL-CONTACT>` partout (CONTACT_EMAIL, EMAIL_FROM)

### Lot E — Emails transactionnels (chantiers 2.2/2.3)

Décision « Mailjet » actée dans `chantier-creation-comptes.md` §1 (mai 2026,
formule gratuite 200 emails/jour) — **à ré-arbitrer** :

> **V6 livrée (2026-07-15)** : le code est **agnostique du fournisseur**
> (transport SMTP nodemailer configuré par `SMTP_*` — relais académique
> comme Mailjet exposent un SMTP). Le ré-arbitrage ci-dessous devient une
> pure décision de compte + configuration `.env`, sans impact code. Sans
> SMTP configuré, l'app écrit les emails dans `.emails-dev/` (dev/E2E).

- [x] ⚠ **Ré-arbitrage Mailjet vs SMTP académique — TRANCHÉ le 2026-07-18
      (pilote) : RELAIS ACADÉMIQUE** avec le compte fonctionnel
      `glm-referentnumerique@ac-lyon.fr`
      (`smtps.region-academique-auvergne-rhone-alpes.fr`, 587/STARTTLS —
      même pattern qu'ASR en production). Bénéfices actés : un sous-traitant
      de moins (pas de DPA Mailjet), pas de SPF/DKIM à poser (l'envoi part
      en `@ac-lyon.fr` par le relais officiel), dossier RGPD allégé.
      ⚠ Piège ASR repris : l'identifiant SMTP est l'ADRESSE COMPLÈTE
      (login court rejeté 535). **TESTÉ le 2026-07-18** :
      `npx tsx scripts/tester-smtp.ts` → relais OK du premier coup,
      **réception confirmée dans le webmail par le pilote** (boîte de
      réception, pas en indésirables). Identifiants dans `.env.smtp` (non
      commité, poste pilote) — à recopier dans le `.env` serveur à la
      bascule (runbook §6). La décision 1 du chantier création comptes est
      amendée en conséquence. Boîte organisée : dossier « LIVRET
      APPRENTISSAGE » + règle de filtrage (sujet « Livret » OU expéditeur
      la boîte elle-même).
- [x] ✉ **VALIDÉ DEPUIS LE SERVEUR le 2026-07-26 — le lot E est CLOS
      techniquement** (procédure capitalisée : runbook §11bis de l'app).
      Le test du 2026-07-18 partait du POSTE PILOTE et ne disait rien de la
      capacité du mutualisé à sortir en 587 — port très souvent filtré chez
      les hébergeurs (anti-spam). Résultat depuis `pif.o2switch.net` :
      **587 ET 465 OUVERTS**, aucun filtrage o2switch → **le repli « envoi
      via API HTTPS » envisagé en cas de blocage est SANS OBJET**, aucun
      développement à prévoir. Handshake `nodemailer.verify()` (connexion +
      STARTTLS + **authentification**) puis email témoin : reçus en boîte de
      réception du webmail. Puis les 3 parcours réels en prod, qui cochent
      3 lignes de la recette §12 : activation d'une apprentie de test
      (email → lien 30 j → mot de passe → connexion auto → email de
      confirmation), mot de passe oublié (lien 1 h, échéance affichée juste
      en Europe/Paris), renvoi de lien depuis la liste admin. **Chez Gmail
      (destinataire externe) : onglet Principal, ni spam ni Promotions** —
      le pari « pas de SPF/DKIM à poser » du ré-arbitrage ci-dessus est
      VÉRIFIÉ en conditions réelles. ⚠ 2 pièges capitalisés : (1)
      `SMTP_HOST` **et** `SMTP_USER` conditionnent l'envoi réel — si l'un
      manque, l'app écrit dans `.emails-dev/` **sans aucune erreur**, donc
      contrôler ce dossier sur le serveur AVANT de suspecter le réseau ;
      (2) `node : commande introuvable` dans le Terminal cPanel tant qu'on
      n'a pas fait `source ~/nodevenv/apps/livret/22/bin/activate`.
      Si le 587 tombait un jour : `SMTP_PORT=465` + `SMTP_SECURE=true` +
      Restart, sans toucher au code.
- ~~[ ] Compte Mailjet créé~~ — sans objet (relais académique)
- ~~[ ] Domaine d'envoi validé : SPF + DKIM~~ — sans objet
- ~~[ ] DPA Mailjet accepté~~ — sans objet
- [ ] ⚠ Re-cadrage de la **décision 7** (« majeurs uniquement », invalidée le
      2026-07-13 par la demande 5) : les mineurs et responsables légaux entrent
      au périmètre des comptes — **implémenté PAR DÉFAUT en V6 (parité
      maquette : le compte du/de la mineur·e s'active dès l'inscription, les
      responsables légaux reçoivent leurs propres liens) ; à confirmer pilote**
- [x] **Cron cPanel câblé à la bascule (2026-07-18)** : tâche quotidienne
      05h17 (`CRON_SECRET` lu du `.env` serveur par `sed`, rien en clair
      dans la crontab — runbook §11). Chaîne validée par test manuel :
      `{"ok":true,"notifies":0,"purges":{...}}` dans
      `~/logs/cron-livret.log`, 401 sans Bearer. **Contrôler le log à J+1**
      (première exécution planifiée)
- [ ] ⚠ **Page `/mentions-legales` (v1.0-2026-07) à faire VALIDER par le DPO**
      avant toute donnée réelle (le texte V6 est une version de travail ;
      recoupe le garde-fou du lot A)

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
| 2026-07-15 | **V5 (PDF + mobile) LIVRÉE — la suite E2E de la maquette est intégralement portée : 767 Vitest + 225 E2E verts (213 desktop + 12 mobile Pixel 5), 0 fixme.** Export PDF lazy complet (livret 13 pages vérifié visuellement, périodes entreprise/centre, entretien, fiches de suivi), page Accès mobile (QR), audit responsive réintroduit (2 défauts mobiles réels corrigés dont une régression de parité V1). La suite E2E teste désormais le BUILD de production (doctrine maquette). Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). Prochaine vague : V6 (comptes externes + emails — ré-arbitrage Mailjet vs SMTP académique du lot E à trancher), puis V7 (déploiement + recette, lots C/D à dérouler). |
| 2026-07-15 | **V6 (comptes externes + emails) LIVRÉE — chantiers 2.2/2.3 implémentés dans la stack cible : 812 Vitest + 234 E2E verts, 0 fixme.** Activation par email (lien 7 j, usage unique, mentions d'information OBLIGATOIRES tracées en base), mot de passe oublié (lien 1 h), changement depuis « Mon compte », rate limiting (connexion, renvois, anti-scan de jetons), journal d'audit RGPD, notifications coordo J+7 + purges via `/api/cron/quotidien` (protégé `CRON_SECRET` — **cron cPanel à câbler en V7**). **Le transport email est AGNOSTIQUE (SMTP nodemailer, variables du kit) : le ré-arbitrage du lot E devient une pure décision de compte/configuration** — relais académique comme Mailjet sont du SMTP, aucun code à changer. ⚠ Page `/mentions-legales` (version `v1.0-2026-07`) rédigée en VERSION DE TRAVAIL : à valider par le DPO avant toute donnée réelle (garde-fou lot A inchangé). ⚠ Décision 7 re-cadrée PAR DÉFAUT (parité maquette) : le compte d'un·e mineur·e s'active dès l'inscription, ses responsables légaux ont leurs propres comptes — à confirmer pilote (lot E, dernier point). Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). Prochaine vague : **V7 (déploiement + recette)** — lots B/C/D/E deviennent le chemin critique (comptes, domaine, SMTP). |
| 2026-07-18 | **V7 — le reste TECHNIQUE est livré** (commits `28d6f11` + `1f96a1a` de livret-glm-app, 813 Vitest + 236 E2E verts) : 404 personnalisée, **préflight o2switch** (`scripts/preflight-o2switch.sh`, 16-19 contrôles adaptés Passenger/auth réelle — remplace `verifier-vps.sh`), risque upload §7 soldé côté appli, **`docs/RUNBOOK_BASCULE.md`** (séquence de mise en production complète : prérequis P1-P6 ↔ lots A-E, `.env` prod complet, migrations phpMyAdmin, seed fixtures par tunnel SSH, **cron cPanel quotidien documenté**, recette pilote 13 points, décommission VPS). **La bascule n'attend plus QUE les prérequis administratifs des lots A-E** : P2 Nuage, P3 SMTP (+ ré-arbitrage), P4 Entra (OPTIONNEL à la bascule — credentials en attendant), P5 email fonctionnel, P6 validation DPO des mentions (garde-fou : fixtures seulement d'ici là). Reste à vérifier EN RECETTE : limite POST LiteSpeed ≥ 4 Mo (lot D). |
| 2026-07-18 | **🚀 BASCULE EFFECTUÉE — `https://livret.gretacfalyon.com` EN LIGNE avec les FIXTURES, préflight 19 OK / 0 KO.** Runbook déroulé en séance pilote (§1→§11) : lot D quasi soldé (sous-domaine, SSL, base, Node.js App — restent 2FA à confirmer et JetBackup à vérifier), cron du lot E câblé (test manuel OK — log à contrôler à J+1). Seed passé par le repli Remote MySQL® (port 22 filtré depuis le poste pilote). Recette §12 entamée en ligne (coordo, parcours livret, lecture Nuage en prod OK) ; restent les points manuels (dépôt Nuage, > 2 Mo/LiteSpeed, export PDF, SMTP réel, mobile). Le VPS duckdns reste le rollback jusqu'à la validation de la recette (lot F). Garde-fou lot A inchangé : fixtures seulement jusqu'à validation DPO. Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). |
| 2026-07-19 | **🔴 Bloquant prod (lot D) : la couche cache o2switch mélange les réponses entre vhosts** — les Server Actions du livret reçoivent un corps de réponse de l'app ASR (headers vivants fusionnés sur corps stocké, `Vary` supprimé, `no-store` ignoré). Application et configuration Passenger blanchies par audit (A/B en direct sur le serveur + `grep` d'arborescence + persistance aux Restart). **Ticket support o2switch envoyé** (mélange inter-sites signalé comme faille d'étanchéité). Recette §12 suspendue sur la navigation cliquée en attendant ; détail complet au journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). |
| 2026-07-19 | **Plan B déployé — navigation rétablie en prod** (contournement du bug de cache o2switch : plus aucun `redirect()` dans les Server Actions, navigation côté client). 813 Vitest + 236 E2E verts, préflight 19/19, parcours cliqués vérifiés en ligne. Le ticket o2switch (étanchéité inter-vhosts) reste ouvert — le contournement n'exonère pas l'hébergeur. Recette §12 débloquée. Détail : journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md). |
| 2026-07-21 | **Kit de déploiement CAPITALISÉ post-bascule** (commit `87666b0` de livret-glm-app pour les copies docs/) : procédure enrichie du vécu des 2 déploiements — redirection 80→443, Terminal web cPanel (port 22 filtré), pièges phpMyAdmin (base sélectionnée ! SQL incrémental `prisma/deploiement/`), Remote MySQL® temporaire, préflight générique ajouté au kit, séquence de mise à jour sûre (`rm -rf .next` avant extraction), **§12 nouveau : bug cache o2switch → règle portefeuille « jamais de `redirect()` dans une Server Action »**. Journal STACK +2 entrées ; la copie STACK de la maquette (périmée, s'arrêtait au 13/06) resynchronisée. Le kit lui-même reste volontairement NON COMMITÉ. | 
| 2026-07-19 | **Kit de déploiement RÉVISÉ (3ᵉ passe) après le contournement du bug §12** — `_kit-deploiement-o2switch/` (local, non commité) : (1) `package-standalone.mjs` gagne `--archive` qui produit le `.tar.gz` prêt à téléverser en appliquant les 3 règles coûteuses (substitution du `package.json` COMPLET, exclusion du `node_modules`, exclusion de l'archive PRÉCÉDENTE — piège des 42 Mo) puis refuse l'archive si un `node_modules`/`.env` y traîne ; testé réellement sur le Livret (21,1 Mo / 1 186 fichiers) — **un bug de portabilité y a été trouvé et corrigé** : le GNU tar de Git Bash lit `D:\…` comme un hôte distant, d'où des chemins relatifs obligatoires. (2) Runbook : §4 réécrit (archive + équivalent manuel), §5 « la Node.js App CRÉE le venv » (piège `activate: No such file or directory` → `npm : commande introuvable`), §9 diagnostic corrigé (activer le venv sinon `Termine 127`, port ≠ 3000, tuer l'orphelin) + **méthode `curl --resolve` app-seule vs derrière-le-front** (celle qui a tranché le diagnostic) + piège du cookie `__Secure-` en HTTP, §10 cinq lignes de dépannage ajoutées, §12 enrichi (corollaire **React 19** : formulaires réinitialisés après action → champs contrôlés ; `redirect()` INDIRECTS des gardes d'auth — inoffensifs seulement parce qu'un middleware intercepte en amont, vérifié 307 propre ; leviers de cache testés EN VAIN : XtremCache, LSCache, `CacheDisable`, cache-buster ; méthode de preuve en 3 commandes ; **canal support = espace client, PAS cPanel**). (3) `AGENTS.md` du kit (fichier lu en premier par un agent) : la règle « aucun `redirect()` dans une Server Action » passe en TÊTE des points non négociables. (4) `env.example` : interdiction de recopier les identifiants de prod dans le `.env` de dev (purge du stockage réel / vrais emails) et de poser `E2E_RESET` en prod. (5) Snippet `next.config.ts` : vérifier en recette que la limite POST LiteSpeed dépasse `bodySizeLimit`. |
| 2026-07-26→28 | *(entrées manquantes ici — consignées côté `livret-glm-app/AGENTS.md` : emails et Nuage validés DEPUIS LE SERVEUR, lot du 2026-07-26 déployé, **SSO déployé puis allumé**. Journal frère à resynchroniser.)* |
| 2026-08-25 | **Purge de mise en service et socle de séance PRÊTS** (présentation à l'ensemble du personnel le **jeudi 2026-08-27**, suivie d'une séance de tests d'1h30). Arbitrages pilote : participants **tous en coordo/admin via SSO**, formation **fictive** à référentiel simplifié, **tableau de bord vide assumé** (chacun crée ses données), **ce qui est saisi reste**. (1) `prisma/deploiement/purge-mise-en-service.sql` préserve désormais une **LISTE** d'adresses et non plus une seule — ⚠⚠ **bug attrapé au retest, qui serait tombé EN PRODUCTION** : la version à variable de session + `FIND_IN_SET` échoue en « Illegal mix of collations » sur MariaDB 11.4 (variable = collation de la CONNEXION, colonne `email` = collation de la TABLE), et elle échoue **au DELETE des comptes**, soit APRÈS que tout le reste a été supprimé ; un littéral dans un `IN (...)` adopte la collation de la colonne. (2) `scripts/mise-en-place-seance.ts` (nouveau) pose ce qu'une base purgée ne permet plus de créer : établissement, référentiel 3 blocs / 9 compétences, formation + planning, entreprises, maîtres, formateurs, 2 apprenti·e·s de démo sans coordo — **dry-run par défaut, n'efface jamais rien, idempotent**. (3) **Deux faits mesurés qui corrigent la doctrine** : le SSO **recrée tout seul** un compte coordo/admin habilité que la purge emporterait (la note « habilitations Azure à refaire » du runbook §15 était pessimiste — seules les affectations se perdent) ; et un coordo ne voit que les apprenti·e·s dont il est le/la coordo — **mais la création s'en charge déjà** (auto-affectation du coordo créateur, modale ET import XLSX), donc aucune consigne à donner aux participants ; seule la création par un admin ou un formateur laisse un·e apprenti·e sans coordo. Séquence complète rejouée en local (seed 19/8/40/24 → purge → socle → rejeu), 868 Vitest verts, écrans vérifiés. Runbook **§15 réécrit** + **§15bis créé**. ⚠ Reste au pilote : sauvegarde, inventaire des comptes à préserver, exécution, changement du mot de passe `demo1234` du compte admin, et **affectation Entra de chaque participant** (« Affectation requise » = Oui : non affecté = refusé). |
| 2026-08-26 | **🐛 Création de comptes : l'échec était MUET — corrigé la veille de la séance.** Le pilote signale qu'un clic sur « Créer coordinateur·rice » ne produit RIEN. Cause : la colonne `email` est `@unique`, la Server Action rejetait sur doublon, et **aucune des deux modales n'attrapait l'erreur** — Next masquant en plus le message d'une action en production, l'écran restait strictement inerte, sans même un indice en interface. Le cas réel est un effet de bord du SSO : l'adresse saisie portait déjà le compte que **Entra avait fait créer automatiquement** à la première connexion (`src/lib/sso.ts`, `action: 'creer'`) — le pilote tentait donc de se recréer un second compte avec sa propre adresse. Corrigé sur 3 niveaux : (1) **unicité validée côté client**, dans `validation-utilisateur-staff.ts` ET `validation-apprenti.ts` — le trou existait aussi pour les apprenti·e·s — avec la comparaison insensible à la casse déjà utilisée par l'import XLSX ; (2) **`try/catch` + bandeau d'erreur + bouton « Enregistrement… » désactivé, saisie CONSERVÉE** (`ModaleUtilisateurStaff.tsx`, `ModaleApprenti.tsx`) : quelle que soit la cause d'un futur rejet (droit refusé, action corrompue par le cache o2switch), l'écran ne peut plus rester muet ; (3) **garde serveur `exigerEmailLibre`** sur les 4 créations (`actions/utilisateurs.ts`), qui couvre l'import XLSX et deux créations simultanées. E2E de non-régression ajouté (coordo avec adresse déjà prise → message visible, modale ouverte). **873 Vitest + 254 E2E verts, `next build` OK.** ⚠ L'enjeu dépassait largement le coordo : demain, une vingtaine de personnes créent des apprenti·e·s fictifs — une collision d'adresses (le classique `test@test.fr` saisi deux fois) aurait produit le même écran muet, en direct devant le personnel. À embarquer dans le bundle de mise en service, **avant** la purge et le socle. Piège d'outillage capitalisé au passage (AGENTS.md) : le dépôt n'a aucune config Prettier — `npx prettier --write` reformate tout aux défauts (guillemets doubles, largeur 80), et un second passage aux bonnes options NE répare pas (les littéraux d'objet éclatés sont préservés par conception) : il faut `git checkout` et réappliquer. |
| 2026-08-27 | **Guide d'utilisation intégré — impact de déploiement.** Le mode d'emploi devient une page de l'application (`/guide`, menu « Aide », filtrée par rôle). **Aucun SQL, aucune migration, aucune variable d'environnement** : un simple bundle suffit. Seul effet sur la livraison : **le bundle grossit d'environ 3,6 Mo** (`public/guide/`, 61 captures WebP) — `scripts/package-standalone.mjs` recopie déjà `public/` dans le standalone, rien à changer au processus. Le **préflight reste à 20/20** : `/guide` est derrière l'authentification, il n'entre pas dans les contrôles publics. ⚠ Ne pas éditer `src/content/guide/*.ts` sur le serveur : c'est du contenu GÉNÉRÉ, il serait écrasé à la régénération suivante. Commit app : `6f13c31`. |
| 2026-08-28 | **Guichet d'assistance DÉPLOYÉ — et un piège phpMyAdmin capitalisé.** Séquence jouée par le pilote : SQL dans phpMyAdmin, bundle remplacé, Restart, puis recette réelle (ouverture d'un retour en coordo, réponse en admin, email reçu). ⚠ **LE PIÈGE** : le SQL portait un bloc de vérification lisant `information_schema` — **l'utilisateur du mutualisé n'y a PAS accès**. phpMyAdmin a donc affiché **simultanément** le bandeau vert « L'importation a réussi, 2 requêtes exécutées » **et** un `#1044 - Accès refusé […] Base 'information_schema'` en rouge, alors que le `CREATE TABLE` avait parfaitement abouti. Deux facteurs aggravants : l'erreur ressemble à un échec de création, et **le panneau de gauche de phpMyAdmin ne se rafraîchit pas** après un import — la table n'apparaissait pas dans l'arbre, ce qui confirmait la fausse impression. Confirmation par `SHOW COLUMNS FROM signalements;` : 14 colonnes, 3 index, conforme au schéma (`contexte` et `messages` en `longtext`, forme normale du `Json` Prisma sous MariaDB). **Corrigé** : le SQL vérifie désormais par `SHOW TABLES LIKE` / `SHOW COLUMNS`, qui n'exigent aucun privilège ; piège consigné dans AGENTS.md, dans le tableau de dépannage du guide de déploiement (§10) et dans le runbook §14. Les 4 autres SQL de `prisma/deploiement/` ont été vérifiés : aucun n'utilisait `information_schema`. ⚠ Rappel inscrit au runbook §14 au passage : **le préflight ne joue que des GET** — après une mise à jour qui ajoute des Server Actions, seul un parcours réel prouve qu'elles passent. Impact bundle : 24,8 Mo, 1 340 fichiers. |
| 2026-08-28 | **Documents communs — impact de déploiement.** ⚠ **SQL AVANT LE BUNDLE** : `prisma/deploiement/2026-08-28-documents-communs.sql` (1 table `documents_communs`, `CREATE TABLE IF NOT EXISTS`, vérification par `SHOW TABLES` / `SHOW COLUMNS` — jamais `information_schema`, cf. le piège du 27). L'enjeu dépasse la nouvelle page : sans la table, **la création d'une formation échoue**, puisqu'elle lit ce catalogue pour en recopier les documents. Aucune variable d'environnement, aucune dépendance nouvelle ; le **préflight reste à 20/20** (la page est derrière l'authentification). **Recette en 4 points, dans l'ordre** (runbook §14bis) : le menu apparaît pour l'admin et pas pour un coordo ; deux documents déposés au catalogue se rouvrent par « Consulter » (le binaire est bien monté sur le Nuage) ; **une formation de test créée ensuite les contient** — c'est le seul point qui prouve la copie, un GET ne la verrait pas ; une formation antérieure n'a rien reçu, c'est voulu. ⚠ Si le Nuage est indisponible pendant une création, **la formation est créée quand même**, sans ses documents : l'échec part au journal d'audit (`document.copie-commune-echec`) et se rattrape par le dépôt manuel de l'admin. Nouveau dossier au Nuage : `documents/communs/` (la source ; chaque promo garde sa copie sous `documents/formations/<id>/`) — à retenir pour la purge (`scripts/purge-nuage.cjs`). |
