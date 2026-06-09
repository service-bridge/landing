#!/usr/bin/env bash
# ServiceBridge — one-line installer
#
# Usage:
#   bash <(curl -fsSL https://servicebridge.dev/install.sh)
#
# Installs the newest published version, whatever it is (alpha, beta or
# stable) — the release CI keeps the `edge` image tag pointed at the most
# recent build, so the installer always pulls the latest.
#
# Overrides (never prompted):
#   SB_VERSION=<exact tag>      pin an exact version (e.g. 2.0.0-alpha)
#   SB_IMAGE=<full ref>         fully override the image reference
#   SB_DIR=/opt/servicebridge   install directory

set -euo pipefail

# ── Config (overridable via env, never prompted) ───────────────────────────────
SB_REGISTRY="${SB_REGISTRY:-ghcr.io}"
SB_OWNER="${SB_OWNER:-service-bridge}"
SB_REPO="${SB_REGISTRY}/${SB_OWNER}/service-bridge"
SB_DIR="${SB_DIR:-${HOME}/servicebridge}"

# Newest published version = the moving `edge` tag, unless a version is pinned
# or the image is fully overridden.
SB_IMAGE="${SB_IMAGE:-${SB_REPO}:${SB_VERSION:-edge}}"

# Fixed ports — the runtime listens on these and reads no env to configure them.
SB_HTTP_PORT=14444
SB_GRPC_PORT=14445
SB_URL="http://localhost:${SB_HTTP_PORT}"

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

# Read the resolved version from the image label after a pull.
image_version() {
  docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' \
    "$1" 2>/dev/null
}

wait_until_ready() {
  local url="http://localhost:${SB_HTTP_PORT}/readyz"
  local tries=40

  # The runtime is stateless and keeps no files; SDKs receive the CA inside
  # their bootstrap key, so there is nothing to export. Just wait for ready.
  while [ "$tries" -gt 0 ]; do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      ok "Runtime is ready"
      return 0
    fi
    sleep 1
    tries=$((tries - 1))
  done

  warn "Runtime did not report ready yet — check: docker compose logs -f service-bridge"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  echo
  log "ServiceBridge Installer"
  echo "──────────────────────────────────"

  check_deps

  step "1/3  Preparing ${SB_DIR}"
  mkdir -p "$SB_DIR"
  cd "$SB_DIR"
  ok "Using directory ${SB_DIR}"

  step "2/3  Writing docker-compose.yml"
  cat > docker-compose.yml <<COMPOSE
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: service-bridge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - service-bridge-pg:/var/lib/postgresql
    networks:
      - service-bridge-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d service-bridge"]
      interval: 10s
      timeout: 3s
      retries: 10

  service-bridge:
    image: ${SB_IMAGE}
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${SB_HTTP_PORT}:14444"
      - "${SB_GRPC_PORT}:14445"
    networks:
      - service-bridge-internal
      - service-bridge-external

networks:
  service-bridge-internal:
    driver: bridge
  service-bridge-external:
    driver: bridge

volumes:
  service-bridge-pg:
COMPOSE
  ok "Created docker-compose.yml"

  step "3/3  Starting services"
  info "Pulling image ${SB_IMAGE}..."
  docker pull "$SB_IMAGE"

  local resolved
  resolved="$(image_version "$SB_IMAGE")"
  if [ -n "$resolved" ]; then
    ok "Installing version: ${BOLD}${resolved}${NC}"
  fi

  compose up -d
  wait_until_ready

  echo
  log "Installation completed"
  echo "──────────────────────────────────"
  echo "  URL:       ${SB_URL}"
  echo "  Image:     ${SB_IMAGE}"
  [ -n "$resolved" ] && echo "  Version:   ${resolved}"
  echo "  Directory: ${SB_DIR}"
  echo
  echo -e "  ${BOLD}Open ${SB_URL} to create your admin account.${NC}"
  echo
  echo "Commands:"
  echo "    cd ${SB_DIR}"
  echo "    docker compose logs -f service-bridge"
  echo "    docker compose restart service-bridge"
  echo "    docker compose pull && docker compose up -d   # update"
  echo "    docker compose down                           # stop"
  echo
}

main "$@"
