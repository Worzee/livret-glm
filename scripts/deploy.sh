#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Déploiement applicatif local → VPS (Option A)
#
# À EXÉCUTER DEPUIS LE POSTE DE DEV, à la racine du projet.
#
# Pré-requis :
#   - scripts/.env.deploy rempli
#   - VPS configuré (scripts/setup-vps.sh exécuté une fois)
#   - Conteneur `livret` actif sur le VPS (docker compose up -d dans /docker/livret)
#   - Application buildable via `npm run build`
#
# Comportement :
#   - rsync du build local vers REMOTE_PATH (bind-mount du conteneur, en lecture)
#   - Les fichiers apparaissent instantanément côté Nginx (pas de redémarrage)
#   - --delete-after pour ne supprimer les anciens fichiers qu'après transfert OK
#
# Usage :
#   bash scripts/deploy.sh              # build + déploie
#   bash scripts/deploy.sh --no-build   # déploie sans rebuild (redéploiement rapide)
#   bash scripts/deploy.sh --dry-run    # simule rsync sans transfert
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROUGE='\033[0;31m'; VERT='\033[0;32m'; JAUNE='\033[0;33m'; BLEU='\033[0;34m'; RESET='\033[0m'
log()   { echo -e "${BLEU}→${RESET} $*"; }
ok()    { echo -e "${VERT}✓${RESET} $*"; }
warn()  { echo -e "${JAUNE}⚠${RESET} $*"; }
fatal() { echo -e "${ROUGE}✗${RESET} $*" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.deploy"

[ -f "$ENV_FILE" ] || fatal "Fichier ${ENV_FILE} introuvable. Copier .env.deploy.example puis le remplir."

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

for var in DUCKDNS_SUBDOMAIN VPS_USER VPS_IP REMOTE_PATH; do
  [ -n "${!var:-}" ] || fatal "Variable $var non définie dans ${ENV_FILE}"
done

# Cible SSH : on privilégie l'IP plutôt que le domaine (évite la dépendance DNS
# pour le déploiement, et évite l'auth Basic qui n'a rien à voir avec SSH).
SSH_TARGET="${VPS_USER}@${VPS_IP}"
SSH_PORT="${VPS_SSH_PORT:-22}"
DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
LOCAL_BUILD_DIR="${LOCAL_BUILD_DIR:-dist}"

# ── Parse arguments ─────────────────────────────────────────────────────────
DO_BUILD=1
DRY_RUN=""
for arg in "$@"; do
  case "$arg" in
    --no-build) DO_BUILD=0 ;;
    --dry-run)  DRY_RUN="--dry-run" ;;
    -h|--help)  sed -n '2,25p' "$0"; exit 0 ;;
    *) fatal "Argument inconnu : $arg" ;;
  esac
done

cd "$PROJECT_ROOT"

# ── Vérifications préalables ────────────────────────────────────────────────
command -v ssh >/dev/null || fatal "ssh absent localement."
# rsync est préféré (delta + atomicité avec --delete-after) ; sinon fallback tar+scp.
HAS_RSYNC=0
if command -v rsync >/dev/null; then HAS_RSYNC=1; fi
[ "$HAS_RSYNC" -eq 0 ] && warn "rsync absent — fallback tar+scp (transfert complet à chaque fois)."

log "Test SSH ${SSH_TARGET}..."
if ! ssh -p "$SSH_PORT" -o BatchMode=yes -o ConnectTimeout=10 \
        "${SSH_TARGET}" "true" 2>/dev/null; then
  fatal "Connexion SSH impossible (BatchMode). Vérifier votre clé SSH pour ${SSH_TARGET}."
fi
ok "SSH OK"

# Vérifier que le conteneur livret est up
CONTAINER_STATE=$(ssh -p "$SSH_PORT" "${SSH_TARGET}" \
  "docker inspect -f '{{.State.Status}}' livret 2>/dev/null || echo absent")
if [ "$CONTAINER_STATE" = "absent" ]; then
  fatal "Conteneur 'livret' inexistant sur le VPS. Avez-vous lancé setup-vps.sh ?"
elif [ "$CONTAINER_STATE" != "running" ]; then
  warn "Conteneur 'livret' non running (état : $CONTAINER_STATE). Tentative de redémarrage..."
  ssh -p "$SSH_PORT" "${SSH_TARGET}" "cd /docker/livret && docker compose up -d"
fi
ok "Conteneur livret : ${CONTAINER_STATE}"

# ── Build ───────────────────────────────────────────────────────────────────
if [ "$DO_BUILD" -eq 1 ]; then
  if [ ! -f "package.json" ]; then
    warn "Aucun package.json à la racine. Build sauté."
  else
    log "Build de l'application (npm run build)..."
    npm run build
    ok "Build terminé"
  fi
fi

[ -d "$LOCAL_BUILD_DIR" ] || fatal "Répertoire de build absent : ${LOCAL_BUILD_DIR}/. Lancer sans --no-build."
[ "$(ls -A "$LOCAL_BUILD_DIR" 2>/dev/null)" ] || fatal "Répertoire de build vide : ${LOCAL_BUILD_DIR}/"

# ── Déploiement ─────────────────────────────────────────────────────────────
log "Déploiement vers ${SSH_TARGET}:${REMOTE_PATH} ..."
[ -n "$DRY_RUN" ] && warn "Mode --dry-run : aucun fichier ne sera transféré."

if [ "$HAS_RSYNC" -eq 1 ]; then
  # Mode préféré : rsync incrémental, --delete-after = atomicité du basculement
  rsync $DRY_RUN -avz --delete-after \
    --exclude='.DS_Store' \
    --exclude='.git' \
    --chmod=D755,F644 \
    -e "ssh -p ${SSH_PORT}" \
    "${LOCAL_BUILD_DIR}/" \
    "${SSH_TARGET}:${REMOTE_PATH}"
elif [ -z "$DRY_RUN" ]; then
  # Fallback : tar + scp + extraction côté distant
  TARFILE="$(mktemp -t livret-dist-XXXXXX.tgz 2>/dev/null || echo "/tmp/livret-dist-$$.tgz")"
  trap 'rm -f "$TARFILE"' EXIT
  tar -czf "$TARFILE" -C "$LOCAL_BUILD_DIR" .
  scp -P "$SSH_PORT" "$TARFILE" "${SSH_TARGET}:/tmp/livret-dist.tgz"
  ssh -p "$SSH_PORT" "${SSH_TARGET}" "
    set -e
    rm -rf /tmp/livret-staging
    mkdir -p /tmp/livret-staging
    tar -xzf /tmp/livret-dist.tgz -C /tmp/livret-staging
    rm -rf ${REMOTE_PATH%/}/*
    cp -r /tmp/livret-staging/* ${REMOTE_PATH%/}/
    rm -rf /tmp/livret-staging /tmp/livret-dist.tgz
  "
else
  warn "--dry-run + pas de rsync : rien à simuler côté tar/scp"
fi

if [ -z "$DRY_RUN" ]; then
  # Le bind-mount Nginx est en lecture : aucun reload nécessaire, les fichiers
  # sont servis depuis le disque à la prochaine requête.
  ok "Fichiers à jour dans ${REMOTE_PATH} — Nginx les sert immédiatement"
fi

echo
echo -e "${VERT}════════════════════════════════════════════════════════════════${RESET}"
echo -e "${VERT}  Déploiement terminé${RESET}"
echo -e "${VERT}════════════════════════════════════════════════════════════════${RESET}"
echo "  URL : https://${DOMAIN}"
echo
echo "  Vérification complète :"
echo "    bash scripts/verifier-vps.sh"
echo
