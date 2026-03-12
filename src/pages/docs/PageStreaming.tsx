import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageStreaming() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Streaming"
        description="Push real-time chunks from any handler — RPC or event — and consume them live with watchRun(). Chunks are stored and replayable. Built for LLM tokens, progress bars, log tailing, and AI agent output."
      />

      {/* ── How it works ─────────────────────────────────────────── */}
      <H2 id="how-it-works">How it works</H2>
      <P>
        Every handler execution writes into a <strong>run stream</strong> identified by{" "}
        <Mono>runId</Mono> (typically a trace ID).
        From inside the handler, call <Mono>ctx.stream.write(data, key)</Mono> to push chunks into
        that run's stream. Any process with the <Mono>runId</Mono> can subscribe via{" "}
        <Mono>watchRun()</Mono> — live or from the beginning. Chunks are persisted in PostgreSQL
        for the full retention period.
      </P>
      <P>
        Stream keys act as named lanes within a run. A handler can write to <Mono>"output"</Mono>,
        <Mono>"progress"</Mono>, and <Mono>"log"</Mono> simultaneously — consumers filter by key.
        Multiple handlers in the same run can write to the same key; chunks remain ordered by
        stream sequence.
      </P>

      {/* ── Getting runId ────────────────────────────────────────── */}
      <H2 id="get-run-id">Getting a runId</H2>
      <P>
        There are three patterns for obtaining the <Mono>runId</Mono> before calling{" "}
        <Mono>watchRun()</Mono>:
      </P>

      <H3 id="runid-trace">Pattern 1 — pass your own traceId</H3>
      <P>
        The most reliable pattern: generate a trace ID on the caller side, pass it to{" "}
        <Mono>rpc()</Mono> or <Mono>event()</Mono>, then use that same ID as the <Mono>runId</Mono>
        for <Mono>watchRun()</Mono>. The handler's run is always stored under the caller's
        trace ID.
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { randomUUID } from "crypto";

const traceId = randomUUID();

// Fire the call — non-blocking, we'll stream its output
const rpcPromise = sb.rpc("ai/generate", { prompt: "Hello" }, { traceId });

// Use the same ID to watch the stream immediately
for await (const evt of sb.watchRun(traceId, { key: "output", fromSequence: 0 })) {
  if (evt.type === "chunk") process.stdout.write((evt.data as { token: string }).token);
  if (evt.type === "run_complete") break;
}

await rpcPromise; // wait for the final return value`,
          go: `traceID := uuid.New().String()

// Start the call in a goroutine
go func() {
  svc.Rpc(servicebridge.WithTraceContext(ctx, traceID, ""), "ai/generate", payload, nil)
}()

// Watch the stream using the same trace ID
ch, _ := svc.WatchRun(ctx, traceID, &servicebridge.WatchRunOpts{Key: "output"})
for event := range ch {
  var data map[string]any
  json.Unmarshal(event.Data, &data)
  if token, ok := data["token"].(string); ok { fmt.Print(token) }
  if event.Done { break }
}`,
          py: `import asyncio, uuid
from service_bridge import WatchRunOpts

trace_id = str(uuid.uuid4())

# Fire the call
asyncio.create_task(sb.rpc("ai/generate", {"prompt": "Hello"}, trace_id=trace_id))

# Watch immediately using the same trace ID
async for event in sb.watch_run(trace_id, WatchRunOpts(key="output", from_sequence=0)):
    if token := event.data.get("token"):
        print(token, end="", flush=True)
    if event.done:
        break`,
        }}
      />

      <H3 id="runid-header">Pattern 2 — x-trace-id response header</H3>
      <P>
        When HTTP middleware is installed, the <Mono>x-trace-id</Mono> header is added to every
        response. The frontend can read it and pass it to a streaming endpoint:
      </P>
      <MultiCodeBlock
        code={{
          ts: `// Client (browser)
const res = await fetch("/api/generate", {
  method: "POST",
  body: JSON.stringify({ prompt: "Hello" }),
});
const runId = res.headers.get("x-trace-id")!;

// Then subscribe to SSE / WebSocket using runId
const es = new EventSource(\`/api/stream/\${runId}\`);`,
          go: `// Client (Go)
resp, _ := http.Post("http://api/api/generate", "application/json", body)
runID := resp.Header.Get("X-Trace-Id")

// Then subscribe to SSE using runID
req, _ := http.NewRequestWithContext(ctx, "GET", "http://api/stream/"+runID, nil)
streamResp, _ := client.Do(req)
// read SSE stream from streamResp.Body`,
          py: `# Client (Python)
import httpx
resp = httpx.post("http://api/api/generate", json={"prompt": "Hello"})
run_id = resp.headers["x-trace-id"]

# Then subscribe to SSE using run_id
async with httpx.AsyncClient() as client:
    async with client.stream("GET", f"http://api/stream/{run_id}") as sse:
        async for line in sse.aiter_lines():
            if line.startswith("data:"):
                print(line)`,
        }}
      />

      <H3 id="runid-workflow">Pattern 3 — from a workflow step</H3>
      <P>
        Inside a workflow, the <Mono>runId</Mono> of a step is its trace ID, which is visible in
        the dashboard Run Detail. Use it after the workflow completes to replay logged chunks.
      </P>

      {/* ── Writing chunks ───────────────────────────────────────── */}
      <H2 id="write-chunks">Writing chunks from a handler</H2>
      <P>
        Both <Mono>handleRpc</Mono> and <Mono>handleEvent</Mono> receive a <Mono>ctx</Mono> with{" "}
        <Mono>stream.write(data, key)</Mono>. Call it freely before returning the final result.
      </P>

      <H3 id="rpc-stream">From an RPC handler</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("ai/generate", async (payload: { prompt: string }, ctx) => {
  const stream = await callLLM(payload.prompt);
  for await (const chunk of stream) {
    await ctx?.stream.write({ token: chunk }, "output");
  }
  return { done: true };
});`,
          go: `svc.HandleRpcWithOpts("ai/generate",
  func(ctx context.Context, payload json.RawMessage, rpcCtx servicebridge.RpcContext) (any, error) {
    for _, token := range callLLM(ctx) {
      rpcCtx.Stream.Write(map[string]any{"token": token}, "output")
    }
    return map[string]any{"done": true}, nil
  }, nil)`,
          py: `@sb.handle_rpc("ai/generate")
