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
import React, { useRef } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";

// ─── Data ─────────────────────────────────────────────────────────────────────

const EVENT_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "notifications");

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
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "notifications", nil)

// Consumer with server-side filter + retry policy
svc.HandleEvent("order.*",
    func(ctx context.Context, p json.RawMessage,
        ec *servicebridge.EventContext) error {
        ok := sendEmail(ctx, p)
        if !ok {
            return ec.Retry(30_000) // reschedule after 30s
        }
        return nil
    }, &servicebridge.HandleEventOpts{
        GroupName:       "notify:email",
        FilterExpr:      "customer.tier!=free,amount>=1000",
        RetryPolicyJSON: \`{"maxAttempts":5,"baseDelayMs":5000,"factor":2}\`,
    })

// Publisher — durable, at-least-once per consumer group
svc.Event(ctx, "order.created", map[string]any{
    "orderId":  "ord_123",
    "amount":   4990,
    "customer": map[string]any{"tier": "premium"},
}, &servicebridge.EventOpts{IdempotencyKey: "orders:ord_123:created"})`,

  py: `from servicebridge import ServiceBridge

svc = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "notifications")

# Consumer with server-side filter + retry policy
@svc.handle_event(
    "order.*",
    group_name="notify:email",
    filter_expr="customer.tier!=free,amount>=1000",
    retry_policy_json='{"maxAttempts":5,"baseDelayMs":5000,"factor":2}',
)
async def on_order(payload: dict, ctx) -> None:
    ok = await send_email(payload)
    if not ok:
        ctx.retry(30_000)  # reschedule after 30s

# Publisher — durable, at-least-once per consumer group
await svc.event(
    "order.created",
    {"orderId": "ord_123", "amount": 4990, "customer": {"tier": "premium"}},
    idempotency_key="orders:ord_123:created",
)`,
};

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const PIPELINE = [
  {
    id: "publish",
    icon: Radio,
    label: "Publish",
    desc: "sb.event()",
    border: "border-blue-500/25",
    bg: "bg-blue-500/[0.08]",
    color: "text-blue-300",
    dotColor: "bg-blue-400",
  },
  {
    id: "persist",
    icon: Database,
    label: "Persist",
    desc: "PostgreSQL",
    border: "border-violet-500/25",
    bg: "bg-violet-500/[0.08]",
    color: "text-violet-300",
    dotColor: "bg-violet-400",
  },
  {
    id: "fanout",
    icon: GitBranch,
    label: "Fan-out",
    desc: "×4 groups",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.08]",
    color: "text-emerald-300",
    dotColor: "bg-emerald-400",
  },
  {
    id: "deliver",
    icon: Send,
    label: "Deliver",
    desc: "per group",
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.08]",
    color: "text-amber-300",
    dotColor: "bg-amber-400",
  },
  {
    id: "outcome",
    icon: CheckCircle2,
    label: "Outcome",
    desc: "ack · retry · dlq",
    border: "border-primary/25",
    bg: "bg-primary/[0.08]",
    color: "text-primary",
    dotColor: "bg-primary",
  },
] as const;

// ─── Subscriber groups ────────────────────────────────────────────────────────

type Outcome = "ack" | "retry" | "dlq";

const SUBSCRIBERS = [
  {
    id: "s1",
    service: "payments",
    group: "payments:charge",
    outcome: "ack" as Outcome,
    attempts: 1,
    note: null,
  },
  {
    id: "s2",
    service: "notify",
    group: "notify:email",
    outcome: "ack" as Outcome,
    attempts: 3,
    note: "retry → delivered",
  },
  {
    id: "s3",
    service: "analytics",
    group: "analytics:track",
    outcome: "ack" as Outcome,
    attempts: 1,
    note: null,
  },
  {
    id: "s4",
    service: "billing",
    group: "billing:invoice",
    outcome: "dlq" as Outcome,
    attempts: 5,
    note: "max attempts → DLQ",
  },
] as const;

// ─── Retry ledger rows ────────────────────────────────────────────────────────

