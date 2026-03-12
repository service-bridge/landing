import { motion, useInView } from "framer-motion";
import {
  Activity,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";
import { TabStrip } from "../ui/Tabs";

// ─── Types ──────────────────────────────────────────────────────────────────

type SpanType = "http" | "rpc" | "event" | "delivery" | "workflow" | "job" | "sleep" | "attempt";
type SpanStatus = "success" | "error" | "running" | "pending";
type Outcome = "ack" | "reject" | "dlq" | null;

interface WSpan {
  id: string;
  name: string;
  service: string;
  type: SpanType;
  status: SpanStatus;
  startPct: number;
  widthPct: number;
  durationMs: number;
  depth: number;
  isLast: boolean;
  parentLines: boolean[];
  outcome?: Outcome;
  retryCount?: number;
  attempt?: number;
  condition?: string;
  children?: WSpan[];
}

// ─── Type config (mirrors spanClassifier.ts) ─────────────────────────────────

const TYPE_CFG: Record<
  SpanType,
  { icon: React.ElementType; color: string; bg: string; bar: string; label: string }
> = {
  http: {
    icon: Globe,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    bar: "bg-indigo-500/85",
    label: "http",
  },
  rpc: {
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    bar: "bg-blue-500/85",
    label: "rpc",
  },
  event: {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500/85",
    label: "event",
  },
  delivery: {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-400/85",
    label: "delivery",
  },
  workflow: {
    icon: GitBranch,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    bar: "bg-fuchsia-500/85",
    label: "workflow",
  },
  job: {
    icon: CalendarClock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    bar: "bg-amber-500/85",
    label: "job",
  },
  sleep: {
    icon: Hourglass,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    bar: "bg-slate-400/85",
    label: "sleep",
  },
  attempt: {
    icon: RefreshCcw,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    bar: "bg-orange-500/85",
    label: "attempt",
  },
};

function getBarColor(status: SpanStatus): string {
  if (status === "error") return "bg-red-500/75";
  if (status === "running") return "bg-amber-400/75 animate-pulse";
  if (status === "pending") return "bg-amber-400/50";
  return "";
}

function StatusIcon({ status }: { status: SpanStatus }) {
  if (status === "error") return <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
  if (status === "running") return <Clock3 className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />;
  if (status === "pending") return <Clock3 className="w-3 h-3 text-amber-400/60 shrink-0" />;
  return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
}

function OutcomePill({ outcome }: { outcome: Outcome }) {
  if (!outcome) return null;
  const cfg = {
    ack: { icon: CheckCircle2, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "ack" },
    reject: { icon: XCircle, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "reject" },
    dlq: { icon: Ban, tone: "text-rose-400 bg-rose-500/10 border-rose-500/20", label: "dlq" },
  }[outcome];
  const Icon = cfg.icon;
  return (
    <Badge tone={cfg.tone}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </Badge>
  );
}

// ─── Span row (mirrors SpanRow.tsx visual) ────────────────────────────────────

const BASE_PAD = 10;
const DEPTH_PAD = 14;

function TraceRow({ span, index, revealed }: { span: WSpan; index: number; revealed: boolean }) {
  const cfg = TYPE_CFG[span.type];
  const Icon = cfg.icon;
  const hasChildren = span.children && span.children.length > 0;
  const barColor = getBarColor(span.status) || cfg.bar;
  const nameColor =
    span.status === "error"
      ? "text-red-400"
      : span.status === "running"
        ? "text-amber-300"
        : span.status === "pending"
          ? "text-zinc-500"
          : "text-zinc-200";

  const leftPad = BASE_PAD + span.depth * DEPTH_PAD;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group hover:bg-surface transition-colors"
    >
      {/* Name column */}
      <div className="grid [grid-template-columns:44%_1fr]">
        <div
          className="relative flex items-center gap-1.5 py-1.5 pr-2 border-r border-surface-border"
          style={{ paddingLeft: `${leftPad}px` }}
        >
          {/* Tree connector lines */}
          {span.parentLines.map((hasLine, li) => (
            <span
              key={`${span.id}-pl-${li}`}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${BASE_PAD + li * DEPTH_PAD + DEPTH_PAD / 2}px`,
                background: hasLine ? "rgba(113,113,122,0.3)" : "transparent",
              }}
            />
          ))}
          {span.depth > 0 && (
            <>
              <span
                className="absolute top-0 w-px"
                style={{
                  left: `${BASE_PAD + (span.depth - 1) * DEPTH_PAD + DEPTH_PAD / 2}px`,
                  height: "50%",
                  background: "rgba(113,113,122,0.3)",
                }}
              />
              {!span.isLast && (
                <span
                  className="absolute bottom-0 w-px"
                  style={{
                    left: `${BASE_PAD + (span.depth - 1) * DEPTH_PAD + DEPTH_PAD / 2}px`,
                    height: "50%",
                    background: "rgba(113,113,122,0.3)",
                  }}
                />
              )}
              <span
                className="absolute"
                style={{
                  left: `${BASE_PAD + (span.depth - 1) * DEPTH_PAD + DEPTH_PAD / 2}px`,
                  top: "50%",
                  width: `${DEPTH_PAD / 2}px`,
                  height: "1px",
                  background: "rgba(113,113,122,0.3)",
                }}
              />
            </>
          )}

          {/* Expand icon or dot */}
          {hasChildren ? (
            <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
          ) : (
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full ring-1 ring-code shrink-0",
                span.status === "error"
                  ? "bg-red-400"
                  : span.status === "running"
                    ? "bg-amber-400 animate-pulse"
                    : span.status === "pending"
                      ? "bg-zinc-600"
                      : "bg-emerald-500"
              )}
            />
          )}

          {/* Type icon */}
          <span className={cn("rounded p-0.5 shrink-0", cfg.bg)}>
            <Icon className={cn("w-2.5 h-2.5", cfg.color)} />
          </span>

          {/* Name */}
          <span className={cn("type-body-sm truncate flex-1", nameColor)}>
            {span.name}
          </span>

          {/* Service badge */}
          <Badge tone={cn(cfg.bg, cfg.color)}>
            {span.service}
          </Badge>
        </div>

        {/* Waterfall bar column */}
          <div className="relative flex items-center px-2 py-1.5">
          {/* Bar track */}
          <div className="absolute inset-x-2 h-3 rounded-full bg-surface">
            <motion.div
              initial={{ width: 0 }}
              animate={revealed ? { width: `${Math.max(span.widthPct, 0.8)}%` } : { width: 0 }}
              transition={{ duration: 0.5, delay: index * 0.04 + 0.1, ease: "easeOut" }}
              className={cn("absolute h-full rounded-full", barColor)}
              style={{ left: `${span.startPct}%` }}
            />
          </div>

          {/* Right side: duration + status + outcome */}
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
            <span className="type-overline-mono text-zinc-600 bg-surface px-1 py-0.5 rounded-2xl tabular-nums">
              {span.durationMs}ms
            </span>
            <StatusIcon status={span.status} />
            <OutcomePill outcome={span.outcome ?? null} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function flattenSpans(spans: WSpan[]): WSpan[] {
  const result: WSpan[] = [];
  for (const s of spans) {
    result.push(s);
    if (s.children) result.push(...flattenSpans(s.children));
  }
  return result;
}

// ─── Tab data ────────────────────────────────────────────────────────────────

const HTTP_TRACE: WSpan[] = [
  {
    id: "h1",
    name: "http:POST /checkout",
    service: "gateway",
    type: "http",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 187,
    depth: 0,
    isLast: true,
    parentLines: [],
    children: [
      {
        id: "h2",
        name: "rpc:orders.create",
        service: "orders",
        type: "rpc",
        status: "success",
        startPct: 1,
        widthPct: 30,
        durationMs: 56,
        depth: 1,
        isLast: false,
        parentLines: [false],
        children: [
          {
            id: "h2a",
            name: "rpc:db.insertOrder",
            service: "orders",
            type: "rpc",
            status: "success",
            startPct: 3,
            widthPct: 15,
            durationMs: 28,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
          },
          {
            id: "h2b",
            name: "rpc:inventory.reserve",
            service: "inventory",
            type: "rpc",
            status: "success",
            startPct: 18,
            widthPct: 12,
            durationMs: 22,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
          },
        ],
      },
      {
        id: "h3",
        name: "event:order.created",
        service: "orders",
        type: "event",
        status: "success",
        startPct: 33,
        widthPct: 58,
        durationMs: 108,
        depth: 1,
        isLast: false,
        parentLines: [false],
        children: [
          {
            id: "h4",
            name: "rpc:payments.charge",
            service: "payments",
            type: "delivery",
            status: "success",
            startPct: 34,
            widthPct: 28,
            durationMs: 52,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
            outcome: "ack",
          },
          {
            id: "h5",
            name: "event.deliver:notify",
            service: "notify",
            type: "delivery",
            status: "success",
            startPct: 48,
            widthPct: 20,
            durationMs: 37,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
            outcome: "ack",
            children: [
              {
                id: "h5a",
                name: "attempt:email.send",
                service: "mailer",
                type: "attempt",
                status: "error",
                startPct: 50,
                widthPct: 8,
                durationMs: 15,
                depth: 3,
                isLast: false,
                parentLines: [false, false, false],
                attempt: 1,
              },
              {
                id: "h5b",
                name: "attempt:email.send",
                service: "mailer",
                type: "attempt",
                status: "success",
                startPct: 60,
                widthPct: 8,
                durationMs: 14,
                depth: 3,
                isLast: true,
                parentLines: [false, false, true],
                attempt: 2,
              },
            ],
          },
          {
            id: "h6",
            name: "event.deliver:analytics",
            service: "analytics",
            type: "delivery",
            status: "success",
            startPct: 34,
            widthPct: 6,
            durationMs: 11,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
            outcome: "ack",
          },
        ],
      },
      {
        id: "h7",
        name: "rpc:cache.invalidate",
        service: "orders",
        type: "rpc",
        status: "success",
        startPct: 93,
        widthPct: 5,
        durationMs: 9,
        depth: 1,
        isLast: true,
        parentLines: [true],
      },
    ],
  },
];

const RPC_TRACE: WSpan[] = [
  {
    id: "r1",
    name: "rpc:payments.charge",
    service: "payments",
    type: "rpc",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 243,
    depth: 0,
    isLast: true,
    parentLines: [],
    retryCount: 2,
    children: [
      {
        id: "r1a",
        name: "attempt:payments.charge",
        service: "payments",
        type: "attempt",
        status: "error",
        startPct: 1,
        widthPct: 26,
        durationMs: 63,
        depth: 1,
        isLast: false,
        parentLines: [false],
        attempt: 1,
      },
      {
        id: "r1b",
        name: "attempt:payments.charge",
        service: "payments",
        type: "attempt",
        status: "error",
        startPct: 30,
        widthPct: 26,
        durationMs: 64,
        depth: 1,
        isLast: false,
        parentLines: [false],
        attempt: 2,
        children: [
          {
            id: "r1b1",
            name: "rpc:stripe.charge",
            service: "stripe-adapter",
            type: "rpc",
            status: "error",
            startPct: 32,
            widthPct: 22,
            durationMs: 54,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
          },
        ],
      },
      {
        id: "r1c",
        name: "attempt:payments.charge",
        service: "payments",
        type: "attempt",
        status: "success",
        startPct: 60,
        widthPct: 38,
        durationMs: 91,
        depth: 1,
        isLast: true,
        parentLines: [true],
        attempt: 3,
        children: [
          {
            id: "r1c1",
            name: "rpc:stripe.charge",
            service: "stripe-adapter",
            type: "rpc",
            status: "success",
            startPct: 62,
            widthPct: 32,
            durationMs: 77,
            depth: 2,
            isLast: true,
            parentLines: [true, true],
          },
        ],
      },
    ],
  },
];

const EVENT_TRACE: WSpan[] = [
  {
    id: "e1",
    name: "event:order.created",
    service: "orders",
    type: "event",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 312,
    depth: 0,
    isLast: true,
    parentLines: [],
    children: [
      {
        id: "e2",
        name: "event.deliver:analytics.track",
        service: "analytics",
        type: "delivery",
        status: "success",
        startPct: 2,
        widthPct: 8,
        durationMs: 25,
        depth: 1,
        isLast: false,
        parentLines: [false],
        outcome: "ack",
      },
      {
        id: "e3",
        name: "event.deliver:notify.email",
        service: "notify",
        type: "delivery",
        status: "success",
        startPct: 2,
        widthPct: 22,
        durationMs: 69,
        depth: 1,
        isLast: false,
        parentLines: [false],
        outcome: "ack",
        children: [
          {
            id: "e3a",
            name: "attempt:notify.email",
            service: "notify",
            type: "attempt",
            status: "error",
            startPct: 4,
            widthPct: 8,
            durationMs: 25,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
            attempt: 1,
          },
          {
            id: "e3b",
            name: "attempt:notify.email",
            service: "notify",
            type: "attempt",
            status: "success",
            startPct: 14,
            widthPct: 9,
            durationMs: 28,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
            attempt: 2,
          },
        ],
      },
      {
        id: "e4",
        name: "event.deliver:billing.invoice",
        service: "billing",
        type: "delivery",
        status: "error",
        startPct: 2,
        widthPct: 95,
        durationMs: 296,
        depth: 1,
        isLast: true,
        parentLines: [true],
        outcome: "dlq",
        children: [
          {
            id: "e4a",
            name: "attempt:billing.invoice",
            service: "billing",
            type: "attempt",
            status: "error",
            startPct: 4,
            widthPct: 14,
            durationMs: 44,
            depth: 2,
            isLast: false,
            parentLines: [true, false],
            attempt: 1,
          },
          {
            id: "e4b",
            name: "attempt:billing.invoice",
            service: "billing",
            type: "attempt",
            status: "error",
            startPct: 34,
            widthPct: 14,
            durationMs: 43,
            depth: 2,
            isLast: false,
            parentLines: [true, false],
            attempt: 2,
          },
          {
            id: "e4c",
            name: "attempt:billing.invoice",
            service: "billing",
            type: "attempt",
            status: "error",
            startPct: 70,
            widthPct: 22,
            durationMs: 69,
            depth: 2,
            isLast: true,
            parentLines: [true, true],
            attempt: 3,
          },
        ],
      },
    ],
  },
];

const WORKFLOW_TRACE: WSpan[] = [
  {
    id: "w1",
    name: "workflow:merchant.onboarding",
    service: "platform",
    type: "workflow",
    status: "running",
    startPct: 0,
    widthPct: 100,
    durationMs: 1842,
    depth: 0,
    isLast: true,
    parentLines: [],
    children: [
      {
        id: "w2",
        name: "rpc:merchant.validate",
        service: "merchants",
        type: "rpc",
        status: "success",
        startPct: 1,
        widthPct: 8,
        durationMs: 147,
        depth: 1,
        isLast: false,
        parentLines: [false],
      },
      {
        id: "w3",
        name: "rpc:kyc.check",
        service: "kyc",
        type: "rpc",
        status: "success",
        startPct: 10,
        widthPct: 20,
        durationMs: 368,
        depth: 1,
        isLast: false,
        parentLines: [false],
      },
      {
        id: "w4",
        name: "rpc:billing.setup",
        service: "billing",
        type: "rpc",
        status: "success",
        startPct: 10,
        widthPct: 15,
        durationMs: 277,
        depth: 1,
        isLast: false,
        parentLines: [false],
      },
      {
        id: "w5",
        name: "rpc:merchant.create",
        service: "merchants",
        type: "rpc",
        status: "success",
        startPct: 31,
        widthPct: 12,
        durationMs: 221,
        depth: 1,
        isLast: false,
        parentLines: [false],
      },
      {
        id: "w6",
        name: "event:email.welcome",
        service: "notify",
        type: "event",
        status: "success",
        startPct: 44,
        widthPct: 6,
        durationMs: 110,
        depth: 1,
        isLast: false,
        parentLines: [false],
        condition: "if: status=active",
      },
      {
        id: "w7",
        name: "sleep:wait 24h",
        service: "platform",
        type: "sleep",
        status: "running",
        startPct: 51,
        widthPct: 48,
        durationMs: 86400000,
        depth: 1,
        isLast: false,
        parentLines: [false],
      },
      {
        id: "w8",
        name: "rpc:email.followup",
        service: "notify",
        type: "rpc",
        status: "pending",
        startPct: 99,
        widthPct: 1,
        durationMs: 0,
        depth: 1,
        isLast: true,
        parentLines: [true],
      },
    ],
  },
];

const TRACE_TABS = [
  {
    id: "http",
    label: "HTTP",
    desc: "HTTP request → RPC chain → event fan-out",
    totalMs: "187ms",
    spanCount: 10,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    activeBg: "bg-indigo-500/15",
    data: HTTP_TRACE,
  },
  {
    id: "rpc",
    label: "RPC",
    desc: "Direct RPC with 2 retries → success on 3rd attempt",
    totalMs: "243ms",
    spanCount: 6,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    activeBg: "bg-blue-500/15",
    data: RPC_TRACE,
  },
  {
    id: "event",
    label: "Event",
    desc: "Publish → 3 subscribers, 1 retry, 1 DLQ",
    totalMs: "312ms",
    spanCount: 8,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    activeBg: "bg-emerald-500/15",
    data: EVENT_TRACE,
  },
  {
    id: "workflow",
    label: "Workflow",
    desc: "DAG: validate → parallel kyc/billing → conditional email → sleep",
    totalMs: "~24h",
    spanCount: 8,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/20",
    activeBg: "bg-fuchsia-500/15",
    data: WORKFLOW_TRACE,
  },
] as const;

type TabId = (typeof TRACE_TABS)[number]["id"];

// ─── Main section ─────────────────────────────────────────────────────────────

export function TracingSection() {
  const [activeTab, setActiveTab] = useState<TabId>("http");
  const [revealCount, setRevealCount] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const tab = TRACE_TABS.find((t) => t.id === activeTab) ?? TRACE_TABS[0];
  const allSpans = flattenSpans(tab.data);

  // Reset + re-reveal when tab changes
  useEffect(() => {
    setRevealCount(0);
    if (!isInView) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealCount(allSpans.length);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealCount(i);
      if (i >= allSpans.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [activeTab, isInView, allSpans.length]);

  const waterfallDemo = (
    <div ref={sectionRef} className="lg:col-span-2">
      {/* Tab selector */}
      <TabStrip
        size="md"
        items={TRACE_TABS}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {/* Waterfall panel */}
      <CodePanel title="ServiceBridge — Trace Waterfall">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="type-body-sm text-zinc-300">{tab.desc}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="type-overline-mono text-zinc-600 bg-surface px-2 py-0.5 rounded-2xl">
              {tab.spanCount} spans
            </span>
            <span className="type-overline-mono text-zinc-600 bg-surface px-2 py-0.5 rounded-2xl">
              {tab.totalMs}
            </span>
          </div>
        </div>

        {/* Column header */}
        <div className="grid [grid-template-columns:44%_1fr] border-b border-surface-border bg-code-chrome">
          <div className="px-3 py-1.5 type-overline-mono text-zinc-600">
            Operation
          </div>
          <div className="px-2 py-1.5 type-overline-mono text-zinc-600 border-l border-surface-border">
            Timeline
          </div>
        </div>

        {/* Waterfall rows */}
        <div className="min-h-[320px]">
          {allSpans.map((span, i) => (
            <TraceRow
              key={span.id}
              span={span}
              index={i}
              revealed={i < revealCount}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 type-overline-mono text-zinc-600 bg-code-chrome">
          <span>
            trace_id:{" "}
            <span className={cn("font-semibold", tab.color)}>
              {activeTab === "http"
                ? "a1b2c3d4e5f6"
                : activeTab === "rpc"
                  ? "f6e5d4c3b2a1"
                  : activeTab === "event"
                    ? "c3d4e5f6a1b2"
                    : "d4c3b2a1f6e5"}
            </span>
          </span>
          <div className="flex items-center gap-4">
            <span>
              OTLP:{" "}
              <span className="text-emerald-400">compatible</span>
            </span>
            <span>
              storage:{" "}
              <span className="text-violet-400">PostgreSQL</span>
            </span>
            <span>
              delivery:{" "}
              <span className="text-cyan-400">realtime push</span>
            </span>
          </div>
        </div>
      </CodePanel>
    </div>
  );

  const miniCards = (
    <>
      <MiniCard
        icon={Activity}
        title="Cross-service waterfall"
        desc="HTTP, RPC, events, workflows, retries — full execution path in one interactive view."
        iconClassName="text-cyan-400"
      />
      <MiniCard
        icon={RefreshCcw}
        title="Retry group visualization"
        desc="Retry chains show attempt count, recovered errors, and delivery stats inline."
        iconClassName="text-orange-400"
      />
      <MiniCard
        icon={Eye}
        title="Live span updates"
        desc="Running spans animate in real-time. Status changes push via WebSocket instantly."
        iconClassName="text-primary"
      />
    </>
  );

  return (
    <FeatureSection
      id="tracing"
      eyebrow="Unified Tracing"
      title="Every primitive, one waterfall."
      subtitle="HTTP, RPC, events, workflows, retries — all traced automatically. The same format used in the real dashboard, right here."
      content={<div />}
      demo={waterfallDemo}
      cards={miniCards}
    />
  );
}
