import { motion, useInView } from "framer-motion";
import { Activity, Network, RefreshCcw, Zap } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { cn } from "../lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { MiniCard } from "../ui/MiniCard";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DISCOVERY_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

// Worker: endpoint is advertised on serve()
const payments = servicebridge("127.0.0.1:14445", SERVICE_KEY, "payments");
payments.handleRpc("payments.charge", handler);
await payments.serve();  // → RegisterFunction + Heartbeat loop

// Caller: lazy resolution on first rpc() call
const orders = servicebridge("127.0.0.1:14445", SERVICE_KEY, "orders");

// First call  → LookupFunction → opens persistent gRPC channel
// All after   → direct wire, zero lookup overhead
const result = await orders.rpc("payments.charge", { amount: 4990 });`,

  go: `// Worker: endpoint is advertised on Serve()
payments := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "payments", nil)

payments.HandleRpc("payments.charge",
    func(ctx context.Context, p json.RawMessage) (any, error) {
        return map[string]any{"ok": true, "txId": "tx_001"}, nil
    })

go payments.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})

// Caller: first Rpc() → LookupFunction → opens gRPC channel
// All after → direct wire, zero lookup overhead
orders := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICE_KEY"), "orders", nil)

result, _ := orders.Rpc(ctx, "payments.charge",
    map[string]any{"amount": 4990}, nil)`,

  py: `from servicebridge import ServiceBridge

# Worker: endpoint is advertised on serve()
payments = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "payments")

@payments.handle_rpc("payments.charge")
async def charge(payload: dict) -> dict:
    return {"ok": True, "txId": "tx_001"}

asyncio.create_task(payments.serve(host="127.0.0.1"))

