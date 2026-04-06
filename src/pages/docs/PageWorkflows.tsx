import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";

export function PageWorkflows() {
  return (
    <div>
      <PageHeader
        badge="SDK Reference"
        title="Workflows"
        description="DAG-based orchestration of RPC calls, events, waits, and child workflows. Each step is durable — workflows resume from the last completed step after any restart."
      />

      {/* ── Concept ──────────────────────────────────────────────── */}
      <H2 id="concept">How it works</H2>
      <P>
        A workflow is a directed acyclic graph (DAG) of steps. Each step declares its dependencies
        via <Mono>deps</Mono>; steps without shared dependencies run in parallel automatically. The
        runtime persists each step's completion state in PostgreSQL — workflows survive restarts and
        resume from the last completed step. The full execution timeline is visible in the
        dashboard.
      </P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>rpc</Mono> — calls a registered handler and waits for the response
        </li>
        <li>
          <Mono>event</Mono> — publishes a durable event and continues immediately
        </li>
        <li>
          <Mono>event_wait</Mono> — suspends the workflow until a matching event arrives (with
          optional timeout)
        </li>
        <li>
          <Mono>sleep</Mono> — pauses for N milliseconds durably (survives restarts)
        </li>
        <li>
          <Mono>workflow</Mono> — starts a child workflow and waits for it to complete
        </li>
      </ul>

      <Callout type="info">
        Use <Mono>executeWorkflow(service, name, input)</Mono> to start a workflow on demand, or{" "}
        <Mono>job(name, {'{ via: "workflow" }'})</Mono> to trigger on a cron schedule.
      </Callout>

      {/* ── Handlers ─────────────────────────────────────────────── */}
      <H2 id="handlers">Define handlers first</H2>
      <P>
        Workflow steps call existing <Mono>rpc.handle</Mono> or <Mono>events.handle</Mono> handlers.
        Register them in your service workers before calling <Mono>start()</Mono>:
      </P>
      <MultiCodeBlock
        code={{
          ts: `// payments service
sb.rpc.handle("payment.charge", async (payload: { orderId: string; amount: number }) => {
  const tx = await stripe.charge(payload);
  return { txId: tx.id };
});

// inventory service
sb.rpc.handle("stock.reserve", async (payload: { orderId: string }) => {
  await db.reserve(payload.orderId);
  return { reserved: true };
});

// notifications — listens for the workflow's final event
sb.events.handle("orders.fulfilled", async (payload, ctx) => {
  await sendEmail(payload);
});`,
          go: `// payments service
svc.Rpc.Handle("payment.charge",
  func(ctx context.Context, payload json.RawMessage) (any, error) {
    return stripe.Charge(ctx, payload)
  })

// inventory service
svc.Rpc.Handle("stock.reserve",
  func(ctx context.Context, payload json.RawMessage) (any, error) {
    return db.Reserve(ctx, payload)
  })

// notifications
svc.Events.Handle("orders.fulfilled",
  func(ctx context.Context, payload json.RawMessage, ec *servicebridge.EventContext) error {
    return sendEmail(ctx, payload)
  }, nil)`,
          py: `# payments service
@sb.rpc.handle("payment.charge")
async def charge(payload: dict) -> dict:
    tx = await stripe.charge(payload)
    return {"tx_id": tx.id}

# inventory service
@sb.rpc.handle("stock.reserve")
async def reserve(payload: dict) -> dict:
    await db.reserve(payload["order_id"])
    return {"reserved": True}

# notifications
@sb.handle_event("orders.fulfilled")
async def on_fulfilled(payload: dict, ctx) -> None:
    await send_email(payload)`,
        }}
      />

      {/* ── workflow() ───────────────────────────────────────────── */}
      <H2 id="workflow-start">workflow() — register definition</H2>

      <H3 id="workflow-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `workflow(name: string, steps: WorkflowStep[], opts?: WorkflowOpts): Promise<string>`,
          go: `func (c *Client) Workflow(ctx context.Context, name string, steps []WorkflowStep, opts *servicebridge.WorkflowOpts) (string, error)`,
          py: `async def workflow(name: str, steps: list[WorkflowStep], opts: WorkflowOpts | None = None) -> str`,
        }}
      />
      <P>
        Returns the workflow definition ID. Calling <Mono>workflow()</Mono> with an existing name
        updates that definition in place.
      </P>

      <H3 id="step-fields">WorkflowStep fields</H3>
      <ParamTable
        rows={[
          {
            name: "id",
            type: "string",
            desc: "Unique step identifier within this workflow definition.",
          },
          {
            name: "type",
            type: '"rpc" | "event" | "event_wait" | "sleep" | "workflow"',
            desc: "Step execution type.",
          },
          {
            name: "service",
            type: "string",
            desc: '**Required** for "rpc" and "workflow" steps. Target logical service name (e.g. "inventory", "payments").',
          },
          {
            name: "ref",
            type: "string",
            desc: 'Required for all step types except "sleep". For rpc — the registered function name (e.g. "stock.reserve", "charge"). For event/event_wait — topic or pattern. For workflow — child workflow name. Always use dots, never slashes.',
          },
          {
            name: "deps",
            type: "string[]",
            default: "[]",
            desc: "Step IDs that must complete before this step runs. Steps with no shared deps run in parallel.",
          },
          {
            name: "if (Go/Node) / if_expr (Python)",
            type: "string",
            desc: 'Filter expression evaluated against the resolved input. If false, step is skipped (and cascades to downstream-only deps). Python uses if_expr because "if" is a reserved keyword.',
          },
          {
            name: "timeoutMs / TimeoutMs / timeout_ms",
            type: "number",
            desc: "Step-level timeout for rpc and event_wait steps.",
          },
          {
            name: "durationMs / DurationMs / duration_ms",
            type: "number",
            desc: 'Required for "sleep" steps. Pause duration in milliseconds.',
          },
        ]}
      />

      <H3 id="workflow-opts">WorkflowOpts</H3>
      <ParamTable
        rows={[
          {
            name: "stateLimitBytes / StateLimitBytes / state_limit_bytes",
            type: "number",
            default: "262144 (256 KB)",
            desc: "Maximum size in bytes of accumulated step state stored in PostgreSQL for this workflow execution.",
          },
          {
            name: "stepTimeoutMs / StepTimeoutMs / step_timeout_ms",
            type: "number",
            default: "30000 (30 s)",
            desc: "Default timeout applied to each step that does not have its own timeoutMs set.",
          },
        ]}
      />
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("order.fulfillment", steps, { stepTimeoutMs: 60000 })`,
          go: `svc.Workflow(ctx, "order.fulfillment", steps, &servicebridge.WorkflowOpts{StepTimeoutMs: 60000})`,
          py: `from service_bridge import WorkflowOpts
