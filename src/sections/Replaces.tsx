import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BarChart2,
  CheckCircle2,
  Clock,
  KeySquare,
  Lock,
  Network,
  Radio,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Eyebrow } from "../ui/Eyebrow";
import { FeatureCard } from "../ui/FeatureCard";
import { Section } from "../ui/Section";

const REPLACES = [
  {
    label: "Service Mesh",
    example: "Istio, Linkerd",
    icon: Network,
    color: "text-sky-400",
  },
  { label: "Message Broker", example: "RabbitMQ, Kafka", icon: Radio, color: "text-blue-400" },
  {
    label: "RPC Framework",
    example: "gRPC boilerplate",
    icon: ArrowRightLeft,
    color: "text-violet-400",
  },
  { label: "Job Scheduler", example: "node-cron, Bull", icon: Clock, color: "text-amber-400" },
  {
    label: "Workflow Engine",
    example: "Temporal, Step Functions",
    icon: Workflow,
    color: "text-fuchsia-400",
  },
  { label: "Tracing Backend", example: "Jaeger, Zipkin", icon: Activity, color: "text-cyan-400" },
  {
    label: "Auth & Service Keys",
    example: "Kong, custom service auth",
    icon: KeySquare,
    color: "text-violet-400",
  },
  { label: "TLS Tooling", example: "cert-manager, Vault PKI", icon: Lock, color: "text-teal-400" },
  {
    label: "Alert Manager",
    example: "PagerDuty, Alertmanager",
    icon: AlertTriangle,
    color: "text-red-400",
  },
  {
    label: "Metrics + Logs",
    example: "Prometheus, Loki",
    icon: BarChart2,
    color: "text-orange-400",
  },
];

type MeshRow = {
  category: string;
  capability: string;
  mesh: string;
  sb: string;
  pain: "critical" | "major" | "minor";
};

const MESH_COMPARE: MeshRow[] = [
  // Data Path
  {
    category: "Data Path",
    capability: "Proxy per pod",
    mesh: "1–2 Envoy sidecars injected per pod",
    sb: "0 proxies — SDK calls worker directly",
    pain: "critical",
  },
  {
    category: "Data Path",
    capability: "Call latency overhead",
    mesh: "+1–5 ms per hop × 4 proxy boundaries",
    sb: "≈0 ms — raw gRPC, no intercept layer",
    pain: "critical",
  },
  {
    category: "Data Path",
    capability: "Memory per service",
    mesh: "100–250 MB (Envoy baseline, per pod)",
    sb: "Shared control plane only",
    pain: "critical",
  },
  // Security
  {
    category: "Security",
    capability: "mTLS",
    mesh: "Proxy-terminated; cert-manager or Vault PKI required",
    sb: "SDK-level, auto-provisioned from service key — no cert-manager",
    pain: "major",
  },
  {
    category: "Security",
    capability: "Access policies",
    mesh: "Cluster-wide RBAC via CRDs, coarse-grained",
    sb: "Per-key GAP: per-function, per-topic, per-caller — 5 enforcement layers",
    pain: "major",
  },
  // Observability
  {
    category: "Observability",
    capability: "Trace coverage",
    mesh: "HTTP spans only (sidecar-level)",
    sb: "100% — HTTP, RPC, events, workflows, jobs",
    pain: "major",
  },
  {
    category: "Observability",
    capability: "Trace & log storage",
    mesh: "Requires Jaeger/Tempo + Loki + Promtail pipeline",
    sb: "Built-in — PostgreSQL-backed, UI + Grafana export",
    pain: "major",
  },
  {
    category: "Observability",
    capability: "Service map",
    mesh: "Kiali addon — separate install, separate config",
    sb: "Built-in realtime map with per-replica health",
    pain: "minor",
  },
  // Missing Primitives
  {
    category: "Missing Primitives",
    capability: "Durable events / message broker",
    mesh: "Not included — add Kafka or RabbitMQ",
    sb: "Built-in at-least-once events with DLQ and batch replay",
    pain: "critical",
  },
  {
    category: "Missing Primitives",
    capability: "Workflow / saga engine",
    mesh: "Not included — add Temporal, Conductor, or Step Functions",
    sb: "Built-in DAG workflows, checkpointed in PostgreSQL",
    pain: "critical",
  },
  {
    category: "Missing Primitives",
    capability: "Job scheduler",
    mesh: "Not included — add cron workers + queue",
    sb: "Built-in cron & one-shot delayed jobs with retry",
    pain: "critical",
  },
  {
    category: "Missing Primitives",
    capability: "Alert management",
    mesh: "Not included — add Alertmanager + PagerDuty",
    sb: "Built-in — 6 condition types, Telegram + webhook",
    pain: "major",
  },
];

