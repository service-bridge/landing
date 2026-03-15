import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";

export function PageEvents() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Events"
        description="Durable pub/sub with at-least-once delivery, consumer groups, server-side filtering, DLQ, and replay — no broker required."
      />

      <Callout type="tip">
        DLQ, replay, and consumer group fan-out are built-in — no Kafka, no Redis Streams, no
        separate queue infrastructure.
      </Callout>

      {/* ── event() ──────────────────────────────────────────────── */}
      <H2 id="event-publish">event() — publish</H2>
      <P>
        Publish a JSON payload to a topic. Every registered consumer group receives it independently
        with retries and DLQ on failure. Returns the <Mono>messageId</Mono> (UUID) on success, or an
        empty string while in offline-queue mode (flushed automatically on reconnect).
      </P>

      <H3 id="event-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `event(topic: string, payload?: unknown, opts?: EventOpts): Promise<string>`,
          go: `func (c *Client) Event(ctx context.Context, topic string, payload any, opts *EventOpts) (string, error)`,
          py: `async def event(topic: str, payload: Any = None, *, idempotency_key: str = "", trace_id: str = "", headers: dict[str, str] | None = None) -> str`,
        }}
      />

      <H3 id="event-opts">Options</H3>
      <ParamTable
        rows={[
          {
            name: "topic",
            type: "string",
            desc: 'Dot-separated topic name, e.g. "orders.created". Supports wildcard subscriptions.',
          },
          {
            name: "payload",
            type: "any",
            default: "undefined",
            desc: "JSON-serialisable event payload.",
          },
          {
            name: "idempotencyKey",
            type: "string",
            desc: "Deduplication key — runtime rejects duplicates per (producer_service, key) pair.",
          },
          {
            name: "headers",
            type: "Record<string, string>",
            desc: "Custom metadata forwarded to all consumers via EventContext.refs.headers.",
          },
          {
            name: "traceId",
            type: "string",
            default: "auto",
            desc: "Pass your own trace ID to correlate publishing with the consumer trace.",
          },
          {
            name: "parentSpanId (Node) / parent_span_id (Python)",
            type: "string",
            default: "auto",
            desc: "Override parent span ID. Available in Node.js (parentSpanId) and Python (parent_span_id).",
          },
        ]}
      />

      <H3 id="event-example">Examples</H3>
      <MultiCodeBlock
        code={{
          ts: `// Basic publish
await sb.event("orders.created", { orderId: "ord_42", total: 4990 });

// With idempotency and metadata headers
const messageId = await sb.event("orders.completed", {
  orderId: "ord_42",
  txId: "tx_123",
}, {
  idempotencyKey: "order:ord_42:completed",
  headers: { source: "checkout", region: "us-east" },
});
  console.log(messageId); // "550e8400-e29b-41d4-a716-446655440000"`,
          go: `// Basic publish
svc.Event(ctx, "orders.created", map[string]any{"order_id": "ord_42", "total": 4990}, nil)

// With idempotency key and headers
messageID, err := svc.Event(ctx, "orders.completed", map[string]any{
  "order_id": "ord_42",
  "tx_id":    "tx_123",
}, &servicebridge.EventOpts{
  IdempotencyKey: "order:ord_42:completed",
  Headers:        map[string]string{"source": "checkout"},
})`,
          py: `# Basic publish
await sb.event("orders.created", {"order_id": "ord_42", "total": 4990})

# With idempotency key and headers
message_id = await sb.event(
    "orders.completed",
    {"order_id": "ord_42", "tx_id": "tx_123"},
    idempotency_key="order:ord_42:completed",
    headers={"source": "checkout", "region": "us-east"},
)`,
        }}
      />

      <Callout type="warning">
        Event delivery is <strong>at-least-once</strong>. Design consumers to be idempotent, or use{" "}
        <Mono>idempotencyKey</Mono> on the publisher side. If the SDK reconnects after an outage,
        any offline-queued events are flushed — use idempotency keys to prevent duplicates.
      </Callout>

      {/* ── handleEvent() ────────────────────────────────────────── */}
      <H2 id="handle-event">handleEvent() — consume</H2>
      <P>
        Register a consumer handler for a topic pattern. Handlers run in a named consumer group —
        each group receives every matching event independently. Multiple instances of the same
        service with the same <Mono>groupName</Mono> share a load-balanced queue.
      </P>

      <H3 id="handle-event-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `handleEvent(
  pattern: string,
  handler: (payload: unknown, ctx: EventContext) => void | Promise<void>,
  opts?: HandleEventOpts,
): ServiceBridgeService`,
          go: `func (c *Client) HandleEvent(topic string, handler func(ctx context.Context, payload json.RawMessage, ec *EventContext) error, opts *HandleEventOpts) *Client`,
          py: `@sb.handle_event(topic: str, group_name: str = "", retry_policy_json: str = "", filter_expr: str = "")
