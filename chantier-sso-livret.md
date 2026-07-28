# Chantier SSO — Livret d'apprentissage (Entra ID)

> Note de conception, arrêtée avec le pilote le **2026-07-27**.
> Complète `playbook-sso-entra-greta.md` (générique) — **ce document prime**
> en cas de divergence : le playbook a été écrit pour une app à accès large,
> le livret est à accès restreint.

## 1. Le problème à résoudre

Le livret héberge **deux populations qui n'ont rien à voir** :

- les **personnels GRETA** de la coordination, des CFP et de la direction, qui
  ont un compte dans l'annuaire Entra de l'établissement ;
- les **apprenti·e·s, maîtres d'apprentissage, formateurs référents et
  responsables légaux**, qui n'en ont pas — et dont une partie seulement est
  GRETA (certains formateurs référents le sont, beaucoup de tuteurs non).

D'où la règle du pilote : **SSO pour la coordination et l'administration, mot
de passe pour tous les autres, y compris les formateurs référents GRETA.**
L'uniformité prime sur la commodité : un formateur référent ne doit pas avoir
un parcours différent selon qu'il est ou non salarié du GRETA.

## 2. Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D1** | SSO **réservé aux rôles `coordo` et `admin`**. Tous les autres rôles passent par mot de passe, même si la personne est GRETA. | Un seul parcours par métier, pas par statut d'emploi |
| **D2** | **2 App Roles** : `Coordo` et `Admin`. Coordos → `Coordo` ; CFP, direction et pilote → `Admin` | `admin` est le seul rôle à visibilité globale (cf. §3) |
| **D3** | **« Assignment required » = OUI** dans Entra (⚠ le playbook §B.5 dit NON) | La liste d'habilitation du pilote EST la barrière d'accès |
| **D4** | Le rôle applicatif Entra décide du rôle livret **à la création UNIQUEMENT**. Jamais d'écrasement d'un rôle existant | Le rôle métier appartient au livret, pas à l'annuaire |
| **D5** | Rattachement par email **borné aux comptes `coordo`/`admin`**. Tout autre rôle → **connexion refusée**, sans rattachement ni modification | C'est LA protection des formateurs référents GRETA |
| **D6** | Un compte lié au SSO **perd son mot de passe** (`passwordHash` effacé) | Sinon une porte mot de passe reste ouverte sur les comptes les plus privilégiés |
| **D7** | **Compte de secours** : `guillaume.ferreri@gmail.com` reste en mot de passe et n'est jamais lié au SSO | Adresse Gmail, aucune collision possible avec l'identité Azure en `@ac-lyon.fr`. Sans lui, une panne Entra = plus aucun administrateur |
| **D8** | **Pas d'écran d'attente** : une connexion Entra sans App Role attendu est refusée | Le SSO est une porte étroite ; chaque connexion inconnue qui crée une ligne, c'est du ménage pour le pilote |

### Pourquoi `admin` et pas `coordo` pour les CFP et la direction

Un coordo ne voit **que les apprenti·e·s dont il est le coordo désigné**
(`apprentis-accessibles.ts`, filtre `a.coordoId === utilisateur.id`), et
`coordoId` est un champ **unique** : on ne peut pas partager un·e apprenti·e
entre deux coordos. Un CFP ou un membre de la direction en rôle `coordo`
arriverait donc sur un tableau de bord **vide**, et rien ne permettrait de le
remplir sans déposséder le vrai coordo.

Le saut vers `admin` est par ailleurs plus petit qu'il n'y paraît : le coordo
peut **déjà** supprimer des utilisateurs, créer/modifier/supprimer des
formations, gérer les référentiels et les documents. `admin` n'ajoute que la
visibilité globale et 5 capacités (`droits.ts`) : créer un coordo, gérer les
établissements Pronote, les paramètres, le catalogue d'attitudes et celui des
questions annuelles.

⚠ **Le point d'attention est là** : ces catalogues sont **partagés**. Une
attitude retirée ou un seuil modifié change l'outil pour tout le monde, y
compris pour un formateur en pleine saisie. À dire aux personnes, pas à
verrouiller techniquement dans une équipe de cette taille.

## 3. La règle de connexion (le cœur)

À chaque connexion Entra, une fois le jeton validé :

