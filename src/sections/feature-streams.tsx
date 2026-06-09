import { motion, useInView } from "framer-motion";
import { ArrowRight, Radio, Terminal, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CodeLangs } from "../lib/language-context";
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import { MultiCodeBlock } from "../ui/CodeBlock";
import { CodePanel } from "../ui/CodePanel";
import { FeatureCard } from "../ui/FeatureCard";
import { FeatureSection } from "../ui/FeatureSection";
import { TabStrip } from "../ui/Tabs";

const WRITER_CODE: CodeLangs = {
  ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("api.example.com:14445", serviceKey);

// Server-streaming handler: an async generator that yields chunks.
sb.rpc.handleStream("generate", async function* (req) {
  for await (const token of llm.stream(req.prompt)) {
    yield { token };
  }
}, { schema: { protoFile: "./ai.proto", method: "Generate" } });

await sb.start();`,

  go: undefined,
  py: undefined,
};

const READER_CODE: CodeLangs = {
  ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("api.example.com:14445", serviceKey);

sb.service("ai-service", { rpc: ["generate"] });
await sb.start();

// sb.stream returns an AsyncIterable — chunks arrive over direct gRPC.
for await (const chunk of sb.stream("ai-service", "generate", { prompt })) {
  process.stdout.write(chunk.token);
}`,

  go: undefined,
  py: undefined,
};

const STREAM_LINES = [
  { seq: 1, text: "Distributed systems demand reliable" },
  { seq: 2, text: " communication patterns." },
  { seq: 3, text: " ServiceBridge provides exactly that —" },
  { seq: 4, text: " server-streaming RPC over direct" },
  { seq: 5, text: " caller-to-callee mTLS." },
  { seq: 6, text: " A handler yields chunks one" },
  { seq: 7, text: " at a time," },
  { seq: 8, text: " and the caller receives every" },
  { seq: 9, text: " token the moment it's yielded." },
  { seq: 10, text: " Ideal for LLM token output" },
  { seq: 11, text: " and incremental progress." },
  { seq: 12, text: " No proxy hops, no sidecar." },
  { seq: 13, text: " Chunks decode against the" },
  { seq: 14, text: " method's Protobuf schema." },
  { seq: 15, text: " ✓ stream complete" },
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
            sb.stream(ai-service, generate)
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
      title="Server-streaming RPC over direct mTLS"
      subtitle="A handler yields chunks while it runs and the caller gets each one the instant it's yielded — caller-to-callee over direct mTLS gRPC, no proxy hop, no sidecar. Built for LLM token streaming and incremental progress."
      content={
        <div className="space-y-4">
          <Card>
            <p className="type-overline-mono text-muted-foreground mb-2">how it works</p>
            <p className="type-body-sm">
              <code className="font-mono text-emerald-400">handleStream()</code> is an async generator
              — each <code className="font-mono text-emerald-400">yield</code> pushes one chunk. The
              caller reads it via{" "}
              <code className="font-mono text-emerald-400">for await … of sb.stream()</code>; breaking
              the loop cancels the gRPC stream.
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
                tab === "writer" ? { ts: "ai-service.ts" } : { ts: "subscriber.ts" }
              }
              code={tab === "writer" ? WRITER_CODE : READER_CODE}
            />
          </div>
        </div>
      }
      demo={
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            Live preview — chunks arrive as the handler yields
          </p>
          <LiveTerminal />
          <p className="type-body-sm">
            Each chunk is decoded against the method's Protobuf schema.
          </p>
          <a href="#docs" className="inline-block">
            <Button variant="ghost" size="sm" className="gap-1.5">
              Read the streaming guide <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      }
      cards={
        <>
          <FeatureCard
            variant="compact"
            icon={Terminal}
            title="Async generators"
            description="Just an async generator — each yield is one chunk. No callbacks, no writer object."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Radio}
            title="Direct mTLS gRPC"
            description="Chunks flow caller-to-callee over direct mTLS — no proxy, no sidecar. Same transport as a unary call."
            iconClassName="text-emerald-400"
          />
          <FeatureCard
            variant="compact"
            icon={Zap}
            title="Schema-typed"
            description="Each chunk is decoded against the method's Protobuf schema."
            iconClassName="text-emerald-400"
          />
        </>
      }
    />
  );
}
