import { motion, useInView } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Database,
  Filter,
  Fingerprint,
  GitBranch,
  Radio,
  RefreshCcw,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useRef } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const EVENT_CODE: CodeLangs = {
  ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "notifications");

// Consumer with server-side filter + retry policy
sb.handleEvent("order.*", async (payload, ctx) => {
  const ok = await sendEmail(payload);
  if (!ok) ctx.retry(30_000);  // reschedule after 30s
}, {
  groupName: "notify:email",
  filterExpr: "customer.tier!=free,amount>=1000",
  retryPolicyJson: JSON.stringify({
    maxAttempts: 5, baseDelayMs: 5_000,
    factor: 2, maxDelayMs: 60_000, jitter: 0.2,
  }),
});

// Publisher — durable, at-least-once per consumer group
await sb.event("order.created", {
  orderId: "ord_123", amount: 4990,
  customer: { tier: "premium" },
}, { idempotencyKey: "orders:ord_123:created" });`,

  go: `svc := servicebridge.New(
    "localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), "notifications", nil)

svc.HandleEvent("order.*",
    func(ctx context.Context, p json.RawMessage,
        ec *servicebridge.EventContext) error {
        ok := sendEmail(ctx, p)
        if !ok {
            ec.Retry(30_000); return nil
        }
        return nil
    }, &servicebridge.HandleEventOpts{
        GroupName:       "notify:email",
        FilterExpr:      "customer.tier!=free,amount>=1000",
        RetryPolicyJSON: \`{"maxAttempts":5,"baseDelayMs":5000,"factor":2}\`,
    })

svc.Event(ctx, "order.created", map[string]any{
    "orderId":  "ord_123",
    "amount":   4990,
    "customer": map[string]any{"tier": "premium"},
}, &servicebridge.EventOpts{IdempotencyKey: "orders:ord_123:created"})`,

  py: `from service_bridge import ServiceBridge

svc = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"], "notifications")

@svc.handle_event(
    "order.*",
    group_name="notify:email",
    filter_expr="customer.tier!=free,amount>=1000",
    retry_policy_json='{"maxAttempts":5,"baseDelayMs":5000,"factor":2}',
)
async def on_order(payload: dict, ctx) -> None:
    ok = await send_email(payload)
    if not ok:
        ctx.retry(30_000)

await svc.event(
    "order.created",
    {"orderId": "ord_123", "amount": 4990, "customer": {"tier": "premium"}},
    idempotency_key="orders:ord_123:created",
)`,
};

const PIPELINE = [
  { icon: Radio, label: "Publish", desc: "sb.event()", color: "text-blue-300", bg: "bg-blue-500/[0.08]", border: "border-blue-500/25", dot: "bg-blue-400" },
  { icon: Database, label: "Persist", desc: "PostgreSQL", color: "text-violet-300", bg: "bg-violet-500/[0.08]", border: "border-violet-500/25", dot: "bg-violet-400" },
  { icon: GitBranch, label: "Fan-out", desc: "×4 groups", color: "text-emerald-300", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  { icon: Send, label: "Deliver", desc: "per group", color: "text-amber-300", bg: "bg-amber-500/[0.08]", border: "border-amber-500/25", dot: "bg-amber-400" },
  { icon: CheckCircle2, label: "Outcome", desc: "ack · retry · dlq", color: "text-emerald-400", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/25", dot: "bg-emerald-400" },
] as const;

type Outcome = "ack" | "retry" | "dlq";

const SUBSCRIBERS: { service: string; group: string; outcome: Outcome; attempts: number; note: string | null }[] = [
  { service: "payments", group: "payments:charge", outcome: "ack", attempts: 1, note: null },
  { service: "notify", group: "notify:email", outcome: "ack", attempts: 3, note: "retry → delivered" },
  { service: "analytics", group: "analytics:track", outcome: "ack", attempts: 1, note: null },
  { service: "billing", group: "billing:invoice", outcome: "dlq", attempts: 5, note: "max attempts → DLQ" },
];

const OUTCOME_CFG: Record<Outcome, { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string }> = {
  ack: { icon: CheckCircle2, color: "text-emerald-300", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/20", label: "ack" },
  retry: { icon: RefreshCcw, color: "text-amber-300", bg: "bg-amber-500/[0.08]", border: "border-amber-500/20", label: "retry" },
  dlq: { icon: Ban, color: "text-rose-300", bg: "bg-rose-500/[0.08]", border: "border-rose-500/20", label: "dlq" },
};

const RETRY_LEDGER = [
  { text: "billing.invoice  ·  #1  connection timeout", stage: "error" as const },
  { text: "billing.invoice  ·  #2  backoff 5s", stage: "retry" as const },
  { text: "billing.invoice  ·  #3  backoff 10s", stage: "retry" as const },
  { text: "billing.invoice  ·  #4  backoff 20s", stage: "retry" as const },
  { text: "billing.invoice  ·  #5  max attempts  →  DLQ", stage: "dlq" as const },
];

const FILTER_EXAMPLES = [
  { expr: "status=paid", desc: "exact match" },
  { expr: "amount>=1000", desc: "numeric comparison" },
  { expr: "customer.tier!=free", desc: "dot-path inequality" },
  { expr: "status=active,region=eu", desc: "AND conditions" },
];

export function DurableEventsSection() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(pipelineRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="durable-events"
      eyebrow="Durable Events"
      title="Publish once. Fan-out to all groups. Retry safely."
      subtitle="At-least-once delivery with independent fan-out per consumer group, per-group retry ledger, server-side filtering before delivery, and DLQ with batch replay — zero extra broker."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">delivery contract</p>
            <h2 className="mt-2 type-subsection-title">At-least-once with server-side filtering.</h2>
            <p className="mt-3 type-body-sm">
              Each consumer group gets its own independent delivery ledger.{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">filterExpr</code>{" "}
              is evaluated before delivery rows are even created — unmatched events never
              reach workers, and never count against retry budgets.
            </p>
            <div className="mt-4 space-y-1.5">
              <p className="type-overline-mono text-muted-foreground mb-2">filterExpr syntax</p>
              {FILTER_EXAMPLES.map(({ expr, desc }) => (
                <div key={expr} className="flex items-center gap-3 rounded-xl border border-surface-border bg-code px-3 py-1.5">
                  <code className="text-xs font-mono text-emerald-300">{expr}</code>
                  <span className="text-3xs text-muted-foreground/60 ml-auto">{desc}</span>
                </div>
              ))}
            </div>
          </Card>
          <MultiCodeBlock
            code={EVENT_CODE}
            filename={{ ts: "notifications-service.ts", go: "notifications_service.go", py: "notifications_service.py" }}
          />
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title="delivery pipeline · order.created">
            <div className="absolute top-2.5 right-4">
              <Badge tone="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400">at-least-once</Badge>
            </div>

            <div ref={pipelineRef} className="p-5 space-y-5">
              {/* Pipeline stages */}
              <div className="overflow-x-auto">
                <p className="type-overline-mono text-muted-foreground mb-3">delivery stages</p>
                <div className="flex items-center gap-0 min-w-[420px]">
                  {PIPELINE.map((stage, i) => {
                    const Icon = stage.icon;
                    return (
                      <div key={stage.label} className="contents">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.35, delay: i * 0.12 }}
                          className={cn("rounded-xl border px-2.5 py-2 text-center shrink-0", stage.border, stage.bg)}
                          style={{ minWidth: 70 }}
                        >
                          <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", stage.color)} />
                          <p className={cn("text-xs font-semibold font-display leading-tight", stage.color)}>{stage.label}</p>
                          <p className="text-3xs text-muted-foreground/60 mt-0.5">{stage.desc}</p>
                        </motion.div>
                        {i < PIPELINE.length - 1 && (
                          <div className="flex-1 relative h-px bg-white/[0.06] min-w-[8px]">
                            {inView && (
                              <motion.span
                                className={cn("absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2", stage.dot)}
                                style={{ opacity: 0.8 }}
                                animate={{ left: ["-3%", "103%"] }}
                                transition={{ duration: 1.2, ease: "linear", repeat: Infinity, delay: i * 0.28 }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Consumer groups */}
              <div>
                <p className="type-overline-mono text-muted-foreground mb-3">consumer groups · independent delivery</p>
                <div className="space-y-1.5">
                  {SUBSCRIBERS.map((sub, i) => {
                    const outCfg = OUTCOME_CFG[sub.outcome];
                    const OutIcon = outCfg.icon;
                    const isDlq = sub.outcome === "dlq";
                    return (
                      <motion.div
                        key={sub.group}
                        initial={{ opacity: 0, y: 6 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                        transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2",
                          isDlq ? "border-rose-500/20 bg-rose-500/[0.04]" : "border-surface-border bg-surface"
                        )}
                      >
                        <p className={cn("text-xs font-semibold font-display shrink-0 w-20", isDlq ? "text-rose-200" : "text-zinc-200")}>{sub.service}</p>
                        <p className="text-3xs font-mono text-muted-foreground/60 flex-1 truncate">{sub.group}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge tone={cn(outCfg.bg, outCfg.border, outCfg.color)}>
                            <OutIcon className="w-2.5 h-2.5 inline mr-1" />{outCfg.label}
                          </Badge>
                          {sub.attempts > 1 && (
                            <span className="text-3xs font-mono text-muted-foreground/70">
                              <RefreshCcw className="w-2.5 h-2.5 inline" /> {sub.attempts}×
                            </span>
                          )}
                        </div>
                        {sub.note && <p className="text-3xs font-mono text-muted-foreground/60 shrink-0">{sub.note}</p>}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Retry ledger */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                  <p className="type-overline-mono text-muted-foreground">retry ledger · billing:invoice</p>
                </div>
                <div className="space-y-1">
                  {RETRY_LEDGER.map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-3xs",
                        row.stage === "error" ? "border-red-500/15 bg-red-500/[0.04] text-red-400/80"
                          : row.stage === "dlq" ? "border-rose-500/20 bg-rose-500/[0.05] text-rose-400"
                            : "border-surface-border bg-surface text-muted-foreground/70"
                      )}
                    >
                      <span>{row.text}</span>
                      {row.stage === "dlq" && <ShieldAlert className="w-3 h-3 text-rose-400 ml-auto shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard variant="compact" icon={Radio} title="Wildcard topics" description="Subscribe with patterns like order.* and receive all matching events. Segment count must match exactly." iconClassName="text-blue-400" />
          <FeatureCard variant="compact" icon={Filter} title="Server-side filtering" description="filterExpr evaluated before delivery rows are created. Unmatched events never reach workers and never burn retry budget." iconClassName="text-cyan-400" />
          <FeatureCard variant="compact" icon={Fingerprint} title="Idempotency keys" description="Duplicate publishes with the same idempotencyKey return the existing message ID — no re-delivery, no double processing." iconClassName="text-violet-400" />
          <FeatureCard variant="compact" icon={XCircle} title="ctx.reject() → DLQ" description="Handlers can reject immediately with a reason — bypasses retry policy, writes to DLQ instantly for inspection and replay." iconClassName="text-rose-400" />
        </>
      }
    />
  );
}