```
1. Aucun App Role `Coordo` ni `Admin`        → REFUS « compte non habilité »
2. Un compte porte déjà cet `entraOid`       → on l'utilise (rôle inchangé)
3. Un compte a cette adresse email :
   3a. son rôle est `coordo` ou `admin`      → LIAISON (pose `entraOid`,
                                                efface `passwordHash`)
   3b. tout autre rôle                       → REFUS « ce compte se connecte
                                                par mot de passe »
4. Aucun compte                              → CRÉATION, rôle issu de l'App
                                                Role (`Coordo`→coordo,
                                                `Admin`→admin)
```

Le rôle du livret n'est **jamais** modifié par une connexion (cas 2 et 3a).

**Cas 4 et le périmètre** : un coordo créé à la volée n'a aucun·e apprenti·e
rattaché·e — c'est vrai de tout nouveau coordo, SSO ou non. Il verra le
message existant « Aucun·e apprenti·e n'est rattaché·e à votre compte », et le
pilote lui affecte son périmètre depuis Affectations. Pour un `admin`, la
question ne se pose pas : il voit tout dès la première connexion.

## 4. Configuration Entra — écarts avec le playbook

| Point | Playbook générique | **Livret** |
|---|---|---|
| Redirect URI | `https://<domaine>/auth/callback` | **`https://livret.gretacfalyon.com/api/auth/callback/microsoft-entra-id`** — imposé par Auth.js v5, pas libre |
| App Roles | `Admin` / `Reader` | **`Coordo` / `Admin`** |
| Assignment required | **Non** (tout le tenant entre) | **OUI** — c'est la décision D3 |
| Variables `.env` | `ENTRA_CLIENT_ID`… | **`AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER`** (convention Auth.js, cf. `.env.example`) |

Inchangé et à ne pas oublier : les **claims optionnels** `given_name`,
`family_name`, `email` en Token configuration (piège P3 du playbook — sans eux
les comptes créés à la volée ont un nom vide).

⚠ **Les claims optionnels ne suffisent PAS** (vécu 2026-07-28) : Azure affiche
un bandeau « Ces revendications requièrent que les étendues OpenID Connect
soient configurées via la page des autorisations de l'API », et un triangle
d'avertissement devant chaque claim. Il faut ajouter dans **API autorisées →
Microsoft Graph → Autorisations déléguées** les étendues `openid`, `profile`,
`email`. Garder aussi **`User.Read`** : le provider Auth.js la demande
explicitement (`scope: "openid profile email User.Read"`, cf.
`@auth/core/providers/microsoft-entra-id`).

### Valeurs du tenant GRETA Lyon (relevées le 2026-07-28)

| | |
|---|---|
| ID de l'annuaire (locataire) | `bc139aaa-fea0-465b-8d3d-be26ed74675d` |
| `_ISSUER` attendu | `https://login.microsoftonline.com/bc139aaa-fea0-465b-8d3d-be26ed74675d/v2.0` |

⚠ **Le portail français dit « ID de l'annuaire (locataire) »** là où la
documentation anglaise dit *Directory (tenant) ID*. Sur la page Vue d'ensemble,
**trois GUID sont empilés** — ID d'application (client), ID de l'objet, ID de
l'annuaire — et c'est le troisième qu'il faut. Voir les pièges §9.

## 5. Modifications de code prévues

1. **`src/lib/sso.ts` (nouveau, TDD)** — la règle du §3 en fonction PURE :
   entrées (rôles Entra, compte trouvé par oid, compte trouvé par email) →
   sortie (`utiliser` | `lier` | `creer` | `refuser` + motif). Toute la
   logique sensible est testée sans base ni réseau, conformément à la doctrine
   du projet.
2. **`src/auth.ts`** — le callback `jwt` applique la décision au lieu de
   décider lui-même. Disparaissent : le fallback email non borné
   (`auth.ts:70-72`) et l'écrasement du rôle (`auth.ts:76`).
