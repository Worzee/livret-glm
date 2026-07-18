# Chantier — Création de comptes apprenti·e·s et maîtres d'apprentissage

> Spécification technique du chantier **étape 2.2** (création comptes par email)
> + **étape 2.3** (gestion des mots de passe). Issu de la session de cadrage
> du 2026-05-26 avec le pilote.

| | |
|---|---|
| **Date de rédaction** | 2026-05-26 |
| **Statut** | ✅ **IMPLÉMENTÉ le 2026-07-15 (vague V6 du portage)** — voir l'encadré d'implémentation ; recette qualité/DPO à mener (§12) |
| **Périmètre** | Étape 2, chantiers 2.2 + 2.3 |
| **Dépend de** | ~~Étape 2.0 (backend Node + PostgreSQL)~~ → stack cible réelle : Next.js 16 + Prisma + MariaDB (arbitrage 2026-07-14) |
| **Pilote métier** | Guillaume FERRERI |
| **⚠ À re-cadrer** | **2026-07-13** — la décision 7 (« majeurs uniquement ») est invalidée (voir encadré) → **défaut V6 posé, à confirmer pilote** |

---

> **✅ Implémentation (2026-07-15 — vague V6 du portage, commit `b98ba61` de
> `livret-glm-app`, 812 Vitest + 234 E2E verts).** Cette spec est réalisée
> dans la stack cible avec les **écarts délibérés** suivants, tous documentés
> au journal du [`plan-portage-nextjs.md`](plan-portage-nextjs.md) :
>
> - **architecture** : Server Actions + pages Next.js remplacent les endpoints
>   REST du §5 (mêmes contrats fonctionnels, mêmes règles §8) ; PostgreSQL du
>   §6 → MariaDB/Prisma (`jetons_compte` — une table UNIQUE pour activation +
>   réinitialisation —, `evenements_audit` sans FK, `tentatives_connexion`) ;
> - **hashage** : bcrypt coût 12 (bcryptjs pur JS) — le repli de la décision
>   10 est assumé : argon2 est un module natif, risque d'installation sur le
>   mutualisé CloudLinux ;
> - **transport email AGNOSTIQUE** (SMTP nodemailer) : la décision 1
>   « Mailjet » reste ré-arbitrable en pure configuration (lot E du chantier
>   de déploiement) ; en dev/E2E, repli fichier `.emails-dev/` ;
> - **anti-énumération renforcée** : les endpoints publics ne rendent JAMAIS
>   de 429 différencié (le rate limit y est silencieux — plus étanche que les
>   réponses 429 du §5.5/§5.6) ;
> - **décision 7 re-cadrée par défaut** (parité maquette, à confirmer
>   pilote) : le compte d'un·e mineur·e s'active dès l'inscription, ses
>   responsables légaux reçoivent leurs propres liens d'activation ;
> - **notification coordo J+7 (§7.3) + purges** : route
>   `/api/cron/quotidien` (Bearer `CRON_SECRET`) — cron cPanel à câbler en
>   V7 ; l'import XLSX n'envoie PAS de liens (envoi en masse = décision
>   explicite ultérieure) ;
> - **mot de passe oublié d'un compte jamais activé** → renvoi d'un lien
>   d'ACTIVATION (cas non prévu par la spec, l'impasse se résout seule) ;
> - **décision 2 amendée le 2026-07-15** (pilote) : lien d'activation valable
>   **30 jours** au lieu de 7 (les mentions « 7 jours » des écrans §4 et
>   templates §7 ci-dessous se lisent « 30 jours ») ; la notification coordo
>   §7.3 se déclenche à l'expiration du lien, donc à J+30 ;
> - la page `/mentions-legales` (v1.0-2026-07, version tracée à
>   l'acceptation) est une **version de travail à valider par le DPO**.

---

> **⚠ Mise à jour de périmètre (2026-07-13 — réunion DG, demande 5).** Les
> apprentis **MINEURS entrent au périmètre**, avec **1 à 2 responsables
> légaux** par mineur (données déjà saisies en maquette : inscription manuelle
> + import Excel, rattachement fratrie par email). Conséquences sur cette
> spec, à re-cadrer avant l'étape 2.2 :
>
> - **décision 7 invalidée** — la logique d'âge existe désormais
>   (`lib/minorite`, recalcul au jour) et il y a des représentants légaux à
>   informer ;
> - **nouveau public de comptes** : les responsables légaux (email propre,
>   unicité déjà contrôlée) — mêmes mécanismes lien d'activation / mot de
>   passe que les apprentis et maîtres, avec un rôle en lecture seule +
>   attestation des documents (cf. matrice 6 rôles) ;
> - **question ouverte** : le compte de l'apprenti mineur est-il activé dès
>   l'inscription ou à la majorité ? (en maquette, le mineur a son accès
>   classique hors documents) ;
> - **RGPD** : réexamen DPO requis (`conformite-rgpd.md`, encadré de tête —
>   AIPD, information des représentants légaux).
>
> Cadrage métier : `chantier-demandes-direction-2026-07.md` (demande 5) ;
> trace : `TODO-etape-2.md` (2026-07-13).

---

## Table des matières

