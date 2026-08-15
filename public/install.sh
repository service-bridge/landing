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

# Companion image with native sb CLI binaries for every host platform,
# published by the same release under the runtime tag + "-cli".
SB_CLI_IMAGE="${SB_CLI_IMAGE:-${SB_IMAGE}-cli}"

# Host-published ports. The runtime always listens on 14444/14445 inside the
# container; these only remap the host side, so several instances can coexist.
SB_HTTP_PORT="${SB_HTTP_PORT:-14444}"
SB_GRPC_PORT="${SB_GRPC_PORT:-14445}"
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

# sb binaries inside the CLI image are keyed by host platform: /dist/sb-<os>-<arch>[.exe]
host_platform() {
  local os arch
  case "$(uname -s)" in
    Darwin)               os=darwin ;;
    Linux)                os=linux ;;
    MINGW*|MSYS*|CYGWIN*) os=windows ;;
    *) return 1 ;;
  esac
  case "$(uname -m)" in
    arm64|aarch64) arch=arm64 ;;
    x86_64|amd64)  arch=amd64 ;;
    *) return 1 ;;
  esac
  echo "${os}-${arch}"
}

# Put the native sb CLI on the host PATH, version-matched to the runtime just
# pulled: the release publishes a companion image (<runtime tag>-cli) carrying
# sb binaries for every supported host platform; copy out the one matching this
# host. No sudo: falls back to /opt/homebrew/bin (macOS) or SB_DIR/bin when
# /usr/local/bin isn't writable.
install_cli() {
  local platform dir dest cid ext=""
  platform="$(host_platform)" || {
    warn "No prebuilt sb CLI for $(uname -s)/$(uname -m) — skipping"
    return 0
  }
  case "$platform" in windows-*) ext=".exe" ;; esac

  if [ -w /usr/local/bin ]; then
    dir=/usr/local/bin
  elif [ -d /opt/homebrew/bin ] && [ -w /opt/homebrew/bin ]; then
    dir=/opt/homebrew/bin
  else
    dir="${SB_DIR}/bin"
    mkdir -p "$dir"
  fi
  dest="${dir}/sb${ext}"

  docker pull -q "$SB_CLI_IMAGE" >/dev/null 2>&1 \
    || { warn "Could not pull sb CLI image ${SB_CLI_IMAGE} — skipping"; return 0; }
  cid="$(docker create "$SB_CLI_IMAGE" 2>/dev/null)" \
    || { warn "Could not stage sb CLI"; return 0; }
  local copied=""
  if docker cp "${cid}:/dist/sb-${platform}${ext}" "$dest" 2>/dev/null; then
    chmod +x "$dest"
    copied=1
  fi
  docker rm -f "$cid" >/dev/null 2>&1 || true
  docker rmi "$SB_CLI_IMAGE" >/dev/null 2>&1 || true

  if [ -z "$copied" ]; then
    warn "No sb binary for ${platform} in ${SB_CLI_IMAGE} — skipping"
    return 0
  fi

  if ! "$dest" version >/dev/null 2>&1; then
    warn "Installed sb binary does not run on this host — removing ${dest}"
    rm -f "$dest"
    return 0
  fi

  ok "Installed CLI: ${dest} ($("$dest" version))"
  case ":${PATH}:" in
    *":${dir}:"*) ;;
    *) info "Add to PATH:  export PATH=\"${dir}:\$PATH\"" ;;
  esac
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
  install_cli

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
  echo "    sb version                                    # CLI (ships with the runtime)"
  echo "    sb login -u admin                             # then drive the runtime from the terminal"
  echo "    cd ${SB_DIR}"
  echo "    docker compose logs -f service-bridge"
  echo "    docker compose restart service-bridge"
  echo "    docker compose pull && docker compose up -d   # update"
  echo "    docker compose down                           # stop"
  echo
}

main "$@"
