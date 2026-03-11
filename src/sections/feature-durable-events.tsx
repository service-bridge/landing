import { motion } from "framer-motion";
import { Database, Radio, RefreshCcw, ShieldAlert } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { cn } from "../lib/utils";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";
import { FlowTile, SectionTag } from "./feature-shared";

const EVENT_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "notifications");

sb.handleEvent("order.created", async (payload, ctx) => {
  const sent = await sendEmail(payload);
  if (!sent) ctx.retry(30_000);
});

await sb.event("order.created", {
  orderId: "ord_123",
  amount: 4990,
});`;

export function DurableEventsSection() {
  const subscriberCards = [
    {
      name: "payments",
      state: "delivered",
      tone: "text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/20",
    },
    {
      name: "inventory",
      state: "retry in 30s",
      tone: "text-amber-300 bg-amber-500/[0.08] border-amber-500/20",
    },
    {
      name: "notify",
      state: "delivered",
      tone: "text-blue-300 bg-blue-500/[0.08] border-blue-500/20",
    },
  ];

  return (
    <AnimatedSection id="durable-events" className="py-24 border-t border-white/[0.04]">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Durable Events"
          title="Publish once. Retry safely. Replay anything."
          subtitle="Durable event delivery is built into the runtime: wildcard topics, per-message retries, DLQ capture, and batch replay from the UI or gRPC."
        />

        <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="type-overline-mono text-zinc-500">delivery contract</p>
              <h3 className="mt-2 text-xl font-semibold font-display">
                At-least-once with DLQ safety built into the same API.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Subscribers can fail, back off, and recover without you wiring up a separate broker
                stack or writing replay tooling by hand.
              </p>
            </div>

            <CodeBlock code={EVENT_CODE} filename="notifications.ts" />

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <MiniCard
                icon={Radio}
                title="Wildcard matching"
                desc="Subscribe with patterns like `order.*` and filter just the flows a service needs."
                iconClassName="text-blue-400"
              />
              <MiniCard
                icon={RefreshCcw}
                title="Built-in retries"
                desc="`ctx.retry()` keeps retry intent with the message instead of scattering timers in app code."
                iconClassName="text-amber-400"
              />
              <MiniCard
                icon={ShieldAlert}
                title="Replay from DLQ"
                desc="Failed deliveries stay inspectable and replayable from UI or gRPC without touching SQL."
                iconClassName="text-red-400"
              />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7"
          >
            <div className="rounded-3xl border border-white/[0.06] bg-[#081018] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="type-overline-mono text-zinc-500">event pipeline</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    `order.created` is persisted first, then fanned out across matching subscribers.
                  </p>
                </div>
                <SectionTag tone="border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                  at-least-once
                </SectionTag>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[168px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
                  <p className="text-xs font-semibold font-display text-blue-200">orders</p>
                  <p className="mt-1 text-2xs font-mono text-blue-100/70">publish order.created</p>
                  <div className="mt-4 flex items-center gap-2 text-2xs text-blue-100/70">
                    <Radio className="h-3.5 w-3.5" />
                    <span>one publish call</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Database className="h-4 w-4 text-violet-300" />
                      durable queue + delivery ledger
                    </div>
                    <span className="text-2xs font-mono text-zinc-500">PostgreSQL</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {subscriberCards.map((card) => (
                      <div
                        key={card.name}
                        className={cn("rounded-2xl border px-4 py-3", card.tone)}
                      >
                        <p className="text-xs font-semibold font-display">{card.name}</p>
                        <p className="mt-1 text-2xs font-mono opacity-80">{card.state}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RefreshCcw className="h-4 w-4 text-amber-400" />
                  Retry ledger
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  {[
                    "inventory.reserve  attempt 1  timeout",
                    "inventory.reserve  attempt 2  backoff 30s",
                    "inventory.reserve  attempt 3  delivered",
                  ].map((row) => (
                    <div
                      key={row}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 font-mono text-zinc-400"
                    >
                      {row}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
                  <ShieldAlert className="h-4 w-4" />
                  DLQ ready for replay
                </div>
                <p className="mt-3 text-sm leading-relaxed text-red-100/70">
                  Messages that still fail stay visible with full payload, error context, and replay
                  controls instead of disappearing into logs.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-2xs font-mono">
                  <FlowTile label="replay" value="UI or gRPC" tone="text-red-200" />
                  <FlowTile label="inspect" value="payload + cause" tone="text-red-200" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
