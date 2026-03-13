import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageServe() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Startup & Shutdown"
        description="Start the worker gRPC server, register handlers with the control plane, and shut down cleanly. Go/Python serve() block until cancellation; Node serve() resolves once the worker is online."
      />

      {/* ── Lifecycle ────────────────────────────────────────────── */}
      <H2 id="lifecycle">Worker lifecycle</H2>
      <P>
        Every worker follows the same four-step lifecycle. Register all your handlers before
        calling <Mono>serve()</Mono> — handlers registered after <Mono>serve()</Mono> is running
        are accepted but may miss the initial registration window.
      </P>
      <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground my-4">
        <li>
          <strong className="text-foreground">Construct the client</strong> —
          {" "}<Mono>servicebridge(url, key, serviceName)</Mono> (or language equivalent).
        </li>
        <li>
          <strong className="text-foreground">Register handlers</strong> —
          {" "}<Mono>handleRpc()</Mono>, <Mono>handleEvent()</Mono>, <Mono>job()</Mono>, <Mono>workflow()</Mono>.
          Can be done in any order.
        </li>
        <li>
          <strong className="text-foreground">serve()</strong> — Provisions mTLS cert over gRPC, starts the worker
          gRPC server, opens reverse worker session, and registers the worker endpoint with the control plane.
          Go/Python block here; Node returns when startup is complete.
        </li>
        <li>
          <strong className="text-foreground">stop()</strong> — Stops heartbeats, flushes telemetry,
          and closes worker/control-plane connections.
        </li>
      </ol>
      <MultiCodeBlock
        code={{
          ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge(
  process.env.SERVICEBRIDGE_URL!,
  process.env.SERVICEBRIDGE_SERVICE_KEY!,
  "payments",
);

// 2. Register handlers (order doesn't matter)
sb.handleRpc("charge", chargeHandler);
sb.handleRpc("refund", refundHandler);
sb.handleEvent("orders.*", orderEventHandler);

// 3. Start worker and wait until ready
await sb.serve({ host: "localhost" });`,
          go: `package main

import (
  "context"
  "os"
  "os/signal"

  servicebridge "github.com/service-bridge/go"
)

func main() {
  ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
  defer cancel()

  svc := servicebridge.New(
    os.Getenv("SERVICEBRIDGE_URL"),
    os.Getenv("SERVICEBRIDGE_SERVICE_KEY"),
    "payments",
    nil,
  )

  svc.HandleRpc("charge", chargeHandler)
  svc.HandleRpc("refund", refundHandler)
  svc.HandleEvent("orders.*", orderEventHandler, nil)

  // Blocks until ctx is cancelled (e.g. SIGINT)
  if err := svc.Serve(ctx, nil); err != nil {
    panic(err)
  }
}`,
          py: `import asyncio
from service_bridge import ServiceBridge

sb = ServiceBridge(
    "localhost:14445",
    "your-service-key",
    "payments",
)

@sb.handle_rpc("charge")
async def charge(payload: dict) -> dict:
    return {"ok": True}

@sb.handle_event("orders.*")
async def on_order(payload: dict, ctx) -> None:
    pass

asyncio.run(sb.serve())`,
        }}
      />

      {/* ── serve() ──────────────────────────────────────────────── */}
      <H2 id="serve-sig">serve()</H2>
      <MultiCodeBlock
        code={{
          ts: `serve(opts?: ServeOpts): Promise<void>`,
          go: `func (c *Client) Serve(ctx context.Context, opts *ServeOpts) error`,
          py: `async def serve(*, host: str = "localhost", max_in_flight: int = 128) -> None`,
        }}
      />

      <H2 id="serve-opts">ServeOpts</H2>
      <ParamTable
        rows={[
          { name: "host / Host / host", type: "string", default: '"localhost"', desc: "Bind address for the worker gRPC server. Use 0.0.0.0 in Docker or Kubernetes so ServiceBridge can reach the worker." },
          { name: "maxInFlight / MaxInFlight / max_in_flight", type: "number", default: "128", desc: "Per-worker reverse-session in-flight command window. Runtime enforces flow-control and backpressure." },
          { name: "instanceId (Node)", type: "string", default: "auto", desc: "Stable worker replica ID (Node only)." },
          { name: "weight (Node)", type: "number", default: "1", desc: "Load-balancing weight hint (Node only)." },
          { name: "tls (Node)", type: "WorkerTLSOpts", desc: "Explicit cert/key/CA for worker mTLS (Node only)." },
        ]}
      />
      <Callout type="info">
        For portable examples across all SDKs, use only <Mono>host</Mono>.
        Node-specific serve fields (<Mono>instanceId</Mono>, <Mono>weight</Mono>, <Mono>tls</Mono>) are optional extensions.
      </Callout>

      {/* ── instanceId & weight ──────────────────────────────────── */}
      <H2 id="instance-weight">instanceId & weight</H2>
      <P>
        Serve-level <Mono>instanceId</Mono> and <Mono>weight</Mono> are supported in the Node SDK.
        Go and Python generate instance IDs automatically and do not expose weight in{" "}
        <Mono>serve()</Mono>:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.serve({
  host: "localhost",
  // Use pod name in K8s for readable replica IDs in the dashboard
  instanceId: process.env.POD_NAME ?? undefined,
  // This replica gets 2x more traffic than weight:1 instances
          weight: 2,
});`,
          go: `// Go SDK: ServeOpts exposes Host and MaxInFlight
svc.Serve(ctx, &servicebridge.ServeOpts{
  Host: "localhost",
  MaxInFlight: 256,
})`,
          py: `# Python SDK: instance_id/weight are not serve() parameters
await sb.serve(host="localhost", max_in_flight=256)`,
        }}
      />

      {/* ── TLS / mTLS ───────────────────────────────────────────── */}
      <H2 id="tls-behavior">TLS / mTLS behavior</H2>
      <P>
        By default, <Mono>serve()</Mono> auto-provisions an mTLS certificate over gRPC. The process is
        fully automatic and the private key never leaves your process:
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm my-3">
        <li>SDK generates an ECDSA P-256 key pair in memory.</li>
        <li>Sends <strong className="text-foreground">only the public key</strong> to gRPC <Mono>ProvisionWorkerCertificate</Mono>.</li>
        <li>Server signs and returns a client cert + CA cert (cert valid for 7 days).</li>
        <li>Worker gRPC server starts with full mTLS and runtime control happens through reverse stream <Mono>OpenWorkerSession</Mono>.</li>
      </ol>
      <MultiCodeBlock
        code={{
          ts: `// Default — auto-provisions mTLS (recommended)
await sb.serve({ host: "localhost" });

// Bring your own certificates
await sb.serve({
  host: "localhost",
  tls: {
    caCert: process.env.CA_CERT!,
    cert: process.env.WORKER_CERT!,
    key: process.env.WORKER_KEY!,
  },
});`,
          go: `// Default — auto-provisions mTLS
svc.Serve(ctx, nil)`,
          py: `# Default — auto-provisions mTLS
await sb.serve()`,
        }}
      />

      <Callout type="warning">
        Set <Mono>host: "0.0.0.0"</Mono> when running inside Docker or Kubernetes — the ServiceBridge
        server must be able to reach your worker container over the network. <Mono>localhost</Mono>{" "}
        only accepts connections from the same host and will cause RPC delivery failures.
      </Callout>

      {/* ── Graceful shutdown ────────────────────────────────────── */}
      <H2 id="graceful-shutdown">Graceful shutdown</H2>
      <P>
        On Go/Python, <Mono>serve()</Mono> blocks until cancellation. On Node, the returned
        Promise resolves after startup and your process continues running. In all cases, use signal
        handlers for predictable shutdown.
      </P>

      <H3 id="shutdown-node">Node.js — SIGTERM handler</H3>
      <MultiCodeBlock
        code={{
          ts: `process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  sb.stop();          // drains in-flight + flushes offline queue
  process.exit(0);
});

await sb.serve({ host: "localhost" });`,
        }}
      />

      <H3 id="shutdown-go">Go — context cancellation</H3>
      <MultiCodeBlock
        code={{
          go: `// signal.NotifyContext cancels on SIGINT/SIGTERM automatically
ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer cancel()

// Serve returns when ctx is cancelled — shutdown is automatic
if err := svc.Serve(ctx, nil); err != nil {
  log.Fatal(err)
}`,
        }}
      />

      <H3 id="shutdown-python">Python — asyncio</H3>
      <MultiCodeBlock
        code={{
          py: `import asyncio
import signal

async def main():
    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGTERM, lambda: asyncio.create_task(sb.stop()))
    await sb.serve()

asyncio.run(main())`,
        }}
      />

      {/* ── stop() ───────────────────────────────────────────────── */}
      <H2 id="stop-sig">stop()</H2>
      <P>
        Gracefully stops the worker runtime and closes connections. All SDKs perform graceful
        shutdown: Node tries a graceful gRPC server stop first then falls back to force shutdown;
        Go/Python close heartbeat loops and drain connections.
      </P>
      <MultiCodeBlock
        code={{
          ts: `sb.stop();`,
          go: `svc.Stop()`,
          py: `await sb.stop()`,
        }}
      />

      <Callout type="info">
        In Go, cancelling the <Mono>ctx</Mono> passed to <Mono>Serve()</Mono> triggers a clean
        shutdown automatically via <Mono>signal.NotifyContext</Mono> — you rarely need to call{" "}
        <Mono>Stop()</Mono> directly.
      </Callout>
    </div>
  );
}
