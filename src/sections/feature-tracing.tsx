import { motion, useInView } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  Radio,
  RefreshCcw,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { MiniCard } from "../ui/MiniCard";

interface TraceSpan {
  id: string;
  name: string;
  service: string;
  type: "rpc" | "event" | "delivery" | "job" | "workflow" | "http";
  status: "success" | "error" | "pending" | "retry";
  startPct: number;
  widthPct: number;
  durationMs: number;
  depth: number;
  isLast: boolean;
  parentLines: boolean[];
  children?: TraceSpan[];
}

const TRACE_SPANS: TraceSpan[] = [
  {
    id: "1",
    name: "POST /api/orders",
    service: "gateway",
    type: "http",
    status: "success",
    startPct: 0,
    widthPct: 100,
    durationMs: 142,
    depth: 0,
    isLast: true,
    parentLines: [],
    children: [
      {
        id: "2",
        name: "orders.create",
        service: "orders",
        type: "rpc",
        status: "success",
        startPct: 2,
        widthPct: 28,
        durationMs: 42,
        depth: 1,
        isLast: false,
        parentLines: [false],
        children: [
          {
            id: "2a",
            name: "db.insert",
            service: "orders",
            type: "rpc",
            status: "success",
            startPct: 4,
            widthPct: 18,
            durationMs: 28,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
          },
          {
            id: "2b",
            name: "workflow: order.fulfillment",
            service: "orders",
            type: "workflow",
            status: "success",
            startPct: 24,
            widthPct: 4,
            durationMs: 6,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
          },
        ],
      },
      {
        id: "3",
        name: "event: order.created",
        service: "orders",
        type: "event",
        status: "success",
        startPct: 32,
        widthPct: 60,
        durationMs: 85,
        depth: 1,
        isLast: false,
        parentLines: [false],
        children: [
          {
            id: "4",
            name: "payment.charge",
            service: "payments",
            type: "delivery",
            status: "success",
            startPct: 32,
            widthPct: 24,
            durationMs: 34,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
          },
          {
            id: "5",
            name: "send.confirmation",
            service: "notify",
            type: "delivery",
            status: "success",
            startPct: 34,
            widthPct: 36,
            durationMs: 52,
            depth: 2,
            isLast: false,
            parentLines: [false, false],
            children: [
              {
                id: "6",
                name: "email.send",
                service: "mailer",
                type: "rpc",
                status: "retry",
                startPct: 36,
                widthPct: 18,
                durationMs: 28,
                depth: 3,
                isLast: false,
                parentLines: [false, false, false],
              },
              {
                id: "7",
                name: "email.send",
                service: "mailer",
                type: "rpc",
                status: "success",
                startPct: 58,
                widthPct: 10,
                durationMs: 12,
                depth: 3,
                isLast: true,
                parentLines: [false, false, true],
              },
            ],
          },
          {
            id: "8",
            name: "analytics.track",
            service: "analytics",
            type: "delivery",
            status: "success",
            startPct: 32,
            widthPct: 5,
            durationMs: 8,
            depth: 2,
            isLast: true,
            parentLines: [false, true],
          },
        ],
      },
      {
        id: "9",
        name: "cache.invalidate",
        service: "orders",
        type: "rpc",
        status: "success",
        startPct: 94,
        widthPct: 5,
        durationMs: 6,
        depth: 1,
        isLast: true,
        parentLines: [true],
      },
    ],
  },
];

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  rpc: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10" },
  event: { icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  delivery: { icon: ArrowRight, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  job: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  workflow: { icon: Workflow, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  http: { icon: Globe, color: "text-orange-400", bg: "bg-orange-500/10" },
};

function flattenSpans(spans: TraceSpan[]): TraceSpan[] {
  const result: TraceSpan[] = [];
  for (const s of spans) {
    result.push(s);
    if (s.children) result.push(...flattenSpans(s.children));
  }
  return result;
}

function getBarColor(status: string) {
  if (status === "error") return "bg-red-500/80";
  if (status === "retry") return "bg-amber-400/80";
  if (status === "pending") return "bg-amber-400/60";
  return "bg-emerald-500/80";
}

function getDotColor(status: string) {
  if (status === "error") return "bg-red-400";
  if (status === "retry") return "bg-amber-400";
  if (status === "pending") return "bg-amber-400";
  return "bg-emerald-500";
}

function SpanStatusIcon({ status }: { status: string }) {
  if (status === "error") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === "retry") return <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />;
  if (status === "pending") return <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
}

function TraceSpanRow({ span, index }: { span: TraceSpan; index: number }) {
  const hasChildren = span.children && span.children.length > 0;
  const typeCfg = TYPE_ICONS[span.type] || TYPE_ICONS.rpc;
  const indent = span.depth * 24 + 8;
  const parentLineSegments = span.parentLines.reduce<Array<{ key: string; hasLine: boolean }>>(
    (acc, hasLine) => {
      const duplicates = acc.filter((segment) => segment.hasLine === hasLine).length;
      acc.push({ key: `${span.id}-line-${hasLine ? "on" : "off"}-${duplicates}`, hasLine });
      return acc;
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-lg transition-colors duration-200 mb-0.5 hover:bg-white/[0.03]"
    >
      <div className="flex items-center gap-0 py-2 px-3">
        {parentLineSegments.map(({ key, hasLine }) => (
          <div key={key} className="flex-shrink-0 w-6 self-stretch relative">
            {hasLine && (
              <div className="absolute left-[11px] inset-y-0 border-l border-zinc-700/60" />
            )}
          </div>
        ))}
        {span.depth > 0 && (
          <div className="flex-shrink-0 w-6 self-stretch relative">
            <div className="absolute left-[11px] top-0 bottom-1/2 border-l border-zinc-700/60" />
            {!span.isLast && (
              <div className="absolute left-[11px] top-1/2 bottom-0 border-l border-zinc-700/60" />
            )}
            <div className="absolute left-[11px] top-1/2 w-[13px] border-t border-zinc-700/60" />
          </div>
        )}
        {hasChildren ? (
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-zinc-500">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <div
              className={cn("w-2 h-2 rounded-full ring-2 ring-[#080c18]", getDotColor(span.status))}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2 ml-1.5">
          <span
            className={cn(
              "text-xs font-medium truncate tracking-tight",
              span.status === "error"
                ? "text-red-400"
                : span.status === "retry"
                  ? "text-amber-400"
                  : "text-zinc-200"
            )}
          >
            {span.name}
          </span>
          <span
            className={cn(
              "text-3xs px-1.5 py-0 h-4 rounded font-mono flex items-center shrink-0",
              typeCfg.bg,
              typeCfg.color
            )}
          >
            {span.service}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-2xs text-zinc-500 font-mono tabular-nums bg-white/[0.03] px-1.5 py-0.5 rounded">
            {span.durationMs}ms
          </span>
          <SpanStatusIcon status={span.status} />
        </div>
      </div>
      <div
        className="h-2 bg-white/[0.04] rounded-full mx-3 mb-2 overflow-hidden relative"
        style={{ marginLeft: `${indent + (span.depth > 0 ? span.depth * 24 + 36 : 28)}px` }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(span.widthPct, 1)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.06 + 0.2, ease: "easeOut" }}
          className={cn("absolute h-full rounded-full shadow-sm", getBarColor(span.status))}
          style={{ left: `${span.startPct}%` }}
        />
      </div>
    </motion.div>
  );
}

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: "Cross-service waterfall",
    desc: "HTTP, RPC, events, workflows, and retries — full execution path in one interactive view.",
  },
  {
    icon: RefreshCcw,
    title: "Retry group visualization",
    desc: "Retry chains show attempt count, recovered errors, and delivery stats. See retry → success inline.",
  },
  {
    icon: Eye,
    title: "Live span updates",
    desc: "Running spans animate in real-time. Status changes push via WebSocket instantly.",
  },
];

export function TracingSection() {
  const allSpans = flattenSpans(TRACE_SPANS);
  const [revealCount, setRevealCount] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setRevealCount(allSpans.length);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealCount(i);
      if (i >= allSpans.length) clearInterval(interval);
    }, 180);
    return () => clearInterval(interval);
  }, [isInView, allSpans.length]);

  return (
    <section ref={sectionRef} className="py-24 border-y border-white/[0.04]" id="tracing">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Unified Tracing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            RPC, events, retries, fan-out —<br className="hidden sm:block" /> zero blind spots.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Automatic end-to-end traces across every primitive. No manual instrumentation, no
            missing spans — just a full waterfall from request to final delivery.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-[#080c18] overflow-hidden shadow-2xl shadow-cyan-500/[0.04]">
            {/* Chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/[0.07]" />
                  <div className="h-3 w-3 rounded-full bg-white/[0.07]" />
                  <div className="h-3 w-3 rounded-full bg-white/[0.07]" />
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  ServiceBridge — Trace Waterfall
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xs font-mono text-zinc-600 bg-white/[0.03] px-2 py-0.5 rounded">
                  {allSpans.length} spans
                </span>
                <span className="text-3xs font-mono text-zinc-600 bg-white/[0.03] px-2 py-0.5 rounded">
                  142ms
                </span>
              </div>
            </div>
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-300">Trace Waterfall</span>
              </div>
              <div className="flex items-center gap-4 text-3xs font-mono text-zinc-600">
                {[
                  { color: "bg-emerald-500", label: "success" },
                  { color: "bg-amber-400", label: "retry" },
                  { color: "bg-red-400", label: "error" },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", color)} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {/* Waterfall rows */}
            <div className="p-2 min-h-[360px]">
              {allSpans.slice(0, revealCount).map((span, i) => (
                <TraceSpanRow key={span.id} span={span} index={i} />
              ))}
            </div>
            {/* Footer */}
            <div className="border-t border-white/[0.04] px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-3xs font-mono text-zinc-600">
              <span>
                trace_id: <span className="text-cyan-400/70">a1b2c3d4e5f6</span>
              </span>
              <div className="flex items-center gap-4">
                <span>
                  OTLP: <span className="text-emerald-400">compatible</span>
                </span>
                <span>
                  spans: <span className="text-blue-400">hierarchical</span>
                </span>
                <span>
                  runs: <span className="text-violet-400">linked</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {HIGHLIGHTS.map((item) => (
            <MiniCard
              key={item.title}
              icon={item.icon}
              iconClassName="text-cyan-400"
              title={item.title}
              desc={item.desc}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
