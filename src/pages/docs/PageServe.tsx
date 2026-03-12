import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageServe() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Startup & Shutdown"
        description="Start the worker's gRPC server, register handlers with the control plane, and shut down gracefully. serve() blocks until the process exits or stop() is called."
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
          {" "}<Mono>servicebridge(url, key, serviceName)</Mono>. Starts background heartbeat and discovery.
        </li>
        <li>
          <strong className="text-foreground">Register handlers</strong> —
          {" "}<Mono>handleRpc()</Mono>, <Mono>handleEvent()</Mono>, <Mono>job()</Mono>, <Mono>workflow()</Mono>.
          Can be done in any order.
        </li>
        <li>
          <strong className="text-foreground">serve()</strong> — Provisions mTLS cert, starts the worker
          gRPC server, and registers the worker endpoint with the control plane. Blocks until shutdown.
        </li>
        <li>
          <strong className="text-foreground">stop()</strong> — Drains in-flight handlers, flushes the
          offline queue, closes the gRPC server and control-plane connection.
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

// 3. Start — blocks here
await sb.serve({ host: "127.0.0.1" });`,
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
    "127.0.0.1:14445",
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
          py: `async def serve(*, host: str = "127.0.0.1", skip_tls: bool = False) -> None`,
        }}
      />

      <H2 id="serve-opts">ServeOpts</H2>
      <ParamTable
        rows={[
          { name: "host", type: "string", default: '"127.0.0.1"', desc: "Bind address for the worker gRPC server. Use 0.0.0.0 inside Docker or Kubernetes." },
          { name: "instanceId", type: "string", default: "auto", desc: "Stable worker replica ID. Used in Service Map, logs, and load balancing. Auto-generated as 6 random hex chars." },
          { name: "weight", type: "number", default: "1", desc: "Load-balancing weight hint. Higher weight means more traffic directed to this replica." },
          { name: "skipTLS", type: "boolean", default: "false", desc: "Disable mTLS for local development without a running ServiceBridge server." },
          { name: "tls", type: "WorkerTLSOpts", desc: "Explicit cert/key/CA. Overrides auto-provisioned certificates." },
        ]}
      />

      {/* ── instanceId & weight ──────────────────────────────────── */}
      <H2 id="instance-weight">instanceId & weight</H2>
      <P>
        Each worker replica gets a unique <Mono>instanceId</Mono>. It flows through logs, spans,
        and heartbeats — the Service Map in the dashboard shows alive vs. dead replicas grouped by
        service. In Kubernetes, set <Mono>instanceId</Mono> to the pod name for human-readable
        replica tracking:
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.serve({
  host: "0.0.0.0",
  // Use pod name in K8s for readable replica IDs in the dashboard
  instanceId: process.env.POD_NAME ?? undefined,
  // This replica gets 2x more traffic than weight:1 instances
  weight: 2,
});`,
          go: `svc.Serve(ctx, &servicebridge.ServeOpts{
  Host:       "0.0.0.0",
  InstanceId: os.Getenv("POD_NAME"), // K8s pod name
  Weight:     2,
})`,
          py: `import os
await sb.serve(
    host="0.0.0.0",
    # instance_id=os.environ.get("POD_NAME"),
)`,
        }}
      />

      {/* ── TLS / mTLS ───────────────────────────────────────────── */}
      <H2 id="tls-behavior">TLS / mTLS behavior</H2>
      <P>
        By default, <Mono>serve()</Mono> auto-provisions an mTLS certificate. The process is
        fully automatic and the private key never leaves your process:
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm my-3">
        <li>SDK generates an ECDSA P-256 key pair in memory.</li>
        <li>Sends <strong className="text-foreground">only the public key</strong> to the admin API.</li>
        <li>Server signs and returns a client cert + CA cert (cert valid for 7 days).</li>
        <li>Worker gRPC server starts with full mTLS — only the control plane can call in.</li>
      </ol>
      <MultiCodeBlock
        code={{
          ts: `// Default — auto-provisions mTLS (recommended)
await sb.serve({ host: "127.0.0.1" });

// Bring your own certificates
await sb.serve({
  host: "0.0.0.0",
  tls: {
    caCert: process.env.CA_CERT!,
    cert: process.env.WORKER_CERT!,
    key: process.env.WORKER_KEY!,
  },
});

// Local dev only — skip TLS
await sb.serve({ skipTLS: true });`,
          go: `// Default — auto-provisions mTLS
svc.Serve(ctx, nil)

// Skip TLS for local dev
svc.Serve(ctx, &servicebridge.ServeOpts{SkipTLS: true})`,
          py: `# Default — auto-provisions mTLS
await sb.serve()

# Skip TLS for local dev
await sb.serve(skip_tls=True)`,
        }}
      />

      <Callout type="warning">
        Set <Mono>host: "0.0.0.0"</Mono> when running inside Docker or Kubernetes — the ServiceBridge
        server must be able to reach your worker container over the network. <Mono>127.0.0.1</Mono>{" "}
        only accepts connections from the same host and will cause registration failures in containers.
      </Callout>

      {/* ── Graceful shutdown ────────────────────────────────────── */}
      <H2 id="graceful-shutdown">Graceful shutdown</H2>
      <P>
        <Mono>serve()</Mono> blocks the process. When the process receives a termination signal,
        the runtime shuts down cleanly — draining in-flight requests, flushing the offline queue,
        and closing all connections.
      </P>

      <H3 id="shutdown-node">Node.js — SIGTERM handler</H3>
      <MultiCodeBlock
        code={{
          ts: `process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  sb.stop();          // drains in-flight + flushes offline queue
  process.exit(0);
});

await sb.serve({ host: "127.0.0.1" });`,
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
        Gracefully shuts down the worker: flushes pending telemetry, drains the offline queue,
        stops accepting new handler invocations, and closes all connections.
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
