import { motion } from "framer-motion";
import { CheckCircle2, Globe, Route, Zap } from "lucide-react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { CodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";
import { TabStrip } from "../ui/Tabs";
import { FlowTile } from "./feature-shared";

const FRAMEWORK_TABS = [
  {
    id: "express",
    label: "Express",
    lang: "TypeScript",
    filename: "app.ts",
    code: `import express from "express";
import { servicebridge } from "@servicebridge/sdk";
import { servicebridgeMiddleware } from "@servicebridge/http-node";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "gateway");
const app = express();

// Auto-traces every request, registers routes in HTTP catalog
app.use(servicebridgeMiddleware(sb, {
  excludePaths: ["/health"],
  propagateTraceHeader: true,   // injects x-trace-id into responses
  autoRegister: true,            // discovers routes automatically
}));

app.post("/api/orders", async (req, res) => {
  // Trace context flows into every downstream rpc() call
  const order = await sb.rpc("orders.create", req.body);
  res.json(order);
});`,
  },
  {
    id: "fastify",
    label: "Fastify",
    lang: "TypeScript",
    filename: "server.ts",
    code: `import Fastify from "fastify";
import { servicebridge } from "@servicebridge/sdk";
import { servicebridgePlugin } from "@servicebridge/http-node";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "api");
const app = Fastify();

// Register as Fastify plugin
await app.register(servicebridgePlugin, { client: sb });

app.post("/checkout", {
  handler: async (req, reply) => {
    // wrapHandler() chains trace context into downstream RPCs
    const result = await sb.rpc("checkout.process", req.body);
    return result;
  },
});`,
  },
  {
    id: "gin",
    label: "Gin (Go)",
    lang: "Go",
    filename: "main.go",
    code: `package main

import (
  "github.com/gin-gonic/gin"
  sb "github.com/servicebridge/go-sdk"
  sbhttp "github.com/servicebridge/http-go"
)

func main() {
  client, _ := sb.New("127.0.0.1:14445", serviceKey, "gateway")
  r := gin.Default()

  // Auto-traces every request, propagates context downstream
  r.Use(sbhttp.GinMiddleware(client))

  r.POST("/orders", func(c *gin.Context) {
    // Outbound Rpc() inherits trace from context.Context
    result, _ := client.Rpc(c.Request.Context(), "orders.create", body)
    c.JSON(200, result)
  })

  r.Run(":8080")
}`,
  },
  {
    id: "fastapi",
    label: "FastAPI",
    lang: "Python",
    filename: "app.py",
    code: `from fastapi import FastAPI
from servicebridge import ServiceBridge
from servicebridge_http import ServiceBridgeMiddleware

sb = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "api")
app = FastAPI()

# Attach as ASGI middleware — auto-traces every request
app.add_middleware(ServiceBridgeMiddleware, client=sb)

@app.post("/orders")
async def create_order(body: dict):
    # Trace context propagated automatically into rpc()
    result = await sb.rpc("orders.create", body)
    return result`,
  },
] as const;

type FrameworkId = (typeof FRAMEWORK_TABS)[number]["id"];

