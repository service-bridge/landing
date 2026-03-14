import { motion, useInView } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  GitMerge,
  Hourglass,
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
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const WORKFLOW_CODE: CodeLangs = {
  ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

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
    "localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

svc.Workflow(ctx, "merchant.onboarding", []servicebridge.WorkflowStep{
    {ID: "validate",  Type: "rpc",   Ref: "merchant.validate", Deps: []string{}},
    {ID: "kyc",       Type: "rpc",   Ref: "kyc.check",         Deps: []string{"validate"}},
    {ID: "billing",   Type: "rpc",   Ref: "billing.setup",     Deps: []string{"validate"}},
    {ID: "provision", Type: "rpc",   Ref: "merchant.create",
        Deps: []string{"kyc", "billing"}},
    {ID: "welcome",   Type: "event", Ref: "email.welcome",     Deps: []string{"provision"}},
    {ID: "followup",  Type: "rpc",   Ref: "email.followup",    Deps: []string{"welcome"}},
})`,

  py: `from service_bridge import ServiceBridge, WorkflowStep

svc = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

await svc.workflow("merchant.onboarding", [
    WorkflowStep(id="validate",  type="rpc",   ref="merchant.validate",  deps=[]),
    WorkflowStep(id="kyc",       type="rpc",   ref="kyc.check",
        deps=["validate"]),
    WorkflowStep(id="billing",   type="rpc",   ref="billing.setup",
        deps=["validate"]),
    WorkflowStep(id="provision", type="rpc",   ref="merchant.create",
        deps=["kyc", "billing"]),
    WorkflowStep(id="welcome",   type="event", ref="email.welcome",
        deps=["provision"]),
    WorkflowStep(id="followup",  type="rpc",   ref="email.followup",
        deps=["welcome"]),
])`,
};

type NodeStatus = "success" | "running" | "pending";
type NodeType = "rpc" | "event" | "sleep";
type WaveKind = "normal" | "parallel" | "fan-in" | "conditional" | "sleep";

interface WaveRow {
  tag: string | null;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  nodes: { label: string; type: NodeType; status: NodeStatus; condition?: string }[];
  note: string | null;
}

const NODE_ICON: Record<NodeType, typeof Zap> = { rpc: Zap, event: Radio, sleep: Hourglass };
const NODE_COLOR: Record<NodeType, string> = {
  rpc: "text-blue-300",
  event: "text-emerald-300",
  sleep: "text-violet-300",
};
const NODE_BG: Record<NodeType, string> = {
  rpc: "bg-blue-500/[0.08]",
  event: "bg-emerald-500/[0.08]",
  sleep: "bg-violet-500/[0.08]",
};

const STATUS_DOT: Record<NodeStatus, string> = {
  success: "bg-emerald-400",
  running: "bg-blue-400 animate-pulse",
  pending: "bg-zinc-600",
};

const WAVES: WaveRow[] = [
  {
    tag: null,
    tagColor: "",
    tagBg: "",
    tagBorder: "",
    nodes: [{ label: "merchant.validate", type: "rpc", status: "success" }],
    note: null,
  },
  {
    tag: "∥ parallel",
    tagColor: "text-fuchsia-300",
    tagBg: "bg-fuchsia-500/[0.08]",
    tagBorder: "border-fuchsia-500/20",
    nodes: [
      { label: "kyc.check", type: "rpc", status: "success" },
      { label: "billing.setup", type: "rpc", status: "success" },
    ],
    note: "both start concurrently after validate",
  },
  {
    tag: "fan-in",
    tagColor: "text-blue-300",
    tagBg: "bg-blue-500/[0.08]",
    tagBorder: "border-blue-500/20",
    nodes: [{ label: "merchant.create", type: "rpc", status: "running" }],
    note: "waits for: kyc + billing",
  },
  {
    tag: "◇ if",
    tagColor: "text-amber-300",
    tagBg: "bg-amber-500/[0.08]",
    tagBorder: "border-amber-500/20",
    nodes: [
      { label: "email.welcome", type: "event", status: "pending", condition: "status=active" },
    ],
    note: null,
  },
  {
    tag: "⏸ sleep",
    tagColor: "text-violet-300",
    tagBg: "bg-violet-500/[0.08]",
    tagBorder: "border-violet-500/20",
    nodes: [{ label: "sleep 24h", type: "sleep", status: "pending" }],
    note: "no thread held · wakes at +24h",
  },
  {
    tag: null,
    tagColor: "",
    tagBg: "",
    tagBorder: "",
    nodes: [{ label: "email.followup", type: "rpc", status: "pending" }],
    note: null,
  },
];

export function WorkflowsSection() {
  const vizRef = useRef<HTMLDivElement>(null);
  const inView = useInView(vizRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="workflows"
      eyebrow="Workflows"
      title="DAG orchestration. Parallel. Conditional. Checkpointed."
      subtitle="Define steps as a dependency graph. Independent branches run concurrently in execution waves. Conditions skip branches based on prior output. Sleep and event_wait suspend without holding threads."
      content={
        <div className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">workflow api</p>
            <h2 className="mt-2 type-subsection-title">Declare deps. Runtime handles the rest.</h2>
            <p className="mt-3 type-body-sm">
              Steps with independent dependencies run in parallel automatically. Fan-in waits for
              all branches. The{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">if</code>{" "}
              field skips a step when the condition is false — and the skip cascades transitively
              through all dependents. Every step is checkpointed: only the failed step retries, not
              the whole workflow.
            </p>
          </Card>
          <MultiCodeBlock
            code={WORKFLOW_CODE}
            filename={{
              ts: "merchant-onboarding.ts",
              go: "merchant_onboarding.go",
              py: "merchant_onboarding.py",
            }}
          />
        </div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title="workflow run · merchant.onboarding">
            <div className="absolute top-2.5 right-4">
              <Badge tone="border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300">
                running
              </Badge>
            </div>
            <div ref={vizRef} className="p-5 space-y-0">
              {WAVES.map((wave, i) => {
                const isLast = i === WAVES.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: 0.4, delay: i * 0.12, ease: "easeOut" }}
                    className="flex items-start gap-3"
                  >
                    {/* Wave label + vertical connector */}
                    <div className="flex flex-col items-center shrink-0" style={{ width: 72 }}>
                      {wave.tag ? (
                        <div
                          className={cn(
                            "rounded-lg border px-2 py-1 text-center w-full",
                            wave.tagBorder,
                            wave.tagBg
                          )}
                        >
                          <p className={cn("text-3xs font-mono font-semibold", wave.tagColor)}>
                            {wave.tag}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-surface-border bg-surface px-2 py-1 text-center w-full">
                          <p className="text-3xs font-mono text-muted-foreground/60">step</p>
                        </div>
                      )}
                      {!isLast && <div className="w-px flex-1 min-h-[20px] bg-white/[0.05] mt-1" />}
                    </div>

                    {/* Nodes */}
                    <div className={cn("flex-1 min-w-0 pb-4", isLast && "pb-0")}>
                      <div
                        className={cn(
                          "flex gap-2",
                          wave.nodes.length > 1 ? "flex-row" : "flex-col"
                        )}
                      >
                        {wave.nodes.map((node) => {
                          const Icon = NODE_ICON[node.type];
                          return (
                            <div
                              key={node.label}
                              className={cn(
                                "flex-1 min-w-0 rounded-xl border px-3 py-2",
                                node.status === "running"
                                  ? "border-blue-500/25 bg-blue-500/[0.06]"
                                  : node.status === "success"
                                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                                    : "border-surface-border bg-surface opacity-60"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn("rounded p-1 shrink-0", NODE_BG[node.type])}>
                                  <Icon className={cn("w-3 h-3", NODE_COLOR[node.type])} />
                                </span>
                                <p className="text-xs font-semibold font-display truncate flex-1">
                                  {node.label}
                                </p>
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    STATUS_DOT[node.status]
                                  )}
                                />
                              </div>
                              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <Badge tone={cn(NODE_BG[node.type], NODE_COLOR[node.type])}>
                                  {node.type}
                                </Badge>
                                {node.condition && (
                                  <Badge tone="text-amber-300 bg-amber-500/[0.08] border-amber-500/20">
                                    if: {node.condition}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {wave.note && (
                        <p className="mt-1 text-3xs font-mono text-muted-foreground/60">
                          {wave.note}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={GitMerge}
            title="Fan-out / Fan-in"
            description="Steps with independent deps start concurrently. A fan-in step waits for all branches before executing."
            iconClassName="text-fuchsia-400"
          />
          <FeatureCard
            variant="compact"
            icon={GitBranch}
            title="Conditional branching"
            description="The if field uses filter expression syntax. False condition marks the step skipped and cascades to all dependents."
            iconClassName="text-amber-400"
          />
          <FeatureCard
            variant="compact"
            icon={Clock}
            title="Sleep & event_wait"
            description="Suspend a run for milliseconds to days with sleep. event_wait suspends until a matching event arrives — no thread held."
            iconClassName="text-violet-400"
          />
          <FeatureCard
            variant="compact"
            icon={RefreshCcw}
            title="Exact-step retry"
            description="Failed step retries from its checkpoint. Successful parallel branches are never re-executed."
            iconClassName="text-orange-400"
          />
        </>
      }
    />
  );
}
