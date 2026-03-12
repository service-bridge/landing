import { BarChart2, Database, Eye, ScrollText } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

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
  { label: "RPC", tone: "text-blue-400", metrics: ["rpc_calls_total", "rpc_duration_p95_ms", "rpc_duration_p99_ms", "rpc_error_rate"] },
  { label: "Events", tone: "text-emerald-400", metrics: ["queue_messages_total", "deliveries_total", "dlq_depth", "delivery_duration_p99_ms"] },
  { label: "Jobs", tone: "text-amber-400", metrics: ["jobs_registered", "job_executions_total", "job_duration_p99_ms"] },
  { label: "Workflows", tone: "text-fuchsia-400", metrics: ["workflow_runs_total", "workflow_duration_p99_ms"] },
  { label: "Resources", tone: "text-cyan-400", metrics: ["cpu_percent", "ram_mb", "db_size_mb", "active_sessions"] },
  { label: "Traces", tone: "text-violet-400", metrics: ["traces_total", "trace_error_rate", "traces_24h"] },
] as const;

const LOGQL_EXAMPLES = [
  { query: '{service="orders"}', desc: "All logs from orders service" },
  { query: '{level="ERROR"}', desc: "Errors across all services" },
  { query: '{service=~"order.*", level!="DEBUG"}', desc: "Filtered by regex + level" },
  { query: '{trace_id="a1b2c3d4e5f6"}', desc: "All logs for a specific trace" },
];

export function ObservabilitySection() {
  return (
    <FeatureSection
      id="observability"
      eyebrow="Metrics & Logs"
      title={<>Grafana connects. No extra infrastructure.</>}
      subtitle="ServiceBridge exposes a Prometheus-compatible /metrics endpoint and a Loki-compatible log API — point Grafana directly at the same host, no Prometheus operator or Loki cluster needed."
      content={
        <div className="space-y-4">
          <CodePanel title="grafana datasource config">
            <div className="px-4 py-3 flex items-center justify-between border-b border-surface-border bg-code-chrome">
              <p className="type-overline-mono text-muted-foreground">datasources.yaml</p>
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">zero extra services</Badge>
            </div>
            <div className="p-4">
              <CodeBlock code={GRAFANA_CODE} filename="datasources.yaml" />
            </div>
          </CodePanel>

          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="type-overline-mono text-muted-foreground">loki-compatible api</p>
                <p className="mt-2 type-subsection-title">LogQL queries, zero Loki infra.</p>
              </div>
              <Badge tone="border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300">Loki API</Badge>
            </div>
            <div className="space-y-1.5">
              {LOGQL_EXAMPLES.map((ex) => (
                <div key={ex.query} className="flex items-center gap-3 rounded-xl border border-surface-border bg-code px-3 py-2">
                  <code className="type-body-sm text-cyan-300 shrink-0">{ex.query}</code>
                  <span className="type-overline-mono text-muted-foreground/70 min-w-0 truncate">{ex.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      }
      demo={
        <div className="space-y-4">
          <CodePanel title="prometheus metrics · 30+ families">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border bg-code-chrome">
              <p className="type-overline-mono text-muted-foreground">GET /metrics</p>
              <div className="flex items-center gap-2">
                <Badge tone="border-orange-500/20 bg-orange-500/[0.08] text-orange-300">GET /metrics</Badge>
                <Badge tone="border-surface-border bg-surface text-muted-foreground">15s cache</Badge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {METRIC_GROUPS.map((group) => (
                <div key={group.label} className="flex items-start gap-3">
                  <p className={cn("type-overline-mono w-20 shrink-0 pt-0.5", group.tone)}>{group.label}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 min-w-0">
                    {group.metrics.map((m) => (
                      <code key={m} className="type-overline-mono text-muted-foreground">
                        servicebridge_{m}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CodePanel>

          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2 shrink-0">
                <Database className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="type-subsection-title">PostgreSQL-backed</p>
                <p className="type-body-sm text-muted-foreground mt-0.5">
                  Metrics computed on each scrape (15s cache). Logs stored with 3-day default retention.
                </p>
              </div>
            </div>
          </Card>
        </div>
      }
      cards={
        <>
          <FeatureCard variant="compact" icon={BarChart2} title="30+ metric families" description="RPC, events, jobs, workflows, traces, resources, logs — all in one /metrics endpoint." iconClassName="text-orange-400" />
          <FeatureCard variant="compact" icon={ScrollText} title="Native log collection" description="SDK patches console.log / log / slog automatically. No Promtail, no FluentBit, no log shipper." iconClassName="text-cyan-400" />
          <FeatureCard variant="compact" icon={Eye} title="Trace+log correlation" description="Logs carry trace_id and span_id. Expand any span in the waterfall to see correlated log lines." iconClassName="text-violet-400" />
          <FeatureCard variant="compact" icon={Database} title="One data store" description="Metrics, logs, and traces all in PostgreSQL. Standard backups, no separate time-series DB." iconClassName="text-emerald-400" />
        </>
      }
    />
  );
}
