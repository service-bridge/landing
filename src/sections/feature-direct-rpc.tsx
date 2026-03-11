import { motion } from "framer-motion";
import { CheckCircle2, Network, Zap } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";
import { FlowTile, SectionTag, ServicePill } from "./feature-shared";

const DIRECT_RPC_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "checkout");

sb.handleRpc("cart.submit", async (payload) => {
  const charge = await sb.rpc("payments.charge", {
    userId: payload.userId,
    amount: payload.total,
  });

  return { ok: charge.ok, receiptId: charge.receiptId };
});

await sb.serve();`;

export function DirectRpcSection() {
  return (
    <AnimatedSection id="direct-rpc" className="py-24 border-t border-white/[0.04]">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Direct RPC"
          title={
            <>
              Direct gRPC path.{" "}
              <span className="text-gradient">Control plane stays off the payload path.</span>
            </>
          }
          subtitle="ServiceBridge handles discovery, endpoint updates, mTLS identity, and balancing. The request still goes service-to-service with zero proxy hops."
        />

        <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] max-w-6xl mx-auto">
          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ServicePill title="checkout" subtitle="caller service" tone="text-yellow-300" />
                <div className="min-w-0 flex-1">
                  <div className="relative h-px overflow-hidden bg-gradient-to-r from-yellow-400/30 via-primary/40 to-yellow-400/30">
                    <motion.span
                      className="absolute top-1/2 h-2 w-2 rounded-full bg-yellow-400"
                      style={{ transform: "translateY(-50%)" }}
                      animate={{ left: ["-2%", "102%"] }}
                      transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-3xs font-mono text-zinc-500">
                    <span>request</span>
                    <span className="text-yellow-400">direct gRPC</span>
                    <span>response</span>
                  </div>
                </div>
                <ServicePill
                  title="payments.charge"
                  subtitle="worker endpoint"
                  tone="text-emerald-300"
                />
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-[#080d18] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="type-overline-mono text-zinc-500">discovery stream</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      Workers register once. Callers stay subscribed to live endpoint updates.
                    </p>
                  </div>
                  <SectionTag tone="border-primary/20 bg-primary/[0.08] text-primary">
                    discovery only
                  </SectionTag>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <FlowTile
                    label="register"
                    value="serve() publishes endpoint + schema"
                    tone="text-blue-300"
                  />
                  <FlowTile
                    label="watch"
                    value="callers receive registry snapshot stream"
                    tone="text-cyan-300"
                  />
                  <FlowTile
                    label="dial"
                    value="sdk opens direct worker connection"
                    tone="text-emerald-300"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FlowTile label="proxy hops" value="0" tone="text-yellow-400" />
                <FlowTile label="identity" value="mTLS cert CN" tone="text-violet-300" />
                <FlowTile
                  label="balancing"
                  value="round-robin per caller"
                  tone="text-emerald-300"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="type-overline-mono text-zinc-500">same sdk call</p>
              <h3 className="mt-2 text-xl font-semibold font-display">
                No mesh sidecars, no proxy tier, no extra call syntax.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                `rpc()` stays small in application code while the runtime keeps the endpoint list
                hot, routes around dead instances, and validates who can call whom.
              </p>
            </div>

            <CodeBlock code={DIRECT_RPC_CODE} filename="checkout-service.ts" />

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <MiniCard
                icon={Zap}
                title="Near-raw gRPC"
                desc="The direct path benchmarks at effectively the same throughput as raw gRPC."
                iconClassName="text-yellow-400"
              />
              <MiniCard
                icon={Network}
                title="Hot endpoint cache"
                desc="Registry updates arrive over streaming gRPC instead of slow polling or stale DNS."
                iconClassName="text-cyan-400"
              />
              <MiniCard
                icon={CheckCircle2}
                title="Policy enforced"
                desc="Allowed callers and service identity are checked before the handler ever runs."
                iconClassName="text-violet-400"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
