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
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";
import { TabStrip } from "../ui/Tabs";
import { FlowTile } from "./feature-shared";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Via = "rpc" | "event" | "workflow";
type RunStatus = "success" | "running" | "pending" | "error";

// ─── Config ───────────────────────────────────────────────────────────────────

const VIA_CFG: Record<Via, { icon: typeof Zap; color: string; bg: string; border: string; label: string }> = {
  rpc: {
    icon: Zap,
    color: "text-blue-300",
    bg: "bg-blue-500/[0.08]",
    border: "border-blue-500/20",
    label: "rpc",
  },
  event: {
    icon: Radio,
    color: "text-emerald-300",
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/20",
    label: "event",
  },
  workflow: {
    icon: Workflow,
    color: "text-fuchsia-300",
    bg: "bg-fuchsia-500/[0.08]",
    border: "border-fuchsia-500/20",
    label: "workflow",
  },
};

// ─── Code tabs ────────────────────────────────────────────────────────────────

const TABS: {
  id: string;
  label: string;
  via: Via;
  badge: string;
  badgeTone: string;
  filename: FilenameLangs;
  code: CodeLangs;
}[] = [
  {
    id: "cron",
    label: "Cron",
    via: "rpc",
    badge: "recurring",
    badgeTone: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
    filename: { ts: "billing-service.ts", go: "billing_service.go", py: "billing_service.py" },
    code: {
      ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "billing");

// Runs every hour — fires immediately if the node was down
await sb.job("billing.reconcile", {
  cron: "0 * * * *",
  timezone: "UTC",
  misfire: "fire_now",
  via: "rpc",
  retryPolicyJson: JSON.stringify({ maxAttempts: 3, factor: 2 }),
});

sb.handleRpc("billing.reconcile", async () => {
  await reconcileAll();
  return { ok: true };
});

await sb.serve();`,

      go: `svc := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "billing", nil)

// Runs every hour — fires immediately if the node was down
jobID, _ := svc.Job(ctx, "billing.reconcile",
    servicebridge.ScheduleOpts{
        Cron:    "0 * * * *",
        Via:     "rpc",
        Misfire: "fire_now",
    })

svc.HandleRpc("billing.reconcile",
    func(ctx context.Context, p json.RawMessage) (any, error) {
        reconcileAll(ctx)
        return map[string]any{"ok": true}, nil
    })

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})`,

      py: `from servicebridge import ServiceBridge, ScheduleOpts

svc = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "billing")

# Runs every hour — fires immediately if the node was down
job_id = await svc.job(
    "billing.reconcile",
    ScheduleOpts(cron="0 * * * *", via="rpc", misfire="fire_now"),
)

@svc.handle_rpc("billing.reconcile")
async def billing_reconcile(payload: dict) -> dict:
    await reconcile_all()
    return {"ok": True}