export function HttpSection() {
  const [activeTab, setActiveTab] = useState<FrameworkId>("express");
  const tab = FRAMEWORK_TABS.find((t) => t.id === activeTab) ?? FRAMEWORK_TABS[0];

  return (
    <FeatureSection
      id="http"
      eyebrow="HTTP Middleware"
      title={
        <>
          HTTP requests, traced.{" "}
          <span className="text-gradient">Automatically.</span>
        </>
      }
      subtitle="Add one middleware and every HTTP request gets a span, a trace ID in the response, and its route registered in the HTTP catalog — with no code changes to handlers."
      content={
        <motion.div variants={fadeInUp}>
          <CodePanel title="Framework Examples">
            <div className="border-b border-surface-border bg-code-chrome px-4 py-3">
              <TabStrip
                size="md"
                items={FRAMEWORK_TABS}
                active={activeTab}
                onChange={setActiveTab}
              />
            </div>
            <div className="p-5">
              <CodeBlock code={tab.code} filename={tab.filename} />
            </div>
          </CodePanel>
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">trace propagation</p>
            <p className="mt-2 type-subsection-title">
              One middleware, full request chain.
            </p>
            <p className="mt-2 type-body-sm">
              Every inbound request starts a span. Downstream{" "}
              <code className="text-foreground/80 bg-surface px-1 rounded">rpc()</code>{" "}
              calls inherit the trace context automatically.
            </p>

            <CodePanel className="mt-5">
              <div className="p-4 space-y-2">
                <p className="type-overline-mono text-muted-foreground mb-3">trace header priority</p>
                {[
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
                    tone: "text-zinc-400 border-zinc-500/25 bg-zinc-500/10",
                    priority: "3rd",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2"
                  >
                    <Badge tone={item.tone}>{item.priority}</Badge>
                    <code className={cn("text-xs font-mono font-semibold shrink-0", item.tone.split(" ")[0])}>
                      {item.label}
                    </code>
                    <span className="text-2xs text-muted-foreground min-w-0">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CodePanel>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <FlowTile
                label="request in"
                value="span created"
                tone="text-indigo-300"
              />
              <FlowTile
                label="downstream"
                value="trace inherited"
                tone="text-blue-300"
              />
              <FlowTile
                label="response"
                value="x-trace-id header"
                tone="text-emerald-300"
              />
            </div>
          </Card>

          <Card>
            <p className="type-overline-mono text-muted-foreground mb-4">request path</p>
            <div className="space-y-1.5">
              {[
                { label: "client", sub: "POST /api/orders", tone: "text-zinc-300", bg: "bg-surface", border: "border-surface-border" },
                { label: "middleware", sub: "span starts · x-trace-id injected", tone: "text-indigo-300", bg: "bg-indigo-500/[0.06]", border: "border-indigo-500/20" },
                { label: "handler", sub: "sb.rpc('orders.create', …)", tone: "text-blue-300", bg: "bg-blue-500/[0.06]", border: "border-blue-500/20" },
                { label: "orders service", sub: "child span · direct gRPC", tone: "text-emerald-300", bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/20" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-start gap-2">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-2.5 shrink-0", i === 0 ? "bg-zinc-500" : i === 1 ? "bg-indigo-400" : i === 2 ? "bg-blue-400" : "bg-emerald-400")} />
                    {i < 3 && <div className="w-px flex-1 min-h-[12px] bg-surface-border mt-0.5" />}
                  </div>
                  <div className={cn("flex-1 flex items-center gap-3 rounded-xl border px-3 py-2", step.bg, step.border)}>
                    <span className={cn("text-xs font-semibold font-display shrink-0", step.tone)}>{step.label}</span>
                    <span className="text-2xs text-muted-foreground font-mono">{step.sub}</span>
                    {i === 1 && <CheckCircle2 className="w-3 h-3 text-indigo-400 ml-auto shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2 shrink-0">
              <Route className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold font-display">HTTP catalog in dashboard</p>
              <p className="type-body-sm mt-0.5">
                Routes appear in the HTTP catalog automatically — method, path, allowed callers,
                and request schema.
              </p>
            </div>
          </Card>
        </motion.div>
      }
      cards={
        <>
          <MiniCard
            icon={Globe}
            title="Express, Fastify, Gin, Echo, Chi, FastAPI, Flask"
            desc="One middleware API across Node.js, Go, and Python frameworks. Same behavior, same trace format."
            iconClassName="text-indigo-400"
          />
          <MiniCard
            icon={Zap}
            title="Zero handler changes"
            desc="Add middleware once. Every route gets tracing, trace ID propagation, and catalog registration — without touching handler code."
            iconClassName="text-blue-400"
          />
          <MiniCard
            icon={CheckCircle2}
            title="OTLP compatible"
            desc="HTTP spans use the same span format as RPC and event spans. Full cross-service waterfall in the dashboard."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
