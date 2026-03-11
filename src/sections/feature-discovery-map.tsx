import { motion } from "framer-motion";
import {
  CalendarClock,
  GitBranch,
  GitMerge,
  Globe,
  LayoutGrid,
  Network,
  Radio,
  Server,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";

const DISCOVERY_FLOW = [
  {
    step: "01",
    title: "Workers register on serve()",
    desc: "Each service publishes its live endpoint, handlers, and optional schema to the control plane.",
    tone: "text-blue-300 bg-blue-500/[0.08] border-blue-500/20",
  },
  {
    step: "02",
    title: "Callers resolve endpoints on demand",
    desc: "The SDK lazily calls LookupFunction on first rpc() and refreshes every 10 s. Dead workers are detected instantly by gRPC subchannel health probing — no streaming connection needed.",
    tone: "text-cyan-300 bg-cyan-500/[0.08] border-cyan-500/20",
  },
  {
    step: "03",
    title: "UI renders live topology",
    desc: "The same registry data powers the service map and the connections map inside the dashboard.",
    tone: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/20",
  },
  {
    step: "04",
    title: "RPC still stays direct",
    desc: "Discovery is centralized, but the payload path remains service-to-service with zero proxy hops.",
    tone: "text-violet-300 bg-violet-500/[0.08] border-violet-500/20",
  },
] as const;

const REGISTRY_ROWS = [
  {
    service: "orders",
    endpoint: "10.0.1.5:50051",
    rpc: 4,
    events: 2,
    jobs: 1,
    workflows: 0,
  },
  {
    service: "payments",
    endpoint: "10.0.2.4:50051",
    rpc: 3,
    events: 1,
    jobs: 0,
    workflows: 0,
  },
  {
    service: "notify",
    endpoint: "10.0.3.9:50051",
    rpc: 1,
    events: 4,
    jobs: 0,
    workflows: 1,
  },
] as const;

const MAP_STATS = [
  { label: "Services", value: "12", icon: Network, tone: "bg-primary/10 text-primary" },
  {
    label: "Connections",
    value: "27",
    icon: GitMerge,
    tone: "bg-violet-500/10 text-violet-400",
  },
  { label: "RPC", value: "34", icon: Zap, tone: "bg-blue-500/10 text-blue-400" },
  { label: "Events", value: "19", icon: Radio, tone: "bg-emerald-500/10 text-emerald-400" },
  {
    label: "Jobs",
    value: "6",
    icon: CalendarClock,
    tone: "bg-amber-500/10 text-amber-400",
  },
  {
    label: "Workflows",
    value: "4",
    icon: GitBranch,
    tone: "bg-fuchsia-500/10 text-fuchsia-400",
  },
] as const;

const MAP_SERVICES = [
  {
    name: "orders",
    endpoint: "10.0.1.5:50051",
    rpc: 4,
    events: 2,
    jobs: 1,
    workflows: 0,
    incoming: 5,
    outgoing: 7,
    alive: true,
  },
  {
    name: "payments",
    endpoint: "10.0.2.4:50051",
    rpc: 3,
    events: 1,
    jobs: 0,
    workflows: 0,
    incoming: 4,
    outgoing: 2,
    alive: true,
  },
  {
    name: "notify",
    endpoint: "10.0.3.9:50051",
    rpc: 1,
    events: 4,
    jobs: 0,
    workflows: 1,
    incoming: 3,
    outgoing: 5,
    alive: true,
  },
  {
    name: "analytics",
    endpoint: "10.0.4.2:50051",
    rpc: 2,
    events: 2,
    jobs: 1,
    workflows: 0,
    incoming: 1,
    outgoing: 3,
    alive: false,
  },
] as const;

const CONNECTION_ROWS = [
  {
    type: "rpc",
    label: "payments.charge",
    from: "orders",
    to: "payments",
    tone: "text-blue-300 bg-blue-500/[0.08] border-blue-500/20",
  },
  {
    type: "event",
    label: "order.created",
    from: "orders",
    to: "notify",
    tone: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/20",
  },
  {
    type: "workflow",
    label: "merchant.onboarding",
    from: "dashboard",
    to: "notify",
    tone: "text-fuchsia-300 bg-fuchsia-500/[0.08] border-fuchsia-500/20",
  },
  {
    type: "job",
    label: "reports.generate",
    from: "scheduler",
    to: "analytics",
    tone: "text-amber-300 bg-amber-500/[0.08] border-amber-500/20",
  },
] as const;

const BOTTOM_HIGHLIGHTS = [
  {
    icon: Globe,
    title: "Zero-DB endpoint lookup",
    desc: "LookupFunction reads from an in-memory hub snapshot — no DB query regardless of call rate. Scales to 1 000+ services without extra infrastructure.",
    tone: "text-cyan-400",
  },
  {
    icon: LayoutGrid,
    title: "Service map",
    desc: "See every registered service, its endpoint, health, and resource counts in one grid.",
    tone: "text-primary",
  },
  {
    icon: GitMerge,
    title: "Connections map",
    desc: "Inspect who talks to whom and which primitive created that edge across your system.",
    tone: "text-violet-400",
  },
  {
    icon: Zap,
    title: "Direct path preserved",
    desc: "Discovery centralizes metadata while RPC traffic keeps its zero-hop service-to-service path.",
    tone: "text-yellow-400",
  },
] as const;

type MapTab = "services" | "connections";

function MetricBadge({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-medium",
        tone
      )}
    >
      <span className="font-semibold">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function MapServiceCard({
  name,
  endpoint,
  rpc,
  events,
  jobs,
  workflows,
  incoming,
  outgoing,
  alive,
}: (typeof MAP_SERVICES)[number]) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/[0.08]">
            <Server className="h-4 w-4 text-blue-300" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold font-display">{name}</p>
            <p className="truncate text-2xs font-mono text-zinc-500">{endpoint}</p>
          </div>
        </div>
        <span
          className={cn(
            "mt-1 h-2.5 w-2.5 rounded-full",
            alive ? "bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.45)]" : "bg-red-400"
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricBadge
          label="rpc"
          value={rpc}
          tone="border-blue-500/20 bg-blue-500/[0.08] text-blue-300"
        />
        <MetricBadge
          label="events"
          value={events}
          tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
        />
        <MetricBadge
          label="jobs"
          value={jobs}
          tone="border-amber-500/20 bg-amber-500/[0.08] text-amber-300"
        />
        <MetricBadge
          label="wf"
          value={workflows}
          tone="border-fuchsia-500/20 bg-fuchsia-500/[0.08] text-fuchsia-300"
        />
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.05] pt-3 text-3xs font-mono text-zinc-500">
        <span>in {incoming}</span>
        <span>out {outgoing}</span>
        <span className={alive ? "text-emerald-300" : "text-red-300"}>
          {alive ? "online" : "offline"}
        </span>
      </div>
    </div>
  );
}

