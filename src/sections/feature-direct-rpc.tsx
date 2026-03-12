import { motion, useInView } from "framer-motion";
import { CheckCircle2, Network, Shield, Zap } from "lucide-react";
import React, { type ReactNode, useRef } from "react";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";
import { FlowTile } from "./feature-shared";

const RPC_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "orders");

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
    servicebridge "github.com/servicebridge/sdk-go"
)

func main() {
    sb := servicebridge.New("127.0.0.1:14445",
        os.Getenv("SERVICE_KEY"), "orders", nil)

    // Register — advertises endpoint to the registry
    sb.HandleRpc("orders.create",
        func(ctx context.Context, p json.RawMessage) (any, error) {
            // SDK opens a direct gRPC channel to payments worker
            charge, _ := sb.Rpc(ctx, "payments.charge",
                map[string]any{"orderId": "ord_42", "amount": 4990}, nil)
            return map[string]any{"ok": true, "txId": charge["txId"]}, nil
        })

    _ = sb.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})
}`,

  py: `from servicebridge import ServiceBridge
import os

sb = ServiceBridge("127.0.0.1:14445", os.environ["SERVICE_KEY"], "orders")

# Register — advertises endpoint to the registry
@sb.handle_rpc("orders.create")
async def orders_create(payload: dict) -> dict:
    # SDK opens a direct gRPC channel to payments worker
    charge = await sb.rpc("payments.charge", {
        "orderId": payload["id"],
        "amount": payload["total"],
    })
    return {"ok": charge["ok"], "txId": charge["txId"]}

