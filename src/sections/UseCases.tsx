import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, Bell, GitMerge, Radio, Waves, Zap } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

// ── Primitives ────────────────────────────────────────────────────────────────

function ServiceNode({
  label,
  sub,
  colorClass = "border-surface-border bg-surface text-zinc-200",
  className,
}: {
  label: string;
  sub?: string;
  colorClass?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-3 py-2.5 text-center", colorClass, className)}>
      <p className="type-body-sm font-semibold font-display leading-tight whitespace-nowrap">
        {label}
      </p>
      {sub && <p className="type-overline-mono text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Hub({ sub, className }: { sub?: string; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.05] px-4 py-3 text-center subtle-glow",
        className
      )}
    >
      <BrandMark className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
      <p className="type-body-sm font-bold font-display text-emerald-400">ServiceBridge</p>
      {sub && <p className="type-overline-mono text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/**
 * Horizontal animated arrow line.
 * Dot travels along the horizontal centre of the container.
 * Line: absolute, at exactly 50% vertically.
 * Dot: same vertical centre, travels left→right (or reversed).
 */
function HArrow({
  dotColor = "bg-yellow-400",
  lineColor = "border-yellow-500/30",
  delay = 0,
  reversed = false,
  className,
}: {
  dotColor?: string;
  lineColor?: string;
  delay?: number;
  reversed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 relative h-10 overflow-hidden min-w-[28px]", className)}>
      {/* Line: centred vertically */}
      <div
        className={cn("absolute inset-x-0 top-1/2 h-px border-t border-dashed", lineColor)}
        style={{ transform: "translateY(-0.5px)" }}
      />
      {/* Dot: centred on line, travels horizontally */}
      <div
        className={cn("absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full", dotColor)}
        style={{
          left: reversed ? "calc(100% + 4px)" : "-4px",
          animation: `${reversed ? "harrow-rev" : "harrow-fwd"} ${1.6}s linear ${delay}s infinite`,
        }}
      />
    </div>
  );
}

/**
 * Vertical animated arrow line.
 * Place inside any container — line and dot are centred horizontally.
 * Pass `className` to control width and height (e.g. "w-6 h-10").
 */
function VLine({
  dotColor = "bg-blue-400",
  lineColor = "border-blue-500/30",
  delay = 0,
  className,
}: {
  dotColor?: string;
  lineColor?: string;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Line: exactly centred horizontally */}
      <div
        className={cn("absolute inset-y-0 left-1/2 w-px border-l border-dashed", lineColor)}
        style={{ transform: "translateX(-0.5px)" }}
      />
      {/* Dot: centred on line, travels vertically */}
      <motion.div
        className={cn("absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full", dotColor)}
        animate={{ top: ["-4px", "calc(100% + 4px)"] }}
        transition={{ repeat: Infinity, duration: 1.0, ease: "linear", delay }}
      />
    </div>
  );
}

/**
 * Fan-out from a full-width hub to N children.
 * Each child gets an equal flex-1 column. The vertical line is centred
 * within its column so it lines up directly below the hub.
 */
function FanDown({
  nodes,
  dotColor,
  lineColor,
  arrowHeightClass = "h-10",
}: {
  nodes: Array<{ label: string; sub: string; colorClass: string }>;
  dotColor: string;
  lineColor: string;
  arrowHeightClass?: string;
}) {
  return (
    <div className="w-full">
      {/* Arrow row — each cell = flex-1, line centred inside */}
      <div className="flex">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex-1">
            <VLine
              dotColor={dotColor}
              lineColor={lineColor}
              delay={i * 0.28}
              className={cn("w-full", arrowHeightClass)}
            />
          </div>
        ))}
      </div>
      {/* Node row — each node centred in its flex-1 column */}
      <div className="flex gap-2">
        {nodes.map((node) => (
          <div key={node.label} className="flex-1 flex justify-center">
            <ServiceNode
              label={node.label}
              sub={node.sub}
              colorClass={node.colorClass}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Diagrams ──────────────────────────────────────────────────────────────────

function RpcDiagram() {
  return (
    <div className="space-y-5">
      {/* Direct data path */}
      <div className="flex items-center gap-1">
        <ServiceNode
          label="Auth Service"
          sub="caller"
          colorClass="border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-200"
        />
        <HArrow dotColor="bg-yellow-400" lineColor="border-yellow-500/30" delay={0} />
        <ServiceNode
          label="User Service"
          sub="callee"
          colorClass="border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-200"
        />
      </div>

      {/* Control-plane box */}
      <div className="relative rounded-xl border border-surface-border bg-surface p-4 pt-6">
        <p className="absolute -top-2.5 left-4 type-overline-mono text-muted-foreground bg-background px-1.5">
          control plane — discovery only
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="type-overline-mono text-muted-foreground text-right">registration</p>
            <HArrow
              dotColor="bg-zinc-600"
              lineColor="border-zinc-700/50"
              delay={0.3}
              className="h-7 flex-none w-full"
            />
          </div>
          <Hub sub="registry" />
          <div className="flex-1 space-y-1">
            <p className="type-overline-mono text-muted-foreground">endpoint lookup</p>
            <HArrow
              dotColor="bg-zinc-600"
              lineColor="border-zinc-700/50"
              delay={0.9}
              reversed
              className="h-7 flex-none w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap">
        <Badge tone="text-yellow-400 bg-yellow-400/10 border-yellow-400/20">0 proxy hops</Badge>
        <Badge tone="text-violet-400 bg-violet-400/10 border-violet-400/20">
          mTLS cert identity
        </Badge>
        <Badge tone="text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
          round-robin LB
        </Badge>
      </div>
    </div>
  );
}

function EventFanOutDiagram() {
  const subscribers = [
    {
      label: "Payment",
      sub: "subscriber",
      colorClass: "border-blue-500/20 bg-blue-500/[0.06] text-blue-200",
    },
    {
      label: "Inventory",
      sub: "subscriber",
      colorClass: "border-blue-500/20 bg-blue-500/[0.06] text-blue-200",
    },
    {
      label: "Notify",
      sub: "subscriber",
      colorClass: "border-blue-500/20 bg-blue-500/[0.06] text-blue-200",
    },
  ];

  return (
    <div className="space-y-0">
      {/* Publisher — centred */}
      <div className="flex justify-center">
        <ServiceNode
          label="Order Service"
          sub="publisher"
          colorClass="border-blue-500/20 bg-blue-500/[0.06] text-blue-200"
          className="min-w-[140px]"
        />
      </div>

      {/* Single arrow down, with inline label */}
      <div className="relative flex justify-center h-10">
        <VLine
          dotColor="bg-blue-400"
          lineColor="border-blue-500/30"
          delay={0}
          className="w-6 h-full"
        />
        <span className="absolute left-1/2 translate-x-3 top-1/2 -translate-y-1/2 text-3xs font-mono text-blue-400/60 whitespace-nowrap">
          event: order.placed
        </span>
      </div>

      {/* Hub — full width */}
      <Hub sub="at-least-once delivery" className="w-full" />

      {/* Fan-out to all subscribers */}
      <FanDown nodes={subscribers} dotColor="bg-blue-400" lineColor="border-blue-500/30" />

      <div className="flex justify-center gap-1.5 flex-wrap pt-4">
        <Badge tone="text-blue-400 bg-blue-400/10 border-blue-400/20">wildcard topics</Badge>
        <Badge tone="text-red-400 bg-red-400/10 border-red-400/20">DLQ + replay</Badge>
        <Badge tone="text-orange-400 bg-orange-400/10 border-orange-400/20">
          filter expressions
        </Badge>
      </div>
    </div>
  );
}

function StreamDiagram() {
  const tokens = [
    "Building",
    "distributed",
    "systems",
    "at",
    "scale",
    "demands",
    "reliable",
    "communication.",
    "ServiceBridge",
    "handles",
    "events",
    "with",
    "at-least-once",
    "delivery,",
    "direct",
    "gRPC",
    "calls",
    "with",
    "zero",
    "proxy",
    "hops,",
    "and",
    "real-time",
    "streaming",
    "for",
    "any",
    "handler",
    "output.",
    "Every",
    "message",
    "is",
    "backed",
    "by",
    "PostgreSQL",
    "—",
    "replayable,",
    "durable,",
    "inspectable.",
    "Dead-letter",
    "queues",
    "catch",
    "failures",
    "automatically.",
    "Retry",
    "policies,",
    "exponential",
    "backoff,",
    "and",
    "compensation",
    "handlers",
    "built",
    "in.",
    "One",
    "binary.",
    "Every",
    "pattern.",
    "✓",
  ];
  const tokenEntries = tokens.reduce<Array<{ key: string; token: string; delay: number }>>(
    (acc, token) => {
      const duplicates = acc.filter((entry) => entry.token === token).length;
      acc.push({
        key: `token-${token}-${duplicates}`,
        token,
        delay: acc.length * 0.07,
      });
      return acc;
    },
    []
  );

  return (
    <div className="space-y-5">
      {/* Horizontal chain */}
      <div className="flex items-center gap-1">
        <ServiceNode
          label="AI Worker"
          sub="LLM call"
          colorClass="border-sky-500/20 bg-sky-500/[0.06] text-sky-200"
        />
        <HArrow dotColor="bg-sky-400" lineColor="border-sky-500/30" delay={0} />
        <Hub sub="chunk store + push" />
        <HArrow dotColor="bg-sky-400" lineColor="border-sky-500/30" delay={0.5} />
        <ServiceNode
          label="Browser / SDK"
          sub="subscriber"
          colorClass="border-sky-500/20 bg-sky-500/[0.06] text-sky-200"
        />
      </div>

      {/* Live token preview */}
      <div className="rounded-xl border border-sky-500/15 bg-zinc-950/70 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-sky-500/15 bg-background/40">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-3xs font-mono text-muted-foreground/70">
            sb.watchTrace(traceId, "output")
          </span>
          <span className="ml-auto flex items-center gap-1 text-3xs font-mono text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            live
          </span>
        </div>
        <div className="p-4 flex flex-wrap gap-1.5">
          {tokenEntries.map(({ key, token, delay }) => (
            <motion.span
              key={key}
              className="inline-block px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-300 text-xs font-mono"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay, duration: 0.15, ease: "easeOut" }}
            >
              {token}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap">
        <Badge tone="text-sky-400 bg-sky-400/10 border-sky-400/20">persisted chunks</Badge>
        <Badge tone="text-cyan-400 bg-cyan-400/10 border-cyan-400/20">late subscriber replay</Badge>
        <Badge tone="text-indigo-400 bg-indigo-400/10 border-indigo-400/20">
          LLM · progress · logs
        </Badge>
      </div>
    </div>
  );
}

function WorkflowDiagram() {
  const steps = [
    { label: "Charge", delay: 0 },
    { label: "Reserve", delay: 0.5 },
    { label: "Ship", delay: 1.0 },
  ];
  const stepSequence = steps.flatMap((step) => [
    <HArrow
      key={`${step.label}-arrow`}
      dotColor="bg-fuchsia-400"
      lineColor="border-fuchsia-500/30"
      delay={step.delay}
    />,
    <ServiceNode
      key={`${step.label}-node`}
      label={step.label}
      colorClass="border-fuchsia-500/20 bg-fuchsia-500/[0.06] text-fuchsia-200"
    />,
  ]);

  return (
    <div className="space-y-5">
      {/* Happy-path chain */}
      <div className="flex items-center gap-1">
        <div className="w-10 h-10 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/[0.06] flex items-center justify-center shrink-0">
          <span className="text-3xs font-mono text-fuchsia-400 font-bold">GO</span>
        </div>
        {stepSequence}
        <HArrow dotColor="bg-emerald-400" lineColor="border-emerald-500/30" delay={1.5} />
        <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] flex items-center justify-center shrink-0">
          <span className="text-3xs font-mono text-emerald-400 font-bold">OK</span>
        </div>
      </div>

      {/* Failure states */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3.5 text-center">
          <p className="type-overline-mono text-red-400/60 mb-1.5">on step failure</p>
          <p className="type-body-sm font-semibold text-red-300">Auto Retry</p>
          <p className="type-overline-mono text-muted-foreground mt-0.5">exponential backoff</p>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3.5 text-center">
          <p className="type-overline-mono text-amber-400/60 mb-1.5">after max retries</p>
          <p className="type-body-sm font-semibold text-amber-300">Compensation</p>
          <p className="type-overline-mono text-muted-foreground mt-0.5">rollback steps</p>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 flex-wrap">
        <Badge tone="text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20">
          code-defined steps
        </Badge>
        <Badge tone="text-violet-400 bg-violet-400/10 border-violet-400/20">
          state in PostgreSQL
        </Badge>
        <Badge tone="text-cyan-400 bg-cyan-400/10 border-cyan-400/20">full step trace</Badge>
      </div>
    </div>
  );
}

function ScheduledDiagram() {
  const workers = [
    {
      label: "Worker A",
      sub: "executes job",
      colorClass: "border-amber-500/20 bg-amber-500/[0.06] text-amber-200",
    },
    {
      label: "Worker B",
      sub: "executes job",
      colorClass: "border-amber-500/20 bg-amber-500/[0.06] text-amber-200",
    },
    {
      label: "Worker C",
      sub: "executes job",
      colorClass: "border-amber-500/20 bg-amber-500/[0.06] text-amber-200",
    },
  ];

  return (
    <div className="space-y-0">
      {/* Triggers — compact centred box */}
      <div className="flex justify-center">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-3 text-center">
          <p className="type-body-sm font-semibold font-display text-amber-300 leading-tight">
            Cron Triggers
          </p>
          <p className="type-overline-mono text-muted-foreground mt-0.5 mb-3">2 active schedules</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="type-body-sm font-mono font-semibold text-amber-200">*/5 min</p>
              <p className="type-overline-mono text-muted-foreground mt-0.5">interval job</p>
            </div>
            <div className="w-px bg-amber-500/20" />
            <div className="text-center">
              <p className="type-body-sm font-mono font-semibold text-amber-200">0 8 * * *</p>
              <p className="type-overline-mono text-muted-foreground mt-0.5">daily report</p>
            </div>
          </div>
        </div>
      </div>

      {/* Single arrow to hub */}
      <div className="flex justify-center h-10">
        <VLine
          dotColor="bg-amber-400"
          lineColor="border-amber-500/30"
          delay={0}
          className="w-6 h-full"
        />
      </div>

      {/* Hub — full width */}
      <Hub sub="scheduler + dispatcher" className="w-full" />

      {/* Fan-out to workers */}
      <FanDown nodes={workers} dotColor="bg-amber-400" lineColor="border-amber-500/30" />

      <div className="flex justify-center gap-1.5 flex-wrap pt-4">
        <Badge tone="text-amber-400 bg-amber-400/10 border-amber-400/20">cron + one-shot</Badge>
        <Badge tone="text-orange-400 bg-orange-400/10 border-orange-400/20">misfire handling</Badge>
        <Badge tone="text-yellow-400 bg-yellow-400/10 border-yellow-400/20">
          round-robin dispatch
        </Badge>
      </div>
    </div>
  );
}

function AlertsDiagram() {
  const channels = [
    {
      label: "Telegram",
      sub: "deep-link",
      colorClass: "border-red-500/20 bg-red-500/[0.06] text-red-200",
    },
    {
      label: "Webhook",
      sub: "POST /hook",
      colorClass: "border-red-500/20 bg-red-500/[0.06] text-red-200",
    },
    {
      label: "In-App",
      sub: "realtime push",
      colorClass: "border-red-500/20 bg-red-500/[0.06] text-red-200",
    },
  ];

  return (
    <div className="space-y-0">
      {/* Rules box — compact centred box */}
      <div className="flex justify-center">
        <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-6 py-3 text-center">
          <p className="type-body-sm font-semibold font-display text-red-300 leading-tight">
            Alert Rules
          </p>
          <p className="type-overline-mono text-muted-foreground mt-0.5 mb-3">
            condition evaluator
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["DLQ spike", "error rate > 5%", "service offline", "delivery failure"].map((r) => (
              <span
                key={r}
                className="text-3xs font-mono rounded-lg px-2 py-1 border border-red-500/20 bg-red-500/[0.06] text-red-300"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Single arrow to hub */}
      <div className="flex justify-center h-10">
        <VLine
          dotColor="bg-red-400"
          lineColor="border-red-500/30"
          delay={0}
          className="w-6 h-full"
        />
      </div>

      {/* Hub — full width */}
      <Hub sub="rule evaluator + cooldown" className="w-full" />

      {/* Fan-out to channels */}
      <FanDown nodes={channels} dotColor="bg-red-400" lineColor="border-red-500/30" />

      <div className="flex justify-center gap-1.5 flex-wrap pt-4">
        <Badge tone="text-red-400 bg-red-400/10 border-red-400/20">6 condition types</Badge>
        <Badge tone="text-orange-400 bg-orange-400/10 border-orange-400/20">storm cooldown</Badge>
        <Badge tone="text-amber-400 bg-amber-400/10 border-amber-400/20">multi-channel</Badge>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

type UseCaseItem = {
  id: string;
  label: string;
  desc: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  Diagram: () => ReactNode;
};

const USE_CASES: UseCaseItem[] = [
  {
    id: "rpc",
    label: "Direct RPC",
    desc: "Zero-hop gRPC calls between services. ServiceBridge handles discovery, mTLS cert identity, and load balancing — without touching the data path.",
    icon: Zap,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    Diagram: RpcDiagram,
  },
  {
    id: "events",
    label: "Event Fan-Out",
    desc: "Publish once, deliver to all matching subscribers. At-least-once delivery with wildcard topics, DLQ, and per-message replay.",
    icon: Radio,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    Diagram: EventFanOutDiagram,
  },
  {
    id: "streams",
    label: "LLM Streaming",
    desc: "Stream tokens from any worker to browser in real-time. Chunks are persisted — late subscribers replay from the start automatically.",
    icon: Waves,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    Diagram: StreamDiagram,
  },
  {
    id: "workflows",
    label: "Saga Workflows",
    desc: "Multi-step distributed transactions as code. Automatic retries, compensation handlers, and per-step tracing built in.",
    icon: GitMerge,
    iconBg: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-400",
    Diagram: WorkflowDiagram,
  },
  {
    id: "jobs",
    label: "Scheduled Jobs",
    desc: "Distributed cron and one-shot delayed jobs. Misfire handling and round-robin dispatch to all available workers.",
    icon: AlarmClock,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    Diagram: ScheduledDiagram,
  },
  {
    id: "alerts",
    label: "Smart Alerts",
    desc: "Rule-based alerts for DLQ spikes, error rates, and offline services. Delivered to Telegram, webhooks, and in-app with cooldown protection.",
    icon: Bell,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    Diagram: AlertsDiagram,
  },
];

// ── Section ───────────────────────────────────────────────────────────────────

export function UseCasesSection() {
  const [activeId, setActiveId] = useState("rpc");
  const active = USE_CASES.find((u) => u.id === activeId) ?? USE_CASES[0];
  if (!active) return null;

  return (
    <Section id="use-cases">
      <SectionHeader
        eyebrow="Use Cases"
        title="Built for every communication pattern"
        subtitle="From synchronous RPC to async events, streaming, and orchestration — one binary, one database, every pattern."
      />

      <div className="max-w-5xl mx-auto space-y-4">
        {/* Selector */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {USE_CASES.map((uc) => (
            <button
              key={uc.id}
              type="button"
              onClick={() => setActiveId(uc.id)}
              className={cn(
                "group relative text-left rounded-xl border p-4 cursor-pointer transition-all duration-200",
                activeId === uc.id
                  ? "border-white/[0.12] bg-surface"
                  : "border-surface-border bg-transparent hover:border-white/[0.09] hover:bg-surface"
              )}
            >
              <div
                className={cn(
                  "inline-flex w-8 h-8 rounded-lg items-center justify-center mb-3 ring-1 ring-white/[0.06]",
                  uc.iconBg
                )}
              >
                <uc.icon className={cn("w-4 h-4", uc.iconColor)} />
              </div>
              <p
                className={cn(
                  "type-body-sm font-semibold font-display transition-colors",
                  activeId === uc.id
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground/70"
                )}
              >
                {uc.label}
              </p>
              {activeId === uc.id && (
                <motion.span
                  layoutId="uc-active-ring"
                  className="absolute inset-0 rounded-xl ring-1 ring-white/[0.10] pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Diagram panel */}
        <motion.div
          variants={fadeInUp}
          className="rounded-2xl border border-surface-border bg-surface overflow-hidden"
        >
          <div className="flex items-start gap-3 px-6 py-4 border-b border-surface-border">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center ring-1 ring-white/[0.06] shrink-0 mt-0.5",
                active.iconBg
              )}
            >
              <active.icon className={cn("w-4 h-4", active.iconColor)} />
            </div>
            <div>
              <h3 className="type-subsection-title">{active.label}</h3>
              <p className="type-body-sm text-muted-foreground mt-0.5 leading-relaxed max-w-xl">
                {active.desc}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 sm:p-8"
            >
              <active.Diagram />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </Section>
  );
}
