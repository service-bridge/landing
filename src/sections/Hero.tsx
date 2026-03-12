import { motion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/Badge";
import { CodePanel } from "../ui/CodePanel";
import { Section } from "../ui/Section";

export function HeroSection({ onDocs }: { onDocs?: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCmd = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const CMDS = [
    { cmd: "docker compose up -d", label: "Start server + Postgres" },
    { cmd: "npm install @servicebridge/sdk", label: "Install SDK" },
  ];

  return (
    <Section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-44 border-t-0">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[128px]" />
      <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-blue-500/[0.05] blur-[96px]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <a
            href="https://github.com/esurkov1/connectr"
            target="_blank"
            rel="noreferrer"
            className="mx-auto inline-block"
          >
            <Badge
              tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 hover:bg-emerald-500/[0.12]"
              className="cursor-pointer gap-2 px-4 py-1.5 text-sm font-medium transition-colors"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Open Source — v0.1.0
            </Badge>
          </a>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="type-display-xl mx-auto max-w-4xl font-display sm:text-6xl lg:text-7xl"
        >
          Microservice infrastructure.{" "}
          <span className="text-gradient">Without the proxy layer.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="type-body-lg mx-auto mt-6 max-w-2xl leading-relaxed text-muted-foreground sm:text-xl"
        >
          Direct service-to-service RPC, durable events, workflows, and jobs.{" "}
          <span className="text-foreground/80">
            Service discovery, mTLS, tracing, and alerts — all in one Go binary.
          </span>{" "}
          Zero sidecar overhead.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          {CMDS.map(({ cmd, label }, idx) => (
            <button
              key={cmd}
              type="button"
              onClick={() => copyCmd(cmd, idx)}
              className="group flex w-full max-w-md cursor-pointer items-center gap-3 rounded-lg border border-surface-border bg-surface px-5 py-3 font-mono text-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.06]"
            >
              <span className="shrink-0 text-muted-foreground">$</span>
              <span className="flex-1 text-left text-foreground">{cmd}</span>
              <span className="type-caption hidden shrink-0 font-sans text-muted-foreground/50 sm:block">
                {label}
              </span>
              {copiedIdx === idx ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
            </button>
          ))}
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
      </div>
    </Section>
  );
}
