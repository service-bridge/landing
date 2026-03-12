import { motion, useInView } from "framer-motion";
import { Activity, Network, RefreshCcw, Zap } from "lucide-react";
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

const DISCOVERY_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

// Worker: endpoint is advertised on serve()
const payments = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "payments");
payments.handleRpc("payments.charge", handler);
await payments.serve();  // → RegisterFunction + Heartbeat loop

// Caller: lazy resolution on first rpc() call
const orders = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders");

// First call  → LookupFunction → opens persistent gRPC channel
// All after   → direct wire, zero lookup overhead
const result = await orders.rpc("payments.charge", { amount: 4990 });`,

  go: `// Worker: endpoint is advertised on Serve()
payments := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), "payments", nil)

payments.HandleRpc("payments.charge",
    func(ctx context.Context, p json.RawMessage) (any, error) {
        return map[string]any{"ok": true, "txId": "tx_001"}, nil
    })

go payments.Serve(ctx, &servicebridge.ServeOpts{Host: "127.0.0.1"})

// Caller: first Rpc() → LookupFunction → opens gRPC channel
orders := servicebridge.New(
    "127.0.0.1:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), "orders", nil)

result, _ := orders.Rpc(ctx, "payments.charge",
    map[string]any{"amount": 4990}, nil)`,

  py: `from servicebridge import ServiceBridge

# Worker: endpoint is advertised on serve()
payments = ServiceBridge("127.0.0.1:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"], "payments")

@payments.handle_rpc("payments.charge")
async def charge(payload: dict) -> dict:
    return {"ok": True, "txId": "tx_001"}

asyncio.create_task(payments.serve(host="127.0.0.1"))

# Caller: first rpc() → LookupFunction → opens gRPC channel
orders = ServiceBridge("127.0.0.1:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"], "orders")
result = await orders.rpc("payments.charge", {"amount": 4990})`,
};

const REGISTRY_ROWS = [
  { id: "r1", canonical: "orders/orders.create", endpoint: "10.0.1.5:50051", inst: 3, beat: "1s ago", alive: true },
  { id: "r2", canonical: "payments/payments.charge", endpoint: "10.0.2.4:50051", inst: 2, beat: "3s ago", alive: true },
  { id: "r3", canonical: "notify/notify.send", endpoint: "10.0.3.9:50051", inst: 1, beat: "9s ago", alive: true },
  { id: "r4", canonical: "analytics/analytics.track", endpoint: "10.0.4.2:50051", inst: 2, beat: "21s ago", alive: true },
  { id: "r5", canonical: "billing/billing.invoice", endpoint: "10.0.5.1:50051", inst: 0, beat: "34s ago", alive: false },
] as const;

export function DiscoveryMapSection() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="service-discovery"
      eyebrow="Service Discovery"
      title={<>Registry-driven. Zero proxy. Zero DB on the hot path.</>}
      subtitle="Workers self-register and heartbeat. The control plane builds an in-memory snapshot. Callers resolve endpoints from that snapshot — no database queries, no sidecar, no DNS polling."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">registry model</p>
            <h2 className="mt-2 type-subsection-title">Self-register once. Resolve from memory.</h2>
            <p className="mt-3 type-body-sm">
              Workers call{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">serve()</code>{" "}
              to advertise their endpoint. The control plane builds a debounced in-memory snapshot.
              Callers read that snapshot and open persistent gRPC channels — no SQL at call time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">proxyless</Badge>
              <Badge tone="border-violet-500/20 bg-violet-500/[0.08] text-violet-300">in-memory snapshot</Badge>
              <Badge tone="border-blue-500/20 bg-blue-500/[0.08] text-blue-300">heartbeat TTL 30s</Badge>
            </div>
          </Card>
          <MultiCodeBlock
            code={DISCOVERY_CODE}
            filename={{ ts: "discovery.ts", go: "discovery.go", py: "discovery.py" }}
          />
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel title={`registry.snapshot · ${REGISTRY_ROWS.length} services`}>
            <div className="flex items-center gap-1.5 absolute top-2.5 right-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-2xs text-emerald-400/70">live</span>
            </div>

            <div ref={tableRef} className="p-4 space-y-1">
              <div
                className="grid gap-2 px-3 pb-2"
                style={{ gridTemplateColumns: "1.7fr 1.1fr 0.35fr 0.8fr 0.7fr" }}
              >
                {(["SERVICE", "ENDPOINT", "INST", "HEARTBEAT", "STATUS"] as const).map((h) => (
                  <span key={h} className="type-overline-mono text-muted-foreground">{h}</span>
                ))}
              </div>

              {REGISTRY_ROWS.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  className="grid gap-2 rounded-xl px-3 py-2.5 border border-surface-border bg-surface"
                  style={{ gridTemplateColumns: "1.7fr 1.1fr 0.35fr 0.8fr 0.7fr" }}
                >
                  <span className={cn("text-xs font-mono truncate", row.alive ? "text-zinc-200" : "text-zinc-600")}>
                    {row.canonical}
                  </span>
                  <span className={cn("text-xs font-mono", row.alive ? "text-zinc-500" : "text-zinc-700")}>
                    {row.endpoint}
                  </span>
                  <span className={cn("text-xs font-mono text-center", row.alive ? "text-zinc-300" : "text-zinc-600")}>
                    {row.inst}
                  </span>
                  <span className="text-xs font-mono text-zinc-600">{row.beat}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", row.alive ? "bg-emerald-400 animate-pulse" : "bg-zinc-700")} />
                    <span className={cn("text-3xs font-mono", row.alive ? "text-emerald-400" : "text-zinc-600")}>
                      {row.alive ? "alive" : "stale"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-surface-border px-4 py-3 flex items-center gap-6">
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">lookup</p>
                <p className="text-sm font-semibold font-display text-violet-300 mt-0.5">Snapshot()</p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">hot path</p>
                <p className="text-sm font-semibold font-display text-emerald-400 mt-0.5">0 DB queries</p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">heartbeat TTL</p>
                <p className="text-sm font-semibold font-display text-blue-300 mt-0.5">30 s</p>
              </div>
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard variant="compact" icon={Zap} title="Lazy on-demand" description="First rpc() call for unknown target issues LookupFunction. Channel opens and is cached. All subsequent calls are direct." iconClassName="text-yellow-400" />
          <FeatureCard variant="compact" icon={Activity} title="Live heartbeat" description="Workers heartbeat continuously. Endpoints missing the 30s TTL are evicted from the snapshot automatically." iconClassName="text-emerald-400" />
          <FeatureCard variant="compact" icon={Network} title="gRPC round_robin" description="One channel per canonical function with gRPC round_robin across alive replicas. Load balancing scales with instance count." iconClassName="text-cyan-400" />
          <FeatureCard variant="compact" icon={RefreshCcw} title="Full + delta streaming" description="WatchRegistry sends a FULL snapshot first, then DELTAs. Clients apply incremental updates until overflow forces a FULL resync." iconClassName="text-violet-400" />
        </>
      }
    />
  );
}
