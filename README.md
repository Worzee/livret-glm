# Livret d'apprentissage — GRETA Lyon Métropole

Maquette numérique du livret d'apprentissage, **étape 1 / 3** (cahier des charges v1.3).

> **À quoi ça sert ?** Démontrer à la direction du GRETA Lyon Métropole, sur une URL réelle protégée
> par mot de passe, à quoi ressemblerait un livret d'apprentissage numérique : co-édition tripartite
> (apprenti·e + maître + formateur), entretien tripartite, fiches de période, évaluations finales,
> export PDF officiel. Aucune donnée réelle, aucun tracker, aucune analytics.

| | |
|---|---|
| **URL publique** | https://livret-glm.duckdns.org |
| **Accès** | Basic Auth `demo` / mdp partagé hors-canal |
| **Pilote métier** | Guillaume FERRERI |
| **État** | Sprint 5 livré — étape 1 prête pour démo direction |
| **Tests** | 162 / 162 ✓ |

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
npm test                  # 162 tests Vitest (run unique)
npm run test:watch        # mode watch

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
├── README.md                       ← ce fichier
├── PROJECT-STATUS.md               ← état d'avancement détaillé du projet
├── DEMO.md                         ← script de démo minuté 10 min + plan B
├── CONVENTIONS.md                  ← règles de code (résumé CDC §16)
├── TODO-etape-2.md                 ← captures de scope creep pour étape 2
├── cahier-des-charges-livret-apprentissage-v1.3.md   ← source de vérité fonctionnelle
├── design-system/MASTER.md         ← design system complet (CDC §14)
├── scripts/                        ← scripts de déploiement VPS
│   ├── README.md                   ← procédure complète
│   ├── deploy.sh, setup-vps.sh, verifier-vps.sh
│   ├── docker-compose.livret.yml, nginx-livret.conf
│   └── .env.deploy.example         ← gabarit (le .env.deploy réel est gitignoré)
└── src/
    ├── main.tsx, App.tsx
    ├── styles/index.css            ← tokens shadcn + thème institutionnel
    ├── types/index.ts              ← modèle de données (CDC §7)
    ├── lib/                        ← logique métier pure + tests TDD
    │   ├── droits.ts               ← matrice §6 (32 ressources × 5 rôles)
    │   ├── transitions-fiche.ts    ← R15/R16/R17/R21 (machine à états + non-régression)
    │   ├── validation-signature.ts ← R18/R20 fiches de période
    │   ├── regles-periode.ts       ← R11/R12/R13/R14
    │   ├── regles-entretien.ts     ← R6/R7/R8/R9
    │   ├── synthese-evaluation.ts  ← last-write-wins fiches → évaluations finales
    │   ├── stats-bloc.ts           ← agrégation stats par bloc
    │   ├── cloture-livret.ts       ← R22 (clôture)
    │   ├── deverrouillage-fiche.ts ← R10 (motif obligatoire)
    │   ├── import-referentiel.ts   ← parsing CSV (encodage, 2/3 colonnes)
    │   └── *.test.ts               ← 162 tests Vitest
    ├── store/                      ← Zustand persist (localStorage v3)
    ├── fixtures/                   ← données de démo (Léa MARTIN + 4 autres rôles)
    ├── components/
    │   ├── layout/                 ← AppShell, Sidebar, RoleSwitcher, BoutonReinit…
    │   ├── common/                 ← BoutonSigner, ChampEditable, BadgeEtatFiche…
    │   ├── livret/                 ← TableauTriColonnes, BlocSignatures, DialogDeverrouillage…
    │   ├── entretien/              ← sections de l'entretien tripartite
    │   ├── evaluation/             ← grilles finales + BandeauCloture (R22)
    │   └── pdf/                    ← export PDF via @react-pdf/renderer (lazy-loaded)
    └── pages/                      ← routes principales + sous-pages admin
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

| Document | Quand le consulter |
|---|---|
| **`DEMO.md`** | Avant chaque présentation. Script minuté + plan B. |
| **`PROJECT-STATUS.md`** | Faire le point — sprints livrés, ce qui reste, métriques bundle/tests. |
| **`CONVENTIONS.md`** | Règles de code et conventions du projet (CDC §16). |
| **`TODO-etape-2.md`** | Backlog des fonctionnalités reportées à l'étape 2. |
| **`cahier-des-charges-livret-apprentissage-v1.3.md`** | Source de vérité fonctionnelle officielle. |
| **`scripts/README.md`** | Procédure complète VPS (setup initial, déploiement, sécurité). |
| **`design-system/MASTER.md`** | Tokens, couleurs par rôle, patterns UI. |

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

Procédure complète dans [`scripts/README.md`](./scripts/README.md) § *Sécurité*.

---

## 7. Limites connues (étape 1 — CDC §3)

- Pas d'authentification réelle (role switcher uniquement) — étape 3.
- Pas de RGPD / RGAA strict — bonnes pratiques seulement.
- Pas de notifications email — étape 2.
- Pas de multi-établissement — un seul GRETA fictif.
- Pas de backup automatique — données dans le `localStorage` de chaque navigateur.
- Pas de monitoring centralisé (Uptime Kuma, logs).
- Pas d'historique granulaire (CDC §12) — traçabilité minimale `modifieLe` + historique R10
  spécifique.
- 1 apprenti·e démo (Léa MARTIN). 6 apprenti·e·s prévus pour la démo direction (CDC §24.5)
  → cf. PROJECT-STATUS.md §9.C.

---

## 8. Stack technique

- **Frontend** : Vite 6 + React 18 + TypeScript 5.7 (strict)
- **Style** : Tailwind CSS 3 + shadcn/ui (tokens CSS variables)
- **State** : Zustand 5 + middleware `persist` (localStorage, schema v3)
- **Routing** : React Router v6
- **PDF** : `@react-pdf/renderer` (lazy-loaded — chargé uniquement au clic « Exporter »)
- **Tests** : Vitest 2 + Testing Library + jsdom
- **Lint/Format** : ESLint 9 (flat config) + Prettier 3
- **Aucune dépendance d'analytics ou tracking** (CDC §20)

Bundle production gzippé :
- JS initial : **~94 KB** (cible CDC §19.1 : < 500 KB) ✓
- CSS : **~5 KB** (cible : < 50 KB) ✓
- Chunk PDF lazy : ~495 KB (chargé à la demande seulement)

---

## 9. En cas de pépin

| Symptôme | Diagnostic / action |
|---|---|
| `npm install` échoue avec `EACCES` | Vérifier les droits du dossier ; éviter `sudo npm`. |
| `npm run dev` ne démarre pas | Port 5173 occupé → fermer l'autre processus ou changer dans `vite.config.ts`. |
| Tests vert en local mais rouge en CI | Différence Node — vérifier la version (≥ 20). |
| Le VPS ne répond plus | `bash scripts/verifier-vps.sh` puis `ssh root@69.62.107.157 "cd /docker && docker compose ps"`. |
| Le PDF ne se génère pas dans le navigateur | Console DevTools → chercher `[@react-pdf]`. Probable problème de police absente (Helvetica est intégrée, donc rare). |
| `localStorage` saturé (modale d'avertissement) | Footer → Réinitialiser, ou DevTools → `localStorage.clear()`. |

Pour tout autre incident, consulter `PROJECT-STATUS.md §10` (limites connues) et `TODO-etape-2.md`.

---

*Étape 1 livrée — Sprint 5 — cahier des charges v1.3.*
