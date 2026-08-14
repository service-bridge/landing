import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { highlightCode } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

// ─── SDK example ──────────────────────────────────────────────────────────────

const SDK_LABEL: Record<SdkLang, string> = {
  ts: "Node SDK",
  go: "Go SDK",
  py: "Python SDK",
};

const LANG_TABS = [
  {
    id: "typescript",
    label: "orders-service.ts",
    filename: "orders-service.ts",
    code: `import { ServiceBridge } from "service-bridge";

// Connect: gRPC control-plane address + sbv2 service key
const sb = new ServiceBridge(
  "localhost:14445",
  serviceKey, // sbv2.<id>.<secret>.<ca>
);

// RPC handler — direct mTLS, schema-decoded payload
sb.rpc.handle("orders.create", async (payload) => {
  const order = await db.insert(payload);

  // Publish a durable event — trace context propagates automatically
  await sb.event.publish("order.created", { orderId: order.id, amount: order.total });

  return { id: order.id, status: "success" };
}, { schema: { protoFile: "orders.proto" } });

// Durable consumer — at-least-once, retries + DLQ by the runtime
sb.event.handle("payment.failed", async (payload) => {
  await notifyCustomer(payload);
});

// Cron job — no payload, ctx carries scheduledAt / attempt
sb.job.handle("nightly-reconcile", { trigger: { cron: "0 9 * * *" } }, async (ctx) => {
  await reconcile(ctx.scheduledAt);
});

// Declare outgoing RPC deps before start() (policy-gated)
sb.service("payments", { rpc: ["charge"] });
sb.service("inventory", { rpc: ["reserve"] });

// DAG workflow: charge + reserve run in parallel, confirm waits for both
sb.workflow.handle("checkout.flow", {
  steps: [
    { type: "call", id: "charge",  service: "payments",  method: "charge",  input: "$.input" },
    { type: "call", id: "reserve", service: "inventory", method: "reserve", input: "$.input" },
    { type: "publish", id: "confirm", event: "order.confirmed",
      input: "$.input", waitFor: ["charge", "reserve"] },
  ],
});

await sb.start(); // provisions an mTLS cert from your key, then connects`,
  },
] as const;

// ─── Live registry ────────────────────────────────────────────────────────────

const INSTANCE_TONE = "bg-teal-500/10 text-teal-300";

const REGISTRY_SERVICES = [
  {
    name: "orders",
    instances: 3,
    base: 2,
    rpc: 3,
    evt: 2,
  },
  {
    name: "payments",
    instances: 2,
    base: 1,
    rpc: 2,
    evt: 1,
  },
  {
    name: "notify",
    instances: 1,
    base: 4,
    rpc: 1,
    evt: 3,
  },
  {
    name: "inventory",
    instances: 2,
    base: 2,
    rpc: 2,
    evt: 0,
  },
  {
    name: "analytics",
    instances: 4,
    base: 6,
    rpc: 0,
    evt: 2,
  },
];

type ActivityType = "rpc" | "event";

interface ActivityRow {
  id: number;
  type: ActivityType;
  name: string;
  ms: number;
}

const ACTIVITY_POOL: Omit<ActivityRow, "id">[] = [
  { type: "rpc", name: "orders.create", ms: 12 },
  { type: "event", name: "order.created", ms: 3 },
  { type: "rpc", name: "stock.reserve", ms: 8 },
  { type: "rpc", name: "payments.charge", ms: 94 },
  { type: "event", name: "payment.completed", ms: 4 },
  { type: "rpc", name: "notify.send", ms: 6 },
  { type: "event", name: "user.registered", ms: 2 },
  { type: "rpc", name: "analytics.track", ms: 15 },
  { type: "rpc", name: "billing.reconcile", ms: 148 },
  { type: "event", name: "billing.reconciled", ms: 5 },
];

const ACTIVITY_TONE: Record<ActivityType, string> = {
  rpc: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  event: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
};

