#!/usr/bin/env bash
# ServiceBridge — one-line installer from Docker Registry
#
# Usage:
#   bash <(curl -fsSL https://servicebridge.dev/install.sh)
#
# Non-interactive (all via env vars):
#   SB_ADMIN_LOGIN=admin \
#   SB_PUBLIC_ORIGIN=https://sb.example.com \
#   SB_DIR=/opt/servicebridge \
#   bash install.sh
#
# Password is always auto-generated. To set a specific one, pass SB_ADMIN_PASSWORD.
# The installer also exports runtime CA to ~/.servicebridge/ca.crt for local SDK trust.

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
SB_REGISTRY="${SB_REGISTRY:-ghcr.io}"
SB_OWNER="${SB_OWNER:-service-bridge}"
SB_VERSION="${SB_VERSION:-edge}"
SB_IMAGE="${SB_IMAGE:-${SB_REGISTRY}/${SB_OWNER}/servicebridge:${SB_VERSION}}"
SB_DIR="${SB_DIR:-${HOME}/servicebridge}"

# ── Colors ────────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

log()  { echo -e "${BOLD}$*${NC}"; }
step() { echo -e "\n${BOLD}$*${NC}"; }
info() { echo -e "  ${BLUE}→${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
die()  { echo -e "\n${RED}Error: $*${NC}" >&2; exit 1; }

# ── Prereqs ───────────────────────────────────────────────────────────────────
check_deps() {
  command -v docker &>/dev/null \
    || die "Docker is not installed. See https://docs.docker.com/get-docker/"

  docker compose version &>/dev/null 2>&1 \
    || docker-compose version &>/dev/null 2>&1 \
    || die "Docker Compose not found. Install Docker Desktop or the Compose plugin."
}

compose() {
  if docker compose version &>/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

# ── Interactive prompts ───────────────────────────────────────────────────────
# ask VAR "Prompt text" "default value"
# Skips if VAR is already set in the environment.
ask() {
  local var="$1" prompt="$2" default="${3:-}"
  if [ -n "${!var:-}" ]; then return; fi
  local line
  if [ -n "$default" ]; then
    read -rp "  ${prompt} [${default}]: " line
    printf -v "$var" '%s' "${line:-$default}"
  else
    read -rp "  ${prompt}: " line
    [ -n "$line" ] || die "${prompt} cannot be empty"
    printf -v "$var" '%s' "$line"
  fi
}

# compose_quote VALUE
# Produces a docker-compose-safe double-quoted scalar:
# - escapes backslashes and quotes for YAML
# - escapes '$' as '$$' to disable Compose variable interpolation
compose_quote() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//\$/\$\$}"
  printf '"%s"' "$s"
}

# gen_password — generates a random URL-safe password if SB_ADMIN_PASSWORD is not set
gen_password() {
  if [ -n "${SB_ADMIN_PASSWORD:-}" ]; then return; fi
  # head -c causes tr to receive SIGPIPE, making the pipeline exit non-zero.
  # Temporarily disable pipefail so the assignment succeeds.
  set +o pipefail
  SB_ADMIN_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9_-' < /dev/urandom | head -c 24)
  set -o pipefail
  SB_PASSWORD_GENERATED=true
}

export_ca_for_local_sdks() {
  local ca_dir="${HOME}/.servicebridge"
  local ca_path="${ca_dir}/ca.crt"
  local tries=30

  mkdir -p "$ca_dir"

  while [ "$tries" -gt 0 ]; do
    if compose exec -T servicebridge sh -c 'test -s /etc/servicebridge/tls/ca.crt' >/dev/null 2>&1; then
      if compose exec -T servicebridge cat /etc/servicebridge/tls/ca.crt > "$ca_path"; then
        chmod 600 "$ca_path" 2>/dev/null || true
        ok "Exported control-plane CA to ${ca_path}"
        return 0
      fi
      break
    fi
    sleep 1
    tries=$((tries - 1))
  done

  warn "Could not export CA automatically."
  warn "Run manually: docker compose exec -T servicebridge cat /etc/servicebridge/tls/ca.crt > ${ca_path}"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  echo
  log "ServiceBridge Installer"
  echo "──────────────────────────────────"

  check_deps

  # ── Collect config ────────────────────────────────────────────────────────
  step "1/4  Configuration"

  ask SB_DIR         "Installation directory"              "$SB_DIR"
  ask SB_IMAGE       "Docker image"                        "$SB_IMAGE"
  ask SB_ADMIN_LOGIN "Admin username"                      "admin"
  ask SB_HTTP_PORT   "HTTP port"                           "14444"
  ask SB_GRPC_PORT   "gRPC port"                          "14445"
  ask SB_PUBLIC_ORIGIN "Public URL(s), comma-separated for multiple CORS origins" "http://localhost:${SB_HTTP_PORT},http://127.0.0.1:${SB_HTTP_PORT}"

  SB_PASSWORD_GENERATED=false
  gen_password

  mkdir -p "$SB_DIR"
  cd "$SB_DIR"

  # ── Hash password via the image itself ────────────────────────────────────
  step "2/4  Generating password hash"

  info "Pulling image ${SB_IMAGE}..."
  docker pull "$SB_IMAGE"

  info "Hashing password..."
  SB_PASSWORD_HASH=$(
    printf '%s' "$SB_ADMIN_PASSWORD" \
      | docker run --rm -i "$SB_IMAGE" /app/servicebridge hash-password --password-stdin
  )
  ok "Password hashed successfully"

  # ── Write docker-compose.yml ──────────────────────────────────────────────
  step "3/4  Writing configuration"

  # Inline everything into compose and neutralize '$' interpolation.
  SB_ADMIN_LOGIN_COMPOSE="$(compose_quote "$SB_ADMIN_LOGIN")"
  SB_PASSWORD_HASH_COMPOSE="$(compose_quote "$SB_PASSWORD_HASH")"
  SB_PUBLIC_ORIGIN_COMPOSE="$(compose_quote "$SB_PUBLIC_ORIGIN")"

  cat > docker-compose.yml <<COMPOSE
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: servicebridge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - servicebridge-pg:/var/lib/postgresql/data
    networks:
      - servicebridge-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d servicebridge"]
      interval: 10s
      timeout: 3s
      retries: 10

  servicebridge:
    image: ${SB_IMAGE}
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${SB_HTTP_PORT}:14444"
      - "${SB_GRPC_PORT}:14445"
    networks:
      - servicebridge-internal
      - servicebridge-external
    volumes:
      - servicebridge-tls:/etc/servicebridge/tls
    environment:
      SERVICEBRIDGE_ADMIN_LOGIN: ${SB_ADMIN_LOGIN_COMPOSE}
      SERVICEBRIDGE_ADMIN_PASSWORD_HASH: ${SB_PASSWORD_HASH_COMPOSE}
      SERVICEBRIDGE_PUBLIC_ORIGIN: ${SB_PUBLIC_ORIGIN_COMPOSE}
      SERVICEBRIDGE_TLS_DIR: /etc/servicebridge/tls
      SERVICEBRIDGE_GRPC_HOST: "0.0.0.0"
      SERVICEBRIDGE_PG_URL: "postgres://postgres:postgres@postgres:5432/servicebridge"
      SERVICEBRIDGE_WORKER_SESSION_TTL_MS: "30000"
      SERVICEBRIDGE_WORKER_SESSION_DEFAULT_MAX_INFLIGHT: "128"
      SERVICEBRIDGE_WORKER_COMMAND_CLAIM_LEASE_MS: "35000"
      SERVICEBRIDGE_WORKER_COMMANDS_TTL_DAYS: "1"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O- http://localhost:14444/health || exit 1"]
      interval: 15s
      timeout: 3s
      retries: 5
      start_period: 20s

networks:
  servicebridge-internal:
    driver: bridge
  servicebridge-external:
    driver: bridge

volumes:
  servicebridge-pg:
  servicebridge-tls:
COMPOSE
  ok "Created docker-compose.yml"

  # ── Start ─────────────────────────────────────────────────────────────────
  step "4/4  Starting services"

  compose up -d
  export_ca_for_local_sdks

  echo
  log "Installation completed"
  echo "──────────────────────────────────"
  echo "  URL:         ${SB_PUBLIC_ORIGIN}"
  echo "  Admin login: ${SB_ADMIN_LOGIN}"
  if [ "$SB_PASSWORD_GENERATED" = true ]; then
    echo -e "  Password:    ${BOLD}${SB_ADMIN_PASSWORD}${NC}"
  fi
  unset SB_ADMIN_PASSWORD
  echo "  Directory:   ${SB_DIR}"
  echo
  echo "Commands:"
  echo "    cd ${SB_DIR}"
  echo "    docker compose logs -f servicebridge"
  echo "    docker compose restart servicebridge"
  echo "    docker compose pull && docker compose up -d   # update"
  echo "    docker compose down                           # stop"
  echo
}

main "$@"
