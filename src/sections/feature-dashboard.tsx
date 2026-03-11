import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Eye,
  Globe,
  Radio,
  RefreshCcw,
  Server,
  Shield,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: Activity, id: "dashboard" },
  { label: "Service Map", icon: Globe, id: "map" },
  { label: "Runs", icon: RefreshCcw, id: "runs" },
  { label: "Events", icon: Radio, id: "events" },
  { label: "Jobs", icon: Clock, id: "jobs" },
  { label: "Workflows", icon: Workflow, id: "workflows" },
  { label: "DLQ", icon: Shield, id: "dlq" },
] as const;

type UITab = (typeof SIDEBAR_ITEMS)[number]["id"];

const MOCK_BARS = [28, 45, 32, 67, 89, 54, 76, 92, 61, 43, 78, 95, 82, 67, 55, 88, 71, 44, 63, 79];

const MOCK_RUNS = [
  { id: "r_8f3k2", fn: "orders.create", service: "order-svc", status: "completed", ms: 14 },
  { id: "r_9d1m5", fn: "payments.charge", service: "pay-svc", status: "completed", ms: 221 },
  { id: "r_2a7p9", fn: "users.get", service: "user-svc", status: "running", ms: null },
  { id: "r_4c5q1", fn: "notify.send", service: "notif-svc", status: "failed", ms: 45 },
  { id: "r_6b3r8", fn: "orders.list", service: "order-svc", status: "completed", ms: 8 },
  { id: "r_1e9s4", fn: "analytics.track", service: "analytics", status: "completed", ms: 32 },
];

const MOCK_SERVICES = [
  { name: "api-gateway", x: 50, y: 48 },
  { name: "order-svc", x: 22, y: 30 },
  { name: "user-svc", x: 78, y: 30 },
  { name: "pay-svc", x: 28, y: 72 },
  { name: "notif-svc", x: 72, y: 72 },
  { name: "analytics", x: 50, y: 16 },
];

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  running: "bg-blue-500/15 text-blue-400",
  failed: "bg-red-500/15 text-red-400",
  pending: "bg-amber-500/15 text-amber-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "text-3xs font-mono px-1.5 py-0.5 rounded font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      )}
    >
      {status}
    </span>
  );
}