await sb.workflow("order.fulfillment", steps, WorkflowOpts(step_timeout_ms=60000))`,
        }}
      />

      {/* ── Output chaining ──────────────────────────────────────── */}
      <H2 id="output-chaining">Output chaining</H2>
      <P>The output of a step automatically becomes the input of dependent steps:</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong className="text-foreground">0 deps</strong> — step receives the original workflow
          execution input
        </li>
        <li>
          <strong className="text-foreground">1 dep</strong> — step receives that dep's output
          directly
        </li>
        <li>
          <strong className="text-foreground">2+ deps</strong> — step receives{" "}
          <Mono>{"{ depId: depOutput, ... }"}</Mono> map
        </li>
      </ul>
      <P>Built-in step output shapes (in addition to whatever the handler returns):</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>event</Mono> step output: <Mono>{'{ messageId: "...", committedAt: "..." }'}</Mono>
        </li>
        <li>
          <Mono>sleep</Mono> step output: <Mono>{"{ sleepMs: N }"}</Mono>
        </li>
      </ul>
      <P>
        Use the <Mono>if</Mono> field (<Mono>if_expr</Mono> in Python) to inspect chained input and
        conditionally skip a step.
      </P>

      {/* ── Main example ─────────────────────────────────────────── */}
      <H3 id="workflow-example">Order fulfillment workflow</H3>
      <MultiCodeBlock
        code={{
          ts: `const workflowDefinitionId = await sb.workflow("order.fulfillment", [
  { id: "reserve",  type: "rpc",        service: "inventory", ref: "stock.reserve" },
  { id: "charge",   type: "rpc",        service: "payments", ref: "payment.charge",    deps: ["reserve"] },
  { id: "wait_dlv", type: "event_wait", ref: "shipping.delivered", deps: ["charge"], timeoutMs: 86_400_000 },
  { id: "notify",   type: "event",      ref: "orders.fulfilled",   deps: ["wait_dlv"] },
]);`,
          go: `workflowDefinitionID, err := svc.Workflow(ctx, "order.fulfillment", []servicebridge.WorkflowStep{
  {ID: "reserve",  Type: "rpc",        Service: "inventory", Ref: "stock.reserve"},
  {ID: "charge",   Type: "rpc",        Service: "payments", Ref: "payment.charge",    Deps: []string{"reserve"}},
  {ID: "wait_dlv", Type: "event_wait", Ref: "shipping.delivered", Deps: []string{"charge"}, TimeoutMs: 86_400_000},
  {ID: "notify",   Type: "event",      Ref: "orders.fulfilled",   Deps: []string{"wait_dlv"}},
})`,
          py: `from service_bridge import WorkflowStep

