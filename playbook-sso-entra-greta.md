# Playbook — SSO Microsoft Entra ID × GRETA Lyon Métropole

> **À qui c'est destiné** : moi-même (et Claude) la prochaine fois qu'on intègre un SSO Entra sur un nouveau projet GRETA.
> **Pourquoi ce doc** : `sso-entra-id-cadrage.md` est le journal détaillé du projet Suivi Pédagogique. Ce playbook en extrait **la recette, les pièges, et les parades** pour gagner ~1 jour de tâtonnement sur le prochain projet.
> **Tenant cible** : `GRETA CFA Lyon Métropole` — ID `bc139aaa-fea0-465b-8d3d-be26ed74675d`
> **Référent** : Guillaume Ferreri (Global Admin tenant)
> **Dernière mise à jour** : 2026-05-19

---

## 1. Quand utiliser ce playbook

Tu déploies une nouvelle app web et tu veux que les agents GRETA s'y connectent avec leur compte Microsoft 365 (au lieu de login/mot de passe).

**Si l'une de ces conditions est vraie, ce playbook s'applique :**
- L'app a un backend Node.js (Express ou autre) ou peut en intégrer un
- Tu veux gérer 20-100+ utilisateurs internes GRETA sans saisir de mots de passe
- Tu as besoin de rôles différenciés (admin / lecteur, minimum)
- Tu peux mettre en HTTPS l'app sur un FQDN public

**Estimation honnête** : 1 journée bien rythmée (DNS + HTTPS + Entra + code + tests). Sans ce playbook, ~2 jours (les pièges §5 prennent ~½ journée à eux seuls).

---

## 2. Pré-requis non négociables

