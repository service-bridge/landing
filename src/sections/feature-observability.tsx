import { ArrowRight, BarChart2, Database, Eye, ScrollText } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import { highlightCode } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { CopyButton } from "../ui/CopyButton";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const LOGGER_CODE = `import { ServiceBridge } from "service-bridge";

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
    accent: false,
    items: ["RPC", "EVENT", "HTTP", "JOB", "WORKFLOW", "USER"],
  },
  {
    label: "Status",
    accent: true,
    items: ["SUCCESS", "ERROR", "PENDING", "TIMEOUT", "ABANDONED"],
  },
  {
    label: "Logs",
    accent: false,
    items: ["debug", "info", "warn", "error"],
  },
  {
    label: "Metrics",
    accent: false,
    items: ["counter", "gauge", "histogram"],
  },
  {
    label: "Process",
    accent: false,
    items: ["process.cpu_percent", "process.rss_bytes"],
  },
  {
    label: "Trace",
    accent: false,
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
      title={<>Drop Prometheus, Loki, and Jaeger. Telemetry ships with the runtime.</>}
      subtitle="Every SDK call emits logs, metrics, and traces into PostgreSQL — explored in the built-in console at :14444. No exporters, no sidecars, no time-series DB."
      content={
        <div className="space-y-4">
          <CodePanel
            title="order-service.ts"
            headerActions={
              <div className="flex items-center gap-2">
                <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                  trace-tagged
                </Badge>
                <CopyButton text={LOGGER_CODE} />
              </div>
            }
          >
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">
              <code>{highlightCode(LOGGER_CODE.trim(), "ts")}</code>
            </pre>
          </CodePanel>

          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="type-overline-mono text-muted-foreground">telemetry api</p>
                <p className="mt-2 type-subsection-title">One logger, one metrics surface.</p>
              </div>
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                sb.telemetry
              </Badge>
            </div>
            <div className="space-y-1.5">
              {TELEMETRY_API.map((ex) => (
                <div
                  key={ex.call}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-code px-3 py-2"
                >
                  <code className="type-body-sm text-emerald-300 shrink-0">{ex.call}</code>
                  <span className="type-overline-mono text-muted-foreground/70 min-w-0 truncate">
                    {ex.desc}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Button asChild variant="link" size="sm" className="h-auto px-0 text-emerald-300">
            <a href="#docs">
              Read the observability docs
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      }
      demo={
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2 shrink-0">
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="type-subsection-title">PostgreSQL-backed</p>
                <p className="type-body-sm text-muted-foreground mt-0.5">
                  Persisted in PostgreSQL 18+, streamed live to the console over SSE.
                </p>
              </div>
            </div>
          </Card>

          <CodePanel
            title="Telemetry.Report stream"
            headerActions={
              <div className="flex items-center gap-2">
                <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                  gRPC :14445
                </Badge>
                <Badge tone="border-surface-border bg-surface text-muted-foreground">
                  at-least-once
                </Badge>
              </div>
            }
          >
            <div className="p-4 space-y-3">
              {TELEMETRY_GROUPS.map((group) => (
                <div key={group.label} className="flex items-start gap-3">
                  <p
                    className={cn(
                      "type-overline-mono w-20 shrink-0 pt-0.5",
                      group.accent ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 min-w-0">
                    {group.items.map((m) => (
                      <code key={m} className="type-overline-mono text-muted-foreground/70">
                        {m}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CodePanel>
        </div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={BarChart2}
            title="Ops, logs & metrics"
            description="One primitive per channel — RPC, events, jobs, workflows, HTTP. Counters, gauges, histograms included."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={ScrollText}
            title="Structured logging"
            description="sb.logger.info / warn / error with typed fields. Auto-tagged with instance, trace, op id. No log shipper."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Eye}
            title="Automatic trace propagation"
            description="Nested rpc.call, event.publish, workflow.start inherit the trace via X-SB-Trace. Logs correlate by default."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Database}
            title="One data store"
            description="Ops, logs, metrics — all in PostgreSQL. Standard backups, no time-series DB."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