workflow_id = await sb.workflow("order.fulfillment", [
    WorkflowStep(id="reserve",  type="rpc",        service="inventory", ref="stock.reserve"),
    WorkflowStep(id="charge",   type="rpc",        service="payments", ref="payment.charge",    deps=["reserve"]),
    WorkflowStep(id="wait_dlv", type="event_wait",  ref="shipping.delivered", deps=["charge"], timeout_ms=86_400_000),
    WorkflowStep(id="notify",   type="event",       ref="orders.fulfilled",   deps=["wait_dlv"]),
])`,
        }}
      />

      {/* ── Parallel steps ───────────────────────────────────────── */}
      <H3 id="parallel-steps">Parallel steps</H3>
      <P>Steps without shared dependencies execute in parallel automatically — no extra syntax:</P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("onboarding", [
  { id: "create_user",  type: "rpc",   service: "users", ref: "user.create" },
  // These two run in parallel after create_user:
  { id: "send_welcome", type: "event", ref: "emails.welcome",  deps: ["create_user"] },
  { id: "init_billing", type: "rpc",   service: "billing", ref: "subscription.init",    deps: ["create_user"] },
  // This waits for BOTH to finish:
  { id: "activate",     type: "rpc",   service: "users", ref: "user.activate",  deps: ["send_welcome", "init_billing"] },
]);`,
          go: `svc.Workflow(ctx, "onboarding", []servicebridge.WorkflowStep{
  {ID: "create_user",  Type: "rpc",   Service: "users", Ref: "user.create"},
  {ID: "send_welcome", Type: "event", Ref: "emails.welcome", Deps: []string{"create_user"}},
  {ID: "init_billing", Type: "rpc",   Service: "billing", Ref: "subscription.init",   Deps: []string{"create_user"}},
  {ID: "activate",     Type: "rpc",   Service: "users", Ref: "user.activate", Deps: []string{"send_welcome", "init_billing"}},
})`,
          py: `await sb.workflow("onboarding", [
    WorkflowStep(id="create_user",  type="rpc",   service="users", ref="user.create"),
    WorkflowStep(id="send_welcome", type="event", ref="emails.welcome",  deps=["create_user"]),
    WorkflowStep(id="init_billing", type="rpc",   service="billing", ref="subscription.init",    deps=["create_user"]),
    WorkflowStep(id="activate",     type="rpc",   service="users", ref="user.activate",  deps=["send_welcome", "init_billing"]),
])`,
        }}
      />

      {/* ── event_wait ───────────────────────────────────────────── */}
      <H2 id="event-wait">event_wait — suspend until an event</H2>
      <P>
        An <Mono>event_wait</Mono> step suspends the workflow until an event matching the topic
        pattern arrives. The matched event's payload becomes the step's output and is passed to
        downstream steps. Set <Mono>timeoutMs</Mono> to fail the step if no event arrives within the
        deadline — the step fails with <Mono>"event_wait timeout exceeded"</Mono>.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("payment.flow", [
  { id: "initiate",    type: "rpc",        service: "payments", ref: "payment.initiate" },
  // Suspend and wait up to 10 minutes for bank confirmation
  { id: "wait_bank",   type: "event_wait", ref: "payment.confirmed",
    deps: ["initiate"], timeoutMs: 600_000 },
  { id: "fulfill",     type: "rpc",        service: "orders", ref: "order.fulfill",
    deps: ["wait_bank"] },
]);`,
          go: `svc.Workflow(ctx, "payment.flow", []servicebridge.WorkflowStep{
  {ID: "initiate",  Type: "rpc",        Service: "payments", Ref: "payment.initiate"},
  {ID: "wait_bank", Type: "event_wait", Ref: "payment.confirmed",
   Deps: []string{"initiate"}, TimeoutMs: 600_000},
  {ID: "fulfill",   Type: "rpc",        Service: "orders", Ref: "order.fulfill",
   Deps: []string{"wait_bank"}},
})`,
          py: `await sb.workflow("payment.flow", [
    WorkflowStep(id="initiate",  type="rpc",        service="payments", ref="payment.initiate"),
    WorkflowStep(id="wait_bank", type="event_wait",  ref="payment.confirmed",
                 deps=["initiate"], timeout_ms=600_000),
    WorkflowStep(id="fulfill",   type="rpc",        service="orders", ref="order.fulfill",
                 deps=["wait_bank"]),
])`,
        }}
      />

      {/* ── Conditional steps ────────────────────────────────────── */}
      <H2 id="conditional-if">Conditional steps</H2>
      <P>
        Add an <Mono>if</Mono> field containing a filter expression to make a step conditional. The
        expression is evaluated against the step's resolved input (chained from deps). If the
        condition is false, the step status is set to <Mono>skipped</Mono> and downstream-only
        dependents cascade as skipped too.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("order.fulfillment", [
  { id: "reserve",   type: "rpc",   service: "inventory", ref: "stock.reserve" },
  { id: "charge",    type: "rpc",   service: "payments", ref: "payment.charge",  deps: ["reserve"] },
  // Only notify if reserve succeeded — "reserved" came from reserve's output
  { id: "notify",    type: "event", ref: "orders.confirmed",
    deps: ["charge"],
    if: "reserved=true" },
  // Only ship if payment ok
  { id: "ship",      type: "rpc",   service: "shipping", ref: "shipment.create",
    deps: ["notify"],
    if: "ok=true" },
]);`,
          go: `svc.Workflow(ctx, "order.fulfillment", []servicebridge.WorkflowStep{
  {ID: "reserve",  Type: "rpc",   Service: "inventory", Ref: "stock.reserve"},
  {ID: "charge",   Type: "rpc",   Service: "payments", Ref: "payment.charge",   Deps: []string{"reserve"}},
  {ID: "notify",   Type: "event", Ref: "orders.confirmed",
   Deps: []string{"charge"}, If: "reserved=true"},
  {ID: "ship",     Type: "rpc",   Service: "shipping", Ref: "shipment.create",
   Deps: []string{"notify"}, If: "ok=true"},
})`,
          py: `await sb.workflow("order.fulfillment", [
    WorkflowStep(id="reserve",  type="rpc",   service="inventory", ref="stock.reserve"),
    WorkflowStep(id="charge",   type="rpc",   service="payments", ref="payment.charge",   deps=["reserve"]),
    WorkflowStep(id="notify",   type="event", ref="orders.confirmed",
                 deps=["charge"],  if_expr="reserved=true"),
    WorkflowStep(id="ship",     type="rpc",   service="shipping", ref="shipment.create",
                 deps=["notify"],  if_expr="ok=true"),
])`,
        }}
      />

      {/* ── Child workflows ──────────────────────────────────────── */}
      <H2 id="child-workflow">Child workflows</H2>
      <P>
        A <Mono>type: "workflow"</Mono> step starts a named child workflow and suspends the parent
        until the child completes. The child workflow's final output becomes the step's output and
        is chained to downstream steps. Child workflows are <strong>not</strong> automatically
        cancelled when the parent is cancelled.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("order.post-purchase", [
  { id: "fulfillment", type: "workflow", service: "orders", ref: "order.fulfillment" },
  // Runs after the entire fulfillment sub-workflow completes:
  { id: "analytics",   type: "rpc",      service: "analytics", ref: "usage.record",
    deps: ["fulfillment"] },
  { id: "loyalty",     type: "rpc",      service: "rewards", ref: "loyalty.credit",
    deps: ["fulfillment"] },
]);`,
          go: `svc.Workflow(ctx, "order.post-purchase", []servicebridge.WorkflowStep{
  {ID: "fulfillment", Type: "workflow", Service: "orders", Ref: "order.fulfillment"},
  {ID: "analytics",   Type: "rpc",     Service: "analytics", Ref: "usage.record",
   Deps: []string{"fulfillment"}},
  {ID: "loyalty",     Type: "rpc",     Service: "rewards", Ref: "loyalty.credit",
   Deps: []string{"fulfillment"}},
})`,
          py: `await sb.workflow("order.post-purchase", [
    WorkflowStep(id="fulfillment", type="workflow", service="orders", ref="order.fulfillment"),
    WorkflowStep(id="analytics",   type="rpc",      service="analytics", ref="usage.record",  deps=["fulfillment"]),
    WorkflowStep(id="loyalty",     type="rpc",      service="rewards", ref="loyalty.credit",    deps=["fulfillment"]),
])`,
        }}
      />

      {/* ── Durable sleep ────────────────────────────────────────── */}
      <H2 id="sleep-step">Durable sleep</H2>
      <P>
        The <Mono>sleep</Mono> step pauses the workflow for a specified duration. The sleep deadline
        is stored in PostgreSQL — if the runtime restarts during the sleep, it resumes correctly
        after the deadline expires.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow("trial.expiry", [
  { id: "send_reminder", type: "rpc",   service: "emails", ref: "send.trial_reminder" },
  { id: "wait_7d",       type: "sleep", durationMs: 604_800_000,             deps: ["send_reminder"] },
  { id: "expire",        type: "rpc",   service: "billing", ref: "subscription.expire_trial",         deps: ["wait_7d"] },
]);`,
          go: `svc.Workflow(ctx, "trial.expiry", []servicebridge.WorkflowStep{
  {ID: "send_reminder", Type: "rpc",   Service: "emails", Ref: "send.trial_reminder"},
  {ID: "wait_7d",       Type: "sleep", DurationMs: 604_800_000,            Deps: []string{"send_reminder"}},
  {ID: "expire",        Type: "rpc",   Service: "billing", Ref: "subscription.expire_trial",        Deps: []string{"wait_7d"}},
})`,
          py: `await sb.workflow("trial.expiry", [
    WorkflowStep(id="send_reminder", type="rpc",   service="emails", ref="send.trial_reminder"),
    WorkflowStep(id="wait_7d",       type="sleep", duration_ms=604_800_000,           deps=["send_reminder"]),
    WorkflowStep(id="expire",        type="rpc",   service="billing", ref="subscription.expire_trial",        deps=["wait_7d"]),
])`,
        }}
      />

      {/* ── executeWorkflow() ────────────────────────────────────── */}
      <H2 id="run-workflow">executeWorkflow() — start a trace</H2>
      <P>
        Starts a workflow execution by service and name with an optional input payload. The workflow
        must be registered first via <Mono>workflow()</Mono> from that service. Returns an object with{" "}
        <Mono>traceId</Mono> and <Mono>groupTraceId</Mono> that you can use with <Mono>watchTrace()</Mono>{" "}
        or <Mono>cancelWorkflow()</Mono>.
      </P>

      <H3 id="run-workflow-signature">Signature</H3>
      <MultiCodeBlock
        code={{
          ts: `executeWorkflow(service: string, name: string, input?: unknown, opts?: ExecuteWorkflowOpts): Promise<{ traceId: string; groupTraceId: string }>`,
          go: `func (c *Client) ExecuteWorkflow(ctx context.Context, service string, name string, input any) (*ExecuteWorkflowResult, error)`,
          py: `async def execute_workflow(service: str, name: str, input: Any = None) -> dict[str, str]`,
        }}
      />
      <ParamTable
        rows={[
          {
            name: "service",
            type: "string",
            desc: "Logical service that owns the workflow definition (same as the worker's service name).",
          },
          {
            name: "name",
            type: "string",
            desc: "Name of a previously registered workflow definition.",
          },
          {
            name: "input",
            type: "object",
            default: "{}",
            desc: "JSON-serializable input passed to root steps (steps with no deps).",
          },
          {
            name: "opts.traceId",
            type: "string",
            desc: "Override trace ID for this workflow execution.",
          },
        ]}
      />

      <H3 id="run-workflow-example">Example</H3>
      <MultiCodeBlock
        code={{
          ts: `const { traceId, groupTraceId } = await sb.executeWorkflow("users", "user.onboarding", {
  userId: "u_123",
  email: "alice@example.com",
});
console.log("started trace", traceId, "group", groupTraceId);

// watch progress
const stream = sb.watchTrace(traceId, { key: "default" });
for await (const chunk of stream) {
  console.log(chunk.data);
  if (chunk.done) break;
}`,
          go: `result, err := svc.ExecuteWorkflow(ctx, "users", "user.onboarding", map[string]any{
  "userId": "u_123",
  "email":  "alice@example.com",
})
if err != nil {
  log.Fatal(err)
}
fmt.Printf("started trace %s, group %s\\n", result.TraceID, result.GroupTraceID)`,
          py: `result = await sb.execute_workflow("users", "user.onboarding", {
    "userId": "u_123",
    "email": "alice@example.com",
})
print(f"started trace {result['traceId']}, group {result['groupTraceId']}")`,
        }}
      />

      {/* ── Cancel ───────────────────────────────────────────────── */}
      <H2 id="cancel">Cancel a trace</H2>
      <P>
        Cancelling a workflow marks it as <Mono>cancelled</Mono>, clears any pending leases and event
        waiters, and closes the root span with an error status. In-flight steps that are already
        executing are not interrupted. Child workflows are <strong>not</strong> auto-cancelled.
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.cancelWorkflow("trace_01HQ...XYZ");`,
          go: `err := svc.CancelWorkflow(ctx, "trace_01HQ...XYZ")`,
          py: `await sb.cancel_workflow("trace_01HQ...XYZ")`,
        }}
      />

      <Callout type="info">
        Each step's completion state is persisted in PostgreSQL. The full execution timeline — step
        statuses, inputs, outputs, timings — is visible in the dashboard. Workflows survive runtime
        restarts and resume from the last completed step automatically.
      </Callout>
    </div>
  );
}
