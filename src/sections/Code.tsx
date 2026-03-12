import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Globe,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { fadeInUp } from "../components/animations";
import { useSdkLang } from "../lib/language-context";
import { cn } from "../lib/utils";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";
import { TabStrip } from "../ui/Tabs";
import { FlowTile, SectionTag } from "./feature-shared";

// ─── Language tabs ────────────────────────────────────────────────────────────

const LANG_TABS = [
  {
    id: "typescript",
    label: "TypeScript",
    badge: "Full SDK",
    badgeTone: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
    primitives: ["RPC", "Events", "Jobs", "Workflows", "Streams"],
    filename: "orders-service.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

// Connect: control plane address + service key + service name
const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "orders");

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
    badge: "Full SDK",
    badgeTone: "border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300",
    primitives: ["RPC", "Events", "Jobs", "Workflows", "Streams"],
    filename: "main.go",
    code: `package main

import (
  "context"
  "log"

  sb "github.com/servicebridge/sdk-go"
)

func main() {
  // Connect: control plane address + service key + service name
  client, err := sb.New("127.0.0.1:14445", serviceKey, "payments")
  if err != nil {
    log.Fatal(err)
  }

  // RPC handler — direct gRPC, context carries trace
  client.HandleRpc("payments.charge", func(ctx context.Context, payload map[string]any) (any, error) {
    txId, err := stripe.Charge(ctx, payload)
    if err != nil {
      return nil, err
    }
    return map[string]any{"txId": txId, "ok": true}, nil
  })

  // Event consumer with retry
  client.HandleEvent("order.created", func(ctx context.Context, payload map[string]any, ectx sb.EventContext) error {
    if err := processOrder(ctx, payload); err != nil {
      ectx.Retry(30_000)  // retry in 30s
    }
    return nil
  }, sb.WithGroupName("payments:process"))

  // Scheduled job — cron or one-shot
  client.Job("reports.daily", sb.JobOpts{Cron: "0 9 * * *", Via: "rpc"})

  // Multi-step workflow with parallel steps
  client.Workflow("checkout.flow", []sb.WorkflowStep{
    {ID: "charge",  Type: "rpc",   Ref: "payments.charge",   Deps: []string{}},
    {ID: "reserve", Type: "rpc",   Ref: "inventory.reserve", Deps: []string{}},
    {ID: "confirm", Type: "event", Ref: "order.confirmed",   Deps: []string{"charge", "reserve"}},
  })

  log.Fatal(client.Serve())
}`,
  },
  {
    id: "python",
    label: "Python",
    badge: "Full SDK",
    badgeTone: "border-yellow-500/20 bg-yellow-500/[0.08] text-yellow-300",
    primitives: ["RPC", "Events", "Jobs", "Workflows", "Streams"],
    filename: "app.py",
    code: `import asyncio
from servicebridge import ServiceBridge

# Connect: control plane address + service key + service name
sb = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "notify")

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
await sb.job("reports.daily", cron="0 9 * * *", via="rpc")

# Multi-step workflow with parallel steps
await sb.workflow("checkout.flow", [
    {"id": "charge",  "type": "rpc",   "ref": "payments.charge",   "deps": []},
    {"id": "reserve", "type": "rpc",   "ref": "inventory.reserve", "deps": []},
    {"id": "confirm", "type": "event", "ref": "order.confirmed",   "deps": ["charge", "reserve"]},
])

asyncio.run(sb.serve())`,
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

// ─── Auto-instrumentation callout data ────────────────────────────────────────

const AUTO_FEATURES = [
  {
    icon: Activity,
    title: "Auto-traced",
    desc: "Every RPC, event, and job creates spans automatically. No manual OpenTelemetry instrumentation.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Auto mTLS",
    desc: "SDK generates ECDSA keypair locally, provisions cert from control plane on first connect.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: Globe,
    title: "Auto logs",
    desc: "console.log, slog, and Python logging captured and correlated with trace IDs out of the box.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    title: "Auto discovery",
    desc: "Callers resolve endpoints lazily. No service URLs, no env vars per downstream — just function names.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
] as const;

export function CodeSection() {
  const { lang, setLang } = useSdkLang();
  const activeLang: LangId = SDK_TO_LANG[lang] ?? "typescript";
  const tab = LANG_TABS.find((t) => t.id === activeLang) ?? LANG_TABS[0];

  return (
    <Section id="code" className="border-y">
      <SectionHeader
        eyebrow="Developer Experience"
        title={
          <>
            One SDK across languages.{" "}
            <span className="text-gradient">Zero manual instrumentation.</span>
          </>
        }
        subtitle="TypeScript, Go, and Python — full feature parity across all three SDKs. RPC, events, jobs, workflows, and streams with the same wire format, traces, and mTLS. No extra config per language."
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] max-w-6xl mx-auto">
          {/* Left: tabbed code panel */}
          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/20"
          >
            {/* Lang tab bar */}
            <div className="border-b border-white/[0.06] bg-[#080d18] px-4 py-3">
              <TabStrip
                size="md"
                items={LANG_TABS}
                active={activeLang}
                onChange={(id) => setLang(LANG_TO_SDK[id])}
                className="mb-3"
              />

            </div>

            <div className="p-5">
              <CodeBlock code={tab.code} filename={tab.filename} lang={lang} />
            </div>
          </motion.div>

          {/* Right: DX description + auto-instrumentation */}
          <motion.div variants={fadeInUp} className="space-y-4">
            {/* Main callout */}
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
              <p className="type-overline-mono text-zinc-500">developer model</p>
              <h2 className="mt-2 text-2xl font-semibold font-display">
                Same patterns across the whole stack.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                All three SDKs ship with the full feature set — RPC, events, jobs, workflows, realtime
                streams, and inline Protobuf schema. Same auth model, same tracing, same retry
                semantics across TypeScript, Go, and Python.
              </p>

              {/* SDK comparison */}
              <div className="mt-5 rounded-3xl border border-white/[0.06] bg-[#081018] p-4">
                <p className="type-overline-mono text-zinc-500 mb-3">sdk feature matrix</p>
                <div className="space-y-2">
                  {[
                    {
                      feature: "RPC + Events",
                      ts: true,
                      go: true,
                      py: true,
                    },
                    {
                      feature: "Jobs + Workflows",
                      ts: true,
                      go: true,
                      py: true,
                    },
                    {
                      feature: "Realtime streams",
                      ts: true,
                      go: true,
                      py: true,
                    },
                    {
                      feature: "Auto mTLS",
                      ts: true,
                      go: true,
                      py: true,
                    },
                    {
                      feature: "Auto log capture",
                      ts: true,
                      go: true,
                      py: true,
                    },
                    {
                      feature: "HTTP middleware",
                      ts: true,
                      go: true,
                      py: true,
                    },
                  ].map((row) => (
                    <div
                      key={row.feature}
                      className="grid grid-cols-[minmax(0,1fr)_repeat(3,32px)] gap-2 items-center"
                    >
                      <span className="text-xs text-zinc-400">{row.feature}</span>
                      {[
                        { val: row.ts, label: "TS" },
                        { val: row.go, label: "Go" },
                        { val: row.py, label: "Py" },
                      ].map(({ val, label }) => (
                        <div key={label} className="flex justify-center">
                          {val ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span className="w-3.5 h-3.5 flex items-center justify-center text-zinc-700 text-xs">
                              —
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-3xs font-mono text-zinc-600">
                  <span className="text-center">TypeScript</span>
                  <span className="text-center">Go</span>
                  <span className="text-center">Python</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <FlowTile label="start mode" value="JSON first" tone="text-blue-300" />
                <FlowTile label="upgrade" value="optional schema" tone="text-emerald-300" />
                <FlowTile label="cost" value="no .proto files" tone="text-violet-300" />
              </div>
            </div>

            {/* Auto-instrumentation grid */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="type-overline-mono text-zinc-500 mb-4">automatic by default</p>
              <div className="grid grid-cols-2 gap-3">
                {AUTO_FEATURES.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-3"
                  >
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0",
                        item.bg
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold font-display">{item.title}</p>
                      <p className="text-3xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick start strip */}
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniCard
                icon={Terminal}
                title="One command to start"
                desc="docker compose up -d starts the control plane and Postgres. npm install @servicebridge/sdk gets the TypeScript SDK."
                iconClassName="text-emerald-400"
              />
              <MiniCard
                icon={Shield}
                title="Type-safe payloads"
                desc="Full TypeScript inference on request and response shapes. Add opts.schema for Protobuf encoding when needed."
                iconClassName="text-blue-400"
              />
            </div>
          </motion.div>
        </div>
      </Section>
    );
  }
