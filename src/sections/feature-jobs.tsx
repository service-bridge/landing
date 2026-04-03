import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  Clock,
  GitBranch,
  Radio,
  RefreshCcw,
  Timer,
  Workflow,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs, FilenameLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

type Via = "rpc" | "event" | "workflow";
type TraceStatus = "success" | "running" | "pending" | "error";

const VIA_ICON: Record<Via, typeof Zap> = { rpc: Zap, event: Radio, workflow: Workflow };
const VIA_TONE: Record<Via, string> = {
  rpc: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  event: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
  workflow: "border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300",
};
const STATUS_TONE: Record<TraceStatus, string> = {
  success: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
  running: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
  pending: "border-surface-border bg-surface text-muted-foreground/70",
  error: "border-red-500/20 bg-red-500/[0.08] text-red-300",
};

const TABS: { id: string; label: string; filename: FilenameLangs; code: CodeLangs }[] = [
  {
    id: "cron",
    label: "Cron",
    filename: { ts: "billing-service.ts", go: "billing_service.go", py: "billing_service.py" },
    code: {
      ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

// Runs every hour — fires immediately if the node was down
await sb.job("billing", "reconcile", {
  cron: "0 * * * *",
  timezone: "UTC",
  misfire: "fire_now",
  via: "rpc",
  retryPolicyJson: JSON.stringify({ maxAttempts: 3, factor: 2 }),
});

sb.handleRpc("reconcile", async () => {
  await reconcileAll();
  return { ok: true };
});

await sb.serve();`,
      go: `svc := servicebridge.New(
    "localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

_, _ := svc.JobRPC(ctx, "billing", "reconcile",
    servicebridge.ScheduleOpts{
        Cron:    "0 * * * *",
        Misfire: "fire_now",
    })

svc.HandleRpc("reconcile",
    func(ctx context.Context, p json.RawMessage) (any, error) {
        reconcileAll(ctx)
        return map[string]any{"ok": true}, nil
    })

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "localhost"})`,
      py: `from service_bridge import ServiceBridge, ScheduleOpts

svc = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

job_id = await svc.job_rpc(
    "billing", "reconcile",
    ScheduleOpts(cron="0 * * * *", misfire="fire_now"),
)

@svc.handle_rpc("reconcile")
async def billing_reconcile(payload: dict) -> dict:
    await reconcile_all()
    return {"ok": True}

await svc.serve()`,
    },
  },
  {
    id: "delayed",
    label: "Delayed",
    filename: {
      ts: "onboarding-service.ts",
      go: "onboarding_service.go",
      py: "onboarding_service.py",
    },
    code: {
      ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

// Fires once after 24 hours, delivered as a durable event
await sb.job("trial.reminder", {
  delay: 24 * 60 * 60 * 1_000,
  via: "event",
});

sb.handleEvent("trial.reminder", async (payload, ctx) => {
  const sent = await sendReminderEmail(payload);
  if (!sent) ctx.retry(60_000);
});

await sb.serve();`,
      go: `svc := servicebridge.New(
    "localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

svc.Job(ctx, "trial.reminder", servicebridge.ScheduleOpts{
    DelayMs: 24 * 60 * 60 * 1000,
    Via:     "event",
})

svc.HandleEvent("trial.reminder",
    func(ctx context.Context, p json.RawMessage, ec *servicebridge.EventContext) error {
        if !sendReminderEmail(ctx, p) {
            ec.Retry(60_000); return nil
        }
        return nil
    }, nil)

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "localhost"})`,
      py: `from service_bridge import ServiceBridge, ScheduleOpts

svc = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

await svc.job(
    "trial.reminder",
    ScheduleOpts(delay_ms=24 * 60 * 60 * 1000, via="event"),
)

@svc.handle_event("trial.reminder")
async def on_reminder(payload: dict, ctx) -> None:
    sent = await send_reminder_email(payload)
    if not sent:
        ctx.retry(60_000)

await svc.serve()`,
    },
  },
  {
    id: "workflow",
    label: "Via Workflow",
    filename: { ts: "platform-service.ts", go: "platform_service.go", py: "platform_service.py" },
    code: {
      ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

// Daily job — kicks off a full workflow run
await sb.job("billing.daily", {
  cron: "0 2 * * *",
  timezone: "Europe/Berlin",
  misfire: "skip",
  via: "workflow",
});

await sb.workflow("billing.daily", [
  { id: "fetch",   type: "rpc",   service: "billing", ref: "fetchDue",   deps: [] },
  { id: "process", type: "rpc",   service: "billing", ref: "processAll", deps: ["fetch"] },
  { id: "notify",  type: "event", ref: "billing.reconciled", deps: ["process"] },
]);

await sb.serve();`,
      go: `svc := servicebridge.New(
    "localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

svc.JobWorkflow(ctx, "billing.daily", servicebridge.ScheduleOpts{
    Cron:    "0 2 * * *",
    Misfire: "skip",
})

svc.Workflow(ctx, "billing.daily", []servicebridge.WorkflowStep{
    {ID: "fetch",   Type: "rpc",   Service: "billing", Ref: "fetchDue",   Deps: []string{}},
    {ID: "process", Type: "rpc",   Service: "billing", Ref: "processAll", Deps: []string{"fetch"}},
    {ID: "notify",  Type: "event", Ref: "billing.reconciled", Deps: []string{"process"}},
}, nil)

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "localhost"})`,
      py: `from service_bridge import ServiceBridge, ScheduleOpts, WorkflowStep

svc = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

await svc.job_workflow(
    "billing.daily",
    ScheduleOpts(cron="0 2 * * *", misfire="skip"),
)

await svc.workflow("billing.daily", [
    WorkflowStep(id="fetch",   type="rpc",   service="billing", ref="fetchDue",   deps=[]),
    WorkflowStep(id="process", type="rpc",   service="billing", ref="processAll", deps=["fetch"]),
    WorkflowStep(id="notify",  type="event", ref="billing.reconciled", deps=["process"]),
])

await svc.serve()`,
    },
  },
];

interface JobRun {
  id: string;
  name: string;
  schedule: string;
  via: Via;
  status: TraceStatus;
  nextRun: string;
}

const INITIAL_RUNS: JobRun[] = [
  {
    id: "r1",
    name: "reports.generate",
    schedule: "0 * * * *",
    via: "rpc",
    status: "success",
    nextRun: "in 47m",
  },
  {
    id: "r2",
    name: "sync.billing",
    schedule: "*/15 * * * *",
    via: "rpc",
    status: "running",
    nextRun: "running",
  },
  {
    id: "r3",
    name: "trial.reminder",
    schedule: "delay 24h",
    via: "event",
    status: "success",
    nextRun: "one-shot",
  },
  {
    id: "r4",
    name: "billing.daily",
    schedule: "0 2 * * *",
    via: "workflow",
    status: "pending",
    nextRun: "in 3h 14m",
  },
];

const EXTRA_RUNS: Omit<JobRun, "id">[] = [
  {
    name: "metrics.export",
    schedule: "*/5 * * * *",
    via: "rpc",
    status: "success",
    nextRun: "in 4m",
  },
  {
    name: "cleanup.sessions",
    schedule: "0 0 * * *",
    via: "event",
    status: "success",
    nextRun: "in 20h",
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

  const ViaIcon = ({ via }: { via: Via }) => {
    const Icon = VIA_ICON[via];
    return (
      <Badge tone={cn(VIA_TONE[via], "inline-flex items-center gap-1 shrink-0")}>
        <Icon className="w-2.5 h-2.5" />
        {via}
      </Badge>
    );
  };

  return (
    <FeatureSection
      id="jobs"
      eyebrow="Built-in Jobs"
      title="Cron, delayed, and workflow-triggered — no daemon needed."
      subtitle="Persistent scheduled executions backed by PostgreSQL. No external cron daemon, no separate queue worker. Jobs dispatch via RPC, events, or workflows with misfire handling and automatic lease-based recovery."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">scheduler</p>
            <h2 className="mt-2 type-subsection-title">Schedule once. Dispatch anywhere.</h2>
            <p className="mt-3 type-body-sm">
              Jobs are stored in PostgreSQL and scheduled with a 1s tick. On misfire,{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                fire_now
              </code>{" "}
              catches up all missed ticks while{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">skip</code>{" "}
              advances to the next slot. Lease-based locking ensures at most one active execution
              per job.
            </p>
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
          <CodePanel title="scheduler · PostgreSQL-backed · tick 1s">
            <div className="flex items-center gap-2 absolute top-2.5 right-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-2xs text-amber-400/70">running</span>
            </div>

            <div ref={tableRef} className="p-4 space-y-2">
              <div
                className="grid gap-3 px-3 pb-1 text-3xs font-mono uppercase tracking-widest text-muted-foreground/60"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
              >
                <span>job</span>
                <span>via</span>
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
                        : Clock;
                  return (
                    <motion.div
                      key={run.id}
                      initial={{ opacity: 0, y: -8, backgroundColor: "rgba(52,211,153,0.08)" }}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,0)" }}
                      transition={{ duration: 0.4 }}
                      className="grid gap-3 items-center rounded-xl border border-surface-border bg-surface px-4 py-3"
                      style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold font-display text-zinc-200">
                          {run.name}
                        </p>
                        <p className="text-3xs font-mono text-muted-foreground/60 mt-0.5">
                          {run.schedule}
                        </p>
                      </div>
                      <ViaIcon via={run.via} />
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
            icon={AlarmClock}
            title="Cron + delayed"
            description="Full cron syntax with optional seconds and timezone. One-shot delayed tasks with millisecond precision."
            iconClassName="text-amber-400"
          />
          <FeatureCard
            variant="compact"
            icon={CalendarClock}
            title="Misfire handling"
            description="fire_now catches up all missed ticks after downtime. skip discards backlog and advances to the next scheduled slot."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={GitBranch}
            title="Dispatch anywhere"
            description="Jobs invoke an RPC function, publish a durable event, or kick off a full workflow run — the same primitives, scheduled."
            iconClassName="text-fuchsia-400"
          />
          <FeatureCard
            variant="compact"
            icon={Timer}
            title="Lease-based recovery"
            description="At most one active execution per job. If a node dies, lease expiry lets another node reclaim and continue automatically."
            iconClassName="text-cyan-400"
          />
        </>
      }
    />
  );
}
