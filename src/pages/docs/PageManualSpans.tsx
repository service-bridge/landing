import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageManualSpans() {
  return (
    <div>
      <PageHeader
        badge="HTTP Integration"
        title="Manual Spans"
        description="Create HTTP spans manually for HTTP frameworks not covered by the built-in middleware, or for custom request tracking beyond framework routes."
      />

      <H2 id="start-span">startHttpSpan() / StartHttpSpan() / start_http_span()</H2>
      <P>
        Creates a new HTTP span and returns a handle to end it. Use this when you want to trace a
        specific HTTP operation without using the framework middleware.
      </P>
      <MultiCodeBlock
        code={{
          ts: `const span = sb.startHttpSpan({
  method: "GET",
  path: "/health",
  traceId: req.headers["x-trace-id"] as string,  // propagate incoming trace
});

try {
  // ... handler logic ...
  span.end({ statusCode: 200, success: true });
} catch (e) {
  span.end({ success: false, error: String(e) });
}`,
          go: `traceID, parentSpanID := servicebridge.ExtractTraceFromHeaders(r.Header)
span := svc.StartHttpSpan(servicebridge.HttpSpanOpts{
  Method:       r.Method,
  Path:         r.URL.Path,
  TraceID:      traceID,
  ParentSpanID: parentSpanID,
})
defer span.End(servicebridge.HttpSpanEndOpts{StatusCode: 200})

ctx := servicebridge.WithTraceContext(r.Context(), span.TraceID, span.SpanID)
result, err := svc.Rpc.Invoke(ctx, "user.get", payload, nil)
if err != nil {
  span.End(servicebridge.HttpSpanEndOpts{StatusCode: 500, Error: err.Error()})
  return
}`,
          py: `span = sb.start_http_span(
    "GET", "/health",
    trace_id=request.headers.get("x-trace-id"),
)
try:
    # ... handler logic ...
    span.end(status_code=200)
except Exception as e:
    span.end(error=str(e))`,
        }}
      />

      <H2 id="register-endpoint">
        registerHttpEndpoint() / RegisterHttpEndpoint() / register_http_endpoint()
      </H2>
      <P>
        Registers an HTTP route pattern in the ServiceBridge service catalog. This makes routes
        visible in the service map and allows other services to discover them. Normally the
        middleware does this automatically — use this for manual or lazy registration.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.registerHttpEndpoint({
  method: "GET",
  route: "/users/:id",
  instanceId: process.env.HOSTNAME,
  endpoint: "http://10.0.0.5:3000",
  allowedCallers: ["api-gateway"],
});`,
          go: `err := svc.RegisterHttpEndpoint(ctx, servicebridge.HttpEndpointOpts{
  Method:         "GET",
  Route:          "/users/{id}",
  InstanceID:     os.Getenv("HOSTNAME"),
  Endpoint:       "http://10.0.0.5:3000",
  AllowedCallers: []string{"api-gateway"},
})
if err != nil {
  return err
}`,
          py: `sb.register_http_endpoint(
    "GET", "/users/{id}",
    endpoint="http://10.0.0.5:3000",
)`,
        }}
      />

      <H2 id="trace-context">Trace context utilities</H2>
      <P>Propagate trace context across async boundaries manually:</P>
      <MultiCodeBlock
        code={{
          ts: `import { getTraceContext, withTraceContext } from "service-bridge";

// Get the current trace context (inside an RPC or event handler)
const ctx = getTraceContext(); // { traceId, spanId }

// Run a function inside an explicit trace context
withTraceContext({ traceId: "trace-1", spanId: "span-1" }, async () => {
  await sb.events.publish("audit.log", { action: "user.login" });
});`,
          go: `// Add trace context to a Go context.Context
ctx = servicebridge.WithTraceContext(ctx, "trace-1", "span-1")

// Read trace context from context.Context
tc, ok := servicebridge.GetTraceCtx(ctx)
fmt.Println(tc.TraceID, tc.SpanID)`,
          py: `# Python SDK has no global get_trace_context() helper.
# In HTTP handlers, read IDs from middleware state and pass them explicitly:
trace_id = request.state.servicebridge_trace_id  # FastAPI
# trace_id = g.trace_id                          # Flask
await sb.events.publish("audit.log", {"action": "user.login"}, trace_id=trace_id)`,
        }}
      />

      <Callout type="info">
        In most cases you don't need to manage trace context manually — the SDK propagates it
        automatically through async-local storage (Node.js) and <Mono>context.Context</Mono> (Go).
        In Python, use middleware-provided trace IDs or pass <Mono>trace_id</Mono> explicitly.
      </Callout>
    </div>
  );
}
