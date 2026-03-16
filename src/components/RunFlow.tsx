import { AnimatePresence, motion, useInView } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

type RunType = "event" | "rpc" | "job" | "workflow";
type RunStatus = "running" | "success" | "error" | "pending";

interface Run {
  id: string;
  name: string;
  service: string;
  type: RunType;
  status: RunStatus;
  startedAt: Date;
  durationMs: number | null;
}

const RUN_TEMPLATES: { name: string; service: string; type: RunType }[] = [
  { name: "order.created", service: "orders", type: "event" },
  { name: "payments.charge", service: "payments", type: "rpc" },
  { name: "notifications.send", service: "notifications", type: "event" },
  { name: "auth.sync", service: "auth", type: "job" },
  { name: "analytics.track", service: "analytics", type: "event" },
  { name: "billing.reconcile", service: "billing", type: "workflow" },
  { name: "warehouse.inventory", service: "warehouse", type: "event" },
  { name: "crm.contacts.get", service: "crm", type: "rpc" },
  { name: "reports.generate", service: "scheduler", type: "job" },
  { name: "mailer.send", service: "mailer", type: "event" },
];

const TYPE_COLORS: Record<RunType, string> = {
  event: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rpc: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  job: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  workflow: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function StatusCell({ status }: { status: RunStatus }) {
  const configs = {
    success: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
      label: "completed",
      color: "text-emerald-400",
    },
    error: {
      icon: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
      label: "failed",
      color: "text-red-400",
    },
    running: {
      icon: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />,
      label: "running",
      color: "text-amber-400",
    },
    pending: {
      icon: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />,
      label: "pending",
      color: "text-amber-400",
    },
  };
  const c = configs[status];
  return (
    <div className="flex items-center gap-1.5">
      {c.icon}
      <span className={cn("text-xs font-medium", c.color)}>{c.label}</span>
    </div>
  );
}

function makeInitialRuns(): Run[] {
  const now = Date.now();
  return [
    {
      id: "ord9f2a1b3c4",
      name: "order.created",
      service: "orders",
      type: "event",
      status: "success",
      startedAt: new Date(now - 14_200),
      durationMs: 21,
    },
    {
      id: "pay7e8d5c6b2",
      name: "payments.charge",
      service: "payments",
      type: "rpc",
      status: "success",
      startedAt: new Date(now - 11_800),
      durationMs: 44,
    },
    {
      id: "not3a2b1c9d8",
      name: "notifications.send",
      service: "notifications",
      type: "event",
      status: "success",
      startedAt: new Date(now - 9_500),
      durationMs: 17,
    },
    {
      id: "bil4f5e6d7c8",
      name: "billing.reconcile",
      service: "billing",
      type: "workflow",
      status: "error",
      startedAt: new Date(now - 7_100),
      durationMs: 68,
    },
    {
      id: "sch1a2b3c4d5",
      name: "reports.generate",
      service: "scheduler",
      type: "job",
      status: "success",
      startedAt: new Date(now - 4_300),
      durationMs: 9,
    },
    {
      id: "crm6b7c8d9e0",
      name: "crm.contacts.get",
      service: "crm",
      type: "rpc",
      status: "running",
      startedAt: new Date(now - 1_900),
      durationMs: null,
    },
  ];
}

export function RunFlowSection() {
  const [runs, setRuns] = useState<Run[]>(makeInitialRuns);
  const idxRef = useRef(0);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: false, margin: "-100px" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isInView) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const now = new Date();
      setRuns(
        RUN_TEMPLATES.slice(0, 7).map((t, i) => ({
          id: genId(),
          name: t.name,
          service: t.service,
          type: t.type,
          status: (i < 4 ? "success" : i === 4 ? "running" : "error") as RunStatus,
          startedAt: new Date(now.getTime() - (7 - i) * 9000),
          durationMs: i < 6 ? 12 + i * 14 : null,
        }))
      );
      return;
    }

    const addRun = () => {
      const template = RUN_TEMPLATES[idxRef.current % RUN_TEMPLATES.length];
      idxRef.current++;
      const id = genId();
      const willError = Math.random() < 0.15;
      const duration = 8 + Math.floor(Math.random() * 120);

      setRuns((prev) =>
        [
          {
            id,
            name: template.name,
            service: template.service,
            type: template.type,
            status: "running",
            startedAt: new Date(),
            durationMs: null,
          },
          ...prev,
        ].slice(0, 8)
      );

      const completeAfter = 600 + Math.random() * 1400;
      setTimeout(() => {
        setRuns((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: willError ? "error" : "success", durationMs: duration }
              : r
          )
        );
      }, completeAfter);
    };

    addRun();
    intervalRef.current = setInterval(addRun, 2200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInView]);

  return (
    <Section id="runs">
      <SectionHeader
        eyebrow="Traces"
        title="Every execution, tracked in real time"
        subtitle="Events, RPC calls, jobs and workflows — all runs are visible, filterable and inspectable with full trace details."
      />

      <div ref={contentRef}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-surface-border bg-code overflow-hidden shadow-2xl shadow-emerald-500/[0.04]">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-surface-border bg-code-chrome px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
                </div>
                <span className="type-overline-mono text-muted-foreground">
                  ServiceBridge — Traces
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-2xs font-mono text-emerald-500">live</span>
              </div>
            </div>

            {/* Column headers + rows — scroll horizontally on narrow screens */}
            <div className="overflow-x-auto">
              <div className="min-w-[540px]">
                <div className="grid grid-cols-[1fr_80px_120px_90px_70px] px-5 py-2.5 type-overline-mono text-muted-foreground/60 border-b border-white/[0.04]">
                  <span>Name &amp; Service</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span>Started</span>
                  <span className="text-right">Duration</span>
                </div>

                <div className="min-h-[320px]">
                  <AnimatePresence mode="popLayout">
                    {runs.map((run) => (
                      <motion.div
                        key={run.id}
                        layout
                        initial={{ opacity: 0, y: -10, backgroundColor: "rgba(52,211,153,0.07)" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "rgba(52,211,153,0)" }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-[1fr_80px_120px_90px_70px] px-5 py-3 border-b border-white/[0.03] last:border-0 items-center"
                      >
                        <div className="flex flex-col min-w-0 pr-3">
                          <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
                            {run.name}
                          </span>
                          <span className="text-3xs text-muted-foreground/60 mt-0.5">
                            {run.service}
                          </span>
                        </div>

                        <Badge tone={TYPE_COLORS[run.type]} className="w-fit">
                          {run.type}
                        </Badge>

                        <StatusCell status={run.status} />

                        <span className="text-3xs text-muted-foreground/70 font-mono tabular-nums">
                          {run.startedAt.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </span>

                        <span className="text-right font-mono text-3xs text-muted-foreground tabular-nums">
                          {run.durationMs !== null ? `${run.durationMs}ms` : "—"}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.04] px-5 py-3 flex flex-wrap items-center justify-between gap-2 type-overline-mono text-muted-foreground/60">
              <span>event · rpc · job · workflow · http</span>
              <div className="flex items-center gap-4">
                <span>
                  retries: <span className="text-amber-400">auto</span>
                </span>
                <span>
                  DLQ: <span className="text-emerald-400">enabled</span>
                </span>
                <span>
                  traces: <span className="text-blue-400">full</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
