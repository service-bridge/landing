import { motion } from "framer-motion";
import { Lock, Server, ShieldCheck, Zap } from "lucide-react";
import { fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

const SERVICES_LEFT = ["Service A", "Service B"];
const SERVICES_RIGHT = ["Service C", "Service D"];
const PRIMITIVES = ["RPC", "Events", "Jobs", "Workflows", "Traces", "RBAC"];

const LEGEND = [
  { label: "RPC path", value: "0 hops", color: "text-yellow-400" },
  { label: "Event delivery", value: "at-least-once", color: "text-amber-400" },
  { label: "Persistence", value: "PostgreSQL only", color: "text-violet-400" },
  { label: "Discovery load", value: "0 DB queries", color: "text-cyan-400" },
  { label: "Scale", value: "1000+ services", color: "text-emerald-400" },
];

function ServiceBox({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 text-center">
      <Server className="w-5 h-5 mx-auto mb-2 text-zinc-500" />
      <p className="text-sm font-semibold font-display text-zinc-300">{name}</p>
      <div className="mt-2 flex flex-col gap-1 items-center">
        <span className="inline-flex items-center gap-1 text-3xs font-mono text-violet-400/70 bg-violet-500/[0.08] rounded px-1.5 py-0.5">
          <Lock className="w-2.5 h-2.5" />
          SERVICE KEY · mTLS
        </span>
        <span className="text-3xs font-mono text-cyan-400/60 bg-cyan-500/[0.05] rounded px-1.5 py-0.5">
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
        subtitle="RPC data flows directly between services. Events, jobs, workflows, and traces go through the control plane."
      />

      <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 md:p-10">
          {/* Security banner */}
          <div className="mb-5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs font-mono text-violet-300/80">
              <span>
                <span className="text-violet-400 font-semibold">SERVICE KEY</span> per service —
                explicit capabilities + topic/function/caller policy
              </span>
              <span className="text-violet-500/50 hidden sm:inline">·</span>
              <span>
                <span className="text-violet-400 font-semibold">mTLS</span> — cert CN
                cryptographically backs caller identity
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
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 border-t border-dashed border-yellow-500/30" />
                <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-1 shrink-0">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-3xs font-mono font-semibold text-yellow-400">
                    RPC · direct gRPC
                  </span>
                </div>
                <div className="flex-1 border-t border-dashed border-yellow-500/30" />
              </div>

              <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.05] p-5 text-center w-full glow-emerald">
                <BrandMark className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold font-display text-primary">ServiceBridge</p>
                <p className="text-3xs text-muted-foreground mt-0.5 font-mono">+ PostgreSQL</p>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {PRIMITIVES.map((m) => (
                    <span
                      key={m}
                      className="text-3xs font-mono text-muted-foreground bg-surface rounded px-1.5 py-0.5"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full flex items-center gap-2">
                <div className="flex-1 border-t border-dashed border-primary/20" />
                <span className="text-3xs font-mono text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded shrink-0">
                  control plane
                </span>
                <div className="flex-1 border-t border-dashed border-primary/20" />
              </div>
            </div>

            {/* Services right */}
            <div className="space-y-3">
              {SERVICES_RIGHT.map((name) => (
                <ServiceBox key={name} name={name} />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-surface-border grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-xs">
            {LEGEND.map((item) => (
              <div key={item.label}>
                <p className={cn("type-subsection-title font-mono", item.color)}>{item.value}</p>
                <p className="type-body-sm text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
