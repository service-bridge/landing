import { motion } from "framer-motion";
import { CheckCircle2, Copy, Globe, Route, Zap } from "lucide-react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { highlightCode } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

const FRAMEWORK_TABS = [
  {
    id: "express",
    label: "Express",
    lang: "ts" as const,
    filename: "app.ts",
    code: `import express from "express";
import { ServiceBridge } from "service-bridge";
import { attachExpress } from "service-bridge/express";

const sb = new ServiceBridge("localhost:14445", serviceKey);
const app = express();
app.use(express.json());

app.post("/api/orders", async (req, res) => {
  const order = await sb.rpc.call("orders", "orders.create", req.body);
  res.json(order);
});

// Collects routes into the Service Map, installs X-SB-Trace propagation
attachExpress(app, sb, { port: 8080 });

await sb.start();
app.listen(8080);`,
  },
  {
    id: "fastify",
    label: "Fastify",
    lang: "ts" as const,
    filename: "server.ts",
    code: `import Fastify from "fastify";
import { ServiceBridge } from "service-bridge";
import { sbFastify } from "service-bridge/fastify";

const sb = new ServiceBridge("localhost:14445", serviceKey);
const app = Fastify();

await app.register(sbFastify, { sb });

app.post("/checkout", async (req) => {
  return sb.rpc.call("checkout", "checkout.process", req.body);
});

await sb.start();
await app.listen({ port: 8080 });`,
  },
  {
    id: "hono",
    label: "Hono",
    lang: "ts" as const,
    filename: "server.ts",
    code: `import { Hono } from "hono";
import { ServiceBridge } from "service-bridge";
import { attachHono } from "service-bridge/hono";

const sb = new ServiceBridge("localhost:14445", serviceKey);
const app = new Hono();

app.post("/api/orders", async (c) => {
  const order = await sb.rpc.call("orders", "orders.create", await c.req.json());
  return c.json(order);
});

// Hono is server-agnostic — pass the port you serve on
attachHono(app, sb, { port: 8080 });

await sb.start();
Bun.serve({ port: 8080, fetch: app.fetch });`,
  },
] as const;

type FrameworkId = (typeof FRAMEWORK_TABS)[number]["id"];

const TRACE_HEADERS = [
  {
    label: "X-SB-Trace",
    desc: "Incoming header → request joins the existing trace",
    tone: "text-violet-400 border-violet-500/25 bg-violet-500/10",
    priority: "join",
  },
  {
    label: "missing",
    desc: "No header → a new root trace is minted",
    tone: "text-blue-400 border-blue-500/25 bg-blue-500/10",
    priority: "root",
  },
  {
    label: "malformed",
    desc: "Unparseable header → falls back to a root trace, never throws",
    tone: "text-muted-foreground border-zinc-500/25 bg-zinc-500/10",
    priority: "safe",
  },
];

const REQUEST_PATH = [
  {
    label: "client",
    sub: "POST /api/orders",
    color: "bg-zinc-500",
    tone: "text-muted-foreground bg-surface border-surface-border",
  },
  {
    label: "integration",
    sub: "HTTP.HANDLE op · X-SB-Trace parsed",
    color: "bg-violet-400",
    tone: "text-violet-300 bg-violet-500/[0.06] border-violet-500/20",
  },
  {
    label: "handler",
    sub: "sb.rpc.call('orders', 'orders.create', …)",
    color: "bg-blue-400",
    tone: "text-blue-300 bg-blue-500/[0.06] border-blue-500/20",
  },
  {
    label: "orders service",
    sub: "child span · direct gRPC",
    color: "bg-emerald-400",
    tone: "text-emerald-300 bg-emerald-500/[0.06] border-emerald-500/20",
  },
];

