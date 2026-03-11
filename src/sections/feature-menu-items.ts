export const FEATURE_MENU_ITEMS = [
  {
    label: "Direct RPC",
    href: "#direct-rpc",
    desc: "zero-hop gRPC path",
  },
  {
    label: "Durable Events",
    href: "#durable-events",
    desc: "retries, DLQ, replay",
  },
  {
    label: "Realtime Streams",
    href: "#streams",
    desc: "live chunks with replay",
  },
  {
    label: "Workflows",
    href: "#workflows",
    desc: "multi-step saga runtime",
  },
  {
    label: "Jobs",
    href: "#jobs",
    desc: "cron and delayed runs",
  },
  {
    label: "Discovery + Maps",
    href: "#service-discovery",
    desc: "registry, topology, connections",
  },
  {
    label: "Unified Tracing",
    href: "#tracing",
    desc: "run waterfall per request",
  },
  {
    label: "Smart Alerts",
    href: "#alerts",
    desc: "telegram, webhook, in-app",
  },
] as const;
