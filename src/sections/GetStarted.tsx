import { motion } from "framer-motion";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { type SdkLang, useSdkLang } from "../lib/language-context";
import { Button } from "../ui/button";
import { highlightCode } from "../ui/CodeBlock";
import { Section } from "../ui/Section";
import { SectionHeader } from "../ui/SectionHeader";

// ─── SDK snippets (steps 02 + 03) ─────────────────────────────────────────────

// Install and first service follow the language the reader picked anywhere on
// the site: handing a bun command to someone reading Go examples is the first
// thing that tells them this SDK is not for them.
const SDK_LABEL: Record<SdkLang, string> = {
  ts: "Node SDK",
  go: "Go SDK",
  py: "Python SDK",
};

const INSTALL_CMD: Record<SdkLang, string> = {
  ts: "bun add service-bridge",
  go: "go get github.com/service-bridge/sdk/go",
  py: "pip install service-bridge",
};

type Snippet = { filename: string; lang: SdkLang; code: string };

const CONNECT: Record<SdkLang, Snippet> = {
  ts: {
    filename: "my-service.ts",
    lang: "ts",
    code: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(
  "localhost:14445",
  serviceKey,
);

sb.rpc.handle(
  "hello",
  async (req: { name: string }) => ({ message: \`Hello, \${req.name}!\` }),
  { schema: { protoFile: "./hello.proto" } },
);

sb.event.define("order.placed");
sb.event.handle("order.*", async (payload) => {
  console.log("Event received:", payload);
});

await sb.start(); // provisions a worker mTLS cert from the service key`,
  },
  go: {
    filename: "main.go",
    lang: "go",
    code: `package main

import (
\t"context"
\t"log/slog"

\tsb "github.com/service-bridge/sdk/go"
\thellopb "example.com/gen/hellopb"
\torderpb "example.com/gen/orderpb"
)

func main() {
\tctx := context.Background()

\tc, err := sb.New("localhost:14445", serviceKey)
\tif err != nil {
\t\tpanic(err)
\t}

\tsb.Handle(c, "hello", func(ctx context.Context, req *hellopb.Request) (*hellopb.Reply, error) {
\t\treturn &hellopb.Reply{Message: "Hello, " + req.GetName() + "!"}, nil
\t})

\tsb.DefineEvent[*orderpb.Placed](c, "order.placed")
\tsb.SubscribeEvent(c, "order.*", func(ctx context.Context, e *orderpb.Placed) error {
\t\tslog.Info("event received", "order", e.GetId())
\t\treturn nil
\t})

\t// provisions a worker mTLS cert from the service key
\tif err := c.Start(ctx); err != nil {
\t\tpanic(err)
\t}
\tdefer c.Stop(context.Background())
}`,
  },
  py: {
    filename: "my_service.py",
    lang: "py",
    code: `# The Python SDK is not released yet.`,
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
  const [copiedRuntime, setCopiedRuntime] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const { lang } = useSdkLang();
  const installCmd = INSTALL_CMD[lang] ?? INSTALL_CMD.ts;
  const connect = CONNECT[lang] ?? CONNECT.ts;

  const copyRuntime = () => {
    navigator.clipboard.writeText("bash <(curl -fsSL https://servicebridge.dev/install.sh)");
    setCopiedRuntime(true);
    setTimeout(() => setCopiedRuntime(false), 2000);
  };

  const copySdk = () => {
    navigator.clipboard.writeText(installCmd);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(connect.code.trim());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
        <div className="flex gap-6 min-w-0">
          <StepNumber n="01" />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Install the runtime</h3>
            <p className="type-body-sm mb-4">
              One command runs ServiceBridge + PostgreSQL via Docker Compose and opens the dashboard
              console for your admin account.
            </p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-4 py-2.5 flex items-center justify-between">
                <span className="type-overline-mono text-muted-foreground">terminal</span>
                <button
                  type="button"
                  onClick={copyRuntime}
                  aria-label="Copy runtime install command"
                  className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
                >
                  {copiedRuntime ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                <code>$ bash &lt;(curl -fsSL https://servicebridge.dev/install.sh)</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 02 */}
        <div className="flex gap-6 min-w-0">
          <StepNumber n="02" />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Install the SDK</h3>
            <p className="type-body-sm mb-4">Add the SDK to your service.</p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-4 py-2.5 flex items-center justify-between">
                <span className="type-overline-mono text-muted-foreground">
                  {SDK_LABEL[lang] ?? SDK_LABEL.ts}
                </span>
                <button
                  type="button"
                  onClick={copySdk}
                  aria-label="Copy SDK install command"
                  className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
                >
                  {copiedSdk ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                <code>$ {installCmd}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 03 */}
        <div className="flex gap-6 min-w-0">
          <StepNumber n="03" last />
          <div className="pb-8 flex-1 min-w-0">
            <h3 className="type-subsection-title mb-1">Connect your service</h3>
            <p className="type-body-sm mb-4">
              Register handlers, subscribe to events, call other services. The{" "}
              <code>sb.&lt;...&gt;</code> bootstrap key embeds the key id, secret, and control-plane
              CA.
            </p>
            <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
              <div className="border-b border-surface-border bg-code-chrome px-4 py-2.5 flex items-center justify-between">
                <span className="type-overline-mono text-muted-foreground">{connect.filename}</span>
                <button
                  type="button"
                  onClick={copyCode}
                  aria-label="Copy connect example"
                  className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{highlightCode(connect.code, connect.lang)}</code>
              </pre>
            </div>
            <p className="type-caption mt-3 text-muted-foreground">
              On <code>start()</code>, the SDK generates an ECDSA P-256 key pair and sends only the
              public key to provision its mTLS cert.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="mt-16 text-center">
        <p className="type-body-sm text-muted-foreground">
          No sidecars, no extra infra — just Go + Postgres.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-14 min-w-[200px] text-base gap-2 cursor-pointer"
            onClick={copyRuntime}
          >
            {copiedRuntime ? (
              <>
                <Check className="w-4 h-4" /> Command copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Install ServiceBridge
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 min-w-[200px] text-base gap-2 cursor-pointer"
            onClick={onDocs}
          >
            Read the Docs <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <a
          href="https://github.com/service-bridge/sdk"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block type-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          Star on GitHub
        </a>
      </motion.div>
    </Section>
  );
}
