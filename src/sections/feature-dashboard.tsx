import { motion, useInView } from "framer-motion";
import {
  Activity,
  Clock,
  Eye,
  Globe,
  Radio,
  RefreshCcw,
  Shield,
  Workflow,
} from "lucide-react";
import { useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "map", label: "Service Map", icon: Globe },
  { id: "runs", label: "Runs", icon: RefreshCcw },
  { id: "events", label: "Events", icon: Radio },
  { id: "jobs", label: "Jobs", icon: Clock },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "dlq", label: "DLQ", icon: Shield },
] as const;

type Tab = (typeof SIDEBAR_ITEMS)[number]["id"];

const MOCK_BARS = [28, 45, 32, 67, 89, 54, 76, 92, 61, 43, 78, 95, 82, 67, 55, 88, 71, 44, 63, 79];

const STATUS_TONE: Record<string, string> = {
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  running: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  failed: "border-red-500/25 bg-red-500/10 text-red-400",
  pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
};

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardView() {
  const maxBar = Math.max(...MOCK_BARS);
  const bars = MOCK_BARS.reduce<{ key: string; value: number }[]>((acc, value) => {
    const dups = acc.filter((e) => e.value === value).length;
    acc.push({ key: `bar-${value}-${dups}`, value });
    return acc;
  }, []);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            { label: "Active Workers", value: "12", color: "text-emerald-400" },
            { label: "In-Flight", value: "34", color: "text-blue-400" },
            { label: "Backlog", value: "7", color: "text-amber-400" },
            { label: "DLQ", value: "2", color: "text-red-400" },
          ] as const
        ).map((s) => (
          <Card key={s.label} className="p-2.5">
            <p className="type-overline-mono text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-base font-bold font-mono", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-3">
        <p className="type-overline-mono text-muted-foreground mb-2">Activity — last 20 min</p>
        <div className="flex items-end gap-[3px] h-12">
          {bars.map(({ key, value }) => (
            <motion.div
              key={key}
              className="flex-1 rounded-sm bg-emerald-500/35"
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxBar) * 100}%` }}
              transition={{ duration: 0.6, delay: Math.random() * 0.3 }}
            />
          ))}
        </div>
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-surface-border">
          <p className="type-overline-mono text-muted-foreground">Recent runs</p>
        </div>
        {[
          { fn: "orders.create", svc: "order-svc", status: "completed", ms: "14ms" },
          { fn: "payments.charge", svc: "pay-svc", status: "completed", ms: "221ms" },
          { fn: "users.get", svc: "user-svc", status: "running", ms: null },
          { fn: "notify.send", svc: "notif-svc", status: "failed", ms: "45ms" },
        ].map((r) => (
          <div key={r.fn} className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border last:border-0">
            <div>
              <p className="text-3xs font-mono text-zinc-300">{r.fn}</p>
              <p className="text-3xs text-zinc-600">{r.svc}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.ms && <span className="text-3xs text-zinc-500 font-mono">{r.ms}</span>}
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Service Map tab ──────────────────────────────────────────────────────────

const SVC_NODES = [
  { id: "gw", label: "api-gateway", x: 50, y: 46, color: "#3b82f6" },
  { id: "ord", label: "order-svc", x: 22, y: 28, color: "#22c55e" },
  { id: "usr", label: "user-svc", x: 78, y: 28, color: "#22c55e" },
  { id: "pay", label: "pay-svc", x: 25, y: 72, color: "#22c55e" },
  { id: "ntf", label: "notif-svc", x: 75, y: 72, color: "#22c55e" },
  { id: "anl", label: "analytics", x: 50, y: 14, color: "#a78bfa" },
] as const;

const SVC_EDGES = [
  { from: "gw", to: "ord", type: "rpc" as const },
  { from: "gw", to: "usr", type: "rpc" as const },
  { from: "gw", to: "anl", type: "rpc" as const },
  { from: "ord", to: "pay", type: "rpc" as const },
  { from: "ord", to: "ntf", type: "event" as const },
  { from: "pay", to: "ntf", type: "event" as const },
] as const;

function ServiceMapView() {
  const nodeMap = Object.fromEntries(SVC_NODES.map((n) => [n.id, n]));
  return (
    <div className="p-3 h-full">
      <Card className="relative overflow-hidden p-0" style={{ height: 280 }}>
        <p className="absolute top-2 left-3 type-overline-mono text-zinc-600 z-10">service topology</p>
        <div className="absolute top-2 right-3 flex items-center gap-3 z-10">
          <span className="flex items-center gap-1 type-overline-mono text-zinc-600"><span className="w-4 h-px bg-blue-400/60 inline-block" /> rpc</span>
          <span className="flex items-center gap-1 type-overline-mono text-zinc-600"><span className="w-4 h-px bg-emerald-400/60 inline-block" /> event</span>
        </div>
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <title>Service topology map</title>
          {/* Static edges */}
          {SVC_EDGES.map((edge, i) => {
            const from = nodeMap[edge.from];
            const to = nodeMap[edge.to];
            const stroke = edge.type === "rpc" ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)";
            const dotFill = edge.type === "rpc" ? "#60a5fa" : "#4ade80";
            const fromX = `${from.x}%`;
            const fromY = `${from.y}%`;
            const toX = `${to.x}%`;
            const toY = `${to.y}%`;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={stroke} strokeWidth="1" />
                <motion.circle
                  r={2.5}
                  fill={dotFill}
                  style={{ opacity: 0.8 }}
                  animate={{
                    cx: [`${from.x}%`, `${to.x}%`],
                    cy: [`${from.y}%`, `${to.y}%`],
                  }}
                  transition={{
                    duration: 1.8,
                    ease: "linear",
                    repeat: Infinity,
                    delay: i * 0.35,
                  }}
                />
              </g>
            );
          })}

          {/* Service nodes */}
          {SVC_NODES.map((node) => (
            <g key={node.id}>
              <motion.circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={12}
                fill={`${node.color}18`}
                stroke={`${node.color}50`}
                strokeWidth="1"
                animate={{ r: [12, 14, 12], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
              />
              <circle cx={`${node.x}%`} cy={`${node.y}%`} r={4} fill={node.color} opacity={0.9} />
              <text
                x={`${node.x}%`}
                y={`${node.y + 9}%`}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(161,161,170,0.7)"
                fontFamily="monospace"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </Card>
    </div>
  );
}

// ─── Runs tab ─────────────────────────────────────────────────────────────────

function RunsView() {
  return (
    <div className="p-4 space-y-3">
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-surface-border flex items-center justify-between">
          <p className="type-overline-mono text-muted-foreground">trace · orders.create</p>
          <Badge tone={STATUS_TONE.completed}>completed</Badge>
        </div>
        <div className="p-3 space-y-1.5">
          {[
            { label: "orders.create", start: 0, width: 100, color: "bg-indigo-500/50" },
            { label: "→ payments.charge", start: 14, width: 58, color: "bg-blue-500/50" },
            { label: "→ order.confirmed (event)", start: 40, width: 30, color: "bg-emerald-500/50" },
            { label: "→ analytics.track", start: 4, width: 16, color: "bg-violet-500/50" },
          ].map((span) => (
            <div key={span.label} className="flex items-center gap-2">
              <span className="text-3xs text-zinc-500 w-36 shrink-0 truncate font-mono">{span.label}</span>
              <div className="flex-1 relative h-3 bg-white/[0.03] rounded-sm overflow-hidden">
                <div className={cn("absolute top-0 h-full rounded-sm", span.color)} style={{ left: `${span.start}%`, width: `${span.width}%` }} />
              </div>
              <span className="text-3xs text-zinc-600 font-mono w-10 text-right">{Math.round(span.width * 0.22)}ms</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-0 overflow-hidden">
        {[
          { fn: "orders.create", id: "r_8f3k2", status: "completed", ms: "14ms" },
          { fn: "payments.charge", id: "r_9d1m5", status: "completed", ms: "221ms" },
          { fn: "users.get", id: "r_2a7p9", status: "running", ms: null },
          { fn: "notify.send", id: "r_4c5q1", status: "failed", ms: "45ms" },
          { fn: "analytics.track", id: "r_1e9s4", status: "completed", ms: "32ms" },
        ].map((r) => (
          <div key={r.id} className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border last:border-0">
            <div>
              <p className="text-3xs font-mono text-zinc-300">{r.fn}</p>
              <p className="text-3xs text-zinc-600 font-mono">{r.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.ms && <span className="text-3xs text-zinc-500 font-mono">{r.ms}</span>}
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Events tab ───────────────────────────────────────────────────────────────

function EventsView() {
  return (
    <div className="p-4 space-y-3">
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-surface-border">
          <p className="type-overline-mono text-muted-foreground">Recent deliveries</p>
        </div>
        {[
          { topic: "order.created", group: "payments:charge", outcome: "ack", age: "2s ago" },
          { topic: "order.created", group: "notify:email", outcome: "ack", age: "2s ago" },
          { topic: "user.signed_up", group: "onboarding:flow", outcome: "retry", age: "18s ago" },
          { topic: "billing.failed", group: "billing:dlq-handler", outcome: "dlq", age: "1m ago" },
        ].map((e) => (
          <div key={`${e.topic}${e.group}`} className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border last:border-0">
            <div>
              <p className="text-3xs font-mono text-emerald-300">{e.topic}</p>
              <p className="text-3xs text-zinc-600">{e.group}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xs text-zinc-600 font-mono">{e.age}</span>
              <Badge tone={
                e.outcome === "ack" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" :
                e.outcome === "retry" ? "border-amber-500/25 bg-amber-500/10 text-amber-400" :
                "border-rose-500/25 bg-rose-500/10 text-rose-400"
              }>{e.outcome}</Badge>
            </div>
          </div>
        ))}
      </Card>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Delivered", value: "4,821", color: "text-emerald-400" },
          { label: "Retrying", value: "12", color: "text-amber-400" },
          { label: "DLQ", value: "3", color: "text-rose-400" },
        ].map((s) => (
          <Card key={s.label} className="p-2.5 text-center">
            <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
            <p className="type-overline-mono text-zinc-600 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Jobs tab ─────────────────────────────────────────────────────────────────

function JobsView() {
  return (
    <div className="p-4 space-y-3">
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-surface-border">
          <p className="type-overline-mono text-muted-foreground">Scheduler · 4 jobs registered</p>
        </div>
        {[
          { name: "billing.reconcile", schedule: "0 * * * *", via: "rpc", status: "completed", next: "in 47m" },
          { name: "sync.data", schedule: "*/15 * * * *", via: "rpc", status: "running", next: "running" },
          { name: "trial.reminder", schedule: "delay 24h", via: "event", status: "completed", next: "one-shot" },
          { name: "billing.daily", schedule: "0 2 * * *", via: "workflow", status: "pending", next: "in 3h" },
        ].map((j) => (
          <div key={j.name} className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border last:border-0">
            <div>
              <p className="text-3xs font-mono text-zinc-300">{j.name}</p>
              <p className="text-3xs text-zinc-600 font-mono">{j.schedule}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge tone={
                j.via === "rpc" ? "border-blue-500/25 bg-blue-500/10 text-blue-300" :
                j.via === "event" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" :
                "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300"
              }>{j.via}</Badge>
              <span className="text-3xs text-zinc-600 font-mono w-14 text-right">{j.next}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Workflows tab ────────────────────────────────────────────────────────────

function WorkflowsView() {
  return (
    <div className="p-4 space-y-3">
      <Card className="p-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b border-surface-border flex items-center justify-between">
          <p className="text-3xs font-mono text-zinc-400">merchant.onboarding</p>
          <Badge tone="border-blue-500/25 bg-blue-500/10 text-blue-300">running</Badge>
        </div>
        {[
          { step: "validate", type: "rpc", status: "success", duration: "34ms" },
          { step: "kyc.check", type: "rpc ∥", status: "success", duration: "212ms" },
          { step: "billing.setup", type: "rpc ∥", status: "success", duration: "198ms" },
          { step: "merchant.create", type: "rpc", status: "running", duration: "—" },
          { step: "email.welcome", type: "event", status: "pending", duration: "—" },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3 px-3 py-1.5 border-b border-surface-border last:border-0">
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
              s.status === "success" ? "bg-emerald-400" :
              s.status === "running" ? "bg-blue-400 animate-pulse" : "bg-zinc-600"
            )} />
            <span className="text-3xs font-mono text-zinc-300 flex-1 truncate">{s.step}</span>
            <span className="text-3xs font-mono text-zinc-600 shrink-0">{s.type}</span>
            <span className="text-3xs font-mono text-zinc-500 w-10 text-right shrink-0">{s.duration}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── DLQ tab ─────────────────────────────────────────────────────────────────

function DLQView() {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="type-overline-mono text-muted-foreground">3 entries · oldest first</p>
        <button type="button" className="text-3xs font-mono text-rose-400 border border-rose-500/20 bg-rose-500/[0.05] rounded px-2 py-0.5 cursor-pointer">Replay all</button>
      </div>
      {[
        {
          id: "dlq1",
          topic: "billing.failed",
          group: "billing:invoice",
          attempts: 5,
          reason: "connection timeout",
          payload: '{ "orderId": "ord_123", "amount": 4990 }',
        },
        {
          id: "dlq2",
          topic: "notify.send",
          group: "notify:sms",
          attempts: 3,
          reason: "ctx.reject: invalid_phone",
          payload: '{ "userId": "u_88", "message": "..." }',
        },
        {
          id: "dlq3",
          topic: "analytics.track",
          group: "analytics:batch",
          attempts: 5,
          reason: "max attempts exceeded",
          payload: '{ "event": "page_view", "props": {...} }',
        },
      ].map((entry) => (
        <Card key={entry.id} className="border-rose-500/15 bg-rose-500/[0.03] p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-3xs font-mono text-rose-300">{entry.topic}</p>
              <p className="text-3xs text-zinc-600">{entry.group} · {entry.attempts} attempts</p>
            </div>
            <button type="button" className="shrink-0 text-3xs font-mono text-zinc-400 border border-surface-border bg-surface rounded px-2 py-0.5 cursor-pointer hover:text-zinc-200">Replay</button>
          </div>
          <div className="rounded border border-surface-border bg-black/20 px-2 py-1.5 font-mono text-3xs text-zinc-500 truncate">
            {entry.payload}
          </div>
          <p className="mt-1.5 text-3xs text-rose-400/70 font-mono">{entry.reason}</p>
        </Card>
      ))}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  { icon: Activity, title: "Live stats", desc: "Active workers, in-flight runs, backlog, and error rates pushed via WebSocket in real-time." },
  { icon: Globe, title: "Service map", desc: "Interactive topology of all registered services and their live RPC and event connections." },
  { icon: Eye, title: "Run waterfall", desc: "Full execution trace across services — RPC spans, event fan-out, retries — in one waterfall view." },
  { icon: Shield, title: "DLQ management", desc: "Browse failed events, inspect payloads, replay individually or in batch — without leaving the UI." },
] as const;

const TAB_VIEWS: Record<Tab, () => JSX.Element> = {
  dashboard: DashboardView,
  map: ServiceMapView,
  runs: RunsView,
  events: EventsView,
  jobs: JobsView,
  workflows: WorkflowsView,
  dlq: DLQView,
};

export function DashboardSection() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  const TabView = TAB_VIEWS[activeTab];

  const demoPanel = (
    <motion.div variants={fadeInUp} className="w-full" ref={sectionRef}>
      <div className="rounded-2xl border border-surface-border overflow-hidden shadow-2xl shadow-black/50">
        {/* Browser chrome */}
        <div className="bg-zinc-900 border-b border-surface-border px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-zinc-800 rounded-md px-4 py-1 text-2xs text-zinc-400 font-mono">
              localhost:14444
            </div>
          </div>
          <div className="w-14" />
        </div>

        {/* App shell */}
        <div className="flex bg-zinc-950" style={{ height: 432 }}>
          {/* Sidebar */}
          <div className="w-44 shrink-0 border-r border-surface-border flex flex-col">
            <div className="px-3 py-3 border-b border-surface-border flex items-center gap-2">
              <div className="p-1 bg-emerald-500/20 rounded">
                <BrandMark className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">ServiceBridge</span>
            </div>
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-2xs font-medium transition-colors text-left cursor-pointer",
                    activeTab === item.id
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                  {item.id === "dlq" && (
                    <span className="ml-auto text-3xs bg-rose-500/20 text-rose-400 rounded-full px-1.5 py-0.5 font-mono">3</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-surface-border">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="type-overline-mono text-muted-foreground">Live · WebSocket</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            {inView && <TabView />}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <FeatureSection
      id="dashboard"
      eyebrow="Built-in Dashboard"
      title={
        <>
          Full visibility.{" "}
          <span className="text-gradient">Zero extra tooling.</span>
        </>
      }
      subtitle="A real-time web UI ships with ServiceBridge. Monitor runs, trace cross-service requests, manage DLQ, browse events and jobs — no Grafana, no Kibana, no extra setup."
      content={demoPanel}
      demo={<></>}
      cards={
        <>
          {HIGHLIGHTS.map((item) => (
            <MiniCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              desc={item.desc}
            />
          ))}
        </>
      }
    />
  );
}
