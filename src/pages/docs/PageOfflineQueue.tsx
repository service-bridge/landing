import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageOfflineQueue() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="Offline Queue"
        description="When the ServiceBridge runtime is unreachable, the SDK buffers write operations in memory and flushes them automatically after reconnect. No code changes needed."
      />

      <P>
        The SDK buffers <Mono>event()</Mono>, <Mono>job()</Mono>, <Mono>workflow()</Mono>, and
        telemetry operations (trace spans, <Mono>ReportCall</Mono>) in an in-memory queue. Direct
        RPC calls between services continue working via cached endpoint lists — only control-plane
        writes are queued.
      </P>

      <Callout type="warning">
        <Mono>stream.write()</Mono> / <Mono>ctx.stream.write()</Mono> calls are{" "}
        <strong>not buffered offline</strong> — they are silently dropped when the control plane is
        unreachable. Use <Mono>event()</Mono>, <Mono>job()</Mono>, or <Mono>workflow()</Mono> for
        reliable delivery instead.
      </Callout>

      <H2 id="behavior">How it works</H2>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(url, serviceKey, {
  queueMaxSize: 2_000,           // max buffered operations
  queueOverflow: "drop-oldest",  // eviction policy when full
});

// event() / job() / workflow() return immediately
// even when the runtime is down — they're queued
await sb.event("order.created", payload);  // buffered if offline

// On reconnect, the queue drains automatically
// No code changes needed`,
          go: `svc := servicebridge.New(url, key, &servicebridge.Options{
  QueueMaxSize:  2000,
  QueueOverflow: "drop-oldest",
})

// Event, Job, Workflow calls queue automatically when offline
svc.Event(ctx, "order.created", payload, nil) // buffered if offline`,
          py: `sb = ServiceBridge(url, key, opts=Options(
    queue_max_size=2000,
    queue_overflow="drop-oldest",
))

# event() / job() / workflow() buffer automatically when offline
await sb.event("order.created", payload)  # buffered if offline`,
        }}
      />

      <H2 id="config">Configuration</H2>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>queueMaxSize</Mono> (default: <Mono>1000</Mono>) — max buffered operations. When
          full, the overflow policy kicks in.
        </li>
        <li>
          <Mono>queueOverflow</Mono> — what to do when the queue is full:
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>
              <Mono>"drop-oldest"</Mono> (default) — evict the oldest buffered operation
            </li>
            <li>
              <Mono>"drop-newest"</Mono> — reject the new operation
            </li>
            <li>
              <Mono>"error"</Mono> — throw/return an error immediately
            </li>
          </ul>
        </li>
      </ul>

      <Callout type="warning">
        The offline queue is <strong>in-memory only</strong>. Operations buffered while offline are
        lost if the process restarts before the control plane recovers. For critical write-ahead
        durability, implement your own persistence layer (e.g. a local database) on top.
      </Callout>

      <H2 id="vs-server-delivery">SDK offline queue vs. server-side guaranteed delivery</H2>
      <P>
        These are two independent mechanisms — understanding the difference is important:
      </P>
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground my-3">
        <li>
          <strong>SDK offline queue</strong> — buffers <Mono>event()</Mono> / <Mono>job()</Mono> /
          <Mono>workflow()</Mono> calls <em>in-memory on the publisher side</em> when the publisher
          cannot reach the ServiceBridge runtime. Once the publisher reconnects, queued calls are
          flushed to the runtime. This protects against short-lived publisher-to-runtime outages.
          Data is lost on process restart.
        </li>
        <li>
          <strong>Server-side guaranteed delivery</strong> — once a message is accepted by the
          runtime (persisted in PostgreSQL), delivery to each consumer group is guaranteed
          regardless of consumer availability. If a consumer is offline, its delivery waits in the
          queue indefinitely (up to <Mono>SERVICEBRIDGE_DELIVERY_TTL_DAYS</Mono>, default 7 days).
          The moment the consumer reconnects and registers its event handlers, the runtime
          dispatches the waiting message automatically. No retry budget is consumed while waiting.
          This is analogous to a durable RabbitMQ queue.
        </li>
      </ul>
      <Callout type="tip">
        For end-to-end durability: use the SDK offline queue to survive short publisher outages, and
        rely on server-side guaranteed delivery to survive consumer outages of any length.
      </Callout>

      <H2 id="return-values">Return values while offline</H2>
      <P>
        <Mono>event()</Mono> and <Mono>job()</Mono> return an empty string (instead of the real
        message/job ID) when the operation is buffered. The real ID is available only after flushing
        — currently no callback is provided for this. Design your code to handle empty IDs
        gracefully.
      </P>
    </div>
  );
}
