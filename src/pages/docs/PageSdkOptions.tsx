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
  url,         // gRPC control plane URL (e.g. "127.0.0.1:14445")
  serviceKey,  // Service authentication key
  serviceName, // Service name in the registry
  {
    timeout: 30_000,
    retries: 3,
    retryDelay: 300,
    discoveryRefreshMs: 10_000,
    queueMaxSize: 1_000,
    queueOverflow: "drop-oldest",
    heartbeatIntervalMs: 10_000,
    workerTransport: "tls",
    captureLogs: true,
    adminUrl: "http://127.0.0.1:14444",
    workerTLS: {
      caCert: process.env.SERVICEBRIDGE_CA_PEM,
      cert: process.env.SERVICEBRIDGE_CERT_PEM,
      key: process.env.SERVICEBRIDGE_KEY_PEM,
    },
  },
);`,
          go: `import servicebridge "github.com/service-bridge/go"

svc := servicebridge.New(
  "127.0.0.1:14445",   // gRPC URL
  os.Getenv("SERVICEBRIDGE_SERVICE_KEY"),
  "my-service",
  &servicebridge.Options{
    AdminURL:            "http://127.0.0.1:14444",
    HeartbeatIntervalMs: 10_000,
    CaptureLogs:         servicebridge.BoolPtr(true),
    QueueMaxSize:        1000,
    QueueOverflow:       "drop-oldest",
    DiscoveryRefreshMs:  10_000,
  },
)`,
          py: `from service_bridge import ServiceBridge, Options

sb = ServiceBridge(
    grpc_url="127.0.0.1:14445",
    service_key="sb_live_...",
    service_name="my-service",
    opts=Options(
        admin_url="http://127.0.0.1:14444",
        heartbeat_interval_ms=10_000,
        capture_logs=True,
        queue_max_size=1000,
        queue_overflow="drop-oldest",
        discovery_refresh_ms=10_000,
        skip_tls=False,
    ),
)`,
        }}
      />

      <H2 id="options-table">All options</H2>
      <ParamTable
        rows={[
          { name: "timeout (Node)", type: "number (ms)", default: "30000", desc: "Default timeout for SDK operations. Can be overridden per-call in rpc() opts." },
          { name: "retries (Node)", type: "number", default: "3", desc: "Default retry count for rpc(). 0 = no retry." },
          { name: "retryDelay (Node)", type: "number (ms)", default: "300", desc: "Base exponential backoff delay between retries." },
          { name: "discoveryRefreshMs / DiscoveryRefreshMs / discovery_refresh_ms", type: "number (ms)", default: "10000", desc: "How often endpoint lists are refreshed from runtime registry." },
          { name: "queueMaxSize / QueueMaxSize / queue_max_size", type: "number", default: "1000", desc: "Max operations buffered in the offline queue while control plane is unavailable." },
          { name: "queueOverflow / QueueOverflow / queue_overflow", type: '"drop-oldest" | "drop-newest" | "error"', default: '"drop-oldest"', desc: "Overflow strategy when offline queue is full." },
          { name: "heartbeatIntervalMs / HeartbeatIntervalMs / heartbeat_interval_ms", type: "number (ms)", default: "10000", desc: "Heartbeat period for worker registrations." },
          { name: "captureLogs / CaptureLogs / capture_logs", type: "boolean", default: "true", desc: "Auto-capture logs and forward them to ServiceBridge runtime." },
          { name: "adminUrl / AdminURL / admin_url", type: "string", default: "derived from gRPC URL", desc: "HTTP admin base URL used by TLS provisioning and management calls." },
          { name: "workerTransport (Node)", type: '"tls"', default: '"tls"', desc: "Worker server transport type." },
          { name: "workerTLS (Node)", type: "{ caCert?: string|Buffer; cert?: string|Buffer; key?: string|Buffer; serverName?: string }", desc: "Explicit mTLS materials for the worker gRPC server." },
          { name: "skip_tls (Python)", type: "boolean", default: "false", desc: "Disable mTLS auto-provisioning for local development." },
          { name: "Logger (Go)", type: "func(format string, args ...any)", default: "log.Printf", desc: "Custom logger function for SDK internals." },
        ]}
      />

      <H2 id="cross-sdk-parity">Cross-SDK parity notes</H2>
      <P>
        Core API categories are aligned across all SDKs: constructor, RPC, events, jobs, workflows,
        streams, startup/shutdown, HTTP middleware, tracing, and typed errors.
      </P>
      <ParamTable
        rows={[
          { name: "Node-only constructor defaults", type: "timeout/retries/retryDelay", desc: "Go/Python configure retry and timeout per-call." },
          { name: "Node-only handler hints", type: "handleRpc.timeout/retryable/concurrency + handleEvent.concurrency/prefetch", desc: "Accepted by Node API as hints; currently not strict runtime limits." },
          { name: "Node-only serve fields", type: "instanceId/weight/transport/tls", desc: "Go/Python expose host + SkipTLS/skip_tls only." },
          { name: "watchRun key default", type: 'Node: "default"; Go/Python: ""', desc: "Pass key explicitly for portable behavior." },
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
          ts: `const sb = servicebridge(url, key, "my-service", {
  queueMaxSize: 2_000,          // max buffered operations
  queueOverflow: "drop-oldest", // what to do when full
});

// These return immediately even when the control plane is down
await sb.event("order.created", payload); // queued
await sb.job("billing/collect", opts);    // queued`,
          go: `svc := servicebridge.New(url, key, "my-service", &servicebridge.Options{
  QueueMaxSize:  2000,
  QueueOverflow: "drop-oldest",
})`,
          py: `sb = ServiceBridge(url, key, "my-service", opts=Options(
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
    </div>
  );
}
