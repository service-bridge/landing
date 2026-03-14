import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageTracing() {
  return (
    <div>
      <PageHeader
        badge="Observability"
        title="Distributed Tracing"
        description="Every RPC call, event publish, event delivery, job execution, workflow step, and HTTP request is automatically traced — no OTEL collector, no Jaeger, no Zipkin, no sidecar."
      />

      <Callout type="tip">
        <strong>Zero-config tracing.</strong> The SDK emits spans for every operation over the
        existing gRPC connection. Traces are stored in PostgreSQL and surfaced in the built-in
        dashboard with a Gantt-style timeline, per-span payload view, retry visualization, and
        inline correlated logs. Nothing to install, nothing to configure.
      </Callout>

      {/* ── Automatic traces ─────────────────────────────────────── */}
      <H2 id="auto-tracing">Automatic traces</H2>
      <P>
        Every SDK operation creates spans automatically. All spans for the same logical operation
        are linked into one trace — caller and handler, publisher and all consumers, workflow root
        and all steps.
      </P>

      {/* ── Span types table ─────────────────────────────────────── */}
      <H2 id="span-table">Span types</H2>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Span prefix</th>
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Created by</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              [
                "rpc:<service>/<fn>",
                "Caller on rpc()",
                "One span per call; retry attempts get child spans",
              ],
              [
                "attempt:<service>/<fn>",
                "Caller on each retry",
                "Groups in the trace waterfall; shows timing per attempt",
              ],
              ["event:<topic>", "Publisher on event()", "Linked to all consumer delivery spans"],
              ["job:<ref>", "Scheduler on each execution", "Full execution trace per job tick"],
              ["workflow:<name>", "workflow() call", "Root span; each step gets a child span"],
              ["sleep:<ms>", "sleep step", "Shown as a durable wait span in the workflow DAG"],
              [
                "event_wait:<pattern>",
                "event_wait step",
                "Shows suspension duration; linked to waking event",
              ],
              [
                "http:<METHOD>:<path>",
                "HTTP middleware",
                "One span per request when middleware is installed",
              ],
            ].map(([prefix, by, note]) => (
              <tr key={prefix} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground text-xs">{prefix}</td>
                <td className="py-2 pr-6">{by}</td>
                <td className="py-2">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Inline logs ──────────────────────────────────────────── */}
      <H2 id="inline-logs">Inline logs</H2>
      <P>
        Any log statement made inside a handler is automatically captured and associated with the
        handler's span. In the Run Detail view, expand any span to see its correlated logs inline —
        no Kibana, no log query, no tab switching.
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.handleRpc("payments/charge", async (payload, ctx) => {
  // These console calls are captured automatically:
  console.info("charge.start", { orderId: payload.orderId });
  const tx = await stripe.charge(payload);
  console.info("charge.done", { txId: tx.id });
  // → Both appear in the span's log panel in the dashboard
  return { txId: tx.id };
});`,
          go: `// Option 1: use svc.SlogHandler() for structured log/slog integration
logger := slog.New(svc.SlogHandler())
logger.Info("charge.start", "order_id", orderID)

// Option 2: capture standard logger
svc.CaptureStdLogger()
log.Printf("charge.start order_id=%s", orderID)`,
          py: `# capture_logs=True (default) patches Python logging automatically
import logging
logger = logging.getLogger(__name__)

@sb.handle_rpc("payments/charge")
async def charge(payload: dict) -> dict:
    logger.info("charge.start", extra={"order_id": payload["order_id"]})
    tx = await stripe.charge(payload)
    logger.info("charge.done", extra={"tx_id": tx.id})
    return {"tx_id": tx.id}`,
        }}
      />

      <Callout type="info">
        The SDK masks sensitive log fields automatically — <Mono>password</Mono>,{" "}
        <Mono>secret</Mono>, <Mono>token</Mono>, <Mono>authorization</Mono> are replaced with{" "}
        <Mono>"[REDACTED]"</Mono> before transmission.
      </Callout>

      {/* ── x-trace-id header ────────────────────────────────────── */}
      <H2 id="trace-id-header">x-trace-id response header</H2>
      <P>
        When HTTP middleware is installed, every response includes an <Mono>x-trace-id</Mono> header
        containing the current trace ID. Use it to:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>Look up the exact trace in the dashboard Runs view</li>
        <li>
          Pass to <Mono>watchRun()</Mono> to subscribe to real-time stream chunks
        </li>
        <li>Include in error responses for support/debugging</li>
      </ul>
      <MultiCodeBlock
        code={{
          ts: `// Browser
const res = await fetch("/api/charge", { method: "POST", body: JSON.stringify(payload) });
const traceId = res.headers.get("x-trace-id");
// → open dashboard: /runs?traceId=<traceId>
// → or subscribe: sb.watchRun(traceId, { key: "output" })`,
          go: `// In an HTTP handler (with middleware installed)
traceID := r.Header.Get("X-Trace-Id")  // incoming from upstream
// or from response:
resp.Header.Get("X-Trace-Id")`,
          py: `# FastAPI middleware exposes trace IDs on request.state
trace_id = request.state.servicebridge_trace_id

# Flask middleware exposes trace IDs on g
trace_id = g.trace_id`,
        }}
      />

      {/* ── Trace context ────────────────────────────────────────── */}
      <H2 id="trace-context">Trace context utilities</H2>
      <P>
        Trace context propagates automatically across all SDK calls. For manual control or
        cross-service context stitching — see{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "manual-spans" }))
          }
        >
          Manual Spans
        </button>{" "}
        for <Mono>getTraceContext()</Mono>, <Mono>runWithTraceContext()</Mono>, and Go's{" "}
        <Mono>WithTraceContext()</Mono>.
      </P>

      {/* ── Grafana / Loki ───────────────────────────────────────── */}
      <H2 id="grafana">Grafana / Loki integration</H2>
      <P>
        The runtime exposes a Loki-compatible log query API. Point your Grafana Loki datasource
        directly at ServiceBridge — no Loki installation, no Promtail, no log pipeline:
      </P>
      <DocCodeBlock
        lang="yaml"
        code={`# Grafana datasource (loki.yaml or added via UI)
apiVersion: 1
datasources:
  - name: ServiceBridge Logs
    type: loki
    url: http://your-servicebridge-host:14444/loki
    access: proxy`}
      />

      <H3 id="loki-queries">LogQL queries</H3>
      <MultiCodeBlock
        code={{
          ts: `{service="payments"}               // all logs from the payments service
{service="orders"} |= "error"     // orders logs containing "error"
{service="api", level="error"}    // only error-level logs from api
{trace_id="01HQXYZ..."}           // all logs for a specific trace
{service="workers"} | json        // parse structured JSON fields`,
          go: `// Same LogQL queries work — Grafana sends them directly to ServiceBridge
// Supported labels: service, level, trace_id, span_id`,
          py: `# Same LogQL queries work
# {service="payments"} returns all Python service logs
# trace_id label correlates logs to a specific run`,
        }}
      />

      {/* ── OTLP ingest ──────────────────────────────────────────── */}
      <H2 id="otlp">OTLP trace ingest</H2>
      <P>
        Drop external traces into ServiceBridge via the OTLP JSON endpoint. External spans appear in
        the same Runs view alongside native spans — useful for mixing traces from non-SDK services:
      </P>
      <DocCodeBlock
        lang="bash"
        code={`POST http://your-runtime:14444/v1/traces
Content-Type: application/json

# Body: standard OTLP JSON trace format
# Note: JSON only — OTLP/protobuf binary is not supported`}
      />

      <Callout type="info">
        Trace retention is controlled by <Mono>SERVICEBRIDGE_RETENTION_DAYS</Mono> (default: 3
        days). Log retention uses a separate <Mono>SERVICEBRIDGE_LOGS_TTL_DAYS</Mono> setting. See{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "server-config" }))
          }
        >
          Server Variables
        </button>{" "}
        for the full list of retention settings.
      </Callout>
    </div>
  );
}
