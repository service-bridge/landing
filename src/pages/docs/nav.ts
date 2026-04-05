export type TocItem = { id: string; label: string };
export type NavItem = { id: string; label: string; toc: TocItem[] };
export type NavGroup = { group: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    group: "Getting Started",
    items: [
      {
        id: "installation",
        label: "Installation",
        toc: [
          { id: "option-1", label: "One-line installer" },
          { id: "option-2", label: "Docker Compose manually" },
          { id: "manage", label: "Manage after install" },
        ],
      },
      {
        id: "quick-start",
        label: "Quick Start",
        toc: [
          { id: "install-sdk", label: "Install SDK" },
          { id: "create-worker", label: "Create a worker" },
          { id: "call-rpc", label: "Call it from another service" },
        ],
      },
      {
        id: "end-to-end",
        label: "End-to-End Example",
        toc: [
          { id: "payments-worker", label: "Payments worker" },
          { id: "orders-caller", label: "Orders caller" },
          { id: "notifications", label: "Notifications consumer" },
          { id: "workflow", label: "Orchestrate as workflow" },
        ],
      },
    ],
  },
  {
    group: "SDK Reference",
    items: [
      {
        id: "rpc",
        label: "RPC",
        toc: [
          { id: "rpc-call", label: "rpc()" },
          { id: "rpc-opts", label: "Options" },
          { id: "rpc-errors", label: "Error handling" },
          { id: "handle-rpc", label: "handleRpc()" },
          { id: "handle-opts", label: "Handler options" },
          { id: "handle-streaming", label: "Streaming responses" },
          { id: "handle-acl", label: "Access control" },
          { id: "protobuf-schema", label: "Protobuf schema" },
          { id: "schema-handler", label: "Schema: Handler" },
          { id: "schema-caller", label: "Schema: Caller" },
          { id: "rpc-context", label: "RpcContext" },
        ],
      },
      {
        id: "events",
        label: "Events",
        toc: [
          { id: "event-publish", label: "event()" },
          { id: "event-opts", label: "Options" },
          { id: "handle-event", label: "handleEvent()" },
          { id: "handle-event-ctx", label: "EventContext" },
          { id: "handle-event-retry", label: "Retry & reject" },
          { id: "retry-policy", label: "Retry policy" },
          { id: "handle-event-filter", label: "Server-side filter" },
          { id: "wildcard-depth", label: "Wildcard depth" },
        ],
      },
      {
        id: "jobs",
        label: "Jobs & Scheduling",
        toc: [
          { id: "handler-side", label: "Handler side" },
          { id: "job-schedule", label: "job()" },
          { id: "schedule-opts", label: "ScheduleOpts" },
          { id: "job-cron", label: "Cron job" },
          { id: "job-delay", label: "One-shot delay" },
          { id: "job-event", label: "Trigger via event" },
          { id: "job-workflow", label: "Trigger workflow" },
          { id: "job-retry", label: "Retry policy" },
          { id: "job-manage", label: "Manage jobs" },
        ],
      },
      {
        id: "workflows",
        label: "Workflows",
        toc: [
          { id: "concept", label: "How it works" },
          { id: "handlers", label: "Define handlers" },
          { id: "workflow-start", label: "workflow()" },
          { id: "step-fields", label: "Step fields" },
          { id: "output-chaining", label: "Output chaining" },
          { id: "workflow-example", label: "Example" },
          { id: "parallel-steps", label: "Parallel steps" },
          { id: "event-wait", label: "event_wait" },
          { id: "conditional-if", label: "Conditional steps" },
          { id: "child-workflow", label: "Child workflows" },
          { id: "sleep-step", label: "Durable sleep" },
          { id: "run-workflow", label: "executeWorkflow()" },
          { id: "cancel", label: "Cancel a trace" },
        ],
      },
      {
        id: "streaming",
        label: "Streaming",
        toc: [
          { id: "how-it-works", label: "How it works" },
          { id: "get-trace-id", label: "Getting a traceId" },
          { id: "write-chunks", label: "Writing chunks" },
          { id: "watch-trace", label: "watchTrace()" },
          { id: "llm-streaming", label: "LLM tokens" },
          { id: "sse-endpoint", label: "SSE endpoint" },
          { id: "progress", label: "Progress bars" },
          { id: "event-shape", label: "TraceStreamEvent" },
          { id: "replay", label: "Replay" },
        ],
      },
      {
        id: "serve",
        label: "Startup & Shutdown",
        toc: [
          { id: "lifecycle", label: "Worker lifecycle" },
          { id: "outgoing-deps", label: "Outgoing dependencies" },
          { id: "start-sig", label: "start()" },
          { id: "start-opts", label: "StartOpts" },
          { id: "instance-weight", label: "instanceId & weight" },
          { id: "tls-behavior", label: "TLS / mTLS" },
          { id: "graceful-shutdown", label: "Graceful shutdown" },
          { id: "stop-sig", label: "stop()" },
        ],
      },
    ],
  },
  {
    group: "HTTP Integration",
    items: [
      {
        id: "http-middleware",
        label: "Middleware",
        toc: [
          { id: "what-it-does", label: "What it does" },
          { id: "express", label: "Express" },
          { id: "fastify", label: "Fastify" },
          { id: "fastapi", label: "FastAPI" },
          { id: "flask", label: "Flask" },
          { id: "chi", label: "Chi" },
          { id: "gin", label: "Gin" },
          { id: "echo", label: "Echo" },
          { id: "nethttp", label: "net/http" },
        ],
      },
      {
        id: "manual-spans",
        label: "Manual Spans",
        toc: [
          { id: "start-span", label: "startHttpSpan()" },
          { id: "register-endpoint", label: "registerHttpEndpoint()" },
        ],
      },
    ],
  },
  {
    group: "Observability",
    items: [
      {
        id: "tracing",
        label: "Distributed Tracing",
        toc: [
          { id: "auto-tracing", label: "Automatic traces" },
          { id: "span-table", label: "Span types" },
          { id: "inline-logs", label: "Inline logs" },
          { id: "trace-id-header", label: "x-trace-id header" },
          { id: "trace-context", label: "Trace context" },
          { id: "grafana", label: "Grafana / Loki" },
          { id: "otlp", label: "OTLP ingest" },
        ],
      },
      {
        id: "metrics-logs",
        label: "Metrics & Logs",
        toc: [
          { id: "metrics", label: "Prometheus metrics" },
          { id: "logs", label: "Log capture" },
        ],
      },
    ],
  },
  {
    group: "Configuration",
    items: [
      {
        id: "sdk-options",
        label: "SDK Options",
        toc: [
          { id: "constructor", label: "Constructor" },
          { id: "options-table", label: "All options" },
        ],
      },
      {
        id: "server-config",
        label: "Server Variables",
        toc: [
          { id: "required", label: "Required" },
          { id: "retention", label: "Retention & storage" },
          { id: "network", label: "Network & ports" },
          { id: "auth", label: "Auth & session" },
          { id: "advanced", label: "Advanced" },
          { id: "endpoints", label: "System endpoints" },
        ],
      },
    ],
  },
  {
    group: "Production",
    items: [
      {
        id: "service-keys",
        label: "Service Keys & RBAC",
        toc: [
          { id: "capabilities", label: "Capabilities" },
          { id: "policy", label: "Granular policy" },
          { id: "key-example", label: "Example" },
        ],
      },
      {
        id: "tls-mtls",
        label: "TLS / mTLS",
        toc: [
          { id: "tls-auto", label: "Auto-generated certs" },
          { id: "tls-provision", label: "SDK gRPC provisioning" },
          { id: "tls-arch", label: "Architecture" },
        ],
      },
      {
        id: "reliability",
        label: "Reliability Semantics",
        toc: [
          { id: "guarantees", label: "Delivery guarantees" },
          { id: "outage", label: "On server outage" },
        ],
      },
      {
        id: "offline-queue",
        label: "Offline Queue",
        toc: [
          { id: "behavior", label: "How it works" },
          { id: "config", label: "Configuration" },
        ],
      },
      {
        id: "filter-expr",
        label: "Filter Expressions",
        toc: [
          { id: "syntax", label: "DSL syntax" },
          { id: "operators", label: "Operators" },
        ],
      },
      {
        id: "dlq-replay",
        label: "DLQ & Replay",
        toc: [
          { id: "via-ui", label: "Via dashboard" },
          { id: "notes", label: "Notes" },
        ],
      },
    ],
  },
  {
    group: "Transport & Resilience",
    items: [
      {
        id: "session-lifecycle",
        label: "Session Lifecycle",
        toc: [
          { id: "states", label: "States" },
          { id: "epoch-fencing", label: "Epoch Fencing" },
          { id: "suspended-recovery", label: "Suspended Recovery" },
          { id: "drain-path", label: "Drain Path" },
        ],
      },
      {
        id: "transport-modes",
        label: "Transport Modes",
        toc: [
          { id: "direct-mode", label: "Direct Mode" },
          { id: "proxy-mode", label: "Proxy Mode" },
          { id: "config-hierarchy", label: "Config Hierarchy" },
          { id: "circuit-breakers", label: "Circuit Breakers" },
          { id: "zone-aware", label: "Zone-Aware LB" },
        ],
      },
      {
        id: "reconnect-resume",
        label: "Reconnect & Resume",
        toc: [
          { id: "resume-protocol", label: "Resume Protocol" },
          { id: "backoff", label: "Backoff Strategy" },
          { id: "position-update", label: "PositionUpdate" },
        ],
      },
      {
        id: "config-push",
        label: "ConfigPush",
        toc: [
          { id: "what-is-configpush", label: "What is ConfigPush" },
          { id: "what-can-be-pushed", label: "What Can Be Pushed" },
          { id: "config-example", label: "Example" },
          { id: "apply-order", label: "Apply Order" },
        ],
      },
      {
        id: "zone-aware",
        label: "Zone-Aware Routing",
        toc: [
          { id: "how-it-works", label: "How It Works" },
          { id: "configuration", label: "Configuration" },
          { id: "fallback", label: "Fallback" },
          { id: "multi-runtime", label: "Multi-Runtime" },
        ],
      },
    ],
  },
  {
    group: "Alerts",
    items: [
      {
        id: "alerts-overview",
        label: "Overview",
        toc: [
          { id: "how-it-works", label: "How it works" },
          { id: "stats", label: "At a glance" },
        ],
      },
      {
        id: "alerts-rules",
        label: "Alert Rules",
        toc: [
          { id: "condition-types", label: "Condition types" },
          { id: "rule-settings", label: "Rule settings" },
        ],
      },
      {
        id: "alerts-channels",
        label: "Notification Channels",
        toc: [
          { id: "channel-types", label: "Channel types" },
          { id: "webhook-payload", label: "Webhook payload" },
        ],
      },
      {
        id: "alerts-telegram",
        label: "Telegram Binding",
        toc: [{ id: "steps", label: "Binding steps" }],
      },
    ],
  },
];
