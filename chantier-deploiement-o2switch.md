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

### ⚠ Arbitrage d'architecture à prendre en OUVERTURE du chantier technique

La maquette est une **SPA Vite + React sans backend** ; le kit et la doctrine
ciblent **Next.js 16 standalone + Prisma 6 + MariaDB 11.4 + Auth.js v5**.
Deux options à trancher avant la première ligne de code étape 2 :

1. **Portage dans Next.js (App Router)** — option du kit, éprouvée sur ASR :
   un seul projet front + back, Server Actions, runbook réutilisable tel quel.
2. **Front Vite conservé + API séparée** — moins de portage UI, mais sort du
   kit (déploiement, auth, headers à réinventer) et double la surface à
   maintenir.

La doctrine et le kit militent pour l'option 1. **Décision à acter ici** avec
ses conséquences (réutilisation des libs pures `src/lib/` : elles sont
framework-agnostiques et se portent telles quelles, tests Vitest compris).

---

## 2. Prérequis administratifs — checklist

Responsable par défaut : **Guillaume FERRERI** (pilote, Global Admin tenant).
Les lots sont indépendants et parallélisables. Cocher + dater à l'avancement.

### Lot A — RGPD / DPO ⚠ CHEMIN CRITIQUE (délai externe le plus long)

La demande 5 (2026-07-13) a **réintroduit les mineurs** → le critère CNIL
« personnes vulnérables » est actif et l'**AIPD redevient vraisemblablement
obligatoire** (`conformite-rgpd.md`, encadré de tête + §5).

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

### Lot C — Microsoft Entra ID (SSO personnels GRETA) 🔵 EN COURS (2026-07-13)

Procédure détaillée : `playbook-sso-entra-greta.md` phase B +
`STACK_GRETA_LYON.md` §4.4. Tenant : `GRETA CFA Lyon Métropole`
(`bc139aaa-fea0-465b-8d3d-be26ed74675d`). **Fiche d'exécution pré-remplie :
§2bis ci-dessous.**

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

- [ ] **Domaine définitif choisi** — proposition : `livret.gretacfalyon.com`
      (pattern ASR) — à valider, puis créer le sous-domaine cPanel
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

### Lot E — Mailjet (emails transactionnels, chantiers 2.2/2.3)

Décisions déjà actées dans `chantier-creation-comptes.md` §1 (formule
gratuite 200 emails/jour).

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
     - ⏳ celle du domaine o2switch sera ajoutée à la validation du lot D
       (`https://livret.gretacfalyon.com/api/auth/callback/microsoft-entra-id`
       si la proposition est retenue — changement trivial, playbook §9)
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
| `<DOMAINE>` | `livret.gretacfalyon.com` | **à valider (lot D)** |
| `<USER>` | compte cPanel Greta — cf. `STACK_GRETA_LYON.md` §2.4 | acquis |
| `<BASE>` | `<USER>_livret` | proposé |
| `<DB-USER>` | user MySQL GLM existant ou dédié `<USER>_livret` | **à trancher (lot D)** |
| `<EMAIL-CONTACT>` | `glm.livret@ac-lyon.fr` | **à valider (lot D)** |
| `<MDP>` | jamais écrit ailleurs que dans le `.env` serveur | — |

---

## 4. Brouillon de note au DPO (à adapter et envoyer par le pilote)

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

Reprise de PROJECT-STATUS §12.4 + doctrine du kit :

1. **Arbitrage d'architecture** (§1) — portage Next.js vs front Vite + API
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
