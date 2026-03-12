import { motion, useInView } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  GitMerge,
  Hourglass,
  Pause,
  Radio,
  RefreshCcw,
  Workflow,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";
import { FlowTile } from "./feature-shared";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NodeType = "rpc" | "event" | "sleep" | "event_wait" | "workflow";
type NodeStatus = "success" | "running" | "pending" | "skipped";
type WaveType = "normal" | "parallel" | "fan-in" | "conditional" | "sleep";

interface WaveNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  condition?: string;
}

interface Wave {
  id: string;
  waveType: WaveType;
  tag: string | null;
  note: string | null;
  nodes: WaveNode[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const WORKFLOW_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "platform");

// DAG: parallel fan-out → fan-in → conditional → sleep → followup
await sb.workflow("merchant.onboarding", [
  { id: "validate",  type: "rpc",   ref: "merchant.validate",  deps: [] },

  // parallel — both start concurrently after validate
  { id: "kyc",       type: "rpc",   ref: "kyc.check",     deps: ["validate"] },
  { id: "billing",   type: "rpc",   ref: "billing.setup",  deps: ["validate"] },

  // fan-in — waits for both kyc + billing
  { id: "provision", type: "rpc",   ref: "merchant.create", deps: ["kyc", "billing"] },

  // conditional — skipped if provision.status !== "active"
  { id: "welcome", type: "event", ref: "email.welcome",
    deps: ["provision"], if: "status=active" },

  // sleep 24h — no thread held during wait
  { id: "wait",     type: "sleep", durationMs: 86_400_000, deps: ["welcome"] },
  { id: "followup", type: "rpc",   ref: "email.followup",  deps: ["wait"] },
]);`,

  go: `svc := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "platform", nil)

// DAG: parallel fan-out → fan-in → sleep → followup
svc.Workflow(ctx, "merchant.onboarding", []servicebridge.WorkflowStep{
    {Name: "validate",  Fn: "merchant.validate", Payload: map[string]any{}},

    // parallel — both start concurrently after validate
    {Name: "kyc",     Fn: "kyc.check",
        DependsOn: []string{"validate"}},
    {Name: "billing", Fn: "billing.setup",
        DependsOn: []string{"validate"}},

    // fan-in — waits for both kyc + billing
    {Name: "provision", Fn: "merchant.create",
        DependsOn: []string{"kyc", "billing"}},

    // notify then sleep 24h, then followup
    {Name: "welcome",  Fn: "email.welcome",  DependsOn: []string{"provision"}},
    {Name: "followup", Fn: "email.followup", DependsOn: []string{"welcome"}},
})`,

  py: `from servicebridge import ServiceBridge, WorkflowStep

svc = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "platform")

