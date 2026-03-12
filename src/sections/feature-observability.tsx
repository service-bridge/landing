import { BarChart2, Database, Eye, ScrollText } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";

const GRAFANA_CODE = `# Grafana datasource — point at ServiceBridge directly
# No Prometheus operator, no Loki cluster, no Promtail

datasources:
  - name: ServiceBridge Metrics
    type: prometheus
    url: http://servicebridge:14444

  - name: ServiceBridge Logs
    type: loki
    url: http://servicebridge:14444
    # LogQL queries work out of the box:
    # {service="orders"}
    # {level="ERROR", service=~"order.*"}
    # {trace_id="a1b2c3d4"}`;

const METRIC_GROUPS = [
  {
    label: "RPC",
    tone: "text-blue-400",
    bg: "bg-blue-500/[0.07]",
    border: "border-blue-500/20",
    metrics: [
      "servicebridge_rpc_calls_total",
      "servicebridge_rpc_duration_p95_ms",
      "servicebridge_rpc_duration_p99_ms",
      "servicebridge_rpc_error_rate",
    ],
  },
  {
    label: "Events",
    tone: "text-emerald-400",
    bg: "bg-emerald-500/[0.07]",
    border: "border-emerald-500/20",
    metrics: [
      "servicebridge_queue_messages_total",
      "servicebridge_deliveries_total",
      "servicebridge_dlq_depth",
      "servicebridge_delivery_duration_p99_ms",
    ],
  },
  {
    label: "Jobs",
    tone: "text-amber-400",
    bg: "bg-amber-500/[0.07]",
    border: "border-amber-500/20",
    metrics: [
      "servicebridge_jobs_registered",
      "servicebridge_job_executions_total",
      "servicebridge_job_duration_p99_ms",
    ],
  },
  {
    label: "Workflows",
    tone: "text-fuchsia-400",
    bg: "bg-fuchsia-500/[0.07]",
    border: "border-fuchsia-500/20",
    metrics: [
      "servicebridge_workflows_registered",
      "servicebridge_workflow_runs_total",
      "servicebridge_workflow_duration_p99_ms",
    ],
  },
  {
    label: "Resources",
    tone: "text-cyan-400",
    bg: "bg-cyan-500/[0.07]",
    border: "border-cyan-500/20",
    metrics: [
      "servicebridge_cpu_percent",
      "servicebridge_ram_mb",
      "servicebridge_db_size_mb",
      "servicebridge_active_sessions",
    ],
  },
  {
    label: "Traces",
    tone: "text-violet-400",
    bg: "bg-violet-500/[0.07]",
    border: "border-violet-500/20",
    metrics: [
      "servicebridge_traces_total",
      "servicebridge_trace_error_rate",
      "servicebridge_traces_24h",
    ],
  },
] as const;

const LOGQL_EXAMPLES = [
  { query: '{service="orders"}', desc: "All logs from orders service" },
  { query: '{level="ERROR"}', desc: "Errors across all services" },
  { query: '{service=~"order.*", level!="DEBUG"}', desc: "Filtered by regex + level" },
  { query: '{trace_id="a1b2c3d4e5f6"}', desc: "All logs for a specific trace" },
];