await svc.serve()`,
    },
  },
  {
    id: "delayed",
    label: "Delayed",
    via: "event",
    badge: "one-shot",
    badgeTone: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
    filename: { ts: "onboarding-service.ts", go: "onboarding_service.go", py: "onboarding_service.py" },
    code: {
      ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "onboarding");

// Fires once after 24 hours, delivered as a durable event
await sb.job("trial.reminder", {
  delay: 24 * 60 * 60 * 1_000,
  via: "event",
});

// Subscriber picks it up with full retry guarantees
sb.handleEvent("trial.reminder", async (payload, ctx) => {
  const sent = await sendReminderEmail(payload);
  if (!sent) ctx.retry(60_000);
});

await sb.serve();`,

      go: `svc := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "onboarding", nil)

// Fires once after 24 hours, delivered as a durable event
svc.Job(ctx, "trial.reminder", servicebridge.ScheduleOpts{
    DelayMs: 24 * 60 * 60 * 1000,
    Via:     "event",
})

// Subscriber picks it up with full retry guarantees
svc.HandleEvent("trial.reminder",
    func(ctx context.Context, p json.RawMessage, ec *servicebridge.EventContext) error {
        if !sendReminderEmail(ctx, p) {
            return ec.Retry(60_000)
        }
        return nil
    }, nil)

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})`,

      py: `from servicebridge import ServiceBridge, ScheduleOpts

svc = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "onboarding")

# Fires once after 24 hours, delivered as a durable event
await svc.job(
    "trial.reminder",
    ScheduleOpts(delay_ms=24 * 60 * 60 * 1000, via="event"),
)

# Subscriber picks it up with full retry guarantees
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
    via: "workflow",
    badge: "workflow trigger",
    badgeTone: "border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300",
    filename: { ts: "platform-service.ts", go: "platform_service.go", py: "platform_service.py" },
    code: {
      ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "platform");

// Daily job — kicks off a full workflow run
await sb.job("billing.daily", {
  cron: "0 2 * * *",
  timezone: "Europe/Berlin",
  misfire: "skip",  // drop if previous run still active
  via: "workflow",
});

await sb.workflow("billing.daily", [
  { id: "fetch",   type: "rpc",   ref: "billing.fetchDue",   deps: [] },
  { id: "process", type: "rpc",   ref: "billing.processAll", deps: ["fetch"] },
  { id: "notify",  type: "event", ref: "billing.reconciled", deps: ["process"] },
]);

await sb.serve();`,

      go: `svc := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "platform", nil)

// Daily job — kicks off a full workflow run
svc.Job(ctx, "billing.daily", servicebridge.ScheduleOpts{
    Cron:    "0 2 * * *",
    Via:     "workflow",
    Misfire: "skip",
})

svc.Workflow(ctx, "billing.daily", []servicebridge.WorkflowStep{
    {Name: "fetch",   Fn: "billing.fetchDue",   Payload: map[string]any{}},
    {Name: "process", Fn: "billing.processAll",
        DependsOn: []string{"fetch"}},
    {Name: "notify",  Fn: "billing.reconciled",
        DependsOn: []string{"process"}},
})

_ = svc.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})`,

      py: `from servicebridge import ServiceBridge, ScheduleOpts, WorkflowStep

svc = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "platform")

# Daily job — kicks off a full workflow run
await svc.job(
    "billing.daily",
    ScheduleOpts(cron="0 2 * * *", via="workflow", misfire="skip"),
)

await svc.workflow("billing.daily", [
    WorkflowStep(name="fetch",   fn="billing.fetchDue",   payload={}),
    WorkflowStep(name="process", fn="billing.processAll", payload={},
        depends_on=["fetch"]),
    WorkflowStep(name="notify",  fn="billing.reconciled", payload={},
        depends_on=["process"]),
])

await svc.serve()`,
    },
  },
];

// ─── Timeline data ─────────────────────────────────────────────────────────────
// nextMin = minutes until next run (out of 60-min window)

const TIMELINE_JOBS = [
  { id: "tj1", name: "metrics.export", via: "rpc" as Via, nextMin: 4 },
  { id: "tj2", name: "trial.reminder", via: "event" as Via, nextMin: 14 },
  { id: "tj3", name: "billing.reconcile", via: "rpc" as Via, nextMin: 27 },
  { id: "tj4", name: "reports.generate", via: "rpc" as Via, nextMin: 38 },
  { id: "tj5", name: "billing.daily", via: "workflow" as Via, nextMin: 52 },
] as const;

// ─── Run table data ───────────────────────────────────────────────────────────

interface JobRun {
  id: string;
  name: string;
  schedule: string;
  via: Via;
  status: RunStatus;
  nextRun: string;
}

const INITIAL_RUNS: JobRun[] = [
  { id: "r1", name: "reports.generate", schedule: "0 * * * *", via: "rpc", status: "success", nextRun: "in 47m" },
  { id: "r2", name: "sync.billing", schedule: "*/15 * * * *", via: "rpc", status: "running", nextRun: "running" },
  { id: "r3", name: "trial.reminder", schedule: "delay 24h", via: "event", status: "success", nextRun: "one-shot" },
  { id: "r4", name: "billing.daily", schedule: "0 2 * * *", via: "workflow", status: "pending", nextRun: "in 3h 14m" },
];

