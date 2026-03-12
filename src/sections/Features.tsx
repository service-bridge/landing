import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Clock,
  Cpu,
  Database,
  Eye,
  GitMerge,
  Globe,
  KeySquare,
  Lock,
  Network,
  Radio,
  Shield,
  SlidersHorizontal,
  Waves,
  Workflow,
  Zap,
} from "lucide-react";
import type React from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
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
    wide: true,
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
        title: "HTTP Middleware",
        desc: "One middleware — every inbound request gets a span, downstream rpc() calls inherit trace context, and routes appear in the HTTP catalog automatically. Works with Express, Fastify, Gin, Echo, Chi, FastAPI, and Flask. No handler changes needed.",
        icon: Globe,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-400",
        badge: "Express, Fastify, Gin, FastAPI",
        badgeColor: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
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
      {
        title: "Service Discovery",
        desc: "No Consul, no etcd, no DNS glue. Workers register themselves and the control plane takes it from there — endpoint resolution is instant, dead instances drop out automatically. gRPC native load balancing across replicas with connection pooling, no custom logic needed.",
        icon: Network,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        badge: "1000+ services, zero DB",
        badgeColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      },
      {
        title: "Service Map & Connections",
        desc: "A live map of your entire system — every service, its health, replica count, and resource usage at a glance. Drill into any service to see who calls it, what it calls, and per-replica logs. Connections tab shows every edge with error rate and p95 latency. Updates in real time, no refresh needed.",
        icon: GitMerge,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "realtime, replica-aware",
        badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
    ],
  },
  {
    label: "Orchestration",
    wide: true,
    features: [
      {
        title: "Workflows",
        desc: "Multi-step sagas defined as code. Chain RPC calls, event publishes, event waits, sleeps, and child workflows into a DAG — independent steps run in parallel, dependent ones wait. State is checkpointed in PostgreSQL on every step, so a restart never loses progress. Every run is fully traced.",
        icon: Workflow,
        iconBg: "bg-fuchsia-500/10",
        iconColor: "text-fuchsia-400",
      },
      {
        title: "Built-in Jobs",
        desc: "Cron and one-shot delayed jobs — no external scheduler needed. Each job can trigger an RPC call, publish an event, or kick off a workflow. Configurable retry policy with backoff, timezone support, and misfire handling when the runtime was down.",
        icon: Clock,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
      },
    ],
  },
  {
    label: "Security",
    wide: true,
    features: [
      {
        title: "Granular Access Policy",
        desc: "Each service gets a scoped key — define what it can do (RPC, events, jobs, workflows), which topics it can publish or subscribe to, which functions it can call or register, and which services are allowed to reach it. Policy is enforced at five independent layers from the control plane down to the worker handler.",
        icon: KeySquare,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "5-layer enforcement",
        badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
      {
        title: "Auto mTLS",
        desc: "The SDK generates a keypair locally — the private key never leaves the process. A cert with CN bound to the service name is provisioned automatically, making caller identity cryptographic rather than header-based. No cert-manager, no Vault PKI, no sidecar. Every service-to-service connection is mTLS from the first call.",
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
    wide: false,
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
        title: "Logs & Metrics",
        desc: "Logs captured automatically, shown in the built-in UI, and correlated to traces by span ID — expand any span in the waterfall to see its log lines inline. Prometheus /metrics (30+ families) and Loki-compatible log API let Grafana connect directly; no exporter sidecar, no Promtail, no Loki cluster needed.",
        icon: BarChart2,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        badge: "Prometheus & Loki export",
        badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
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
    icon: KeySquare,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    title: "Rate Limiting",
    desc: "Token bucket rate limiting per service on event publishing. Configurable RPS and burst.",
  },
];

function LargeFeatureCard({ feature, className }: { feature: FeatureDef; className?: string }) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-surface">
        <div
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100",
            feature.iconBg
          )}
        />
        <div className="relative flex h-full flex-col">
          <div
            className={cn(
              "mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-white/[0.06]",
              feature.iconBg
            )}
          >
            <feature.icon className={cn("h-5 w-5", feature.iconColor)} />
          </div>
          <div className="mb-2 flex flex-wrap items-start gap-2">
            <h3 className="type-subsection-title leading-snug">{feature.title}</h3>
            {feature.badge && (
              <Badge tone={feature.badgeColor}>{feature.badge}</Badge>
            )}
          </div>
          <p className="type-body-sm flex-1 leading-relaxed">{feature.desc}</p>
          {feature.stat && (
            <div className="mt-5 flex items-baseline gap-1.5 border-t border-surface-border pt-4">
              <span
                className={cn(
                  "font-display text-3xl font-bold tabular-nums",
                  feature.iconColor
                )}
              >
                {feature.stat}
              </span>
              <span className="type-body-sm">{feature.statLabel}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

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
        title="Everything you need — production-ready out of the box"
        subtitle="One Go binary + PostgreSQL. mTLS, tracing, retries, DLQ, failover — built in, not bolted on."
      />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-6">
        {FEATURE_GROUPS.map((group) => (
          <div key={group.label} className="contents">
            <CategoryDivider label={group.label} />
            {group.features.map((feature) => (
              <LargeFeatureCard
                key={feature.title}
                feature={feature}
                className={group.wide ? "md:col-span-3" : "md:col-span-2"}
              />
            ))}
          </div>
        ))}
      </div>

      <motion.div variants={fadeInUp} className="mx-auto mt-12 max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="type-overline-mono">Production-grade infrastructure</span>
          <div className="h-px flex-1 bg-surface-border" />
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
    </Section>
  );
}
