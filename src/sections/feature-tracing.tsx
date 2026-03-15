import { motion, useInView } from "framer-motion";
import {
  Activity,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  GitBranch,
  Globe,
  Hourglass,
  Radio,
  RefreshCcw,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";
import { TabStrip } from "../ui/Tabs";

// ─── Types ───────────────────────────────────────────────────────────────────

type SpanType = "http" | "rpc" | "event" | "delivery" | "workflow" | "job" | "sleep" | "attempt";
type SpanStatus = "success" | "error" | "running" | "pending";
type Outcome = "ack" | "reject" | "dlq" | null;

interface Span {
  id: string;
  name: string;
  service: string;
  type: SpanType;
  status: SpanStatus;
  startPct: number;
  widthPct: number;
  durationMs: number;
  depth: number;
  outcome?: Outcome;
  retryCount?: number;
  attempt?: number;
}

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_CFG: Record<
  SpanType,
  { icon: React.ElementType; color: string; bg: string; bar: string }
> = {
  http: { icon: Globe, color: "text-indigo-400", bg: "bg-indigo-500/10", bar: "bg-indigo-500/85" },
  rpc: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", bar: "bg-blue-500/85" },
  event: {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500/85",
  },
  delivery: {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-400/85",
  },
  workflow: {
    icon: GitBranch,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    bar: "bg-fuchsia-500/85",
  },
  job: {
    icon: CalendarClock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    bar: "bg-amber-500/85",
  },
  sleep: {
    icon: Hourglass,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    bar: "bg-slate-400/85",
  },
  attempt: {
    icon: RefreshCcw,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    bar: "bg-orange-500/85",
  },
};

// ─── Span data — flat arrays ──────────────────────────────────────────────────

const HTTP_SPANS: Span[] = [
  {
    id: "h1",
    name: "POST /checkout",
    service: "gateway",
    type: "http",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 187,
    depth: 0,
  },
  {
    id: "h2",
    name: "orders.create",
    service: "orders",
    type: "rpc",
    status: "success",
    startPct: 1,
    widthPct: 30,
    durationMs: 56,
    depth: 1,
  },
  {
    id: "h2a",
    name: "db.insertOrder",
    service: "orders",
    type: "rpc",
    status: "success",
    startPct: 3,
    widthPct: 15,
    durationMs: 28,
    depth: 2,
  },
  {
    id: "h2b",
    name: "inventory.reserve",
    service: "inventory",
    type: "rpc",
    status: "success",
    startPct: 18,
    widthPct: 12,
    durationMs: 22,
    depth: 2,
  },
  {
    id: "h3",
    name: "order.created",
    service: "orders",
    type: "event",
    status: "success",
    startPct: 33,
    widthPct: 58,
    durationMs: 108,
    depth: 1,
  },
  {
    id: "h4",
    name: "order.created → payments",
    service: "payments",
    type: "delivery",
    status: "success",
    startPct: 34,
    widthPct: 28,
    durationMs: 52,
    depth: 2,
    outcome: "ack",
  },
  {
    id: "h5",
    name: "order.created → notify",
    service: "notify",
    type: "delivery",
    status: "success",
    startPct: 48,
    widthPct: 20,
    durationMs: 37,
    depth: 2,
    outcome: "ack",
    retryCount: 2,
  },
  {
    id: "h6",
    name: "order.created → analytics",
    service: "analytics",
    type: "delivery",
    status: "success",
    startPct: 34,
    widthPct: 6,
    durationMs: 11,
    depth: 2,
    outcome: "ack",
  },
];

const RPC_SPANS: Span[] = [
  {
    id: "r1",
    name: "payments.charge",
    service: "payments",
    type: "rpc",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 243,
    depth: 0,
    retryCount: 2,
  },
  {
    id: "r2",
    name: "payments.charge",
    service: "payments",
    type: "attempt",
    status: "error",
    startPct: 1,
    widthPct: 26,
    durationMs: 63,
    depth: 1,
    attempt: 1,
  },
  {
    id: "r3",
    name: "payments.charge",
    service: "payments",
    type: "attempt",
    status: "error",
    startPct: 30,
    widthPct: 26,
    durationMs: 64,
    depth: 1,
    attempt: 2,
  },
  {
    id: "r3a",
    name: "stripe.charge",
    service: "stripe-adapter",
    type: "rpc",
    status: "error",
    startPct: 32,
    widthPct: 22,
    durationMs: 54,
    depth: 2,
  },
  {
    id: "r4",
    name: "payments.charge",
    service: "payments",
    type: "attempt",
    status: "success",
    startPct: 60,
    widthPct: 38,
    durationMs: 91,
    depth: 1,
    attempt: 3,
  },
  {
    id: "r4a",
    name: "stripe.charge",
    service: "stripe-adapter",
    type: "rpc",
    status: "success",
    startPct: 62,
    widthPct: 32,
    durationMs: 77,
    depth: 2,
  },
];

const EVENT_SPANS: Span[] = [
  {
    id: "e1",
    name: "order.created",
    service: "orders",
    type: "event",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 312,
    depth: 0,
  },
  {
    id: "e2",
    name: "order.created → analytics",
    service: "analytics",
    type: "delivery",
    status: "success",
    startPct: 2,
    widthPct: 8,
    durationMs: 25,
    depth: 1,
    outcome: "ack",
  },
  {
    id: "e3",
    name: "order.created → notify.email",
    service: "notify",
    type: "delivery",
    status: "success",
    startPct: 2,
    widthPct: 22,
    durationMs: 69,
    depth: 1,
    outcome: "ack",
    retryCount: 2,
  },
  {
    id: "e3a",
    name: "notify.email",
    service: "notify",
    type: "attempt",
    status: "error",
    startPct: 4,
    widthPct: 8,
    durationMs: 25,
    depth: 2,
    attempt: 1,
  },
  {
    id: "e3b",
    name: "notify.email",
    service: "notify",
    type: "attempt",
    status: "success",
    startPct: 14,
    widthPct: 9,
    durationMs: 28,
    depth: 2,
    attempt: 2,
  },
  {
    id: "e4",
    name: "order.created → billing.invoice",
    service: "billing",
    type: "delivery",
    status: "error",
    startPct: 2,
    widthPct: 95,
    durationMs: 296,
    depth: 1,
    outcome: "dlq",
  },
  {
    id: "e4a",
    name: "billing.invoice",
    service: "billing",
    type: "attempt",
    status: "error",
    startPct: 4,
    widthPct: 14,
    durationMs: 44,
    depth: 2,
    attempt: 1,
  },
  {
    id: "e4b",
    name: "billing.invoice",
    service: "billing",
    type: "attempt",
    status: "error",
    startPct: 34,
    widthPct: 14,
    durationMs: 43,
    depth: 2,
    attempt: 2,
  },
];

const WORKFLOW_SPANS: Span[] = [
  {
    id: "w1",
    name: "merchant.onboarding",
    service: "platform",
    type: "workflow",
    status: "running",
    startPct: 0,
    widthPct: 100,
    durationMs: 1842,
    depth: 0,
  },
  {
    id: "w2",
    name: "merchant.validate",
    service: "merchants",
    type: "rpc",
    status: "success",
    startPct: 1,
    widthPct: 8,
    durationMs: 147,
    depth: 1,
  },
  {
    id: "w3",
    name: "kyc.check",
    service: "kyc",
    type: "rpc",
    status: "success",
    startPct: 10,
    widthPct: 20,
    durationMs: 368,
    depth: 1,
  },
  {
    id: "w4",
    name: "billing.setup",
    service: "billing",
    type: "rpc",
    status: "success",
    startPct: 10,
    widthPct: 15,
    durationMs: 277,
    depth: 1,
  },
  {
    id: "w5",
    name: "merchant.create",
    service: "merchants",
    type: "rpc",
    status: "success",
    startPct: 31,
    widthPct: 12,
    durationMs: 221,
    depth: 1,
  },
  {
    id: "w6",
    name: "email.welcome",
    service: "notify",
    type: "event",
    status: "success",
    startPct: 44,
    widthPct: 6,
    durationMs: 110,
    depth: 1,
  },
  {
    id: "w7",
    name: "wait 24h",
    service: "platform",
    type: "sleep",
    status: "running",
    startPct: 51,
    widthPct: 48,
    durationMs: 86400000,
    depth: 1,
  },
];

const TRACE_TABS = [
  {
    id: "http",
    label: "HTTP",
    desc: "HTTP → RPC chain → event fan-out",
    totalMs: "187ms",
    spanCount: 8,
    color: "text-indigo-400",
    data: HTTP_SPANS,
  },
  {
    id: "rpc",
    label: "RPC",
    desc: "Direct RPC with 2 retries → success",
    totalMs: "243ms",
    spanCount: 6,
    color: "text-blue-400",
    data: RPC_SPANS,
  },
  {
    id: "event",
    label: "Event",
    desc: "Publish → 3 subscribers, 1 retry, 1 DLQ",
    totalMs: "312ms",
    spanCount: 8,
    color: "text-emerald-400",
    data: EVENT_SPANS,
  },
  {
    id: "workflow",
    label: "Workflow",
    desc: "DAG: validate → parallel → sleep",
    totalMs: "~24h",
    spanCount: 7,
    color: "text-fuchsia-400",
    data: WORKFLOW_SPANS,
  },
] as const;

type TabId = (typeof TRACE_TABS)[number]["id"];

// ─── Span row ────────────────────────────────────────────────────────────────

function SpanRow({ span, index, revealed }: { span: Span; index: number; revealed: boolean }) {
  const cfg = TYPE_CFG[span.type];
  const Icon = cfg.icon;

  const barColor =
    span.status === "error"
      ? "bg-red-500/75"
      : span.status === "running"
        ? "bg-amber-400/75 animate-pulse"
        : span.status === "pending"
          ? "bg-amber-400/50"
          : cfg.bar;

  const nameColor =
    span.status === "error"
      ? "text-red-400"
      : span.status === "running"
        ? "text-amber-300"
        : span.status === "pending"
          ? "text-muted-foreground/70"
          : "text-zinc-200";

  const StatusIndicator = () => {
    if (span.status === "error") return <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
    if (span.status === "running")
      return <Clock3 className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />;
    if (span.status === "pending") return <Clock3 className="w-3 h-3 text-amber-400/60 shrink-0" />;
    return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
  };

  const OutcomeBadge = () => {
    if (!span.outcome) return null;
    const cfg = {
      ack: {
        icon: CheckCircle2,
        tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        label: "ack",
      },
      reject: {
        icon: XCircle,
        tone: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        label: "reject",
      },
      dlq: { icon: Ban, tone: "text-rose-400 bg-rose-500/10 border-rose-500/20", label: "dlq" },
    }[span.outcome];
    const I = cfg.icon;
    return (
      <Badge tone={cfg.tone}>
        <I className="w-2.5 h-2.5" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group hover:bg-surface transition-colors"
    >
      <div className="grid [grid-template-columns:44%_1fr]">
        {/* Name column */}
        <div
          className="flex items-center gap-1.5 py-1.5 pr-2 border-r border-surface-border"
          style={{ paddingLeft: `${10 + span.depth * 16}px` }}
        >
          <span className={cn("rounded p-0.5 shrink-0", cfg.bg)}>
            <Icon className={cn("w-2.5 h-2.5", cfg.color)} />
          </span>
          <span className={cn("type-body-sm truncate flex-1", nameColor)}>{span.name}</span>
          <Badge tone={cn(cfg.bg, cfg.color)}>{span.service}</Badge>
        </div>

        {/* Waterfall column */}
        <div className="relative flex items-center px-2 py-1.5">
          <div className="absolute inset-x-2 h-3 rounded-full bg-surface">
            <motion.div
              initial={{ width: 0 }}
              animate={revealed ? { width: `${Math.max(span.widthPct, 0.8)}%` } : { width: 0 }}
              transition={{ duration: 0.5, delay: index * 0.04 + 0.1, ease: "easeOut" }}
              className={cn("absolute h-full rounded-full", barColor)}
              style={{ left: `${span.startPct}%` }}
            />
          </div>
          <div className="absolute right-2 flex items-center gap-1.5">
            {span.retryCount && (
              <span className="inline-flex items-center gap-0.5 type-overline-mono text-orange-400">
                <RefreshCcw className="w-2.5 h-2.5" />
                {span.retryCount}
              </span>
            )}
            {span.attempt && (
              <span className="type-overline-mono text-orange-400">#{span.attempt}</span>
            )}
            <span className="type-overline-mono text-muted-foreground/60 bg-surface px-1 py-0.5 rounded-xl tabular-nums">
              {span.durationMs >= 3600000 ? "~24h" : `${span.durationMs}ms`}
            </span>
            <StatusIndicator />
            <OutcomeBadge />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function TracingSection() {
  const [activeTab, setActiveTab] = useState<TabId>("http");
  const [revealCount, setRevealCount] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const tab = TRACE_TABS.find((t) => t.id === activeTab) ?? TRACE_TABS[0];

  useEffect(() => {
    setRevealCount(0);
    if (!isInView) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealCount(tab.data.length);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealCount(i);
      if (i >= tab.data.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [activeTab, isInView, tab.data.length]);

  return (
    <Section id="tracing">
      <SectionHeader
        eyebrow="Unified Tracing"
        title="Every primitive, one waterfall."
        subtitle="HTTP, RPC, events, workflows, retries — all traced automatically. The same format used in the real dashboard, right here."
      />

      <div ref={sectionRef}>
        <TabStrip
          size="md"
          items={TRACE_TABS}
          active={activeTab}
          onChange={setActiveTab}
          className="mb-4"
        />

        <CodePanel title="ServiceBridge — Trace Waterfall">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="type-body-sm text-muted-foreground">{tab.desc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="type-overline-mono text-muted-foreground/60 bg-surface px-2 py-0.5 rounded-xl">
                {tab.spanCount} spans
              </span>
              <span className="type-overline-mono text-muted-foreground/60 bg-surface px-2 py-0.5 rounded-xl">
                {tab.totalMs}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid [grid-template-columns:44%_1fr] border-b border-surface-border bg-code-chrome">
                <div className="px-3 py-1.5 type-overline-mono text-muted-foreground/60">
                  Operation
                </div>
                <div className="px-2 py-1.5 type-overline-mono text-muted-foreground/60 border-l border-surface-border">
                  Timeline
                </div>
              </div>

              <div className="min-h-[280px]">
                {tab.data.map((span, i) => (
                  <SpanRow key={span.id} span={span} index={i} revealed={i < revealCount} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-surface-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 type-overline-mono text-muted-foreground/60 bg-code-chrome">
            <span>
              trace_id: <span className={cn("font-semibold", tab.color)}>a1b2c3d4e5f6</span>
            </span>
            <div className="flex items-center gap-4">
              <span>
                OTLP: <span className="text-emerald-400">compatible</span>
              </span>
              <span>
                storage: <span className="text-violet-400">PostgreSQL</span>
              </span>
            </div>
          </div>
        </CodePanel>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <FeatureCard
          variant="compact"
          icon={Activity}
          title="Cross-service waterfall"
          description="HTTP, RPC, events, workflows, retries — full execution path in one interactive view."
          iconClassName="text-cyan-400"
        />
        <FeatureCard
          variant="compact"
          icon={RefreshCcw}
          title="Retry group visualization"
          description="Retry chains show attempt count, recovered errors, and delivery stats inline."
          iconClassName="text-orange-400"
        />
        <FeatureCard
          variant="compact"
          icon={Eye}
          title="Live span updates"
          description="Running spans animate in real-time. Status changes push via WebSocket instantly."
          iconClassName="text-emerald-400"
        />
      </div>
    </Section>
  );
}
