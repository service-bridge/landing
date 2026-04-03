import { motion, useInView } from "framer-motion";
import { Radio, Terminal, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CodeLangs } from "../lib/language-context";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

const WRITER_CODE: CodeLangs = {
  ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("api.example.com:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

sb.handleEvent("ai.generate", async (payload, ctx) => {
  // Stream tokens to any subscriber in real-time
  for await (const token of llm.stream(payload.prompt)) {
    await ctx.stream.write({ token }, "output");
  }
  return { done: true };
});`,

  go: `svc := servicebridge.New(
    "api.example.com:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

svc.HandleEvent("ai.generate",
    func(ctx context.Context, p json.RawMessage,
        ec *servicebridge.EventContext) error {
        for _, token := range llm.Stream(ctx, getPrompt(p)) {
            _ = ec.Stream.Write(ctx,
                map[string]any{"token": token}, "output")
        }
        return nil
    }, nil)`,

  py: `from service_bridge import ServiceBridge

svc = ServiceBridge("api.example.com:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

@svc.handle_event("ai.generate")
async def on_generate(payload: dict, ctx) -> None:
    async for token in llm.stream(payload["prompt"]):
        await ctx.stream.write({"token": token}, "output")`,
};

const READER_CODE: CodeLangs = {
  ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge("api.example.com:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!);

const traceId = await sb.event("ai.generate", { prompt });

for await (const chunk of sb.watchTrace(traceId, { key: "output" })) {
  if (chunk.type === "trace_complete") break;
  process.stdout.write(chunk.data.token);
}`,

  go: `svc := servicebridge.New(
    "api.example.com:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

traceID, _ := svc.Event(ctx, "ai.generate",
    map[string]any{"prompt": prompt}, nil)

ch, _ := svc.WatchTrace(ctx, traceID, &servicebridge.WatchTraceOpts{Key: "output"})
for ev := range ch {
    var data map[string]any
    json.Unmarshal(ev.Data, &data)
    if token, ok := data["token"].(string); ok { fmt.Print(token) }
    if ev.Done { break }
}`,

  py: `from service_bridge import ServiceBridge, WatchTraceOpts

svc = ServiceBridge("api.example.com:14445", os.environ["SERVICEBRIDGE_SERVICE_KEY"])

trace_id, _ = await svc.event("ai.generate", {"prompt": prompt})

async for chunk in svc.watch_trace(trace_id, WatchTraceOpts(key="output")):
    if chunk.done:
        break
    print(chunk.data.get("token", ""), end="", flush=True)`,
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
  { seq: 15, text: " ✓ trace_complete" },
];

const INTERVAL_MS = 240;
const PAUSE_AFTER_MS = 2800;

function LiveTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState<typeof STREAM_LINES>([]);

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
        c.timer = setTimeout(() => {
          if (c.cancelled) return;
          setVisibleLines([]);
          i = 0;
          c.timer = setTimeout(tick, 400);
        }, PAUSE_AFTER_MS);
        return;
      }
      const line = STREAM_LINES[i];
      if (line != null) setVisibleLines((prev) => [...prev, line]);
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

  const isLive = visibleLines.length > 0 && visibleLines.length < STREAM_LINES.length;
  const isDone = visibleLines.length === STREAM_LINES.length;

  return (
    <div ref={ref}>
      <CodePanel>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-code-chrome">
          <span className="text-xs text-muted-foreground/70 font-mono">
            run:stream:chunk — output
          </span>
          {isLive && (
            <span className="ml-auto flex items-center gap-1.5 text-3xs text-amber-400 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              live
            </span>
          )}
          {isDone && (
            <span className="ml-auto flex items-center gap-1.5 text-3xs text-emerald-400 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              complete
            </span>
          )}
        </div>

        <div className="p-4 font-mono text-xs space-y-0.5 min-h-[200px]">
          {visibleLines.map((line, idx, arr) => (
            <motion.div
              key={line.seq}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="flex gap-3 leading-5"
            >
              <span className="text-muted-foreground/60 select-none w-6 text-right shrink-0">
                {String(line.seq).padStart(4, "0")}
              </span>
              <span
                className={idx === arr.length - 1 ? "text-emerald-400" : "text-muted-foreground"}
              >
                {line.text}
              </span>
            </motion.div>
          ))}
          {isLive && (
            <div className="flex gap-3 leading-5">
              <span className="text-muted-foreground/60 select-none w-6 text-right shrink-0">
                {String(visibleLines.length + 1).padStart(4, "0")}
              </span>
              <span className="text-muted-foreground/60 animate-pulse">▊</span>
            </div>
          )}
        </div>
      </CodePanel>
    </div>
  );
}

export function StreamsSection() {
  const [tab, setTab] = useState<"writer" | "reader">("writer");

  const allStreamCodes = [WRITER_CODE, READER_CODE];
  const maxStreamLines = Math.max(
    ...allStreamCodes.flatMap((c) =>
      Object.values(c).map((v) => (v ?? "").trim().split("\n").length)
    )
  );
  const minStreamCodeHeight = maxStreamLines * 20 + 40;

  return (
    <FeatureSection
      id="streams"
      eyebrow="Realtime Streams"
      title="Stream data as it happens"
      subtitle="Push incremental chunks from any handler while it executes. Subscribers — UI or SDK — receive every token the moment it's written."
      content={
        <div className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground mb-2">how it works</p>
            <p className="type-body-sm">
              Any handler — event, RPC, or workflow step — can call{" "}
              <code className="font-mono text-emerald-400">ctx.stream.write()</code> while it runs.
              The SDK buffers chunks in PostgreSQL and pushes them to all watchers via WebSocket.
              Late subscribers catch up by replaying stored chunks.
            </p>
          </Card>

          <TabStrip
            size="md"
            items={[
              { id: "writer", label: "Writer" },
              { id: "reader", label: "Reader" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div style={{ minHeight: minStreamCodeHeight + 48 }}>
            <MultiCodeBlock
              filename={
                tab === "writer"
                  ? { ts: "ai-service.ts", go: "ai_service.go", py: "ai_service.py" }
                  : { ts: "subscriber.ts", go: "subscriber.go", py: "subscriber.py" }
              }
              code={tab === "writer" ? WRITER_CODE : READER_CODE}
            />
          </div>
        </div>
      }
      demo={
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            Live preview — chunks arrive as the handler executes
          </p>
          <LiveTerminal />
          <p className="type-body-sm">
            Both the UI dashboard and SDK{" "}
            <code className="font-mono text-emerald-400">sb.watchTrace()</code> receive chunks through
            the same pipeline.
          </p>
        </div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={Terminal}
            title="Any handler"
            description="Write stream chunks from event handlers, RPC functions, or workflow steps — the same API everywhere."
            iconClassName="text-muted-foreground"
          />
          <FeatureCard
            variant="compact"
            icon={Radio}
            title="Named keys"
            description="Use named stream keys (output, log, progress) to multiplex multiple data streams from a single run."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Zap}
            title="Replay-safe"
            description="Chunks are stored in PostgreSQL. Late subscribers catch up from the beginning — no data lost on reconnect."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
