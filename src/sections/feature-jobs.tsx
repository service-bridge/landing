import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  AlarmClock,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  GitBranch,
  RefreshCcw,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs, FilenameLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

type Trig = "cron" | "delayed" | "interval";
type TraceStatus = "success" | "running" | "pending" | "dead_letter";

const TRIG_ICON: Record<Trig, typeof Timer> = {
  cron: CalendarClock,
  delayed: AlarmClock,
  interval: Timer,
};
const TRIG_TONE: Record<Trig, string> = {
  cron: "border-blue-500/30 bg-transparent text-blue-300/80",
  delayed: "border-amber-500/30 bg-transparent text-amber-300/80",
  interval: "border-fuchsia-500/30 bg-transparent text-fuchsia-300/80",
};
const STATUS_TONE: Record<TraceStatus, string> = {
  success: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
  running: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  pending: "border-surface-border bg-surface text-muted-foreground/70",
  dead_letter: "border-red-500/20 bg-red-500/[0.08] text-red-300",
};

const TABS: { id: string; label: string; filename: FilenameLangs; code: CodeLangs }[] = [
  {
    id: "cron",
    label: "Cron",
    filename: { ts: "billing-service.ts" },
    code: {
      ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

// Runs every hour. fire_all replays every tick missed while down.
sb.job.handle(
  "reconcile",
  {
    trigger: { cron: "0 * * * *", tz: "UTC" }, // 5-field cron
    catchup: "fire_all",
    overlap: "skip",
    deps: [{ rpc: "billing.reconcileAll" }],
    maxAttempts: 3,
  },
  async (ctx) => {
    // Jobs carry no payload — only ctx. Be idempotent by ctx.idempotencyKey.
    await sb.rpc.call("billing", "reconcileAll", { runId: ctx.idempotencyKey });
  },
);

await sb.start();`,
    },
  },
  {
    id: "delayed",
    label: "Delayed",
    filename: { ts: "onboarding-service.ts" },
    code: {
      ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

// Fires once at a wall-clock instant. at = Date | number (unix-ms) | string.
sb.job.handle(
  "trial.reminder",
  {
    trigger: { delayed: { at: Date.now() + 24 * 60 * 60 * 1_000 } },
    deps: [{ event: "email.reminder.requested" }],
  },
  async (ctx) => {
    await sb.event.publish("email.reminder.requested", {
      scheduledAt: ctx.scheduledAt.getTime(),
    });
  },
);

await sb.start();`,
    },
  },
  {
    id: "interval",
    label: "Interval + Workflow",
    filename: { ts: "platform-service.ts" },
    code: {
      ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

// Every 5 minutes (interval is milliseconds). overlap: buffer_one
// keeps at most one queued run if the previous tick is still busy.
sb.job.handle(
  "billing.daily",
  {
    trigger: { interval: 5 * 60 * 1_000 },
    overlap: "buffer_one",
    deps: [{ workflow: "billing.settle" }],
  },
  async (ctx) => {
    // Kick off a durable workflow and wait for the terminal state.
    const { runId } = await sb.workflow.start("billing.settle", {
      date: ctx.scheduledAt.toISOString(),
    });
    await sb.workflow.await(runId); // resolves only on "success"
  },
);

await sb.start();`,
    },
  },
];

interface JobRun {
  id: string;
  name: string;
  schedule: string;
  trig: Trig;
  status: TraceStatus;
  nextRun: string;
}

const INITIAL_RUNS: JobRun[] = [
  {
    id: "r1",
    name: "reports.generate",
    schedule: "cron 0 * * * *",
    trig: "cron",
    status: "success",
    nextRun: "in 47m",
  },
  {
    id: "r2",
    name: "metrics.export",
    schedule: "interval 5m",
    trig: "interval",
    status: "running",
    nextRun: "running",
  },
  {
    id: "r3",
    name: "trial.reminder",
    schedule: "delayed +24h",
    trig: "delayed",
    status: "success",
    nextRun: "one-shot",
  },
  {
    id: "r4",
    name: "billing.daily",
    schedule: "cron 0 2 * * *",
    trig: "cron",
    status: "pending",
    nextRun: "in 3h 14m",
  },
];

const EXTRA_RUNS: Omit<JobRun, "id">[] = [
  {
    name: "sync.inventory",
    schedule: "interval 30s",
    trig: "interval",
    status: "success",
    nextRun: "in 12s",
  },
  {
    name: "cleanup.sessions",
    schedule: "cron 0 0 * * *",
    trig: "cron",
    status: "dead_letter",
    nextRun: "DLQ",
  },
];

let runCounter = INITIAL_RUNS.length + 1;

export function JobsSection() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-60px" });
  const [activeTab, setActiveTab] = useState(0);
  const [runs, setRuns] = useState<JobRun[]>(INITIAL_RUNS);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const t = setInterval(() => {
      if (idx >= EXTRA_RUNS.length) {
        clearInterval(t);
        return;
      }
      const extra = EXTRA_RUNS[idx++];
      setRuns((prev) => [{ ...extra, id: `r${runCounter++}` }, ...prev.slice(0, 5)]);
    }, 3200);
    return () => clearInterval(t);
  }, [inView]);

  const tab = TABS[activeTab];

  const maxJobLines = Math.max(
    ...TABS.flatMap((t) => Object.values(t.code).map((c) => (c ?? "").trim().split("\n").length))
  );
  const minJobCodeHeight = maxJobLines * 20 + 40;

  const TrigIcon = ({ trig }: { trig: Trig }) => {
    const Icon = TRIG_ICON[trig];
    return (
      <Badge tone={cn(TRIG_TONE[trig], "inline-flex items-center gap-1 shrink-0")}>
        <Icon className="w-2.5 h-2.5" />
        {trig}
      </Badge>
    );
  };

  return (
    <FeatureSection
      id="jobs"
      eyebrow="Built-in Jobs"
      title="Cron, delayed, and interval — no daemon needed."
      subtitle="Scheduled jobs backed by PostgreSQL — no cron daemon, no queue worker. Each job is a handler that calls RPC, publishes events, or starts workflows, with at-least-once recovery."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">scheduler</p>
            <h2 className="mt-2 type-subsection-title">Declare a handler. Run it on schedule.</h2>
            <p className="mt-3 type-body-sm">
              Jobs live in PostgreSQL, dispatched on a 1s poll. After downtime,{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                fire_all
              </code>{" "}
              replays missed ticks,{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                skip
              </code>{" "}
              jumps to the next slot.{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                Lease
              </code>{" "}
              locking +{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                overlap
              </code>{" "}
              keep one active run per job.
            </p>
            <Button asChild variant="link" size="sm" className="mt-3 h-auto px-0 text-emerald-300">
              <a href="#docs">
                Read the Jobs guide
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </Card>
          <div className="rounded-2xl border border-surface-border overflow-hidden">
            <div className="border-b border-surface-border bg-code-chrome px-4 py-3">
              <TabStrip
                size="md"
                items={TABS.map((t) => ({ id: t.id, label: t.label }))}
                active={TABS[activeTab].id}
                onChange={(id) => setActiveTab(TABS.findIndex((t) => t.id === id))}
              />
            </div>
            <div className="p-4" style={{ minHeight: minJobCodeHeight + 48 }}>
              <MultiCodeBlock code={tab.code} filename={tab.filename} />
            </div>
          </div>
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title="scheduler · PostgreSQL-backed · poll 1s">
            <div className="flex items-center gap-2 absolute top-2.5 right-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-2xs text-amber-400/70">running</span>
            </div>

            <div ref={tableRef} className="p-4 space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 px-3 pb-1 text-3xs font-mono uppercase tracking-widest text-muted-foreground/60">
                <span>job</span>
                <span className="hidden sm:inline">trigger</span>
                <span>status</span>
                <span>next</span>
              </div>

              <AnimatePresence initial={false}>
                {runs.map((run) => {
                  const StatusIcon =
                    run.status === "running"
                      ? RefreshCcw
                      : run.status === "success"
                        ? CheckCircle2
                        : run.status === "dead_letter"
                          ? AlertTriangle
                          : Clock;
                  return (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: -8, backgroundColor: "rgba(255,255,255,0.08)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,0)" }}
                      transition={{ duration: 0.4 }}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-center rounded-xl border border-surface-border bg-surface px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold font-display text-zinc-200">
                          {run.name}
                        </p>
                        <p className="text-3xs font-mono text-muted-foreground/60 mt-0.5">
                          {run.schedule}
                        </p>
                      </div>
                      <span className="hidden sm:inline-flex">
                        <TrigIcon trig={run.trig} />
                      </span>
                      <Badge
                        tone={cn(
                          STATUS_TONE[run.status],
                          "inline-flex items-center gap-1 shrink-0"
                        )}
                      >
                        <StatusIcon
                          className={cn("w-2.5 h-2.5", run.status === "running" && "animate-spin")}
                        />
                        {run.status}
                      </Badge>
                      <span className="text-3xs font-mono text-muted-foreground/70 text-right">
                        {run.nextRun}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={GitBranch}
            title="Call anything"
            description="The handler is plain code with a ctx — call an RPC, publish a durable event, or start a workflow. Declared deps gate what the job body may reach."
            iconClassName="text-fuchsia-400"
          />
          <FeatureCard
            variant="compact"
            icon={AlarmClock}
            title="Cron, delayed, interval"
            description="5-field cron with timezone, one-shot delayed jobs at an exact instant, or fixed millisecond intervals."
            iconClassName="text-amber-400"
          />
          <FeatureCard
            variant="compact"
            icon={CalendarClock}
            title="Catchup + overlap"
            description="fire_all / fire_once replay missed ticks; skip drops the backlog. overlap gates a new tick while the previous run is busy."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={Timer}
            title="Lease-based recovery"
            description="One active run per job. If a node dies, lease expiry lets the runtime reclaim and re-dispatch — at-least-once, idempotent by ctx.idempotencyKey."
            iconClassName="text-cyan-400"
          />
        </>
      }
    />
  );
}
