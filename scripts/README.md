# Scripts de déploiement — Livret d'apprentissage

**Architecture : Option A** — conteneur `nginx:alpine` derrière le Traefik **déjà en place** sur le VPS Hostinger (mutualisé avec n8n, pronote-tracker, amklelec, laremisevintage).

## Pourquoi cette architecture

Le VPS héberge déjà 4 projets dont un GRETA (`glmpronote.duckdns.org`). Tout passe par un Traefik unique en Docker qui gère ports 80/443 et certificats Let's Encrypt. On s'intègre dans ce dispositif plutôt que d'installer un Nginx natif concurrent.

```
                    Internet
                        │
                        ▼
         ┌────────────────────────────┐
         │  Traefik (Docker)          │  Ports 80/443
         │  Réseau : n8n_default      │  Certs Let's Encrypt auto
         └─┬──────┬────────┬────────┬─┘
           │      │        │        │
           ▼      ▼        ▼        ▼
        n8n   pronote   amklelec  livret  ← nous
                        + remise  (nouveau)
                        vintage
```

## Fichiers du dossier `scripts/`

```
scripts/
├── .env.deploy.example          Gabarit de configuration (à copier)
├── .env.deploy                  Vos valeurs (NE PAS COMMITER, dans .gitignore)
├── docker-compose.livret.yml    Définition du conteneur livret + labels Traefik
├── nginx-livret.conf            Config Nginx du conteneur (statique + SPA)
├── setup-vps.sh                 Installation initiale sur le VPS (UNE FOIS)
├── deploy.sh                    Déploiement applicatif (à chaque release)
├── verifier-vps.sh              Préflight check (11 contrôles)
└── README.md                    Ce fichier
```

## Procédure complète (première fois)

### 1. Côté pilote — DuckDNS

Sur https://www.duckdns.org (compte qui gère déjà `glmpronote.duckdns.org`) :

- Créer le sous-domaine **`livret-glm`** pointant vers **`69.62.107.157`**
- Vérifier la propagation : `host livret-glm.duckdns.org` doit retourner cette IP

### 2. Configuration locale

```bash
cp scripts/.env.deploy.example scripts/.env.deploy
# Éditer scripts/.env.deploy : seul BASIC_AUTH_PASSWORD reste à choisir.
```

### 3. Installation initiale du VPS (UNE SEULE FOIS)

Depuis votre poste de dev :

```bash
# 1. Charger les variables
set -a; source scripts/.env.deploy; set +a

# 2. Copier les 4 fichiers nécessaires sur le VPS
scp scripts/.env.deploy            root@${VPS_IP}:/tmp/.env.deploy
scp scripts/setup-vps.sh           root@${VPS_IP}:/tmp/
scp scripts/docker-compose.livret.yml \
    scripts/nginx-livret.conf      root@${VPS_IP}:/tmp/

# 3. Lancer l'installation (compter ~1 minute)
ssh root@${VPS_IP} "bash /tmp/setup-vps.sh"

# 4. Vérification depuis votre poste
bash scripts/verifier-vps.sh

# 5. Nettoyage du VPS
ssh root@${VPS_IP} \
  "rm /tmp/.env.deploy /tmp/setup-vps.sh /tmp/docker-compose.livret.yml /tmp/nginx-livret.conf"
```

À l'issue de cette étape, https://livret-glm.duckdns.org affiche la page d'attente, protégée par Basic Auth.

## Déploiement courant (à chaque release)

Une fois l'app Vite buildable :

```bash
bash scripts/deploy.sh              # build + déploiement
bash scripts/deploy.sh --no-build   # redéploiement rapide
bash scripts/deploy.sh --dry-run    # simulation rsync
```

Le `rsync` copie `dist/` dans `/var/www/livret/` sur le VPS. Le bind-mount du conteneur Nginx étant en lecture, **les fichiers sont servis instantanément** — aucun redémarrage à faire.

