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
import { servicebridgeMiddleware } from "@service-bridge/http";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);
const app = express();

// Auto-traces every request, registers routes in HTTP catalog
app.use(servicebridgeMiddleware(sb, {
  excludePaths: ["/health"],
  propagateTraceHeader: true,
  autoRegister: true,
}));

app.post("/api/orders", async (req, res) => {
  const order = await sb.rpc("orders", "orders.create", req.body);
  res.json(order);
});`,
  },
  {
    id: "fastify",
    label: "Fastify",
    lang: "ts" as const,
    filename: "server.ts",
    code: `import Fastify from "fastify";
import { ServiceBridge } from "service-bridge";
import { servicebridgePlugin } from "@service-bridge/http";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);
const app = Fastify();

await app.register(servicebridgePlugin, { client: sb });

app.post("/checkout", {
  handler: async (req, reply) => {
    const result = await sb.rpc("checkout", "checkout.process", req.body);
    return result;
  },
});`,
  },
  {
    id: "gin",
    label: "Gin (Go)",
    lang: "go" as const,
    filename: "main.go",
    code: `package main

import (
  "github.com/gin-gonic/gin"
  sb "github.com/service-bridge/go"
  sbhttp "github.com/service-bridge/go/http"
)

func main() {
  client := sb.New("localhost:14445", serviceKey, "gateway")
  r := gin.Default()

  r.Use(sbhttp.GinMiddleware(client))

  r.POST("/orders", func(c *gin.Context) {
    var body map[string]any
    _ = c.ShouldBindJSON(&body)
    result, _ := client.Rpc(c.Request.Context(), "orders", "orders.create", body, nil)
    c.JSON(200, result)
  })

  r.Run(":8080")
}`,
  },
  {
    id: "fastapi",
    label: "FastAPI",
    lang: "py" as const,
    filename: "app.py",
    code: `from fastapi import FastAPI
from service_bridge import ServiceBridge
from servicebridge_http import ServiceBridgeMiddleware

sb = ServiceBridge("localhost:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])
app = FastAPI()

app.add_middleware(ServiceBridgeMiddleware, client=sb)

@app.post("/orders")
async def create_order(body: dict):
    result = await sb.rpc("orders", "orders.create", body)
    return result`,
  },
] as const;

type FrameworkId = (typeof FRAMEWORK_TABS)[number]["id"];

const TRACE_HEADERS = [
  {
    label: "traceparent",
    desc: "W3C standard → uses traceId + parentSpanId",
    tone: "text-indigo-400 border-indigo-500/25 bg-indigo-500/10",
    priority: "1st",
  },
  {
    label: "x-trace-id",
    desc: "ServiceBridge native → continues existing trace",
    tone: "text-blue-400 border-blue-500/25 bg-blue-500/10",
    priority: "2nd",
  },
  {
    label: "none",
    desc: "New trace ID generated automatically",
    tone: "text-muted-foreground border-zinc-500/25 bg-zinc-500/10",
    priority: "3rd",
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
    label: "middleware",
    sub: "span starts · x-trace-id injected",
    color: "bg-indigo-400",
    tone: "text-indigo-300 bg-indigo-500/[0.06] border-indigo-500/20",
  },
  {
    label: "handler",
    sub: "sb.rpc('orders', 'orders.create', …)",
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
      eyebrow="HTTP Middleware"
      title={<>HTTP requests, traced. Automatically.</>}
      subtitle="Add one middleware and every HTTP request gets a span, a trace ID in the response, and its route registered in the HTTP catalog — with no code changes to handlers."
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
              className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted-foreground"
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
            <p className="mt-2 type-subsection-title">One middleware, full request chain.</p>
            <p className="mt-2 type-body-sm">
              Every inbound request starts a span. Downstream{" "}
              <code className="text-foreground/80 bg-surface px-1 rounded">rpc()</code> calls
              inherit the trace context automatically.
            </p>

            <div className="mt-5 space-y-1.5">
              <p className="type-overline-mono text-muted-foreground mb-3">trace header priority</p>
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
                      "flex-1 flex items-center gap-3 rounded-xl border px-3 py-2",
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
                    <span className="text-2xs text-muted-foreground font-mono">{step.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2.5">
              <div className="rounded-xl bg-indigo-500/10 p-1.5 shrink-0">
                <Route className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="type-body-sm">
                Routes appear in the <span className="text-zinc-200">HTTP catalog</span>{" "}
                automatically — method, path, allowed callers, request schema.
              </p>
            </div>
          </Card>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={Globe}
            title="Express, Fastify, Gin, FastAPI"
            description="One middleware API across Node.js, Go, and Python frameworks. Same behavior, same trace format."
            iconClassName="text-indigo-400"
          />
          <FeatureCard
            variant="compact"
            icon={Zap}
            title="Zero handler changes"
            description="Add middleware once. Every route gets tracing, trace ID propagation, and catalog registration automatically."
            iconClassName="text-blue-400"
          />
          <FeatureCard
            variant="compact"
            icon={CheckCircle2}
            title="OTLP compatible"
            description="HTTP spans use the same span format as RPC and event spans. Full cross-service waterfall in the dashboard."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
