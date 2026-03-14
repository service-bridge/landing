// keywords: servicebridge service-bridge install installation Docker Kubernetes self-hosted runtime PostgreSQL mTLS TLS service-mesh microservices gRPC event-bus distributed-tracing workflow background-jobs cron observability npm i service-bridge pip install service-bridge go get Node.js Python Go SDK one-binary zero-sidecar proxyless devops production-ready

import {
  Callout,
  DocCodeBlock,
  EnvTable,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
} from "../../ui/DocComponents";

export function PageInstallation() {
  return (
    <div>
      <PageHeader
        badge="Getting Started"
        title="Installation"
        description="Install the ServiceBridge runtime — a single Go binary + PostgreSQL that replaces your entire service mesh, broker, and workflow engine."
      />

      <H2 id="option-1">Option 1 — One-line installer (recommended)</H2>
      <P>
        Installs ServiceBridge + PostgreSQL via Docker Compose and generates an admin password
        automatically. Everything ends up in <Mono>~/servicebridge/</Mono>.
      </P>
      <DocCodeBlock lang="bash" code={`bash <(curl -fsSL https://servicebridge.dev/install.sh)`} />
      <P>
        The script asks for install directory, public URL, and ports, then prints the generated
        admin password at the end. After install, the dashboard is at{" "}
        <Mono>http://localhost:14444</Mono> and the gRPC control plane at{" "}
        <Mono>localhost:14445</Mono>.
      </P>

      <H3 id="non-interactive">Non-interactive (CI, cloud-init, Ansible)</H3>
      <DocCodeBlock
        lang="bash"
        code={`SB_ADMIN_LOGIN=admin \\
SB_PUBLIC_ORIGIN=https://sb.example.com \\
SB_DIR=/opt/servicebridge \\
bash <(curl -fsSL https://servicebridge.dev/install.sh)`}
      />

      <H2 id="manage">Manage after install</H2>
      <DocCodeBlock
        lang="bash"
        code={`cd ~/servicebridge
docker compose logs -f servicebridge     # logs
docker compose restart servicebridge     # restart
docker compose pull && docker compose up -d  # update
docker compose down                      # stop`}
      />

      <H2 id="option-2">Option 2 — Docker Compose manually</H2>
      <P>Use this if you want full control over the configuration from the start.</P>

      <H3 id="generate-hash">Step 1 — Generate a password hash</H3>
      <P>
        Open{" "}
        <a
          href="https://servicebridge.dev/#hash-password"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          servicebridge.dev/#hash-password
        </a>{" "}
        — bcrypt is computed in the browser, the password never leaves your device.
      </P>

      <H3 id="compose-file">Step 2 — Create docker-compose.yml</H3>
      <DocCodeBlock
        lang="yaml"
        code={`services:
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
    image: ghcr.io/service-bridge/servicebridge:edge
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "14444:14444"
      - "14445:14445"
    networks:
      - servicebridge-internal
      - servicebridge-external
    volumes:
      - servicebridge-tls:/etc/servicebridge/tls
    environment:
      SERVICEBRIDGE_ADMIN_LOGIN: \${SERVICEBRIDGE_ADMIN_LOGIN}
      SERVICEBRIDGE_ADMIN_PASSWORD_HASH: \${SERVICEBRIDGE_ADMIN_PASSWORD_HASH}
      SERVICEBRIDGE_PUBLIC_ORIGIN: \${SERVICEBRIDGE_PUBLIC_ORIGIN}
      SERVICEBRIDGE_TLS_DIR: /etc/servicebridge/tls
      SERVICEBRIDGE_GRPC_HOST: "0.0.0.0"
      SERVICEBRIDGE_PG_URL: "postgres://postgres:postgres@postgres:5432/servicebridge"

networks:
  servicebridge-internal:
    driver: bridge
  servicebridge-external:
    driver: bridge

volumes:
  servicebridge-pg:
  servicebridge-tls:`}
      />

      <H3 id="start">Step 3 — Start</H3>
      <DocCodeBlock
        lang="bash"
        code={`SERVICEBRIDGE_ADMIN_LOGIN=admin \\
SERVICEBRIDGE_ADMIN_PASSWORD_HASH='$2a$10$...' \\
SERVICEBRIDGE_PUBLIC_ORIGIN=https://sb.example.com \\
docker compose up -d`}
      />
      <Callout type="info">
        If you prefer a <Mono>.env</Mono> file, create one with the three variables above and run{" "}
        <Mono>docker compose up -d</Mono> without the prefix.
      </Callout>

      <H2 id="config-reference">Configuration Reference</H2>
      <P>
        Required environment variables for the <Mono>servicebridge</Mono> container:
      </P>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_ADMIN_LOGIN",
            desc: "Admin username for the dashboard.",
          },
          {
            name: "SERVICEBRIDGE_ADMIN_PASSWORD_HASH",
            desc: "bcrypt hash of admin password — generate at servicebridge.dev/#hash-password.",
          },
          {
            name: "SERVICEBRIDGE_PG_URL",
            desc: "PostgreSQL connection string.",
          },
          {
            name: "SERVICEBRIDGE_PUBLIC_ORIGIN",
            desc: "Public URL(s) of the server. Comma-separated for multiple CORS origins. First is canonical. Must be https:// in production.",
          },
        ]}
      />

      <H2 id="system-endpoints">System Endpoints</H2>
      <P>
        All endpoints are on the HTTP port (default <Mono>14444</Mono>), no authentication required.
      </P>
      <EnvTable
        rows={[
          { name: "GET /health", desc: "Always returns 200 OK. Use for liveness probes." },
          {
            name: "GET /ready",
            desc: "Returns 200 OK when database is reachable, 503 otherwise. Use for readiness probes.",
          },
          { name: "GET /metrics", desc: "Prometheus-compatible metrics endpoint." },
        ]}
      />

      <Callout type="tip">
        Runtime is running?{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer font-medium"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "quick-start" }))
          }
        >
          Next: Quick Start →
        </button>{" "}
        Install an SDK and make your first RPC call in under 5 minutes.
      </Callout>
    </div>
  );
}