async def generate(payload: dict, ctx) -> dict:
    async for chunk in call_llm(payload["prompt"]):
        await ctx.stream.write({"token": chunk}, "output")
    return {"done": True}`,
        }}
      />

      <H3 id="event-stream">From an event handler</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("orders.*", async (payload, ctx) => {
  const body = payload as { orderId: string };
  await ctx.stream.write({ status: "processing", orderId: body.orderId }, "progress");
  await fulfillOrder(body.orderId);
  await ctx.stream.write({ status: "done" }, "progress");
});`,
          go: `svc.HandleEvent("orders.*",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    ec.Stream.Write(map[string]any{"status": "processing"}, "progress")
    if err := fulfillOrder(ctx, payload); err != nil { return err }
    ec.Stream.Write(map[string]any{"status": "done"}, "progress")
    return nil
  }, nil)`,
          py: `@sb.handle_event("orders.*")
async def on_order(payload: dict, ctx) -> None:
    await ctx.stream.write({"status": "processing"}, "progress")
    await fulfill_order(payload)
    await ctx.stream.write({"status": "done"}, "progress")`,
        }}
      />

      {/* ── watchRun() ───────────────────────────────────────────── */}
      <H2 id="watch-run">watchRun() — consume the stream</H2>

      <H3 id="watch-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `watchRun(runId: string, opts?: WatchRunOpts): AsyncIterable<RunStreamEvent>`,
          go: `func (c *Client) WatchRun(ctx context.Context, runID string, opts *WatchRunOpts) (<-chan RunStreamEvent, error)`,
          py: `async def watch_run(run_id: str, opts: WatchRunOpts | None = None) -> AsyncIterator[RunStreamEvent]`,
        }}
      />

      <H3 id="watch-opts">Options</H3>
      <ParamTable
        rows={[
          { name: "key / Key / key", type: "string", default: '"default" (Node), "" (Go/Python)', desc: 'Stream key to filter by. Matches the key passed to stream.write(), e.g. "output", "progress".' },
          { name: "fromSequence / FromSequence / from_sequence", type: "number", default: "0", desc: "Replay from this sequence cursor. 0 = replay all past chunks, then follow live." },
        ]}
      />
      <Callout type="info">
        To avoid cross-SDK default differences, always pass <Mono>key</Mono> explicitly in <Mono>watchRun/watch_run</Mono> (for example, <Mono>"output"</Mono>).
      </Callout>

      {/* ── LLM streaming ────────────────────────────────────────── */}
      <H2 id="llm-streaming">LLM token streaming</H2>
      <MultiCodeBlock
        code={{
          ts: `const traceId = randomUUID();

// Fire and forget the RPC — it streams tokens while running
sb.rpc("ai/generate", { prompt: "Write a poem" }, { traceId });

for await (const evt of sb.watchRun(traceId, { key: "output", fromSequence: 0 })) {
  if (evt.type === "chunk") {
    process.stdout.write((evt.data as { token: string }).token ?? "");
  }
  if (evt.type === "run_complete") break;
}`,
          go: `traceID := uuid.New().String()
go svc.Rpc(servicebridge.WithTraceContext(ctx, traceID, ""), "ai/generate", payload, nil)

ch, err := svc.WatchRun(ctx, traceID, &servicebridge.WatchRunOpts{
  Key:          "output",
  FromSequence: 0,
})
for event := range ch {
  var data map[string]any
  json.Unmarshal(event.Data, &data)
  if token, ok := data["token"].(string); ok { fmt.Print(token) }
  if event.Done { break }
}`,
          py: `import asyncio, uuid
from service_bridge import WatchRunOpts

trace_id = str(uuid.uuid4())
asyncio.create_task(sb.rpc("ai/generate", {"prompt": "Write a poem"}, trace_id=trace_id))

async for event in sb.watch_run(trace_id, WatchRunOpts(key="output", from_sequence=0)):
    if isinstance(event.data, dict) and (token := event.data.get("token")):
        print(token, end="", flush=True)
    if event.done:
        break`,
        }}
      />

      {/* ── SSE endpoint ─────────────────────────────────────────── */}
      <H2 id="sse-endpoint">SSE endpoint (Node.js / Express)</H2>
      <P>
        A complete pattern: receive a prompt over HTTP, fire the RPC, stream tokens back to the
        browser via Server-Sent Events:
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { randomUUID } from "crypto";
import express from "express";

