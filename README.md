# Livret d'apprentissage — GRETA Lyon Métropole

Maquette numérique du livret d'apprentissage, **étape 1 / 3** (CDC v1.3 + addendum v1.5 + chantiers métier mai 2026).

> **À quoi ça sert ?** Démontrer à la direction du GRETA Lyon Métropole, sur une URL réelle protégée
> par mot de passe, à quoi ressemblerait un livret d'apprentissage numérique : co-édition tripartite
> (apprenti·e + maître + formateur), **entretien tripartite unique et obligatoire** (trame officielle GRETA + attitudes professionnelles —
> le suivi ultérieur passe par les fiches de suivi), fiches de
> période **en entreprise et en centre de formation** (planning défini au niveau formation), évaluations finales, export PDF officiel,
> administration métier (CRUD utilisateurs, formations, référentiels, **entreprises**, établissements, **import XLSX**).
> Aucune donnée réelle, aucun tracker, aucune analytics.

|                   |                                                                          |
| ----------------- | ------------------------------------------------------------------------ |
| **URL publique**  | https://livret-glm.duckdns.org                                           |
| **Accès**         | Basic Auth `demo` / mdp partagé hors-canal                               |
| **Pilote métier** | Guillaume FERRERI                                                        |
| **État**          | Étape 1 livrée + 4 vagues post-livraison (CDC v1.5 + chantiers mai 2026) |
| **Tests**         | **745 unit ✓ · 216 E2E ✓**                                               |

---

## 1. Démarrage rapide (5 minutes)

### Pré-requis

- **Node.js ≥ 20** (testé avec v24)
- **npm ≥ 10**
- **bash** (Git Bash sur Windows)
- **ssh + scp** pour le déploiement

### Installation et lancement local

```bash
git clone <url-du-repo>
cd "LIVRET APPRENTISSAGE"
npm install        # ~30 s
npm run dev        # Vite serve sur http://localhost:5173
```

L'app s'ouvre directement sur le tableau de bord du **formateur référent** (Sophie DUBOIS).
Tu peux changer de rôle via le **role switcher** en haut à droite (5 rôles : apprenti·e, maître,
formateur, coordo, admin).

---

## 2. Commandes utiles

```bash
# Développement
npm run dev               # serveur Vite (HMR)
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
npm run format            # Prettier (écriture)

# Tests
npm test                  # 745 tests Vitest unit
npm run e2e               # 216 tests E2E Playwright (build + preview + tests)
npm run e2e:ui            # UI Playwright pour debug
npm run test:watch        # mode watch (unit)

# Production
npm run build             # produit dist/ (+ source maps)
npm run preview           # serveur statique sur dist/

# Déploiement
bash scripts/deploy.sh                # build + transfert VPS (rsync ou tar+scp)
bash scripts/deploy.sh --no-build     # déploiement rapide d'un dist/ déjà construit
bash scripts/verifier-vps.sh          # 11 contrôles préflight (DNS, TLS, headers…)
```

---

## 3. Structure du projet (vue d'ensemble)

