import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart2,
  BellRing,
  Clock,
  Cpu,
  Database,
  Eye,
  GitBranch,
  GitMerge,
  Globe,
  KeySquare,
  Lock,
  Network,
  Radio,
  RefreshCw,
  Settings2,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  Waves,
  Workflow,
  Zap,
} from "lucide-react";
import type React from "react";
import { fadeInUp } from "../components/animations";
import { Button } from "../ui/button";
import { FeatureCard } from "../ui/FeatureCard";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

type FeatureDef = {
  title: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeTone?: string;
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
    wide: true,
    features: [
      {
        title: "Direct RPC",
        desc: "Direct callee-to-callee over mTLS gRPC — no proxy hop on the hot path. Schema-driven encoding, backoff retries, and idempotency keys built in. Identity rides the cert; access policy is enforced end-to-end.",
        icon: Zap,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        badge: "no proxy hop",
        badgeTone: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      },
      {
        title: "Durable Events",
        desc: "A local SQLite outbox means publishing survives a runtime blip. At-least-once with fan-out, retries, DLQ. Offline subscribers catch up on reconnect. All state in PostgreSQL — no separate broker.",
        icon: Radio,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        badge: "no separate broker",
        badgeTone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      },
      {
        title: "HTTP Integrations",
        desc: "Attach your own Express, Fastify, or Hono server in one line — the runtime never proxies business HTTP. Routes land in the Service Map and every request emits a traced HTTP op. No handler rewrites.",
        icon: Globe,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "Express, Fastify, Hono",
        badgeTone: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
      {
        title: "Realtime Streams",
        desc: "Push incremental chunks from a handler as it runs, over gRPC server-streaming. Breaking the consumer loop cancels the underlying stream. Perfect for LLM token output, progress bars, and live logs.",
        icon: Waves,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        badge: "LLM, progress, logs",
        badgeTone: "text-red-400 bg-red-400/10 border-red-400/20",
      },
      {
        title: "Service Discovery",
        desc: "No Consul, no etcd, no DNS glue. Services declare handlers and dependencies before start(); the control plane resolves endpoints instantly and drops dead instances automatically — no custom routing logic.",
        icon: Network,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        stat: "1000",
        statLabel: "services per runtime",
      },
      {
        title: "Service Map & Connections",
        desc: "A live map of your whole system — every service, its health, replicas, and resource use at a glance. Drill into any edge for error rate and p95 latency. Updates in real time, no refresh needed.",
        icon: GitMerge,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-400",
        badge: "realtime, replica-aware",
        badgeTone: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      },
      {
        title: "Topic-Pattern Subscriptions",
        desc: "Subscribe to exactly the events you care about. Handlers match by topic pattern, scoped by access policy to the patterns each service is allowed to receive.",
        icon: SlidersHorizontal,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        badge: "pattern match, policy-scoped",
        badgeTone: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      },
    ],
  },
  {
    label: "Orchestration",
    wide: true,
    features: [
      {
        title: "Workflows",
        desc: "Multi-step sagas as code. Chain call, publish, sleep, and wait steps into a DAG — parallel by default, dependents wait via waitFor. Durable execution with reverse-order compensation on cancel. Every run fully traced.",
        icon: Workflow,
        iconBg: "bg-fuchsia-500/10",
        iconColor: "text-fuchsia-400",
        badge: "durable DAG sagas",
        badgeTone: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20",
      },
      {
        title: "Built-in Jobs",
        desc: "Cron, one-shot delayed, and interval jobs — no external scheduler. A job body may call RPC, publish events, or start workflows. Configurable retry, timezone, catchup and overlap policies for runs missed during downtime.",
        icon: Clock,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
        badge: "no external scheduler",
        badgeTone: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      },
    ],
  },
  {
    label: "Security",
    wide: true,
    features: [
      {
        title: "Granular Access Policy",
        desc: "Each service gets a scoped key: which topics, methods, and services it may touch. Policy enforced gate-by-gate at registration, rpc.call, event.publish, and workflow.run. GitOps via sb apply.",
        icon: KeySquare,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "gate-by-gate enforcement",
        badgeTone: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
      {
        title: "Auto mTLS",
        desc: "The SDK generates a local keypair; the private key never leaves the process. Short-lived leaf certs auto-refresh before expiry. No cert-manager, no Vault PKI, no sidecar.",
        icon: Lock,
        iconBg: "bg-teal-500/10",
        iconColor: "text-teal-400",
        stat: "1h",
        statLabel: "leaf cert TTL",
      },
    ],
  },
  {
    label: "Observability",
    wide: false,
    features: [
      {
        title: "Unified Tracing",
        desc: "HTTP, RPC, events, workflows, and jobs — all traced end-to-end. Context propagates automatically, so nested calls inherit the parent trace. Per-run waterfall with retry counts. No Jaeger, no Zipkin.",
        icon: Activity,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        badge: "no Jaeger, no Zipkin",
        badgeTone: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      },
      {
        title: "Logs & Metrics",
        desc: "Structured logs and counter / gauge / histogram metrics, auto-tagged with the active trace and op id. Expand any span in the waterfall to read its log lines inline. Prometheus, Loki & OTLP export built in.",
        icon: BarChart2,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        badge: "Prometheus, Loki, OTLP",
        badgeTone: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      },
      {
        title: "Smart Alerts",
        desc: "UI-configurable rules across eight condition types — from DLQ growth and error rate to p99 latency. Multi-channel: in-app, email, Telegram, webhook, browser push. Cooldown prevents alert storms.",
        icon: BellRing,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        badge: "8 condition types",
        badgeTone: "text-red-400 bg-red-400/10 border-red-400/20",
      },
    ],
  },
  {
    label: "Traffic & Resilience",
    wide: true,
    features: [
      {
        title: "Circuit Breakers",
        desc: "Per-endpoint breakers on the caller side stop cascade failures. A sliding window trips once the error rate crosses 50%, holds open for 30s, then probes for recovery. OPEN instances are skipped during routing.",
        icon: GitBranch,
        iconBg: "bg-sky-500/10",
        iconColor: "text-sky-400",
        badge: "per-endpoint, sliding window",
        badgeTone: "text-sky-400 bg-sky-400/10 border-sky-400/20",
      },
      {
        title: "Multi-instance Failover",
        desc: "Power-of-two-choices load balancing across live replicas with per-pod inflight tracking. The SDK skips unhealthy instances and routes around dead pods — if one worker fails, calls land on another alive instance for the same method.",
        icon: RefreshCw,
        iconBg: "bg-lime-500/10",
        iconColor: "text-lime-400",
        badge: "health-aware routing",
        badgeTone: "text-lime-400 bg-lime-400/10 border-lime-400/20",
      },
      {
        title: "Retries & Idempotency",
        desc: "Every RPC call retries with exponential backoff and jitter by default. Set an idempotency key to opt into runtime-side dedup — replays within the TTL return the cached response instead of re-running the handler.",
        icon: TrendingUp,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
        badge: "backoff + jitter, dedup",
        badgeTone: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      },
      {
        title: "Session Resilience",
        desc: "The SDK holds a control session for Welcome and Drain signals and auto-reconnects with configurable attempts. The local outbox keeps accepting publishes during a runtime outage and drains on reconnect.",
        icon: Settings2,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-400",
        badge: "auto-reconnect, durable outbox",
        badgeTone: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      },
    ],
  },
  {
    label: "Dashboard & Tools",
    wide: true,
    features: [
      {
        title: "Realtime Dashboard",
        desc: "Web UI on port 14444 with live run details, queue and DLQ state, per-entity stats, and the full microservice interaction map — no setup, bundled in the runtime.",
        icon: Eye,
        iconBg: "bg-rose-500/10",
        iconColor: "text-rose-400",
        badge: "bundled, port 14444",
        badgeTone: "text-rose-400 bg-rose-400/10 border-rose-400/20",
      },
    ],
  },
];

const PROD_FEATURES = [
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Durable Delivery",
    desc: "Local SQLite outbox plus at-least-once delivery with retries and DLQ. Publishing survives a runtime blip.",
  },
  {
    icon: Cpu,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Multi-instance Failover",
    desc: "If one worker fails, calls route to other alive instances for the same method.",
  },
  {
    icon: Database,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "PostgreSQL Storage",
    desc: "All state in PostgreSQL 18+. No Redis, no external queues. Standard backups work.",
  },
  {
    icon: KeySquare,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    title: "Rate Limiting",
    desc: "Token-bucket rate limiting per service on job registration, with a configurable per-minute budget.",
  },
];