# Caller: first rpc() → LookupFunction → opens gRPC channel
# All after → direct wire, zero lookup overhead
orders = ServiceBridge("127.0.0.1:14445", SERVICE_KEY, "orders")
result = await orders.rpc("payments.charge", {"amount": 4990})`,
};

const REGISTRY_ROWS = [
  {
    id: "r1",
    canonical: "orders/orders.create",
    endpoint: "10.0.1.5:50051",
    inst: 3,
    beat: "1s ago",
    alive: true,
  },
  {
    id: "r2",
    canonical: "payments/payments.charge",
    endpoint: "10.0.2.4:50051",
    inst: 2,
    beat: "3s ago",
    alive: true,
  },
  {
    id: "r3",
    canonical: "notify/notify.send",
    endpoint: "10.0.3.9:50051",
    inst: 1,
    beat: "9s ago",
    alive: true,
  },
  {
    id: "r4",
    canonical: "analytics/analytics.track",
    endpoint: "10.0.4.2:50051",
    inst: 2,
    beat: "21s ago",
    alive: true,
  },
  {
    id: "r5",
    canonical: "billing/billing.invoice",
    endpoint: "10.0.5.1:50051",
    inst: 0,
    beat: "34s ago",
    alive: false,
  },
] as const;

const FLOW_STEPS = [
  {
    key: "register",
    num: "01",
    label: "RegisterFunction",
    desc: "serve() → registry",
    tone: "border-blue-500/20 bg-blue-500/[0.08] text-blue-200",
    dotColor: "bg-blue-400",
  },
  {
    key: "snapshot",
    num: "02",
    label: "Snapshot()",
    desc: "in-memory · 0 DB",
    tone: "border-violet-500/20 bg-violet-500/[0.08] text-violet-200",
    dotColor: "bg-violet-400",
  },
  {
    key: "dial",
    num: "03",
    label: "Direct Dial",
    desc: "gRPC channel cached",
    tone: "border-primary/20 bg-primary/[0.08] text-primary",
    dotColor: "bg-primary",
  },
] as const;

// ─── Section ─────────────────────────────────────────────────────────────────

export function DiscoveryMapSection() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-60px" });
  const [activeRow, setActiveRow] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const t = setInterval(() => {
      setActiveRow(idx % REGISTRY_ROWS.length);
      idx++;
    }, 1600);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <FeatureSection
      id="service-discovery"
      eyebrow="Service Discovery"
      title={
        <>
          Registry-driven.{" "}
          <span className="text-gradient">Zero proxy. Zero DB on the hot path.</span>
        </>
      }
      subtitle="Workers self-register and heartbeat. The control plane builds an in-memory snapshot. Callers resolve endpoints from that snapshot — no database queries, no sidecar, no DNS polling."
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title={`registry.snapshot · ${REGISTRY_ROWS.length} services · rev 1842`}>
            <div className="flex items-center gap-1.5 absolute top-2.5 right-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-2xs text-emerald-400/70">live</span>
            </div>
            <div ref={tableRef} className="p-5 space-y-4">
              <div
                className="grid gap-2 px-3"
                style={{ gridTemplateColumns: "1.7fr 1.1fr 0.35fr 0.8fr 0.7fr" }}
              >
                {(["SERVICE", "ENDPOINT", "INST", "HEARTBEAT", "STATUS"] as const).map((h) => (
                  <span key={h} className="type-overline-mono text-muted-foreground">
                    {h}
                  </span>
                ))}
              </div>

              <div className="space-y-1">
                {REGISTRY_ROWS.map((row, i) => (
                  <div
                    key={row.id}
                    className={cn(
                      "grid gap-2 rounded-2xl px-3 py-2.5 border transition-colors duration-500",
                      i === activeRow
                        ? "bg-primary/[0.04] border-primary/[0.10]"
                        : "border-transparent"
                    )}
                    style={{ gridTemplateColumns: "1.7fr 1.1fr 0.35fr 0.8fr 0.7fr" }}
                  >
                    <span
                      className={cn(
                        "text-xs font-mono truncate",
                        row.alive ? "text-zinc-200" : "text-zinc-600"
                      )}
                    >
                      {row.canonical}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono",
                        row.alive ? "text-zinc-500" : "text-zinc-700"
                      )}
                    >
                      {row.endpoint}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono text-center",
                        row.alive ? "text-zinc-300" : "text-zinc-600"
                      )}
                    >
                      {row.inst}
                    </span>
                    <span className="text-xs font-mono text-zinc-600">{row.beat}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          row.alive ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"
                        )}
                      />
                      <span
                        className={cn(
                          "text-3xs font-mono",
                          row.alive ? "text-emerald-400" : "text-zinc-600"
                        )}
                      >
                        {row.alive ? "alive" : "stale"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/[0.04]" />

              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">lookup</p>
                  <p className="text-sm font-semibold font-display text-violet-300">Snapshot()</p>
                </Card>
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">hot path</p>
                  <p className="text-sm font-semibold font-display text-primary">0 DB queries</p>
                </Card>
                <Card className="p-3">
                  <p className="type-overline-mono text-muted-foreground">heartbeat TTL</p>
                  <p className="text-sm font-semibold font-display text-blue-300">30 s</p>
                </Card>
              </div>

              <Card className="p-4">
                <p className="type-overline-mono text-muted-foreground mb-3">discovery flow</p>
                <div className="flex items-center gap-2">
                  {FLOW_STEPS.map((step, i) => (
                    <div key={step.key} className="contents">
                      <div
                        className={cn(
                          "rounded-2xl border px-3 py-2.5 text-center shrink-0 flex-1",
                          step.tone
                        )}
                      >
                        <p className="text-3xs font-mono opacity-40 mb-0.5">{step.num}</p>
                        <p className="text-xs font-semibold font-display leading-tight">
                          {step.label}
                        </p>
                        <p className="text-3xs text-zinc-500 mt-0.5">{step.desc}</p>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <div className="relative h-px w-8 shrink-0 bg-white/[0.06]">
                          {inView && (
                            <motion.span
                              className={cn(
                                "absolute top-1/2 h-1.5 w-1.5 rounded-full -translate-y-1/2",
                                step.dotColor
                              )}
                              animate={{ left: ["-3%", "103%"] }}
                              transition={{
                                duration: 1.4,
                                ease: "linear",
                                repeat: Infinity,
                                delay: i * 0.45,
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </CodePanel>
        </motion.div>
      }
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">registry model</p>
            <h2 className="mt-2 type-subsection-title">
              Self-register once. Resolve from memory.
            </h2>
            <p className="mt-3 type-body-sm">
              Workers call{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                serve()
              </code>{" "}
              to advertise their endpoint. The control plane builds a debounced in-memory
              snapshot. Callers read that snapshot and open persistent gRPC channels — no SQL
              at call time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="border-primary/20 bg-primary/[0.08] text-primary">
                proxyless
              </Badge>
              <Badge tone="border-violet-500/20 bg-violet-500/[0.08] text-violet-300">
                in-memory snapshot
              </Badge>
              <Badge tone="border-blue-500/20 bg-blue-500/[0.08] text-blue-300">
                heartbeat TTL 30s
              </Badge>
            </div>
          </Card>

          <MultiCodeBlock
            code={DISCOVERY_CODE}
            filename={{ ts: "discovery.ts", go: "discovery.go", py: "discovery.py" }}
          />
        </motion.div>
      }
      cards={
        <>
          <MiniCard
            icon={Zap}
            title="Lazy on-demand"
            desc="First rpc() call for unknown target issues LookupFunction. Channel opens and is cached. All subsequent calls are direct."
            iconClassName="text-yellow-400"
          />
          <MiniCard
            icon={Activity}
            title="Live heartbeat"
            desc="Workers heartbeat continuously. Endpoints missing the 30s TTL are evicted from the snapshot automatically — no manual deregistration needed."
            iconClassName="text-emerald-400"
          />
          <MiniCard
            icon={Network}
            title="gRPC round_robin"
            desc="One channel per canonical function with gRPC round_robin across alive replicas. Load balancing scales with instance count."
            iconClassName="text-cyan-400"
          />
          <MiniCard
            icon={RefreshCcw}
            title="Full + delta streaming"
            desc="WatchRegistry sends a FULL snapshot first, then DELTAs. Clients apply incremental updates until overflow forces a FULL resync."
            iconClassName="text-violet-400"
          />
        </>
      }
    />
  );
}
