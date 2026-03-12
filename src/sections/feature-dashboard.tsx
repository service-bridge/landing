import { motion, useInView } from "framer-motion";
import { Activity, Eye, Globe, Shield } from "lucide-react";
import { useState, useRef } from "react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const MOCK_BARS = [28, 45, 32, 67, 89, 54, 76, 92, 61, 43, 78, 95, 82, 67, 55, 88, 71, 44, 63, 79];

const STATUS_TONE: Record<string, string> = {
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  running: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  failed: "border-red-500/25 bg-red-500/10 text-red-400",
  pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
};

const STATS = [
  { label: "Active Workers", value: "12", color: "text-emerald-400" },
  { label: "In-Flight", value: "34", color: "text-blue-400" },
  { label: "Backlog", value: "7", color: "text-amber-400" },
  { label: "DLQ", value: "2", color: "text-red-400" },
] as const;

const RECENT_RUNS = [
  { fn: "orders.create", svc: "order-svc", status: "completed", ms: "14ms" },
  { fn: "payments.charge", svc: "pay-svc", status: "completed", ms: "221ms" },
  { fn: "users.get", svc: "user-svc", status: "running", ms: null },
  { fn: "notify.send", svc: "notif-svc", status: "failed", ms: "45ms" },
  { fn: "analytics.track", svc: "analytics", status: "completed", ms: "32ms" },
];

const HIGHLIGHTS = [
  { icon: Activity, title: "Live stats", desc: "Active workers, in-flight runs, backlog, and error rates pushed via WebSocket in real-time." },
  { icon: Globe, title: "Service map", desc: "Interactive topology of all registered services and their live RPC and event connections." },
  { icon: Eye, title: "Run waterfall", desc: "Full execution trace across services — RPC spans, event fan-out, retries — in one waterfall view." },
  { icon: Shield, title: "DLQ management", desc: "Browse failed events, inspect payloads, replay individually or in batch — without leaving the UI." },
] as const;

export function DashboardSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });
  const maxBar = Math.max(...MOCK_BARS);

  const demoPanel = (
    <motion.div variants={fadeInUp} className="w-full" ref={sectionRef}>
      <div className="rounded-2xl border border-surface-border overflow-hidden shadow-2xl shadow-black/50">
        {/* Browser chrome */}
        <div className="bg-background border-b border-surface-border px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-zinc-800 rounded-md px-4 py-1 text-2xs text-muted-foreground font-mono flex items-center gap-2">
              <BrandMark className="w-3 h-3 text-emerald-400 shrink-0" />
              localhost:14444
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-2xs font-mono text-emerald-400/70">Live</span>
          </div>
        </div>

        {/* Dashboard content — no sidebar */}
        <div className="bg-zinc-950 p-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Card className="p-2.5">
                  <p className="type-overline-mono text-muted-foreground mb-1">{s.label}</p>
                  <p className={cn("text-base font-bold font-mono", s.color)}>{s.value}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Activity chart */}
          <Card className="p-3">
            <p className="type-overline-mono text-muted-foreground mb-2">Activity — last 20 min</p>
            <div className="flex items-end gap-[3px] h-14">
              {MOCK_BARS.map((value, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm bg-emerald-500/35"
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${(value / maxBar) * 100}%` } : { height: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                />
              ))}
            </div>
          </Card>

          {/* Recent runs */}
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-surface-border">
              <p className="type-overline-mono text-muted-foreground">Recent runs</p>
            </div>
            {RECENT_RUNS.map((r) => (
              <div key={r.fn} className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-3xs font-mono text-muted-foreground">{r.fn}</p>
                  <p className="text-3xs text-muted-foreground/60">{r.svc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.ms && <span className="text-3xs text-muted-foreground/70 font-mono">{r.ms}</span>}
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </motion.div>
  );

  return (
    <FeatureSection
      id="dashboard"
      eyebrow="Built-in Dashboard"
      title={<>Full visibility. Zero extra tooling.</>}
      subtitle="A real-time web UI ships with ServiceBridge. Monitor runs, trace cross-service requests, manage DLQ, browse events and jobs — no Grafana, no Kibana, no extra setup."
      content={demoPanel}
      demo={<></>}
      cards={
        <>
          {HIGHLIGHTS.map((item) => (
            <FeatureCard
              key={item.title}
              variant="compact"
              icon={item.icon}
              title={item.title}
              description={item.desc}
            />
          ))}
        </>
      }
    />
  );
}
