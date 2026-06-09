#!/usr/bin/env bash
# ServiceBridge — one-line installer
#
# Usage:
#   bash <(curl -fsSL https://servicebridge.dev/install.sh)
#
# Channel-aware. The release CI maintains moving tags on the public image:
#   latest (newest stable), rc, beta, alpha, edge (newest of any) — plus exact
#   version tags. The installer probes which channels exist and lets you pick.
#
# Interactive (TTY): numbered menu of the channels that currently have an image.
# Non-interactive (curl | bash): the default channel is chosen silently.
#
# Overrides (skip the menu, never prompted):
#   SB_CHANNEL=latest|rc|beta|alpha|edge   pick a moving channel
#   SB_VERSION=<exact tag>                 pin an exact version (e.g. 2.0.0-alpha)
#   SB_IMAGE=<full ref>                    fully override the image reference
#   SB_DIR=/opt/servicebridge              install directory

set -euo pipefail

# ── Defaults (overridable via env, never prompted) ─────────────────────────────
SB_REGISTRY="${SB_REGISTRY:-ghcr.io}"
SB_OWNER="${SB_OWNER:-service-bridge}"
SB_REPO="${SB_REGISTRY}/${SB_OWNER}/servicebridge"
SB_DIR="${SB_DIR:-${HOME}/servicebridge}"

# Channels in display/preference order. The default is the first that exists.
SB_CHANNELS=(latest rc beta alpha edge)

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

# True if a tag exists in the public registry. Anonymous works for public images.
tag_exists() {
  docker manifest inspect "${SB_REPO}:$1" >/dev/null 2>&1
}

# Print the channels that currently have an image, in preference order.
discover_channels() {
  local ch
  for ch in "${SB_CHANNELS[@]}"; do
    if tag_exists "$ch"; then
      echo "$ch"
    fi
  done
}

# Read the resolved version from the image label after a pull.
image_version() {
  docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' \
    "$1" 2>/dev/null
}

# Resolve which tag to install into SB_TAG. Honors SB_IMAGE/SB_VERSION/SB_CHANNEL.
resolve_tag() {
  if [ -n "${SB_IMAGE:-}" ]; then
    SB_TAG=""  # fully overridden, no channel concept
    return 0
  fi

  if [ -n "${SB_VERSION:-}" ]; then
    SB_TAG="$SB_VERSION"
    info "Pinned version: ${BOLD}${SB_TAG}${NC}"
    return 0
  fi

  info "Probing available channels on ${SB_REPO}..."
  local available
  available=()
  while IFS= read -r line; do
    [ -n "$line" ] && available+=("$line")
  done < <(discover_channels)

  [ "${#available[@]}" -gt 0 ] \
    || die "No published channels found for ${SB_REPO}. Set SB_VERSION or SB_IMAGE to override."

  if [ -n "${SB_CHANNEL:-}" ]; then
    local ch
    for ch in "${available[@]}"; do
      if [ "$ch" = "$SB_CHANNEL" ]; then
        SB_TAG="$SB_CHANNEL"
        info "Channel: ${BOLD}${SB_TAG}${NC}"
        return 0
      fi
    done
    die "Channel '${SB_CHANNEL}' has no image. Available: ${available[*]}"
  fi

  # Default is the first available channel in preference order.
  local default="${available[0]}"

  if [ -t 0 ]; then
    echo
    log "Available channels:"
    local i=1
    for ch in "${available[@]}"; do
      if [ "$ch" = "$default" ]; then
        echo -e "  ${BOLD}${i})${NC} ${ch} ${GREEN}(default)${NC}"
      else
        echo -e "  ${BOLD}${i})${NC} ${ch}"
      fi
      i=$((i + 1))
    done
    echo
    local choice
    read -r -p "Choose a channel [1-${#available[@]}] (Enter = ${default}): " choice || choice=""
    if [ -z "$choice" ]; then
      SB_TAG="$default"
    elif [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#available[@]}" ]; then
      SB_TAG="${available[$((choice - 1))]}"
    else
      die "Invalid choice: ${choice}"
    fi
  else
    SB_TAG="$default"
    info "Non-interactive — using default channel: ${BOLD}${SB_TAG}${NC}"
  fi
}

export_ca_for_local_sdks() {
  local ca_dir="${HOME}/.servicebridge"
  local ca_path="${ca_dir}/ca.crt"
  local tries=30

  mkdir -p "$ca_dir"

  while [ "$tries" -gt 0 ]; do
    if compose exec -T servicebridge sh -c 'test -s /app/certs/ca.crt' >/dev/null 2>&1; then
      if compose exec -T servicebridge cat /app/certs/ca.crt > "$ca_path"; then
        chmod 600 "$ca_path" 2>/dev/null || true
        ok "Control-plane CA exported → ${ca_path}"
        return 0
      fi
      break
    fi
    sleep 1
    tries=$((tries - 1))
  done

  warn "Could not export CA automatically."
  warn "Run manually: docker compose exec -T servicebridge cat /app/certs/ca.crt > ${ca_path}"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  echo
  log "ServiceBridge Installer"
  echo "──────────────────────────────────"

  check_deps

  resolve_tag
  SB_IMAGE="${SB_IMAGE:-${SB_REPO}:${SB_TAG}}"

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
      - servicebridge-tls:/app/certs
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O- http://localhost:14444/readyz || exit 1"]
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

  step "3/3  Starting services"
  info "Pulling image ${SB_IMAGE}..."
  docker pull "$SB_IMAGE"

  local resolved
  resolved="$(image_version "$SB_IMAGE")"
  if [ -n "$resolved" ]; then
    ok "Resolved version: ${BOLD}${resolved}${NC}"
  fi

  compose up -d
  export_ca_for_local_sdks

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
  echo "    docker compose logs -f servicebridge"
  echo "    docker compose restart servicebridge"
  echo "    docker compose pull && docker compose up -d   # update"
  echo "    docker compose down                           # stop"
  echo
}

main "$@"