const RETRY_LEDGER = [
  { id: "l1", text: "billing.invoice  ·  #1  connection timeout", stage: "error" as const },
  { id: "l2", text: "billing.invoice  ·  #2  backoff 5s", stage: "retry" as const },
  { id: "l3", text: "billing.invoice  ·  #3  backoff 10s", stage: "retry" as const },
  { id: "l4", text: "billing.invoice  ·  #4  backoff 20s", stage: "retry" as const },
  { id: "l5", text: "billing.invoice  ·  #5  max attempts  →  DLQ", stage: "dlq" as const },
] as const;

// ─── Outcome config ───────────────────────────────────────────────────────────

const OUTCOME_CFG: Record<Outcome, { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string }> = {
  ack: { icon: CheckCircle2, color: "text-emerald-300", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/20", label: "ack" },
  retry: { icon: RefreshCcw, color: "text-amber-300", bg: "bg-amber-500/[0.08]", border: "border-amber-500/20", label: "retry" },
  dlq: { icon: Ban, color: "text-rose-300", bg: "bg-rose-500/[0.08]", border: "border-rose-500/20", label: "dlq" },
};

// ─── Section ──────────────────────────────────────────────────────────────────

export function DurableEventsSection() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(pipelineRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="durable-events"
      eyebrow="Durable Events"
      title="Publish once. Fan-out to all groups. Retry safely."
      subtitle="At-least-once delivery with independent fan-out per consumer group, per-group retry ledger, server-side filtering before delivery, and DLQ with batch replay — zero extra broker."
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title="delivery pipeline · order.created">
            <Badge
              tone="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400"
              className="absolute top-2.5 right-4"
            >
              at-least-once
            </Badge>
            <div ref={pipelineRef} className="p-5 space-y-5">
              <div>
                <p className="type-overline-mono text-muted-foreground mb-3">delivery stages</p>
                <div className="flex items-center gap-0">
                  {PIPELINE.map((stage, i) => {
                    const Icon = stage.icon;
                    return (
                      <div key={stage.id} className="contents">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.35, delay: i * 0.12 }}
                          className={cn(
                            "rounded-2xl border px-2.5 py-2.5 text-center shrink-0",
                            stage.border,
                            stage.bg
                          )}
                          style={{ minWidth: 72 }}
                        >
                          <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", stage.color)} />
                          <p className={cn("text-xs font-semibold font-display leading-tight", stage.color)}>
                            {stage.label}
                          </p>
                          <p className="text-3xs text-zinc-600 mt-0.5">{stage.desc}</p>
                        </motion.div>

                        {i < PIPELINE.length - 1 && (
                          <div className="flex-1 relative h-px bg-white/[0.06] min-w-[8px]">
                            {inView && (
                              <motion.span
                                className={cn(
                                  "absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2",
                                  stage.dotColor
                                )}
                                style={{ opacity: 0.8 }}
                                animate={{ left: ["-3%", "103%"] }}
                                transition={{
                                  duration: 1.2,
                                  ease: "linear",
                                  repeat: Infinity,
                                  delay: i * 0.28,
                                }}
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

              <div>
                <p className="type-overline-mono text-muted-foreground mb-3">consumer groups · independent delivery</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSCRIBERS.map((sub, i) => {
                    const outCfg = OUTCOME_CFG[sub.outcome];
                    const OutIcon = outCfg.icon;
                    const isDlq = sub.outcome === "dlq";
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                        transition={{ duration: 0.35, delay: 0.6 + i * 0.08 }}
                      >
                        <Card
                          className={cn(
                            "p-3",
                            isDlq && "border-rose-500/20 bg-rose-500/[0.04]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div className="min-w-0">
                              <p className={cn("text-xs font-semibold font-display truncate", isDlq ? "text-rose-200" : "text-zinc-200")}>
                                {sub.service}
                              </p>
                              <p className="text-3xs font-mono text-zinc-600 truncate">{sub.group}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge tone={cn(outCfg.bg, outCfg.border, outCfg.color)}>
                              <OutIcon className="w-2.5 h-2.5 inline mr-1" />
                              {outCfg.label}
                            </Badge>
                            {sub.attempts > 1 && (
                              <span className="inline-flex items-center gap-0.5 text-3xs font-mono text-zinc-500">
                                <RefreshCcw className="w-2.5 h-2.5" />
                                {sub.attempts}×
                              </span>
                            )}
                          </div>
                          {sub.note && (
                            <p className="mt-1 text-3xs font-mono text-zinc-600">{sub.note}</p>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/[0.04]" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                  <p className="type-overline-mono text-muted-foreground">retry ledger · billing:invoice</p>
                </div>
                <div className="space-y-1">
                  {RETRY_LEDGER.map((row) => (
                    <div
                      key={row.id}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3 py-1.5 font-mono text-3xs",
                        row.stage === "error"
                          ? "border-red-500/15 bg-red-500/[0.04] text-red-400/80"
                          : row.stage === "dlq"
                            ? "border-rose-500/20 bg-rose-500/[0.05] text-rose-400"
                            : "border-white/[0.05] bg-white/[0.02] text-zinc-500"
                      )}
                    >
                      <span>{row.text}</span>
                      {row.stage === "dlq" && (
                        <ShieldAlert className="w-3 h-3 text-rose-400 ml-auto shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">delivery</p>
                  <p className="text-sm font-semibold font-display text-emerald-300">fan-out / group</p>
                </Card>
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">retry</p>
                  <p className="text-sm font-semibold font-display text-amber-300">exp + jitter</p>
                </Card>
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">idempotency</p>
                  <p className="text-sm font-semibold font-display text-violet-300">per producer key</p>
                </Card>
              </div>
            </div>
          </CodePanel>
        </motion.div>
      }
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">delivery contract</p>
            <h2 className="mt-2 type-subsection-title">
              At-least-once with server-side filtering.
            </h2>
            <p className="mt-3 type-body-sm">
              Each consumer group gets its own independent delivery ledger.{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                filterExpr
              </code>{" "}
              is evaluated before delivery rows are even created — unmatched events never
              reach workers, and never count against retry budgets.
            </p>

            <Card className="mt-4 p-4 bg-code">
              <p className="type-overline-mono text-muted-foreground mb-2">filterExpr syntax</p>
              <div className="space-y-1.5">
                {(
                  [
                    { expr: "status=paid", desc: "exact match" },
                    { expr: "amount>=1000", desc: "numeric comparison" },
                    { expr: "customer.tier!=free", desc: "dot-path inequality" },
                    { expr: "status=active,region=eu", desc: "AND conditions" },
                  ] as const
                ).map(({ expr, desc }) => (
                  <div
                    key={expr}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
                  >
                    <code className="text-xs font-mono text-emerald-300">{expr}</code>
                    <span className="text-3xs text-zinc-600 ml-auto">{desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Card>

          <MultiCodeBlock
            code={EVENT_CODE}
            filename={{ ts: "notifications-service.ts", go: "notifications_service.go", py: "notifications_service.py" }}
          />
        </motion.div>
      }
      cards={
        <>
          <MiniCard
            icon={Radio}
            title="Wildcard topics"
            desc="Subscribe with patterns like order.* and receive all matching events. Segment count must match exactly — order.* won't match order.item.paid."
            iconClassName="text-blue-400"
          />
          <MiniCard
            icon={Filter}
            title="Server-side filtering"
            desc="filterExpr evaluated before delivery rows are created. Unmatched events never reach workers and never burn retry budget."
            iconClassName="text-cyan-400"
          />
          <MiniCard
            icon={Fingerprint}
            title="Idempotency keys"
            desc="Duplicate publishes with the same idempotencyKey return the existing message ID — no re-delivery, no double processing."
            iconClassName="text-violet-400"
          />
          <MiniCard
            icon={XCircle}
            title="ctx.reject() → DLQ"
            desc="Handlers can reject immediately with a reason — bypasses retry policy, writes to DLQ instantly for inspection and replay."
            iconClassName="text-rose-400"
          />
        </>
      }
    />
  );
}