# DAG: parallel fan-out → fan-in → conditional → sleep → followup
await svc.workflow("merchant.onboarding", [
    WorkflowStep(name="validate",  fn="merchant.validate",  payload={}),

    # parallel — both start concurrently after validate
    WorkflowStep(name="kyc",     fn="kyc.check",
        payload={}, depends_on=["validate"]),
    WorkflowStep(name="billing", fn="billing.setup",
        payload={}, depends_on=["validate"]),

    # fan-in — waits for both kyc + billing
    WorkflowStep(name="provision", fn="merchant.create",
        payload={}, depends_on=["kyc", "billing"]),

    WorkflowStep(name="welcome",  fn="email.welcome",
        payload={}, depends_on=["provision"]),
    WorkflowStep(name="followup", fn="email.followup",
        payload={}, depends_on=["welcome"]),
])`,
};

const WAVES: Wave[] = [
  {
    id: "w0",
    waveType: "normal",
    tag: null,
    note: null,
    nodes: [
      { id: "validate", label: "merchant.validate", type: "rpc", status: "success" },
    ],
  },
  {
    id: "w1",
    waveType: "parallel",
    tag: "∥ parallel",
    note: "kyc + billing start concurrently after validate",
    nodes: [
      { id: "kyc", label: "kyc.check", type: "rpc", status: "success" },
      { id: "billing", label: "billing.setup", type: "rpc", status: "success" },
    ],
  },
  {
    id: "w2",
    waveType: "fan-in",
    tag: "fan-in",
    note: "waits for: kyc + billing",
    nodes: [
      { id: "provision", label: "merchant.create", type: "rpc", status: "running" },
    ],
  },
  {
    id: "w3",
    waveType: "conditional",
    tag: "◇ if",
    note: null,
    nodes: [
      {
        id: "welcome",
        label: "email.welcome",
        type: "event",
        status: "pending",
        condition: "status=active",
      },
    ],
  },
  {
    id: "w4",
    waveType: "sleep",
    tag: "⏸ sleep",
    note: "no thread held · wakes at +24h",
    nodes: [{ id: "wait", label: "sleep 24h", type: "sleep", status: "pending" }],
  },
  {
    id: "w5",
    waveType: "normal",
    tag: null,
    note: null,
    nodes: [{ id: "followup", label: "email.followup", type: "rpc", status: "pending" }],
  },
];

// ─── Type + status config ─────────────────────────────────────────────────────

const NODE_TYPE_CFG: Record<NodeType, { icon: typeof Zap; color: string; bg: string }> = {
  rpc: { icon: Zap, color: "text-blue-300", bg: "bg-blue-500/[0.08]" },
  event: { icon: Radio, color: "text-emerald-300", bg: "bg-emerald-500/[0.08]" },
  sleep: { icon: Hourglass, color: "text-violet-300", bg: "bg-violet-500/[0.08]" },
  event_wait: { icon: Pause, color: "text-amber-300", bg: "bg-amber-500/[0.08]" },
  workflow: { icon: Workflow, color: "text-fuchsia-300", bg: "bg-fuchsia-500/[0.08]" },
};

const WAVE_TYPE_CFG: Record<
  WaveType,
  { labelColor: string; border: string; bg: string; tagColor: string }
> = {
  normal: {
    labelColor: "text-zinc-500",
    border: "border-white/[0.06]",
    bg: "bg-white/[0.02]",
    tagColor: "text-zinc-500",
  },
  parallel: {
    labelColor: "text-fuchsia-400",
    border: "border-fuchsia-500/20",
    bg: "bg-fuchsia-500/[0.03]",
    tagColor: "text-fuchsia-300",
  },
  "fan-in": {
    labelColor: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.03]",
    tagColor: "text-blue-300",
  },
  conditional: {
    labelColor: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.03]",
    tagColor: "text-amber-300",
  },
  sleep: {
    labelColor: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/[0.03]",
    tagColor: "text-violet-300",
  },
};

// ─── NodeCard ─────────────────────────────────────────────────────────────────

function NodeCard({ node }: { node: WaveNode }) {
  const typeCfg = NODE_TYPE_CFG[node.type];
  const Icon = typeCfg.icon;
  const isRunning = node.status === "running";
  const isSuccess = node.status === "success";

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-2xl border px-3 py-2.5 transition-all",
        isRunning
          ? "border-blue-500/25 bg-blue-500/[0.06] shadow-[0_0_20px_rgba(59,130,246,0.12)]"
          : isSuccess
            ? "border-emerald-500/20 bg-emerald-500/[0.04]"
            : "border-surface-border bg-surface opacity-60"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("rounded-lg p-1 shrink-0", typeCfg.bg)}>
          <Icon
            className={cn(
              "w-3 h-3",
              typeCfg.color,
              node.type === "sleep" && node.status === "pending" && "animate-pulse"
            )}
          />
        </span>
        <p className="text-xs font-semibold font-display truncate leading-tight flex-1">
          {node.label}
        </p>
        {/* Status indicator */}
        {isSuccess && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
        {isRunning && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
        )}
        {node.status === "pending" && (
          <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        <Badge tone={cn(typeCfg.bg, typeCfg.color)}>
          {node.type}
        </Badge>
        {node.condition && (
          <Badge tone="text-amber-300 bg-amber-500/[0.08] border-amber-500/20">
            if: {node.condition}
          </Badge>
        )}
        <span className="text-3xs font-mono text-zinc-600 uppercase tracking-wider">
          {node.status}
        </span>
      </div>
    </div>
  );
}

// ─── WaveRow ──────────────────────────────────────────────────────────────────

function WaveRow({
  wave,
  inView,
  delay,
  isLast,
}: {
  wave: Wave;
  inView: boolean;
  delay: number;
  isLast: boolean;
}) {
  const cfg = WAVE_TYPE_CFG[wave.waveType];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className="flex items-start gap-3"
    >
      {/* Left: wave label + connector */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 80 }}>
        <div
          className={cn(
            "rounded-xl border px-2 py-1.5 text-center w-full",
            cfg.border,
            cfg.bg
          )}
        >
          {wave.tag ? (
            <p className={cn("text-3xs font-mono font-semibold", cfg.tagColor)}>{wave.tag}</p>
          ) : (
            <p className="text-3xs font-mono text-zinc-600">step</p>
          )}
        </div>
        {!isLast && <div className="w-px flex-1 min-h-[24px] bg-white/[0.05] mt-1" />}
      </div>

      {/* Right: nodes + note */}
      <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
        <div className={cn("flex gap-3", wave.waveType === "parallel" ? "flex-row" : "flex-col")}>
          {wave.nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
        {wave.note && (
          <p className="mt-1.5 text-3xs font-mono text-zinc-600 leading-relaxed pl-1">
            {wave.note}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function WorkflowsSection() {
  const vizRef = useRef<HTMLDivElement>(null);
  const inView = useInView(vizRef, { once: true, margin: "-60px" });

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
          workflow run · merchant.onboarding
        </p>
        <Badge tone="border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300">
          running
        </Badge>
      </div>

      {/* Wave swimlane */}
      <div ref={vizRef} className="bg-code p-5 space-y-0">
        {WAVES.map((wave, i) => (
          <WaveRow
            key={wave.id}
            wave={wave}
            inView={inView}
            delay={i * 0.18}
            isLast={i === WAVES.length - 1}
          />
        ))}
      </div>

      {/* Feature callout row */}
      <div className="border-t border-surface-border bg-code p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="border-fuchsia-500/15 bg-fuchsia-500/[0.04] p-3 flex items-start gap-2">
            <GitBranch className="w-3.5 h-3.5 text-fuchsia-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold font-display text-fuchsia-200">Parallel</p>
              <p className="type-body-sm text-zinc-500 mt-0.5">
                Independent deps run concurrently
              </p>
            </div>
          </Card>
          <Card className="border-amber-500/15 bg-amber-500/[0.04] p-3 flex items-start gap-2">
            <GitMerge className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold font-display text-amber-200">Conditional</p>
              <p className="type-body-sm text-zinc-500 mt-0.5">
                if: skips + cascades downstream
              </p>
            </div>
          </Card>
          <Card className="border-violet-500/15 bg-violet-500/[0.04] p-3 flex items-start gap-2">
            <Hourglass className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold font-display text-violet-200">Sleep</p>
              <p className="type-body-sm text-zinc-500 mt-0.5">
                24h, no thread held
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FlowTile label="scheduling" value="wave-by-wave" tone="text-fuchsia-300" />
          <FlowTile label="checkpoint" value="per-step state" tone="text-blue-300" />
          <FlowTile label="retry" value="only failed step" tone="text-amber-300" />
        </div>
      </div>
    </CodePanel>
  );

  const contentPanel = (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="type-overline-mono text-muted-foreground">workflow api</p>
        <h2 className="mt-2 type-subsection-title">
          Declare deps. Runtime handles the rest.
        </h2>
        <p className="mt-3 type-body-sm">
          Steps with independent dependencies run in parallel automatically. Fan-in waits
          for all branches. The{" "}
          <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
            if
          </code>{" "}
          field skips a step when the condition is false — and the skip cascades
          transitively through all dependents. Every step is checkpointed: only the failed
          step retries, not the whole workflow.
        </p>
      </Card>

      <MultiCodeBlock
        code={WORKFLOW_CODE}
        filename={{ ts: "merchant-onboarding.ts", go: "merchant_onboarding.go", py: "merchant_onboarding.py" }}
      />
    </div>
  );

  const miniCards = (
    <>
      <MiniCard
        icon={GitMerge}
        title="Fan-out / Fan-in"
        desc="Steps with independent deps start concurrently. A fan-in step waits for all branches before executing."
        iconClassName="text-fuchsia-400"
      />
      <MiniCard
        icon={GitBranch}
        title="Conditional branching"
        desc="The if field uses filter expression syntax. False condition marks the step skipped — and cascades transitively to all dependents."
        iconClassName="text-amber-400"
      />
      <MiniCard
        icon={Clock}
        title="Sleep & event_wait"
        desc="Suspend a run for milliseconds to days with sleep. event_wait suspends until a matching event arrives — no thread held in either case."
        iconClassName="text-violet-400"
      />
      <MiniCard
        icon={Workflow}
        title="Child workflows"
        desc="A step can enqueue a child workflow run. Parent suspends until the child completes and returns its output as step output."
        iconClassName="text-emerald-400"
      />
      <MiniCard
        icon={RefreshCcw}
        title="Exact-step retry"
        desc="Failed step retries from its checkpoint. Successful parallel branches are never re-executed — only the broken step."
        iconClassName="text-orange-400"
      />
      <MiniCard
        icon={CheckCircle2}
        title="Per-step tracing"
        desc="Every step emits a span automatically. The full wave tree appears in the unified waterfall trace — no instrumentation needed."
        iconClassName="text-sky-400"
      />
    </>
  );

  return (
    <FeatureSection
      id="workflows"
      eyebrow="Workflows"
      title="DAG orchestration. Parallel. Conditional. Checkpointed."
      subtitle="Define steps as a dependency graph. Independent branches run concurrently in execution waves. Conditions skip branches based on prior output. Sleep and event_wait suspend without holding threads."
      content={contentPanel}
      demo={demoContent}
      cards={miniCards}
    />
  );
}
