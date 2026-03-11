import { motion } from "framer-motion";
import { Radio, Zap } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { SectionHeader } from "../ui/SectionHeader";

const RPC_BENCH = [
  { payload: "10 KB", sb: "~33,870", grpc: "~34,100", ratio: "~100%" },
  { payload: "100 KB", sb: "~13,710", grpc: "~13,800", ratio: "~100%" },
  { payload: "1 MB", sb: "~1,669", grpc: "~1,680", ratio: "~100%" },
];

const EVENT_BENCH = [
  {
    scenario: "Sequential publish",
    count: "500",
    sb: "~4,200 evt/s",
    rabbit: "~1,800 evt/s",
    ratio: "2.3x",
  },
  {
    scenario: "Burst c=50",
    count: "500",
    sb: "~12,500 evt/s",
    rabbit: "~3,200 evt/s",
    ratio: "3.9x",
  },
  {
    scenario: "Wildcard c=30",
    count: "300",
    sb: "~8,400 evt/s",
    rabbit: "~2,100 evt/s",
    ratio: "4x",
  },
];

export function BenchmarkSection() {
  return (
    <AnimatedSection className="py-24 border-y border-white/[0.04]" id="benchmarks">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Performance"
          title="Benchmarks that matter"
          subtitle="RPC matches raw gRPC. Events outperform traditional message brokers. All through one unified runtime."
        />

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* RPC bench */}
          <motion.div variants={fadeInUp}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">RPC throughput</span>
                <span className="ml-auto text-3xs font-mono text-zinc-500">
                  ServiceBridge vs raw gRPC
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-2xs uppercase tracking-wider text-zinc-500">
                      <th className="text-left px-5 py-3 font-semibold">Payload</th>
                      <th className="text-right px-5 py-3 font-semibold text-primary">
                        ServiceBridge
                      </th>
                      <th className="text-right px-5 py-3 font-semibold">Raw gRPC</th>
                      <th className="text-right px-5 py-3 font-semibold text-zinc-400">vs gRPC</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-white/[0.04]">
                    {RPC_BENCH.map((row) => (
                      <tr key={row.payload} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-zinc-300">{row.payload}</td>
                        <td className="px-5 py-3.5 text-right text-primary font-semibold">
                          {row.sb} rps
                        </td>
                        <td className="px-5 py-3.5 text-right text-zinc-400">{row.grpc} rps</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-zinc-400 font-semibold bg-white/[0.06] rounded-full px-2 py-0.5 text-2xs">
                            {row.ratio}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/[0.04] text-3xs text-zinc-600 font-mono">
                concurrency=24 · duration=8s · direct gRPC path (no proxy)
              </div>
            </div>
          </motion.div>

          {/* Event bench */}
          <motion.div variants={fadeInUp}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">Event throughput</span>
                <span className="ml-auto text-3xs font-mono text-zinc-500">
                  ServiceBridge vs RabbitMQ
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-2xs uppercase tracking-wider text-zinc-500">
                      <th className="text-left px-5 py-3 font-semibold">Scenario</th>
                      <th className="text-right px-5 py-3 font-semibold text-primary">
                        ServiceBridge
                      </th>
                      <th className="text-right px-5 py-3 font-semibold">RabbitMQ</th>
                      <th className="text-right px-5 py-3 font-semibold text-emerald-400">
                        Faster
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-white/[0.04]">
                    {EVENT_BENCH.map((row) => (
                      <tr key={row.scenario} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-zinc-300">{row.scenario}</span>
                          <span className="text-3xs text-zinc-600 ml-2">×{row.count}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-primary font-semibold">
                          {row.sb}
                        </td>
                        <td className="px-5 py-3.5 text-right text-zinc-400">{row.rabbit}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-emerald-400 font-semibold bg-emerald-400/10 rounded-full px-2 py-0.5 text-2xs">
                            {row.ratio}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-white/[0.04] text-3xs text-zinc-600 font-mono">
                burst c=50 · durable event() · at-least-once delivery pipeline
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          variants={fadeInUp}
          className="text-center text-xs text-muted-foreground mt-6 max-w-2xl mx-auto"
        >
          RPC benchmarks use direct gRPC path with Protobuf schemas. Event benchmarks measure
          durable event() publish + delivery pipeline. All tests on local machine — see repository
          for full methodology.
        </motion.p>
      </div>
    </AnimatedSection>
  );
}
