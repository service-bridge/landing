import { motion, useInView } from "framer-motion";
import { CheckCircle2, Network, Shield, Zap } from "lucide-react";
import { useRef } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";

const RPC_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders");

// Register — advertises endpoint to the registry
sb.handleRpc("orders.create", async (payload) => {
  // SDK opens a direct gRPC channel to payments worker
  const charge = await sb.rpc("payments.charge", {
    orderId: payload.id,
    amount: payload.total,
  });
  return { ok: charge.ok, txId: charge.txId };
});

await sb.serve();`,

  go: `package main

import (
    "context"
    "encoding/json"
    servicebridge "github.com/service-bridge/go"
)

func main() {
    sb := servicebridge.New("127.0.0.1:14445",
        os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), "orders", nil)

    sb.HandleRpc("orders.create",
        func(ctx context.Context, p json.RawMessage) (any, error) {
            charge, _ := sb.Rpc(ctx, "payments.charge",
                map[string]any{"orderId": "ord_42", "amount": 4990}, nil)
            return map[string]any{"ok": true, "txId": charge["txId"]}, nil
        })

    _ = sb.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})
}`,

  py: `from servicebridge import ServiceBridge
import os

sb = ServiceBridge("127.0.0.1:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"], "orders")

@sb.handle_rpc("orders.create")
async def orders_create(payload: dict) -> dict:
    charge = await sb.rpc("payments.charge", {
        "orderId": payload["id"],
        "amount": payload["total"],
    })
    return {"ok": charge["ok"], "txId": charge["txId"]}

