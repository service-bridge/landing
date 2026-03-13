import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import { useSdkLang } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { highlightCode } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";
import { TabStrip } from "../ui/Tabs";

// ─── Language tabs ────────────────────────────────────────────────────────────

const LANG_TABS = [
  {
    id: "typescript",
    label: "TypeScript",
    filename: "orders-service.ts",
    code: `import { servicebridge } from "service-bridge";

// Connect: control plane address + service key + service name
const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders");

// RPC handler — direct gRPC, zero proxy hops
sb.handleRpc("orders.create", async (payload) => {
  const order = await db.insert(payload);

  // Publish durable event — trace context forwarded automatically
  await sb.event("order.created", { orderId: order.id, amount: order.total });

  return { id: order.id, status: "created" };
});

// Event consumer with retry policy
sb.handleEvent("payment.failed", async (payload, ctx) => {
  const notified = await notifyCustomer(payload);
  if (!notified) ctx.retry(30_000);    // reschedule 30s later
});

// Scheduled job — cron or one-shot
await sb.job("reports.daily", { cron: "0 9 * * *", via: "rpc" });

// Multi-step workflow with parallel steps
await sb.workflow("checkout.flow", [
  { id: "charge",   type: "rpc",   ref: "payments.charge",   deps: [] },
  { id: "reserve",  type: "rpc",   ref: "inventory.reserve", deps: [] },
  { id: "confirm",  type: "event", ref: "order.confirmed",   deps: ["charge", "reserve"] },
]);

await sb.serve();`,
  },
  {
    id: "go",
    label: "Go",
    filename: "main.go",
    code: `package main

import (
  "context"
  "encoding/json"
  "log"
  "os"
  "os/signal"

  servicebridge "github.com/service-bridge/go"
)

func main() {
  // Connect: control plane address + service key + service name
  ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
  defer cancel()
  svc := servicebridge.New("localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), "payments", nil)

  // RPC handler — direct gRPC, context carries trace
  svc.HandleRpc("payments.charge", func(ctx context.Context, payload json.RawMessage) (any, error) {
    txId, err := stripe.Charge(ctx, payload)
    if err != nil {
      return nil, err
    }
    return map[string]any{"txId": txId, "ok": true}, nil
  })

  // Event consumer with retry
  svc.HandleEvent("order.created", func(ctx context.Context, payload json.RawMessage, ectx *servicebridge.EventContext) error {
    if err := processOrder(ctx, payload); err != nil {
      ectx.Retry(30_000)  // retry in 30s
    }
    return nil
  }, &servicebridge.HandleEventOpts{GroupName: "payments:process"})

  // Scheduled job — cron or one-shot
  svc.Job("reports.daily", servicebridge.ScheduleOpts{Cron: "0 9 * * *", Via: "rpc"})

  // Multi-step workflow with parallel steps
  svc.Workflow("checkout.flow", []servicebridge.WorkflowStep{
    {ID: "charge",  Type: "rpc",   Ref: "payments.charge",   Deps: []string{}},
    {ID: "reserve", Type: "rpc",   Ref: "inventory.reserve", Deps: []string{}},
    {ID: "confirm", Type: "event", Ref: "order.confirmed",   Deps: []string{"charge", "reserve"}},
  })

  log.Fatal(svc.Serve(ctx, nil))
}`,
  },
  {
    id: "python",
    label: "Python",
    filename: "app.py",
    code: `import asyncio
import os
from service_bridge import ServiceBridge

# Connect: control plane address + service key + service name
sb = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"], "notify")

# RPC handler — direct gRPC, zero proxy hops
@sb.handle_rpc("notify.send")
async def send_notification(payload: dict) -> dict:
    await send_email(payload)
    return {"sent": True}

# Event consumer with retry policy
@sb.handle_event("order.created")
async def on_order_created(payload: dict, ctx) -> None:
    success = await send_welcome_email(payload)
    if not success:
        ctx.retry(30_000)    # retry in 30s

# Scheduled job — cron or one-shot
async def bootstrap():
    await sb.job("reports.daily", cron="0 9 * * *", via="rpc")

    # Multi-step workflow with parallel steps
    await sb.workflow("checkout.flow", [
        {"id": "charge",  "type": "rpc",   "ref": "payments.charge",   "deps": []},
        {"id": "reserve", "type": "rpc",   "ref": "inventory.reserve", "deps": []},
        {"id": "confirm", "type": "event", "ref": "order.confirmed",   "deps": ["charge", "reserve"]},
    ])

    await sb.serve()

asyncio.run(bootstrap())`,
  },
] as const;

type LangId = (typeof LANG_TABS)[number]["id"];

const LANG_TO_SDK: Record<LangId, "ts" | "go" | "py"> = {
  typescript: "ts",
  go: "go",
  python: "py",
};
const SDK_TO_LANG: Record<string, LangId> = {
  ts: "typescript",
  go: "go",
  py: "python",
};

