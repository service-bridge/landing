import { motion } from "framer-motion";
import { Clock, GitBranch, GitMerge, Pause, RefreshCcw, Workflow } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";
import { FlowTile, SectionTag } from "./feature-shared";

const WORKFLOW_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "platform");

// DAG workflow: parallel fan-out → fan-in → conditional branch
await sb.workflow("merchant.onboarding", [
  { id: "validate",  type: "rpc",   ref: "merchant.validate", deps: [] },

  // run kyc and billing in parallel after validate
  { id: "kyc",       type: "rpc",   ref: "kyc.check",         deps: ["validate"] },
  { id: "billing",   type: "rpc",   ref: "billing.setup",     deps: ["validate"] },

  // fan-in: waits for both kyc + billing
  { id: "provision", type: "rpc",   ref: "merchant.create",   deps: ["kyc", "billing"] },

  // only runs if provision returned status=active
  { id: "welcome",   type: "event", ref: "email.welcome",     deps: ["provision"], if: "status=active" },

  // pause 24h then send follow-up
  { id: "wait",      type: "sleep", durationMs: 86_400_000,   deps: ["welcome"] },
  { id: "followup",  type: "rpc",   ref: "email.followup",    deps: ["wait"] },
]);`;

type StepNode = {
  id: string;
  label: string;
  type: string;
  status: "success" | "running" | "pending" | "waiting" | "skipped";
  deps: string[];
};

const GRAPH_STEPS: StepNode[] = [
  { id: "validate", label: "merchant.validate", type: "rpc", status: "success", deps: [] },
  { id: "kyc", label: "kyc.check", type: "rpc", status: "success", deps: ["validate"] },
  { id: "billing", label: "billing.setup", type: "rpc", status: "success", deps: ["validate"] },
  {
    id: "provision",
    label: "merchant.create",
    type: "rpc",
    status: "running",
    deps: ["kyc", "billing"],
  },
  { id: "welcome", label: "email.welcome", type: "event", status: "pending", deps: ["provision"] },
  { id: "wait", label: "sleep 24 h", type: "sleep", status: "pending", deps: ["welcome"] },
  { id: "followup", label: "email.followup", type: "rpc", status: "pending", deps: ["wait"] },
];

const STATUS_TONE: Record<string, string> = {
  success: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/20",
  running: "text-blue-300   bg-blue-500/[0.08]   border-blue-500/20 animate-pulse",
  pending: "text-zinc-400   bg-white/[0.03]       border-white/[0.06]",
  waiting: "text-amber-300  bg-amber-500/[0.08]  border-amber-500/20",
  skipped: "text-zinc-600   bg-white/[0.02]       border-white/[0.04] opacity-50",
};

const TYPE_TONE: Record<string, string> = {
  rpc: "border-blue-500/20   bg-blue-500/[0.07]   text-blue-300",
  event: "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300",
  event_wait: "border-amber-500/20  bg-amber-500/[0.07]  text-amber-300",
  sleep: "border-violet-500/20 bg-violet-500/[0.07] text-violet-300",
  workflow: "border-fuchsia-500/20 bg-fuchsia-500/[0.07] text-fuchsia-300",
};

function StepCard({ step }: { step: StepNode }) {
  const statusTone = STATUS_TONE[step.status] ?? STATUS_TONE.pending;
  const typeTone = TYPE_TONE[step.type] ?? TYPE_TONE.rpc;
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm", statusTone)}>
      <span className="font-semibold font-display min-w-0 flex-1">{step.label}</span>
      <SectionTag tone={typeTone}>{step.type}</SectionTag>
      <span
        className={cn(
          "text-3xs font-mono uppercase tracking-widest",
          step.status === "running"
            ? "text-blue-400"
            : step.status === "success"
              ? "text-emerald-400"
              : "text-zinc-600"
        )}
      >
        {step.status}
      </span>
    </div>
  );
}

export function WorkflowsSection() {
  // Partition into columns: column 0 = roots, column 1 = their children, etc.
  const positions = new Map<string, number>();
  for (const step of GRAPH_STEPS) {
    if (step.deps.length === 0) {
      positions.set(step.id, 0);
    } else {
      const maxDep = Math.max(...step.deps.map((d) => positions.get(d) ?? 0));
      positions.set(step.id, maxDep + 1);
    }
  }

  const columns = new Map<number, StepNode[]>();
  for (const step of GRAPH_STEPS) {
    const col = positions.get(step.id) ?? 0;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)?.push(step);
  }

  return (
    <AnimatedSection id="workflows" className="py-24 border-t border-white/[0.04]">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Workflows"
          title="DAG orchestration built into the runtime."
          subtitle="Define parallel branches, conditional logic, sleep timers, and event waits — all as typed steps in one persisted run. No separate orchestration service needed."
        />

        <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] max-w-6xl mx-auto">
          {/* ── DAG visualizer ── */}
          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7"
          >
            <div className="rounded-3xl border border-white/[0.06] bg-[#081018] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="type-overline-mono text-zinc-500">
                    workflow run · merchant.onboarding
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    DAG scheduler — parallel fan-out, sleep, conditional event.
                  </p>
                </div>
                <SectionTag tone="border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300">
                  DAG
                </SectionTag>
              </div>

              <div className="mt-5 space-y-2">
                {GRAPH_STEPS.map((step) => (
                  <div
                    key={step.id}
                    style={{ marginLeft: `${(positions.get(step.id) ?? 0) * 16}px` }}
                  >
                    <StepCard step={step} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <FlowTile label="parallel" value="fan-out dep branches" tone="text-fuchsia-300" />
              <FlowTile label="sleep" value="non-blocking timers" tone="text-violet-300" />
              <FlowTile label="if" value="conditional skip" tone="text-amber-300" />
            </div>
          </motion.div>

          {/* ── Feature cards + code ── */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="type-overline-mono text-zinc-500">workflow api</p>
              <h3 className="mt-2 text-xl font-semibold font-display">
                Orchestration stays in application code.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Declare deps between steps to create parallel fan-out and fan-in patterns. Runtime
                handles scheduling, state persistence, retries, and observability — no extra
                infrastructure.
              </p>
            </div>

            <CodeBlock code={WORKFLOW_CODE} filename="workflows.ts" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <MiniCard
                icon={GitMerge}
                title="Fan-out / Fan-in"
                desc="Steps with independent deps run in parallel. Fan-in waits for all of them."
                iconClassName="text-fuchsia-400"
              />
              <MiniCard
                icon={GitBranch}
                title="Conditional branching"
                desc='Use "if" expressions to skip steps based on previous step output.'
                iconClassName="text-amber-400"
              />
              <MiniCard
                icon={Clock}
                title="Sleep & timers"
                desc="Pause a run for milliseconds to days without holding a worker thread."
                iconClassName="text-violet-400"
              />
              <MiniCard
                icon={Pause}
                title="Wait for event"
                desc="Suspend a run until an external event arrives, with optional timeout."
                iconClassName="text-sky-400"
              />
              <MiniCard
                icon={Workflow}
                title="Child workflows"
                desc="Compose reusable sub-workflows. Parent waits for child output."
                iconClassName="text-emerald-400"
              />
              <MiniCard
                icon={RefreshCcw}
                title="Retry exactly where it failed"
                desc="A broken step retries without restarting the whole saga."
                iconClassName="text-orange-400"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