```
LIVRET APPRENTISSAGE/
├── README.md                                              ← ce fichier
├── PROJECT-STATUS.md                                      ← état d'avancement détaillé
├── DEMO.md                                                ← script de démo minuté 10 min
├── CONVENTIONS.md                                         ← règles de code (résumé CDC §16)
├── TODO-etape-2.md                                        ← pistes reportées étape 2/3
├── cahier-des-charges-livret-apprentissage-v1.3.md        ← référence historique scellée
├── cahier-des-charges-livret-apprentissage-v1.5-addendum.md ← évolutions post-livraison
├── design-system/MASTER.md                                ← design system (CDC §14)
├── scripts/                                               ← déploiement VPS
├── e2e/                                                   ← 30 specs Playwright
└── src/
    ├── types/index.ts              ← modèle (CDC §7 + extensions v1.5)
    ├── lib/                        ← logique métier pure + 52 fichiers tests TDD
    │   ├── droits.ts               ← matrice (57 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    ← R15/R16/R17/R21
    │   ├── validation-signature.ts ← R18/R20
    │   ├── regles-periode.ts       ← R11/R12/R13/R14
    │   ├── regles-entretien.ts     ← R6 (entretien unique)/R7/R8/R9
    │   ├── selection-competences-entreprise.ts ← CDC v1.5 §12 (sélection par livret)
    │   ├── cloture-livret.ts       ← R22
    │   ├── deverrouillage-fiche.ts ← R10 motivé
    │   ├── trame-entretien.ts      ← trame officielle de l'entretien tripartite
    │   ├── organisation-suivi.ts   ← refonte modulaire (liste d'événements)
    │   ├── import-referentiel.ts + parser-xlsx.ts ← CSV+XLSX
    │   ├── limite-referentiel.ts   ← limite des lignes évaluables (juillet 2026)
    │   ├── import-utilisateurs.ts + generer-xlsx-modele.ts ← chantier #5 (import XLSX users)
    │   ├── validation-periode-formation.ts ← chantier #1 (planning au niveau formation)
    │   ├── couleurs-role.ts        ← palette équilibrée mai 2026
    │   └── *.test.ts               ← 745 tests Vitest
    ├── store/                      ← 12 stores Zustand persistés
    ├── fixtures/                   ← 8 livrets démo + utilisateurs + référentiels
    ├── components/
    │   ├── layout/                 ← AppShell, Sidebar, RoleSwitcher, MobileMenu…
    │   ├── common/                 ← BoutonSigner, BoutonSupprimer, SelecteurNiveau…
    │   ├── admin/                  ← modales CRUD (utilisateurs, formations, référentiels…)
    │   ├── livret/                 ← TableauTriColonnes, BlocSignatures, DialogDeverrouillage…
    │   ├── entretien/              ← sections + SectionSelectionCompetences (CDC v1.5)
    │   ├── evaluation/             ← grilles finales + BandeauCloture
    │   └── pdf/                    ← export lazy @react-pdf/renderer
    └── pages/                      ← routes + sous-pages admin (5 rôles)
```

---

## 4. Cycle de travail standard

1. Modifier le code dans `src/`.
2. **Écrire les tests d'abord** quand on touche à `lib/` (TDD est la convention du projet).
3. `npm run typecheck && npm run lint && npm test` doit rester vert.
4. `bash scripts/deploy.sh` pour pousser sur le VPS.
5. `bash scripts/verifier-vps.sh` doit retourner 11/11 OK.
6. Tester sur https://livret-glm.duckdns.org en navigation privée (cache).

---

## 5. Documentation associée

| Document                                                       | Quand le consulter                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`DEMO.md`**                                                  | Avant chaque présentation. Script minuté + plan B.                                                                                                                                               |
| **`PROJECT-STATUS.md`**                                        | Faire le point — **résumé exécutif (§0)**, vagues livrées, ce qui reste, métriques bundle/tests, trajectoire étape 2.                                                                            |
| **`CONVENTIONS.md`**                                           | Règles de code et conventions du projet (CDC §16).                                                                                                                                               |
| **`TODO-etape-2.md`**                                          | Pistes reportées étape 2/3 (auth réelle, notifications, signature tactile…).                                                                                                                     |
| **`conformite-rgpd.md`**                                       | Liste recentrée des **33 obligations RGPD strictes** + 9 recommandations reportables (gouvernance, droits, sécurité, sous-traitants). Apprenti·e·s majeur·e·s uniquement — AIPD non obligatoire. |
| **`chantier-creation-comptes.md`**                             | Spécification du chantier 2.2 (création de comptes apprenti·e·s + maîtres avec activation par email) + 2.3 (gestion mots de passe). Issu de la session de cadrage 2026-05-26.                    |
| **`cahier-des-charges-livret-apprentissage-v1.3.md`**          | Référence historique scellée (CDC initial).                                                                                                                                                      |
| **`cahier-des-charges-livret-apprentissage-v1.5-addendum.md`** | Évolutions post-livraison v1.3 → v1.5 (3 vagues).                                                                                                                                                |
| **`scripts/README.md`**                                        | Procédure complète VPS (setup initial, déploiement, sécurité).                                                                                                                                   |
| **`design-system/MASTER.md`**                                  | Tokens, couleurs par rôle, patterns UI.                                                                                                                                                          |

