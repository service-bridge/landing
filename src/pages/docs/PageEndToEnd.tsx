import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageEndToEnd() {
  return (
    <div>
      <PageHeader
        badge="Getting Started"
        title="End-to-End Example"
        description="A complete order flow: HTTP request → RPC → Event → Event handler with real-time streaming. Every step appears as one trace timeline in the dashboard."
      />

      <P>
        This example connects three services: <Mono>payments</Mono> (worker),{" "}
        <Mono>orders</Mono> (caller + event publisher), and{" "}
        <Mono>notifications</Mono> (event consumer). Then wraps the whole flow in a workflow.
      </P>

      <H2 id="payments-worker">Payments worker (RPC handler with streaming)</H2>
      <MultiCodeBlock
        code={{
          ts: `import { servicebridge } from "service-bridge";

const payments = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "payments");

payments.handleRpc("charge", async (payload: { orderId: string; amount: number }, ctx) => {
  await ctx?.stream.write({ status: "charging", orderId: payload.orderId }, "progress");

  // ... charge logic ...

  await ctx?.stream.write({ status: "charged" }, "progress");
  return { ok: true, txId: \`tx_\${Date.now()}\` };
});

await payments.serve({ host: "127.0.0.1" });`,
          go: `svc := servicebridge.New("127.0.0.1:14445", key, "payments", nil)

svc.HandleRpcWithOpts("charge",
  func(ctx context.Context, payload json.RawMessage, rpcCtx servicebridge.RpcContext) (any, error) {
    rpcCtx.Stream.Write(map[string]any{"status": "charging"}, "progress")
    // ... charge logic ...
    rpcCtx.Stream.Write(map[string]any{"status": "charged"}, "progress")
    return map[string]any{"ok": true, "tx_id": "tx_123"}, nil
  }, nil)

svc.Serve(ctx, nil)`,
          py: `from service_bridge import ServiceBridge

payments = ServiceBridge("127.0.0.1:14445", "key", "payments")

@payments.handle_rpc("charge")
async def charge(payload: dict, ctx) -> dict:
    await ctx.stream.write({"status": "charging", "order_id": payload["order_id"]}, "progress")
    # ... charge logic ...
    await ctx.stream.write({"status": "charged"}, "progress")
    return {"ok": True, "tx_id": f"tx_123"}

asyncio.run(payments.serve())`,
        }}
      />

      <H2 id="orders-caller">Orders service (RPC call + event publish)</H2>
      <MultiCodeBlock
        code={{
          ts: `const orders = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders");

const charge = await orders.rpc<{ ok: boolean; txId: string }>("payments/charge", {
  orderId: "ord_42",
  amount: 4990,
});

await orders.event("orders.completed", {
  orderId: "ord_42",
  txId: charge.txId,
}, {
  idempotencyKey: "order:ord_42:completed",
  headers: { source: "checkout" },
});`,
          go: `orders := servicebridge.New("127.0.0.1:14445", key, "orders", nil)

result, _ := orders.Rpc(ctx, "payments/charge", map[string]any{
  "order_id": "ord_42", "amount": 4990,
}, nil)

orders.Event(ctx, "orders.completed", map[string]any{
  "order_id": "ord_42",
}, &servicebridge.EventOpts{
  IdempotencyKey: "order:ord_42:completed",
  Headers:        map[string]string{"source": "checkout"},
})`,
          py: `orders = ServiceBridge("127.0.0.1:14445", "key", "orders")

async def process_order():
    charge = await orders.rpc("payments/charge", {
        "order_id": "ord_42",
        "amount": 4990,
    })

    await orders.event("orders.completed", {
        "order_id": "ord_42",
        "tx_id": charge["tx_id"],
    }, idempotency_key="order:ord_42:completed", headers={"source": "checkout"})`,
        }}
      />

      <H2 id="notifications">Notifications service (event consumer)</H2>
      <MultiCodeBlock
        code={{
          ts: `const notifications = servicebridge("127.0.0.1:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "notifications");

notifications.handleEvent("orders.*", async (payload, ctx) => {
  const body = payload as { orderId: string; txId: string };
  if (!body.orderId) {
    ctx.reject("missing_order_id");
    return;
  }
  await ctx.stream.write({ status: "sending_email", orderId: body.orderId }, "progress");
  // ... send email ...
});

await notifications.serve({ host: "127.0.0.1" });`,
          go: `notif := servicebridge.New("127.0.0.1:14445", key, "notifications", nil)

notif.HandleEvent("orders.*",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    ec.Stream.Write(map[string]any{"status": "sending_email"}, "progress")
    // ... send email ...
    return nil
  }, &servicebridge.HandleEventOpts{GroupName: "notifications.orders"})

notif.Serve(ctx, nil)`,
          py: `from service_bridge import ServiceBridge, EventContext

notifications = ServiceBridge("127.0.0.1:14445", "key", "notifications")

@notifications.handle_event("orders.*", group_name="notifications.orders")
async def on_order(payload: dict, ctx: EventContext) -> None:
    if not payload.get("order_id"):
        ctx.reject("missing_order_id")
        return
    await ctx.stream.write({"status": "sending_email"}, "progress")
    # ... send email ...

asyncio.run(notifications.serve())`,
        }}
      />

      <H2 id="workflow">Orchestrate as a workflow</H2>
      <P>
        Wrap the whole flow in a <Mono>workflow()</Mono> DAG. Each step runs only after its
        dependencies complete. The runtime tracks state — steps resume after restart.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await orders.workflow("order.fulfillment", [
  { id: "reserve",  type: "rpc",        ref: "inventory/reserve" },
  { id: "charge",   type: "rpc",        ref: "payments/charge",       deps: ["reserve"] },
  { id: "wait_dlv", type: "event_wait", ref: "shipping.delivered",    deps: ["charge"] },
  { id: "notify",   type: "event",      ref: "orders.fulfilled",      deps: ["wait_dlv"] },
]);`,
          go: `orders.Workflow(ctx, "order.fulfillment", []servicebridge.WorkflowStep{
  {ID: "reserve",  Type: "rpc",        Ref: "inventory/reserve"},
  {ID: "charge",   Type: "rpc",        Ref: "payments/charge",    Deps: []string{"reserve"}},
  {ID: "wait_dlv", Type: "event_wait", Ref: "shipping.delivered", Deps: []string{"charge"}},
  {ID: "notify",   Type: "event",      Ref: "orders.fulfilled",   Deps: []string{"wait_dlv"}},
})`,
          py: `from service_bridge import WorkflowStep

await orders.workflow("order.fulfillment", [
    WorkflowStep(id="reserve",  type="rpc",        ref="inventory/reserve"),
    WorkflowStep(id="charge",   type="rpc",        ref="payments/charge",       deps=["reserve"]),
    WorkflowStep(id="wait_dlv", type="event_wait",  ref="shipping.delivered",    deps=["charge"]),
    WorkflowStep(id="notify",   type="event",       ref="orders.fulfilled",      deps=["wait_dlv"]),
])`,
        }}
      />

      <Callout type="tip">
        Every step above — RPC call, event publish, event delivery, workflow execution — appears in
        a <strong>single trace timeline</strong> in the built-in dashboard. No OTEL collector
        needed.
      </Callout>
    </div>
  );
}
