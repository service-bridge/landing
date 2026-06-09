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
  ts: `import { ServiceBridge } from "service-bridge";

// Worker: handler is declared before start(), endpoint
// is advertised to the registry on start()
const payments = new ServiceBridge("localhost:14445", serviceKey);
payments.rpc.handle("payment.charge", handler, { schema });
await payments.start();  // → RegisterAndWatch stream + cert provisioned

// Caller: declare the outgoing dep, then start()
const orders = new ServiceBridge("localhost:14445", serviceKey);
orders.service("payments", { rpc: ["payment.charge"] });
await orders.start();

// auto transport: direct caller→callee mTLS when the
// endpoint is in the snapshot, else proxied via runtime
const result = await orders.rpc.call("payments", "payment.charge", { amount: 4990 });

// Live registry view, no SQL on the hot path:
const map = orders.serviceMap();  // ReadonlyMap<serviceName, ServiceMapEntry>`,
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
    canonical: "payments/payment.charge",
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

export function DiscoveryMapSection() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-60px" });

  return (
    <FeatureSection
      id="service-discovery"
      eyebrow="Service Discovery"
      title={<>Registry-driven. Zero proxy. Zero DB on the hot path.</>}
      subtitle="Workers self-register over a push stream; the control plane streams back a live in-memory snapshot. Callers resolve endpoints from it — 0 DB queries, no sidecar, no DNS polling. No Consul, no Envoy sidecar, no DNS TTL lag."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground">registry model</p>
            <h2 className="mt-2 type-subsection-title">Self-register once. Resolve from memory.</h2>
            <p className="mt-3 type-body-sm">
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                start()
              </code>{" "}
              advertises the endpoint over the{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                RegisterAndWatch
              </code>{" "}
              stream. Callers read the pushed snapshot via{" "}
              <code className="text-foreground/80 bg-white/[0.05] px-1 rounded text-xs">
                serviceMap()
              </code>{" "}
              and reach callees directly over mTLS — no SQL at call time. Drop the stream and the
              control plane evicts those instances from the snapshot within a heartbeat.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                proxyless
              </Badge>
              <Badge tone="border-violet-500/20 bg-violet-500/[0.08] text-violet-300">
                in-memory snapshot
              </Badge>
              <Badge tone="border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400">
                push stream
              </Badge>
            </div>
            <a
              href="#docs"
              className="mt-4 inline-flex items-center gap-1 type-label text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See the discovery API →
            </a>
          </Card>
          <MultiCodeBlock code={DISCOVERY_CODE} filename={{ ts: "discovery.ts" }} />
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp}>
          <CodePanel
            title={`registry.snapshot · ${REGISTRY_ROWS.length} services`}
            headerActions={
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-2xs text-emerald-400/70">live</span>
              </div>
            }
          >
            <div
              ref={tableRef}
              className="p-4 space-y-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:none]"
            >
              <div className="min-w-[520px]">
                <div
                  className="grid gap-2 px-3 pb-2"
                  style={{ gridTemplateColumns: "1.7fr 1.1fr 0.35fr 0.8fr 0.7fr" }}
                >
                  {(["SERVICE", "ENDPOINT", "INST", "HEARTBEAT", "STATUS"] as const).map((h) => (
                    <span key={h} className="type-overline-mono text-muted-foreground">
                      {h}
                    </span>
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
                    <span
                      className={cn(
                        "text-xs font-mono truncate",
                        row.alive ? "text-zinc-200" : "text-muted-foreground/60"
                      )}
                    >
                      {row.canonical}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono",
                        row.alive ? "text-muted-foreground/70" : "text-zinc-700"
                      )}
                    >
                      {row.endpoint}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono text-center",
                        row.alive ? "text-muted-foreground" : "text-muted-foreground/60"
                      )}
                    >
                      {row.inst}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground/60">{row.beat}</span>
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
                          row.alive ? "text-emerald-400" : "text-muted-foreground/60"
                        )}
                      >
                        {row.alive ? "alive" : "stale"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="border-t border-surface-border px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">lookup</p>
                <p className="text-sm font-semibold font-display text-foreground mt-0.5">
                  serviceMap()
                </p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">hot path</p>
                <p className="text-sm font-semibold font-display text-emerald-400 mt-0.5">
                  0 DB queries
                </p>
              </div>
              <div className="w-px h-8 bg-surface-border" />
              <div className="text-center">
                <p className="type-overline-mono text-muted-foreground">stream</p>
                <p className="text-sm font-semibold font-display text-foreground mt-0.5">push</p>
              </div>
            </div>
          </CodePanel>
        </motion.div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={Zap}
            title="Auto transport"
            description="Resolves the callee from the snapshot: direct mTLS when the endpoint is known, proxied through the runtime otherwise."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Activity}
            title="Live presence"
            description="Each worker holds the RegisterAndWatch stream open. Drop it and its instances are marked disconnected and removed from the snapshot."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Network}
            title="gRPC load balancing"
            description="Multiple instances of a service register the same methods. Direct calls spread across the alive replicas, scaling with instance count."
            iconClassName="text-violet-400"
          />
          <FeatureCard
            variant="compact"
            icon={RefreshCcw}
            title="Pushed snapshot"
            description="RegisterAndWatch pushes every registry update — instances, subscriptions, calls, policy — so serviceMap() stays current without polling."
            iconClassName="text-violet-400"
          />
        </>
      }
    />
  );
}
