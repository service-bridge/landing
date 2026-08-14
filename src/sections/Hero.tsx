import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  Container,
  Copy,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { type SdkLang, useSdkLang } from "../lib/language-context";
import { Button } from "../ui/button";
import { Section } from "../ui/Section";

const HERO_STATS = [
  { icon: Container, title: "One Go binary", desc: "+ PostgreSQL 18, no sidecars" },
  { icon: Zap, title: "Direct mTLS RPC", desc: "caller-to-callee, no proxy hop" },
  { icon: Activity, title: "Durable events", desc: "at-least-once, retries & DLQ" },
] as const;

// The install line follows the language the reader picked anywhere on the
// site: showing a bun command to someone reading Go examples is the first
// thing that tells them this SDK is not for them.
const SDK_LABEL: Record<SdkLang, string> = {
  ts: "Node SDK",
  go: "Go SDK",
  py: "Python SDK",
};

const SDK_INSTALL_CMD: Record<SdkLang, string> = {
  ts: "bun add service-bridge",
  go: "go get github.com/service-bridge/sdk/go",
  py: "pip install service-bridge",
};

export function HeroSection({ onDocs }: { onDocs?: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { lang } = useSdkLang();
  const installCmd = SDK_INSTALL_CMD[lang] ?? SDK_INSTALL_CMD.ts;

  const copyCmd = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-44 border-t-0">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[140px]" />
      <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-slate-400/[0.05] blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="type-caption text-emerald-400 font-medium tracking-wide uppercase">
            Self-hosted · No sidecars · Postgres-backed
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="type-display-xl mx-auto max-w-4xl font-display text-4xl sm:text-6xl lg:text-7xl"
        >
          One Go binary replaces your microservices stack — no mesh, no sidecars
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="type-body-lg mx-auto mt-8 max-w-2xl leading-relaxed text-muted-foreground sm:text-xl"
        >
          Direct mTLS RPC, durable events, DAG workflows, cron jobs and unified tracing. One Go
          binary plus PostgreSQL replaces Istio, RabbitMQ, Temporal and Jaeger.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <button
            type="button"
            aria-label="Copy runtime install command"
            onClick={() => copyCmd("bash <(curl -fsSL https://servicebridge.dev/install.sh)", 0)}
            className="group flex w-full max-w-3xl cursor-pointer items-center gap-3 rounded-lg border border-surface-border bg-surface px-5 py-3 font-mono text-sm transition-all hover:border-white/[0.12] hover:bg-surface"
          >
            <span className="shrink-0 text-muted-foreground">$</span>
            <span className="min-w-0 flex-1 truncate text-left text-foreground">
              bash &lt;(curl -fsSL https://servicebridge.dev/install.sh)
            </span>
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
              <span className="type-caption font-mono text-muted-foreground">
                {SDK_LABEL[lang] ?? SDK_LABEL.ts}
              </span>
              <span className="type-caption text-muted-foreground/50">Install SDK</span>
            </div>
            <button
              type="button"
              aria-label="Copy SDK install command"
              onClick={() => copyCmd(installCmd, 1)}
              className="group flex w-full cursor-pointer items-center gap-3 px-5 py-3 font-mono text-sm transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-muted-foreground">$</span>
              <span className="min-w-0 flex-1 truncate text-left text-foreground">{installCmd}</span>
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
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="h-12 min-w-[180px] cursor-pointer gap-2 text-base"
            onClick={onDocs}
          >
            Get Started <ArrowRight className="h-4 w-4" />
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.27 }}
          className="mt-6 flex justify-center"
        >
          <a
            href="#ai-skill"
            className="group inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span>
              Your AI agent already knows this SDK —{" "}
              <span className="text-foreground/80 group-hover:text-foreground">
                install the skill
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-2xs text-muted-foreground/70"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            MIT licensed
          </span>
          <span className="hidden text-surface-border sm:inline">·</span>
          <span>Up to 1000 services on one instance</span>
          <span className="hidden text-surface-border sm:inline">·</span>
          <a href="#docs" className="transition-colors hover:text-foreground">
            Documentation
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {HERO_STATS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-surface/60 px-4 py-5 backdrop-blur-sm"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{title}</span>
              <span className="type-caption text-muted-foreground/70">{desc}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
