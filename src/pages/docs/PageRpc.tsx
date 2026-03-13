import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageRpc() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="RPC"
        description="Direct service-to-service calls over mTLS-secured gRPC — no proxy hops, no broker, sub-millisecond overhead."
      />

      <Callout type="tip">
        Zero proxy hops in the data plane. Built-in load balancing, retries, and distributed
        tracing — without a service mesh.
      </Callout>

      {/* ── rpc() ────────────────────────────────────────────────── */}
      <H2 id="rpc-call">rpc() — call a handler</H2>
      <P>
        Call any registered <Mono>handleRpc</Mono> handler on another service. The runtime resolves
        the target address automatically from its in-memory registry — zero SQL on every call.
        If multiple instances are running, calls are automatically round-robin balanced.
      </P>

      <H3 id="rpc-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `rpc<T = unknown>(fn: string, payload?: unknown, opts?: RpcOpts): Promise<T>`,
          go: `func (c *Client) Rpc(ctx context.Context, fn string, payload any, opts *RpcOpts) (json.RawMessage, error)`,
          py: `async def rpc(fn: str, payload: Any = None, *, retries: int | None = None, timeout_ms: int | None = None, retry_delay_ms: int | None = None, trace_id: str = "") -> Any`,
        }}
      />

      <H3 id="rpc-opts">Options</H3>
      <ParamTable
        rows={[
          { name: "fn", type: "string", desc: 'Target in "service/method" format, e.g. "payments/charge". Use canonical form to avoid ambiguity.' },
          { name: "payload", type: "any", default: "undefined", desc: "JSON-serialisable request payload." },
          { name: "timeout / timeout_ms / TimeoutMs", type: "number (ms)", default: "30000 (from Options)", desc: "Per-attempt timeout. Total wall time is bounded by roughly (retries + 1) × timeout plus backoff." },
          { name: "retries / Retries", type: "number", default: "3 (from Options)", desc: "Retry count on transient failures. Each retry uses exponential backoff." },
          { name: "retryDelay (Node, per-call) / retry_delay_ms (Python, per-call) / RetryDelayMs (Go, per-call)", type: "number (ms)", default: "300 (from Options)", desc: "Base backoff delay. Formula: delay × 2^(attempt-1). Available in all SDKs as a per-call override." },
          { name: "traceId", type: "string", default: "auto", desc: "Pass your own trace ID to correlate the call with watchRun() or an HTTP request." },
          { name: "parentSpanId (Node)", type: "string", default: "auto", desc: "Override the parent span ID." },
        ]}
      />

      <H3 id="rpc-example">Examples</H3>
      <MultiCodeBlock
        code={{
          ts: `// Basic call
const user = await sb.rpc<{ id: string; name: string }>("users/get", { id: "u_1" });

// With options — 2 retries, 5 s timeout, explicit trace ID
const result = await sb.rpc<{ ok: boolean; txId: string }>("payments/charge", {
  orderId: "ord_42",
  amount: 4990,
}, {
  timeout: 5000,
  retries: 2,
  traceId: "trace-ord-42",  // use this ID in watchRun() for streaming
});`,
          go: `// Basic call
result, err := svc.Rpc(ctx, "users/get", map[string]any{"id": "u_1"}, nil)

// With options
result, err = svc.Rpc(ctx, "payments/charge", map[string]any{
  "order_id": "ord_42",
  "amount":   4990,
}, &servicebridge.RpcOpts{
  Retries:   2,
  TimeoutMs: 5000,
})`,
          py: `# Basic call
user = await sb.rpc("users/get", {"id": "u_1"})

# With options
result = await sb.rpc(
    "payments/charge",
    {"order_id": "ord_42", "amount": 4990},
    retries=2,
    timeout_ms=5000,
    trace_id="trace-ord-42",
)`,
        }}
      />

      <Callout type="info">
        Service discovery is zero-latency at steady state — endpoint addresses are kept in an
        in-memory snapshot, no SQL on every call. If a target service has <strong>no alive instances</strong>,
        the call fails immediately with a "not found" error rather than waiting for the full timeout.
      </Callout>

      <Callout type="warning">
        <Mono>rpc()</Mono> calls are <strong>not buffered offline</strong>. Unlike{" "}
        <Mono>event()</Mono>, <Mono>job()</Mono>, and <Mono>workflow()</Mono>, an RPC call fails
        immediately (after retries) if the target service is unreachable. Use events or workflows
        for operations that must survive transient outages.
      </Callout>

      <Callout type="info">
        If a target service accepts a call but does not respond, the SDK still terminates each
        attempt at the configured timeout and moves to the next retry (if any). The call cannot
        stay in pending forever.
      </Callout>

      <H3 id="rpc-errors">Error handling</H3>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridgeError } from "service-bridge";

