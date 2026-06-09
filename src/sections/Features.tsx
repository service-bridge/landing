import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
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
        desc: "sb.rpc.call resolves endpoints and reaches the callee directly over mTLS gRPC — no proxy hop on the hot path. Schema-driven encoding (.proto / .schema.json), exponential-backoff retries, and idempotency keys built in. Caller identity rides the cert CN; access policy is enforced gate-by-gate from the control plane down to the worker.",
        icon: Zap,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
        badge: "direct mTLS, policy-gated",
        badgeTone: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      },
      {
        title: "Durable Events",
        desc: "sb.event.publish writes to a local SQLite outbox first, so publishing survives a runtime blip; a drainer ships it on. At-least-once delivery with fan-out, retries, DLQ, and idempotency keys. Offline subscribers hold their place and catch up on reconnect. All state lives in PostgreSQL — no separate broker.",
        icon: Radio,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        badge: "at-least-once, DLQ, Postgres",
        badgeTone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      },
      {
        title: "HTTP Integrations",
        desc: "Attach your own Express, Fastify, or Hono server in one line — the runtime never proxies business HTTP (ADR 0001). Routes are published into Service Map and Service Discovery, X-SB-Trace propagation is installed, and each request emits an HTTP op into the trace. No handler rewrites.",
        icon: Globe,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-400",
        badge: "Express, Fastify, Hono",
        badgeTone: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      },
      {
        title: "Realtime Streams",
        desc: "Push incremental chunks from a handler as it runs with sb.rpc.handleStream, consumed via sb.stream over gRPC server-streaming. Breaking the for-await loop cancels the underlying stream. Perfect for LLM token output, progress bars, and live logs.",
        icon: Waves,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-400",
        badge: "LLM, progress, logs",
        badgeTone: "text-red-400 bg-red-400/10 border-red-400/20",
      },
      {
        title: "Service Discovery",
        desc: "No Consul, no etcd, no DNS glue. Services declare handlers and dependencies before start(); the control plane resolves endpoints instantly and drops dead instances automatically. Power-of-two-choices load balancing across replicas with per-pod inflight tracking — no custom routing logic.",
        icon: Network,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        badge: "up to 1000 services",
        badgeTone: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      },
      {
        title: "Service Map & Connections",
        desc: "A live map of your entire system — every service, its health, replica count, and resource usage at a glance. Drill into any service to see who calls it, what it calls, and per-replica logs. Connections tab shows every edge with error rate and p95 latency. Updates in real time, no refresh needed.",
        icon: GitMerge,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "realtime, replica-aware",
        badgeTone: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
    ],
  },
  {
    label: "Orchestration",
    wide: true,
    features: [
      {
        title: "Workflows",
        desc: "Multi-step sagas defined as code with sb.workflow.handle. Chain call, publish, sleep, wait_event, wait_signal, and child-workflow steps into a DAG — top-level steps run in parallel by default, dependents wait via waitFor. Durable execution is runtime-owned; cancel runs reverse-order compensation. sb.workflow.await resolves only on terminal status \"success\". Every run is fully traced.",
        icon: Workflow,
        iconBg: "bg-fuchsia-500/10",
        iconColor: "text-fuchsia-400",
      },
      {
        title: "Built-in Jobs",
        desc: "Cron, one-shot delayed, and interval jobs — no external scheduler needed. sb.job.handle declares the trigger; the job body may call RPC, publish events, or start workflows via its deps. Configurable retry with backoff, timezone (tz), catchup and overlap policies for runs missed while the runtime was down.",
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
        desc: "Each service gets a scoped key — define what it can do (RPC, events, workflows), which topics it can publish or subscribe to, which methods it can call or register, and which services may reach it. Policy is enforced as numbered gates at registration, rpc.call, event.publish, and workflow.run — from the control plane down to the worker handler. Jobs are self-only.",
        icon: KeySquare,
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-400",
        badge: "gate-by-gate enforcement",
        badgeTone: "text-violet-400 bg-violet-400/10 border-violet-400/20",
      },
      {
        title: "Auto mTLS",
        desc: "The SDK generates a local ECDSA P-256 keypair and sends only the public key to gRPC ProvisionWorkerCertificate. Worker cert CN is bound to the service name from the key; private key never leaves the process. Leaf certs are short-lived (1-hour validity) and auto-refreshed before expiry, with re-provision on missing/expired. No cert-manager, no Vault PKI, no sidecar.",
        icon: Lock,
        iconBg: "bg-teal-500/10",
        iconColor: "text-teal-400",
        badge: "gRPC provisioning",
        badgeTone: "text-teal-400 bg-teal-400/10 border-teal-400/20",
      },
    ],
  },
  {
    label: "Observability",
    wide: false,
    features: [
      {
        title: "Unified Tracing",
        desc: "HTTP requests, RPC calls, event delivery, workflow runs, and job executions — all traced end-to-end. Trace context propagates automatically through ALS and the X-SB-Trace header, so nested calls inherit the parent trace. Per-run waterfall timeline with retry counts and delivery status. No Jaeger, no Zipkin.",
        icon: Activity,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-400",
        badge: "auto X-SB-Trace propagation",
        badgeTone: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
      },
      {
        title: "Logs & Metrics",
        desc: "The SDK always emits structured logs and counter / gauge / histogram metrics, auto-tagged with instance id and the active trace and op id. Logs are shown in the built-in UI and correlated to traces — expand any span in the waterfall to read its log lines inline. Payload capture is per-channel. No exporter sidecar.",
        icon: BarChart2,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
        badge: "trace-correlated, per-channel capture",
        badgeTone: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      },
      {
        title: "Smart Alerts",
        desc: "UI-configurable alert rules across eight condition types: DLQ growth, error rate, service offline, delivery failures, job errors, workflow errors, metric thresholds, and p99 latency. Multi-channel: in-app, email, Telegram, webhook, and browser push. Cooldown prevents alert storms.",
        icon: Activity,
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
        desc: "Per-endpoint circuit breakers on the caller side stop cascade failures. A sliding 10-second window trips the breaker once the error rate crosses 50% over a minimum request count, holds it open for 30 seconds, then probes for recovery. OPEN instances are skipped during routing.",
        icon: GitBranch,
        iconBg: "bg-sky-500/10",
        iconColor: "text-sky-400",
        badge: "per-endpoint, sliding window",
        badgeTone: "text-sky-400 bg-sky-400/10 border-sky-400/20",
      },
      {
        title: "Multi-instance Failover",
        desc: "Power-of-two-choices load balancing across live replicas with per-pod inflight tracking. The runtime marks unhealthy instances through the registry snapshot; the SDK skips them and routes around dead pods. If one worker fails, calls land on another alive instance for the same method.",
        icon: RefreshCw,
        iconBg: "bg-lime-500/10",
        iconColor: "text-lime-400",
        badge: "P2C LB, health-aware routing",
        badgeTone: "text-lime-400 bg-lime-400/10 border-lime-400/20",
      },
      {
        title: "Retries & Idempotency",
        desc: "Every sb.rpc.call retries with exponential backoff and jitter by default (maxAttempts 3, base 200ms, factor 2). Set an idempotencyKey to opt into runtime-side dedup — replays within the TTL return the cached response instead of re-running the handler.",
        icon: TrendingUp,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-400",
        badge: "backoff + jitter, dedup",
        badgeTone: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      },
      {
        title: "Session Resilience",
        desc: "The SDK holds a server-streamed control session for Welcome and Drain signals and auto-reconnects with configurable attempts and interval. The local event outbox keeps accepting publishes during a runtime outage and drains them on reconnect — publishing survives transient downtime.",
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
        desc: "Web UI on port 14444 with live run details, queue and DLQ state, per-entity stats, and the full microservice interaction map.",
        icon: Eye,
        iconBg: "bg-rose-500/10",
        iconColor: "text-rose-400",
      },
      {
        title: "Topic-Pattern Subscriptions",
        desc: "Subscribe to exactly the events you care about with sb.event.handle. Handlers match by event topic pattern, scoped by access policy to the patterns each service is allowed to receive.",
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
        subtitle="One Go binary + PostgreSQL. Direct RPC, durable events, workflows, jobs, mTLS, access policy, tracing, retries, circuit breakers, DLQ — one Node SDK, one runtime."
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
    </Section>
  );
}
