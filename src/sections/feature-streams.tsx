import { motion, useInView } from "framer-motion";
import { Radio, Terminal, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { CodeBlock } from "../ui/CodeBlock";
import { SectionHeader } from "../ui/SectionHeader";

const WRITER_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY, "ai");

sb.handleEvent("ai.generate", async (payload, ctx) => {
  // Stream tokens to any subscriber in real-time
  for await (const token of llm.stream(payload.prompt)) {
    await ctx.stream.write({ token }, "output");
  }

  return { done: true };
});`;

const READER_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY);

// Trigger and watch
const runId = await sb.event("ai.generate", { prompt });

for await (const chunk of sb.watchRun(runId, { key: "output" })) {
  if (chunk.type === "run_complete") break;
  process.stdout.write(chunk.data.token);
}`;

const STREAM_LINES = [
  { seq: 1, text: "Distributed systems demand reliable" },
  { seq: 2, text: " communication patterns." },
  { seq: 3, text: " ServiceBridge provides exactly that —" },
  { seq: 4, text: " durable events with at-least-once" },
  { seq: 5, text: " delivery," },
  { seq: 6, text: " direct gRPC calls with zero" },
  { seq: 7, text: " proxy hops," },
  { seq: 8, text: " and real-time streaming for" },
  { seq: 9, text: " LLM outputs and progress updates." },
  { seq: 10, text: " Each message is stored in PostgreSQL," },
  { seq: 11, text: " so late subscribers can replay" },
  { seq: 12, text: " from the beginning." },
  { seq: 13, text: " Dead-letter queues catch failures." },
  { seq: 14, text: " Retry policies apply exponential backoff." },
  { seq: 15, text: " ✓ run_complete" },
];

const INTERVAL_MS = 240;
const PAUSE_AFTER_MS = 2800;

function LiveTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState<typeof STREAM_LINES>([]);

  // Single stable ref — no new closures on each loop iteration
  const ctrl = useRef<{ cancelled: boolean; timer: ReturnType<typeof setTimeout> | null }>({
    cancelled: false,
    timer: null,
  });

  useEffect(() => {
    if (!inView) return;

    const c = ctrl.current;
    c.cancelled = false;
    let i = 0;

    const tick = () => {
      if (c.cancelled) return;

      if (i >= STREAM_LINES.length) {
        // Show completed state, then clear and restart
        c.timer = setTimeout(() => {
          if (c.cancelled) return;
          setVisibleLines([]);
          i = 0;
          c.timer = setTimeout(tick, 400);
        }, PAUSE_AFTER_MS);
        return;
      }

      const line = STREAM_LINES[i];
      if (line != null) {
        setVisibleLines((prev) => [...prev, line]);
      }
      i++;
      c.timer = setTimeout(tick, INTERVAL_MS);
    };

    c.timer = setTimeout(tick, INTERVAL_MS);

    return () => {
      c.cancelled = true;
      if (c.timer !== null) {
        clearTimeout(c.timer);
        c.timer = null;
      }
    };
  }, [inView]);

  return (
    <div
      ref={ref}
      className="rounded-xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl"
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-zinc-900/60">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-zinc-500 font-mono">run:stream:chunk — output</span>
        {visibleLines.length > 0 && visibleLines.length < STREAM_LINES.length && (
          <span className="ml-auto flex items-center gap-1.5 text-3xs text-amber-400 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            live
          </span>
        )}
        {visibleLines.length === STREAM_LINES.length && (
          <span className="ml-auto flex items-center gap-1.5 text-3xs text-emerald-400 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            complete
          </span>
        )}
      </div>

      {/* Stream output */}
      <div className="p-4 font-mono text-xs space-y-0.5 min-h-[200px]">
        {visibleLines
          .filter((line): line is (typeof STREAM_LINES)[number] => line != null && "seq" in line)
          .map((line, idx, arr) => (
            <motion.div
              key={line.seq}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="flex gap-3 leading-5"
            >
              <span className="text-zinc-600 select-none w-6 text-right shrink-0">
                {String(line.seq).padStart(4, "0")}
              </span>
              <span className={idx === arr.length - 1 ? "text-emerald-400" : "text-zinc-300"}>
                {line.text}
              </span>
            </motion.div>
          ))}
        {visibleLines.length < STREAM_LINES.length && visibleLines.length > 0 && (
          <div className="flex gap-3 leading-5">
            <span className="text-zinc-600 select-none w-6 text-right shrink-0">
              {String(visibleLines.length + 1).padStart(4, "0")}
            </span>
            <span className="text-zinc-600 animate-pulse">▊</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StreamsSection() {
  const [tab, setTab] = useState<"writer" | "reader">("writer");

  return (
    <AnimatedSection id="streams" className="py-24 sm:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="Realtime Streams"
          title={
            <>
              Stream data <span className="text-primary">as it happens</span>
            </>
          }
          subtitle="Push incremental chunks from any handler while it executes. Subscribers — UI or SDK — receive every token the moment it's written."
        />

        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
        >
          {/* Left: code */}
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
              {(["writer", "reader"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "writer" ? (
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" />
                      Writer
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Reader
                    </span>
                  )}
                </button>
              ))}
            </div>

            <CodeBlock
              filename={tab === "writer" ? "ai-service.ts" : "subscriber.ts"}
              code={tab === "writer" ? WRITER_CODE : READER_CODE}
            />

            {/* Feature bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { icon: Terminal, label: "Any handler", desc: "Events, RPC, workflows" },
                { icon: Radio, label: "Named keys", desc: "output, log, progress…" },
                { icon: Zap, label: "Replay-safe", desc: "Late subscribers catch up" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border bg-card/50 p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live terminal demo */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Live preview — chunks arrive as the handler executes
            </p>
            <LiveTerminal />
            <p className="text-xs text-muted-foreground">
              Both the UI dashboard and SDK{" "}
              <code className="font-mono text-primary">sb.watchRun()</code> receive chunks through
              the same pipeline.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