await sb.serve()`,
};

// ─── Animated packet dot ─────────────────────────────────────────────────────

function Packet({
  color,
  delay = 0,
  duration = 1.8,
  glow,
}: {
  color: string;
  delay?: number;
  duration?: number;
  glow?: string;
}) {
  return (
    <motion.span
      className={cn("absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2", color)}
      style={glow ? { boxShadow: glow } : undefined}
      animate={{ left: ["-3%", "103%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity, delay }}
    />
  );
}

// ─── Service node ────────────────────────────────────────────────────────────

function SvcNode({
  label,
  sub,
  tone,
}: {
  label: string;
  sub?: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-center shrink-0 min-w-[72px]", tone)}>
      <p className="text-xs font-semibold font-display leading-tight">{label}</p>
      {sub && <p className="mt-0.5 text-3xs font-mono opacity-50">{sub}</p>}
    </div>
  );
}

// ─── Sidecar proxy node ──────────────────────────────────────────────────────

function ProxySidecar({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/[0.08] px-2.5 py-2 text-center shrink-0">
      <p className="text-3xs font-mono text-red-300/70 leading-tight">{label}</p>
      <p className="mt-0.5 text-3xs text-red-400/40">sidecar</p>
    </div>
  );
}

// ─── Connection line ─────────────────────────────────────────────────────────

function ConnLine({
  color,
  children,
}: {
  color: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative h-px flex-1 min-w-[20px]", color)}>
      {children}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function DirectRpcSection() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const inView = useInView(diagramRef, { once: true, margin: "-60px" });

  const content = (
    <Card>
      <p className="type-overline-mono text-zinc-500">how it works</p>
      <h2 className="type-subsection-title mt-2">
        Registry resolves once. Then it's a direct wire.
      </h2>
      <p className="type-body-sm mt-3">
        On first{" "}
        <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
          rpc()
        </code>{" "}
        call the SDK queries{" "}
        <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
          LookupFunction
        </code>{" "}
        — reading an in-memory snapshot, no DB hit. It opens a persistent gRPC
        channel to the worker and caches it. Every subsequent call is a direct wire.
      </p>
      <div className="mt-5 grid gap-2 grid-cols-3">
        <FlowTile label="register" value="serve() → registry" tone="text-blue-300" />
        <FlowTile label="resolve" value="snapshot lookup" tone="text-violet-300" />
        <FlowTile label="dial" value="direct gRPC" tone="text-primary" />
      </div>
    </Card>
  );

  const demo = (
    <>
      <CodePanel title="architecture · checkout → payments.charge">
        <div ref={diagramRef} className="bg-code p-6 space-y-5">
          {/* ── Row 1: Traditional service mesh ── */}
          <div className="rounded-2xl border border-red-500/[0.12] bg-red-500/[0.03] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="type-overline-mono text-red-400/60">traditional service mesh</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Istio / Linkerd — sidecar injected on every pod
                </p>
              </div>
              <Badge tone="border-red-500/25 bg-red-500/[0.08] text-red-400">
                4 proxy hops
              </Badge>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <SvcNode
                label="checkout"
                sub="caller"
                tone="border-zinc-700/40 bg-zinc-800/40 text-zinc-300"
              />
              <ConnLine color="bg-zinc-700/40">
                {inView && <Packet color="bg-zinc-500/80" duration={2.4} />}
              </ConnLine>
              <ProxySidecar label="envoy" />
              <ConnLine color="bg-red-500/30">
                {inView && <Packet color="bg-red-400/70" duration={1.8} delay={0.4} />}
              </ConnLine>
              <ProxySidecar label="envoy" />
              <ConnLine color="bg-zinc-700/40">
                {inView && <Packet color="bg-zinc-500/80" duration={2.4} delay={0.8} />}
              </ConnLine>
              <SvcNode
                label="payments"
                sub="worker"
                tone="border-zinc-700/40 bg-zinc-800/40 text-zinc-300"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-3xs font-mono text-red-400/60">
                50–200 MB RAM / service
              </span>
              <span className="text-zinc-700">·</span>
              <span className="text-3xs font-mono text-red-400/60">2 extra processes</span>
              <span className="text-zinc-700">·</span>
              <span className="text-3xs font-mono text-red-400/60">CRDs + operator required</span>
            </div>
          </div>

          {/* ── Row 2: ServiceBridge — control plane off the data path ── */}
          <div className="rounded-2xl border border-primary/[0.15] bg-primary/[0.03] p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="type-overline-mono text-primary/80">ServiceBridge</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Control plane is off the data path
                </p>
              </div>
              <Badge tone="border-primary/20 bg-primary/[0.08] text-primary">
                0 hops
              </Badge>
            </div>

            {/* Control plane node — above the data path, visually separated */}
            <div className="flex flex-col items-center gap-0 mb-3">
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.07] px-4 py-2 flex items-center gap-2.5">
                <Network className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold font-display text-violet-200">
                    RegistryHub
                  </p>
                  <p className="text-3xs font-mono text-violet-400/60">
                    in-memory snapshot · 0 DB queries
                  </p>
                </div>
              </div>

              {/* Dashed lines down — "lookup happens here, not on each call" */}
              <div className="flex gap-12">
                <div className="w-px h-4 border-l border-dashed border-violet-500/25" />
                <div className="w-px h-4 border-l border-dashed border-violet-500/25" />
              </div>
              <p className="text-3xs font-mono text-zinc-600 mb-3">
                lookup on first call · cached · refresh every 10s
              </p>

              {/* Data path — direct connection, below registry */}
              <div className="flex items-center gap-2 w-full">
                <SvcNode
                  label="checkout"
                  sub="caller"
                  tone="border-primary/25 bg-primary/[0.08] text-primary"
                />
                <div className="flex-1 relative h-0.5 min-w-[40px] bg-gradient-to-r from-primary/25 via-primary/50 to-primary/25 rounded-full">
                  {inView && (
                    <>
                      <motion.span
                        className="absolute top-1/2 h-2 w-2 rounded-full bg-primary -translate-y-1/2"
                        style={{ boxShadow: "0 0 8px rgba(34,197,94,0.7)" }}
                        animate={{ left: ["-3%", "103%"] }}
                        transition={{
                          duration: 1.2,
                          ease: "linear",
                          repeat: Infinity,
                        }}
                      />
                      <motion.span
                        className="absolute top-1/2 h-2 w-2 rounded-full bg-yellow-400 -translate-y-1/2"
                        style={{ boxShadow: "0 0 8px rgba(250,204,21,0.5)" }}
                        animate={{ left: ["-3%", "103%"] }}
                        transition={{
                          duration: 1.2,
                          ease: "linear",
                          repeat: Infinity,
                          delay: 0.6,
                        }}
                      />
                    </>
                  )}
                </div>
                <SvcNode
                  label="payments"
                  sub="worker"
                  tone="border-primary/25 bg-primary/[0.08] text-primary"
                />
              </div>
              <p className="mt-2 text-3xs font-mono text-zinc-600">
                direct gRPC · mTLS · gRPC round_robin · waitForReady
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <FlowTile label="proxy hops" value="0" tone="text-primary" />
              <FlowTile label="identity" value="mTLS cert CN" tone="text-violet-300" />
              <FlowTile label="balancing" value="round_robin" tone="text-blue-300" />
            </div>
          </div>
        </div>
      </CodePanel>

      <div className="mt-4">
        <MultiCodeBlock
          code={RPC_CODE}
          filename={{ ts: "orders-service.ts", go: "orders_service.go", py: "orders_service.py" }}
        />
      </div>
    </>
  );

  const cards = (
    <>
      <MiniCard
        icon={Zap}
        title="No proxy on the data path"
        desc="Discovery and policy live in the control plane. The request travels service-to-service over a persistent gRPC channel — no intermediary, no extra RTT."
        iconClassName="text-yellow-400"
      />
      <MiniCard
        icon={Network}
        title="In-memory snapshot"
        desc="LookupFunction reads RegistryHub.Snapshot() — zero DB queries on the hot path. Custom sb:// resolver refreshes every 10s."
        iconClassName="text-cyan-400"
      />
      <MiniCard
        icon={Shield}
        title="mTLS caller identity"
        desc="Certificate CN enforced at registry, SDK, and worker handler. allowed_callers policy checked at three layers with no extra config."
        iconClassName="text-violet-400"
      />
      <MiniCard
        icon={CheckCircle2}
        title="Automatic failover"
        desc="waitForReady + gRPC subchannel health routes around dead instances automatically. No DNS TTL delays."
        iconClassName="text-emerald-400"
      />
    </>
  );

  return (
    <FeatureSection
      id="direct-rpc"
      eyebrow="Direct RPC"
      title={
        <>
          Zero proxy hops.{" "}
          <span className="text-gradient">Direct to the worker.</span>
        </>
      }
      subtitle="ServiceBridge handles discovery, endpoint caching, mTLS identity, and load balancing entirely off the data path. Calls travel service-to-service over a persistent direct gRPC channel — no intermediary process."
      content={content}
      demo={demo}
      cards={cards}
    />
  );
}