3. **DEUX pages de connexion distinctes** (arbitrage pilote — le plus simple
   pour l'utilisateur, décidé après coup contre la version « deux boutons sur
   la même page ») :
   - **`/login`** : email + mot de passe UNIQUEMENT. Reste la page par défaut,
     ce qui préserve les parcours d'activation et de mot de passe oublié, qui
     y renvoient avec leurs messages de confirmation et ne concernent que des
     comptes à mot de passe.
   - **`/connexion-greta`** (nouveau) : le bouton Greta UNIQUEMENT. Adresse
     lisible et communicable par écrit — personne parmi les CFP ne sait ce
     qu'est un « SSO ».

   Deux publics disjoints, deux pages : plus de choix à faire, donc plus
   d'erreur possible. ⚠ **Mais chaque page porte un lien DISCRET vers
   l'autre** — pas un second bouton qui rivalise, une ligne en bas :
   - sur `/login` : **« Accès Greta »** ;
   - sur `/connexion-greta` : « Vous n'êtes pas personnel GRETA ? Connectez-vous
     avec votre email et votre mot de passe. »

   **Ce lien n'est pas cosmétique**, il rattrape les deux parcours les plus
   fréquents : le proxy renvoie toute session expirée vers `/login`
   (`proxy.ts`), et c'est aussi là qu'atterrit qui tape simplement l'adresse du
   site ou ouvre son favori. Sans lui, un coordo dont la session expire est
   bloqué. Le lien retour compte autant : quelqu'un finira par envoyer la
   mauvaise adresse à un·e apprenti·e.

   ⚠ `/connexion-greta` doit être ajoutée aux **préfixes publics du proxy**,
   sinon elle redirige vers `/login` — la page de connexion se renverrait
   elle-même.

   ⚠ Quand Entra n'est pas configuré, `/connexion-greta` doit **le dire**
   plutôt que d'afficher un bouton mort (comportement actuel de `/login`) :
   sinon un testeur conclut à une panne pendant la mise en place.
4. **Écran de refus lisible** pour les motifs du §3 (1 et 3b), rendu sur
   `/connexion-greta`.

⚠ **Anti-énumération préservée** : le message d'échec d'une connexion PAR MOT
DE PASSE ne dira jamais « ce compte est en SSO » — ce serait révéler
l'existence du compte. L'information vit sur la page, en permanence (point 3),
pas dans le message d'erreur.

## 6. Ce qui ne pourra pas être testé en local

Les E2E ne peuvent pas jouer un vrai parcours Entra (pas de tenant en CI). Sont
donc couverts par Vitest sur la lib pure : les 5 branches du §3. La validation
du parcours réel se fait **en production**, avec les 3 comptes de test du
pilote (un `Coordo`, un `Admin`, et un compte du tenant **sans** App Role, qui
doit être refusé).

## 7. Prérequis — checklist Entra

Dans l'ordre. Les cases cochées l'ont été le **2026-07-28**.

- [x] App Registration créée — « Mon organisation uniquement »
- [x] Redirect URI **exacte** du §4 enregistrée
- [x] Secret client créé (⚠ affiché **une seule fois** — piège P6 du
      playbook ; rappel de rotation à 18 mois à poser)
- [x] App Roles `Coordo` et `Admin` créés — ⚠ la colonne **Valeur** est
      comparée caractère par caractère par le code, majuscule comprise
- [x] Claims optionnels `given_name` / `family_name` / `email` (type **ID**)
- [x] Étendues déléguées `openid` / `profile` / `email` + `User.Read` ajoutées
      dans **API autorisées** (sans elles les claims ne sont pas émis)