async def handler(payload: dict, ctx: EventContext) -> None: ...`,
        }}
      />

      <H3 id="handle-event-opts">Options</H3>
      <ParamTable
        rows={[
          {
            name: "pattern / topic",
            type: "string",
            desc: 'Topic pattern. Use * for single-segment wildcard: "orders.*" matches "orders.created" but not "orders.created.sub".',
          },
          {
            name: "groupName / GroupName / group_name",
            type: "string",
            default: "<service>.<topic> (all SDKs)",
            desc: "Consumer group name. All instances sharing this name receive load-balanced delivery.",
          },
          {
            name: "concurrency (Node)",
            type: "number",
            desc: "Max concurrent handler executions per worker (reserved, not yet enforced).",
          },
          {
            name: "prefetch (Node)",
            type: "number",
            desc: "Messages to pre-fetch from the runtime (reserved, not yet enforced).",
          },
          {
            name: "retryPolicyJson / RetryPolicyJSON / retry_policy_json",
            type: "string (JSON)",
            desc: "JSON retry policy. See Retry policy section below.",
          },
          {
            name: "filterExpr / FilterExpr / filter_expr",
            type: "string",
            desc: "Server-side filter expression. Non-matching messages are never delivered to this group.",
          },
        ]}
      />
      <Callout type="info">
        Cross-SDK parity: <Mono>groupName/group_name</Mono>, retry policy, and{" "}
        <Mono>filterExpr/filter_expr</Mono> are available in all SDKs. In Python, registering a
        duplicate group name raises a <Mono>ValueError</Mono>. In Go and Node.js, the duplicate is
        silently ignored (the original handler is kept). Node-only <Mono>concurrency</Mono>/
        <Mono>prefetch</Mono> are currently hint fields.
      </Callout>

      <H3 id="handle-event-ctx">EventContext</H3>
      <ParamTable
        rows={[
          {
            name: "ctx.retry(delayMs?)",
            type: "method",
            desc: "Schedule redelivery with optional delay (overrides computed backoff for this attempt).",
          },
          {
            name: "ctx.reject(reason)",
            type: "method",
            desc: "Reject permanently — moves to DLQ immediately, bypassing remaining retry attempts.",
          },
          {
            name: "ctx.refs.topic (Node/Go) / ctx.topic (Python)",
            type: "string",
            desc: "The actual topic that matched the pattern.",
          },
          {
            name: "ctx.refs.groupName (Node/Go) / ctx.group_name (Python)",
            type: "string",
            desc: "This consumer group's name.",
          },
          {
            name: "ctx.refs.messageId (Node/Go) / ctx.message_id (Python)",
            type: "string",
            desc: "Queue message ID.",
          },
          {
            name: "ctx.refs.attempt (Node/Go) / ctx.attempt (Python)",
            type: "number",
            desc: "Current delivery attempt number (1-indexed).",
          },
          {
            name: "ctx.refs.headers (Node/Go) / ctx.headers (Python)",
            type: "map[string]string / dict[str,str]",
            desc: "Headers set by publisher.",
          },
          {
            name: "ctx.traceId (Node/Go) / ctx.trace_id (Python)",
            type: "string",
            desc: "Distributed trace ID for this event delivery — use with watchRun() for run correlation.",
          },
          {
            name: "ctx.spanId (Node/Go) / ctx.span_id (Python)",
            type: "string",
            desc: "Span ID for linking back to the producer's span.",
          },
          {
            name: "ctx.stream.write(data, key)",
            type: "method",
            desc: "Append a real-time chunk to the run stream (visible in dashboard, consumable via watchRun).",
          },
        ]}
      />

      <H3 id="handle-event-basic">Basic consumer</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("orders.*", async (payload, ctx) => {
  const body = payload as { orderId: string };
  console.log("received", ctx.refs.topic, body.orderId);
  // attempt, groupName, messageId available in ctx.refs
});`,
          go: `svc.HandleEvent("orders.*",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    fmt.Println("received", ec.Refs.Topic, ec.Refs.Attempt)
    return nil
  }, nil)`,
          py: `@sb.handle_event("orders.*")
async def on_order(payload: dict, ctx: EventContext) -> None:
    print("received", ctx.topic, ctx.attempt, payload.get("order_id"))`,
        }}
      />

      <H3 id="handle-event-retry">Retry and reject</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("orders.*", async (payload, ctx) => {
  const body = payload as { orderId?: string };
  if (!body.orderId) {
    ctx.reject("missing_order_id");  // → DLQ immediately
    return;
  }
  try {
    await processOrder(body.orderId);
  } catch (e) {
    ctx.retry(5000);  // redeliver after 5 s (overrides policy backoff)
  }
});`,
          go: `svc.HandleEvent("orders.*",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    var body struct{ OrderID string \`json:"order_id"\` }
    json.Unmarshal(payload, &body)
    if body.OrderID == "" {
      ec.Reject("missing_order_id")  // → DLQ immediately
      return nil
    }
    // returning a non-nil error triggers retry per policy
    return processOrder(ctx, body.OrderID)
  }, nil)`,
          py: `@sb.handle_event("orders.*")
async def on_order(payload: dict, ctx: EventContext) -> None:
    if not payload.get("order_id"):
        ctx.reject("missing_order_id")  # → DLQ immediately
        return
    try:
        await process_order(payload["order_id"])
    except Exception:
        ctx.retry(delay_ms=5000)  # redeliver after 5 s`,
        }}
      />

      {/* ── Delivery lifecycle ───────────────────────────────────── */}
      <H2 id="delivery-lifecycle">Delivery lifecycle</H2>
      <P>
        ServiceBridge provides <strong>guaranteed, durable delivery</strong> — similar to RabbitMQ
        queues. Messages are stored in PostgreSQL and delivered independently to each matching
        consumer group.
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong>Consumer online</strong> — message is dispatched immediately (within the next
          300 ms polling tick or the instant the consumer registers).
        </li>
        <li>
          <strong>Consumer offline</strong> — message waits in the queue indefinitely. No retry
          attempts are burned. The delivery status shows as{" "}
          <Mono>waiting_for_consumer</Mono> (sky-blue icon in the trace waterfall). The moment the
          service reconnects, the runtime wakes up and dispatches the message automatically — no
          manual action needed.
        </li>
        <li>
          <strong>Consumer processes message, throws error</strong> — counted as a real attempt,
          retry backoff applies. After <Mono>maxAttempts</Mono>, the delivery moves to DLQ.
        </li>
        <li>
          <strong>Consumer calls <Mono>ctx.reject(reason)</Mono></strong> — moved to DLQ
          immediately, no further retries.
        </li>
        <li>
          <strong>TTL exceeded</strong> — if the consumer never connects within{" "}
          <Mono>SERVICEBRIDGE_DELIVERY_TTL_DAYS</Mono> (default 7 days), the message is moved to
          DLQ with reason <Mono>delivery_ttl_exceeded</Mono>. Set to <Mono>0</Mono> to wait
          indefinitely.
        </li>
      </ul>
      <Callout type="tip">
        Retries only count when the consumer <em>actually tried</em> to process the message and
        failed. Time spent waiting for an offline consumer does not consume the retry budget.
      </Callout>

      {/* ── Retry policy ─────────────────────────────────────────── */}
      <H2 id="retry-policy">Retry policy</H2>
      <P>
        Pass a JSON string to <Mono>retryPolicyJson</Mono> to configure per-group retry behaviour.
        The delay formula is:{" "}
        <Mono>min(baseDelayMs × factor^(attempt-1), maxDelayMs) ± jitter</Mono>. Calling{" "}
        <Mono>ctx.retry(delayMs)</Mono> inside a handler overrides the computed delay for that
        specific attempt.
      </P>
      <DocCodeBlock
        lang="json"
        code={`{
  "maxAttempts": 5,
  "baseDelayMs": 5000,
  "factor": 2,
  "maxDelayMs": 60000,
  "jitter": 0.2
}`}
      />
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("payments.*", handler, {
  retryPolicyJson: JSON.stringify({
    maxAttempts: 5,
    baseDelayMs: 5000,
    factor: 2,
    maxDelayMs: 60000,
    jitter: 0.2,
  }),
});
  // Attempt 1 → 5 s, attempt 2 → 10 s, attempt 3 → 20 s … up to 60 s`,
          go: `policy := \`{"maxAttempts":5,"baseDelayMs":5000,"factor":2,"maxDelayMs":60000,"jitter":0.2}\`
svc.HandleEvent("payments.*", handler,
  &servicebridge.HandleEventOpts{RetryPolicyJSON: policy})`,
          py: `import json
policy = json.dumps({
    "maxAttempts": 5,
    "baseDelayMs": 5000,
    "factor": 2,
    "maxDelayMs": 60000,
    "jitter": 0.2,
})

@sb.handle_event("payments.*", retry_policy_json=policy)
async def on_payment(payload: dict, ctx) -> None:
    ...`,
        }}
      />

      <P>
        After all retries are exhausted, the delivery moves to the Dead-Letter Queue. See{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "dlq-replay" }))
          }
        >
          DLQ & Replay
        </button>{" "}
        for inspection and replay.
      </P>

      {/* ── Server-side filter ───────────────────────────────────── */}
      <H3 id="handle-event-filter">Server-side filter</H3>
      <P>
        Use <Mono>filterExpr</Mono> to pre-filter events on the server. Non-matching events are
        never delivered to this consumer group — zero wasted handler invocations. See{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "filter-expr" }))
          }
        >
          Filter Expressions
        </button>{" "}
        for the full DSL reference.
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("orders.*", handler, {
  filterExpr: "status=paid,amount>100",
  groupName: "billing.high-value",
});`,
          go: `svc.HandleEvent("orders.*", handler,
  &servicebridge.HandleEventOpts{
    GroupName:  "billing.high-value",
    FilterExpr: "status=paid,amount>100",
  })`,
          py: `@sb.handle_event("orders.*", group_name="billing.high-value", filter_expr="status=paid,amount>100")