1. [Décisions actées](#1-décisions-actées)
2. [Vue d'ensemble](#2-vue-densemble)
3. [Diagramme de séquence](#3-diagramme-de-séquence)
4. [Écrans](#4-écrans)
5. [Endpoints API](#5-endpoints-api)
6. [Structure BDD](#6-structure-bdd)
7. [Templates emails](#7-templates-emails)
8. [Conformité RGPD intégrée](#8-conformité-rgpd-intégrée)
9. [Tests à prévoir](#9-tests-à-prévoir)
10. [Estimation de charge](#10-estimation-de-charge)
11. [Dépendances et séquencement](#11-dépendances-et-séquencement)
12. [Validation et go / no-go](#12-validation-et-go--no-go)

---

## 1. Décisions actées

| # | Question | Décision |
|---|---|---|
| 1 | Service mail | ~~**Mailjet**~~ → **relais SMTP académique** (amendée pilote le **2026-07-18**, lot E du chantier de déploiement) : compte fonctionnel `glm-referentnumerique@ac-lyon.fr` via `smtps.region-academique-auvergne-rhone-alpes.fr` (587/STARTTLS, pattern ASR). Un sous-traitant de moins, pas de SPF/DKIM à poser. Le code V6 est agnostique (transport SMTP) — aucun impact |
| 2 | Validité du lien d'activation | ~~**7 jours**~~ → **30 jours** (amendée pilote le **2026-07-15**, à la livraison V6 — commit `42952a1`), avec mention explicite dans l'email. La réinitialisation reste à **1 heure** |
| 3 | Politique mot de passe | **Option A** — 12 caractères minimum, aucune complexité, aucune rotation forcée |
| 4 | Authentification personnels GRETA | **SSO Entra ID** (étape 2.1) — 2FA imposé nativement par Microsoft |
| 5 | 2FA apprenti·e + maître | **Aucun** — MdP robuste + rate limit + hashage argon2id jugés suffisants |
| 6 | Branding emails | **Officiel GRETA** (domaine + logo + charte) — validation par la référente qualité GRETA |
| 7 | Public concerné | ~~**Apprenti·e·s majeur·e·s uniquement**~~ — **INVALIDÉE le 2026-07-13** (réunion DG, demande 5) : mineurs réintroduits avec responsables légaux → voir l'encadré de tête, décision à re-prendre |
| 8 | Qui crée les comptes | **Coordo uniquement** pour la v1 — auto-inscription en piste pour 2027 selon retours |
| 9 | Type de token d'activation | **Token aléatoire 32 octets**, hashé en BDD (SHA-256), usage unique |
| 10 | Hashage des mots de passe | **argon2id** (lib `argon2` npm) — fallback bcrypt coût ≥ 12 acceptable |

---

## 2. Vue d'ensemble

### 2.1 — Objectif du chantier

Permettre au **coordo** de créer des comptes pour les **apprenti·e·s** et les **maîtres d'apprentissage** depuis l'interface admin existante (`/admin/utilisateurs`), avec :
- Envoi automatique d'un **email d'activation** contenant un lien sécurisé valide 7 jours
- Page de **définition du mot de passe** à la première connexion
- Connexion automatique après activation
- **Conformité RGPD** intégrée by design (mentions d'information au moment de la collecte du MdP, base légale mission d'intérêt public, sous-traitant mail UE)

### 2.2 — Acteurs concernés

| Acteur | Action | Volume estimé |
|---|---|---|
| **Coordo** (3-4 personnes) | Crée les comptes, déclenche les envois, peut renvoyer un lien | — |
| **Apprenti·e** | Reçoit l'email, active son compte, choisit son MdP | 100-300/an |
| **Maître / Tuteur** | Reçoit l'email, active son compte, choisit son MdP | 100-200 |
| **Backend Node** | Génère les tokens, envoie via Mailjet, vérifie l'activation | — |
| **Mailjet** | Achemine les emails au nom du domaine GRETA | — |
| **DPO GRETA** | Valide les mentions d'information | — |

### 2.3 — Hors-périmètre du chantier

- **Personnels GRETA** (admin/coordo/formateur) : passent par le SSO Entra ID (chantier 2.1 séparé)
- **Réinitialisation de mot de passe oublié** : couverte dans la sous-section 2.3 « Gestion des mots de passe »
- **Auto-inscription par le maître/apprenti** : piste 2027 selon retours
- **Modification de l'email** : action coordo, à spécifier dans un chantier séparé

---

## 3. Diagramme de séquence

```
COORDO          BACKEND            BDD            MAILJET         APPRENTI·E
  |               |                  |                |                |
  | 1. Crée user  |                  |                |                |
  |   (prénom,    |                  |                |                |
  |    nom, email)|                  |                |                |
  |-------------->|                  |                |                |
  |               | 2. Vérifie       |                |                |
  |               |    unicité email |                |                |
  |               |----------------->|                |                |
  |               |<-----------------|                |                |
  |               | 3. INSERT user   |                |                |
  |               |    (sans MdP)    |                |                |
  |               |----------------->|                |                |
  |               | 4. Génère token  |                |                |
  |               |    aléatoire     |                |                |
  |               | 5. INSERT token  |                |                |
  |               |    (hash SHA-256,|                |                |
  |               |     exp = +7 j)  |                |                |
  |               |----------------->|                |                |
  |               | 6. Send email    |                |                |
  |               |    (token en clair                |                |
  |               |     dans le lien)|                |                |
  |               |---------------------------------->|                |
  |               |                  |                | 7. Livre email |
  |               |                  |                |--------------->|
  | 8. 201 OK     |                  |                |                |
  |<--------------|                  |                |                |
  |               |                  |                |                |
  |               |                  |                | 9. Clique lien |
  |               |<------------------------------------------------|
  |               | 10. GET /activer/[token]                          |
  |               | 11. Hash token + SELECT     |                |
  |               |----------------->|                |                |
  |               |<-----------------|                |                |
  |               | 12. Valide       |                |                |
  |               |     (non expiré, |                |                |
  |               |      non consommé)                |                |
  |               | 13. 200 + infos compte (prénom, nom, email)        |
  |               |--------------------------------------------------->|
  |               |                  |                |                |
  |               |                  |                | 14. Saisit MdP |
  |               |                  |                |     + accepte  |
  |               |                  |                |     mentions   |
  |               | 15. POST /activer/[token]                          |
  |               |     { password }                  |                |
  |               |<--------------------------------------------------|
  |               | 16. Vérifie politique MdP (12 car. min)            |
  |               | 17. Hash MdP (argon2id)                            |
  |               | 18. UPDATE user SET password_hash, activated_at    |
  |               |----------------->|                |                |
  |               | 19. UPDATE token SET consumed_at                   |
  |               |----------------->|                |                |
  |               | 20. INSERT audit_log (activation)                  |
  |               |----------------->|                |                |
  |               | 21. Génère session JWT                             |
  |               | 22. 200 + token session + redirect vers /          |
  |               |--------------------------------------------------->|
  |               |                  |                |                |
  |               |                  |                | 23. Connecté   |
  |               |                  |                |     sur son    |
  |               |                  |                |     livret     |
```

---

## 4. Écrans

### 4.1 — Page admin de création (enrichie)

Route existante : `/admin/utilisateurs` — modale `ModaleApprenti` / `ModaleUtilisateurStaff` déjà en place. À enrichir avec :

```
┌──────────────────────────────────────────────────────────┐
│  Nouveau compte apprenti·e                          [×]  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Prénom         [_________________________]              │
│  Nom            [_________________________]              │
│  Date de naiss. [____/____/______]                       │
│  Email *        [_________________________]              │
│                                                           │
│  ─────────────────────────────────────────              │
│                                                           │
│  ☑ Envoyer le lien d'activation par email                │
│                                                           │
│  L'apprenti·e recevra un email contenant un lien          │
│  valable 7 jours pour définir son mot de passe.           │
│                                                           │
│  ─────────────────────────────────────────              │
│                                                           │
│  Formation     [Sélectionner ▼]                          │
│  Maître        [Sélectionner ▼]                          │
│  Contrat début [____/____/______]                        │
│  Contrat fin   [____/____/______]                        │
│                                                           │
│                              [Annuler]  [Créer le compte]│
└──────────────────────────────────────────────────────────┘
```

**Comportement** :
- L'email devient **obligatoire** (validation `[email].+@.+\..+`)
- La case « Envoyer le lien d'activation » est **cochée par défaut**
- Si décochée : le compte est créé sans email, le coordo peut envoyer plus tard via un bouton sur la fiche
- Toast de confirmation après création : *« Compte créé. Lien d'activation envoyé à <email>. »*
- Statut du compte affiché dans la liste : `En attente d'activation` (orange) jusqu'à la 1re connexion

### 4.2 — Page d'activation `/activer/[token]`

Page publique, accessible sans authentification.

```
┌────────────────────────────────────────────────────────────┐
│  [Logo GRETA]                                              │
│                                                             │
│  Activez votre compte Livret d'apprentissage                │
│  ════════════════════════════════════════════              │
│                                                             │
│  Bonjour Léa MARTIN,                                       │
│                                                             │
│  Votre compte a été créé par votre coordinatrice            │
│  pédagogique. Pour finaliser votre inscription, choisissez  │
│  votre mot de passe ci-dessous.                             │
│                                                             │
│  ──── Vos informations ──────────────────────              │
│  Prénom et nom : Léa MARTIN                                 │
│  Email         : lea.martin@example.fr                      │
│  Formation     : CAP Cuisine 2025-2026                      │
│                                                             │
│  ──── Choisissez votre mot de passe ────────              │
│  Mot de passe         [_________________] [👁]              │
│  Confirmer            [_________________] [👁]              │
│                                                             │
│  • Au moins 12 caractères                                   │
│  • Tous les caractères acceptés                             │
│  • Pas de renouvellement périodique                         │
│                                                             │
│  ──── Vos données personnelles ──────────                  │
│  ☐ J'ai lu et compris les mentions d'information du         │
│    traitement de mes données par le GRETA Lyon Métropole.   │
│    [Lire les mentions complètes]                            │
│                                                             │
│  Le GRETA Lyon Métropole est responsable du traitement      │
│  de vos données dans le cadre de votre apprentissage        │
│  (mission de service public éducatif). Vos données sont     │
│  conservées pendant la durée de votre contrat + 5 ans       │
│  en archivage légal, puis supprimées. Vous disposez d'un    │
│  droit d'accès, de rectification et d'opposition que vous   │
│  pouvez exercer auprès du DPO : dpo@<domaine-greta>.        │
│                                                             │
│                              [Activer mon compte]           │
└────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Bouton « Activer » désactivé tant que :
  - Les 2 champs MdP ne sont pas identiques
  - Le MdP fait moins de 12 caractères
  - La case d'acceptation des mentions n'est pas cochée
- Indicateur visuel temps réel sur la longueur du MdP (compteur de caractères)
- Bouton œil pour afficher/masquer le MdP saisi
- Toast en cas d'erreur réseau (« Une erreur est survenue. Réessayez. »)
- En cas de succès : redirection automatique vers le tableau de bord de l'utilisateur·rice avec session active

### 4.3 — Page d'erreur — lien expiré

```
┌────────────────────────────────────────────────────────────┐
│  [Logo GRETA]                                              │
│                                                             │
│  Ce lien d'activation a expiré                              │
│  ════════════════════════════════════════════              │
│                                                             │
│  Le lien envoyé par email est valide pendant 7 jours.       │
│  Le délai est dépassé.                                      │
│                                                             │
│  Pour recevoir un nouveau lien, saisissez votre email       │
│  ci-dessous :                                               │
│                                                             │
│  Email   [_________________________]                       │
│                                                             │
│                              [Recevoir un nouveau lien]     │
│                                                             │
│  Vous ne vous souvenez plus de votre email ?                │
│  Contactez votre coordinateur·rice pédagogique.             │
└────────────────────────────────────────────────────────────┘
```

### 4.4 — Page d'erreur — lien déjà utilisé

```
┌────────────────────────────────────────────────────────────┐
│  [Logo GRETA]                                              │
│                                                             │
│  Ce lien a déjà été utilisé                                 │
│  ════════════════════════════════════════════              │
│                                                             │
│  Votre compte est déjà activé. Connectez-vous avec votre    │
│  email et votre mot de passe.                               │
│                                                             │
│                              [Aller à la connexion]         │
│                                                             │
│  Mot de passe oublié ?                                      │
│  Utilisez le lien « Mot de passe oublié » sur la page       │
│  de connexion.                                              │
└────────────────────────────────────────────────────────────┘
```

### 4.5 — Page de connexion (référence — étape 2.0)

Pour information, la page de connexion qui sera l'aboutissement du parcours.

```
┌────────────────────────────────────────────────────────────┐
│  [Logo GRETA]                                              │
│                                                             │
│  Connexion au Livret d'apprentissage                        │
│  ════════════════════════════════════════════              │
│                                                             │
│  ┌──────────────────────────────────────────┐              │
│  │  [Microsoft] Se connecter avec Microsoft  │  ← personnel│
│  └──────────────────────────────────────────┘     GRETA    │
│                                                             │
│  ─────────────── ou ─────────────────────                 │
│                                                             │
│  Email             [_________________________]              │
│  Mot de passe      [_________________] [👁]                 │
│                                                             │
│                              [Se connecter]                 │
│                                                             │
│  Mot de passe oublié ? [Réinitialiser]                      │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Endpoints API

### 5.1 — `POST /api/users`

Créer un nouvel utilisateur (apprenti·e ou maître) et envoyer l'email d'activation.

**Accès** : coordo ou admin (via matrice de droits backend).

**Headers** :
```
Authorization: Bearer <token JWT session>
Content-Type: application/json
```

**Body** :
```json
{
  "role": "apprenti",
  "prenom": "Léa",
  "nom": "MARTIN",
  "email": "lea.martin@example.fr",
  "envoyerLienActivation": true,
  "metadonneesApprenti": {
    "dateNaissance": "2008-03-15",
    "formationId": "f-cap-cuisine-2025",
    "maitreId": "u-karim-benali",
    "contratDebut": "2025-09-01",
    "contratFin": "2027-06-30"
  }
}
```

**Réponses** :

| Code | Cas | Body |
|---|---|---|
| 201 Created | Succès, email envoyé | `{ "id": "uuid", "email": "...", "lienActivationEnvoye": true }` |
| 400 Bad Request | Validation échec | `{ "code": "VALIDATION", "champs": { "email": "invalide" } }` |
| 401 Unauthorized | Pas authentifié | — |
| 403 Forbidden | Pas les droits | `{ "code": "INTERDIT" }` |
| 409 Conflict | Email déjà utilisé | `{ "code": "EMAIL_EXISTE" }` |
| 502 Bad Gateway | Échec envoi Mailjet | `{ "code": "MAILJET_KO", "userId": "uuid" }` (compte créé mais email pas parti) |

### 5.2 — `GET /api/activate/:token`

Vérifier la validité d'un token d'activation et retourner les infos du compte associé.

**Accès** : public (pas d'auth).

**Réponses** :

| Code | Cas | Body |
|---|---|---|
| 200 OK | Token valide | `{ "prenom": "Léa", "nom": "MARTIN", "email": "...", "role": "apprenti", "metaFormation": { "intitule": "CAP Cuisine 2025-2026" } }` |
| 404 Not Found | Token inexistant ou inconnu | `{ "code": "TOKEN_INCONNU" }` |
| 410 Gone | Token expiré ou consommé | `{ "code": "TOKEN_EXPIRE" \| "TOKEN_CONSOMME" }` |
| 429 Too Many Requests | Rate limit dépassé | `{ "code": "RATE_LIMIT", "retryAfter": 300 }` |

### 5.3 — `POST /api/activate/:token`

Définir le mot de passe et activer le compte.

**Accès** : public (pas d'auth, le token tient lieu d'identification).

**Body** :
```json
{
  "password": "monNouveauMotDePasse",
  "mentionsAcceptees": true,
  "versionMentions": "v1.0-2026-06"
}
```

**Réponses** :

| Code | Cas | Body |
|---|---|---|
| 200 OK | Compte activé | `{ "sessionToken": "jwt...", "redirectTo": "/tableau-de-bord" }` |
| 400 Bad Request | MdP trop court | `{ "code": "MDP_TROP_COURT", "minimum": 12 }` |
| 400 Bad Request | Mentions non acceptées | `{ "code": "MENTIONS_OBLIGATOIRES" }` |
| 410 Gone | Token expiré/consommé entre temps | `{ "code": "TOKEN_EXPIRE" }` |
| 500 Internal Server Error | Erreur hashage / BDD | — |

### 5.4 — `POST /api/auth/login`

Connexion classique avec email + MdP.

**Accès** : public.

**Body** :
```json
{
  "email": "lea.martin@example.fr",
  "password": "monMotDePasse"
}
```

**Réponses** :

| Code | Cas | Body |
|---|---|---|
| 200 OK | Connecté | `{ "sessionToken": "jwt...", "user": { "id", "role", "prenom", "nom" } }` |
| 401 Unauthorized | Mauvais identifiants | `{ "code": "IDENTIFIANTS_INVALIDES" }` (volontairement vague pour ne pas révéler si l'email existe) |
| 403 Forbidden | Compte non activé | `{ "code": "COMPTE_NON_ACTIVE" }` |
| 429 Too Many Requests | Rate limit (5 échecs en 15 min sur même IP/email) | `{ "code": "RATE_LIMIT", "retryAfter": 900 }` |

### 5.5 — `POST /api/auth/resend-activation`

Renvoyer un email d'activation à un utilisateur dont le compte n'est pas encore activé.

**Accès** : public (mais limité par rate limit + ne révèle pas si l'email existe).

**Body** :
```json
{ "email": "lea.martin@example.fr" }
```

**Réponses** :

| Code | Cas | Body |
|---|---|---|
| 200 OK | Email envoyé (ou silencieusement ignoré si pas trouvé) | `{ "message": "Si un compte non activé existe pour cet email, un nouveau lien vient d'être envoyé." }` |
| 429 Too Many Requests | Rate limit (1 par heure par email) | `{ "code": "RATE_LIMIT", "retryAfter": 3600 }` |

**Note de sécurité** : la réponse 200 est volontairement la même que l'email existe ou pas, pour ne pas permettre l'énumération de comptes.

### 5.6 — `POST /api/auth/password-reset/request` (chantier 2.3)

Demander un email de réinitialisation de mot de passe.

**Accès** : public.

**Body** : `{ "email": "..." }`

**Réponses** : même logique que 5.5 (ne révèle pas si l'email existe).

### 5.7 — `POST /api/auth/password-reset/:token` (chantier 2.3)

Réinitialiser le mot de passe avec un token reçu par email.

**Body** : `{ "password": "nouveau" }`

Même validation que 5.3 (12 caractères min).

---

## 6. Structure BDD

PostgreSQL ≥ 14. Schéma proposé pour les tables liées à l'auth.

### 6.1 — Table `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            VARCHAR(20) NOT NULL
                  CHECK (role IN ('apprenti', 'maitre', 'formateur', 'coordo', 'admin')),
  prenom          VARCHAR(100) NOT NULL,
  nom             VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NULL,           -- NULL tant que compte non activé (ou auth via SSO Entra)
  activated_at    TIMESTAMP NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  auth_method     VARCHAR(20) NOT NULL DEFAULT 'local'
                  CHECK (auth_method IN ('local', 'entra_sso')),
  entra_user_id   VARCHAR(255) NULL,           -- ID Microsoft Entra pour le SSO
  mentions_acceptees_version VARCHAR(20) NULL,
  mentions_acceptees_at      TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by      UUID NULL REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_entra_user_id   ON users(entra_user_id) WHERE entra_user_id IS NOT NULL;
```

### 6.2 — Table `account_activation_tokens`

```sql
CREATE TABLE account_activation_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(64) NOT NULL UNIQUE,    -- SHA-256 du token (le clair n'est jamais stocké)
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,             -- = created_at + 7 jours
  consumed_at     TIMESTAMP NULL,
  ip_address_creation INET NULL,
  ip_address_consumption INET NULL
);

CREATE INDEX idx_activation_tokens_user_id      ON account_activation_tokens(user_id);
CREATE INDEX idx_activation_tokens_expires_at   ON account_activation_tokens(expires_at);

-- Job de purge des tokens expirés depuis > 30 jours (à exécuter quotidiennement)
-- DELETE FROM account_activation_tokens WHERE expires_at < NOW() - INTERVAL '30 days';
```

### 6.3 — Table `password_reset_tokens` (chantier 2.3)

Même structure que `account_activation_tokens`, mais avec une durée d'expiration plus courte (1 heure).

```sql
CREATE TABLE password_reset_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(64) NOT NULL UNIQUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMP NOT NULL,             -- = created_at + 1 heure
  consumed_at     TIMESTAMP NULL,
  ip_address_creation INET NULL,
  ip_address_consumption INET NULL
);

CREATE INDEX idx_reset_tokens_user_id    ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

### 6.4 — Table `audit_log` (traçabilité RGPD)

```sql
CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  occurred_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  actor_user_id   UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_role      VARCHAR(20) NULL,
  action          VARCHAR(50) NOT NULL,
                  -- valeurs : 'user.created', 'user.activated', 'user.password_changed',
                  --          'user.login_success', 'user.login_failure', 'user.password_reset_requested',
                  --          'user.password_reset_completed', 'user.deactivated'
  target_user_id  UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ip_address      INET NULL,
  user_agent      TEXT NULL,
  metadata        JSONB NULL
);

CREATE INDEX idx_audit_occurred_at     ON audit_log(occurred_at);
CREATE INDEX idx_audit_actor_user_id   ON audit_log(actor_user_id);
CREATE INDEX idx_audit_target_user_id  ON audit_log(target_user_id);
CREATE INDEX idx_audit_action          ON audit_log(action);
```

Conservation : 12 mois (à arbitrer avec le DPO). Purge automatique au-delà.

### 6.5 — Table `login_attempts` (rate limiting)

```sql
CREATE TABLE login_attempts (
  id              BIGSERIAL PRIMARY KEY,
  occurred_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  email_attempted VARCHAR(255) NULL,
  ip_address      INET NOT NULL,
  succeeded       BOOLEAN NOT NULL
);

CREATE INDEX idx_login_attempts_email_ip_time
  ON login_attempts(email_attempted, ip_address, occurred_at);

-- Job de purge des tentatives > 24 h (à exécuter quotidiennement)
```

---

## 7. Templates emails

Format Mailjet : templates HTML + texte parallèles (MJML pour le HTML, plain text pour le fallback).

### 7.1 — Email d'activation

**Expéditeur** : `noreply@<domaine-greta>` (« GRETA Lyon Métropole »)

**Objet** : `Activez votre compte Livret d'apprentissage GRETA`

**Corps texte brut** :

```
Bonjour {{prenom}} {{nom}},

Le GRETA Lyon Métropole a créé un compte pour vous sur le Livret
d'apprentissage numérique, qui vous permettra de suivre votre formation
en {{intitule_formation}}.

Pour activer votre compte et choisir votre mot de passe, cliquez sur le
lien ci-dessous :

  {{lien_activation}}

Ce lien est valide pendant 7 jours, jusqu'au {{date_expiration_lien}}.
Passé ce délai, vous pourrez en redemander un nouveau depuis la page
d'activation ou en contactant votre coordinateur·rice pédagogique.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
Aucun compte ne sera créé sans cette confirmation.

—
GRETA Lyon Métropole — {{nom_site}}
Contact DPO : dpo@<domaine-greta>
Mentions légales : https://livret.<domaine-greta>/mentions-legales
```

**Corps HTML** : reprise du template ci-dessus avec :
- Logo GRETA en en-tête (image fixe hébergée sur le domaine GRETA)
- Bouton « Activer mon compte » bien visible (bleu institutionnel)
- Pied de page institutionnel
- Format responsive (mobile + desktop)

### 7.2 — Email de confirmation d'activation

**Objet** : `Votre compte Livret d'apprentissage est actif`

**Corps texte brut** :

```
Bonjour {{prenom}} {{nom}},

Votre compte sur le Livret d'apprentissage GRETA Lyon Métropole est
maintenant actif.

Vous pouvez vous connecter à tout moment à l'adresse suivante :

  https://livret.<domaine-greta>

Identifiant : {{email}}

Si vous avez oublié votre mot de passe, utilisez le lien
« Mot de passe oublié » sur la page de connexion.

—
GRETA Lyon Métropole
Contact DPO : dpo@<domaine-greta>
```

### 7.3 — Email de notification au coordo (compte non activé après J+7)

**Destinataire** : coordo ayant créé le compte

**Objet** : `Compte non activé : {{prenom}} {{nom}}`

**Corps texte brut** :

```
Bonjour {{prenom_coordo}},

Le compte de {{prenom}} {{nom}} ({{email}}), créé le {{date_creation}},
n'a toujours pas été activé. Le lien envoyé par email a expiré.

Vous pouvez :
- Vérifier l'adresse email saisie
- Demander un renvoi du lien depuis la fiche utilisateur sur
  https://livret.<domaine-greta>/admin/utilisateurs

Si ce compte n'est plus nécessaire, vous pouvez le supprimer depuis la
même page.

—
GRETA Lyon Métropole
```

### 7.4 — Email de réinitialisation de mot de passe (chantier 2.3)

**Objet** : `Réinitialisation de votre mot de passe Livret GRETA`

**Corps texte brut** :

```
Bonjour {{prenom}} {{nom}},

Une demande de réinitialisation de votre mot de passe a été reçue pour
votre compte Livret d'apprentissage GRETA Lyon Métropole.

Pour choisir un nouveau mot de passe, cliquez sur le lien ci-dessous :

  {{lien_reinitialisation}}

Ce lien est valide pendant 1 heure, jusqu'à {{heure_expiration}}.
Passé ce délai, vous devrez refaire une demande depuis la page de
connexion.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
Votre mot de passe actuel reste valable.

—
GRETA Lyon Métropole
Contact DPO : dpo@<domaine-greta>
```

---

## 8. Conformité RGPD intégrée

### 8.1 — Points du référentiel `conformite-rgpd.md` couverts par ce chantier

| # réf. | Obligation | Comment c'est couvert ici |
|---|---|---|
| 1 | Responsable de traitement | Mention « GRETA Lyon Métropole » sur la page `/activer` + dans les emails |
| 2 | DPO | Contact `dpo@<domaine-greta>` dans la page d'activation + tous les emails + page mentions |
| 4 | Base légale | Mention « mission de service public éducatif » sur la page `/activer` |
| 5 | Finalités | Mention « suivi de votre apprentissage » sur la page `/activer` |
| 6 | Mentions d'information | Page `/mentions-legales` complète + résumé sur `/activer` + lien explicite |
| 12 | Minimisation | Aucun champ surnuméraire à l'activation (juste MdP + acceptation mentions) |
| 18 | Authentification + contrôle d'accès | SSO Entra (2FA Microsoft natif) pour staff + MdP 12 car. mini + rate limit pour apprenti·e/maître |
| 19 | Hashage robuste MdP | argon2id (recommandation OWASP 2024) avec paramètres adaptés |
| 20 | Contrôle d'accès backend | POST /api/users vérifie `peutEditer(actorRole, 'admin.utilisateurs.creer-apprenti')` côté serveur |
| 21 | Journalisation | Table `audit_log` enrichie à chaque action (création, activation, login, échec) |
| 25 | Inventaire + DPA sous-traitants | Mailjet ajouté au registre des traitements |
| 26 | DPA Microsoft Entra | DPA standard via tenant Azure (cf. chantier 2.1) |
| 27 | DPA Mailjet | Mailjet (France) — DPA standard signé à l'inscription Mailjet |
| 28 | Cadrage transferts hors UE | Mailjet hébergé en France (pas de transfert) ; transfert Microsoft Entra documenté au registre |

> **Note** : les notices distinctes par catégorie et le langage adapté « niveau 3ᵉ » sont désormais **recommandés** (non obligatoires) depuis le retrait des mineurs — cf. `conformite-rgpd.md` §4 (R3).

### 8.2 — Traçabilité de l'acceptation des mentions

À chaque activation, on enregistre dans la table `users` :
- `mentions_acceptees_version` (ex : `v1.0-2026-06`) — versionnement de la politique de confidentialité
- `mentions_acceptees_at` (timestamp)

Si la version des mentions change ultérieurement, l'utilisateur·rice devra ré-accepter au prochain login (mécanisme à spécifier dans un chantier séparé si nécessaire).

### 8.3 — Logs RGPD (table `audit_log`)

À journaliser systématiquement :
- `user.created` (acteur = coordo, cible = nouveau compte)
- `user.activation_email_sent` (Mailjet OK)
- `user.activation_email_failed` (Mailjet KO, à investiguer)
- `user.activated` (acteur = lui-même, cible = lui-même)
- `user.login_success`
- `user.login_failure`
- `user.password_reset_requested`
- `user.password_reset_completed`
- `user.deactivated` (acteur = coordo, cible = compte)

Conservation : 12 mois (à arbitrer DPO).

### 8.4 — Anti-énumération des comptes

Les endpoints publics (`/api/auth/resend-activation`, `/api/auth/password-reset/request`) répondent **toujours** par un 200 avec le même message, qu'un compte existe ou non pour l'email saisi. Cela empêche un attaquant d'utiliser ces endpoints pour découvrir qui a un compte sur la plateforme.

### 8.5 — Rate limiting

| Endpoint | Limite | Raison |
|---|---|---|
| `POST /api/auth/login` | 5 échecs / 15 min par couple (email, IP) | Anti brute-force MdP |
| `POST /api/auth/resend-activation` | 1 par heure par email | Anti spam, économie quota Mailjet |
| `POST /api/auth/password-reset/request` | 3 par heure par email | Anti spam, économie quota Mailjet |
| `GET /api/activate/:token` | 10 par minute par IP | Anti scan de tokens |

---

## 9. Tests à prévoir

### 9.1 — Tests unitaires (Vitest)

| Module | Tests |
|---|---|
| `lib/auth/genererTokenActivation.ts` | Génération aléatoire 32 octets, format hexadécimal, unicité statistique |
| `lib/auth/hasherToken.ts` | SHA-256 cohérent, irréversible |
| `lib/auth/hasherMotDePasse.ts` | argon2id, paramètres conformes OWASP, asynchrone |
| `lib/auth/validerMotDePasse.ts` | Politique 12 caractères mini, tous caractères acceptés |
| `lib/auth/genererSessionJWT.ts` | Format JWT, expiration, signature |

### 9.2 — Tests d'intégration backend (Vitest + supertest)

| Scénario | Endpoint |
|---|---|
| Création de compte par coordo, email envoyé | POST /api/users |
| Création refusée par formateur (matrice) | POST /api/users |
| Création refusée si email déjà utilisé | POST /api/users |
| Vérification token valide | GET /api/activate/:token |
| Vérification token expiré | GET /api/activate/:token |
| Vérification token consommé | GET /api/activate/:token |
| Activation avec MdP conforme | POST /api/activate/:token |
| Activation refusée si MdP trop court | POST /api/activate/:token |
| Activation refusée si mentions non acceptées | POST /api/activate/:token |
| Connexion réussie | POST /api/auth/login |
| Connexion échouée — mauvais MdP | POST /api/auth/login |
| Connexion bloquée après 5 échecs (rate limit) | POST /api/auth/login |
| Renvoi de lien d'activation | POST /api/auth/resend-activation |
| Anti-énumération : réponse identique si email inconnu | POST /api/auth/resend-activation |

### 9.3 — Tests E2E (Playwright)

| Scénario | Parcours |
|---|---|
| Création complète d'un compte apprenti·e par coordo + activation par l'apprenti·e | `/admin/utilisateurs` → email simulé → `/activer/[token]` → tableau de bord |
| Tentative d'activation avec lien expiré → page erreur → demande nouveau lien | `/activer/[token expiré]` → `/lien-expire` |
| Tentative d'activation avec lien déjà utilisé → page erreur → page connexion | `/activer/[token consommé]` → `/lien-deja-utilise` → `/connexion` |
| Connexion réussie après activation | `/connexion` → tableau de bord |
| Mot de passe oublié → réinitialisation (chantier 2.3) | `/connexion` → `/reinitialiser-mdp` |

### 9.4 — Tests de sécurité spécifiques

| Test | Méthode |
|---|---|
| Injection SQL sur les endpoints publics | Tests automatisés avec payloads |
| Énumération de comptes via réponses différentes | Tests automatisés |
| Bypass de la matrice de droits côté backend | Tests d'intégration |
| Brute force sur MdP | Vérification du rate limit |
| Brute force sur token d'activation | Vérification du rate limit |
| Token réutilisable | Test consommation unique |
| Pentest externe avant mise en production | Cabinet PASSI |

---

## 10. Estimation de charge

### 10.1 — Chantier 2.2 (création comptes + activation)

| Phase | Charge | Détail |
|---|---|---|
| Configuration Mailjet + DNS (DKIM/SPF/DMARC) | 0,5 j | Inscription compte, configuration domaine, validation par référente qualité GRETA |
| Templates emails MJML + texte | 0,5 j | 3 templates (activation, confirmation, notification coordo) avec branding GRETA |
| Endpoints API backend | 1 j | 5 endpoints + middleware rate limiting + middleware d'audit log |
| Pages frontend (admin modal + activation + erreurs) | 1 j | Adaptation modales admin + nouvelle page `/activer` + pages d'erreur |
| Tests (unit + intégration + E2E) | 1 j | Couverture complète des cas |
| Documentation + revue + validation | 0,5 j | Mise à jour MD, code review, validation pilote |
| **Total chantier 2.2** | **4,5 j** | |

### 10.2 — Chantier 2.3 (mots de passe : reset + change)

| Phase | Charge | Détail |
|---|---|---|
| Endpoints API (request reset, reset, change password from profile) | 0,5 j | 3 endpoints + rate limiting |
| Templates email réinitialisation | 0,25 j | 1 template MJML + texte |
| Pages frontend (« Mot de passe oublié » + page profil) | 0,5 j | 2 pages + intégration UX |
| Tests | 0,5 j | Couverture des cas |
| Documentation + validation | 0,25 j | |
| **Total chantier 2.3** | **2 j** | |

### 10.3 — Cumul 2.2 + 2.3

**~6,5 jours** une fois le backend Node + PostgreSQL en place (chantier 2.0).

---

## 11. Dépendances et séquencement

### 11.1 — Diagramme de dépendances

```
┌────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2.0 — Backend minimal (préalable indispensable)          │
│ - Serveur Node Express                                          │
│ - Base PostgreSQL                                               │
│ - Middleware auth (JWT)                                         │
│ - Migration des données fixtures vers BDD                       │
│ Charge : ~4-5 j                                                 │
└────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                                ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ ÉTAPE 2.1 — SSO Entra ID     │  │ ÉTAPE 2.2 — Création comptes │
│ - openid-client v5            │  │ (CE CHANTIER)                 │
│ - Mapping rôles Entra         │  │ - Mailjet + templates         │
│ - Tests OIDC                  │  │ - Endpoints + pages           │
│ Charge : ~1 j                 │  │ - Tests                       │
│                               │  │ Charge : ~4,5 j               │
└──────────────────────────────┘  └──────────────────────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────────┐
                                  │ ÉTAPE 2.3 — Mots de passe     │
                                  │ - Mot de passe oublié         │
                                  │ - Change MdP depuis profil    │
                                  │ Charge : ~2 j                 │
                                  └──────────────────────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────────┐
                                  │ Mise en production étape 2   │
                                  │ - Pentest pré-prod (cabinet)  │
                                  │ - Analyse non-AIPD tracée     │
                                  │ - Bascule progressive         │
                                  └──────────────────────────────┘
```

### 11.2 — Pré-requis avant démarrage du chantier 2.2

| Pré-requis | Responsable | Statut |
|---|---|---|
| Backend Node + PostgreSQL fonctionnel (étape 2.0) | Dev | À faire |
| Nom de domaine GRETA propre acquis | Pilote / DSI GRETA | À faire |
| DNS configuré (A/AAAA + DKIM/SPF/DMARC pour Mailjet) | Pilote / DSI GRETA | À faire |
| Compte Mailjet créé sur le domaine GRETA | Pilote | À faire |
| Logo GRETA au format PNG haute résolution | Référente qualité GRETA | À fournir |
| Charte graphique emails (couleurs, mentions) | Référente qualité GRETA | À fournir |
| Mentions d'information validées par DPO | DPO GRETA | À valider |
| Analyse de non-nécessité de l'AIPD documentée (cf. `conformite-rgpd.md` §5) | DPO GRETA | À faire |

---

## 12. Validation et go / no-go

### 12.1 — Critères de go pour l'implémentation

- [ ] Backend Node + PostgreSQL en place (étape 2.0 terminée)
- [ ] Nom de domaine GRETA acquis + DNS configuré
- [ ] Compte Mailjet créé et validé
- [ ] Logo et charte emails fournis par la référente qualité
- [ ] Mentions d'information validées par le DPO
- [ ] Analyse de non-nécessité de l'AIPD documentée (cf. `conformite-rgpd.md` §5)

### 12.2 — Critères de recette fonctionnelle

- [ ] Un coordo peut créer un compte apprenti·e et envoyer le lien d'activation
- [ ] Un coordo peut créer un compte maître et envoyer le lien d'activation
- [ ] L'apprenti·e reçoit l'email dans sa boîte de réception (pas dans les spams)
- [ ] L'apprenti·e peut activer son compte et définir son mot de passe
- [ ] L'apprenti·e est automatiquement connecté après activation
- [ ] Un lien expiré affiche la page d'erreur dédiée + possibilité de renvoi
- [ ] Un lien déjà utilisé affiche la page d'erreur dédiée + redirection vers connexion
- [ ] La connexion ultérieure fonctionne avec email + MdP
- [ ] La case d'acceptation des mentions est obligatoire et tracée en BDD
- [ ] Tous les tests automatisés passent (unit + intégration + E2E)

### 12.3 — Critères de recette sécurité et RGPD

- [ ] Le rate limiting fonctionne sur tous les endpoints publics
- [ ] L'énumération de comptes n'est pas possible (mêmes réponses si email connu/inconnu)
- [ ] Les MdP sont hashés avec argon2id (paramètres conformes OWASP 2024)
- [ ] Les tokens d'activation sont hashés en BDD (jamais en clair)
- [ ] La matrice de droits est vérifiée côté backend (pas seulement côté client)
- [ ] L'audit log est alimenté pour chaque action sensible
- [ ] Pentest externe réalisé et findings remédiés (recommandé — cf. `conformite-rgpd.md` §4 R6)
- [ ] Analyse de non-nécessité de l'AIPD documentée par le DPO (AIPD non obligatoire sans mineurs — cf. `conformite-rgpd.md` §5)
- [ ] DPA Mailjet signé et archivé
- [ ] Registre des traitements à jour

### 12.4 — Critères de recette UX

- [ ] Référente qualité GRETA valide le branding des emails
- [ ] Référente qualité GRETA valide la formulation des notices apprenti·e + maître
- [ ] Test utilisateur avec 2-3 apprenti·e·s pilote sur le parcours d'activation
- [ ] Test utilisateur avec 2-3 maîtres pilote sur le parcours d'activation
- [ ] Pas d'incompréhension majeure remontée lors des tests

---

*Document de spécification — Chantier création comptes étape 2. Cf. [`PROJECT-STATUS.md`](PROJECT-STATUS.md) §12.2, [`TODO-etape-2.md`](TODO-etape-2.md) et [`conformite-rgpd.md`](conformite-rgpd.md).*