// ─── Live registry ────────────────────────────────────────────────────────────

const REGISTRY_SERVICES = [
  { name: "orders",    lang: "TypeScript", langColor: "text-blue-400",   langBg: "bg-blue-500/10",   base: 2, rpc: 3, evt: 2 },
  { name: "payments",  lang: "Go",         langColor: "text-cyan-400",   langBg: "bg-cyan-500/10",   base: 1, rpc: 2, evt: 1 },
  { name: "notify",    lang: "Python",     langColor: "text-yellow-400", langBg: "bg-yellow-500/10", base: 4, rpc: 1, evt: 3 },
  { name: "inventory", lang: "Go",         langColor: "text-cyan-400",   langBg: "bg-cyan-500/10",   base: 2, rpc: 2, evt: 0 },
  { name: "analytics", lang: "Python",     langColor: "text-yellow-400", langBg: "bg-yellow-500/10", base: 6, rpc: 0, evt: 2 },
];

type ActivityType = "rpc" | "event";

interface ActivityRow {
  id: number;
  type: ActivityType;
  name: string;
  ms: number;
}

const ACTIVITY_POOL: Omit<ActivityRow, "id">[] = [
  { type: "rpc",   name: "orders.create",     ms: 12  },
  { type: "event", name: "order.created",      ms: 3   },
  { type: "rpc",   name: "inventory.reserve",  ms: 8   },
  { type: "rpc",   name: "payments.charge",    ms: 94  },
  { type: "event", name: "payment.completed",  ms: 4   },
  { type: "rpc",   name: "notify.send",        ms: 6   },
  { type: "event", name: "user.registered",    ms: 2   },
  { type: "rpc",   name: "analytics.track",    ms: 15  },
  { type: "rpc",   name: "billing.reconcile",  ms: 148 },
  { type: "event", name: "billing.reconciled", ms: 5   },
];

const ACTIVITY_TONE: Record<ActivityType, string> = {
  rpc:   "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  event: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
};

let actId = 0;

function RegistryPanel() {
  const [pings, setPings]       = useState(REGISTRY_SERVICES.map((s) => s.base));
  const [activity, setActivity] = useState<ActivityRow[]>(() =>
    ACTIVITY_POOL.slice(0, 3).map((r) => ({ ...r, id: actId++ }))
  );
  const poolIdx = useRef(3);

  useEffect(() => {
    const pingId = setInterval(() => {
      setPings(REGISTRY_SERVICES.map((s) => s.base + Math.floor(Math.random() * 5)));
    }, 1800);

    const actId2 = setInterval(() => {
      const next = ACTIVITY_POOL[poolIdx.current % ACTIVITY_POOL.length];
      poolIdx.current++;
      setActivity((prev) => [{ ...next, id: actId++ }, ...prev.slice(0, 2)]);
    }, 2200);

    return () => { clearInterval(pingId); clearInterval(actId2); };
  }, []);

  return (
    <CodePanel>
      {/* Chrome */}
      <div className="flex items-center gap-2 border-b border-surface-border bg-code-chrome px-4 py-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="type-overline-mono text-muted-foreground/70 flex-1">control plane — service registry</span>
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
            <span className="type-overline-mono text-muted-foreground/60">sdk</span>
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

            {/* Language */}
            <span className={cn("text-[11px] font-mono px-1.5 py-0.5 rounded border border-surface-border shrink-0", svc.langBg, svc.langColor)}>
              {svc.lang}
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
                <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{row.name}</span>
                <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">{row.ms}ms</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-surface-border bg-code-chrome px-4 py-2 type-overline-mono text-muted-foreground/60">
        <span>5 services · 5 certs</span>
        <span>OTLP compatible</span>
      </div>
    </CodePanel>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function CodeSection() {
  const { lang, setLang } = useSdkLang();
  const activeLang: LangId = SDK_TO_LANG[lang] ?? "typescript";
  const tab = LANG_TABS.find((t) => t.id === activeLang) ?? LANG_TABS[0];

  const maxCodeLines = Math.max(...LANG_TABS.map((t) => t.code.trim().split("\n").length));
  const minCodeHeight = maxCodeLines * 20 + 40;

  return (
    <Section id="code" className="border-y">
      <SectionHeader
        eyebrow="Developer Experience"
        title={
          <>
            One SDK across languages.{" "}
            Zero manual instrumentation.
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_0.92fr] max-w-6xl mx-auto">
        <motion.div variants={fadeInUp} className="min-w-0">
          <CodePanel>
            <div className="flex items-center gap-3 border-b border-surface-border bg-white/[0.02] px-3 py-2">
              <TabStrip
                size="sm"
                items={LANG_TABS}
                active={activeLang}
                onChange={(id) => setLang(LANG_TO_SDK[id])}
              />
            </div>
            <pre
              className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted-foreground"
              style={{ minHeight: minCodeHeight }}
            >
              <code>{highlightCode(tab.code.trim(), lang)}</code>
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