await sb.serve()`,
};

// ─── Animated packet dot ─────────────────────────────────────────────────────

function Packet({ color, delay = 0, duration = 1.8, glow }: { color: string; delay?: number; duration?: number; glow?: string }) {
  return (
    <motion.span
      className={cn("absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2", color)}
      style={glow ? { boxShadow: glow } : undefined}
      animate={{ left: ["-3%", "103%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity, delay }}
    />
  );
}

export function DirectRpcSection() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const inView = useInView(diagramRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="direct-rpc"
      eyebrow="Direct RPC"
      title={<>Zero proxy hops. Direct to the worker.</>}
      subtitle="ServiceBridge handles discovery, endpoint caching, mTLS identity, and load balancing entirely off the data path. Calls travel service-to-service over a persistent direct gRPC channel — no intermediary process."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-zinc-500">how it works</p>
            <h2 className="type-subsection-title mt-2">Registry resolves once. Then it's a direct wire.</h2>
            <p className="type-body-sm mt-3">
              On first{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">rpc()</code>{" "}
              call the SDK queries{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">LookupFunction</code>{" "}
              — reading an in-memory snapshot, no DB hit. It opens a persistent gRPC
              channel to the worker and caches it. Every subsequent call is a direct wire.
            </p>
            <div className="mt-5 grid gap-2 grid-cols-3">
              <Card className="p-3">
                <p className="type-overline-mono text-muted-foreground">register</p>
                <p className="mt-2 type-subsection-title text-blue-300">serve() → registry</p>
              </Card>
              <Card className="p-3">
                <p className="type-overline-mono text-muted-foreground">resolve</p>
                <p className="mt-2 type-subsection-title text-violet-300">snapshot lookup</p>
              </Card>
              <Card className="p-3">
                <p className="type-overline-mono text-muted-foreground">dial</p>
                <p className="mt-2 type-subsection-title text-emerald-400">direct gRPC</p>
              </Card>
            </div>
          </Card>
          <MultiCodeBlock code={RPC_CODE} filename={{ ts: "orders-service.ts", go: "orders_service.go", py: "orders_service.py" }} />
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title="architecture · checkout → payments.charge">
            <div ref={diagramRef} className="p-5 space-y-4">
              {/* Traditional mesh */}
              <div className="rounded-xl border border-red-500/[0.15] bg-red-500/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="type-overline-mono text-red-400/60">traditional service mesh</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Istio / Linkerd — sidecar on every pod</p>
                  </div>
                  <Badge tone="border-red-500/25 bg-red-500/[0.08] text-red-400">4 proxy hops</Badge>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 py-1.5 text-center shrink-0">
                    <p className="text-xs font-semibold font-display text-zinc-300">checkout</p>
                    <p className="text-3xs font-mono text-zinc-600">caller</p>
                  </div>
                  <div className="flex-1 relative h-px bg-zinc-700/40 min-w-[16px]">
                    {inView && <Packet color="bg-zinc-500/80" duration={2.4} />}
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-2 py-1.5 text-center shrink-0">
                    <p className="text-3xs font-mono text-red-300/70">envoy</p>
                    <p className="text-3xs text-red-400/40">sidecar</p>
                  </div>
                  <div className="flex-1 relative h-px bg-red-500/30 min-w-[16px]">
                    {inView && <Packet color="bg-red-400/70" duration={1.8} delay={0.4} />}
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-2 py-1.5 text-center shrink-0">
                    <p className="text-3xs font-mono text-red-300/70">envoy</p>
                    <p className="text-3xs text-red-400/40">sidecar</p>
                  </div>
                  <div className="flex-1 relative h-px bg-zinc-700/40 min-w-[16px]">
                    {inView && <Packet color="bg-zinc-500/80" duration={2.4} delay={0.8} />}
                  </div>
                  <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-3 py-1.5 text-center shrink-0">
                    <p className="text-xs font-semibold font-display text-zinc-300">payments</p>
                    <p className="text-3xs font-mono text-zinc-600">worker</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-3xs font-mono text-red-400/60">50–200 MB RAM / service</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-3xs font-mono text-red-400/60">2 extra processes</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-3xs font-mono text-red-400/60">CRDs + operator required</span>
                </div>
              </div>

              {/* ServiceBridge */}
              <div className="rounded-xl border border-emerald-500/[0.15] bg-emerald-500/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="type-overline-mono text-emerald-400/80">ServiceBridge</p>
                    <p className="mt-0.5 text-xs text-zinc-400">Control plane is off the data path</p>
                  </div>
                  <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">0 hops</Badge>
                </div>

                {/* Registry above, dashed lines down */}
                <div className="flex flex-col items-center gap-0 mb-2">
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.07] px-4 py-2 flex items-center gap-2.5">
                    <Network className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold font-display text-violet-200">RegistryHub</p>
                      <p className="text-3xs font-mono text-violet-400/60">in-memory snapshot · 0 DB queries</p>
                    </div>
                  </div>
                  <div className="flex gap-10">
                    <div className="w-px h-3 border-l border-dashed border-violet-500/25" />
                    <div className="w-px h-3 border-l border-dashed border-violet-500/25" />
                  </div>
                  <p className="text-3xs font-mono text-zinc-600 mb-2">lookup on first call · cached · refresh every 10s</p>

                  {/* Direct data path */}
                  <div className="flex items-center gap-2 w-full">
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-center shrink-0">
                      <p className="text-xs font-semibold font-display text-emerald-400">checkout</p>
                      <p className="text-3xs font-mono text-emerald-400/50">caller</p>
                    </div>
                    <div className="flex-1 relative h-0.5 min-w-[40px] bg-gradient-to-r from-emerald-500/25 via-emerald-500/50 to-emerald-500/25 rounded-full">
                      {inView && (
                        <>
                          <motion.span
                            className="absolute top-1/2 h-2 w-2 rounded-full bg-emerald-400 -translate-y-1/2"
                            style={{ boxShadow: "0 0 8px rgba(34,197,94,0.7)" }}
                            animate={{ left: ["-3%", "103%"] }}
                            transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                          />
                          <motion.span
                            className="absolute top-1/2 h-2 w-2 rounded-full bg-yellow-400 -translate-y-1/2"
                            style={{ boxShadow: "0 0 8px rgba(250,204,21,0.5)" }}
                            animate={{ left: ["-3%", "103%"] }}
                            transition={{ duration: 1.2, ease: "linear", repeat: Infinity, delay: 0.6 }}
                          />
                        </>
                      )}
                    </div>
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-center shrink-0">
                      <p className="text-xs font-semibold font-display text-emerald-400">payments</p>
                      <p className="text-3xs font-mono text-emerald-400/50">worker</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-3xs font-mono text-zinc-600">direct gRPC · mTLS · round_robin · waitForReady</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <Card className="p-3">
                    <p className="type-overline-mono text-muted-foreground">proxy hops</p>
                    <p className="mt-1 type-subsection-title text-emerald-400">0</p>
                  </Card>
                  <Card className="p-3">
                    <p className="type-overline-mono text-muted-foreground">identity</p>
                    <p className="mt-1 type-subsection-title text-violet-300">mTLS cert CN</p>
                  </Card>
                  <Card className="p-3">
                    <p className="type-overline-mono text-muted-foreground">balancing</p>
                    <p className="mt-1 type-subsection-title text-blue-300">round_robin</p>
                  </Card>
                </div>
              </div>
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard variant="compact" icon={Zap} title="No proxy on the data path" description="Discovery and policy live in the control plane. Requests travel service-to-service over a persistent gRPC channel — no intermediary, no extra RTT." iconClassName="text-yellow-400" />
          <FeatureCard variant="compact" icon={Network} title="In-memory snapshot" description="LookupFunction reads RegistryHub.Snapshot() — zero DB queries on the hot path. Custom sb:// resolver refreshes every 10s." iconClassName="text-cyan-400" />
          <FeatureCard variant="compact" icon={Shield} title="mTLS caller identity" description="Certificate CN enforced at registry, SDK, and worker handler. allowed_callers policy checked at three layers with no extra config." iconClassName="text-violet-400" />
          <FeatureCard variant="compact" icon={CheckCircle2} title="Automatic failover" description="waitForReady + gRPC subchannel health routes around dead instances automatically. No DNS TTL delays." iconClassName="text-emerald-400" />
        </>
      }
    />
  );
}
