import { motion } from "framer-motion";
import { Activity, CheckCircle2, Globe, Shield, Terminal } from "lucide-react";
import { useState } from "react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";

const RPC_TABS = [
  {
    label: "Basic",
    filename: "orders-service.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", "service-key", "orders");

// Define a handler
sb.handleRpc("orders.create", async (payload) => {
  const order = await db.insert(payload);
  return { id: order.id, status: "created" };
});

// Call it from anywhere — direct gRPC, 0 hops
const result = await sb.rpc("orders.create", {
  items: ["item_1"],
  amount: 4990,
});

await sb.serve();`,
    plates: [
      { title: "No schema", items: ["JSON encoding", "Zero setup"], variant: "muted" as const },
    ],
  },
  {
    label: "With schema",
    filename: "payments-service.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", "service-key", "payments");

// opts.schema — optional, enables Protobuf encoding
sb.handleRpc("payments.charge", async (payload) => {
  const { userId, amount, currency } = payload as any;
  return { txId: "tx_" + Date.now(), ok: true };
}, {
  schema: {
    input: {
      userId:   { type: "string", id: 1 },
      amount:   { type: "int64",  id: 2 },
      currency: { type: "string", id: 3 },
    },
    output: {
      txId: { type: "string", id: 1 },
      ok:   { type: "bool",   id: 2 },
    },
  },
});

await sb.serve();`,
    plates: [
      {
        title: "With schema",
        items: ["Protobuf (5x smaller)", "Auto validation"],
        variant: "primary" as const,
      },
    ],
  },
];

