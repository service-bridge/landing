import { motion, useInView } from "framer-motion";
import { Radio, Terminal, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fadeInUp } from "../components/animations";
import type { CodeLangs } from "../lib/language-context";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

const WRITER_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY, "ai");

sb.handleEvent("ai.generate", async (payload, ctx) => {
  // Stream tokens to any subscriber in real-time
  for await (const token of llm.stream(payload.prompt)) {
    await ctx.stream.write({ token }, "output");
  }
  return { done: true };
});`,

  go: `svc := servicebridge.New(
    "api.example.com:14445", os.Getenv("SERVICE_KEY"), "ai", nil)

svc.HandleEvent("ai.generate",
    func(ctx context.Context, p json.RawMessage,
        ec *servicebridge.EventContext) error {
        // Stream tokens to any subscriber in real-time
        for _, token := range llm.Stream(ctx, getPrompt(p)) {
            _ = ec.Stream.Write(ctx,
                map[string]any{"token": token}, "output")
        }
        return nil
    }, nil)`,

  py: `from servicebridge import ServiceBridge

svc = ServiceBridge("api.example.com:14445", SERVICE_KEY, "ai")

@svc.handle_event("ai.generate")
async def on_generate(payload: dict, ctx) -> None:
    # Stream tokens to any subscriber in real-time
    async for token in llm.stream(payload["prompt"]):
        await ctx.stream.write({"token": token}, "output")`,
};

const READER_CODE: CodeLangs = {
  ts: `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY);

// Trigger and watch
const runId = await sb.event("ai.generate", { prompt });

for await (const chunk of sb.watchRun(runId, { key: "output" })) {
  if (chunk.type === "run_complete") break;
  process.stdout.write(chunk.data.token);
}`,

  go: `svc := servicebridge.New(
    "api.example.com:14445", os.Getenv("SERVICE_KEY"), "", nil)

// Trigger and watch
runID, _ := svc.Event(ctx, "ai.generate",
    map[string]any{"prompt": prompt}, nil)

events, _ := svc.WatchRun(ctx, runID,
    &servicebridge.WatchRunOpts{Keys: []string{"output"}})
for ev := range events {
    if ev.Error != nil { break }
    fmt.Print(ev.Data["token"])
}`,

  py: `from servicebridge import ServiceBridge, WatchRunOpts

svc = ServiceBridge("api.example.com:14445", SERVICE_KEY)

# Trigger and watch
run_id, _ = await svc.event("ai.generate", {"prompt": prompt})

async for chunk in svc.watch_run(
        run_id, WatchRunOpts(keys=["output"])):
    if chunk.error:
        break
    print(chunk.data["token"], end="", flush=True)`,
};

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
    <div ref={ref}>
      <CodePanel>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-code-chrome">
          <span className="text-xs text-zinc-500 font-mono">run:stream:chunk — output</span>
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
      </CodePanel>
    </div>
  );
}

export function StreamsSection() {
  const [tab, setTab] = useState<"writer" | "reader">("writer");

  return (
    <FeatureSection
      id="streams"
      eyebrow="Realtime Streams"
      title={
        <>
          Stream data <span className="text-gradient">as it happens</span>
        </>
      }
      subtitle="Push incremental chunks from any handler while it executes. Subscribers — UI or SDK — receive every token the moment it's written."
      content={
        <motion.div variants={fadeInUp} className="space-y-4">
          <TabStrip
            size="md"
            items={[
              { id: "writer", label: "Writer" },
              { id: "reader", label: "Reader" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <MultiCodeBlock
            filename={
              tab === "writer"
                ? { ts: "ai-service.ts", go: "ai_service.go", py: "ai_service.py" }
                : { ts: "subscriber.ts", go: "subscriber.go", py: "subscriber.py" }
            }
            code={tab === "writer" ? WRITER_CODE : READER_CODE}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: Terminal, label: "Any handler", desc: "Events, RPC, workflows" },
              { icon: Radio, label: "Named keys", desc: "output, log, progress…" },
              { icon: Zap, label: "Replay-safe", desc: "Late subscribers catch up" },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-primary">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <p className="type-body-sm">{desc}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      }
      demo={
        <motion.div variants={fadeInUp} className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            Live preview — chunks arrive as the handler executes
          </p>
          <LiveTerminal />
          <p className="type-body-sm">
            Both the UI dashboard and SDK{" "}
            <code className="font-mono text-primary">sb.watchRun()</code> receive chunks through
            the same pipeline.
          </p>
        </motion.div>
      }
    />
  );
}
