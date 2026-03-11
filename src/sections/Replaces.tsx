import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Globe,
  KeySquare,
  Lock,
  Radio,
  Workflow,
  XCircle,
} from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";

const REPLACES = [
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
  { label: "Service Discovery", example: "Consul, etcd", icon: Globe, color: "text-emerald-400" },
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
];

export function ReplacesSection() {
  return (
    <AnimatedSection className="container mx-auto px-4 py-24" id="replaces">
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 mb-6">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Simplify your stack
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
          Nine tools in.{" "}
          <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            One platform out.
          </span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Every inter-service primitive you need — messaging, RPC, scheduling, workflows, tracing,
          auth, service discovery, and smart alerting — unified under one binary.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-14">
        {[
          { value: "9→1", label: "infrastructure pieces" },
          { value: "0ms", label: "proxy overhead" },
          { value: "100%", label: "calls traced" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4"
          >
            <p className="text-xl font-bold text-foreground font-display tabular-nums">
              {stat.value}
            </p>
            <p className="text-2xs text-muted-foreground mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Before / After comparison */}
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_56px_1fr] gap-4 lg:gap-0 items-center">
        {/* Before */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <XCircle className="w-3.5 h-3.5 text-red-400/60" />
            <span className="text-xs font-semibold text-red-400/60 uppercase tracking-widest">
              Before
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REPLACES.map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                className="flex items-start gap-3 rounded-xl border border-red-500/[0.10] bg-red-500/[0.025] px-3.5 py-3"
              >
                <div className="mt-0.5 rounded-lg bg-red-500/[0.06] p-1.5 flex-shrink-0">
                  <item.icon className={cn("w-4 h-4 opacity-40", item.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground/50 leading-tight">
                    {item.label}
                  </p>
                  <p className="text-2xs text-muted-foreground/40 mt-0.5 line-through decoration-red-400/40 leading-tight truncate">
                    {item.example}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center arrow — desktop */}
        <motion.div
          variants={fadeInUp}
          className="hidden lg:flex flex-col items-center justify-center gap-2"
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-border to-primary/30" />
          <div className="rounded-full border border-primary/25 bg-primary/[0.08] p-2.5 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <ArrowRight className="w-4 h-4 text-primary" />
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-primary/30 via-border to-transparent" />
        </motion.div>

        {/* Center arrow — mobile */}
        <div className="lg:hidden flex items-center gap-3 justify-center">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="rounded-full border border-primary/25 bg-primary/[0.08] p-2">
            <ArrowRight className="w-4 h-4 text-primary rotate-90" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* After: ServiceBridge */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              With ServiceBridge
            </span>
          </div>
          <motion.div
            variants={fadeInUp}
            className="relative rounded-xl border border-primary/25 bg-primary/[0.03] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-emerald-500/[0.04] pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/[0.12] rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-3 px-5 py-4 border-b border-primary/[0.12]">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <BrandMark className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">ServiceBridge</p>
                <p className="text-2xs text-muted-foreground">One binary · all primitives</p>
              </div>
              <div className="ml-auto rounded-full border border-primary/20 bg-primary/[0.08] px-2.5 py-1">
                <span className="text-2xs font-semibold text-primary">All included</span>
              </div>
            </div>

            <div className="relative grid grid-cols-1 gap-0 divide-y divide-white/[0.04]">
              {REPLACES.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <item.icon className={cn("w-3.5 h-3.5 flex-shrink-0", item.color)} />
                  <span className="text-sm font-medium text-foreground/80">{item.label}</span>
                  <span className="ml-auto text-2xs text-muted-foreground/50 hidden sm:block">
                    replaces {item.example.split(",")[0]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
