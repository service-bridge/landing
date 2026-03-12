export const FEATURE_MENU_ITEMS = [
  {
    label: "Direct RPC",
    href: "#direct-rpc",
    desc: "zero-hop gRPC, mTLS, round-robin",
  },
  {
    label: "HTTP Middleware",
    href: "#http",
    desc: "Express, Fastify, Gin, FastAPI auto-trace",
  },
  {
    label: "Durable Events",
    href: "#durable-events",
    desc: "fan-out, retries, DLQ, replay",
  },
  {
    label: "Realtime Streams",
    href: "#streams",
    desc: "live chunks with replay",
  },
  {
    label: "Workflows",
    href: "#workflows",
    desc: "parallel DAG, conditions, sleep, event wait",
  },
  {
    label: "Jobs",
    href: "#jobs",
    desc: "cron, delayed, workflow-triggered",
  },
  {
    label: "Discovery + Maps",
    href: "#service-discovery",
    desc: "O(1) lookup, service map, connections",
  },
  {
    label: "Unified Tracing",
    href: "#tracing",
    desc: "waterfall per request, retries, fan-out",
  },
  {
    label: "Metrics & Logs",
    href: "#observability",
    desc: "Prometheus /metrics, Loki-compatible API",
  },
  {
    label: "Smart Alerts",
    href: "#alerts",
    desc: "telegram, webhook, in-app",
  },
] as const;