function RegistryPanel() {
  const [pings, setPings] = useState(REGISTRY_SERVICES.map((s) => s.base));
  const [activity, setActivity] = useState<ActivityRow[]>(() =>
    ACTIVITY_POOL.slice(0, 3).map((r, i) => ({ ...r, id: i }))
  );
  const poolIdx = useRef(3);
  const idRef = useRef(3);

  useEffect(() => {
    const pingId = setInterval(() => {
      setPings(REGISTRY_SERVICES.map((s) => s.base + Math.floor(Math.random() * 5)));
    }, 1800);

    const actId2 = setInterval(() => {
      const next = ACTIVITY_POOL[poolIdx.current % ACTIVITY_POOL.length];
      poolIdx.current++;
      setActivity((prev) => [{ ...next, id: idRef.current++ }, ...prev.slice(0, 2)]);
    }, 2200);

    return () => {
      clearInterval(pingId);
      clearInterval(actId2);
    };
  }, []);

  return (
    <CodePanel>
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-surface-border bg-code-chrome px-4 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="type-overline-mono text-muted-foreground/70 flex-1">
          control plane — service registry
        </span>
        <span className="type-overline-mono text-emerald-400">online</span>
      </div>

      {/* Column headers + rows */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          <div
            className="grid gap-2 px-4 py-1.5 border-b border-surface-border bg-code-chrome"
            style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
          >
            <span className="type-overline-mono text-muted-foreground/60">service</span>
            <span className="type-overline-mono text-muted-foreground/60">instances</span>
            <span className="type-overline-mono text-muted-foreground/60">handlers</span>
            <span className="type-overline-mono text-muted-foreground/60 text-right">rtt</span>
          </div>

          <div className="divide-y divide-surface-border">
            {REGISTRY_SERVICES.map((svc, i) => (
              <div
                key={svc.name}
                className="grid gap-2 items-center px-4 py-2.5"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
              >
                {/* Name + cert */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-zinc-200 truncate">{svc.name}</span>
                  <ShieldCheck className="w-3 h-3 text-teal-500/60 shrink-0" />
                </div>

                {/* Instances */}
                <span
                  className={cn(
                    "text-[11px] font-mono px-1.5 py-0.5 rounded border border-surface-border shrink-0",
                    INSTANCE_TONE
                  )}
                >
                  {svc.instances}×
                </span>

                {/* Handlers */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {svc.rpc > 0 && (
                    <Badge tone="border-blue-500/20 bg-blue-500/[0.08] text-blue-300">
                      {svc.rpc} rpc
                    </Badge>
                  )}
                  {svc.evt > 0 && (
                    <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300">
                      {svc.evt} evt
                    </Badge>
                  )}
                </div>

                {/* RTT */}
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums text-right shrink-0">
                  {pings[i]}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live activity */}
      <div className="border-t border-surface-border">
        <div className="flex items-center gap-2 px-4 py-2 bg-code-chrome border-b border-surface-border">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="type-overline-mono text-muted-foreground/60">recent calls</span>
        </div>
        <div className="px-4 py-2 space-y-1.5 min-h-[88px]">
          <AnimatePresence initial={false}>
            {activity.map((row) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <Badge tone={ACTIVITY_TONE[row.type]}>{row.type}</Badge>
                <span className="text-xs font-mono text-muted-foreground flex-1 truncate">
                  {row.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">
                  {row.ms}ms
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-surface-border bg-code-chrome px-4 py-2 type-overline-mono text-muted-foreground/60">
        <span>5 services · 12 instances · mTLS</span>
        <span>Prometheus · Loki compatible</span>
      </div>
    </CodePanel>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function CodeSection() {
  const { lang } = useSdkLang();
  const tab = LANG_TABS[0];

  const maxCodeLines = Math.max(...LANG_TABS.map((t) => t.code.trim().split("\n").length));
  const minCodeHeight = maxCodeLines * 20 + 40;

  return (
    <Section id="code" className="border-y">
      <SectionHeader
        eyebrow="Developer Experience"
        title={<>One {SDK_LABEL[lang] ?? SDK_LABEL.ts}. Zero manual instrumentation.</>}
        subtitle="One facade for RPC, durable events, DAG workflows, and cron jobs — mTLS, traces, and metrics come for free on start()."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_0.92fr] max-w-6xl mx-auto">
        <motion.div variants={fadeInUp} className="min-w-0">
          <CodePanel>
            <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-white/[0.02] px-4 py-2.5">
              <span className="text-xs font-mono text-muted-foreground">{tab.filename}</span>
              <span className="type-overline-mono rounded-md border border-surface-border bg-surface px-2 py-0.5 text-muted-foreground/70">
                {SDK_LABEL[lang] ?? SDK_LABEL.ts}
              </span>
            </div>
            <pre
              className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted-foreground"
              style={{ minHeight: minCodeHeight }}
            >
              <code>{highlightCode(tab.code.trim(), "ts")}</code>
            </pre>
          </CodePanel>
        </motion.div>

        <motion.div variants={fadeInUp} className="min-w-0 xl:sticky xl:top-24">
          <RegistryPanel />
        </motion.div>
      </div>
    </Section>
  );
}
