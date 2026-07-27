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

`_ISSUER` attendu : `https://login.microsoftonline.com/<tenant-id>/v2.0`.

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

## 7. Prérequis avant de commencer

- [ ] App Registration créée, **Assignment required = Oui**
- [ ] App Roles `Coordo` et `Admin` créés
- [ ] Claims optionnels `given_name` / `family_name` / `email` ajoutés
- [ ] Redirect URI **exacte** du §4 enregistrée
- [ ] Les 3 variables transmises pour le `.env` de prod
      (⚠ le secret n'est affiché qu'une fois — piège P6 du playbook ;
      poser un rappel de rotation à 18 mois)

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