| # | Élément | Pourquoi |
|---|---------|----------|
| 1 | **Domaine public** + DNS modifiable | Entra refuse les redirect_uri non-HTTPS |
| 2 | **HTTPS valide** (Let's Encrypt / autre) | idem |
| 3 | **Reverse proxy** devant ton app | Traefik si tu réutilises le VPS GRETA-Hostinger ; sinon nginx/Caddy |
| 4 | **Accès Global Admin** au tenant `GRETA Lyon Métropole` | Pour créer l'App Registration et donner le consentement initial |
| 5 | **Backend Node ≥ 18** avec accès au système de fichiers (pour `openid-client` v5) | Lib privilégiée |
| 6 | **Une session déjà active** pour les utilisateurs (cookie / JWT…) | OIDC remplit ce qui existe, ne réécrit pas ton modèle d'auth |

---

## 3. Décisions cadrage — à reprendre tel quel

Décisions prises sur Suivi Pédagogique, **applicables à tout futur projet GRETA sauf raison contraire**. Évite de re-débattre.

| # | Décision | Choix retenu | Justification courte |
|---|----------|--------------|----------------------|
| D1 | Stratégie d'auth | **Dual** : SSO + login classique en fallback | Filet de sécurité si Entra tombe / pour comptes hors tenant |
| D2 | Mapping de rôles | **App Roles Entra** (pas de Group claims) | Pas d'appel Graph supplémentaire, simple |
| D3 | Provisioning | **JIT** + "Affectation requise = **No**" | Tout user tenant peut se connecter (rôle `lecteur` par défaut). Trop pénible d'assigner 20-100 personnes une par une. |
| D4 | Identifiant technique | **`oid` Entra** stocké dans `users.entra_oid` | GUID immuable, email peut changer |
| D5 | Hors-tenant (gmail, etc.) | **Login classique conservé** | Évite de migrer en force |
| D6 | Bibliothèque OIDC | **`openid-client` v5** | Mainstream, minimaliste, PKCE/state gérés |
| D7 | Validation du token | **JWKS + audience + issuer + exp** côté serveur | Standard OIDC |

---

## 4. Recette de mise en place

### Phase A — Infra (≈ 1 h)

**A.1 DNS**
- Pointer l'apex du domaine (`@`) et `www` vers l'IP du VPS
- Si Hostinger : utiliser leur API (token dans `.claude/`) ; sinon dashboard
- **Vérifier la propagation autoritaire** avant Phase B (5-30 min) :
  ```bash
  dig +short @nova.dns-parking.com <domaine>
  ```

**A.2 HTTPS via Traefik (sur VPS GRETA-Hostinger)**
- Ajouter un fichier de config dynamique : `/docker/n8n/dynamic/<projet>.yml`
- Routeur HTTPS + redirect HTTP→HTTPS + service vers `host.docker.internal:<port>`
- certResolver à utiliser : `mytlschallenge` (TLS-ALPN-01 déjà configuré dans le compose Traefik existant)
- Backup l'ancien fichier dans `/docker/n8n/.backups/<timestamp>/` avant tout edit
- Traefik recharge à chaud (file provider `watch=true`), pas besoin de restart container
- Cert Let's Encrypt émis en ~25 s

**A.3 Cookie de session**
- En env : `SECURE_COOKIE=true` (flag `Secure` sur les cookies)
- Dans le code, le cookie doit être en **`SameSite=Lax`** ([voir piège P1 §5](#5-pièges-rencontrés))

**Critère de sortie Phase A** : `curl -I https://<domaine>` répond 200 et le cert est valide.

---

### Phase B — Configuration Entra ID (≈ 20 min, Guillaume seul)

**B.1 Créer l'App Registration**
- Portail : <https://entra.microsoft.com> → **Applications** → **App registrations** → **+ New registration**
- Nom : explicite (`<Projet> — GRETA CFA Lyon Métropole`)
- Account types : **Single tenant**
- Redirect URI :
  - Type : **Web**
  - URL : `https://<domaine>/auth/callback`
- **Register**

**B.2 Capturer les 3 secrets** (à transmettre à Claude / ranger dans `.env`)
- **Application (client) ID** → `ENTRA_CLIENT_ID`
- **Directory (tenant) ID** → `ENTRA_TENANT_ID` (= `bc139aaa-fea0-465b-8d3d-be26ed74675d` pour GRETA Lyon)
- **Client Secret** : onglet **Certificates & secrets** → **+ New client secret** → expiration **24 months max**
  - ⚠️ **Copier la valeur tout de suite**, elle ne sera plus jamais affichée
  - Description suggérée : `<projet>-prod-<année>`
  - **Mettre un reminder agenda à 18 mois** pour rotation

**B.3 Créer 2 App Roles**
Onglet **App roles** → **+ Create app role** (× 2) :

| Display name | Value | Allowed member types | Description |
|---|---|---|---|
| `Admin` | `Admin` | Users/Groups | Accès complet à l'application |
| `Reader` | `Reader` | Users/Groups | Accès lecture seule |

**B.4 Token configuration — claims optionnels ⚠️**
Onglet **Token configuration** → **Add optional claim** → ID token → cocher :
- `given_name`
- `family_name`
- `email`

Sinon les comptes JIT créés ont des `display_name` vides (cf. [piège P3 §5](#5-pièges-rencontrés)).

**B.5 Assignment required = No**
**Enterprise applications** → trouver l'app → **Properties** → **Assignment required? = No** → Save.

Tout utilisateur du tenant pourra alors se connecter (en `lecteur` par défaut via JIT). Tu n'assignes explicitement que les **admins** dans **Users and groups**.

**Critère de sortie Phase B** : tu peux faire un test sur <https://jwt.ms> en collant une URL d'auth manuelle, et tu vois ton ID token avec le claim `roles: ["Admin"]`.

---

### Phase C — Code backend (≈ 2 h)

**C.1 Dépendance**
```bash
npm install openid-client@^5
```

**C.2 Migration DB (SQLite avec better-sqlite3, à adapter)**

Dans `server.js` au démarrage (idempotent, wrap try/catch) :
```js
try { db.exec("ALTER TABLE users ADD COLUMN entra_oid TEXT DEFAULT NULL"); } catch(e) {}
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_entra_oid ON users(entra_oid) WHERE entra_oid IS NOT NULL"); } catch(e) {}
```

⚠️ **L'index unique partiel doit être créé en JS, pas dans `schema.sql`** : un `CREATE INDEX` après un `CREATE TABLE IF NOT EXISTS` ne refait pas l'index si la table existait déjà sans la colonne — donc il faut le faire après l'`ALTER`.

Le `password_hash` doit tolérer les comptes SSO-only : utiliser une valeur sentinelle `'SSO_ONLY'` (jamais matchée par bcrypt.compare).

**C.3 Init OIDC asynchrone**
```js
const { Issuer, generators } = require('openid-client');
let ssoClient = null;
async function initSSO() {
  if (!process.env.ENTRA_TENANT_ID) return;
  const issuer = await Issuer.discover(
    `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`
  );
  ssoClient = new issuer.Client({
    client_id: process.env.ENTRA_CLIENT_ID,
    client_secret: process.env.ENTRA_CLIENT_SECRET,
    redirect_uris: [`${process.env.APP_BASE_URL}/auth/callback`],
    response_types: ['code'],
  });
}
initSSO().catch(e => console.error('SSO init failed:', e));
```

**C.4 Routes**
```js
// État OIDC temporaire (en RAM ou Redis si multi-instance)
const ssoStates = new Map();

app.get('/auth/login', (req, res) => {
  if (!ssoClient) return res.status(503).send('SSO non configuré');
  const state = generators.state();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  ssoStates.set(state, { code_verifier, ts: Date.now() });
  // Garbage collect les states de plus de 10 min
  for (const [k, v] of ssoStates) if (Date.now() - v.ts > 600000) ssoStates.delete(k);
  const url = ssoClient.authorizationUrl({
    scope: 'openid profile email',
    state, code_challenge, code_challenge_method: 'S256',
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const params = ssoClient.callbackParams(req);
  const stored = ssoStates.get(params.state);
  if (!stored) return res.status(400).send('State invalide');
  ssoStates.delete(params.state);
  const tokenSet = await ssoClient.callback(
    `${process.env.APP_BASE_URL}/auth/callback`,
    params,
    { state: params.state, code_verifier: stored.code_verifier }
  );
  const claims = tokenSet.claims();
  // JIT upsert (cf. C.5)
  const user = upsertUserFromClaims(claims);
  // Set cookie JWT applicatif (comme ton login classique)
  const jwt = signAppJWT(user);
  res.cookie('token', jwt, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIE === 'true',
    sameSite: 'lax',          // ← lax obligatoire, pas strict (cf. P1)
    maxAge: 7 * 24 * 3600 * 1000,
  });
  res.redirect('/');
});
```

**C.5 JIT upsert avec fallback display_name**

```js
function upsertUserFromClaims(claims) {
  const oid = claims.oid;
  const email = claims.email || claims.preferred_username || '';
  // Cascade fallback pour le nom — Entra peut ne renvoyer aucun de ces champs
  const nom =
    [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim()
    || claims.name
    || email.split('@')[0]
    || 'Utilisateur GRETA';
  // Mapping App Role → rôle applicatif
  const roles = claims.roles || [];
  const role = roles.includes('Admin') ? 'admin' : 'lecteur';
  // Recherche
  let user = db.prepare('SELECT * FROM users WHERE entra_oid = ?').get(oid);
  if (user) {
    db.prepare('UPDATE users SET nom = ?, email = ?, role = ? WHERE entra_oid = ?')
      .run(nom, email, role, oid);
  } else {
    db.prepare(`INSERT INTO users (email, password_hash, nom, role, entra_oid)
                VALUES (?, 'SSO_ONLY', ?, ?, ?)`)
      .run(email, nom, role, oid);
    user = db.prepare('SELECT * FROM users WHERE entra_oid = ?').get(oid);
  }
  // Logging
  logActivity(user.id, 'Connexion SSO', email);
  return user;
}
```

**C.6 Route `/api/config` (consommée par le frontend)**
```js
app.get('/api/config', (req, res) => {
  res.json({ sso_enabled: !!ssoClient });
});
```

---

### Phase D — Code frontend (≈ 30 min)

Sur la page de login, ajouter un bouton conditionnel à `/api/config` :

```js
fetch('/api/config').then(r => r.json()).then(cfg => {
  if (cfg.sso_enabled) {
    document.getElementById('ssoSlot').innerHTML =
      '<a href="/auth/login" class="btn btn-p">' +
      '<svg>🔒</svg> Se connecter avec son compte Greta' +
      '</a>';
  }
});
```

⚠️ **Ne pas mettre de logo Microsoft sur le bouton** (cf. [P4 §5 anti-phishing](#5-pièges-rencontrés)). Texte suffisant : « Se connecter avec son compte Greta ».

---

### Phase E — Tests (≈ 30 min)

Dans l'ordre :

1. **Smoke test infra** : `curl -sS -o /dev/null -w 'HTTP %{http_code}\n' https://<domaine>/api/config` → `200`, body contient `{"sso_enabled":true}`.
2. **Test redirect** : ouvrir `https://<domaine>/auth/login` dans un navigateur en navigation privée → doit rediriger vers `login.microsoftonline.com/<tenant>/...` avec `state=` et `code_challenge=` en query.
3. **Test 1er admin (Global Admin)** : se connecter avec ton compte. Première fois, Entra affiche « Approbation administrateur requise » → cliquer **« Vous possédez un compte administrateur »** et cocher **« Accepter au nom de votre organisation »**. Une fois fait, plus jamais demandé. ([cf. P2 §5](#5-pièges-rencontrés))
4. **Test 2 user lambda** : un compte tenant non-admin se connecte → arrive en `lecteur`.
5. **Test 3 mapping Admin** : assigner un user au rôle `Admin` dans Entra → il arrive en `admin` à la prochaine connexion.
6. **Test 4 refus externe** : tentative depuis un Gmail / Outlook personnel → erreur Entra « compte externe non autorisé ». Conforme.
7. **Test 5 login classique** : le compte fallback (D1) doit toujours fonctionner.
8. **Test 6 déconnexion** : cookie effacé, retour login. (Pas de logout fédéré M365 dans cette itération.)
9. **Test 7 journal** : vérifier que `activity_log` enregistre `Connexion SSO` avec l'email.

---

## 5. Pièges rencontrés (et parades)

C'est **la section la plus utile** de ce playbook. Chaque piège a coûté ≥30 min sur Suivi Pédagogique.

### P1 — Cookie `SameSite=Strict` casse OIDC

**Symptôme** : tu reviens d'Entra après auth, le callback s'exécute, le cookie est posé… mais la requête suivante (`GET /`) n'envoie pas le cookie. Tu es renvoyé sur login.

**Cause** : `SameSite=Strict` interdit l'envoi du cookie quand la navigation vient d'un domaine externe (la mire `login.microsoftonline.com` est externe).

**Parade** : passer le cookie en **`SameSite=Lax`** (suffisant niveau sécurité pour un cookie de session). Une ligne à changer dans `res.cookie(...)`.

```js
res.cookie('token', jwt, { sameSite: 'lax', /* ... */ });
```

---

### P2 — « Approbation administrateur requise » au 1er login

**Symptôme** : un user lambda du tenant clique « Se connecter avec son compte Greta », la mire Microsoft affiche « Cette application a besoin de l'approbation d'un administrateur de votre organisation ». L'user est bloqué.

**Cause** : Entra requiert le **consentement** à la 1ère utilisation. Tant qu'aucun Global Admin n'a explicitement consenti pour l'organisation, chaque user devrait consentir individuellement (et Entra le refuse par défaut).

**Parade** : se connecter **une fois** avec un compte Global Admin (Guillaume). Entra affiche alors un écran spécifique avec l'option **« Vous possédez un compte administrateur »** → cocher **« Accepter au nom de votre organisation »**. Désormais tous les users tenant passent sans écran de consentement.

**Alternative proactive** : dans le portail Entra, aller dans **Enterprise applications** → l'app → **Permissions** → **Grant admin consent for <tenant>**. Effet identique, à faire avant le rollout.

---

### P3 — Display name vide après JIT

**Symptôme** : les comptes créés par JIT ont un `nom` vide ou égal à l'email — alors que les claims `roles` arrivent bien.

**Cause** : Entra ne renvoie **pas** `given_name`/`family_name` dans l'ID token par défaut, même si ces champs existent dans le profil utilisateur. Seuls `oid`, `sub`, `preferred_username`, `roles` sont garantis.

**Parade en 2 temps** :
1. **Côté Entra** : Token configuration → ajouter les **claims optionnels** `given_name`, `family_name`, `email` pour l'ID token.
2. **Côté code** : fallback en cascade dans l'upsert JIT, pour les cas où les claims arriveraient encore vides (comptes invités, schémas RH atypiques) :
   ```js
   const nom = [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim()
            || claims.name
            || (claims.email || claims.preferred_username || '').split('@')[0]
            || 'Utilisateur GRETA';
   ```

---

### P4 — Chrome flag « Site dangereux » sur nouveau domaine

**Symptôme** : Chrome / Edge affiche l'écran rouge **« Site dangereux »** ou **« Hameçonnage »** dès que le domaine est neuf et qu'il y a une page de login avec mention « Microsoft ».

**Cause** : Safe Browsing détecte (1) un domaine fraîchement enregistré + (2) une page de login imitant l'aspect Microsoft + (3) pas de réputation = probablement du phishing.

**Parades cumulatives** (toutes recommandées sur tout nouveau projet GRETA) :

1. **Pas de logo Microsoft** sur le bouton SSO. Texte « Se connecter avec son compte Greta ». Icône cadenas sobre si besoin.
2. **Mention « outil interne »** visible sur la page de login.
3. **Security headers stricts** via Traefik :
   - `Strict-Transport-Security: max-age=15552000; includeSubDomains; preload`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` autorisant `login.microsoftonline.com` en `frame-src`/`form-action` mais rien d'autre côté externe
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), ...` (tout désactivé)
4. **`<meta name="robots" content="noindex,nofollow">`** dans `<head>` (signal "site privé").
5. **Retirer `x-powered-by`** côté Express (`app.disable('x-powered-by')`).
6. **Vérifier le domaine sur Search Console** (TXT record DNS, automatisable via API Hostinger).
7. **Soumettre une review** sur <https://safebrowsing.google.com/safebrowsing/report_error/> — déflag obtenu en 24-72 h.

Si tu fais tout ça d'entrée, en pratique le flag arrive rarement / disparaît vite.

---

### P5 — Affectation manuelle des users intenable à l'échelle

**Symptôme** : tu assignes manuellement 20+ utilisateurs un par un dans `Enterprise applications → Users and groups`. Au-delà de 5, c'est insupportable. Ajouter un user oublie tout le monde de te le signaler.

**Cause initiale** : par défaut sur Suivi Pédagogique on était parti sur **« Assignment required = Yes »** (= seuls les users assignés peuvent se connecter).

**Parade** : passer à **« Assignment required = No »** → tout user du tenant peut se connecter. Le JIT les crée en rôle **`lecteur`** par défaut. Tu n'assignes alors explicitement que les **admins** (= 2-5 personnes max).

⚠️ Implication : si l'app contient des données sensibles, garder `Assignment required = Yes`. Sinon, le tradeoff "facilité opérationnelle" gagne.

---

### P6 — Client Secret affiché une seule fois

**Symptôme** : tu fermes l'onglet, tu oublies de noter la valeur, ou tu la perds. Plus moyen de la récupérer.

**Parade** :
- **Copier la Value** (pas la Secret ID) immédiatement dans le `.env` ou un coffre.
- Si perdu : créer un nouveau secret, mettre à jour `.env`, restart pm2. L'ancien secret reste valide jusqu'à expiration mais devient inutilisé.
- **Reminder agenda à 18 mois** (3 mois avant l'expiration des 24 mois max d'Entra) pour rotation.

---

### P7 — `host.docker.internal` côté Traefik

**Symptôme** : Traefik logue une erreur de DNS sur `host.docker.internal` quand il tente d'atteindre l'app Node qui tourne sur le host.

**Cause** : `host.docker.internal` n'est résolu par défaut que sur Docker Desktop (Mac/Windows). Sur Linux (le VPS Hostinger), il faut soit l'ajouter via `extra_hosts: ["host.docker.internal:host-gateway"]` dans le compose, soit utiliser l'IP du bridge Docker (`172.17.0.1` typiquement).

**Parade VPS Hostinger** : la config docker-compose existante a déjà `extra_hosts: ["host.docker.internal:host-gateway"]`. Si nouveau VPS, ajouter cette ligne dans le service Traefik. Sinon `172.17.0.1` marche.

---

### P8 — Schema SQL recréé sans index unique partiel

**Symptôme** : tu redéploies, l'index `idx_users_entra_oid` disparaît, tu commences à avoir des doublons d'`entra_oid` au JIT.

**Cause** : `db/schema.sql` contient `CREATE TABLE IF NOT EXISTS users (...)` qui ignore les nouvelles colonnes. L'index, lui, n'est pas dans le schéma initial.

**Parade** : **toujours** déclarer les évolutions de schéma (ALTER + nouveaux INDEX) **dans `server.js` au démarrage**, en `try/catch` idempotent. Ne pas se reposer sur `schema.sql` pour les évolutions post-MVP.

```js
// Au démarrage, après le db.exec(schema)
try { db.exec("ALTER TABLE users ADD COLUMN entra_oid TEXT DEFAULT NULL"); } catch(e) {}
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_entra_oid ON users(entra_oid) WHERE entra_oid IS NOT NULL"); } catch(e) {}
```

---

### P9 — CSP qui bloque la mire Microsoft

**Symptôme** : tu cliques « Se connecter avec son compte Greta », le navigateur ouvre la mire et… `Refused to frame 'login.microsoftonline.com' because it violates the following Content Security Policy directive`.

**Cause** : CSP `frame-src 'self'` par défaut. Mais nous on fait une **redirection** (302), pas un iframe, donc en principe pas de souci. Toutefois `form-action` peut bloquer le POST du formulaire d'auth s'il revient sur ton domaine.

**Parade** : CSP autoriser explicitement `form-action 'self' login.microsoftonline.com` et `frame-src 'self' login.microsoftonline.com` (par sécurité).

```yaml
# Dans le middleware Traefik security-headers
contentSecurityPolicy: >
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self';
  frame-src 'self' https://login.microsoftonline.com;
  form-action 'self' https://login.microsoftonline.com;
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
```

---

### P10 — Avec Auth.js (NextAuth v5), la redirect URI n'est PAS libre

**Symptôme** : `AADSTS50011: The redirect URI specified in the request does not
match the redirect URIs configured for the application`.

**Cause** : la Phase B de ce playbook propose `https://<domaine>/auth/callback`,
qui vient d'une implémentation OIDC maison. Auth.js impose la sienne, dérivée de
l'id du provider.

**Parade** : enregistrer exactement
`https://<domaine>/api/auth/callback/microsoft-entra-id`.

Et les variables suivent la convention Auth.js, pas celle du §7 de ce playbook :
`AUTH_MICROSOFT_ENTRA_ID_ID`, `_SECRET`, `_ISSUER` (ce dernier au format
`https://login.microsoftonline.com/<tenant-id>/v2.0`).

---

### P11 — « Approbation administrateur requise » en boucle (vécu 2026-07-28)

**Symptôme** : après authentification, écran « Approbation administrateur
requise ». Cliquer « Vous possédez un compte administrateur ? » ramène au
sélecteur de comptes, indéfiniment. Dans le portail, le bouton « Accorder un
consentement d'administrateur » est **grisé**.

**Cause** : le tenant **interdit le consentement par l'utilisateur**. Même des
étendues anodines (`openid`, `profile`, `email`, `User.Read`) exigent alors un
consentement administrateur. La boucle vient de ce qu'on re-sélectionne un
compte sans rôle d'administration.

**Parade** : un compte **Administrateur général**, **Administrateur
d'application cloud** ou **Administrateur d'application** accorde le
consentement — par le bouton du portail, ou par l'URL dédiée (aucun secret
dedans) :

```
https://login.microsoftonline.com/<tenant-id>/adminconsent?client_id=<client-id>
```

⚠ Un rôle fraîchement attribué n'entre pas en vigueur dans la session en
cours : **se déconnecter du portail et se reconnecter**, sinon le bouton reste
grisé sans raison apparente.

**⚠ Pourquoi certaines apps « marchent sans rien faire »** : parce que le
consentement y a déjà été donné, souvent à la première connexion par un compte
administrateur ayant coché « **consentir au nom de votre organisation** ». Ça ne
se voit pas dans « Autorisations configurées » mais dans le bloc **« Autres
autorisations accordées pour <organisation> »**, plus bas sur la même page. La
procédure ne diffère pas d'une app à l'autre : c'est le RÔLE du compte qui se
connecte qui fait la différence.

---

### P12 — Les claims optionnels sans les étendues ne servent à rien

**Symptôme** : `given_name` / `family_name` / `email` ajoutés en Token
configuration, mais un triangle d'avertissement devant chacun et un bandeau
« Ces revendications requièrent que les étendues OpenID Connect soient
configurées via la page des autorisations de l'API ».

**Cause** : déclarer un claim ne demande pas l'étendue correspondante.

**Parade** : **API autorisées → Microsoft Graph → Autorisations déléguées** →
ajouter `openid`, `profile`, `email`. Conserver `User.Read` (Auth.js la demande
dans son scope par défaut). Puis accorder le consentement (P11).

---

## 6. Anti-phishing sur nouveau domaine (récap actionnable)

À faire en parallèle de Phase A, **avant la mise en production publique** :

- [ ] Security headers Traefik (HSTS preload + X-Frame DENY + CSP strict + Permissions-Policy) — un seul fichier middleware réutilisable, cf. `.claude/traefik_security_headers.py`
- [ ] `<meta robots="noindex,nofollow">` dans `<head>`
- [ ] `app.disable('x-powered-by')` côté Express
- [ ] Mention « outil interne — GRETA CFA Lyon Métropole » sur la page login
- [ ] Vérification de propriété Search Console (TXT record DNS via API Hostinger)
- [ ] Si flag malgré tout : review Safe Browsing (déflag 24-72h)
- [ ] Soumettre à HSTS preload list après 1 semaine de prod stable : <https://hstspreload.org>

---

## 7. Variables d'environnement type

```ini
# .env (sur le VPS)
PORT=8080
NODE_ENV=production
JWT_SECRET=<32+ random bytes>
SECURE_COOKIE=true

# SSO
ENTRA_TENANT_ID=bc139aaa-fea0-465b-8d3d-be26ed74675d
ENTRA_CLIENT_ID=<copié depuis Entra App Registration>
ENTRA_CLIENT_SECRET=<copié au moment du New client secret, ne sera plus jamais affiché>
APP_BASE_URL=https://<domaine>

# Démo / seed (optionnel selon projet)
DISABLE_SEED=true
```

---

## 8. Checklist de validation finale

Avant d'annoncer "SSO en prod" :

- [ ] HTTPS valide (`curl -I https://<domaine>` → 200, cert > 30 j)
- [ ] `/api/config` retourne `{"sso_enabled":true}`
- [ ] `/auth/login` redirige vers `login.microsoftonline.com` avec `state` et `code_challenge`
- [ ] Test admin → arrive avec rôle `admin` (claim `roles: ["Admin"]` mappé)
- [ ] Test lecteur (user lambda du tenant) → arrive avec rôle `lecteur`
- [ ] Test refus compte externe (gmail) → erreur Entra
- [ ] Test login classique (fallback) toujours fonctionnel
- [ ] Test déconnexion → cookie effacé
- [ ] `activity_log` enregistre `Connexion SSO`
- [ ] Cookie `SameSite=Lax`, `Secure`, `HttpOnly`
- [ ] Pas de flag Safe Browsing sur Chrome / Edge / Firefox (test navigation privée)
- [ ] Display names propres (pas d'email brut) sur les comptes JIT

---

## 9. Rotation & maintenance

| Échéance | Action |
|---|---|
| **Tous les 18 mois** | Rotation du Client Secret Entra (3 mois avant expiration des 24 mois) |
| **Tous les 90 j** | Renouvellement auto Let's Encrypt (rien à faire, Traefik le gère) |
| **Au départ d'un user GRETA** | Rien à faire côté app — son compte Entra est désactivé par IT GRETA, donc plus jamais de claim valide. Le user en DB locale reste mais ne pourra plus se connecter (idempotent). |
| **Onboarding d'un nouvel admin** | Aller dans Enterprise applications → l'app → Users and groups → **+ Add user** → role Admin. Au prochain login il sera promu automatiquement (UPDATE via JIT). |
| **Changement de domaine** | Mettre à jour redirect URI dans App Registration + `APP_BASE_URL` dans `.env`. Pas de migration DB nécessaire. |

---

## 10. Code de référence (à recopier)

Le code de Suivi Pédagogique est la référence vivante :

- **Backend OIDC** : `server.js` du repo `Worzee/glm-suivipedagogique`, sections `initSSO`, `/auth/login`, `/auth/callback`
- **Frontend bouton SSO** : `index.html` de ce repo, dans `renderLogin()` (lecture de `/api/config`)
- **Traefik route + security headers** : `/docker/n8n/dynamic/pronote.yml` côté VPS Hostinger, et script de génération `.claude/traefik_security_headers.py`
- **Migrations DB** : `server.js` au démarrage, blocs `try/catch` autour des `ALTER TABLE` / `CREATE INDEX`

---

## 11. Pour aller plus loin (Phase 5 typique)

À planifier seulement quand l'app est stable :

- **Conditional Access** : politique « MFA obligatoire pour cette app » côté Entra (zéro code)
- **Branding Entra** : logo GRETA sur la mire Microsoft (Company branding)
- **Tuile SharePoint** : raccourci dans le portail M365
- **Logout fédéré** : déconnexion globale M365 via `/oauth2/v2.0/logout`
- **Synchronisation Graph** : désactivation auto des comptes locaux si user Entra supprimé (utile au-delà de 100 users)
- **3ᵉ App Role `User`** : si un rôle "édition sans création/suppression" doit être assignable directement depuis Entra (sinon promotion manuelle en local suffit)
- **Break-glass account** : compte technique dédié, indépendant de Gmail perso

---

## 12. Historique de ce playbook

| Date | Auteur | Modification |
|---|---|---|
| 2026-05-19 | Claude (sur demande Guillaume) | Création initiale, extraite des leçons du projet Suivi Pédagogique (cf. `sso-entra-id-cadrage.md` pour le journal détaillé) |

---

**Référence d'ensemble du projet Suivi Pédagogique** :
- [`CLAUDE.md`](CLAUDE.md) — architecture
- [`PRODUCT.md`](PRODUCT.md) — cadrage produit
- [`PROJECT-STATUS.md`](PROJECT-STATUS.md) — état + backlog
- [`sso-entra-id-cadrage.md`](sso-entra-id-cadrage.md) — journal complet (décisions, phases, tests)