const EXTRA_RUNS: Omit<JobRun, "id">[] = [
  { name: "metrics.export", schedule: "*/5 * * * *", via: "rpc", status: "success", nextRun: "in 4m" },
  { name: "cleanup.sessions", schedule: "0 0 * * *", via: "event", status: "success", nextRun: "in 20h" },
];

// ─── Small components ─────────────────────────────────────────────────────────

function ViaTag({ via }: { via: Via }) {
  const cfg = VIA_CFG[via];
  const Icon = cfg.icon;
  return (
    <Badge tone={cn(cfg.bg, cfg.border, cfg.color)} className="inline-flex items-center gap-1 shrink-0">
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </Badge>
  );
}

function StatusDot({ status }: { status: RunStatus }) {
  return (
    <Badge
      tone={cn(
        "inline-flex items-center gap-1 shrink-0",
        status === "success" && "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
        status === "running" && "border-blue-500/20 bg-blue-500/[0.08] text-blue-300",
        status === "pending" && "border-surface-border bg-surface text-zinc-500",
        status === "error" && "border-red-500/20 bg-red-500/[0.08] text-red-300"
      )}
    >
      {status === "running" ? (
        <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
      ) : status === "success" ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <Clock className="w-2.5 h-2.5" />
      )}
      {status}
    </Badge>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

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
      const extra = EXTRA_RUNS[idx];
      idx++;
      setRuns((prev) => [{ ...extra, id: `r${runCounter++}` }, ...prev.slice(0, 5)]);
    }, 3200);
    return () => clearInterval(t);
  }, [inView]);

  const tab = TABS[activeTab];

  const demoContent = (
    <CodePanel>
      {/* Chrome bar */}
      <div className="flex items-center gap-3 border-b border-surface-border bg-code-chrome px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <p className="font-mono text-2xs text-zinc-500 flex-1">
          scheduler · PostgreSQL-backed · tick 1s
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-2xs text-amber-400/70">running</span>
        </div>
      </div>

      <div ref={tableRef} className="bg-code">
        {/* ── Upcoming runs list ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="type-overline-mono text-muted-foreground">upcoming · next 60 min</p>
            <Badge tone="border-amber-500/20 bg-amber-500/[0.08] text-amber-300">
              scheduler live
            </Badge>
          </div>

          <div className="space-y-1.5">
            {TIMELINE_JOBS.map((job, i) => {
              const cfg = VIA_CFG[job.via];
              const barPct = (job.nextMin / 60) * 100;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2"
                >
                  {/* Time indicator */}
                  <span className="text-3xs font-mono text-zinc-500 w-8 shrink-0 text-right">
                    +{job.nextMin}m
                  </span>

                  {/* Colored via dot */}
                  <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.bg, "border", cfg.border)} />

                  {/* Job name */}
                  <span className="text-xs font-mono text-zinc-300 flex-1 truncate">
                    {job.name}
                  </span>

                  {/* Proportional time bar */}
                  <div className="w-20 h-1 bg-white/[0.04] rounded-full overflow-hidden shrink-0">
                    <div
                      className={cn("h-full rounded-full opacity-50", cfg.bg)}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  {/* Via tag */}
                  <span className={cn("text-3xs font-mono shrink-0", cfg.color)}>
                    {cfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Live run table ── */}
        <div className="px-5 pb-4 space-y-2">
          <div className="grid gap-3 px-3 pb-1 text-3xs font-mono uppercase tracking-widest text-zinc-600"
            style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}>
            <span>job</span>
            <span>via</span>
            <span>status</span>
            <span>next</span>
          </div>

          <AnimatePresence initial={false}>
            {runs.map((run) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: -8, backgroundColor: "rgba(52,211,153,0.08)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,0)" }}
                transition={{ duration: 0.4 }}
                className="grid gap-3 items-center rounded-2xl border border-surface-border bg-surface px-4 py-3"
                style={{ gridTemplateColumns: "minmax(0,1fr) auto auto auto" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold font-display text-zinc-200">
                    {run.name}
                  </p>
                  <p className="text-3xs font-mono text-zinc-600 mt-0.5">{run.schedule}</p>
                </div>
                <ViaTag via={run.via} />
                <StatusDot status={run.status} />
                <span className="text-3xs font-mono text-zinc-500 text-right">
                  {run.nextRun}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Dispatch modes + misfire ── */}
        <div className="border-t border-surface-border px-5 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {(["rpc", "event", "workflow"] as Via[]).map((mode) => {
              const cfg = VIA_CFG[mode];
              const Icon = cfg.icon;
              const desc = {
                rpc: "Direct function call",
                event: "Durable event publish",
                workflow: "Enqueue workflow run",
              }[mode];
              return (
                <Card
                  key={mode}
                  className={cn(
                    "p-3 flex flex-col gap-1.5",
                    cfg.bg,
                    cfg.border
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                    <span className={cn("text-xs font-semibold font-mono", cfg.color)}>
                      &quot;{mode}&quot;
                    </span>
                  </div>
                  <p className="type-body-sm text-zinc-500">{desc}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="type-overline-mono text-muted-foreground mb-2">misfire policy</p>
              {(
                [
                  { key: "fire_now", desc: "catch up all missed ticks" },
                  { key: "skip", desc: "discard missed, advance next" },
                ] as const
              ).map(({ key, desc }) => (
                <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
                  <Badge tone="text-amber-300 bg-amber-500/[0.06] border-amber-500/20">
                    {key}
                  </Badge>
                  <span className="text-3xs text-zinc-500">{desc}</span>
                </div>
              ))}
            </Card>
            <div className="grid gap-1.5">
              <FlowTile label="persistence" value="PostgreSQL" tone="text-violet-300" />
              <FlowTile label="concurrency" value="1 active / job" tone="text-blue-300" />
            </div>
          </div>
        </div>
      </div>
    </CodePanel>
  );

  const contentPanel = (
    <div className="space-y-4">
      {/* Tab card */}
      <CodePanel>
        <div className="border-b border-surface-border bg-code-chrome px-4 py-3">
          <TabStrip
            size="md"
            items={TABS.map((t) => ({ id: t.id, label: t.label }))}
            active={TABS[activeTab].id}
            onChange={(id) => setActiveTab(TABS.findIndex((t) => t.id === id))}
          />
        </div>
        <div className="p-5">
          <MultiCodeBlock code={tab.code} filename={tab.filename} />
        </div>
      </CodePanel>
    </div>
  );

  const miniCards = (
    <>
      <MiniCard
        icon={AlarmClock}
        title="Cron + delayed"
        desc="Full cron syntax with optional seconds and timezone. One-shot delayed tasks with millisecond precision. Cron and delay are mutually exclusive."
        iconClassName="text-amber-400"
      />
      <MiniCard
        icon={CalendarClock}
        title="Misfire handling"
        desc="fire_now catches up all missed ticks after downtime. skip discards backlog and advances to the next scheduled slot."
        iconClassName="text-blue-400"
      />
      <MiniCard
        icon={GitBranch}
        title="Dispatch anywhere"
        desc="Jobs invoke an RPC function, publish a durable event, or kick off a full workflow run — the same primitives, scheduled."
        iconClassName="text-fuchsia-400"
      />
      <MiniCard
        icon={Timer}
        title="Lease-based recovery"
        desc="At most one active execution per job at a time. If a node dies, lease expiry lets another node reclaim and continue automatically."
        iconClassName="text-cyan-400"
      />
    </>
  );

  return (
    <FeatureSection
      id="jobs"
      eyebrow="Built-in Jobs"
      title="Cron, delayed, and workflow-triggered — no daemon needed."
      subtitle="Persistent scheduled executions backed by PostgreSQL. No external cron daemon, no separate queue worker. Jobs dispatch via RPC, events, or workflows with misfire handling and automatic lease-based recovery."
      content={contentPanel}
      demo={demoContent}
      cards={miniCards}
    />
  );
}