function CategoryDivider({ label }: { label: string }) {
  return (
    <div className="col-span-full mt-2 flex items-center gap-4 first:mt-0">
      <span className="type-overline-mono shrink-0">{label}</span>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

export function FeaturesSection() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need — built in, not bolted on"
        subtitle="One Go binary + PostgreSQL. Everything from RPC and events to workflows, mTLS, and tracing — through one Node SDK."
      />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-6">
        {FEATURE_GROUPS.map((group) => (
          <div key={group.label} className="contents">
            <CategoryDivider label={group.label} />
            {group.features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className={group.wide ? "md:col-span-3" : "md:col-span-2"}
              >
                <FeatureCard
                  variant="large"
                  title={feature.title}
                  description={feature.desc}
                  icon={feature.icon}
                  iconBg={feature.iconBg}
                  iconClassName={feature.iconColor}
                  badge={feature.badge}
                  badgeTone={feature.badgeTone}
                  stat={feature.stat}
                  statLabel={feature.statLabel}
                  className="h-full"
                />
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <motion.div variants={fadeInUp} className="mx-auto mt-12 max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="type-overline-mono">Production-grade infrastructure</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROD_FEATURES.map((item) => (
            <motion.div key={item.title} variants={fadeInUp}>
              <FeatureCard
                variant="compact"
                icon={item.icon}
                iconClassName={item.color}
                title={item.title}
                description={item.desc}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="mx-auto mt-12 flex max-w-5xl flex-col items-center gap-3 text-center"
      >
        <p className="type-body-sm">Everything above ships in one Node SDK against one runtime.</p>
        <Button asChild size="lg">
          <a href="#code">
            Read the quickstart
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </motion.div>
    </Section>
  );
}
