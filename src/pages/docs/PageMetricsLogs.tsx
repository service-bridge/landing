import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageMetricsLogs() {
  return (
    <div>
      <PageHeader
        badge="Observability"
        title="Metrics & Logs"
        description="Prometheus-compatible /metrics endpoint with 30+ metric families. Structured log capture that ships automatically to the runtime — visible in the dashboard and queryable via Loki API."
      />

      <H2 id="metrics">Prometheus metrics</H2>
      <P>
        The runtime exposes a Prometheus-compatible endpoint at <Mono>/metrics</Mono> on the HTTP
        port (default <Mono>14444</Mono>). Scrape it with your Prometheus instance — no
        authentication required.
      </P>
      <DocCodeBlock
        lang="yaml"
        code={`# prometheus.yml scrape config
scrape_configs:
  - job_name: servicebridge
    static_configs:
      - targets: ['your-runtime-host:14444']`}
      />
      <P>Key metric families (30+ total):</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li><Mono>sb_rpc_calls_total</Mono> — RPC calls by service, function, and status</li>
        <li><Mono>sb_rpc_duration_seconds</Mono> — RPC latency histogram</li>
        <li><Mono>sb_events_published_total</Mono> — events published by topic</li>
        <li><Mono>sb_deliveries_total</Mono> — event deliveries by topic, group, and status</li>
        <li><Mono>sb_dlq_size</Mono> — current DLQ depth</li>
        <li><Mono>sb_workflow_runs_total</Mono> — workflow runs by name and status</li>
        <li><Mono>sb_job_runs_total</Mono> — job executions by target and status</li>
        <li><Mono>sb_active_services</Mono> — number of connected services</li>
        <li><Mono>sb_offline_queue_size</Mono> — SDK offline queue depth per service</li>
      </ul>

      <H2 id="logs">Log capture</H2>
      <P>
        The SDK automatically intercepts your language's standard logging facilities and ships logs
        to the runtime. No logging configuration needed — just use your normal logger.
      </P>

      <H3 id="ts-logs">TypeScript / Node.js</H3>
      <P>
        By default (<Mono>captureLogs: true</Mono>), the SDK intercepts <Mono>console.*</Mono>{" "}
        calls and forwards them to ServiceBridge with batching.
      </P>
      <MultiCodeBlock
        code={{
          ts: `// All console.* calls are captured automatically
console.log("order processed", orderId);
console.error("charge failed", error);
console.warn("retrying...");

// Disable if needed
const sb = servicebridge(url, key, { captureLogs: false });`,
        }}
      />

      <H3 id="go-logs">Go</H3>
      <P>
        By default, the SDK intercepts the standard <Mono>log</Mono> package. For structured
        logging with <Mono>log/slog</Mono>:
      </P>
      <MultiCodeBlock
        code={{
          go: `// Standard log is captured automatically
log.Println("order processed", orderId)

// Use SlogHandler for structured log/slog:
import "log/slog"
slog.SetDefault(slog.New(svc.SlogHandler()))
slog.Info("order processed", "orderId", orderId, "amount", 4990)

// Disable log capture
svc := servicebridge.New(url, key, &servicebridge.Options{
  CaptureLogs: servicebridge.BoolPtr(false),
})`,
        }}
      />

      <H3 id="py-logs">Python</H3>
      <P>
        By default (<Mono>capture_logs=True</Mono>), a <Mono>ServiceBridgeLogHandler</Mono> is
        attached to the root Python logger. All <Mono>logging.*</Mono> calls are shipped with
        batching (100 records or 500ms flush interval).
      </P>
      <MultiCodeBlock
        code={{
          py: `import logging

# Standard logging is captured automatically
logging.info("order processed %s", order_id)
logging.error("charge failed: %s", error)

# Disable if needed
from service_bridge import ServiceBridge, Options
sb = ServiceBridge(url, key, opts=Options(capture_logs=False))`,
        }}
      />

      <H2 id="log-query">Querying logs</H2>
      <P>
        Logs are queryable via the built-in dashboard and via the Loki-compatible API at{" "}
        <Mono>/loki/api/v1/query_range</Mono>. Point Grafana at the runtime to query logs
        alongside traces and metrics.
      </P>
      <DocCodeBlock
        lang="bash"
        code={`# Example Loki query via API
curl 'http://your-runtime:14444/loki/api/v1/query_range' \\
  --data-urlencode 'query={service="payments"} |= "error"' \\
  --data-urlencode 'start=1700000000000000000' \\
  --data-urlencode 'end=1700003600000000000'`}
      />

      <Callout type="info">
        Logs are retained for <Mono>SERVICEBRIDGE_LOGS_TTL_DAYS</Mono> days (default: 3). Set to
        a higher value for longer retention, or <Mono>0</Mono> to keep indefinitely (not
        recommended for production).
      </Callout>
    </div>
  );
}
