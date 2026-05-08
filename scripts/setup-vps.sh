#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-vps.sh — Installation initiale du Livret sur le VPS (Option A)
#
# S'intègre dans l'écosystème Docker/Traefik EXISTANT du VPS.
# Ne touche PAS aux autres projets (n8n, pronote-tracker, amklelec, laremisevintage).
#
# À EXÉCUTER SUR LE VPS, EN ROOT, UNE SEULE FOIS.
#
# Prérequis (déjà en place sur ce VPS, vérifiés à l'audit) :
#   - Docker + Docker Compose v2
#   - Conteneur Traefik (n8n-traefik-1) sur le réseau n8n_default
#   - Résolveur ACME `mytlschallenge` configuré dans Traefik
#   - Sous-domaine livret-glm.duckdns.org créé MANUELLEMENT sur duckdns.org
#     pointant vers l'IP du VPS (étape réalisée par le pilote AVANT ce script)
#
# Usage :
#   1. Sur le poste de dev : remplir scripts/.env.deploy
#   2. Copier les 3 fichiers sur le VPS :
#        scp scripts/.env.deploy             root@<VPS_IP>:/tmp/.env.deploy
#        scp scripts/setup-vps.sh            root@<VPS_IP>:/tmp/
#        scp scripts/docker-compose.livret.yml scripts/nginx-livret.conf \
#            root@<VPS_IP>:/tmp/
#   3. Lancer : ssh root@<VPS_IP> "bash /tmp/setup-vps.sh"
#
# Ce que fait ce script (idempotent) :
#   1. Vérifie Docker, Compose, réseau n8n_default, conteneur Traefik
#   2. Vérifie la résolution DNS du sous-domaine
#   3. Crée /docker/livret/ avec docker-compose.yml + nginx-livret.conf
#   4. Crée /var/www/livret/ avec une page d'attente
#   5. Génère le hash bcrypt du Basic Auth (via conteneur httpd jetable)
#   6. Substitue les variables dans docker-compose.yml
#   7. docker compose up -d
#   8. Attend que Traefik émette le certificat (vérification HTTPS)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Couleurs ────────────────────────────────────────────────────────────────
ROUGE='\033[0;31m'; VERT='\033[0;32m'; JAUNE='\033[0;33m'; BLEU='\033[0;34m'; RESET='\033[0m'
log()   { echo -e "${BLEU}→${RESET} $*"; }
ok()    { echo -e "${VERT}✓${RESET} $*"; }
warn()  { echo -e "${JAUNE}⚠${RESET} $*"; }
fatal() { echo -e "${ROUGE}✗${RESET} $*" >&2; exit 1; }

# ── Vérifications préalables ─────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || fatal "Ce script doit être exécuté en root."

ENV_FILE="${ENV_FILE:-/tmp/.env.deploy}"
COMPOSE_SRC="${COMPOSE_SRC:-/tmp/docker-compose.livret.yml}"
NGINX_SRC="${NGINX_SRC:-/tmp/nginx-livret.conf}"

[ -f "$ENV_FILE" ]    || fatal "Fichier $ENV_FILE introuvable. Le copier d'abord avec scp."
[ -f "$COMPOSE_SRC" ] || fatal "Fichier $COMPOSE_SRC introuvable."
[ -f "$NGINX_SRC" ]   || fatal "Fichier $NGINX_SRC introuvable."

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

for var in DUCKDNS_SUBDOMAIN BASIC_AUTH_USER BASIC_AUTH_PASSWORD REMOTE_PATH; do
  [ -n "${!var:-}" ] || fatal "Variable $var non définie dans $ENV_FILE"
done

DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
TARGET_DIR="/docker/livret"
REALM="Maquette GRETA - acces restreint"

log "Cible : https://${DOMAIN}"
log "Web root : ${REMOTE_PATH}"
log "Compose dir : ${TARGET_DIR}"

# ── 1. Vérifier l'écosystème Docker/Traefik ─────────────────────────────────
log "1/8 — Vérification de l'écosystème Docker/Traefik..."
command -v docker >/dev/null || fatal "Docker absent."
docker compose version >/dev/null 2>&1 || fatal "Docker Compose v2 absent."
docker network inspect n8n_default >/dev/null 2>&1 \
  || fatal "Réseau Docker n8n_default introuvable. Le conteneur Traefik est-il bien up ?"
docker ps --filter "name=n8n-traefik-1" --filter "status=running" --format '{{.Names}}' \
  | grep -q n8n-traefik-1 || fatal "Conteneur n8n-traefik-1 non actif."
ok "Docker, Compose, Traefik et réseau n8n_default opérationnels"

# ── 2. Vérifier la résolution DNS du sous-domaine ───────────────────────────
log "2/8 — Vérification DNS de ${DOMAIN}..."
RESOLVED_IP=$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | head -1 || true)
if [ -z "$RESOLVED_IP" ]; then
  warn "${DOMAIN} ne résout pas encore."
  warn "→ Créez le sous-domaine sur https://www.duckdns.org pointant vers ${VPS_IP:-cette machine}, puis relancez ce script."
  fatal "DNS non prêt."
