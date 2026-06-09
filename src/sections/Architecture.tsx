import { motion } from "framer-motion";
import { ArrowRight, Lock, Server, ShieldCheck, Zap } from "lucide-react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

const SERVICES_LEFT = ["Service A", "Service B"];
const SERVICES_RIGHT = ["Service C", "Service D"];
const PRIMITIVES = ["RPC", "Events", "Jobs", "Workflows", "Traces", "Policy"];

const GRPC_SERVICES = [
  {
    name: "Control",
    role: "Session stream: Welcome on start, Drain on stop; cert refresh over unary RPC.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/20",
  },
  {
    name: "Registry",
    role: "RegisterAndWatch: SDK registers handlers and streams service-graph deltas.",
    color: "text-violet-400",
    bg: "bg-violet-500/[0.06]",
    border: "border-violet-500/20",
  },
  {
    name: "Call · Invoke",
    role: "Call — direct mTLS caller → callee; Invoke — proxied through the runtime when the endpoint is unknown.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/[0.06]",
    border: "border-yellow-500/20",
  },
  {
    name: "Events · Workflows · Jobs",
    role: "Durable delivery: at-least-once, retries, DLQ, idempotency; DAG workflows and cron/delayed jobs.",
    color: "text-sky-400",
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-500/20",
  },
];

const LEGEND = [
  { label: "Direct RPC path", value: "0 hops", color: "text-yellow-400", emphasis: false },
  { label: "Event delivery", value: "at-least-once", color: "text-sky-400", emphasis: false },
  { label: "Source of truth", value: "PostgreSQL 18+", color: "text-lime-400", emphasis: true },
  { label: "Control plane", value: "gRPC :14445", color: "text-cyan-400", emphasis: false },
  { label: "Scale", value: "up to 1000 services", color: "text-emerald-400", emphasis: true },
];

function ServiceBox({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 text-center">
      <Server className="w-5 h-5 mx-auto mb-2 text-muted-foreground/70" />
      <p className="text-sm font-semibold font-display text-muted-foreground">{name}</p>
      <div className="mt-2 flex flex-col gap-1 items-center">
        <span className="inline-flex items-center gap-1 text-2xs font-mono text-violet-400/80 bg-violet-500/[0.08] rounded px-1.5 py-0.5">
          <Lock className="w-2.5 h-2.5" />
          SERVICE KEY · mTLS
        </span>
        <span className="text-2xs font-mono text-cyan-400/70 bg-cyan-500/[0.05] rounded px-1.5 py-0.5">
          offline queue
        </span>
      </div>
    </div>
  );
}

export function ArchitectureSection() {
  return (
    <Section id="architecture">
      <SectionHeader
        eyebrow="Architecture"
        title="How ServiceBridge works"
        subtitle="RPC flows directly between services over mTLS. Events, jobs, workflows, and traces run through one runtime on the gRPC control plane, with PostgreSQL as the single source of truth."
      />

      <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 md:p-10">
          {/* Security banner */}
          <div className="mb-5 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] px-4 py-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono text-violet-200/90">
              <span>
                <span className="text-violet-300 font-semibold">SERVICE KEY</span> per service —
                explicit capabilities + topic/function/caller policy
              </span>
              <span className="text-violet-500/50 hidden sm:inline">·</span>
              <span>
                <span className="text-violet-300 font-semibold">mTLS</span> — SPIFFE cert identity
                cryptographically backs every caller
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Services left */}
            <div className="space-y-3">
              {SERVICES_LEFT.map((name) => (
                <ServiceBox key={name} name={name} />
              ))}
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-center gap-2">
                <motion.div
                  className="hidden sm:block flex-1 border-t border-dashed border-yellow-500/30"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-1 shrink-0">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-2xs font-mono font-semibold text-yellow-400">
                    RPC · direct gRPC
                  </span>
                </div>
                <motion.div
                  className="hidden sm:block flex-1 border-t border-dashed border-yellow-500/30"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                />
              </div>

              <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.05] p-5 text-center w-full subtle-glow">
                <BrandMark className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold font-display text-emerald-400">ServiceBridge</p>
                <p className="text-2xs text-muted-foreground mt-0.5 font-mono">+ PostgreSQL</p>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {PRIMITIVES.map((m) => (
                    <span
                      key={m}
                      className="text-2xs font-mono text-muted-foreground bg-surface rounded px-1.5 py-0.5"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full flex items-center justify-center gap-2">
                <div className="hidden sm:block flex-1 border-t border-dashed border-emerald-500/20" />
                <span className="text-2xs font-mono text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded shrink-0">
                  control plane
                </span>
                <div className="hidden sm:block flex-1 border-t border-dashed border-emerald-500/20" />
              </div>
            </div>

            {/* Services right */}
            <div className="space-y-3">
              {SERVICES_RIGHT.map((name) => (
                <ServiceBox key={name} name={name} />
              ))}
            </div>
          </div>

          {/* gRPC Services */}
          <div className="mt-6 pt-6 border-t border-surface-border">
            <p className="text-2xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">
              gRPC Services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GRPC_SERVICES.map((svc) => (
                <div
                  key={svc.name}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 flex flex-col gap-1",
                    svc.bg,
                    svc.border
                  )}
                >
                  <span className={cn("text-2xs font-mono font-semibold", svc.color)}>
                    {svc.name}
                  </span>
                  <span className="text-xs text-muted-foreground/90 leading-relaxed">
                    {svc.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-surface-border grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-xs">
            {LEGEND.map((item) => (
              <div
                key={item.label}
                className={cn(
                  item.emphasis &&
                    "rounded-lg border border-surface-border bg-white/[0.02] px-2 py-2"
                )}
              >
                <p
                  className={cn(
                    "font-mono",
                    item.color,
                    item.emphasis ? "type-section-title" : "type-subsection-title"
                  )}
                >
                  {item.value}
                </p>
                <p className="type-body-sm text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Bridge CTA */}
          <div className="mt-6 pt-6 border-t border-surface-border flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="#service-discovery"
              className="inline-flex items-center gap-1.5 type-label text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See it in the Service Map <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#start"
              className="inline-flex items-center gap-1.5 type-label text-muted-foreground hover:text-foreground transition-colors"
            >
              Quickstart <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