export function DiscoveryMapSection() {
  const [tab, setTab] = useState<MapTab>("services");

  return (
    <AnimatedSection className="py-24 border-t border-white/[0.04]" id="service-discovery">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Service Discovery"
          title={
            <>
              Discovery, <span className="text-gradient">service map, and connections map</span>
            </>
          }
          subtitle="The registry is not just for callers. The same live topology data powers endpoint discovery in the SDK and the Service Map UI in the dashboard."
        />

        <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="type-overline-mono text-zinc-500">live discovery flow</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    One registry update fan-out serves the SDK and the UI at the same time.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/[0.08] px-2.5 py-1 text-3xs font-mono font-semibold text-primary">
                  zero config
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {DISCOVERY_FLOW.map((step) => (
                  <div
                    key={step.step}
                    className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-bold",
                        step.tone
                      )}
                    >
                      {step.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-display">{step.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.06] bg-[#080d18] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="type-overline-mono text-zinc-500">registry snapshot</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    The UI and the SDK both consume the same live model.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-3xs font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  in-memory · O(1)
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {REGISTRY_ROWS.map((row) => (
                  <div
                    key={row.service}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold font-display text-zinc-200">
                        {row.service}
                      </p>
                      <p className="truncate text-2xs font-mono text-blue-300">{row.endpoint}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <MetricBadge
                        label="rpc"
                        value={row.rpc}
                        tone="border-blue-500/20 bg-blue-500/[0.08] text-blue-300"
                      />
                      <MetricBadge
                        label="events"
                        value={row.events}
                        tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
                      />
                      <MetricBadge
                        label="jobs"
                        value={row.jobs}
                        tone="border-amber-500/20 bg-amber-500/[0.08] text-amber-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <div className="border-b border-white/[0.06] bg-[#080d18] px-5 py-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="type-overline-mono text-zinc-500">service map ui</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      The landing visual mirrors the actual dashboard structure: stats, tabs,
                      services, and connections.
                    </p>
                  </div>
                  <div className="hidden rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-2xs font-mono text-zinc-400 sm:block">
                    localhost:14444
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                  {MAP_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3"
                    >
                      <div
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-xl",
                          stat.tone
                        )}
                      >
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <p className="mt-3 text-lg font-bold font-display">{stat.value}</p>
                      <p className="text-2xs text-zinc-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
                  {[
                    { id: "services" as const, label: "Services", icon: LayoutGrid },
                    { id: "connections" as const, label: "Connections map", icon: GitMerge },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        tab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-2xs font-mono text-zinc-500">
                  same registry, two views
                </div>
              </div>

              {tab === "services" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {MAP_SERVICES.map((service) => (
                    <MapServiceCard key={service.name} {...service} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {CONNECTION_ROWS.map((row) => (
                    <div
                      key={`${row.type}-${row.label}-${row.from}-${row.to}`}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-1 text-3xs font-mono font-semibold",
                          row.tone
                        )}
                      >
                        {row.type}
                      </span>
                      <code className="truncate rounded-lg bg-white/[0.03] px-2 py-1 text-2xs font-mono text-zinc-300">
                        {row.label}
                      </code>
                      <span className="truncate text-sm font-semibold">{row.from}</span>
                      <span className="truncate text-sm text-zinc-400">{row.to}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={fadeInUp}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto"
        >
          {BOTTOM_HIGHLIGHTS.map((item) => (
            <MiniCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              desc={item.desc}
              iconClassName={item.tone}
            />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