const CODE_TABS = [
  {
    label: "RPC",
    rpc: true as const,
    filename: "",
    code: "",
    plates: [] as { title: string; items: string[]; variant: "muted" | "primary" }[],
  },
  {
    label: "Events",
    rpc: false as const,
    filename: "notifications.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", "service-key", "notify");

// Subscribe to events with pattern matching
sb.handleEvent("order.created", async (payload, ctx) => {
  await sendConfirmationEmail(payload);
});

// Handle failures with retry
sb.handleEvent("payment.failed", async (payload, ctx) => {
  const sent = await mailer.send(payload);
  if (!sent) ctx.retry(30_000);
});

// Publish events (durable, at-least-once)
await sb.event("order.created", {
  orderId: "ord_123",
  amount: 4990,
});`,
    plates: [
      {
        title: "Events",
        items: ["Pattern matching", "At-least-once delivery", "ctx.retry()"],
        variant: "primary" as const,
      },
    ],
  },
  {
    label: "Jobs",
    rpc: false as const,
    filename: "scheduler.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", "service-key", "reports");

// Cron job — runs daily at 9 AM UTC
await sb.job("reports.generate", {
  cron: "0 9 * * *",
  timezone: "UTC",
  via: "rpc",
  misfire: "fire_now",
});

// Delayed one-shot — runs in 24 hours
await sb.job("email.reminder", {
  delay: 24 * 60 * 60 * 1000,
  via: "event",
});`,
    plates: [
      {
        title: "Jobs",
        items: ["Cron & one-shot", "Misfire handling", "via: rpc | event | workflow"],
        variant: "primary" as const,
      },
    ],
  },
  {
    label: "Workflows",
    rpc: false as const,
    filename: "workflows.ts",
    code: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", "service-key", "platform");

// Define a multi-step workflow
await sb.workflow("user.onboarding", [
  { type: "rpc",   ref: "user.create" },
  { type: "event", ref: "email.welcome" },
  { type: "rpc",   ref: "crm.sync" },
  { type: "event", ref: "analytics.signup" },
]);

// Trigger as a scheduled job
await sb.job("user.onboarding", {
  via: "workflow",
  cron: "0 * * * *",
});`,
    plates: [
      {
        title: "Workflows",
        items: ["Multi-step saga", "Chain rpc + event", "Persisted state"],
        variant: "primary" as const,
      },
    ],
  },
];

const HIGHLIGHTS = [
  { icon: Terminal, label: "One command to start", desc: "bun run dev" },
  { icon: Shield, label: "Type-safe payloads", desc: "Full TypeScript inference" },
  { icon: Activity, label: "Auto tracing", desc: "Built-in OpenTelemetry" },
  { icon: Globe, label: "Framework agnostic", desc: "Express, Fastify, standalone" },
];

const PRINCIPLES = [
  { label: "Start mode", value: "JSON first", tone: "text-blue-300" },
  { label: "Upgrade path", value: "Optional schema", tone: "text-emerald-300" },
  { label: "Developer cost", value: "No .proto files", tone: "text-violet-300" },
];

function PlateCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "muted" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        variant === "muted"
          ? "border-white/[0.06] bg-white/[0.02]"
          : "border-emerald-400/20 bg-emerald-400/[0.04]"
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            variant === "muted" ? "text-blue-400" : "text-emerald-400"
          )}
        />
        <span
          className={cn(
            "text-xs font-medium",
            variant === "muted" ? "text-zinc-300" : "text-emerald-400"
          )}
        >
          {title}
        </span>
      </div>
      <ul className="space-y-1.5 text-2xs">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                variant === "muted" ? "bg-blue-400" : "bg-emerald-400"
              )}
            />
            <span className={variant === "muted" ? "text-zinc-400" : "text-zinc-300"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CodeSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [rpcSubTab, setRpcSubTab] = useState(0);

  const isRpc = CODE_TABS[activeTab].rpc;
  const displayTab = isRpc ? RPC_TABS[rpcSubTab] : CODE_TABS[activeTab];
  const activeSummary = isRpc
    ? {
        title: "One RPC API, two serialization modes.",
        desc: "Start with plain JSON. When you want tighter payloads and validation, add `opts.schema` and the same handler switches to Protobuf encoding.",
      }
    : {
        title: `${displayTab.label} stays inside the same SDK.`,
        desc: "The syntax changes only where the communication pattern changes. Traces, auth, and runtime behavior stay consistent across primitives.",
      };

  return (
    <AnimatedSection className="py-24 border-y border-white/[0.04]" id="code">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Developer Experience"
          title={
            <>
              JSON first. <span className="text-gradient">Protobuf when you need it.</span>
            </>
          }
          subtitle="One TypeScript SDK for RPC, events, jobs, and workflows. Minimal setup in day one, optional structure when the system grows."
        />

        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr] max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
              <p className="type-overline-mono text-zinc-500">developer model</p>
              <h3 className="mt-2 text-2xl font-semibold font-display">{activeSummary.title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {activeSummary.desc}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {PRINCIPLES.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <p className="type-overline-mono text-zinc-500">{item.label}</p>
                    <p className={cn("mt-2 text-sm font-semibold font-display", item.tone)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => (
                <MiniCard key={item.label} icon={item.icon} title={item.label} desc={item.desc} />
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/20"
          >
            <div className="border-b border-white/[0.06] bg-[#080d18] px-5 py-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 w-fit">
                  {CODE_TABS.map((tab, i) => (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === i
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isRpc && (
                  <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 w-fit">
                    {RPC_TABS.map((tab, i) => (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => setRpcSubTab(i)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          rpcSubTab === i
                            ? "bg-white/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {displayTab.plates.map((plate) => (
                    <span
                      key={plate.title}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-3xs font-mono font-semibold",
                        plate.variant === "muted"
                          ? "border-blue-500/20 bg-blue-500/[0.08] text-blue-300"
                          : "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                      )}
                    >
                      {plate.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_228px]">
              <div className="min-w-0">
                <CodeBlock code={displayTab.code} filename={displayTab.filename} />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="type-overline-mono text-zinc-500">why it lands well</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    The SDK keeps the surface area compact, so switching between primitives feels
                    like moving within one product instead of adopting four libraries.
                  </p>
                </div>

                {displayTab.plates.map((plate) => (
                  <PlateCard
                    key={`${displayTab.label}-${plate.title}`}
                    title={plate.title}
                    items={plate.items}
                    variant={plate.variant}
                  />
                ))}

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="type-overline-mono text-zinc-500">current view</p>
                  <p className="mt-2 text-sm font-semibold font-display">{displayTab.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isRpc
                      ? "Compare the same RPC handler with and without schema, without changing the mental model."
                      : `The ${displayTab.label.toLowerCase()} example uses the same connection, auth, and tracing story as the rest of the platform.`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
