import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageSdkOptions() {
  return (
    <div>
      <PageHeader
        badge="Configuration"
        title="SDK Options"
        description="All options accepted by the SDK constructor. Sensible defaults work for most cases — only override what you need."
      />

      <H2 id="constructor">Constructor</H2>
      <MultiCodeBlock
        code={{
          ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge(
  url,         // gRPC control plane URL (e.g. "localhost:14445")
  serviceKey,  // Service authentication key
  {
    timeout: 30_000,
    retries: 3,
    retryDelay: 300,
    discoveryRefreshMs: 10_000,
    queueMaxSize: 1_000,
    queueOverflow: "drop-oldest",
    heartbeatIntervalMs: 10_000,
    captureLogs: true,
    workerTLS: {
      caCert: process.env.SERVICEBRIDGE_WORKER_CA_PEM,
      cert: process.env.SERVICEBRIDGE_CERT_PEM,
      key: process.env.SERVICEBRIDGE_KEY_PEM,
    },
  },
);`,
          go: `import servicebridge "github.com/service-bridge/go"

svc := servicebridge.New(
  "localhost:14445",   // gRPC URL
  os.Getenv("SERVICEBRIDGE_SERVICE_KEY"),
  &servicebridge.Options{
    HeartbeatIntervalMs: 10_000,
    CaptureLogs:         servicebridge.BoolPtr(true),
    QueueMaxSize:        1000,
    QueueOverflow:       "drop-oldest",
    DiscoveryRefreshMs:  10_000,
    TimeoutMs:           30_000,
    Retries:             3,
    RetryDelayMs:        300,
  },
)`,
          py: `import os
from service_bridge import ServiceBridge, Options

sb = ServiceBridge(
    grpc_url="localhost:14445",
    service_key="sbv2.<id>.<secret>.<ca>",
    opts=Options(
        heartbeat_interval_ms=10_000,
        capture_logs=True,
        queue_max_size=1000,
        queue_overflow="drop-oldest",
        discovery_refresh_ms=10_000,
        timeout_ms=30_000,
        retries=3,
        retry_delay_ms=300,
    ),
)`,
        }}
      />

      <H2 id="options-table">All options</H2>
      <ParamTable
        rows={[
          {
            name: "timeout / TimeoutMs / timeout_ms",
            type: "number (ms)",
            default: "30000",
            desc: "Global default hard timeout per RPC attempt. Per-call opts override. Available in all SDKs.",
          },
          {
            name: "retries / Retries / retries",
            type: "number",
            default: "3",
            desc: "Global default retry count for rpc(). 0 = no retry. Available in all SDKs.",
          },
          {
            name: "retryDelay / RetryDelayMs / retry_delay_ms",
            type: "number (ms)",
            default: "300",
            desc: "Base exponential backoff delay: delay × 2^(attempt-1). Available in all SDKs.",
          },
          {
            name: "discoveryRefreshMs / DiscoveryRefreshMs / discovery_refresh_ms",
            type: "number (ms)",
            default: "10000",
            desc: "How often endpoint lists are refreshed from runtime registry.",
          },
          {
            name: "queueMaxSize / QueueMaxSize / queue_max_size",
            type: "number",
            default: "1000",
            desc: "Max operations buffered in the offline queue while control plane is unavailable.",
          },
          {
            name: "queueOverflow / QueueOverflow / queue_overflow",
            type: '"drop-oldest" | "drop-newest" | "error"',
            default: '"drop-oldest"',
            desc: "Overflow strategy when offline queue is full.",
          },
          {
            name: "heartbeatIntervalMs / HeartbeatIntervalMs / heartbeat_interval_ms",
            type: "number (ms)",
            default: "10000",
            desc: "Heartbeat period for worker registrations.",
          },
          {
            name: "captureLogs / CaptureLogs / capture_logs",
            type: "boolean",
            default: "true",
            desc: "Auto-capture logs and forward them to ServiceBridge runtime.",
          },
          {
            name: "Logger (Go)",
            type: "func(format string, args ...any)",
            default: "log.Printf",
            desc: "Custom logger function for SDK internals.",
          },
        ]}
      />

      <H2 id="advanced-tls">Advanced TLS overrides</H2>
      <ParamTable
        rows={[
          {
            name: "caCert / CACert / ca_cert",
            type: "string (PEM)",
            default: "from service key",
            desc: "Optional control-plane CA override. By default SDK reads CA from sbv2 service key.",
          },
          {
            name: "workerTLS (Node)",
            type: "{ caCert?: string|Buffer; cert?: string|Buffer; key?: string|Buffer; serverName?: string }",
            desc: "Explicit mTLS materials for the worker gRPC server.",
          },
        ]}
      />

      <H2 id="cross-sdk-parity">Cross-SDK parity notes</H2>
      <P>
        Core API categories are aligned across all SDKs: constructor, RPC, events, jobs, workflows,
        streams, startup/shutdown, HTTP middleware, tracing, and typed errors.
      </P>
      <ParamTable
        rows={[
          {
            name: "Node-only constructor options",
            type: "workerTLS (+ caCert override)",
            desc: "Explicit worker cert materials and control-plane CA override.",
          },
          {
            name: "Node-only handler hints",
            type: "handleRpc.timeout/retryable/concurrency + handleEvent.concurrency/prefetch",
            desc: "Accepted by Node API as hints; currently not strict runtime limits.",
          },
          {
            name: "Serve flow-control field (all SDKs)",
            type: "maxInFlight / MaxInFlight / max_in_flight",
            desc: "Bounded runtime-originated command concurrency over OpenWorkerSession.",
          },
          {
            name: "Node-only serve fields",
            type: "instanceId/weight/tls",
            desc: "Extra serve extensions beyond shared host/maxInFlight fields.",
          },
        ]}
      />

      <H2 id="offline-queue">Offline queue behavior</H2>
      <P>
        When the control plane is unavailable, the SDK buffers <Mono>event()</Mono>,{" "}
        <Mono>job()</Mono>, <Mono>workflow()</Mono>, and telemetry writes in memory. They are
        flushed automatically after reconnect.
      </P>
      <MultiCodeBlock
        code={{
          ts: `const sb = servicebridge(url, key, {
  queueMaxSize: 2_000,          // max buffered operations
  queueOverflow: "drop-oldest", // what to do when full
});

// These return immediately even when the control plane is down
await sb.event("order.created", payload); // queued
await sb.job("billing/collect", opts);    // queued`,
          go: `svc := servicebridge.New(url, key, &servicebridge.Options{
  QueueMaxSize:  2000,
  QueueOverflow: "drop-oldest",
})`,
          py: `sb = ServiceBridge(url, key, Options(
    queue_max_size=2000,
    queue_overflow="drop-oldest",
))`,
        }}
      />

      <Callout type="warning">
        The offline queue is in-memory. Operations queued while offline are lost if the process
        restarts before the control plane reconnects. For critical operations, implement your own
        persistence layer on top.
      </Callout>

      <Callout type="info">
        RPC calls are bounded even when a downstream service is silent: each attempt is cut by{" "}
        <Mono>timeout</Mono>/<Mono>TimeoutMs</Mono>/<Mono>timeout_ms</Mono>, retries are finite, and
        exhausted calls end in terminal <Mono>error</Mono>.
      </Callout>
    </div>
  );
}
