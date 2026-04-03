// keywords: servicebridge service-bridge quick-start getting-started npm i service-bridge pip install service-bridge go get RPC gRPC event-bus microservices Node.js TypeScript Python Go SDK distributed-tracing workflow background-jobs mTLS service-mesh zero-sidecar production-ready

import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageQuickStart() {
  return (
    <div>
      <PageHeader
        badge="Getting Started"
        title="Quick Start"
        description="From zero to working service communication in under 5 minutes."
      />

      <H2 id="install-sdk">1. Install the SDK</H2>
      <MultiCodeBlock
        code={{
          ts: `npm i service-bridge
# or
bun add service-bridge`,
          go: `go get github.com/service-bridge/go`,
          py: `pip install service-bridge`,
        }}
      />

      <H2 id="runtime">2. Start the runtime</H2>
      <P>The SDK connects to the ServiceBridge runtime. If you haven't installed it yet, run:</P>
      <DocCodeBlock lang="bash" code={`bash <(curl -fsSL https://servicebridge.dev/install.sh)`} />
      <P>
        The dashboard will be at <Mono>http://localhost:14444</Mono>. Create a service key there
        (Services → Keys → New Key) — you'll need it in step 3. See{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "service-keys" }))
          }
        >
          Service Keys & RBAC
        </button>{" "}
        for capabilities and policy options.
      </P>

      <H2 id="create-worker">3. Create a worker</H2>
      <P>
        A worker is a service that handles incoming RPC calls. Register handlers, then call{" "}
        <Mono>serve()</Mono> to connect to the runtime and start accepting requests.
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge(
  process.env.SERVICEBRIDGE_URL ?? "localhost:14445",
  process.env.SERVICEBRIDGE_SERVICE_KEY!,
);

sb.handleRpc("charge", async (payload: { orderId: string; amount: number }) => {
  return { ok: true, txId: \`tx_\${Date.now()}\`, orderId: payload.orderId };
});

await sb.serve({ host: "localhost" });`,
          go: `package main

import (
  "context"
  "encoding/json"
  "fmt"
  "log"
  "os"
  "os/signal"

  servicebridge "github.com/service-bridge/go"
)

func main() {
  ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
  defer cancel()

  svc := servicebridge.New("localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

  svc.HandleRpc("charge", func(ctx context.Context, payload json.RawMessage) (any, error) {
    var req struct {
      OrderID string \`json:"order_id"\`
      Amount  int    \`json:"amount"\`
    }
    json.Unmarshal(payload, &req)
    return map[string]any{"ok": true, "tx_id": fmt.Sprintf("tx_%s", req.OrderID)}, nil
  })

  if err := svc.Serve(ctx, nil); err != nil {
    log.Fatal(err)
  }
}`,
          py: `import asyncio
from service_bridge import ServiceBridge

sb = ServiceBridge("localhost:14445", "your-service-key")

@sb.handle_rpc("charge")
async def charge(payload: dict) -> dict:
    return {"ok": True, "tx_id": f"tx_{int(asyncio.get_event_loop().time())}"}

asyncio.run(sb.serve())`,
        }}
      />

      <H2 id="call-rpc">4. Call it from another service</H2>
      <P>
        Any service with a valid service key can call any registered RPC function directly — no
        broker, no sidecar, no proxy.
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { servicebridge } from "service-bridge";

const sb = servicebridge(
  process.env.SERVICEBRIDGE_URL ?? "localhost:14445",
  process.env.SERVICEBRIDGE_SERVICE_KEY!,
);

const result = await sb.rpc<{ ok: boolean; txId: string }>("payments", "payment.charge", {
  orderId: "ord_42",
  amount: 4990,
});

console.log(result.txId); // tx_1711234567890`,
          go: `package main

import (
  "context"
  "encoding/json"
  "fmt"
  "log"
  "os"

  servicebridge "github.com/service-bridge/go"
)

func main() {
  svc := servicebridge.New("localhost:14445", os.Getenv("SERVICEBRIDGE_SERVICE_KEY"), nil)

  result, err := svc.Rpc(context.Background(), "payments", "payment.charge", map[string]any{
    "order_id": "ord_42",
    "amount":   4990,
  }, nil)
  if err != nil {
    log.Fatal(err)
  }

  var resp struct {
    OK   bool   \`json:"ok"\`
    TxID string \`json:"tx_id"\`
  }
  json.Unmarshal(result, &resp)
  fmt.Println(resp.TxID)
}`,
          py: `import asyncio
from service_bridge import ServiceBridge

sb = ServiceBridge("localhost:14445", "your-service-key")

async def main():
    result = await sb.rpc("payments", "payment.charge", {
        "order_id": "ord_42",
        "amount": 4990,
    })
    print(result["tx_id"])

asyncio.run(main())`,
        }}
      />

      <Callout type="tip">
        Every call above is traced automatically. Open the dashboard to see the full trace timeline
        — RPC spans, durations, and payloads.
      </Callout>

      <H2 id="env-setup">Environment variables</H2>
      <P>
        The recommended way to configure the SDK is via environment variables. Create a{" "}
        <Mono>.env</Mono> file:
      </P>
      <MultiCodeBlock
        code={{
          ts: `SERVICEBRIDGE_URL=localhost:14445
SERVICEBRIDGE_SERVICE_KEY=sbv2.<id>.<secret>.<ca>`,
          go: `SERVICEBRIDGE_URL=localhost:14445
SERVICEBRIDGE_SERVICE_KEY=sbv2.<id>.<secret>.<ca>`,
          py: `SERVICEBRIDGE_URL=localhost:14445
SERVICEBRIDGE_SERVICE_KEY=sbv2.<id>.<secret>.<ca>`,
        }}
      />

      <H3 id="use-env">Read env in your service</H3>
      <MultiCodeBlock
        code={{
          ts: `const sb = servicebridge(
  process.env.SERVICEBRIDGE_URL ?? "localhost:14445",
  process.env.SERVICEBRIDGE_SERVICE_KEY!,
);`,
          go: `svc := servicebridge.New(
  os.Getenv("SERVICEBRIDGE_URL"),
  os.Getenv("SERVICEBRIDGE_SERVICE_KEY"),
  nil,
)`,
          py: `import os
from service_bridge import ServiceBridge

sb = ServiceBridge(
    os.environ.get("SERVICEBRIDGE_URL", "localhost:14445"),
    os.environ["SERVICEBRIDGE_SERVICE_KEY"],
)`,
        }}
      />
    </div>
  );
}
