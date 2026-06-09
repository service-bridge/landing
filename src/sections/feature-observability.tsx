import { BarChart2, Database, Eye, ScrollText } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const LOGGER_CODE = `import { ServiceBridge } from "servicebridge";

const sb = new ServiceBridge("localhost:14445", key);

sb.rpc.handle("placeOrder", async (req) => {
  // Structured log. Auto-tagged with instance_id and the
  // active trace + op id — no setup, no log shipper.
  sb.logger.info("order accepted", { orderId: req.id, total: req.total });

  const charge = await sb.rpc.call("payments", "charge", req);
  // Nested call inherits the same trace via the X-SB-Trace header.

  if (!charge.ok) {
    sb.logger.error("charge failed", { orderId: req.id, reason: charge.reason });
  }
  return { status: "success" };
});

await sb.start();`;

const TELEMETRY_GROUPS = [
  {
    label: "Ops",
    tone: "text-blue-400",
    items: ["RPC", "EVENT", "HTTP", "JOB", "WORKFLOW", "USER"],
  },
  {
    label: "Status",
    tone: "text-emerald-400",
    items: ["SUCCESS", "ERROR", "PENDING", "TIMEOUT", "ABANDONED"],
  },
  {
    label: "Logs",
    tone: "text-amber-400",
    items: ["debug", "info", "warn", "error"],
  },
  {
    label: "Metrics",
    tone: "text-fuchsia-400",
    items: ["counter", "gauge", "histogram"],
  },
  {
    label: "Process",
    tone: "text-cyan-400",
    items: ["process.cpu_percent", "process.rss_bytes"],
  },
  {
    label: "Trace",
    tone: "text-violet-400",
    items: ["X-SB-Trace", "traceId", "parentOpId"],
  },
] as const;

const TELEMETRY_API = [
  { call: "sb.logger.info(msg, fields)", desc: "Structured log, trace-tagged" },
  { call: "sb.telemetry.counter(name)", desc: "Counter metric" },
  { call: "sb.telemetry.histogram(name)", desc: "Latency / size distribution" },
  { call: "sb.telemetry.startOp(params)", desc: "One row per logical operation" },
];

export function ObservabilitySection() {
  return (
    <FeatureSection
      id="observability"
      eyebrow="Metrics & Logs"
      title={<>Telemetry is built in. No extra infrastructure.</>}
      subtitle="Every SDK call emits structured logs, metrics, and operation traces over the gRPC control plane into PostgreSQL — explored in the built-in console at :14444. No exporters, no sidecars, no separate time-series DB."
      content={
        <div className="space-y-4">
          <CodePanel title="structured logging">
            <div className="px-4 py-3 flex items-center justify-between border-b border-surface-border bg-code-chrome">
              <p className="type-overline-mono text-muted-foreground">order-service.ts</p>
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                trace-tagged
              </Badge>
            </div>
            <div className="p-4">
              <CodeBlock code={LOGGER_CODE} filename="order-service.ts" />
            </div>
          </CodePanel>

          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="type-overline-mono text-muted-foreground">telemetry api</p>
                <p className="mt-2 type-subsection-title">One logger, one metrics surface.</p>
              </div>
              <Badge tone="border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300">sb.telemetry</Badge>
            </div>
            <div className="space-y-1.5">
              {TELEMETRY_API.map((ex) => (
                <div
                  key={ex.call}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-code px-3 py-2"
                >
                  <code className="type-body-sm text-cyan-300 shrink-0">{ex.call}</code>
                  <span className="type-overline-mono text-muted-foreground/70 min-w-0 truncate">
                    {ex.desc}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      }
      demo={
        <div className="space-y-4">
          <CodePanel title="telemetry primitives">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border bg-code-chrome">
              <p className="type-overline-mono text-muted-foreground">Telemetry.Report stream</p>
              <div className="flex items-center gap-2">
                <Badge tone="border-orange-500/20 bg-orange-500/[0.08] text-orange-300">
                  gRPC :14445
                </Badge>
                <Badge tone="border-surface-border bg-surface text-muted-foreground">
                  at-least-once
                </Badge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {TELEMETRY_GROUPS.map((group) => (
                <div key={group.label} className="flex items-start gap-3">
                  <p className={cn("type-overline-mono w-20 shrink-0 pt-0.5", group.tone)}>
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 min-w-0">
                    {group.items.map((m) => (
                      <code key={m} className="type-overline-mono text-muted-foreground">
                        {m}
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
                  Ops, logs, and metrics persist in PostgreSQL 18+ and stream live to the built-in
                  console over Server-Sent Events.
                </p>
              </div>
            </div>
          </Card>
        </div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={BarChart2}
            title="Ops, logs & metrics"
            description="One unified primitive per channel: RPC, events, jobs, workflows, HTTP — counters, gauges, and histograms included."
            iconClassName="text-orange-400"
          />
          <FeatureCard
            variant="compact"
            icon={ScrollText}
            title="Structured logging"
            description="sb.logger.info / warn / error with typed fields. Auto-tagged with instance, trace, and op id. No log shipper."
            iconClassName="text-cyan-400"
          />
          <FeatureCard
            variant="compact"
            icon={Eye}
            title="Automatic trace propagation"
            description="Nested rpc.call, event.publish, and workflow.start inherit the parent trace via the X-SB-Trace header — logs correlate by default."
            iconClassName="text-violet-400"
          />
          <FeatureCard
            variant="compact"
            icon={Database}
            title="One data store"
            description="Ops, logs, and metrics all in PostgreSQL. Standard backups, no separate time-series DB."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
