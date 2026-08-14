import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Database,
  Filter,
  Fingerprint,
  GitBranch,
  PauseCircle,
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
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const EVENT_CODE: CodeLangs = {
  ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

// Declare the published event (schema from a .proto / .schema.json file)
sb.event.define("order.created", {
  protoFile: "./events/order.proto",
  input: "OrderCreated",
});

// Subscriber — wildcard pattern, server-side routing
sb.event.handle("order.*", async (payload) => {
  // throw to Nack — runtime retries with backoff, then routes to DLQ
  await sendEmail(payload);
});

await sb.start();

// Publisher — durable (local outbox → runtime), at-least-once delivery.
// idempotencyKey lets the runtime dedup re-publishes.
const { eventId } = await sb.event.publish("order.created", {
  orderId: "ord_123", amount: 4990,
  customer: { tier: "premium" },
}, { idempotencyKey: "orders:ord_123:created" });`,

  go: `package main

import (
	"context"
	"log"
	"os"

	eventsv1 "example.com/gen/events/v1"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	// Declare the published event — the payload type is the schema.
	created, err := sb.DefineEvent[*eventsv1.OrderCreated](c, "order.created")
	if err != nil {
		log.Fatal(err)
	}

	// Subscriber — return an error to nack: the runtime retries with backoff,
	// then routes to the DLQ.
	err = sb.SubscribeEvent(c, "order.created", func(ctx context.Context, e *eventsv1.OrderCreated) error {
		return sendEmail(ctx, e.GetOrderId())
	})
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	if err := c.Start(ctx); err != nil {
		log.Fatal(err)
	}

	// Publisher — durable (local outbox → runtime), at-least-once delivery.
	// The idempotency key lets the runtime dedup re-publishes.
	eventID, err := created.Publish(ctx, &eventsv1.OrderCreated{
		OrderId: "ord_123", Amount: 4990, CustomerTier: "premium",
	}, sb.WithEventIdempotencyKey("orders:ord_123:created"))
	if err != nil {
		log.Fatal(err)
	}
	log.Println("published", eventID)
}`,
};

const PIPELINE = [
  {
    icon: Radio,
    label: "Publish",
    desc: "sb.event.publish()",
    color: "text-blue-300",
    bg: "bg-blue-500/[0.08]",
    border: "border-blue-500/25",
    dot: "bg-blue-400",
  },
  {
    icon: Database,
    label: "Persist",
    desc: "PostgreSQL",
    color: "text-violet-300",
    bg: "bg-violet-500/[0.08]",
    border: "border-violet-500/25",
    dot: "bg-violet-400",
  },
  {
    icon: GitBranch,
    label: "Fan-out",
    desc: "per subscriber",
    color: "text-emerald-300",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  {
    icon: Send,
    label: "Deliver",
    desc: "per subscriber",
    color: "text-amber-300",
    bg: "bg-amber-500/[0.08]",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  {
    icon: CheckCircle2,
    label: "Outcome",
    desc: "ack · wait · retry · dlq",
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
] as const;

type Outcome = "ack" | "retry" | "dlq" | "waiting";

const SUBSCRIBERS: {
  service: string;
  pattern: string;
  outcome: Outcome;
  attempts: number;
  note: string | null;
}[] = [
  { service: "payments", pattern: "order.created", outcome: "ack", attempts: 1, note: null },
  {
    service: "notify",
    pattern: "order.*",
    outcome: "ack",
    attempts: 3,
    note: "retry → delivered",
  },
  { service: "analytics", pattern: "order.#", outcome: "ack", attempts: 1, note: null },
  {
    service: "billing",
    pattern: "order.created",
    outcome: "dlq",
    attempts: 5,
    note: "max attempts → DLQ",
  },
  {
    service: "reports",
    pattern: "order.*",
    outcome: "waiting",
    attempts: 0,
    note: "subscriber offline → waiting",
  },
];

const OUTCOME_CFG: Record<
  Outcome,
  { icon: typeof CheckCircle2; color: string; bg: string; border: string; label: string }
> = {
  ack: {
    icon: CheckCircle2,
    color: "text-emerald-300",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/20",
    label: "ack",
  },
  retry: {
    icon: RefreshCcw,
    color: "text-amber-300",
    bg: "bg-amber-500/[0.08]",
    border: "border-amber-500/20",
    label: "retry",
  },
  dlq: {
    icon: Ban,
    color: "text-rose-300",
    bg: "bg-rose-500/[0.08]",
    border: "border-rose-500/20",
    label: "dlq",
  },
  waiting: {
    icon: PauseCircle,
    color: "text-sky-300",
    bg: "bg-sky-500/[0.08]",
    border: "border-sky-500/20",
    label: "waiting",
  },
};

const RETRY_LEDGER = [
  { text: "billing ← order.created  ·  #1  connection timeout · backoff 5s", stage: "error" as const },
  { text: "billing ← order.created  ·  #2  retry · backoff 30s", stage: "retry" as const },
  { text: "billing ← order.created  ·  #3  retry · backoff 2m", stage: "retry" as const },
  { text: "billing ← order.created  ·  #4  retry · backoff 10m", stage: "retry" as const },
  { text: "billing ← order.created  ·  #5  max attempts  →  DLQ", stage: "dlq" as const },
];

const PUBLISH_OPTS = [
  { field: "idempotencyKey", desc: "runtime dedup" },
  { field: "partitionKey", desc: "FIFO per key" },
  { field: "fireAndForget", desc: "skip the outbox" },
  { field: "occurredAtMs", desc: "event time, unix-ms" },
];

export function DurableEventsSection() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(pipelineRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="durable-events"
      eyebrow="Durable Events"
      title="Publish once. Fan-out to every subscriber. Delivered even offline."
      subtitle="At-least-once delivery, like RabbitMQ queues but without a broker. A local outbox keeps publishes alive across a runtime restart; offline subscribers receive everything the moment they reconnect."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">delivery contract</p>
            <h2 className="mt-2 type-subsection-title">
              Guaranteed delivery. Offline consumers wait, not fail.
            </h2>
            <p className="mt-3 type-body-sm">
              Every subscriber has its own delivery ledger. Each publish lands in a local{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                outbox
              </code>{" "}
              and drains in the background, surviving a runtime outage. Offline subscribers hold their
              deliveries until they reconnect. A failing handler{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                Nack
              </code>
              s — the runtime retries with backoff, then routes to the DLQ.
            </p>
            <div className="mt-4 space-y-1.5">
              <p className="type-overline-mono text-muted-foreground mb-2">PublishOpts</p>
              {PUBLISH_OPTS.map(({ field, desc }) => (
                <div
                  key={field}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-code px-3 py-1.5"
                >
                  <code className="text-xs font-mono text-emerald-300">{field}</code>
                  <span className="text-2xs text-muted-foreground ml-auto">{desc}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="link" size="sm" className="mt-3 h-auto px-0 text-emerald-300">
              <a href="#docs">
                Read the events API
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </Card>
          <MultiCodeBlock
            code={EVENT_CODE}
            filename={{
              ts: "notifications-service.ts",
              go: "notifications-service.go",
            }}
          />
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel
            title="delivery pipeline · order.created"
            headerActions={
              <Badge tone="border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400">
                at-least-once
              </Badge>
            }
          >
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
                          className={cn(
                            "rounded-xl border px-2.5 py-2 text-center shrink-0",
                            stage.border,
                            stage.bg
                          )}
                          style={{ minWidth: 70 }}
                        >
                          <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", stage.color)} />
                          <p
                            className={cn(
                              "text-xs font-semibold font-display leading-tight",
                              stage.color
                            )}
                          >
                            {stage.label}
                          </p>
                          <p className="text-2xs text-muted-foreground/80 mt-0.5">{stage.desc}</p>
                        </motion.div>
                        {i < PIPELINE.length - 1 && (
                          <div className="flex-1 relative h-px bg-white/[0.06] min-w-[8px]">
                            {inView && (
                              <motion.span
                                className={cn(
                                  "absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2",
                                  stage.dot
                                )}
                                style={{ opacity: 0.8 }}
                                animate={{ left: ["-3%", "103%"] }}
                                transition={{
                                  duration: 1.2,
                                  ease: "linear",
                                  repeat: 3,
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

              {/* Subscribers */}
              <div>
                <p className="type-overline-mono text-muted-foreground mb-3">
                  subscribers · independent delivery
                </p>
                <div className="space-y-1.5">
                  {SUBSCRIBERS.map((sub, i) => {
                    const outCfg = OUTCOME_CFG[sub.outcome];
                    const OutIcon = outCfg.icon;
                    const isDlq = sub.outcome === "dlq";
                    return (
                      <motion.div
                        key={sub.service}
                        initial={{ opacity: 0, y: 6 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                        transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2",
                          isDlq
                            ? "border-rose-500/20 bg-rose-500/[0.04]"
                            : "border-surface-border bg-surface"
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-semibold font-display shrink-0 w-20",
                            isDlq ? "text-rose-200" : "text-zinc-200"
                          )}
                        >
                          {sub.service}
                        </p>
                        <p className="text-2xs font-mono text-muted-foreground flex-1 truncate">
                          {sub.pattern}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge tone={cn(outCfg.bg, outCfg.border, outCfg.color)}>
                            <OutIcon className="w-2.5 h-2.5 inline mr-1" />
                            {outCfg.label}
                          </Badge>
                          {sub.attempts > 1 && (
                            <span className="text-2xs font-mono text-muted-foreground">
                              <RefreshCcw className="w-2.5 h-2.5 inline" /> {sub.attempts}×
                            </span>
                          )}
                        </div>
                        {sub.note && (
                          <p className="hidden max-w-[10rem] truncate text-2xs font-mono text-muted-foreground/80 shrink-0 sm:block">
                            {sub.note}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Retry ledger */}
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                  <p className="type-overline-mono text-muted-foreground">
                    retry ledger · billing:invoice
                  </p>
                </div>
                <div className="space-y-1">
                  {RETRY_LEDGER.map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-2xs",
                        row.stage === "error"
                          ? "border-red-500/15 bg-red-500/[0.04] text-red-400/80"
                          : row.stage === "dlq"
                            ? "border-rose-500/20 bg-rose-500/[0.05] text-rose-400"
                            : "border-surface-border bg-surface text-muted-foreground/70"
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
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={Radio}
            title="Wildcard topics"
            description="Subscribe with patterns like order.* to catch every matching event."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={Database}
            title="Durable local outbox"
            description="Every publish lands in a local outbox first, then drains to the runtime in the background — so publishing survives a transient runtime outage."
            iconClassName="text-cyan-400"
          />
          <FeatureCard
            variant="compact"
            icon={Fingerprint}
            title="Idempotency keys"
            description="publish() returns an eventId. Re-publishing with the same idempotencyKey is deduped — no double delivery."
            iconClassName="text-violet-400"
          />
          <FeatureCard
            variant="compact"
            icon={Filter}
            title="Partition keys keep order"
            description="Events sharing a partitionKey are delivered FIFO; events with no key are delivered in parallel for throughput."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={XCircle}
            title="Nack → retry → DLQ"
            description="A handler that throws Nacks the delivery. The runtime retries with backoff and routes to the DLQ once the attempt budget is spent."
            iconClassName="text-rose-400"
          />
          <FeatureCard
            variant="compact"
            icon={PauseCircle}
            title="Offline? Messages wait."
            description="Offline subscribers hold their deliveries until they reconnect — no progress lost."
            iconClassName="text-sky-400"
          />
        </>
      }
    />
  );
}