async def on_high_value_order(payload: dict, ctx: EventContext) -> None:
    ...`,
        }}
      />

      {/* ── Wildcard depth ───────────────────────────────────────── */}
      <H2 id="wildcard-depth">Wildcard depth</H2>
      <P>
        The <Mono>*</Mono> wildcard matches exactly <strong>one dot-separated segment</strong>. It
        does not match multiple segments:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>orders.*</Mono> matches <Mono>orders.created</Mono> ✓
        </li>
        <li>
          <Mono>orders.*</Mono> matches <Mono>orders.updated</Mono> ✓
        </li>
        <li>
          <Mono>orders.*</Mono> does <strong className="text-foreground">not</strong> match{" "}
          <Mono>orders.created.eu</Mono> ✗ (two segments after prefix)
        </li>
        <li>
          <Mono>orders.*.*</Mono> matches <Mono>orders.created.eu</Mono> ✓
        </li>
      </ul>

      <Callout type="tip">
        Use a unique <Mono>groupName</Mono> per service for fan-out — each group gets every matching
        event independently. Omit it and all instances of the same service share a load-balanced
        queue (competing consumers). For real-time chunk streaming from a handler, see{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() => document.dispatchEvent(new CustomEvent("sb-nav", { detail: "streaming" }))}
        >
          Streaming
        </button>
        .
      </Callout>
    </div>
  );
}