export function HttpSection() {
  const [activeTab, setActiveTab] = useState<FrameworkId>("express");
  const [copied, setCopied] = useState(false);
  const tab = FRAMEWORK_TABS.find((t) => t.id === activeTab) ?? FRAMEWORK_TABS[0];

  const maxFwLines = Math.max(...FRAMEWORK_TABS.map((t) => t.code.trim().split("\n").length));
  const minFwCodeHeight = maxFwLines * 20 + 40;

  const copyCode = () => {
    navigator.clipboard.writeText(tab.code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FeatureSection
      id="http"
      stickyColumn="content"
      eyebrow="HTTP Integrations"
      title={<>Your HTTP server, traced. Automatically.</>}
      subtitle="Attach one integration to your Express, Fastify, or Hono app. Every request gets a span, X-SB-Trace propagation, and Service Map routes — zero handler changes."
      content={
        <motion.div variants={fadeInUp}>
          <CodePanel>
            <div className="flex items-center justify-between gap-3 border-b border-surface-border bg-white/[0.02] px-3 py-2">
              <TabStrip
                size="sm"
                items={FRAMEWORK_TABS}
                active={activeTab}
                onChange={setActiveTab}
              />
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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
            <pre
              className="max-w-full overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted-foreground"
              style={{ minHeight: minFwCodeHeight }}
            >
              <code>{highlightCode(tab.code.trim(), tab.lang)}</code>
            </pre>
          </CodePanel>
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <Card>
            <p className="type-overline-mono text-muted-foreground">trace propagation</p>
            <p className="mt-2 type-subsection-title">One integration, full request chain.</p>
            <p className="mt-3 text-xs font-mono font-semibold text-emerald-300">
              The runtime never proxies your business HTTP — no sidecar, no Envoy.
            </p>
            <p className="mt-2 type-body-sm">
              Each inbound request emits an HTTP.HANDLE op. Downstream{" "}
              <code className="text-foreground/80 bg-surface px-1 rounded">
                sb.rpc.call()
              </code>{" "}
              and <code className="text-foreground/80 bg-surface px-1 rounded">sb.event.publish()</code>{" "}
              inherit the trace automatically.
            </p>

            <div className="mt-5 space-y-1.5">
              <p className="type-overline-mono text-muted-foreground mb-3">X-SB-Trace handling</p>
              {TRACE_HEADERS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2"
                >
                  <Badge tone={item.tone}>{item.priority}</Badge>
                  <code
                    className={cn(
                      "text-xs font-mono font-semibold shrink-0",
                      item.tone.split(" ")[0]
                    )}
                  >
                    {item.label}
                  </code>
                  <span className="text-2xs text-muted-foreground min-w-0">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-1.5">
              <p className="type-overline-mono text-muted-foreground mb-3">request path</p>
              {REQUEST_PATH.map((step, i) => (
                <div key={step.label} className="flex items-start gap-2">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-2.5 shrink-0", step.color)} />
                    {i < REQUEST_PATH.length - 1 && (
                      <div className="w-px flex-1 min-h-[12px] bg-surface-border mt-0.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex-1 flex items-start gap-3 rounded-xl border px-3 py-2 min-w-0",
                      step.tone
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold font-display shrink-0",
                        step.tone.split(" ")[0]
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-2xs text-muted-foreground font-mono min-w-0 break-words">
                      {step.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2.5">
              <div className="rounded-xl bg-violet-500/10 p-1.5 shrink-0">
                <Route className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <p className="type-body-sm">
                Routes appear in the <span className="text-zinc-200">Service Map</span> and{" "}
                Service Discovery automatically — method, path, and HTTP endpoint.
              </p>
            </div>
          </Card>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={CheckCircle2}
            title="Unified traces"
            description="HTTP ops join the same trace as RPC, event, and workflow ops. Full cross-service waterfall in the dashboard."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Globe}
            title="Express, Fastify, Hono"
            description="One integration API across the three Node frameworks. Same behavior, same trace format."
            iconClassName="text-violet-400"
          />
          <FeatureCard
            variant="compact"
            icon={Zap}
            title="Zero handler changes"
            description="Attach the integration once — no sidecar, no Envoy. Every route gets tracing, X-SB-Trace propagation, and Service Map registration automatically."
            iconClassName="text-blue-400"
          />
        </>
      }
    />
  );
}
