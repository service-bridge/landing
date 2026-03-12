import { motion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { highlightCode } from "../ui/CodeBlock";
import { Button } from "../ui/button";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";
import { TabStrip } from "../ui/Tabs";
import type { SdkLang } from "../lib/language-context";

// ─── Shared language tabs (steps 02 + 03 in sync) ─────────────────────────────

const SDK_TABS = [
  { id: "node" as const, label: "Node" },
  { id: "python" as const, label: "Python" },
  { id: "go" as const, label: "Go" },
];

type TabId = (typeof SDK_TABS)[number]["id"];

const INSTALL_CMDS: Record<TabId, string> = {
  node:   "npm install @service-bridge/node",
  python: "pip install service-bridge",
  go:     "go get github.com/service-bridge/go",
};

const CONNECT: Record<TabId, { filename: string; lang: SdkLang; code: string }> = {
  node: {
    filename: "my-service.ts",
    lang: "ts",
    code: `import { servicebridge } from "@service-bridge/node";

const sb = servicebridge(
  "127.0.0.1:14445",
  process.env.SERVICE_KEY ?? "dev-service-key",
  "my-service"
);

sb.handleRpc("hello", async (payload) => {
  return { message: "Hello from ServiceBridge!" };
});

sb.handleEvent("order.*", async (payload) => {
  console.log("Event received:", payload);
});

await sb.serve();`,
  },
  python: {
    filename: "app.py",
    lang: "py",
    code: `import asyncio
from service_bridge import ServiceBridge

sb = ServiceBridge(
    "127.0.0.1:14445",
    SERVICE_KEY,
    "my-service"
)

@sb.handle_rpc("hello")
async def hello(payload: dict) -> dict:
    return {"message": "Hello from ServiceBridge!"}

@sb.handle_event("order.*")
async def on_order(payload: dict, ctx) -> None:
    print("Event received:", payload)

asyncio.run(sb.serve())`,
  },
  go: {
    filename: "main.go",
    lang: "go",
    code: `package main

import (
  "context"
  "fmt"
  "log"

  sb "github.com/service-bridge/go"
)

func main() {
  client, err := sb.New("127.0.0.1:14445", serviceKey, "my-service")
  if err != nil {
    log.Fatal(err)
  }

  client.HandleRpc("hello", func(ctx context.Context, payload map[string]any) (any, error) {
    return map[string]any{"message": "Hello from ServiceBridge!"}, nil
  })

  client.HandleEvent("order.*", func(ctx context.Context, payload map[string]any, ectx sb.EventContext) error {
    fmt.Println("Event received:", payload)
    return nil
  })

  log.Fatal(client.Serve())
}`,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepNumber({ n, last }: { n: string; last?: boolean }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] flex items-center justify-center font-mono text-sm font-bold text-emerald-400">
        {n}
      </div>
      {!last && <div className="flex-1 w-px bg-white/[0.06] mt-3" />}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function GetStartedSection({ onDocs }: { onDocs?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>("node");
  const [copied, setCopied] = useState(false);
  const connect = CONNECT[activeTab];

  const copyCode = () => {
    navigator.clipboard.writeText(connect.code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section id="start">
      <SectionHeader
        eyebrow="Get Started"
        title={<>Start building in three steps</>}
        subtitle="Run the runtime, install the SDK, connect your services — done."
      />

      <motion.div variants={fadeInUp} className="mt-16 grid gap-8 max-w-3xl mx-auto">

        {/* Step 01 */}
        <div className="flex gap-6">
          <StepNumber n="01" />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Start the runtime</h3>
            <p className="type-body-sm mb-4">Spin up ServiceBridge + PostgreSQL with Docker Compose.</p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-4 py-2.5">
                <span className="type-overline-mono text-muted-foreground">terminal</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>$ docker compose up -d</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 02 — tabbed install */}
        <div className="flex gap-6">
          <StepNumber n="02" />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Install the SDK</h3>
            <p className="type-body-sm mb-4">Add the SDK to your service.</p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-3 py-2 flex items-center justify-between">
                <TabStrip size="sm" items={SDK_TABS} active={activeTab} onChange={setActiveTab} />
                <span className="type-caption text-muted-foreground/50">Install SDK</span>
              </div>
              <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>$ {INSTALL_CMDS[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 03 — tabbed connect code, synced with step 02 */}
        <div className="flex gap-6">
          <StepNumber n="03" last />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Connect your service</h3>
            <p className="type-body-sm mb-4">Register RPC handlers, subscribe to events, and call other services.</p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-3 py-2 flex items-center justify-between">
                <TabStrip size="sm" items={SDK_TABS} active={activeTab} onChange={setActiveTab} />
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                  ) : (
                    <><Copy className="w-3 h-3" /><span>Copy</span></>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{highlightCode(connect.code, connect.lang)}</code>
              </pre>
            </div>
          </div>
        </div>

      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          size="lg"
          className="h-14 min-w-[200px] text-base gap-2 cursor-pointer"
          onClick={onDocs}
        >
          Read the Docs <ArrowRight className="w-4 h-4" />
        </Button>
        <a href="https://github.com/esurkov1/connectr" target="_blank" rel="noreferrer">
          <Button
            variant="outline"
            size="lg"
            className="h-14 min-w-[200px] text-base cursor-pointer"
          >
            GitHub
          </Button>
        </a>
      </motion.div>
    </Section>
  );
}