function DashboardView() {
  const maxBar = Math.max(...MOCK_BARS);
  const bars = MOCK_BARS.reduce<Array<{ key: string; value: number }>>((acc, value) => {
    const duplicates = acc.filter((entry) => entry.value === value).length;
    acc.push({ key: `bar-${value}-${duplicates}`, value });
    return acc;
  }, []);
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Active Workers", value: "12", color: "text-emerald-400" },
          { label: "In-Flight", value: "34", color: "text-blue-400" },
          { label: "Backlog", value: "7", color: "text-amber-400" },
          { label: "DLQ", value: "2", color: "text-red-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
          >
            <p className="text-3xs text-zinc-500 mb-1">{s.label}</p>
            <p className={cn("text-base font-bold font-mono", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
        <p className="text-3xs text-zinc-500 mb-2">Activity — last 20 min</p>
        <div className="flex items-end gap-[3px] h-14">
          {bars.map(({ key, value }) => (
            <div
              key={key}
              className="flex-1 rounded-sm bg-emerald-500/40"
              style={{ height: `${(value / maxBar) * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] overflow-hidden">
        <div className="px-3 py-1.5 border-b border-white/[0.04]">
          <p className="text-3xs text-zinc-500">Recent runs</p>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {MOCK_RUNS.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-1.5">
              <div>
                <p className="text-3xs font-mono text-zinc-300">{r.fn}</p>
                <p className="text-3xs text-zinc-600">{r.service}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.ms !== null && (
                  <span className="text-3xs text-zinc-500 font-mono">{r.ms}ms</span>
                )}
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceMapView() {
  return (
    <div className="p-4 h-full">
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] relative h-64 overflow-hidden">
        <p className="absolute top-3 left-3 text-3xs text-zinc-500 z-10">Service topology</p>
        <svg className="absolute inset-0 w-full h-full">
          <title>Service topology</title>
          <line x1="50%" y1="48%" x2="22%" y2="30%" stroke="rgba(99,179,237,0.2)" strokeWidth="1" />
          <line x1="50%" y1="48%" x2="78%" y2="30%" stroke="rgba(99,179,237,0.2)" strokeWidth="1" />
          <line x1="50%" y1="48%" x2="28%" y2="72%" stroke="rgba(99,179,237,0.2)" strokeWidth="1" />
          <line x1="50%" y1="48%" x2="50%" y2="16%" stroke="rgba(99,179,237,0.2)" strokeWidth="1" />
          <line
            x1="22%"
            y1="30%"
            x2="28%"
            y2="72%"
            stroke="rgba(99,179,237,0.15)"
            strokeWidth="1"
          />
          <line
            x1="22%"
            y1="30%"
            x2="72%"
            y2="72%"
            stroke="rgba(99,179,237,0.15)"
            strokeWidth="1"
          />
          <line
            x1="28%"
            y1="72%"
            x2="72%"
            y2="72%"
            stroke="rgba(99,179,237,0.15)"
            strokeWidth="1"
          />
        </svg>
        {MOCK_SERVICES.map((svc) => (
          <div
            key={svc.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${svc.x}%`, top: `${svc.y}%` }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Server className="w-3 h-3 text-blue-400" />
              </div>
              <span className="text-3xs text-zinc-400 whitespace-nowrap bg-zinc-950/80 px-0.5 rounded">
                {svc.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunsView() {
  return (
    <div className="p-4 space-y-3">
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] overflow-hidden">
        <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center justify-between">
          <p className="text-3xs text-zinc-500">Run trace — orders.create / r_8f3k2</p>
          <StatusBadge status="completed" />
        </div>
        <div className="p-3 space-y-1.5">
          {[
            { label: "orders.create", start: 0, width: 100, color: "bg-blue-500/50" },
            { label: "→ payments.charge", start: 14, width: 62, color: "bg-violet-500/50" },
            { label: "→ notif.send (event)", start: 42, width: 34, color: "bg-amber-500/50" },
            { label: "→ analytics.track", start: 4, width: 18, color: "bg-cyan-500/50" },
          ].map((span) => (
            <div key={span.label} className="flex items-center gap-2">
              <span className="text-3xs text-zinc-500 w-36 shrink-0 truncate">{span.label}</span>
              <div className="flex-1 relative h-3 bg-white/[0.03] rounded-sm overflow-hidden">
                <div
                  className={cn("absolute top-0 h-full rounded-sm", span.color)}
                  style={{ left: `${span.start}%`, width: `${span.width}%` }}
                />
              </div>
              <span className="text-3xs text-zinc-600 font-mono w-8 text-right">
                {Math.round(span.width * 0.2)}ms
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] overflow-hidden">
        <div className="divide-y divide-white/[0.03]">
          {MOCK_RUNS.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-1.5">
              <div>
                <p className="text-3xs font-mono text-zinc-300">{r.fn}</p>
                <p className="text-3xs text-zinc-600">{r.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.ms !== null && (
                  <span className="text-3xs text-zinc-500 font-mono">{r.ms}ms</span>
                )}
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: "Live stats",
    desc: "Active workers, in-flight runs, backlog, and error rates — all pushed via WebSocket in real-time.",
  },
  {
    icon: Globe,
    title: "Service map",
    desc: "Interactive topology of all registered services and their RPC connections, live.",
  },
  {
    icon: Eye,
    title: "Run waterfall",
    desc: "Full execution trace across services — RPC spans, event fan-out, retries — in one view.",
  },
  {
    icon: Shield,
    title: "DLQ management",
    desc: "Browse failed events, inspect payloads, replay or discard — without leaving the UI.",
  },
];

export function DashboardSection() {
  const [activeTab, setActiveTab] = useState<UITab>("dashboard");

  const tabContent: Record<UITab, React.ReactNode> = {
    dashboard: <DashboardView />,
    map: <ServiceMapView />,
    runs: <RunsView />,
    events: <DashboardView />,
    jobs: <DashboardView />,
    workflows: <DashboardView />,
    dlq: <DashboardView />,
  };

  return (
    <AnimatedSection className="py-24 border-t border-white/[0.04]" id="ui">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Built-in Dashboard"
          title={
            <>
              Full visibility. <span className="text-gradient">Zero extra tooling.</span>
            </>
          }
          subtitle="A real-time web UI ships with ServiceBridge. Monitor runs, trace cross-service requests, manage DLQ, and explore your service topology — no Grafana, no Kibana, no extra setup."
        />

        <motion.div variants={fadeInUp} className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/50">
            {/* Browser chrome */}
            <div className="bg-zinc-900 border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3">
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
            <div className="flex bg-zinc-950" style={{ height: 420 }}>
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-white/[0.05] flex flex-col">
                <div className="px-3 py-3 border-b border-white/[0.05] flex items-center gap-2">
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
                    </button>
                  ))}
                </nav>
                <div className="px-4 py-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-3xs text-zinc-500">Live</span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-y-auto">{tabContent[activeTab]}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-10 grid sm:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {HIGHLIGHTS.map((item) => (
            <MiniCard key={item.title} icon={item.icon} title={item.title} desc={item.desc} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