- [x] **Assignment required = Oui** (Applications d'entreprise → Propriétés)
- [x] Personnes habilitées dans **Utilisateurs et groupes** (créer un rôle ne
      l'attribue à personne)
- [ ] ⚠ **Consentement administrateur accordé** — BLOQUANT, voir piège §9.5
- [ ] Les 3 variables posées dans le `.env` de prod + **Restart**
- [ ] Validation avec 3 comptes, dont **un sans App Role qui doit être REFUSÉ**

## 8bis. Conséquence à traiter : les adresses `.onmicrosoft.com`

Le tenant est un tenant dédié administré par le pilote, dont le domaine par
défaut est `gretalyon.onmicrosoft.com`. Les comptes coordo créés par le SSO
porteront donc une adresse de ce type, **enregistrée telle quelle dans le
livret** puisqu'elle vient du jeton.

⚠ **Ces adresses ne reçoivent pas de courrier** sans boîte Exchange derrière.
Conséquence concrète : la notification que le cron envoie aux coordos (compte
apprenti jamais activé après 30 jours, spec §7.3) partirait dans le vide.

Non bloquant pour la mise en route. À trancher avant les vraies données : soit
corriger l'adresse dans le livret après la première connexion, soit dissocier
l'adresse de CONTACT de l'identifiant de connexion (champ supplémentaire).

## 9. Pièges rencontrés (mise en place du 2026-07-28)

Chacun a coûté du temps. Ils sont dans l'ordre où ils se sont présentés.

**9.1 — Le gabarit d'issuer collé tel quel.** La ligne du `.env` contenait
encore `<Directory (tenant) ID>`. Symptôme : écran **`/api/auth/error?error=Configuration`**.

**9.2 — Lire le bon GUID.** Le remplaçant fourni était l'**ID d'application
(client)** et non l'**ID de l'annuaire (locataire)** — les trois GUID de la page
Vue d'ensemble se ressemblent. Symptôme : Microsoft répond
`AADSTS90002: Tenant '…' not found`.

**9.3 — Diagnostic : où est la faute ?** Une erreur `error=Configuration` sur
une URL de **notre** domaine, sans être passé par Microsoft, signifie que le
provider n'a pas pu s'initialiser : le problème est dans le `.env`, pas dans
Azure. Réciproquement, un message `AADSTS…` vient d'Azure.

**9.4 — Vérifier AVANT de redémarrer.** Ce test ne demande aucun Restart et
tranche immédiatement (attendu : **HTTP 200**) :

```bash
ISS=$(sed -n 's/^AUTH_MICROSOFT_ENTRA_ID_ISSUER="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' ~/apps/livret/.env); echo "issuer lu : [$ISS]"; curl -s -o /dev/null -w 'discovery -> HTTP %{http_code}\n' "${ISS%/}/.well-known/openid-configuration"
```

Contrôle de cohérence des 3 variables (valeurs masquées) — l'ID doit faire
**36** caractères (un GUID) et le secret **~40** ; ⚠ un secret de 36 caractères
en forme de GUID = c'est le *Secret ID* qui a été copié, pas la *Value* :

```bash
cd ~/apps/livret; grep -E '^AUTH_MICROSOFT_ENTRA_ID_' .env | while IFS='=' read -r cle val; do net=$(printf '%s' "$val" | sed 's/^"//; s/"$//'); printf '%-40s %s caracteres\n' "$cle" "${#net}"; done
```

**9.5 — Le consentement administrateur (le vrai obstacle).** Le tenant
**interdit le consentement par l'utilisateur**. Résultat : écran « Approbation
administrateur requise », et une **boucle** si l'on re-sélectionne un compte
non administrateur. Le bouton « Accorder un consentement d'administrateur » du
portail est alors **grisé**.

Il faut un compte **Administrateur général**, **Administrateur d'application
cloud** ou **Administrateur d'application**. Deux voies équivalentes : le
bouton du portail, ou l'URL de consentement, qui ne contient aucun secret :

```
https://login.microsoftonline.com/<tenant-id>/adminconsent?client_id=<client-id>
```

⚠ Un rôle fraîchement attribué **n'entre pas en vigueur dans la session en
cours** : se déconnecter du portail et se reconnecter, sinon le bouton reste
grisé sans explication.

**9.6 — « Ça marchait sans tout ça sur les autres projets ».** Constat du
pilote, comparaison faite avec l'app « Suivi Pronote » du même tenant. La page
API autorisées y montre deux blocs : « Autorisations configurées » (`User.Read`
seul, statut vide) et **« Autres autorisations accordées pour GRETA Lyon
Métropole »** avec `email`/`openid`/`profile` **« Accordé pour … »**. Le
consentement Y AVAIT donc bien été donné — vraisemblablement à la première
connexion par un compte administrateur ayant coché « **consentir au nom de
votre organisation** », ce qui produit le même effet sans passer par le
portail. Ce n'est donc pas la procédure qui diffère, c'est **le rôle du compte**
qui se connecte.

⚠ **Ne PAS copier la configuration de Suivi Pronote** : elle a
« Affectation requise ? » = **Non**, c'est-à-dire ouverte à tout le tenant.
Le livret garde **Oui** (décision D3) — il hébergera des données personnelles
d'apprenti·e·s mineur·e·s. Consentement et affectation sont deux mécanismes
distincts : être affecté ne dispense pas du consentement, et inversement.

## 8. Contexte au moment de la décision

Toutes les données en ligne sont des **fixtures** ; le seul compte réel est
`guillaume.ferreri@gmail.com`. Il n'y a donc **aucune migration à prévoir** :
Martine et Bernard sont des personnages de démonstration. C'est la fenêtre
idéale — on peut provoquer des collisions, tout casser et reseeder, ce qui sera
impossible une fois les vraies données en place.

⚠ **Chantier voisin, à ne pas oublier** : la mise en service exigera une
**purge complète** de la base ET du Nuage (formations, référentiels, documents,
apprenti·e·s, tuteurs, formateurs, coordos, journal d'audit), en préservant le
compte admin et les catalogues de configuration. Aucun outil n'existe
aujourd'hui pour ça. À écrire et à TESTER pendant que les données sont fausses.
L'ordre compte : **purger d'abord, créer les vrais comptes ensuite.**
