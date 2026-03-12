import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageHttpMiddleware() {
  return (
    <div>
      <PageHeader
        badge="HTTP Integration"
        title="HTTP Middleware"
        description="Instrument your HTTP framework with automatic trace propagation, span recording, and route catalog registration. One line to add — works with Express, Fastify, FastAPI, Flask, Chi, Gin, and Echo."
      />

      {/* ── What it does ─────────────────────────────────────────── */}
      <H2 id="what-it-does">What it does</H2>
      <P>
        All middleware variants share the same behaviour on every request:
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>Extract or generate a trace ID from the incoming <Mono>traceparent</Mono> or <Mono>x-trace-id</Mono> header</li>
        <li>Start an <Mono>http:METHOD:path</Mono> span — automatically closed when the response is sent</li>
        <li>Inject the SDK client into the request context so handlers can call <Mono>rpc()</Mono> / <Mono>event()</Mono> in the same trace</li>
        <li>Set the <Mono>x-trace-id</Mono> response header — useful for frontend correlation and <Mono>watchRun()</Mono></li>
        <li>Register route patterns in the ServiceBridge HTTP catalog (visible in the dashboard Service Map → Connections tab)</li>
      </ul>

      {/* ── Express ──────────────────────────────────────────────── */}
      <H2 id="express">Express</H2>
      <DocCodeBlock lang="bash" code={`npm i express service-bridge`} />
      <MultiCodeBlock
        code={{
          ts: `import express from "express";
import { servicebridge } from "service-bridge";
import { servicebridgeMiddleware, registerExpressRoutes } from "service-bridge/express";

const sb = servicebridge(process.env.SERVICEBRIDGE_URL!, process.env.SERVICEBRIDGE_SERVICE_KEY!, "api");
const app = express();

app.use(servicebridgeMiddleware({
  client: sb,
  excludePaths: ["/health", "/ready"],
  autoRegister: true,   // registers route on first hit
}));

app.get("/users/:id", async (req, res) => {
  // req.servicebridge — SDK client, already inside the HTTP trace context
  // req.traceId, req.spanId — current trace/span IDs
  const user = await req.servicebridge.rpc("users/get", { id: req.params.id });
  res.json(user);
});

app.listen(3000);`,
        }}
      />

      <H3 id="express-options">servicebridgeMiddleware options</H3>
      <ParamTable
        rows={[
          { name: "client", type: "ServiceBridgeService", desc: "The SDK client instance." },
          { name: "excludePaths", type: "string[]", default: "[]", desc: "Path prefixes to skip — no span, no catalog registration." },
          { name: "propagateTraceHeader", type: "boolean", default: "true", desc: "Set x-trace-id on every response." },
          { name: "autoRegister", type: "boolean", default: "false", desc: "Register route pattern in catalog on first request hit." },
        ]}
      />

      <H3 id="express-eager">Eager route registration</H3>
      <P>
        Use <Mono>registerExpressRoutes</Mono> to register all routes at startup instead of on
        first hit — recommended for services that need to appear in the Service Map immediately:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await registerExpressRoutes(app, sb, {
  endpoint: "http://10.0.0.5:3000",   // publicly reachable address
  allowedCallers: ["api-gateway"],
  excludePaths: ["/health"],
});`,
        }}
      />

      {/* ── Fastify ──────────────────────────────────────────────── */}
      <H2 id="fastify">Fastify</H2>
      <DocCodeBlock lang="bash" code={`npm i fastify service-bridge`} />
      <MultiCodeBlock
        code={{
          ts: `import Fastify from "fastify";
import { servicebridge } from "service-bridge";
import { servicebridgePlugin, wrapHandler } from "service-bridge/fastify";

const sb = servicebridge(process.env.SERVICEBRIDGE_URL!, process.env.SERVICEBRIDGE_SERVICE_KEY!, "api");
const app = Fastify();

await app.register(servicebridgePlugin, {
  client: sb,
  excludePaths: ["/health"],
  autoRegister: true,
});

// wrapHandler is required — Fastify doesn't carry async-local context into handlers
// without it, downstream SDK calls won't inherit the HTTP trace span
app.get("/users/:id", wrapHandler(async (request, reply) => {
  const user = await request.servicebridge.rpc("users/get", {
    id: (request.params as { id: string }).id,
  });
  return reply.send(user);
}));`,
        }}
      />

      <Callout type="warning">
        Always use <Mono>wrapHandler()</Mono> in Fastify. Without it, SDK calls inside the handler
        run outside the async-local trace context — they still work, but won't be linked to the
        HTTP span in the trace waterfall.
      </Callout>

      {/* ── FastAPI ──────────────────────────────────────────────── */}
      <H2 id="fastapi">FastAPI</H2>
      <DocCodeBlock lang="bash" code={`pip install "service-bridge[fastapi]"`} />
      <MultiCodeBlock
        code={{
          py: `from fastapi import FastAPI, Request
from service_bridge import ServiceBridge
from service_bridge.http.fastapi import ServiceBridgeMiddleware, get_client

sb = ServiceBridge("127.0.0.1:14445", "key", "api")
app = FastAPI()

app.add_middleware(
    ServiceBridgeMiddleware,
    client=sb,
    exclude_paths=["/health"],
    auto_register=True,
)

@app.get("/users/{user_id}")
async def get_user(user_id: str, request: Request):
    client = get_client(request)   # SDK client in current trace context
    user = await client.rpc("users/get", {"id": user_id})
    return user`,
        }}
      />

      {/* ── Flask ────────────────────────────────────────────────── */}
      <H2 id="flask">Flask</H2>
      <DocCodeBlock lang="bash" code={`pip install "service-bridge[flask]"`} />
      <MultiCodeBlock
        code={{
          py: `from flask import Flask, g
from service_bridge import ServiceBridge
from service_bridge.http.flask import init_servicebridge

sb = ServiceBridge("127.0.0.1:14445", "key", "api")
app = Flask(__name__)
init_servicebridge(app, sb, auto_register=True)

@app.get("/users/<user_id>")
def get_user(user_id):
    # g.service_bridge — SDK client in trace context
    # g.trace_id, g.span_id — current IDs
    return {"id": user_id}`,
        }}
      />

      <Callout type="warning">
        Flask is synchronous. Calling <Mono>rpc()</Mono> or <Mono>event()</Mono> from a Flask
        handler blocks the thread. For async-first workloads use FastAPI instead.
      </Callout>

      {/* ── Go install ───────────────────────────────────────────── */}
      <H2 id="chi">Chi (Go)</H2>
      <DocCodeBlock lang="bash" code={`go get github.com/service-bridge/go/http`} />
      <MultiCodeBlock
        code={{
          go: `import (
  "github.com/go-chi/chi/v5"
  sbhttp "github.com/service-bridge/go/http"
)

r := chi.NewRouter()
r.Use(sbhttp.ChiMiddleware(svc))

r.Get("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
  client := sbhttp.FromContext(r.Context()) // SDK client in trace context
  result, _ := client.Rpc(r.Context(), "users/get", map[string]any{"id": chi.URLParam(r, "id")}, nil)
  w.Write(result)
})`,
        }}
      />

      <H2 id="gin">Gin (Go)</H2>
      <MultiCodeBlock
        code={{
          go: `import (
  "github.com/gin-gonic/gin"
  sbhttp "github.com/service-bridge/go/http"
)

r := gin.New()
r.Use(sbhttp.GinMiddleware(svc))

r.GET("/users/:id", func(c *gin.Context) {
  client := sbhttp.GinClient(c) // SDK client in trace context
  result, _ := client.Rpc(c.Request.Context(), "users/get", map[string]any{"id": c.Param("id")}, nil)
  c.JSON(200, result)
})`,
        }}
      />

      <H2 id="echo">Echo (Go)</H2>
      <MultiCodeBlock
        code={{
          go: `import (
  "github.com/labstack/echo/v4"
  sbhttp "github.com/service-bridge/go/http"
)

e := echo.New()
e.Use(sbhttp.EchoMiddleware(svc))

e.GET("/users/:id", func(c echo.Context) error {
  client := sbhttp.EchoClient(c) // SDK client in trace context
  result, _ := client.Rpc(c.Request().Context(), "users/get", map[string]any{"id": c.Param("id")}, nil)
  return c.JSON(200, result)
})`,
        }}
      />

      <H3 id="go-options">Go middleware options</H3>
      <P>
        All Go middleware variants accept <Mono>sbhttp.Options</Mono> as an optional second argument:
      </P>
      <ParamTable
        rows={[
          { name: "ExcludePaths", type: "[]string", default: "nil", desc: "Path prefixes to skip — no span, no catalog registration." },
          { name: "PropagateTraceHeader", type: "*bool", default: "true", desc: "Set x-trace-id on every response." },
          { name: "AutoRegister", type: "*bool", default: "true", desc: "Register routes in catalog on first hit." },
          { name: "RoutePatternFn", type: "func(*http.Request) string", desc: "Custom route pattern extractor (net/http only)." },
        ]}
      />

      <MultiCodeBlock
        code={{
          go: `r.Use(sbhttp.ChiMiddleware(svc, sbhttp.Options{
  ExcludePaths: []string{"/health", "/ready"},
  AutoRegister: servicebridge.BoolPtr(true),
}))`,
        }}
      />

      {/* ── net/http ─────────────────────────────────────────────── */}
      <H2 id="nethttp">net/http (standard library)</H2>
      <MultiCodeBlock
        code={{
          go: `import sbhttp "github.com/service-bridge/go/http"

mux := http.NewServeMux()
mux.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
  client := sbhttp.FromContext(r.Context())
  // client.Rpc(...)
})

// Wrap the entire mux
http.ListenAndServe(":8080", sbhttp.Middleware(svc)(mux))`,
        }}
      />
    </div>
  );
}