app.post("/api/generate", async (req, res) => {
  const traceId = randomUUID();
  const { prompt } = req.body as { prompt: string };

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("x-trace-id", traceId);   // client can use this to reconnect

  // Fire the RPC — don't await, we'll stream its output
  sb.rpc("ai/generate", { prompt }, { traceId }).catch(() => {});

  // Stream chunks to client as SSE events
  for await (const evt of sb.watchRun(traceId, { key: "output", fromSequence: 0 })) {
    if (evt.type === "chunk") {
      res.write(\`data: \${JSON.stringify(evt.data)}\\n\\n\`);
    }
    if (evt.type === "run_complete") break;
  }

  res.end();
});`,
          go: `// Chi / net/http
func handleGenerate(w http.ResponseWriter, r *http.Request) {
  traceID := uuid.New().String()
  var body struct{ Prompt string }
  json.NewDecoder(r.Body).Decode(&body)

  w.Header().Set("Content-Type", "text/event-stream")
  w.Header().Set("X-Trace-Id", traceID)
  flusher := w.(http.Flusher)

  go svc.Rpc(servicebridge.WithTraceContext(r.Context(), traceID, ""),
    "ai/generate", map[string]any{"prompt": body.Prompt}, nil)

  ch, _ := svc.WatchRun(r.Context(), traceID, &servicebridge.WatchRunOpts{Key: "output"})
  for evt := range ch {
    fmt.Fprintf(w, "data: %s\n\n", evt.Data)
    flusher.Flush()
    if evt.Done { break }
  }
}`,
          py: `# FastAPI
import asyncio, json, uuid
from fastapi.responses import StreamingResponse
from service_bridge import WatchRunOpts

@app.post("/api/generate")
async def generate(request: Request):
    trace_id = str(uuid.uuid4())
    body = await request.json()

    async def stream():
        asyncio.create_task(sb.rpc("ai/generate", body, trace_id=trace_id))
        async for evt in sb.watch_run(trace_id, WatchRunOpts(key="output", from_sequence=0)):
            yield f"data: {json.dumps(evt.data)}\n\n"
            if evt.done:
                break

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"X-Trace-Id": trace_id},
    )`,
        }}
      />

      <Callout type="warning">
        The run stream has a server-side per-subscriber ring buffer of <strong>256 chunks</strong>.
        If your consumer falls behind and the buffer overflows, it receives a{" "}
        <Mono>RunStreamDisconnectError</Mono> (retryable). Reconnect using the last received{" "}
        <Mono>sequence</Mono> in <Mono>fromSequence</Mono> to resume without missing chunks.
      </Callout>

      {/* ── Progress bars ────────────────────────────────────────── */}
      <H2 id="progress">Progress bars and status updates</H2>
      <MultiCodeBlock
        code={{
          ts: `// Handler
sb.handleRpc("reports/generate", async (payload, ctx) => {
  const rows = await db.fetchRows();
  for (let i = 0; i < rows.length; i++) {
    await ctx?.stream.write({ pct: Math.round((i / rows.length) * 100) }, "progress");
    await processRow(rows[i]);
  }
  const pdf = await renderPdf(rows);
  await ctx?.stream.write({ url: pdf.url }, "output");
  return { ok: true };
});

// Caller — watch progress key
import { randomUUID } from "crypto";
const payload = { reportId: "rpt_42" };
const traceId = randomUUID();
void sb.rpc("reports/generate", payload, { traceId });
for await (const evt of sb.watchRun(traceId, { key: "progress" })) {
  updateProgressBar((evt.data as { pct: number }).pct);
  if (evt.type === "run_complete") break;
}`,
          go: `// Handler
svc.HandleRpcWithOpts("reports/generate",
  func(ctx context.Context, payload json.RawMessage, rpcCtx servicebridge.RpcContext) (any, error) {
    rows := fetchRows(ctx)
    for i, row := range rows {
      pct := (i + 1) * 100 / len(rows)
      rpcCtx.Stream.Write(map[string]any{"pct": pct}, "progress")
      processRow(ctx, row)
    }
    url := renderPdf(ctx, rows)
    rpcCtx.Stream.Write(map[string]any{"url": url}, "output")
    return map[string]any{"ok": true}, nil
  }, nil)

// Caller — watch progress key
traceID := uuid.New().String()
payload := map[string]any{"report_id": "rpt_42"}
go svc.Rpc(servicebridge.WithTraceContext(ctx, traceID, ""), "reports/generate", payload, nil)
ch, _ := svc.WatchRun(ctx, traceID, &servicebridge.WatchRunOpts{Key: "progress"})
for evt := range ch {
  var data map[string]any
  json.Unmarshal(evt.Data, &data)
  if pct, ok := data["pct"].(float64); ok { updateProgressBar(int(pct)) }
  if evt.Done { break }
}`,
          py: `# Handler
@sb.handle_rpc("reports/generate")
async def generate(payload: dict, ctx) -> dict:
    rows = await db.fetch_rows()
    for i, row in enumerate(rows):
        pct = round((i + 1) / len(rows) * 100)
        await ctx.stream.write({"pct": pct}, "progress")
        await process_row(row)
    pdf = await render_pdf(rows)
    await ctx.stream.write({"url": pdf.url}, "output")
    return {"ok": True}

# Caller — watch progress key
import asyncio, uuid
from service_bridge import WatchRunOpts
payload = {"report_id": "rpt_42"}
trace_id = str(uuid.uuid4())
asyncio.create_task(sb.rpc("reports/generate", payload, trace_id=trace_id))
async for evt in sb.watch_run(trace_id, WatchRunOpts(key="progress")):
    update_progress_bar(evt.data["pct"])
    if evt.done:
        break`,
        }}
      />

      {/* ── RunStreamEvent shape ─────────────────────────────────── */}
      <H2 id="event-shape">RunStreamEvent shape</H2>
      <MultiCodeBlock
        code={{
          ts: `interface RunStreamEvent {
  type: "chunk" | "run_complete"; // "run_complete" on the final event
  runId: string;                  // watched run identifier
  key: string;                    // stream key ("output", "progress", ...)
  sequence: number;               // monotonic sequence — use in fromSequence to resume
  data: unknown;                  // JSON payload from stream.write()
  runStatus?: string;             // set on run_complete: "success" | "error" | "cancelled"
}`,
          go: `type RunStreamEvent struct {
  Sequence  int64
  Key       string
  Data      json.RawMessage
  Done      bool
  RunStatus string
}`,
          py: `@dataclass
class RunStreamEvent:
    sequence: int
    key: str
    data: Any
    done: bool
    run_status: str = ""`,
        }}
      />

      {/* ── Replay ───────────────────────────────────────────────── */}
      <H2 id="replay">Replay and resumability</H2>
      <P>
        Chunks are stored in PostgreSQL for the full <Mono>SERVICEBRIDGE_RETENTION_DAYS</Mono>{" "}
        period. Set <Mono>fromSequence: 0</Mono> to replay from the beginning — reconnecting
        clients catch up on missed chunks automatically without any extra handler logic.
      </P>
      <P>
        When the client reconnects after a disconnect, read the last received{" "}
        <Mono>evt.sequence</Mono> and pass it as <Mono>fromSequence</Mono> to skip already-received
        chunks and resume exactly where you left off.
      </P>

      <Callout type="tip">
        Run streams are visible in the dashboard — including stored chunk history. Useful for
        debugging AI agent outputs, reviewing LLM responses, and auditing long-running job progress
        after the fact.
      </Callout>
    </div>
  );
}
