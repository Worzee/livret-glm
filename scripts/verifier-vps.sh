#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# verifier-vps.sh — Préflight check du déploiement (Option A)
#
# À EXÉCUTER DEPUIS LE POSTE DE DEV (pas sur le VPS).
# 11 contrôles : DNS, redirection HTTPS, Basic Auth, certificat, headers,
# compression, fallback SPA, absence de tracker.
#
# Usage :
#   bash scripts/verifier-vps.sh
#   bash scripts/verifier-vps.sh livret-glm.duckdns.org demo motDePasse
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ROUGE='\033[0;31m'; VERT='\033[0;32m'; JAUNE='\033[0;33m'; RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.deploy"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

DOMAIN="${1:-${DUCKDNS_SUBDOMAIN:+${DUCKDNS_SUBDOMAIN}.duckdns.org}}"
USER_BASIC="${2:-${BASIC_AUTH_USER:-demo}}"
PASS_BASIC="${3:-${BASIC_AUTH_PASSWORD:-}}"

if [ -z "${DOMAIN:-}" ] || [ -z "$PASS_BASIC" ]; then
  cat >&2 <<EOF
Usage : $0 [<sousdomaine.duckdns.org> <user> <mot_de_passe>]

Sans arguments, lit scripts/.env.deploy.
Avec arguments, override les valeurs.
EOF
  exit 1
fi

for outil in curl openssl; do
  command -v "$outil" >/dev/null || { echo "Outil manquant : $outil" >&2; exit 1; }
done

# Détection DNS — plusieurs stratégies par ordre de fiabilité.
# `curl --resolve` n'aidant pas ici, on demande à curl de tenter un DNS lookup
# via une connexion TCP rapide ; un code de retour 0 (avec --connect-timeout)
# prouve que la résolution + le routage fonctionnent. Plus fiable que nslookup
# qui peut timeout sur Windows/MinGW.
dns_resolve() {
  if command -v host >/dev/null; then
    host "$1" 2>/dev/null | grep -q 'has address' && return 0
  fi
  if command -v getent >/dev/null; then
    getent hosts "$1" 2>/dev/null | grep -q '[0-9]' && return 0
  fi
  # Fallback universel : si curl arrive à se connecter en HTTPS, DNS a résolu.
  # On ne se soucie pas du code HTTP retourné, juste du fait que la connexion
  # TCP est établie (donc que le DNS a marché).
  curl -s -o /dev/null --connect-timeout 5 "https://$1" && return 0
  return 1
}

OK=0; KO=0

verifier() {
  local description="$1"; local commande="$2"
  if eval "$commande" > /dev/null 2>&1; then
    echo -e "${VERT}✓${RESET} $description"
    OK=$((OK+1))
  else
    echo -e "${ROUGE}✗${RESET} $description"
    KO=$((KO+1))
  fi
}

echo "── Vérification de https://${DOMAIN} ──"
echo

# 1. DNS résout
verifier "DNS — ${DOMAIN} résout une IP" \
  "dns_resolve '${DOMAIN}'"

# 2. HTTP (80) redirige vers HTTPS (Traefik global)
verifier "HTTP (80) — redirection 301/308 vers HTTPS" \
  "curl -s -o /dev/null -w '%{http_code}' 'http://${DOMAIN}' | grep -qE '^(301|308)$'"

# 3. HTTPS (443) avec Basic Auth actif (401 sans auth)
verifier "HTTPS (443) — Basic Auth actif (401 sans auth)" \
  "curl -s -o /dev/null -w '%{http_code}' 'https://${DOMAIN}' | grep -q '^401$'"

# 4. HTTPS avec Basic Auth valide (200)
verifier "HTTPS — accès autorisé avec Basic Auth (200)" \
  "curl -s -o /dev/null -w '%{http_code}' -u '${USER_BASIC}:${PASS_BASIC}' 'https://${DOMAIN}' | grep -qE '^(200|304)$'"

# 5. Basic Auth rejette les mauvais identifiants
verifier "HTTPS — mauvais Basic Auth rejeté (401)" \
  "curl -s -o /dev/null -w '%{http_code}' -u '${USER_BASIC}:mauvais-mdp' 'https://${DOMAIN}' | grep -q '^401$'"

# 6. Certificat TLS valide (au moins 30 jours avant expiration)
verifier "Certificat TLS — valide et > 30 jours avant expiration" \
  "echo | openssl s_client -servername '${DOMAIN}' -connect '${DOMAIN}:443' 2>/dev/null | openssl x509 -noout -checkend \$((30*86400))"

# 7. En-tête X-Content-Type-Options
verifier "Header — X-Content-Type-Options: nosniff" \
  "curl -s -I -u '${USER_BASIC}:${PASS_BASIC}' 'https://${DOMAIN}' | grep -iq 'x-content-type-options: nosniff'"

# 8. En-tête X-Frame-Options
verifier "Header — X-Frame-Options présent" \
  "curl -s -I -u '${USER_BASIC}:${PASS_BASIC}' 'https://${DOMAIN}' | grep -iq 'x-frame-options'"

# 9. Compression Gzip activée
verifier "Compression — Gzip activée" \
  "curl -s -I -u '${USER_BASIC}:${PASS_BASIC}' -H 'Accept-Encoding: gzip' 'https://${DOMAIN}' | grep -iq 'content-encoding: gzip'"

# 10. SPA fallback
verifier "SPA fallback — route inexistante retourne 200" \
  "curl -s -o /dev/null -w '%{http_code}' -u '${USER_BASIC}:${PASS_BASIC}' 'https://${DOMAIN}/route-inexistante' | grep -q '^200$'"

# 11. Anti-télémétrie (tag projet : aucun script de tracking dans la page)
verifier "Anti-télémétrie — aucun script Google Analytics/Hotjar/Matomo détecté" \
  "! curl -s -u '${USER_BASIC}:${PASS_BASIC}' 'https://${DOMAIN}' | grep -qiE 'google-analytics|googletagmanager|gtag\\(|hotjar|matomo'"

echo
echo "── Résultat ──"
echo -e "${VERT}${OK} OK${RESET} / ${ROUGE}${KO} KO${RESET}"

if [ $KO -gt 0 ]; then
  echo -e "${JAUNE}Le déploiement n'est pas prêt pour la démo.${RESET}"
  exit 1
fi

echo -e "${VERT}Déploiement opérationnel.${RESET}"
