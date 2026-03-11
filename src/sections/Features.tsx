import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Cpu,
  Database,
  Eye,
  Globe,
  KeySquare,
  Lock,
  Network,
  Radio,
  RefreshCcw,
  Server,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
  Workflow,
  Zap,
} from "lucide-react";
import type React from "react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { SectionHeader } from "../ui/SectionHeader";

type FeatureDef = {
  title: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  stat?: string;
  statLabel?: string;
};

type FeatureGroup = {
  label: string;
  wide: boolean; // true = 2 cards per row (col-span-3), false = 3 cards per row (col-span-2)
  features: FeatureDef[];
};

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    label: "Communication",
    wide: false,
    features: [
      {
        title: "Direct RPC",
        desc: "SDK resolves endpoints and calls workers directly over gRPC — zero proxy hops, same latency as raw gRPC. Discovery, round-robin, schema negotiation built in. mTLS cert CN backs caller identity; GAP enforced at registry, SDK, and worker.",
        icon: Zap,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        badge: "0% overhead, mTLS + GAP",
        badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      },
      {
        title: "Durable Events",
        desc: "At-least-once delivery with automatic retries, Dead Letter Queue, and per-message replay. Wildcard topic matching, filter expressions (DSL), idempotency keys. Stored in PostgreSQL; batch replay from DLQ via UI or gRPC.",
        icon: Radio,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        badge: "up to 4× vs RabbitMQ",
        badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      },
      {
        title: "Realtime Streams",
        desc: "Push incremental chunks from any handler as it executes. Fans out to UI and SDK over gRPC server-streaming. Chunks persisted to PostgreSQL — late subscribers replay history. Perfect for LLM outputs, progress bars, and live logs.",
        icon: Waves,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        badge: "LLM, progress, logs",
        badgeColor: "text-red-400 bg-red-400/10 border-red-400/20",
      },
    ],
  },
  {
    label: "Orchestration",
    wide: false,
    features: [
      {
        title: "Workflows",
        desc: "Define multi-step sagas as code. Chain RPC and event steps. Runtime handles execution, retries, and state persistence.",
        icon: Workflow,
        iconBg: "bg-fuchsia-500/10",
        iconColor: "text-fuchsia-400",
      },
      {
        title: "Built-in Jobs",
        desc: "Distributed cron scheduling and delayed one-shot jobs. Misfire handling. Execute via RPC, event, or workflow step.",
        icon: Clock,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
      },
      {
        title: "Service Discovery + Maps",
        desc: "Workers register on serve(). Callers resolve endpoints lazily via LookupFunction — O(1) from in-memory hub, zero DB load. UI renders live service map and connections map from the same topology data.",
        icon: Globe,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        badge: "1000+ services · zero DB",
        badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      },
    ],
  },
  {
    label: "Security",
    wide: true,
    features: [
      {
        title: "Granular Access Policy",
        desc: "Beyond capabilities, each service key carries fine-grained traffic rules: which topics to publish/subscribe, which functions to register or call, and which services can call yours. Enforced at three layers — control plane, SDK, and worker — with mTLS cert CN checks for caller identity.",
        icon: KeySquare,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "3-layer enforcement",
        badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
      {
        title: "Auto mTLS",
        desc: "Full mutual TLS on both control plane and data plane. Certs are issued when you create a service key in the UI — store cert, key, and CA once; transport is tls-only.",
        icon: Lock,
        iconBg: "bg-teal-500/10",
        iconColor: "text-teal-400",
        badge: "mTLS, certs at key creation",
        badgeColor: "text-teal-400 bg-teal-400/10 border-teal-400/20",
      },
    ],
  },
  {
    label: "Observability",
    wide: true,
    features: [
      {
        title: "Unified Tracing",
        desc: "HTTP traces, RPC calls, event delivery, workflow invocation from code, and job runs — all traced end-to-end with causal chain. Per-run waterfall timeline with retry count, recovered errors, and delivery stats. OTLP JSON ingest. No Jaeger, no Zipkin.",
        icon: Activity,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        badge: "100% runs traced",
        badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      },
      {
        title: "Smart Alerts",
        desc: "UI-configurable alert rules with six condition types: DLQ spikes, error rate, service offline, delivery failures, job execution errors, and workflow run errors. Multi-channel: Telegram deep-link, Webhook, and in-app push. Cooldown prevents alert storms.",
        icon: Activity,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        badge: "6 condition types",
        badgeColor: "text-red-400 bg-red-400/10 border-red-400/20",
      },
    ],
  },
  {
    label: "Dashboard & Tools",
    wide: true,
    features: [
      {
        title: "Realtime Dashboard",
        desc: "Web UI with live run details, queue state, DLQ management, per-entity stats, and full microservice interaction map.",
        icon: Eye,
        iconBg: "bg-rose-500/10",
        iconColor: "text-rose-400",
      },
      {
        title: "Filter Expressions",
        desc: "Subscribe to only the events you care about. Simple DSL — type=order.paid, amount>100, or combined with AND logic.",
        icon: SlidersHorizontal,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
      },
    ],
  },
];