---

## 6. Sécurité — actions à prendre par le pilote

> **Urgent** : le mot de passe SSH root du VPS a été partagé en clair dans une conversation
> et doit être changé.

- [ ] `passwd` sur le VPS pour changer le mot de passe root.
- [ ] Générer une clé SSH dédiée au déploiement : `ssh-keygen -t ed25519`.
- [ ] Pousser la clé publique : `ssh-copy-id root@69.62.107.157`.
- [ ] Désactiver l'auth par mot de passe dans `/etc/ssh/sshd_config` :
  - `PasswordAuthentication no`
  - `PermitRootLogin prohibit-password`
  - `systemctl restart sshd`
- [ ] Vérifier que le mot de passe Basic Auth est partagé via canal sécurisé (gestionnaire de
      mots de passe, Signal — jamais en clair par mail).
- [ ] Avant chaque démo importante : `bash scripts/verifier-vps.sh` doit retourner 11/11 OK.

Procédure complète dans [`scripts/README.md`](./scripts/README.md) § _Sécurité_.

---

## 7. Limites connues (étape 1 — CDC §3)

- Pas d'authentification réelle (role switcher uniquement) — passage prévu en étape 2 via SSO Entra ID (cf. `playbook-sso-entra-greta.md`).
- Pas de RGPD / RGAA strict — bonnes pratiques seulement.
- Pas de notifications email — étape 2 (couplée à l'auth réelle).
- Pas de validation par email des nouveaux comptes — étape 2.
- Pas de gestion de mot de passe (réinit, expiration, 2FA) — étape 2.
- Pas de multi-établissement — un seul GRETA fictif.
- Pas de backup automatique — données dans le `localStorage` de chaque navigateur.
- Pas de monitoring centralisé (Uptime Kuma, logs).
- Pas d'historique granulaire (CDC §12) — traçabilité minimale `modifieLe` + historique R10
  spécifique (déverrouillages fiches + invalidations sélection compétences).

---

## 8. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` (localStorage, **12 stores** persistés)
- **Routing** : React Router v6
- **PDF** : `@react-pdf/renderer` (lazy-loaded — chargé uniquement au clic « Exporter »)
- **XLSX** : `fflate` (~12 KB) pour la décompression ZIP + parser maison
- **Tests** : Vitest 2 (unitaires) + Playwright 1.59 (E2E desktop + mobile Pixel 5)
- **Lint/Format** : ESLint 9 (flat config) + Prettier 3
- **Aucune dépendance d'analytics ou tracking** (CDC §20)

Bundle production gzippé :

- JS initial : **~148 KB** (cible CDC §19.1 : < 500 KB) ✓
- CSS : **~6,5 KB** (cible : < 50 KB) ✓
- Chunk PDF lazy : ~493 KB (chargé uniquement au clic « Exporter »)

---

## 9. En cas de pépin

| Symptôme                                       | Diagnostic / action                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm install` échoue avec `EACCES`             | Vérifier les droits du dossier ; éviter `sudo npm`.                                                                  |
| `npm run dev` ne démarre pas                   | Port 5173 occupé → fermer l'autre processus ou changer dans `vite.config.ts`.                                        |
| Tests vert en local mais rouge en CI           | Différence Node — vérifier la version (≥ 20).                                                                        |
| Le VPS ne répond plus                          | `bash scripts/verifier-vps.sh` puis `ssh root@69.62.107.157 "cd /docker && docker compose ps"`.                      |
| Le PDF ne se génère pas dans le navigateur     | Console DevTools → chercher `[@react-pdf]`. Probable problème de police absente (Helvetica est intégrée, donc rare). |
| `localStorage` saturé (modale d'avertissement) | Footer → Réinitialiser, ou DevTools → `localStorage.clear()`.                                                        |

Pour tout autre incident, consulter `PROJECT-STATUS.md §9` (limites connues) et `TODO-etape-2.md`.

---

_Étape 1 livrée + 4 vagues post-livraison (CDC v1.5 + chantiers métier mai 2026). Prochaine étape : SSO Entra + gestion comptes/mots de passe — cf. `PROJECT-STATUS.md §12`._