export function ObservabilitySection() {
  const content = (
    <div className="space-y-6">
      {/* Prometheus metrics panel */}
      <CodePanel title="prometheus metrics">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="type-overline-mono text-muted-foreground">prometheus metrics</p>
              <p className="mt-2 type-body-sm text-zinc-300">
                30+ metric families across all primitives.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge tone="border-orange-500/20 bg-orange-500/[0.08] text-orange-300">
                GET /metrics
              </Badge>
              <Badge tone="border-surface-border bg-surface text-zinc-400">
                15s cache
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {METRIC_GROUPS.map((group) => (
              <Card key={group.label}>
                <div className={cn("rounded-xl border p-4", group.bg, group.border)}>
                  <p className={cn("type-overline-mono mb-2.5", group.tone)}>{group.label}</p>
                  <div className="space-y-1">
                    {group.metrics.map((m) => (
                      <div
                        key={m}
                        className="flex items-center gap-2 rounded-xl bg-black/20 px-2.5 py-1.5"
                      >
                        <span className={cn("w-1 h-1 rounded-full shrink-0", group.bg)} />
                        <code className="type-overline-mono text-zinc-300">{m}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 p-3 bg-code-chrome rounded-xl">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="type-overline-mono text-zinc-500">
                All metrics labeled by{" "}
                <span className="text-zinc-300">service</span>,{" "}
                <span className="text-zinc-300">operation</span>,{" "}
                <span className="text-zinc-300">status</span>
              </span>
            </div>
            <div className="ml-auto">
              <Badge tone="border-surface-border bg-surface text-zinc-500">
                HTTP 503 when DB unavailable
              </Badge>
            </div>
          </div>
        </div>
      </CodePanel>

      {/* Loki API */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-overline-mono text-muted-foreground">loki-compatible api</p>
            <h3 className="mt-2 type-subsection-title">
              LogQL queries, zero Loki infra.
            </h3>
            <p className="mt-2 type-body text-muted-foreground">
              Add ServiceBridge as a Loki datasource in Grafana. Query by service, level,
              trace ID, or span ID. Results come from PostgreSQL — no Promtail, no agent.
            </p>
          </div>
          <Badge tone="border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300">
            Loki API
          </Badge>
        </div>

        {/* LogQL examples */}
        <div className="mt-5 rounded-2xl border border-surface-border bg-code p-4">
          <p className="type-overline-mono text-muted-foreground mb-3">supported logql matchers</p>
          <div className="space-y-2">
            {LOGQL_EXAMPLES.map((ex) => (
              <div
                key={ex.query}
                className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2"
              >
                <code className="type-body-sm text-cyan-300 shrink-0">{ex.query}</code>
                <span className="type-overline-mono text-zinc-500 min-w-0 truncate">{ex.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-surface-border bg-surface p-3">
            <p className="type-overline-mono text-muted-foreground">labels</p>
            <p className="type-body-sm text-cyan-300 mt-1">service · level · trace_id</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface p-3">
            <p className="type-overline-mono text-muted-foreground">direction</p>
            <p className="type-body-sm text-blue-300 mt-1">forward / backward</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface p-3">
            <p className="type-overline-mono text-muted-foreground">limit</p>
            <p className="type-body-sm text-emerald-300 mt-1">up to 5000 lines</p>
          </div>
        </div>
      </Card>

      {/* Grafana config */}
      <CodePanel title="grafana datasource config">
        <div className="px-4 py-3 flex items-center justify-between border-b border-surface-border bg-code-chrome">
          <p className="type-overline-mono text-muted-foreground">datasources.yaml</p>
          <Badge tone="border-primary/20 bg-primary/[0.08] text-primary">
            zero extra services
          </Badge>
        </div>
        <div className="p-4">
          <CodeBlock code={GRAFANA_CODE} filename="datasources.yaml" />
        </div>
      </CodePanel>

      {/* Storage note */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-violet-500/10 p-2.5 shrink-0">
            <Database className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="type-subsection-title">PostgreSQL-backed</p>
            <p className="type-body-sm text-muted-foreground mt-0.5">
              Metrics computed from live data on each scrape (15s cache). Logs stored in{" "}
              <code className="text-foreground/70">log_entries</code> with 3-day default
              retention.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const miniCards = (
    <>
      <MiniCard
        icon={BarChart2}
        title="30+ metric families"
        desc="RPC, events, jobs, workflows, traces, resources, logs, and security — all in one /metrics endpoint."
        iconClassName="text-orange-400"
      />
      <MiniCard
        icon={ScrollText}
        title="Native log collection"
        desc="SDK patches console.log / log / slog automatically. No Promtail, no FluentBit, no log shipper."
        iconClassName="text-cyan-400"
      />
      <MiniCard
        icon={Eye}
        title="Trace+log correlation"
        desc="Logs carry trace_id and span_id. Expand any span in the waterfall to see correlated log lines."
        iconClassName="text-violet-400"
      />
      <MiniCard
        icon={Database}
        title="One data store"
        desc="Metrics, logs, and traces all in PostgreSQL. Standard backups, no separate time-series DB."
        iconClassName="text-primary"
      />
    </>
  );

  return (
    <FeatureSection
      id="observability"
      eyebrow="Metrics & Logs"
      title={
        <>
          Grafana connects.{" "}
          <span className="text-gradient">No extra infrastructure.</span>
        </>
      }
      subtitle="ServiceBridge exposes a Prometheus-compatible /metrics endpoint and a Loki-compatible log API — point Grafana directly at the same host, no Prometheus operator or Loki cluster needed."
      content={content}
      demo={<></>}
      cards={miniCards}
    />
  );
}