## Vérification

À lancer avant chaque démonstration importante :

```bash
bash scripts/verifier-vps.sh
```

Les 11 contrôles doivent tous passer (résultat "11 OK / 0 KO").

## Opérations courantes sur le VPS

```bash
# Logs du conteneur livret
ssh root@${VPS_IP} "docker logs livret --tail 50"

# Redémarrer le conteneur
ssh root@${VPS_IP} "cd /docker/livret && docker compose restart"

# Mettre à jour l'image nginx:alpine
ssh root@${VPS_IP} "cd /docker/livret && docker compose pull && docker compose up -d"

# Logs Traefik (utile si le cert ACME a un souci)
ssh root@${VPS_IP} "docker logs n8n-traefik-1 --tail 100 | grep -i livret"

# Changer le mot de passe Basic Auth
# → Modifier BASIC_AUTH_PASSWORD dans scripts/.env.deploy puis relancer setup-vps.sh
```

## Sécurité

### Recommandations urgentes

1. **Changer le mot de passe SSH root** : il a été partagé en clair dans une conversation et est désormais dans l'historique. Sur le VPS : `passwd`.
2. **Bascule en clé SSH** (recommandé) :
   ```bash
   # Côté local, générer une clé si vous n'en avez pas
   ssh-keygen -t ed25519 -C "guillaume@livret-glm" -f ~/.ssh/livret_glm_ed25519
   # Pousser la clé publique
   ssh-copy-id -i ~/.ssh/livret_glm_ed25519.pub root@69.62.107.157
   # Dans ~/.ssh/config (local), ajouter :
   #   Host livret-vps
   #     HostName 69.62.107.157
   #     User root
   #     IdentityFile ~/.ssh/livret_glm_ed25519
   ```
   Puis désactiver l'auth par mot de passe dans `/etc/ssh/sshd_config` :
   `PasswordAuthentication no` puis `systemctl restart sshd`.

### Ne JAMAIS commiter

- `scripts/.env.deploy` (contient le mot de passe Basic Auth)
- Les clés SSH privées
- Le fichier de hash htpasswd s'il était généré localement

Le `.gitignore` à la racine bloque déjà tout cela.

### Basic Auth

L'identifiant `demo` + mot de passe sert à empêcher l'indexation publique pendant la phase démo. Il ne protège pas les données (qui sont fictives, en localStorage côté navigateur). Le mot de passe se transmet via canal sécurisé (gestionnaire de mots de passe partagé, Signal), jamais par email.

## Procédure de retrait (fin de démo)

```bash
ssh root@${VPS_IP} "cd /docker/livret && docker compose down -v"
ssh root@${VPS_IP} "rm -rf /docker/livret /var/www/livret"
# Optionnel : supprimer le sous-domaine sur duckdns.org
```

Le certificat Let's Encrypt expirera tout seul (pas besoin de le révoquer).

## Limites du dispositif (étape 1)

Conformément à la section 21.8 du cahier des charges :

- Aucune sauvegarde automatique (les données vivent dans le `localStorage` de chaque navigateur)
- Aucun monitoring (Uptime Kuma, logs centralisés)
- Aucun PRA en cas de perte du VPS
- DuckDNS dépend d'un service tiers gratuit "best effort"
- Basic Auth est rudimentaire (mais protégé par HTTPS)

Toutes ces limites sont **acceptables pour une maquette de démonstration** et seront levées en étape 3.

## Coexistence avec les autres projets du VPS

Le projet `livret` :
- N'utilise **aucun port hôte** (Traefik route via le réseau Docker)
- N'utilise **aucune ressource exclusive** (Nginx hôte resterait disponible si réactivé)
- N'écrit que dans `/docker/livret/` et `/var/www/livret/`
- Consomme < 30 Mo RAM (image alpine + nginx)

Aucun risque pour les 4 projets existants (n8n, pronote-tracker, amklelec, laremisevintage).