fi
EXPECTED_IP=$(curl -s -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
if [ "$RESOLVED_IP" = "$EXPECTED_IP" ]; then
  ok "${DOMAIN} -> ${RESOLVED_IP} (correspond a l'IP du VPS)"
else
  warn "${DOMAIN} pointe vers ${RESOLVED_IP} mais le VPS est ${EXPECTED_IP}"
  warn "Le certificat ACME risque d'echouer. Continuation sous votre responsabilite."
fi

# ── 3. Préparer /var/www/livret ─────────────────────────────────────────────
log "3/8 — Préparation de ${REMOTE_PATH}..."
mkdir -p "${REMOTE_PATH}"
if [ ! -f "${REMOTE_PATH}/index.html" ]; then
  cat > "${REMOTE_PATH}/index.html" <<EOF
<!doctype html>
<html lang="fr"><meta charset="utf-8">
<title>Livret d'apprentissage — En préparation</title>
<body style="font-family:system-ui;max-width:42rem;margin:4rem auto;padding:2rem;color:#1e40af">
  <h1>Livret d'apprentissage GRETA Lyon Métropole</h1>
  <p><strong>Maquette de démonstration en cours de déploiement.</strong></p>
  <p>L'application sera disponible prochainement à cette adresse.</p>
  <hr>
  <p style="font-size:0.85em;color:#64748b">
    Page placeholder déposée par <code>setup-vps.sh</code> le $(date -Iseconds)
  </p>
</body></html>
EOF
  ok "Page d'attente créée"
else
  ok "${REMOTE_PATH} contient déjà du contenu — préservé"
fi

# ── 4. Préparer /docker/livret ──────────────────────────────────────────────
log "4/8 — Création de ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"
cp "${NGINX_SRC}" "${TARGET_DIR}/nginx-livret.conf"
ok "${TARGET_DIR}/nginx-livret.conf déposé"

# ── 5. Générer le hash Basic Auth (bcrypt via conteneur httpd jetable) ──────
log "5/8 — Génération du hash bcrypt Basic Auth..."
# httpd:2.4-alpine fournit htpasswd. -nbB = bcrypt, sortie sur stdout.
RAW_HASH=$(docker run --rm httpd:2.4-alpine \
  htpasswd -nbB "${BASIC_AUTH_USER}" "${BASIC_AUTH_PASSWORD}" 2>/dev/null \
  | tr -d '\r\n')
[ -n "$RAW_HASH" ] || fatal "Échec de la génération htpasswd."
# Dans une étiquette docker-compose, chaque '$' du hash doit être doublé.
ESCAPED_HASH="${RAW_HASH//\$/\$\$}"
ok "Hash généré pour utilisateur ${BASIC_AUTH_USER}"

# ── 6. Substituer les variables dans docker-compose.yml ─────────────────────
log "6/8 — Génération de ${TARGET_DIR}/docker-compose.yml..."
# On utilise un délimiteur '|' car le hash contient des '/'
sed \
  -e "s|{{DOMAIN}}|${DOMAIN}|g" \
  -e "s|{{REMOTE_PATH}}|${REMOTE_PATH%/}|g" \
  -e "s|{{REALM}}|${REALM}|g" \
  -e "s|{{BASIC_AUTH}}|${ESCAPED_HASH}|g" \
  "${COMPOSE_SRC}" > "${TARGET_DIR}/docker-compose.yml"
ok "docker-compose.yml généré"

# ── 7. Lancer le conteneur ──────────────────────────────────────────────────
log "7/8 — Démarrage du conteneur livret..."
cd "${TARGET_DIR}"
docker compose pull --quiet
docker compose up -d
sleep 3
docker compose ps
ok "Conteneur livret démarré"

# ── 8. Attendre que Traefik émette le certificat ────────────────────────────
log "8/8 — Attente du certificat Let's Encrypt (Traefik ACME)..."
DEADLINE=$(($(date +%s) + 90))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "https://${DOMAIN}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "401" ]; then
    ok "HTTPS répond avec Basic Auth actif (401 attendu sans authentification)"
    break
  fi
  printf '.'
  sleep 3
done
echo

if [ "$HTTP_CODE" != "401" ]; then
  warn "HTTPS ne répond pas encore comme attendu (code reçu : $HTTP_CODE)."
  warn "Vérifier les logs : docker logs n8n-traefik-1 --tail 50"
fi

# ── Récapitulatif ───────────────────────────────────────────────────────────
echo
echo -e "${VERT}════════════════════════════════════════════════════════════════${RESET}"
echo -e "${VERT}  Installation Livret terminée${RESET}"
echo -e "${VERT}════════════════════════════════════════════════════════════════${RESET}"
echo
echo "  URL publique     : https://${DOMAIN}"
echo "  Basic Auth user  : ${BASIC_AUTH_USER}"
echo "  Web root         : ${REMOTE_PATH}"
echo "  Compose          : ${TARGET_DIR}/docker-compose.yml"
echo "  Conteneur        : livret (image nginx:1.27-alpine)"
echo "  Réseau Docker    : n8n_default (partagé avec Traefik)"
echo
echo -e "${JAUNE}── Vérification depuis le poste de dev ──${RESET}"
echo "  bash scripts/verifier-vps.sh"
echo
echo -e "${JAUNE}── Premier déploiement applicatif (depuis le poste de dev) ──${RESET}"
echo "  bash scripts/deploy.sh"
echo
echo -e "${JAUNE}── Nettoyage des fichiers temporaires sur le VPS ──${RESET}"
echo "  rm /tmp/.env.deploy /tmp/setup-vps.sh /tmp/docker-compose.livret.yml /tmp/nginx-livret.conf"
echo
