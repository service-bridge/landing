import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, Zap, Container, ShieldCheck, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Section } from "../ui/Section";
import { TabStrip } from "../ui/Tabs";

const HERO_STATS = [
  { icon: Zap, title: "0 ms proxy overhead", desc: "direct service-to-service" },
  { icon: Container, title: "No sidecar containers", desc: "one binary per cluster" },
  { icon: ShieldCheck, title: "Auto mTLS + tracing", desc: "100% calls instrumented" },
  { icon: Activity, title: "Built-in event bus", desc: "durable delivery & DLQ" },
] as const;

const INSTALL_TABS = [
  { id: "node" as const, label: "Node" },
  { id: "python" as const, label: "Python" },
  { id: "go" as const, label: "Go" },
];

const INSTALL_CMDS: Record<(typeof INSTALL_TABS)[number]["id"], string> = {
  node: "npm i service-bridge",
  python: "pip install service-bridge",
  go: "go get github.com/service-bridge/go",
};

export function HeroSection({ onDocs }: { onDocs?: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [installTab, setInstallTab] = useState<(typeof INSTALL_TABS)[number]["id"]>("node");

  const copyCmd = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-44 border-t-0">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-slate-500/[0.025] blur-[140px]" />
      <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-slate-400/[0.02] blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="type-caption text-emerald-400 font-medium tracking-wide uppercase text-xs">
            10 tools → 1 binary
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="type-display-xl mx-auto max-w-5xl font-display sm:text-6xl lg:text-7xl"
        >
          The Unified Bridge for Microservices Interaction
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="type-body-lg mx-auto mt-8 max-w-2xl leading-relaxed text-muted-foreground sm:text-xl"
        >
          One SDK, <span className="text-foreground font-medium">one Go binary</span>, one PostgreSQL.
          No sidecars, no proxy hop, no extra infrastructure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground/70"
        >
          {["RPC", "Events", "Jobs", "Workflows", "mTLS", "Tracing", "Discovery", "Alerts", "Dashboard"].map(
            (cap, i) => (
              <span key={cap} className="flex items-center gap-1.5">
                {i > 0 && <span className="hidden sm:inline text-surface-border">·</span>}
                <span>{cap}</span>
              </span>
            )
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <button
            type="button"
            onClick={() => copyCmd("bash <(curl -fsSL https://servicebridge.dev/install.sh)", 0)}
            className="group flex w-full max-w-3xl cursor-pointer items-center gap-3 rounded-lg border border-surface-border bg-surface px-5 py-3 font-mono text-sm transition-all hover:border-white/[0.12] hover:bg-surface"
          >
            <span className="shrink-0 text-muted-foreground">$</span>
            <span className="flex-1 text-left text-foreground">bash &lt;(curl -fsSL https://servicebridge.dev/install.sh)</span>
            <span className="type-caption hidden shrink-0 font-sans text-muted-foreground/50 sm:block">
              Runtime + Postgres
            </span>
            {copiedIdx === 0 ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            )}
          </button>

          <div className="flex w-full max-w-3xl flex-col gap-2 rounded-lg border border-surface-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
              <TabStrip
                items={INSTALL_TABS}
                active={installTab}
                onChange={setInstallTab}
                size="sm"
              />
              <span className="type-caption text-muted-foreground/50">Install SDK</span>
            </div>
            <button
              type="button"
              onClick={() => copyCmd(INSTALL_CMDS[installTab], 1)}
              className="group flex w-full cursor-pointer items-center gap-3 px-5 py-3 font-mono text-sm transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-muted-foreground">$</span>
              <span className="flex-1 text-left text-foreground">{INSTALL_CMDS[installTab]}</span>
              {copiedIdx === 1 ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 min-w-[180px] cursor-pointer gap-2 text-base"
            onClick={onDocs}
          >
            Read the Docs <ArrowRight className="h-4 w-4" />
          </Button>
          <a href="#code">
            <Button
              variant="outline"
              size="lg"
              className="h-12 min-w-[180px] cursor-pointer text-base"
            >
              View Examples
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {HERO_STATS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-surface/60 px-4 py-5 backdrop-blur-sm"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{title}</span>
              <span className="text-xs text-muted-foreground/70">{desc}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