export function ReplacesSection() {
  return (
    <Section id="replaces">
      <motion.div variants={fadeInUp} className="mb-14 text-center">
        <Eyebrow
          variant="pill"
          tone="border-primary/20 bg-primary/[0.06] text-primary"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        >
          Simplify your stack
        </Eyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ten tools in. One platform out.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Every inter-service primitive you need — service mesh, messaging, RPC, scheduling,
          workflows, tracing, auth, alerting, metrics, and logs — unified under one binary.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="mx-auto mb-14 grid max-w-lg grid-cols-3 gap-3">
        {[
          { value: "10→1", label: "infrastructure pieces", title: "10→1" },
          { value: "0ms", label: "proxy overhead", title: "0ms" },
          { value: "100%", label: "calls traced", title: "100%" },
        ].map((stat) => (
          <FeatureCard
            key={stat.label}
            variant="stat"
            stat={stat.value}
            title={stat.title}
            description={stat.label}
          />
        ))}
      </motion.div>

      <div className="mx-auto grid max-w-5xl items-center gap-4 lg:grid-cols-[1fr_56px_1fr] lg:gap-0">
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <XCircle className="h-3.5 w-3.5 text-red-400/60" />
            <span className="type-overline text-red-400/60">Before</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REPLACES.map((item) => (
              <motion.div key={item.label} variants={fadeInUp}>
                <Card className="flex items-start gap-3 border-red-500/[0.10] bg-red-500/[0.025] px-3.5 py-3">
                  <div className="mt-0.5 flex-shrink-0 rounded-lg bg-red-500/[0.06] p-1.5">
                    <item.icon className={cn("h-4 w-4 opacity-40", item.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-foreground/50">
                      {item.label}
                    </p>
                    <p className="text-2xs mt-0.5 truncate leading-tight text-muted-foreground/40 line-through decoration-red-400/40">
                      {item.example}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          variants={fadeInUp}
          className="hidden flex-col items-center justify-center gap-2 lg:flex"
        >
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-border to-primary/30" />
          <div className="rounded-full border border-primary/25 bg-primary/[0.08] p-2.5 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
          <div className="h-10 w-px bg-gradient-to-b from-primary/30 via-border to-transparent" />
        </motion.div>

        <div className="flex items-center justify-center gap-3 lg:hidden">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="rounded-full border border-primary/25 bg-primary/[0.08] p-2">
            <ArrowRight className="h-4 w-4 rotate-90 text-primary" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span className="type-overline text-primary">With ServiceBridge</span>
          </div>
          <motion.div variants={fadeInUp}>
            <Card className="relative overflow-hidden border-primary/25 bg-primary/[0.03]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-emerald-500/[0.04]" />
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.12] blur-3xl" />

              <div className="relative flex items-center gap-3 border-b border-primary/[0.12] px-5 py-4">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <BrandMark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">ServiceBridge</p>
                  <p className="text-2xs text-muted-foreground">One binary · all primitives</p>
                </div>
                <Badge
                  tone="border-primary/20 bg-primary/[0.08] text-primary"
                  className="ml-auto px-2.5 py-1"
                >
                  All included
                </Badge>
              </div>

              <div className="relative grid grid-cols-1 gap-0 divide-y divide-white/[0.04]">
                {REPLACES.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-surface"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <item.icon className={cn("h-3.5 w-3.5 flex-shrink-0", item.color)} />
                    <span className="text-sm font-medium text-foreground/80">{item.label}</span>
                    <span className="ml-auto hidden text-2xs text-muted-foreground/50 sm:block">
                      replaces {item.example.split(",")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div variants={fadeInUp} className="mx-auto mt-20 max-w-5xl">
        <div className="mb-10 text-center">
          <Eyebrow
            variant="pill"
            tone="border-violet-500/25 bg-violet-500/[0.07] text-violet-400"
            icon={<Zap className="h-3.5 w-3.5" />}
          >
            vs Traditional Service Mesh
          </Eyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            The sidecar tax is real. ServiceBridge doesn't collect it.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Istio and Linkerd inject a proxy into every pod — adding memory overhead, latency hops,
            and operational complexity with every service you deploy. And a mesh still leaves you
            without Kafka, Temporal, Jaeger, and Alertmanager. ServiceBridge replaces all of it.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FeatureCard
            variant="stat"
            stat="250 MB"
            title="250 MB"
            description="Envoy sidecar memory per pod"
            statLabel="= 250 GB RAM at 1,000 pods"
            className="border-red-500/15 bg-red-500/[0.04]"
          />
          <FeatureCard
            variant="stat"
            stat="×4 hops"
            title="×4 hops"
            description="Every service call crosses 4 proxy boundaries"
            statLabel="+1–5 ms overhead per hop"
            className="border-orange-500/15 bg-orange-500/[0.04]"
          />
          <FeatureCard
            variant="stat"
            stat="+8 tools"
            title="+8 tools"
            description="Kafka, Temporal, Jaeger, Loki, Alertmanager…"
            statLabel="still not in the mesh"
            className="border-amber-500/15 bg-amber-500/[0.04]"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-code">
          <div className="grid grid-cols-[1.1fr_1.45fr_1.45fr] border-b border-surface-border">
            <div className="type-overline-mono px-4 py-2.5 text-zinc-600">Capability</div>
            <div className="type-overline-mono border-l border-surface-border px-4 py-2.5 text-red-500/60">
              Istio / Linkerd
            </div>
            <div className="type-overline-mono border-l border-surface-border px-4 py-2.5 text-emerald-500/70">
              ServiceBridge
            </div>
          </div>

          {(() => {
            const categories = [...new Set(MESH_COMPARE.map((r) => r.category))];
            return categories.map((cat) => {
              const rows = MESH_COMPARE.filter((r) => r.category === cat);
              return (
                <div key={cat}>
                  <div className="border-t border-surface-border bg-white/[0.01]">
                    <div className="col-span-3 flex items-center gap-3 px-4 py-1.5">
                      <span className="type-overline-mono shrink-0 text-zinc-600">{cat}</span>
                      <div className="h-px flex-1 bg-white/[0.04]" />
                    </div>
                  </div>
                  {rows.map((row) => (
                    <div
                      key={row.capability}
                      className="grid grid-cols-[1.1fr_1.45fr_1.45fr] border-t border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.015]"
                    >
                      <div className="type-body-sm flex items-center px-4 py-2 font-medium leading-snug text-zinc-300">
                        {row.capability}
                      </div>
                      <div className="flex items-center gap-2 border-l border-white/[0.04] px-4 py-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                            row.pain === "critical"
                              ? "bg-red-500"
                              : row.pain === "major"
                                ? "bg-orange-400"
                                : "bg-yellow-500"
                          )}
                        />
                        <span className="type-body-sm font-mono leading-snug text-amber-400/70">
                          {row.mesh}
                        </span>
                      </div>
                      <div className="flex items-center border-l border-white/[0.04] px-4 py-2">
                        <span className="type-body-sm font-mono font-semibold leading-snug text-emerald-400">
                          {row.sb}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            });
          })()}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-surface-border px-4 py-2.5">
            <span className="text-2xs flex items-center gap-1.5 text-zinc-600">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Critical overhead
            </span>
            <span className="text-2xs flex items-center gap-1.5 text-zinc-600">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
              Major friction
            </span>
            <span className="text-2xs flex items-center gap-1.5 text-zinc-600">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
              Minor concern
            </span>
          </div>
        </div>

        <Card className="mt-4 flex flex-col items-center gap-4 border-emerald-500/15 bg-emerald-500/[0.03] px-6 py-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-white/[0.06]">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              10 infrastructure pieces consolidated into 1
            </p>
            <p className="type-body-sm mt-0.5 leading-relaxed">
              Service mesh + broker + workflows + scheduler + tracing + auth + mTLS + alerts +
              metrics + logs — one binary, one PostgreSQL, zero sidecar overhead.
            </p>
          </div>
        </Card>
      </motion.div>
    </Section>
  );
}