const PROD_FEATURES = [
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Offline Resilience",
    desc: "SDK queues operations during control-plane outages. Flushes after reconnect.",
  },
  {
    icon: Cpu,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Multi-instance Failover",
    desc: "If one worker fails, calls route to other alive instances for the same function.",
  },
  {
    icon: Database,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "PostgreSQL Storage",
    desc: "All state in PostgreSQL. No Redis, no external queues. Standard backups work.",
  },
  {
    icon: Globe,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    title: "HTTP Framework Support",
    desc: "Express middleware and Fastify plugin for automatic trace propagation.",
  },
  {
    icon: KeySquare,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    title: "Rate Limiting",
    desc: "Token bucket rate limiting per service on event publishing. Configurable RPS and burst.",
  },
  {
    icon: ShieldCheck,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "3-Layer Caller Enforcement",
    desc: "allowed_callers enforced at registry, SDK, and worker handler. mTLS cert CN provides cryptographic identity.",
  },
  {
    icon: RefreshCcw,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "DLQ Replay",
    desc: "Dead-letter entries can be batch-replayed from the UI or via gRPC ReplayDLQ without any manual SQL.",
  },
  {
    icon: Server,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    title: "Zero-DB Endpoint Discovery",
    desc: "LookupFunction reads from an in-memory hub snapshot — zero PostgreSQL queries at any call rate. Endpoint data stays fresh via Heartbeat-driven updates.",
  },
  {
    icon: Network,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "gRPC Native Load Balancing",
    desc: "One gRPC channel per function via Custom Name Resolver. Round-robin across replicas, connection pooling, and dead-worker detection handled natively by gRPC — no custom logic.",
  },
];

function FeatureCard({ feature, className }: { feature: FeatureDef; className?: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden",
        "hover:border-white/[0.12] hover:bg-white/[0.035] transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          feature.iconBg
        )}
      />
      <div className="relative flex flex-col h-full">
        <div
          className={cn(
            "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5 ring-1 ring-white/[0.06]",
            feature.iconBg
          )}
        >
          <feature.icon className={cn("w-5 h-5", feature.iconColor)} />
        </div>
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          <h3 className="text-base font-semibold font-display leading-snug">{feature.title}</h3>
          {feature.badge && (
            <span
              className={cn(
                "inline-block text-3xs font-mono font-semibold rounded-full border px-2 py-0.5 leading-normal",
                feature.badgeColor
              )}
            >
              {feature.badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{feature.desc}</p>
        {feature.stat && (
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-baseline gap-1.5">
            <span className={cn("text-3xl font-bold font-display tabular-nums", feature.iconColor)}>
              {feature.stat}
            </span>
            <span className="text-xs text-muted-foreground">{feature.statLabel}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CategoryDivider({ label }: { label: string }) {
  return (
    <div className="col-span-full flex items-center gap-4 mt-2 first:mt-0">
      <span className="text-2xs font-mono uppercase tracking-widest text-zinc-500 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

export function FeaturesSection() {
  return (
    <AnimatedSection className="container mx-auto px-4 py-24" id="features">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need — production-ready out of the box"
        subtitle="One Go binary + PostgreSQL. mTLS, tracing, retries, DLQ, failover — built in, not bolted on."
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
        {FEATURE_GROUPS.map((group) => (
          <div key={group.label} className="contents">
            <CategoryDivider label={group.label} />
            {group.features.map((feature) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                className={group.wide ? "md:col-span-3" : "md:col-span-2"}
              />
            ))}
          </div>
        ))}
      </div>

      <motion.div variants={fadeInUp} className="mt-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-2xs font-mono uppercase tracking-widest text-zinc-500">
            Production-grade infrastructure
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROD_FEATURES.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeInUp}
              className="group flex items-start gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 hover:border-white/[0.09] hover:bg-white/[0.03] transition-all duration-300"
            >
              <div
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ring-1 ring-white/[0.06]",
                  item.bg
                )}
              >
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold font-display mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
