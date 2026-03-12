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
    captureLogs: true,
    adminUrl: "http://127.0.0.1:14444",
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
          { name: "timeout", type: "number (ms)", default: "30000", desc: "Default timeout for SDK operations. Can be overridden per-call in rpc() opts." },
          { name: "retries", type: "number", default: "3", desc: "Default retry count for rpc(). 0 = no retry." },
          { name: "retryDelay", type: "number (ms)", default: "300", desc: "Base exponential backoff delay between retries." },
          { name: "discoveryRefreshMs", type: "number (ms)", default: "10000", desc: "How often to refresh worker endpoint lists from the registry." },
          { name: "queueMaxSize", type: "number", default: "1000", desc: "Max operations to buffer in the offline queue when the control plane is unreachable." },
          { name: "queueOverflow", type: '"drop-oldest" | "drop-newest" | "error"', default: '"drop-oldest"', desc: "Overflow strategy when offline queue is full." },
          { name: "heartbeatIntervalMs", type: "number (ms)", default: "10000", desc: "How often workers send heartbeats to the control plane." },
          { name: "captureLogs", type: "boolean", default: "true", desc: "Auto-capture console.*/log.*/logging.* calls and forward to the runtime." },
          { name: "adminUrl", type: "string", default: "derived from url", desc: "HTTP admin base URL. Used for TLS provisioning and management API calls." },
          { name: "skipTls / SkipTLS", type: "boolean", default: "false", desc: "Disable mTLS provisioning. For local development only." },
          { name: "workerTLS / WorkerTLS", type: "object", desc: "Explicit cert/key/CA for worker mTLS. Overrides auto-provisioning." },
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
