import { motion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

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
    <div className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[96px]" />

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.a
          href="https://github.com/esurkov1/connectr"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 type-label text-emerald-400 hover:bg-emerald-500/[0.12] transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Open Source — v0.1.0
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl type-display-xl sm:text-6xl lg:text-7xl font-display"
        >
          The Unified Interaction Layer for <span className="text-gradient">Microservices</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl type-body-lg sm:text-xl text-muted-foreground leading-relaxed"
        >
          One SDK for RPC, Events, Jobs & Workflows.{" "}
          <span className="text-foreground/80">Direct service-to-service calls</span> with zero
          proxy overhead.
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
              className="group flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-5 py-3 font-mono text-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer w-full max-w-md"
            >
              <span className="text-muted-foreground shrink-0">$</span>
              <span className="text-foreground flex-1 text-left">{cmd}</span>
              <span className="text-muted-foreground/50 type-caption font-sans hidden sm:block shrink-0">
                {label}
              </span>
              {copiedIdx === idx ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              )}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="h-12 min-w-[180px] text-base gap-2 cursor-pointer"
            onClick={onDocs}
          >
            Read the Docs <ArrowRight className="w-4 h-4" />
          </Button>
          <a href="#code">
            <Button
              variant="outline"
              size="lg"
              className="h-12 min-w-[180px] text-base cursor-pointer"
            >
              View Examples
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
