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
        telemetry operations in an in-memory queue. Direct RPC calls between services continue
        working via cached endpoint lists — only control-plane writes are queued.
      </P>

      <H2 id="behavior">How it works</H2>
      <MultiCodeBlock
        code={{
          ts: `const sb = servicebridge(url, serviceKey, "my-service", {
  queueMaxSize: 2_000,           // max buffered operations
  queueOverflow: "drop-oldest",  // eviction policy when full
});

// event() / job() / workflow() return immediately
// even when the runtime is down — they're queued
await sb.event("order.created", payload);  // buffered if offline

// On reconnect, the queue drains automatically
// No code changes needed`,
          go: `svc := servicebridge.New(url, key, "my-service", &servicebridge.Options{
  QueueMaxSize:  2000,
  QueueOverflow: "drop-oldest",
})

// Event, Job, Workflow calls queue automatically when offline
svc.Event(ctx, "order.created", payload, nil) // buffered if offline`,
          py: `sb = ServiceBridge(url, key, "my-service", opts=Options(
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
            <li><Mono>"drop-oldest"</Mono> (default) — evict the oldest buffered operation</li>
            <li><Mono>"drop-newest"</Mono> — reject the new operation</li>
            <li><Mono>"error"</Mono> — throw/return an error immediately</li>
          </ul>
        </li>
      </ul>

      <Callout type="warning">
        The offline queue is <strong>in-memory only</strong>. Operations buffered while offline are
        lost if the process restarts before the control plane recovers. For critical write-ahead
        durability, implement your own persistence layer (e.g. a local database) on top.
      </Callout>

      <H2 id="return-values">Return values while offline</H2>
      <P>
        <Mono>event()</Mono> and <Mono>job()</Mono> return an empty string (instead of the real
        message/job ID) when the operation is buffered. The real ID is available only after
        flushing — currently no callback is provided for this. Design your code to handle empty IDs
        gracefully.
      </P>
    </div>
  );
}