try {
  await sb.rpc("payments/charge", { orderId: "ord_1" });
} catch (e) {
  if (e instanceof ServiceBridgeError) {
    console.error(e.component, e.operation, e.severity, e.code, e.retryable);
  }
  throw e;
}`,
          go: `result, err := svc.Rpc(ctx, "payments/charge", payload, nil)
if err != nil {
  var sbErr *servicebridge.ServiceBridgeError
  if errors.As(err, &sbErr) {
    log.Printf("component=%s op=%s severity=%s retryable=%v code=%v",
      sbErr.Component, sbErr.Operation, sbErr.Severity, sbErr.Retryable, sbErr.Code)
  }
}`,
          py: `from service_bridge import ServiceBridgeError

try:
    await sb.rpc("payments/charge", {"order_id": "ord_1"})
except ServiceBridgeError as e:
    print(e.component, e.operation, e.severity, e.code, e.retryable)
    raise`,
        }}
      />

      {/* ── handleRpc() ──────────────────────────────────────────── */}
      <H2 id="handle-rpc">handleRpc() — register a handler</H2>
      <P>
        Register a function that callers can invoke by name. The SDK starts a gRPC server on{" "}
        <Mono>serve()</Mono> — only the ServiceBridge control plane can call in, authenticated
        via mTLS. Unauthorized callers are rejected before the handler runs.
      </P>

      <H3 id="handle-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `handleRpc(
  fn: string,
  handler: (payload: unknown, ctx?: RpcContext) => unknown | Promise<unknown>,
  opts?: HandleRpcOpts,
): ServiceBridgeService`,
          go: `// Simple handler
func (c *Client) HandleRpc(fn string, handler func(ctx context.Context, payload json.RawMessage) (any, error)) *Client

// With RpcContext (stream + trace)
func (c *Client) HandleRpcWithOpts(fn string, handler func(ctx context.Context, payload json.RawMessage, rpcCtx servicebridge.RpcContext) (any, error), opts *HandleRpcOpts) *Client`,
          py: `@sb.handle_rpc(fn: str, *, allowed_callers: list[str] | None = None, schema: RpcSchemaOpts | None = None)
