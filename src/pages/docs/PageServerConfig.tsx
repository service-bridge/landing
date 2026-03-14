import { Callout, EnvTable, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageServerConfig() {
  return (
    <div>
      <PageHeader
        badge="Configuration"
        title="Server Variables"
        description="All environment variables accepted by the ServiceBridge runtime container. Set them in docker-compose.yml, a .env file, or your orchestrator's secret manager."
      />

      <H2 id="required">Required</H2>
      <EnvTable
        rows={[
          { name: "SERVICEBRIDGE_ADMIN_LOGIN", desc: "Admin username for the dashboard." },
          {
            name: "SERVICEBRIDGE_ADMIN_PASSWORD_HASH",
            desc: "bcrypt hash of admin password. Generate at servicebridge.dev/#hash-password.",
          },
          { name: "SERVICEBRIDGE_PG_URL", desc: "PostgreSQL connection string." },
          {
            name: "SERVICEBRIDGE_PUBLIC_ORIGIN",
            desc: "Public URL(s) of the server. Comma-separated for multiple CORS origins. First is canonical. Must be https:// in production.",
          },
        ]}
      />

      <H2 id="retention">Retention & Storage</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_RETENTION_DAYS",
            default: "3",
            desc: "Delete runs and traces older than N days. Set 0 to disable deletion.",
          },
          {
            name: "SERVICEBRIDGE_RETAIN_SUCCESS_RUNS",
            default: "true",
            desc: "Keep successful runs in history.",
          },
          {
            name: "SERVICEBRIDGE_RETAIN_ERROR_RUNS",
            default: "true",
            desc: "Keep failed runs in history.",
          },
          {
            name: "SERVICEBRIDGE_RETENTION_INTERVAL_MIN",
            default: "60",
            desc: "How often the cleanup worker runs (minutes).",
          },
          {
            name: "SERVICEBRIDGE_LOGS_ENABLED",
            default: "true",
            desc: "Enable log ingestion (Loki-compatible endpoint).",
          },
          {
            name: "SERVICEBRIDGE_LOGS_TTL_DAYS",
            default: "3",
            desc: "Delete logs older than N days.",
          },
        ]}
      />

      <H2 id="network">Network & Ports</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_HTTP_PORT",
            default: "14444",
            desc: "HTTP port for UI, REST API, WebSocket.",
          },
          {
            name: "SERVICEBRIDGE_GRPC_PORT",
            default: "14445",
            desc: "gRPC port for SDK control plane (TLS).",
          },
          {
            name: "SERVICEBRIDGE_GRPC_HOST",
            default: "0.0.0.0",
            desc: 'gRPC bind address. Use "0.0.0.0" in Docker to accept connections via port mapping.',
          },
          {
            name: "SERVICEBRIDGE_TLS_DIR",
            default: "./tls",
            desc: "Directory for auto-generated TLS certificates.",
          },
        ]}
      />

      <H2 id="auth">Auth & Session</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_ADMIN_SESSION_TTL_MS",
            default: "86400000",
            desc: "Admin session lifetime in ms. Default: 24 hours.",
          },
          {
            name: "SERVICEBRIDGE_ENV",
            default: "development",
            desc: 'Environment: "development" or "production". Production enforces HTTPS and blocks default credentials.',
          },
        ]}
      />

      <H2 id="advanced">Advanced</H2>
      <P>Rarely need to change these — the defaults are tuned for most workloads.</P>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_PG_POOL_MAX",
            default: "20",
            desc: "Max PostgreSQL connections in the pool.",
          },
          {
            name: "SERVICEBRIDGE_MAX_PENDING_DELIVERIES",
            default: "200000",
            desc: "Max events waiting for delivery before backpressure.",
          },
          {
            name: "SERVICEBRIDGE_HEARTBEAT_TTL_MS",
            default: "30000",
            desc: "A service is considered offline after this many ms without heartbeat.",
          },
          {
            name: "SERVICEBRIDGE_RPC_REQUEST_TIMEOUT_MS",
            default: "30000",
            desc: "Timeout for RPC calls forwarded to worker services.",
          },
          {
            name: "SERVICEBRIDGE_WORKER_SESSION_TTL_MS",
            default: "30000",
            desc: "TTL for reverse worker sessions before fencing stale sessions.",
          },
          {
            name: "SERVICEBRIDGE_WORKER_SESSION_DEFAULT_MAX_INFLIGHT",
            default: "128",
            desc: "Default in-flight command window per worker session.",
          },
          {
            name: "SERVICEBRIDGE_WORKER_COMMAND_CLAIM_LEASE_MS",
            default: "35000",
            desc: "Lease duration while a node owns a claimed worker command row.",
          },
          {
            name: "SERVICEBRIDGE_WORKER_COMMANDS_TTL_DAYS",
            default: "1",
            desc: "Retention for completed/failed worker command rows. 0 disables cleanup.",
          },
          {
            name: "SERVICEBRIDGE_DELIVERY_LEASE_MS",
            default: "45000",
            desc: "How long a delivery attempt is locked before retry.",
          },
          {
            name: "SERVICEBRIDGE_DISPATCH_CONCURRENCY",
            default: "100",
            desc: "Parallel delivery workers.",
          },
          {
            name: "SERVICEBRIDGE_WORKFLOW_CONCURRENCY",
            default: "50",
            desc: "Parallel workflow step workers.",
          },
          {
            name: "SERVICEBRIDGE_JOBS_CONCURRENCY",
            default: "50",
            desc: "Parallel cron job workers.",
          },
          {
            name: "SERVICEBRIDGE_RATE_LIMIT_RPS",
            default: "0",
            desc: "HTTP rate limit (requests/sec per IP). 0 = disabled.",
          },
        ]}
      />

      <H2 id="endpoints">System Endpoints</H2>
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
          { name: "GET /metrics", desc: "Prometheus-compatible metrics." },
        ]}
      />

      <Callout type="tip">
        In production, set <Mono>SERVICEBRIDGE_ENV=production</Mono> to enforce HTTPS-only access
        and block default admin credentials. The runtime will reject HTTP origins and refuse to
        start with an empty password hash.
      </Callout>
    </div>
  );
}