async def handler(payload: dict, ctx = None) -> dict: ...`,
        }}
      />

      <H3 id="handle-opts">Handler options</H3>
      <ParamTable
        rows={[
          { name: "fn", type: "string", desc: "Handler name. Callers reference it as service/fn." },
          { name: "allowedCallers / allowed_callers", type: "string[]", desc: "If non-empty, only listed service names can call this handler. Enforced via mTLS peer CN." },
          { name: "schema", type: "RpcSchemaOpts", desc: "Enable binary Protobuf encoding for this function. See Protobuf schema section below." },
          { name: "timeout (Node)", type: "number (ms)", desc: "Handler execution timeout hint (accepted by runtime, not yet enforced client-side)." },
          { name: "retryable (Node)", type: "boolean", default: "true", desc: "Hint to callers whether the call is safe to retry." },
          { name: "concurrency (Node)", type: "number", desc: "Worker-side concurrency limit hint." },
        ]}
      />
      <Callout type="info">
        Cross-SDK parity: <Mono>allowedCallers</Mono>/<Mono>allowed_callers</Mono> and <Mono>schema</Mono> are available in all SDKs.
        Node-only <Mono>timeout</Mono>/<Mono>retryable</Mono>/<Mono>concurrency</Mono> are currently hint fields.
      </Callout>

      <H3 id="handle-basic">Basic handler</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("greet", async (payload: { name: string }) => {
  return { message: \`Hello, \${payload.name}!\` };
});`,
          go: `svc.HandleRpc("greet", func(ctx context.Context, payload json.RawMessage) (any, error) {
  var req struct{ Name string \`json:"name"\` }
  json.Unmarshal(payload, &req)
  return map[string]any{"message": "Hello, " + req.Name + "!"}, nil
})`,
          py: `@sb.handle_rpc("greet")
async def greet(payload: dict) -> dict:
    return {"message": f"Hello, {payload['name']}!"}`,
        }}
      />

      <H3 id="handle-streaming">Streaming responses</H3>
      <P>
        The <Mono>ctx</Mono> argument exposes a <Mono>stream.write(data, key)</Mono> method. Push
        real-time chunks to the caller before returning the final result. Chunks are stored
        and replayable via <Mono>watchRun()</Mono>. See the{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() => document.dispatchEvent(new CustomEvent("sb-nav", { detail: "streaming" }))}
        >
          Streaming
        </button>{" "}
        page for full examples.
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("ai/generate", async (payload: { prompt: string }, ctx) => {
  const tokens = await callLLM(payload.prompt);
  for (const token of tokens) {
    await ctx?.stream.write({ token }, "output");
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
    async for token in call_llm(payload["prompt"]):
        await ctx.stream.write({"token": token}, "output")
    return {"done": True}`,
        }}
      />

      <H3 id="handle-acl">Access control</H3>
      <P>
        Restrict which services can call a handler using <Mono>allowedCallers</Mono>. Registry-level
        enforcement comes from the API key's configured <Mono>allowed_callers</Mono> list. The
        SDK's <Mono>allowedCallers</Mono> option controls worker-side gRPC authentication (mTLS CN
        checking). Set both the SDK option AND the API key's <Mono>allowed_callers</Mono> policy
        for defense in depth.
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("charge", handler, {
  allowedCallers: ["orders", "api-gateway"],
});`,
          go: `svc.HandleRpcWithOpts("charge", handler,
  &servicebridge.HandleRpcOpts{AllowedCallers: []string{"orders", "api-gateway"}},
)`,
          py: `@sb.handle_rpc("charge", allowed_callers=["orders", "api-gateway"])
async def charge(payload: dict) -> dict:
    ...`,
        }}
      />

      {/* ── Protobuf schema ──────────────────────────────────────── */}
      <H2 id="protobuf-schema">Protobuf schema — binary encoding</H2>
      <P>
        By default, RPC payloads are JSON. Pass a <Mono>schema</Mono> to switch to binary
        Protobuf encoding for a specific function — no <Mono>.proto</Mono> files, no codegen,
        no build step. Define the schema inline in code:
      </P>

      <Callout type="tip">
        Protobuf mode is most valuable for high-frequency calls with large or structured payloads.
        The schema is stored in the registry — callers automatically detect it via{" "}
        <Mono>LookupFunction</Mono> and switch to binary encoding transparently. No caller-side code
        changes needed.
      </Callout>

      <H3 id="schema-handler">Handler</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("payments/charge", chargeHandler, {
  schema: {
    input: {
      userId:   { type: "string", id: 1 },
      amount:   { type: "int64",  id: 2 },
      currency: { type: "string", id: 3 },
    },
    output: {
      ok:   { type: "bool",   id: 1 },
      txId: { type: "string", id: 2 },
    },
  },
});`,
          go: `svc.HandleRpcWithOpts("payments/charge", chargeHandler,
  &servicebridge.HandleRpcOpts{
    Schema: &servicebridge.RpcSchemaOpts{
      Input: servicebridge.RpcSchema{
        "user_id":  {Type: servicebridge.RpcString, ID: 1},
        "amount":   {Type: servicebridge.RpcInt64,  ID: 2},
        "currency": {Type: servicebridge.RpcString, ID: 3},
      },
      Output: servicebridge.RpcSchema{
        "ok":    {Type: servicebridge.RpcBool,   ID: 1},
        "tx_id": {Type: servicebridge.RpcString, ID: 2},
      },
    },
  },
)`,
          py: `from service_bridge import RpcSchemaOpts, RpcFieldDef

@sb.handle_rpc("payments/charge", schema=RpcSchemaOpts(
    input={
        "user_id":  RpcFieldDef(type="string", id=1),
        "amount":   RpcFieldDef(type="int64",  id=2),
        "currency": RpcFieldDef(type="string", id=3),
    },
    output={
        "ok":    RpcFieldDef(type="bool",   id=1),
        "tx_id": RpcFieldDef(type="string", id=2),
    },
))
async def charge(payload: dict) -> dict:
    return {"ok": True, "tx_id": "tx_abc"}`,
        }}
      />

      <H3 id="schema-caller">Caller</H3>
      <MultiCodeBlock
        code={{
          ts: `// No changes needed — SDK auto-detects schema via registry and switches to Protobuf
const res = await sb.rpc<{ txId: string; ok: boolean }>(
  "payments/charge",
  { userId: "u_42", amount: 9900, currency: "USD" }
);`,
          go: `// No changes needed — SDK auto-detects schema via registry and switches to Protobuf
res, err := svc.Rpc(ctx, "payments/charge", map[string]any{
  "user_id":  "u_42",
  "amount":   9900,
  "currency": "USD",
}, nil)`,
          py: `# No changes needed — SDK auto-detects schema via registry and switches to Protobuf
res = await sb.rpc(
    "payments/charge",
    {"user_id": "u_42", "amount": 9900, "currency": "USD"}
)`,
        }}
      />

      <H3 id="schema-types">Supported field types</H3>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Type string</th>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Go constant</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Wire type</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["string", "RpcString", "Protobuf string (varint-length-prefixed)"],
              ["int32", "RpcInt32", "Protobuf int32 (varint)"],
              ["int64", "RpcInt64", "Protobuf int64 (varint)"],
              ["uint32", "RpcUint32", "Protobuf uint32 (varint, unsigned)"],
              ["uint64", "RpcUint64", "Protobuf uint64 (varint, unsigned)"],
              ["bool", "RpcBool", "Protobuf bool (varint 0/1)"],
              ["float", "RpcFloat", "Protobuf float (32-bit IEEE)"],
              ["double", "RpcDouble", "Protobuf double (64-bit IEEE)"],
              ["bytes", "RpcBytes", "Protobuf bytes (varint-length-prefixed raw)"],
            ].map(([t, g, w]) => (
              <tr key={t} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground">{t}</td>
                <td className="py-2 pr-6 font-mono">{g}</td>
                <td className="py-2">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3 id="schema-how">How it works end-to-end</H3>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>Schema is registered in the runtime alongside the handler endpoint.</li>
        <li>When a caller invokes <Mono>LookupFunction</Mono>, it receives the schema definition.</li>
        <li>Caller SDK detects schema → encodes payload as binary Protobuf automatically.</li>
        <li>Worker SDK receives binary → decodes → passes plain object to handler.</li>
        <li>Handler returns plain object → worker encodes as binary → caller decodes.</li>
        <li>Falls back to JSON when no schema is registered (no config needed on caller).</li>
      </ol>

      {/* ── RpcContext ───────────────────────────────────────────── */}
      <H2 id="rpc-context">RpcContext</H2>
      <P>
        The optional second argument to a handler. Provides trace metadata and the stream writer.
      </P>
      <DocCodeBlock
        lang="ts"
        code={`interface RpcContext {
  traceId: string;       // current trace ID — use with watchRun()
  spanId: string;        // current span ID
  stream: {
    write(data: unknown, key?: string): Promise<void>;  // push a real-time chunk
    end(key?: string): Promise<void>;                   // no-op placeholder
  };
}`}
      />
      <MultiCodeBlock
        code={{
          go: `type RpcContext struct {
  TraceID string
  SpanID  string
  Stream  *StreamWriter // .Write(data, key)
}`,
          py: `# ctx is passed as the second positional argument to the handler
# ctx.trace_id  — current trace ID
# ctx.span_id   — current span ID
# ctx.stream.write(data, key) — push a real-time chunk`,
        }}
      />

      <Callout type="info">
        <Mono>handleRpc()</Mono> is chainable in Node.js and Go — register multiple handlers before
        calling <Mono>serve()</Mono>.
      </Callout>
    </div>
  );
}
