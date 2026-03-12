import { ArrowLeft, ArrowRight, ExternalLink, Menu, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type TocItem = { id: string; label: string };
type NavItem = { id: string; label: string; toc: TocItem[] };
type NavGroup = { group: string; items: NavItem[] };

// ── Syntax highlighter ────────────────────────────────────────────────────────

const KW = new Set([
  "const",
  "let",
  "var",
  "async",
  "await",
  "import",
  "from",
  "export",
  "function",
  "return",
  "new",
  "true",
  "false",
  "if",
  "else",
  "try",
  "catch",
  "throw",
  "interface",
  "type",
  "extends",
  "implements",
]);

function toStableLineEntries(code: string) {
  return code.split("\n").reduce<Array<{ key: string; line: string }>>((acc, line) => {
    const duplicates = acc.filter((entry) => entry.line === line).length;
    acc.push({ key: `line-${line}-${duplicates}`, line });
    return acc;
  }, []);
}

function highlight(code: string): React.ReactNode[] {
  return toStableLineEntries(code).map(({ key, line }) => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    let k = 0;
    const push = (text: string, cls?: string) =>
      parts.push(
        <span key={k++} className={cls}>
          {text}
        </span>
      );

    while (i < line.length) {
      if (line[i] === "/" && line[i + 1] === "/") {
        push(line.slice(i), "text-zinc-500 italic");
        break;
      }
      if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
        const q = line[i];
        let j = i + 1;
        while (j < line.length && line[j] !== q) j++;
        push(line.slice(i, j + 1), "text-amber-300");
        i = j + 1;
        continue;
      }
      const m = line.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
      if (m) {
        const word = m[0];
        if (KW.has(word)) push(word, "text-violet-400 font-medium");
        else if (/^[A-Z]/.test(word)) push(word, "text-cyan-300");
        else push(word);
        i += word.length;
        continue;
      }
      push(line[i]);
      i++;
    }
    return (
      <span key={key} className="block leading-relaxed">
        {parts}
        {"\n"}
      </span>
    );
  });
}

// ── Shared components ─────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  bash: "Terminal",
  json: "JSON",
  sh: "Shell",
};

function CodeBlock({
  code,
  filename,
  lang = "ts",
}: {
  code: string;
  filename?: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const langLabel = LANG_LABELS[lang] ?? lang.toUpperCase();
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden my-4 text-sm shadow-sm">
      <div className="flex items-center justify-between bg-muted/60 border-b border-border px-4 py-2 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
          </div>
          {filename && (
            <span className="text-xs font-mono text-muted-foreground truncate">{filename}</span>
          )}
          <span className="text-3xs font-mono text-muted-foreground/50 uppercase tracking-wider shrink-0 ml-auto">
            {langLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-2xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 px-2 py-0.5 rounded bg-background/50 border border-border/50 hover:border-border"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs text-foreground/80 bg-background/40">
        <code>{lang === "ts" || lang === "js" ? highlight(code.trim()) : code.trim()}</code>
      </pre>
    </div>
  );
}

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-l-blue-500 bg-blue-500/[0.06] text-blue-300 [&_strong]:text-blue-200",
    warning: "border-l-amber-500 bg-amber-500/[0.06] text-amber-300 [&_strong]:text-amber-200",
    tip: "border-l-primary bg-primary/[0.06] text-primary/90 [&_strong]:text-primary",
  };
  const icons = {
    info: "ℹ",
    warning: "⚠",
    tip: "✦",
  };
  return (
    <div
      className={cn(
        "rounded-r-lg border-l-2 px-4 py-3 my-5 text-xs leading-relaxed flex gap-2.5",
        styles[type]
      )}
    >
      <span className="shrink-0 text-xs mt-0.5 opacity-70">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

function ParamTable({
  rows,
}: {
  rows: { name: string; type: string; default?: string; desc: string }[];
}) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-3xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-semibold">Parameter</th>
            <th className="px-4 py-2.5 font-semibold">Type</th>
            <th className="px-4 py-2.5 font-semibold">Default</th>
            <th className="px-4 py-2.5 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-primary font-medium">{r.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-blue-400/80">{r.type}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {r.default ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvTable({ rows }: { rows: { name: string; default?: string; desc: string }[] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-3xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-semibold">Variable</th>
            <th className="px-4 py-2.5 font-semibold">Default</th>
            <th className="px-4 py-2.5 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-amber-400/80 font-medium">
                {r.name}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {r.default ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-lg font-bold font-display mt-10 mb-3 text-foreground scroll-mt-8 group flex items-center gap-2"
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-30 text-muted-foreground transition-opacity text-sm font-normal"
      >
        #
      </a>
    </h2>
  );
}

function H3({ id, children }: { id: string; children?: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="text-sm font-semibold mt-7 mb-2.5 text-foreground/85 scroll-mt-8 group flex items-center gap-2"
    >
      {children}
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-30 text-muted-foreground transition-opacity text-xs font-normal"
      >
        #
      </a>
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-muted-foreground mb-3.5">{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs font-mono bg-muted text-primary px-1.5 py-0.5 rounded border border-border/50">
      {children}
    </code>
  );
}

function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mb-8 pb-7 border-b border-border">
      {badge && (
        <span className="inline-flex items-center text-3xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full mb-4">
          {badge}
        </span>
      )}
      <h1 className="text-2xl font-bold font-display text-foreground mb-3 leading-tight tracking-tight">
        {title}
      </h1>
      {description && <p className="type-body text-muted-foreground">{description}</p>}
    </div>
  );
}

// ── NAV data ──────────────────────────────────────────────────────────────────

const NAV: NavGroup[] = [
  {
    group: "Getting Started",
    items: [
      {
        id: "installation",
        label: "Installation",
        toc: [
          { id: "start-server", label: "Start the server" },
          { id: "install-sdk", label: "Install the SDK" },
        ],
      },
      { id: "quick-start", label: "Quick Start", toc: [] },
    ],
  },
  {
    group: "Core Concepts",
    items: [
      { id: "architecture", label: "Architecture", toc: [] },
      { id: "primitives", label: "Primitives", toc: [] },
    ],
  },
  {
    group: "SDK API",
    items: [
      { id: "rpc-call", label: "rpc()", toc: [] },
      { id: "rpc-handle", label: "handleRpc()", toc: [] },
      { id: "schema", label: "RPC Schema (optional)", toc: [] },
      { id: "serve", label: "serve() & stop()", toc: [] },
      { id: "event-publish", label: "event()", toc: [] },
      {
        id: "event-handle",
        label: "handleEvent()",
        toc: [
          { id: "consumer-groups", label: "Consumer Groups" },
          { id: "topic-wildcards", label: "Topic Wildcards" },
        ],
      },
      { id: "jobs", label: "job()", toc: [] },
      {
        id: "workflows",
        label: "workflow()",
        toc: [
          "Step Types",
          "WorkflowStep Fields",
          "Parallel Steps (Fan-Out / Fan-In)",
          "Conditional Branching (if)",
          "Sleep / Delayed Continuation",
          "Wait for Event (event_wait)",
          "Child Workflows",
          "Cancellation",
          { id: "run-workflow", label: "runWorkflow()" },
          "Input Mapping",
          "Migration Guide",
        ],
      },
      {
        id: "realtime-streams",
        label: "Realtime Streams",
        toc: [
          { id: "stream-write", label: "ctx.stream.write()" },
          { id: "watch-run", label: "sb.watchRun()" },
          { id: "stream-keys", label: "Named Keys" },
          { id: "stream-replay", label: "Replay History" },
        ],
      },
    ],
  },
  {
    group: "HTTP Integration",
    items: [
      { id: "express", label: "Express", toc: [] },
      { id: "fastify", label: "Fastify", toc: [] },
    ],
  },
  {
    group: "Tracing",
    items: [
      { id: "tracing", label: "Distributed Tracing", toc: [] },
      { id: "manual-spans", label: "Manual Spans", toc: [] },
    ],
  },
  {
    group: "Configuration",
    items: [
      { id: "sdk-options", label: "SDK Options", toc: [] },
      {
        id: "server-config",
        label: "Server Variables",
        toc: [
          { id: "access-security", label: "Access & Security" },
          { id: "network-vars", label: "Network" },
          { id: "tls-vars", label: "TLS" },
          { id: "database-vars", label: "Database" },
          { id: "advanced-vars", label: "Advanced Tuning" },
          { id: "delivery-vars", label: "Delivery" },
          { id: "retention-vars", label: "Retention" },
        ],
      },
    ],
  },
  {
    group: "Production",
    items: [
      { id: "reliability", label: "Reliability Semantics", toc: [] },
      { id: "offline-queue", label: "Offline Queue", toc: [] },
    ],
  },
  {
    group: "Security",
    items: [
      {
        id: "service-keys",
        label: "Service Keys & RBAC",
        toc: [
          { id: "capabilities", label: "Capabilities" },
          { id: "policy", label: "Granular Policy" },
          { id: "key-example", label: "Example" },
        ],
      },
      {
        id: "tls-mtls",
        label: "TLS / mTLS",
        toc: [
          { id: "tls-auto", label: "Auto mode" },
          { id: "tls-manual", label: "Manual mode" },
          { id: "tls-issue", label: "Client cert issuance" },
        ],
      },
    ],
  },
  {
    group: "Advanced",
    items: [
      { id: "filter-expr", label: "Filter Expressions", toc: [] },
      { id: "dlq-replay", label: "DLQ & Replay", toc: [] },
    ],
  },
  {
    group: "Alerts",
    items: [
      { id: "alerts-overview", label: "Overview", toc: [] },
      {
        id: "alerts-rules",
        label: "Alert Rules",
        toc: [
          { id: "condition-types", label: "Condition Types" },
          { id: "rule-settings", label: "Rule Settings" },
        ],
      },
      {
        id: "alerts-channels",
        label: "Notification Channels",
        toc: [{ id: "webhook-payload", label: "Webhook Payload" }],
      },
      { id: "alerts-telegram", label: "Telegram Binding", toc: [] },
    ],
  },
];

const ALL_PAGES: NavItem[] = NAV.flatMap((g) => g.items);

// ── Page components ───────────────────────────────────────────────────────────

function PageInstallation() {
  return (
    <div>
      <PageHeader
        title="Installation"
        badge="Getting Started"
        description="ServiceBridge consists of two parts: the server (control plane + PostgreSQL) and the SDK (installed in each Node.js service)."
      />
      <H3 id="start-server">Start the server</H3>
      <CodeBlock
        filename="terminal"
        lang="bash"
        code={`git clone https://github.com/esurkov1/connectr
cd connectr
docker compose up -d

# HTTP dashboard: http://localhost:14444
# gRPC endpoint:  localhost:14445`}
      />
      <H3 id="install-sdk">Install the SDK</H3>
      <CodeBlock
        filename="terminal"
        lang="bash"
        code={`npm install @service-bridge/node
# or
bun add @service-bridge/node`}
      />
      <Callout type="tip">
        Use a service key from the UI. In development, <Mono>dev-service-key</Mono> is auto-created.
      </Callout>
    </div>
  );
}

function PageQuickStart() {
  return (
    <div>
      <PageHeader
        title="Quick Start"
        badge="Getting Started"
        description="Create a service, register a handler, and start serving in a few lines."
      />
      <P>Register handlers and start the service:</P>
      <CodeBlock
        filename="my-service.ts"
        code={`import { servicebridge } from "@service-bridge/node";

const sb = servicebridge(
  "127.0.0.1:14445",
  process.env.SERVICE_KEY ?? process.env.SERVICEBRIDGE_SERVICE_KEY ?? "dev-service-key",
  "my-service"
);

// Handle incoming RPC calls
sb.handleRpc("greet", async (payload: { name: string }) => {
  return { message: \`Hello, \${payload.name}!\` };
});

// Subscribe to events
sb.handleEvent("user.*", async (payload, ctx) => {
  console.log("Event received:", payload);
});

// Start — registers with control plane and begins serving
await sb.serve();`}
      />
      <P>Call another service from anywhere:</P>
      <CodeBlock
        filename="caller.ts"
        code={`const result = await sb.rpc<{ message: string }>("greet", { name: "Alice" });
console.log(result.message); // "Hello, Alice!"`}
      />
      <Callout type="info">
        Once <Mono>serve()</Mono> resolves, the service is registered. Other services can
        immediately call its handlers via <Mono>rpc()</Mono>.
      </Callout>
    </div>
  );
}

function PageArchitecture() {
  return (
    <div>
      <PageHeader
        title="Architecture"
        badge="Core Concepts"
        description="ServiceBridge separates the control plane from the data plane. The control plane never sits in the hot path — RPC calls go directly between services."
      />
      <ul className="list-none space-y-3 my-5 text-sm">
        {[
          [
            "Control plane",
            "The Go server — manages event delivery, jobs, workflows, RPC endpoint resolution, and distributed tracing. Backed by PostgreSQL. Enforces service key capabilities and policies.",
          ],
          [
            "Data plane (RPC)",
            "Direct gRPC between services — zero extra hops, zero proxy latency. Each service authenticates with its own capability key. With mTLS enabled, the cert CN cryptographically backs the caller identity.",
          ],
          [
            "SDK",
            "Resolves RPC endpoints from the control plane, opens direct gRPC connections, and handles workflows as resumable step chains. Maintains an in-memory offline queue for events, jobs, and workflows while the server is unreachable — flushes automatically on reconnect.",
          ],
          [
            "UI",
            "Built-in React dashboard at port 14444. Live stats, run traces, service topology, DLQ management, and service key RBAC editor.",
          ],
        ].map(([term, desc]) => (
          <li key={term as string} className="flex gap-4">
            <span className="font-mono text-xs text-primary shrink-0 mt-0.5 w-32 leading-relaxed">
              {term}
            </span>
            <span className="text-zinc-400 leading-relaxed">{desc}</span>
          </li>
        ))}
      </ul>
      <CodeBlock
        filename="architecture diagram"
        lang="bash"
        code={`            ┌─ SERVICE KEY + mTLS (per service) ──────────────────────────────┐
            │  allowed_callers · allowed_functions · allowed_topics      │
            ▼                                                            ▼
┌─────────────────────┐       RPC (direct gRPC)       ┌─────────────────────┐
│     Service A       │ ────────────────────────────▶  │     Service B       │
│  SERVICE KEY + mTLS cert│ ◀────────────────────────────  │  SERVICE KEY + mTLS cert│
│  offline queue ✓    │                                │  offline queue ✓    │
└──────────┬──────────┘                                └──────────┬──────────┘
           │  event · job · workflow · http · trace               │
           └─────────────────────┬────────────────────────────────┘
                                 │  (SDK queues in-memory if unreachable)
                        ┌────────▼────────┐
                        │  ServiceBridge  │──── PostgreSQL
                        │  control plane  │     (events, jobs, workflows,
                        └────────┬────────┘      traces, RBAC, DLQ)
                                 │ WebSocket
                           [ Browser UI ]`}
      />
    </div>
  );
}

function PagePrimitives() {
  return (
    <div>
      <PageHeader
        title="Primitives"
        badge="Core Concepts"
        description="ServiceBridge exposes four primitives via a single SDK instance."
      />
      <div className="grid sm:grid-cols-2 gap-3 my-5">
        {[
          {
            name: "RPC",
            color: "blue",
            desc: "Synchronous request/response. Direct gRPC between services. Timeout, retries, round-robin load balancing.",
          },
          {
            name: "Events",
            color: "emerald",
            desc: "Async fan-out to subscriber groups. At-least-once delivery. Wildcard topics, retry policies, DLQ.",
          },
          {
            name: "Jobs",
            color: "amber",
            desc: "Cron and delayed one-shot tasks. Misfire handling. Executes via rpc, event, or workflow.",
          },
          {
            name: "Workflows",
            color: "violet",
            desc: "Multi-step saga as code. Chain rpc and event steps. Automatic retry, state, and failure handling.",
          },
        ].map((p) => (
          <div key={p.name} className="rounded-lg border border-surface-border bg-surface p-4">
            <p
              className={cn(
                "text-sm font-semibold mb-1.5",
                {
                  blue: "text-blue-400",
                  emerald: "text-emerald-400",
                  amber: "text-amber-400",
                  violet: "text-violet-400",
                }[p.color]
              )}
            >
              {p.name}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
      <P>
        All four primitives share a unified trace ID — spans cross service and primitive boundaries
        automatically.
      </P>
    </div>
  );
}

function PageRpcCall() {
  return (
    <div>
      <PageHeader
        title="rpc(fn, payload?, opts?)"
        badge="SDK API"
        description="Call a remote function registered on any service. The SDK resolves the endpoint from the cached registry and makes a direct gRPC call."
      />
      <CodeBlock
        code={`const result = await sb.rpc<ResponseType>("service.function", payload, opts);`}
      />
      <CodeBlock
        filename="example.ts"
        code={`// Basic call
const user = await sb.rpc<User>("users.get", { id: "u_123" });

// With options
const order = await sb.rpc<Order>("orders.create", { userId: "u_1", amount: 99.9 }, {
  timeout: 5000,    // ms
  retries: 2,
  retryDelay: 500,
});`}
      />
      <ParamTable
        rows={[
          {
            name: "fn",
            type: "string",
            desc: "Function name in format service.method or any dot-separated string.",
          },
          {
            name: "payload",
            type: "unknown",
            default: "undefined",
            desc: "Request payload. Serialized as JSON or Protobuf (with schema).",
          },
          {
            name: "timeout",
            type: "number",
            default: "30000",
            desc: "Call timeout in milliseconds.",
          },
          {
            name: "retries",
            type: "number",
            default: "3",
            desc: "Number of retry attempts on failure.",
          },
          {
            name: "retryDelay",
            type: "number",
            default: "300",
            desc: "Delay between retries in milliseconds.",
          },
          {
            name: "traceId",
            type: "string",
            default: "auto",
            desc: "Propagate an existing trace ID.",
          },
          {
            name: "parentSpanId",
            type: "string",
            default: "—",
            desc: "Parent span ID for nested traces.",
          },
        ]}
      />
    </div>
  );
}

function PageRpcHandle() {
  return (
    <div>
      <PageHeader
        title="handleRpc(fn, handler, opts?)"
        badge="SDK API"
        description="Register a handler for incoming RPC calls. The function name is registered in the service registry on serve()."
      />
      <CodeBlock
        filename="handler.ts"
        code={`sb.handleRpc("orders.create", async (payload: CreateOrderInput) => {
  const order = await db.createOrder(payload);
  return { orderId: order.id, status: "pending" };
}, {
  concurrency: 4,   // parallel goroutines serving this function
  timeout: 10_000,
  retryable: true,  // allow caller-side retries
});

// Throwing an error returns it to the caller
sb.handleRpc("orders.cancel", async (payload) => {
  if (!payload.orderId) throw new Error("orderId is required");
  await db.cancelOrder(payload.orderId);
  return { ok: true };
});`}
      />
      <ParamTable
        rows={[
          {
            name: "fn",
            type: "string",
            desc: "Function name to expose. Must be unique per service.",
          },
          {
            name: "handler",
            type: "FnHandler",
            desc: "Async function receiving payload, returning response or throwing error.",
          },
          {
            name: "timeout",
            type: "number",
            default: "30000",
            desc: "Handler execution timeout in milliseconds.",
          },
          {
            name: "concurrency",
            type: "number",
            default: "1",
            desc: "Max parallel executions of this handler.",
          },
          {
            name: "retryable",
            type: "boolean",
            default: "true",
            desc: "Whether callers may retry this call on failure.",
          },
        ]}
      />
    </div>
  );
}

function PageServe() {
  return (
    <div>
      <PageHeader
        title="serve() & stop()"
        badge="SDK API"
        description="serve() connects to the control plane, registers all handlers, and starts receiving requests. stop() gracefully deregisters."
      />
      <CodeBlock
        filename="server.ts"
        code={`// Standard startup
await sb.serve();

// With options
await sb.serve({
  host: "10.0.1.5",     // override auto-detected address
  instanceId: "svc-1",  // custom instance identifier
  weight: 2,            // load balancing weight (default: 1)
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await sb.stop();  // deregisters from control plane, drains in-flight calls
  process.exit(0);
});`}
      />
      <Callout type="info">
        <Mono>stop()</Mono> deregisters the service from the control plane. Other services will stop
        routing traffic to it within one heartbeat interval (~15 s by default).
      </Callout>
      <ParamTable
        rows={[
          {
            name: "host",
            type: "string",
            default: "auto",
            desc: "Override auto-detected bind address.",
          },
          {
            name: "instanceId",
            type: "string",
            default: "hostname",
            desc: "Custom instance identifier shown in the UI.",
          },
          {
            name: "weight",
            type: "number",
            default: "1",
            desc: "Load balancing weight. Higher = more traffic.",
          },
        ]}
      />
    </div>
  );
}

function PageEventPublish() {
  return (
    <div>
      <PageHeader
        title="event(topic, payload?, opts?)"
        badge="SDK API"
        description="Publish a durable event to all subscriber groups. Delivery is at-least-once. The event is persisted to PostgreSQL before event() returns."
      />
      <CodeBlock
        filename="events.ts"
        code={`// Publish a durable event
await sb.event("order.created", { orderId: "o_1", userId: "u_1" });

// With idempotency key — safe to retry on network error
await sb.event("payment.charged", { amount: 99.9 }, {
  idempotencyKey: \`charge-\${orderId}\`,
});

// With custom headers for trace propagation
await sb.event("notification.send", payload, {
  headers: { "x-tenant-id": tenantId },
});`}
      />
      <ParamTable
        rows={[
          {
            name: "topic",
            type: "string",
            desc: "Event topic. Supports dot-notation (e.g. order.created).",
          },
          {
            name: "payload",
            type: "unknown",
            default: "undefined",
            desc: "Event payload. Persisted as JSON.",
          },
          {
            name: "idempotencyKey",
            type: "string",
            desc: "Deduplication key. Duplicate events with the same key are ignored.",
          },
          {
            name: "traceId",
            type: "string",
            default: "auto",
            desc: "Propagate an existing trace ID.",
          },
          {
            name: "headers",
            type: "Record<string,string>",
            desc: "Custom metadata attached to the event delivery.",
          },
        ]}
      />
    </div>
  );
}

function PageEventHandle() {
  return (
    <div>
      <PageHeader
        title="handleEvent(pattern, handler, opts?)"
        badge="SDK API"
        description="Subscribe to events matching a topic pattern. Each subscriber group gets an independent delivery — fan-out is automatic."
      />

      <H2 id="consumer-groups">Consumer Groups</H2>
      <P>
        Every <Mono>handleEvent()</Mono> call joins a{" "}
        <strong className="text-foreground">consumer group</strong> — a named delivery queue.
        ServiceBridge uses the group name to decide routing:
      </P>
      <div className="space-y-2.5 my-4">
        {[
          [
            "emerald",
            "Fan-out (default)",
            "Different services use different group names → each group receives an independent copy of every matching event.",
          ],
          [
            "blue",
            "Load balancing",
            "Multiple instances share the same groupName → ServiceBridge delivers each event to exactly one instance, round-robin.",
          ],
          [
            "amber",
            "Default group name",
            "Auto-derived as service:pattern. Override only when you need explicit fan-out topology control.",
          ],
        ].map(([color, title, desc]) => (
          <div key={title} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                {
                  emerald: "bg-emerald-500",
                  blue: "bg-blue-500",
                  amber: "bg-amber-500",
                }[color as string]
              )}
            />
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong className="text-foreground">{title}:</strong> {desc}
            </p>
          </div>
        ))}
      </div>

      <CodeBlock
        filename="subscriber.ts"
        code={`// Basic handler
sb.handleEvent("order.created", async (payload: OrderPayload) => {
  await sendConfirmationEmail(payload);
});

// Retry on failure
sb.handleEvent("payment.*", async (payload, ctx) => {
  try {
    await processPayment(payload);
  } catch (err) {
    if (isTransient(err)) {
      await ctx.retry(5_000);  // retry after 5 seconds
    } else {
      ctx.reject("unrecoverable error"); // moves to DLQ immediately
    }
  }
}, {
  groupName: "payment-processor",
  concurrency: 8,
  prefetch: 4,
  retryPolicyJson: JSON.stringify({ maxAttempts: 5, backoffMs: 1000 }),
});`}
      />

      <H2 id="topic-wildcards">Topic Wildcards</H2>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5">Pattern</th>
              <th className="px-4 py-2.5">Matches</th>
              <th className="px-4 py-2.5">Does not match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-zinc-400 text-xs">
            {[
              ["order.created", "order.created", "order.updated"],
              ["order.*", "order.created, order.updated", "order.item.added"],
              ["*", "any single-segment topic", "order.created"],
            ].map(([pat, yes, no]) => (
              <tr key={pat as string}>
                <td className="px-4 py-2.5 text-primary">{pat}</td>
                <td className="px-4 py-2.5 text-emerald-400">{yes}</td>
                <td className="px-4 py-2.5 text-red-400/70">{no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ParamTable
        rows={[
          {
            name: "pattern",
            type: "string",
            desc: "Topic pattern. Exact match or wildcard with * (one segment).",
          },
          {
            name: "handler",
            type: "EventHandler",
            desc: "Async function receiving (payload, ctx). Throw to retry, ctx.reject() for DLQ.",
          },
          {
            name: "groupName",
            type: "string",
            default: "service:pattern",
            desc: "Subscriber group name. Instances with same groupName share load.",
          },
          {
            name: "concurrency",
            type: "number",
            default: "1",
            desc: "Max parallel event handlers.",
          },
          {
            name: "prefetch",
            type: "number",
            default: "1",
            desc: "Number of events to prefetch per worker.",
          },
          {
            name: "retryPolicyJson",
            type: "string",
            default: '"{}"',
            desc: "JSON retry policy with maxAttempts and backoffMs.",
          },
        ]}
      />
    </div>
  );
}

function PageJobs() {
  return (
    <div>
      <PageHeader
        title="job(target, opts)"
        badge="SDK API"
        description="Schedule recurring (cron) or one-shot delayed jobs. Jobs invoke a target via rpc, event, or workflow."
      />
      <CodeBlock
        filename="jobs.ts"
        code={`// Cron job — runs daily at 9am New York time
await sb.job("reports.generate", {
  cron: "0 9 * * *",
  timezone: "America/New_York",
  via: "rpc",
  misfire: "fire_now",  // run immediately if missed
});

// One-shot delayed job — fires once after 60 seconds
await sb.job("email.welcome", {
  delay: 60_000,
  via: "event",
});

// Scheduled workflow trigger
await sb.job("monthly-billing", {
  cron: "0 0 1 * *",
  via: "workflow",
  retryPolicyJson: JSON.stringify({ maxAttempts: 3 }),
});`}
      />
      <ParamTable
        rows={[
          {
            name: "target",
            type: "string",
            desc: "RPC function name, event topic, or workflow name to invoke.",
          },
          {
            name: "cron",
            type: "string",
            desc: "Cron expression (5-field). Mutually exclusive with delay.",
          },
          {
            name: "delay",
            type: "number",
            desc: "One-shot delay in milliseconds. Mutually exclusive with cron.",
          },
          {
            name: "timezone",
            type: "string",
            default: '"UTC"',
            desc: "IANA timezone for cron evaluation.",
          },
          {
            name: "misfire",
            type: '"fire_now" | "skip"',
            default: '"fire_now"',
            desc: "What to do if the server was down during the scheduled time.",
          },
          {
            name: "via",
            type: '"rpc" | "event" | "workflow"',
            default: '"rpc"',
            desc: "How the job invokes the target.",
          },
          { name: "retryPolicyJson", type: "string", default: '"{}"', desc: "JSON retry policy." },
        ]}
      />
    </div>
  );
}

function PageWorkflows() {
  return (
    <div>
      <PageHeader
        title="workflow(name, steps)"
        badge="SDK API"
        description="Define a multi-step DAG workflow. Steps execute in dependency order; independent branches run in parallel. The runtime handles state persistence, retries, sleep timers, event waits, and child workflows."
      />

      {/* ── Step type table ── */}
      <h3 className="text-base font-semibold mt-8 mb-3">Step Types</h3>
      <ParamTable
        rows={[
          { name: "rpc", type: "type", desc: 'Call a registered function. ref = "service.fn".' },
          { name: "event", type: "type", desc: "Publish an event. ref = topic." },
          {
            name: "event_wait",
            type: "type",
            desc: "Pause until a matching event arrives. ref = topic pattern (supports *).",
          },
          {
            name: "sleep",
            type: "type",
            desc: "Pause for durationMs ms without blocking a worker thread.",
          },
          {
            name: "workflow",
            type: "type",
            desc: "Launch a child workflow and wait for it. ref = child workflow name.",
          },
        ]}
      />

      {/* ── WorkflowStep fields ── */}
      <h3 className="text-base font-semibold mt-8 mb-3">WorkflowStep Fields</h3>
      <ParamTable
        rows={[
          {
            name: "id",
            type: "string",
            desc: "Required. Unique step identifier. Used in deps of other steps.",
          },
          {
            name: "type",
            type: "string",
            desc: "Required. One of: rpc | event | event_wait | sleep | workflow.",
          },
          { name: "ref", type: "string", desc: "Required for all types except sleep." },
          {
            name: "deps",
            type: "string[]",
            desc: "IDs of steps that must succeed before this step runs. [] = root step (receives workflow input directly).",
          },
          {
            name: "if",
            type: "string",
            desc: 'Filter expression evaluated against the step input. False → step is skipped. Syntax: "field=value", "amount>100", comma-separated AND.',
          },
          {
            name: "durationMs",
            type: "number",
            desc: "Required for sleep. How long to pause in milliseconds.",
          },
          {
            name: "timeoutMs",
            type: "number",
            desc: "Optional per-step timeout override for rpc and event_wait steps.",
          },
        ]}
      />

      {/* ── Fan-out / Fan-in ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Parallel Steps (Fan-Out / Fan-In)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Steps with no dependency overlap execute in parallel. A step with multiple deps (fan-in)
        receives a merged object keyed by dep ID.
      </p>
      <CodeBlock
        filename="parallel.ts"
        code={`await sb.workflow("order.fulfillment", [
  { id: "validate",  type: "rpc", ref: "order.validate",  deps: [] },
  // fan-out: these three run in parallel
  { id: "inventory", type: "rpc", ref: "inventory.check", deps: ["validate"] },
  { id: "payment",   type: "rpc", ref: "payment.charge",  deps: ["validate"] },
  { id: "notify",    type: "rpc", ref: "email.send",       deps: ["validate"] },
  // fan-in: input = { inventory: {...}, payment: {...}, notify: {...} }
  { id: "confirm",   type: "rpc", ref: "order.confirm",   deps: ["inventory", "payment", "notify"] },
]);`}
      />

      {/* ── Conditional branching ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Conditional Branching (if)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        The <code className="font-mono text-xs text-primary">if</code> field is evaluated against
        the step's resolved input. If it returns false, the step and all steps that depend{" "}
        <em>only</em> on it are <strong>skipped</strong>.
      </p>
      <CodeBlock
        filename="branching.ts"
        code={`await sb.workflow("kyc.review", [
  { id: "score",   type: "rpc", ref: "kyc.score",   deps: [] },
  { id: "approve", type: "rpc", ref: "kyc.approve", deps: ["score"], if: "status=approved" },
  { id: "reject",  type: "rpc", ref: "kyc.reject",  deps: ["score"], if: "status=rejected" },
]);

// if expressions use the same syntax as event filters:
// "field=value"   — equality
// "field!=value"  — inequality
// "amount>100"    — numeric comparison
// "a=x,b>5"       — AND (comma-separated)`}
      />

      {/* ── Sleep ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Sleep / Delayed Continuation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        A <code className="font-mono text-xs text-primary">sleep</code> step suspends the run
        without blocking a worker. The run is re-queued and resumes after the delay.
      </p>
      <CodeBlock
        filename="sleep.ts"
        code={`await sb.workflow("trial.reminder", [
  { id: "welcome",   type: "rpc",   ref: "email.welcome",  deps: [] },
  { id: "pause24h",  type: "sleep", durationMs: 86_400_000, deps: ["welcome"] },
  { id: "followup",  type: "rpc",   ref: "email.followup", deps: ["pause24h"] },
]);`}
      />

      {/* ── event_wait ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Wait for Event (event_wait)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Suspends the run until an event matching the topic pattern is published. The event payload
        becomes the step output. Use{" "}
        <code className="font-mono text-xs text-primary">timeoutMs</code> to fail the step if no
        event arrives in time.
      </p>
      <CodeBlock
        filename="event-wait.ts"
        code={`await sb.workflow("invoice.approval", [
  { id: "draft",    type: "rpc",        ref: "invoice.draft",    deps: [] },
  // pauses until invoice.approved or invoice.rejected is published
  { id: "review",   type: "event_wait", ref: "invoice.*",         deps: ["draft"], timeoutMs: 86_400_000 },
  { id: "finalize", type: "rpc",        ref: "invoice.finalize", deps: ["review"], if: "status=approved" },
  { id: "void",     type: "rpc",        ref: "invoice.void",     deps: ["review"], if: "status=rejected" },
]);`}
      />

      {/* ── Child workflows ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Child Workflows</h3>
      <p className="text-sm text-muted-foreground mb-4">
        A <code className="font-mono text-xs text-primary">workflow</code> step enqueues another
        workflow and suspends the parent until it completes. The child's output becomes the step
        output.
      </p>
      <CodeBlock
        filename="child-workflow.ts"
        code={`// Register the child first
await sb.workflow("kyc.check", [
  { id: "verify", type: "rpc", ref: "kyc.verify", deps: [] },
]);

// Use it as a step in the parent workflow
await sb.workflow("user.onboarding", [
  { id: "kyc",     type: "workflow", ref: "kyc.check",     deps: [] },
  { id: "welcome", type: "rpc",      ref: "email.welcome", deps: ["kyc"] },
]);`}
      />

      {/* ── Cancellation ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Cancellation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Cancel a running or waiting workflow run. The run transitions to{" "}
        <code className="font-mono text-xs text-primary">cancelled</code>. Any pending{" "}
        <code className="font-mono text-xs text-primary">event_wait</code> waiters are removed.
        Child workflows are <em>not</em> cancelled automatically.
      </p>
      <CodeBlock filename="cancel.ts" code={`await sb.cancelWorkflowRun(runId);`} />

      {/* ── runWorkflow() ── */}
      <h3 className="text-base font-semibold mt-10 mb-3" id="run-workflow">
        runWorkflow()
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start a workflow run from service code. Returns{" "}
        <code className="font-mono text-xs text-primary">{"{ runId, traceId }"}</code>. Pass{" "}
        <code className="font-mono text-xs text-primary">traceId</code> /{" "}
        <code className="font-mono text-xs text-primary">parentSpanId</code> in opts to link to the
        current span.
      </p>
      <CodeBlock
        filename="invoke-workflow.ts"
        code={`const { runId, traceId } = await sb.runWorkflow("order.fulfillment", { orderId: "o_123" });
// Or with trace propagation:
const { runId } = await sb.runWorkflow("order.fulfillment", payload, {
  traceId: ctx.traceId,
  parentSpanId: ctx.spanId,
});`}
      />

      {/* ── Input mapping ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Input Mapping</h3>
      <ParamTable
        rows={[
          { name: "deps: []  (root step)", type: "→", desc: "Workflow original input." },
          { name: "deps: ['a']", type: "→", desc: "Output of step a." },
          { name: "deps: ['a', 'b']", type: "→", desc: '{ "a": output_a, "b": output_b }' },
          { name: "dep is skipped", type: "→", desc: "Key present with value null." },
        ]}
      />

      {/* ── Migration guide ── */}
      <h3 className="text-base font-semibold mt-10 mb-3">Migration Guide — Sequential to DAG</h3>
      <Callout type="warning">
        The id field is now mandatory on every step. Auto-generated IDs (step-01 etc.) are no longer
        supported. Backward compatibility is intentionally removed — update all existing workflow
        definitions.
      </Callout>
      <CodeBlock
        filename="migration.ts"
        code={`// Before (sequential, auto-id — no longer works)
await sb.workflow("example", [
  { type: "rpc", ref: "a.fn" },
  { type: "rpc", ref: "b.fn" },
]);

// After (explicit id + deps)
await sb.workflow("example", [
  { id: "step-a", type: "rpc", ref: "a.fn", deps: [] },
  // deps: ["step-a"] means b runs after a
  { id: "step-b", type: "rpc", ref: "b.fn", deps: ["step-a"] },
]);`}
      />

      <Callout type="info">
        Workflow state is persisted to PostgreSQL as a version 2 DAG state object (keyed by step
        ID). Old v1 state blobs from sequential workflows are treated as fresh starts.
      </Callout>
    </div>
  );
}

function PageRealtimeStreams() {
  return (
    <div>
      <PageHeader
        title="Realtime Streams"
        badge="SDK API"
        description="Push incremental chunks from any handler while it executes. Subscribers — UI or SDK — receive every token the moment it's written, with automatic replay for late joiners."
      />

      <h3 className="text-base font-semibold mt-8 mb-3" id="stream-write">
        ctx.stream.write()
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Available inside <code className="font-mono text-xs text-primary">handleEvent</code> and{" "}
        <code className="font-mono text-xs text-primary">handleRpc</code> handlers as{" "}
        <code className="font-mono text-xs text-primary">ctx.stream</code>.
      </p>
      <CodeBlock
        filename="ai-service.ts"
        code={`import { servicebridge } from "@service-bridge/node";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY, "ai");

sb.handleEvent("ai.generate", async (payload, ctx) => {
  for await (const token of llm.stream(payload.prompt)) {
    await ctx.stream.write({ token }, "output");
  }
  // Optional: signal stream end explicitly
  // await ctx.stream.end("output");
});`}
      />
      <ParamTable
        rows={[
          {
            name: "data",
            type: "unknown",
            desc: "Any JSON-serializable value to append as a chunk.",
          },
          {
            name: "key",
            type: "string",
            desc: 'Named stream key. Default: "default". Use different keys for parallel streams (e.g. "output", "log", "progress").',
          },
        ]}
      />

      <h3 className="text-base font-semibold mt-8 mb-3" id="watch-run">
        sb.watchRun()
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Opens a gRPC server-streaming subscription and returns an{" "}
        <code className="font-mono text-xs text-primary">AsyncIterable</code> of{" "}
        <code className="font-mono text-xs text-primary">RunStreamEvent</code>.
      </p>
      <CodeBlock
        filename="subscriber.ts"
        code={`import { servicebridge } from "@service-bridge/node";

const sb = servicebridge("api.example.com:14445", SERVICE_KEY);

const runId = await sb.event("ai.generate", { prompt: "Tell me a story" });

for await (const chunk of sb.watchRun(runId, { key: "output" })) {
  if (chunk.type === "run_complete") {
    console.log("Done. Status:", chunk.runStatus);
    break;
  }
  process.stdout.write(chunk.data.token);
}`}
      />
      <ParamTable
        rows={[
          {
            name: "runId",
            type: "string",
            desc: "The trace/run ID returned by sb.event() or sb.rpc().",
          },
          {
            name: "opts.key",
            type: "string",
            desc: 'Stream key to subscribe to. Empty = all keys. Default: "default".',
          },
          {
            name: "opts.fromSequence",
            type: "number",
            desc: "Replay chunks starting after this sequence number. 0 = only new chunks (default).",
          },
        ]}
      />

      <h3 className="text-base font-semibold mt-8 mb-3" id="stream-keys">
        Named Keys
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Named keys let a single run push multiple independent streams in parallel.
      </p>
      <CodeBlock
        filename="multi-stream.ts"
        code={`// Writer — push to different keys simultaneously
sb.handleEvent("pipeline.run", async (payload, ctx) => {
  await Promise.all([
    ctx.stream.write({ line: "step 1 started" }, "log"),
    ctx.stream.write({ pct: 0 },               "progress"),
  ]);
  // ... processing ...
  await ctx.stream.write({ pct: 100 }, "progress");
});

// Reader — subscribe to each key independently
for await (const chunk of sb.watchRun(runId, { key: "log" })) { /* ... */ }
for await (const chunk of sb.watchRun(runId, { key: "progress" })) { /* ... */ }`}
      />

      <h3 className="text-base font-semibold mt-8 mb-3" id="stream-replay">
        Replay History
      </h3>
      <Callout type="info">
        All chunks are persisted to PostgreSQL (
        <code className="font-mono text-xs">run_streams</code> table). Subscribers that connect
        after chunks were written automatically receive all existing chunks before getting live
        ones. Pass <code className="font-mono text-xs">fromSequence</code> to start from a specific
        point.
      </Callout>

      <h3 className="text-base font-semibold mt-8 mb-3">UI Integration</h3>
      <p className="text-sm text-muted-foreground">
        The ServiceBridge dashboard shows a <strong>Live Output</strong> panel in the run detail
        sidebar for any active run that writes to a stream. Chunks appear as they arrive — no page
        reload needed.
      </p>
    </div>
  );
}

function PageSchema() {
  return (
    <div>
      <PageHeader
        title="RPC Schema (optional)"
        badge="RPC"
        description="Schema is an optional part of handleRpc(). Without a schema, payloads are encoded as JSON. Add opts.schema to enable automatic Protobuf encoding — no .proto files, no codegen."
      />
      <CodeBlock
        filename="schema.ts"
        code={`sb.handleRpc("orders.create", handler, {
  schema: {
    input: {
      userId:  { type: "string", id: 1 },
      amount:  { type: "double", id: 2 },
      items:   { type: "string", id: 3, repeated: true },
    },
    output: {
      orderId: { type: "string", id: 1 },
      status:  { type: "string", id: 2 },
    },
  },
});
// Schema is synced to registry on serve()
// Callers automatically switch to Protobuf encoding`}
      />
      <P>Available field types:</P>
      <div className="flex flex-wrap gap-2 my-3">
        {["string", "bytes", "int32", "int64", "uint32", "uint64", "float", "double", "bool"].map(
          (t) => (
            <code
              key={t}
              className="text-xs font-mono bg-white/[0.05] text-cyan-400 px-2 py-0.5 rounded"
            >
              {t}
            </code>
          )
        )}
      </div>
      <ParamTable
        rows={[
          { name: "type", type: "RpcFieldType", desc: "Protobuf-compatible field type." },
          {
            name: "id",
            type: "number",
            desc: "Unique field number (like Protobuf field number). Must be stable across deploys.",
          },
          {
            name: "repeated",
            type: "boolean",
            default: "false",
            desc: "Whether the field is an array.",
          },
        ]}
      />
    </div>
  );
}

function PageExpress() {
  return (
    <div>
      <PageHeader
        title="Express"
        badge="HTTP Integration"
        description="The @service-bridge/node/express package provides middleware for Express to propagate trace context from incoming HTTP requests into ServiceBridge calls."
      />
      <CodeBlock
        filename="express-app.ts"
        code={`import express from "express";
import { servicebridge } from "@service-bridge/node";
import { servicebridgeMiddleware } from "@service-bridge/node/express";

const sb = servicebridge("127.0.0.1:14445", serviceKey, "api-gateway");
await sb.serve();

const app = express();
app.use(servicebridgeMiddleware({ client: sb }));  // injects trace context

app.post("/orders", async (req, res) => {
  // sb.rpc() automatically carries the HTTP trace headers
  const order = await sb.rpc("orders.create", req.body);
  res.json(order);
});`}
      />
      <P>To extract trace context from arbitrary headers manually:</P>
      <CodeBlock
        code={`import { extractTraceFromHeaders } from "@service-bridge/node/express";

const traceCtx = extractTraceFromHeaders(req.headers);
const result = await sb.rpc("fn", payload, { traceId: traceCtx.traceId });`}
      />
    </div>
  );
}

function PageFastify() {
  return (
    <div>
      <PageHeader
        title="Fastify"
        badge="HTTP Integration"
        description="Use the servicebridgePlugin and wrapHandler to integrate trace propagation into Fastify applications."
      />
      <CodeBlock
        filename="fastify-app.ts"
        code={`import Fastify from "fastify";
import { servicebridge } from "@service-bridge/node";
import { servicebridgePlugin, wrapHandler } from "@service-bridge/node/fastify";

const sb = servicebridge("127.0.0.1:14445", serviceKey, "api-gateway");
await sb.serve();

const app = Fastify();
await app.register(servicebridgePlugin, { client: sb });

app.post("/orders", wrapHandler(async (req, reply) => {
  const order = await req.servicebridge.rpc("orders.create", req.body);
  reply.send(order);
}));`}
      />
      <Callout type="tip">
        <Mono>wrapHandler</Mono> automatically extracts incoming trace headers and sets the trace
        context for the duration of the request handler.
      </Callout>
    </div>
  );
}

function PageTracing() {
  return (
    <div>
      <PageHeader
        title="Distributed Tracing"
        badge="Tracing"
        description="Every RPC call, event delivery, job run, and workflow step is automatically traced end-to-end. No external tracing backend needed."
      />
      <P>
        Traces are stored in PostgreSQL and streamed to the UI via WebSocket. Trace context
        propagates automatically across <Mono>rpc()</Mono>, <Mono>event()</Mono>, <Mono>job()</Mono>
        , and <Mono>workflow()</Mono> calls. The UI shows a cross-service waterfall for each run.
      </P>
      <div className="grid sm:grid-cols-3 gap-3 my-5">
        {[
          [
            "HTTP spans",
            "Express/Fastify middleware or startHttpSpan() — request path in the trace graph",
          ],
          ["RPC spans", "Caller-side and handler-side spans linked by traceId + parentSpanId"],
          [
            "Event spans",
            "Publish span + per-subscriber delivery spans, grouped by consumer group",
          ],
          [
            "Job & Workflow",
            "Each step creates a child span. Failed steps show the error and retry chain",
          ],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-2xl border border-surface-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground mb-1.5">{title}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageManualSpans() {
  return (
    <div>
      <PageHeader
        title="Manual Spans"
        badge="Tracing"
        description="Record HTTP or custom spans manually to link external requests into the ServiceBridge trace graph."
      />
      <CodeBlock
        filename="spans.ts"
        code={`import { servicebridge, getTraceContext, runWithTraceContext } from "@service-bridge/node";

// Start an HTTP span (e.g. in a middleware)
const span = sb.startHttpSpan({
  method: "POST",
  url: "/orders",
  traceId: req.headers["x-trace-id"],
});

// Finish the span after the request
span.finish({ statusCode: 200 });

// Access the current trace context
const ctx = getTraceContext();

// Run code with an explicit trace context
await runWithTraceContext({ traceId: "t_abc", spanId: "s_1" }, async () => {
  await sb.rpc("orders.create", payload);
});`}
      />
    </div>
  );
}

function PageSdkOptions() {
  return (
    <div>
      <PageHeader
        title="SDK Options"
        badge="Configuration"
        description="Pass options as the fourth argument to servicebridge() to configure default behavior."
      />
      <CodeBlock
        filename="config.ts"
        code={`// Minimal — mTLS certs are auto-provisioned on serve().
// The SDK generates a key pair locally and posts only the public key to the server.
const sb = servicebridge(
  "127.0.0.1:14445",
  process.env.SERVICE_KEY!,
  "my-service"
);

// With options
const sb = servicebridge(
  "127.0.0.1:14445",
  process.env.SERVICE_KEY!,
  "my-service",
  {
    adminUrl: "http://127.0.0.1:14444", // HTTP admin URL (default: gRPC host on port 14444)
    retries: 3,
    retryDelay: 300,
    timeout: 30_000,
    discoveryRefreshMs: 10_000, // re-poll LookupFunction interval (default: 10 000 ms)
    queueMaxSize: 1_000,
    queueOverflow: "drop-oldest",
    heartbeatIntervalMs: 15_000,
    // Optional: explicit certs override auto-provisioning
    // workerTLS: { caCert: CA_PEM, cert: CERT_PEM, key: KEY_PEM },
  }
);`}
      />
      <Callout type="tip">
        A service key is all you need. On <Mono>serve()</Mono>, the SDK generates an ECDSA key pair
        locally, sends only the public key to <Mono>POST /api/tls/provision</Mono>, and receives a
        signed client cert. The private key never leaves your process.
      </Callout>
      <ParamTable
        rows={[
          {
            name: "adminUrl",
            type: "string",
            default: "http://host:14444",
            desc: "HTTP admin URL used for TLS auto-provisioning. Defaults to gRPC host on port 14444.",
          },
          {
            name: "workerTLS",
            type: "{ caCert, cert, key }",
            desc: "Explicit mTLS certs. Optional — if omitted, certs are provisioned automatically.",
          },
          {
            name: "retries",
            type: "number",
            default: "3",
            desc: "Default retry count for rpc() calls.",
          },
          {
            name: "retryDelay",
            type: "number",
            default: "300",
            desc: "Default delay between retries (ms).",
          },
          { name: "timeout", type: "number", default: "30000", desc: "Default call timeout (ms)." },
          {
            name: "discoveryRefreshMs",
            type: "number",
            default: "10000",
            desc: "How often each active channel re-polls LookupFunction to discover new replicas (ms). Dead workers are detected instantly by gRPC subchannel health probing.",
          },
          {
            name: "queueMaxSize",
            type: "number",
            default: "1000",
            desc: "Max offline queue size (events/jobs/workflows while disconnected).",
          },
          {
            name: "queueOverflow",
            type: '"drop-oldest" | "drop-newest" | "error"',
            default: '"drop-oldest"',
            desc: "What to do when offline queue is full.",
          },
          {
            name: "heartbeatIntervalMs",
            type: "number",
            default: "15000",
            desc: "Heartbeat interval for keeping the registry registration alive.",
          },
        ]}
      />
    </div>
  );
}

function PageServerConfig() {
  return (
    <div>
      <PageHeader
        title="Server Variables"
        badge="Configuration"
        description="Configure the ServiceBridge server via environment variables in .env or docker-compose.yml."
      />

      <H2 id="access-security">Access & Security</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_ADMIN_LOGIN",
            default: "admin",
            desc: "Login for the UI dashboard.",
          },
          {
            name: "SERVICEBRIDGE_ADMIN_PASSWORD_HASH",
            desc: "bcrypt hash of the admin password. Generate with: bun run admin:hash -- --password 'admin'",
          },
        ]}
      />

      <H2 id="network-vars">Network</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_HTTP_PORT",
            default: "14444",
            desc: "HTTP / WebSocket / UI port.",
          },
          {
            name: "SERVICEBRIDGE_GRPC_HOST",
            default: "127.0.0.1",
            desc: "gRPC bind address. Use 0.0.0.0 in containers.",
          },
          { name: "SERVICEBRIDGE_GRPC_PORT", default: "14445", desc: "gRPC port." },
        ]}
      />

      <H2 id="tls-vars">TLS</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_TLS_DIR",
            default: "./tls (CWD)",
            desc: "Where CA and server certs are stored. Default: ./tls next to the server. mTLS is always enabled.",
          },
        ]}
      />

      <H2 id="database-vars">Database</H2>
      <EnvTable
        rows={[{ name: "SERVICEBRIDGE_PG_URL", desc: "PostgreSQL connection URL (required)." }]}
      />

      <H2 id="advanced-vars">Advanced Tuning (for advanced configuration only)</H2>
      <P>
        The variables below are only needed for high-volume deployments or specific tuning. Defaults
        work for most users.
      </P>

      <H2 id="delivery-vars">Delivery</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_DISPATCH_BATCH",
            default: "100",
            desc: "Events dispatched per tick.",
          },
          {
            name: "SERVICEBRIDGE_DISPATCH_INTERVAL_MS",
            default: "300",
            desc: "Dispatch loop interval (ms).",
          },
          {
            name: "SERVICEBRIDGE_DELIVERY_LEASE_MS",
            default: "45000",
            desc: "How long a delivery is leased before re-queuing.",
          },
          {
            name: "SERVICEBRIDGE_HEARTBEAT_TTL_MS",
            default: "30000",
            desc: "Worker heartbeat TTL — dead workers pruned after this.",
          },
          {
            name: "SERVICEBRIDGE_MAX_PENDING_DELIVERIES",
            default: "200000",
            desc: "Max pending deliveries before backpressure.",
          },
        ]}
      />

      <H2 id="retention-vars">Retention & Cleanup</H2>
      <EnvTable
        rows={[
          {
            name: "SERVICEBRIDGE_RETENTION_DAYS",
            default: "0 (off)",
            desc: "Days to keep completed run records. 0 = disabled.",
          },
          {
            name: "SERVICEBRIDGE_RETENTION_INTERVAL_MIN",
            default: "60",
            desc: "How often the retention worker runs (minutes).",
          },
          {
            name: "SERVICEBRIDGE_RETAIN_SUCCESS_RUNS",
            default: "true",
            desc: "Whether to keep successful run records.",
          },
          {
            name: "SERVICEBRIDGE_RETAIN_ERROR_RUNS",
            default: "true",
            desc: "Whether to keep failed run records.",
          },
        ]}
      />
    </div>
  );
}

function PageReliability() {
  return (
    <div>
      <PageHeader
        title="Reliability Semantics"
        badge="Production"
        description="Understanding the delivery guarantees before going to production."
      />
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] my-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5">Primitive</th>
              <th className="px-4 py-2.5">Guarantee</th>
              <th className="px-4 py-2.5">On server outage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {[
              ["rpc()", "Best-effort with retries", "Uses cached registry — direct calls continue"],
              [
                "event()",
                "At-least-once, durable",
                "SDK queues in memory, flushes after reconnect",
              ],
              ["job()", "At-least-once, durable", "SDK queues in memory, flushes after reconnect"],
              [
                "workflow()",
                "Resumable, step-level durability",
                "Resumes from last completed step after restart",
              ],
            ].map(([prim, guarantee, outage]) => (
              <tr key={prim as string} className="text-zinc-400">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{prim}</td>
                <td className="px-4 py-2.5">{guarantee}</td>
                <td className="px-4 py-2.5 text-zinc-500">{outage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">
        Event delivery is <strong>at-least-once</strong>, not exactly-once. Design handlers to be
        idempotent, or use <Mono>idempotencyKey</Mono> to deduplicate.
      </Callout>
      <P>Event delivery status:</P>
      <ul className="list-none space-y-1.5 my-3 text-sm text-zinc-400">
        <li>
          <span className="font-mono text-emerald-400 mr-2">delivered</span>— All subscriber groups
          acknowledged delivery.
        </li>
        <li>
          <span className="font-mono text-amber-400 mr-2">partial_error</span>— At least one group
          moved to DLQ.
        </li>
        <li>
          <span className="font-mono text-red-400 mr-2">failed</span>— All retries exhausted, moved
          to DLQ.
        </li>
      </ul>
    </div>
  );
}

function PageOfflineQueue() {
  return (
    <div>
      <PageHeader
        title="Offline Queue"
        badge="Production"
        description="When the ServiceBridge server is unreachable, the SDK buffers operations in memory and flushes them automatically after reconnect."
      />
      <P>
        The SDK buffers <Mono>event()</Mono>, <Mono>job()</Mono>, <Mono>workflow()</Mono>, and
        telemetry operations in an in-memory queue. They are flushed automatically after reconnect —
        no code changes needed.
      </P>
      <CodeBlock
        filename="offline.ts"
        code={`const sb = servicebridge(url, serviceKey, "my-service", {
  queueMaxSize: 2_000,           // max buffered operations
  queueOverflow: "drop-oldest",  // eviction policy when full
});

// event() / job() / workflow() return immediately
// even when the server is down — they're queued
await sb.event("order.created", payload);  // buffered if offline

// On reconnect, the queue drains automatically
// No code changes needed`}
      />
      <Callout type="warning">
        The offline queue is in-memory. Operations queued while offline are lost if the process
        restarts before reconnecting. For critical operations, implement your own persistence layer.
      </Callout>
    </div>
  );
}

function PageServiceKeys() {
  return (
    <div>
      <PageHeader
        title="Service Keys & RBAC"
        badge="Security"
        description="ServiceBridge implements a capability-based access model. Service keys define explicit capabilities and optional traffic policies."
      />
      <P>
        Policies are enforced at the control plane, SDK, and worker levels. Empty policy field means
        unrestricted. All non-empty fields are enforced independently — a request must satisfy all
        applicable rules.
      </P>

      <H2 id="capabilities">Capabilities</H2>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">Capability</th>
              <th className="px-4 py-2.5 font-semibold">Allows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {[
              ["rpc.call", "Discover and call RPC functions"],
              ["rpc.handle", "Register RPC handlers and function heartbeats"],
              ["events.publish", "Publish events to topics"],
              ["events.handle", "Register consumer groups/members and event heartbeats"],
              ["jobs", "Register jobs"],
              ["workflows", "Register workflows"],
            ].map(([capability, desc]) => (
              <tr key={capability} className="hover:bg-surface text-zinc-300">
                <td className="px-4 py-2.5 font-mono text-xs text-violet-400">{capability}</td>
                <td className="px-4 py-2.5 text-xs text-zinc-400">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="info">
        Admin operations (create/revoke keys, replay DLQ, issue TLS certs) are performed via the{" "}
        <strong>UI</strong> with admin login. Service keys cannot manage other keys.
      </Callout>

      <H2 id="policy">Granular Policy</H2>
      <P>
        Beyond capabilities, each service key can carry fine-grained policy rules. All policies use
        comma-separated patterns with single-segment wildcard <Mono>*</Mono> (e.g.{" "}
        <Mono>orders.*</Mono>).
      </P>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5 font-semibold">Policy field</th>
              <th className="px-4 py-2.5 font-semibold">Enforced at</th>
              <th className="px-4 py-2.5 font-semibold">What it controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {[
              [
                "allowed_topics",
                "Control plane (event())",
                "Topics this key may publish events to",
              ],
              [
                "allowed_subscribe_topics",
                "Control plane (RegisterConsumerGroup)",
                "Event patterns this service may subscribe to",
              ],
              [
                "allowed_functions",
                "Control plane (RegisterFunction)",
                "RPC function names this service may register",
              ],
              [
                "allowed_call_targets",
                "Registry filter + SDK",
                "RPC functions this service may discover and call",
              ],
              [
                "allowed_callers",
                "Registry + SDK + Worker",
                "Services allowed to call functions registered by this key",
              ],
            ].map(([field, layer, desc]) => (
              <tr key={field} className="hover:bg-white/[0.02] text-zinc-300">
                <td className="px-4 py-2.5 font-mono text-xs text-violet-400">{field}</td>
                <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">{layer}</td>
                <td className="px-4 py-2.5 text-xs text-zinc-400">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">
        <strong>allowed_call_targets</strong> is a <em>discovery-only</em> restriction. It does{" "}
        <strong>not</strong> enforce at the wire level. For wire-level enforcement, configure{" "}
        <Mono>allowed_callers</Mono> on the receiving service.
      </Callout>

      <H2 id="key-example">Example</H2>
      <P>
        Create a locked-down service key via the <strong>Service Keys</strong> page in the UI:
      </P>
      <ul className="list-disc list-inside text-zinc-400 space-y-1 my-2">
        <li>
          Name: <Mono>payments-service</Mono>
        </li>
        <li>
          Capabilities: <Mono>events.publish</Mono>, <Mono>events.handle</Mono>,{" "}
          <Mono>rpc.call</Mono>, <Mono>rpc.handle</Mono>
        </li>
        <li>
          Allowed topics: <Mono>payments.*</Mono>
        </li>
        <li>
          Allowed subscribe topics: <Mono>orders.*</Mono>
        </li>
        <li>
          Allowed functions: <Mono>payments.*</Mono>
        </li>
        <li>
          Allowed callers: <Mono>api-gateway</Mono>
        </li>
      </ul>
    </div>
  );
}

function PageTlsMtls() {
  return (
    <div>
      <PageHeader
        title="TLS / mTLS"
        badge="Security"
        description="The control plane uses one-way TLS with service-key auth. Worker-to-worker calls use full mTLS. Certificates are provisioned automatically — no manual cert management needed."
      />

      <H2 id="tls-auto">Server-side auto-generated certs</H2>
      <P>
        On first start, the server generates a self-signed CA + server cert in <Mono>./tls</Mono>{" "}
        (next to the server) and reuses them across restarts. Override with{" "}
        <Mono>SERVICEBRIDGE_TLS_DIR</Mono>. Certs auto-renew 30 days before expiry.
      </P>

      <H2 id="tls-provision">SDK auto-provisioning (Variant B.1)</H2>
      <P>
        When you call <Mono>serve()</Mono>, the SDK automatically provisions mTLS client
        certificates:
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
        <li>SDK generates an ECDSA P-256 key pair locally.</li>
        <li>
          Sends <strong className="text-foreground">only the public key</strong> to{" "}
          <Mono>POST /api/tls/provision</Mono> (authenticated with the service key).
        </li>
        <li>Server signs the public key and returns a client cert + CA cert.</li>
        <li>
          Worker gRPC server starts with full mTLS.{" "}
          <strong className="text-foreground">The private key never leaves your process.</strong>
        </li>
      </ol>
      <CodeBlock
        lang="ts"
        filename="service.ts"
        code={`// Just a service key — everything else is automatic.
const sb = servicebridge("server:14445", SERVICE_KEY, "orders");
await sb.serve(); // ← provisions TLS here

// Optional: explicit certs override auto-provisioning
const sb = servicebridge("server:14445", SERVICE_KEY, "orders", {
  workerTLS: { caCert: CA_PEM, cert: CERT_PEM, key: KEY_PEM },
});`}
      />

      <H2 id="tls-arch">Architecture</H2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>
          <strong className="text-foreground">SDK → ServiceBridge:</strong> one-way TLS (server
          cert). Auth via <Mono>x-service-key</Mono> in gRPC metadata.
        </li>
        <li>
          <strong className="text-foreground">ServiceBridge → worker:</strong> full mTLS. Server
          presents its own cert (CN=ServiceBridge Server).
        </li>
        <li>
          <strong className="text-foreground">Worker → worker (direct RPC):</strong> full mTLS. Each
          side verifies the other's cert was signed by the same CA.
        </li>
        <li>
          If ServiceBridge goes down, direct RPC calls between services continue independently.
        </li>
      </ul>
    </div>
  );
}

function PageFilterExpr() {
  return (
    <div>
      <PageHeader
        title="Filter Expressions"
        badge="Advanced"
        description="Attach a filter expression when registering a consumer group to receive only matching events. Evaluated server-side before creating deliveries — non-matching messages incur no delivery overhead."
      />
      <P>
        <strong className="text-foreground">DSL syntax</strong> (comma = AND):
      </P>
      <CodeBlock
        lang="ts"
        filename="filter-syntax"
        code={`type=order.paid               // equality on dot-path field
amount>100                    // numeric greater-than
status=paid,amount>100        // AND (comma-separated)
region!=us-east               // inequality
price>=9.99                   // numeric >=`}
      />
      <CodeBlock
        lang="ts"
        filename="service.ts"
        code={`// Attach filter when subscribing
sb.handleEvent("orders.*", handler, {
  filterExpr: "status=paid,amount>100",
});`}
      />
      <P>Supported operators:</P>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5">Operator</th>
              <th className="px-4 py-2.5">Meaning</th>
              <th className="px-4 py-2.5">Works on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-zinc-400 text-xs">
            {[
              ["=", "equals", "string, number"],
              ["!=", "not equals", "string, number"],
              [">", "greater than", "number"],
              [">=", "greater than or equal", "number"],
              ["<", "less than", "number"],
              ["<=", "less than or equal", "number"],
            ].map(([op, meaning, works]) => (
              <tr key={op}>
                <td className="px-4 py-2.5 text-primary">{op}</td>
                <td className="px-4 py-2.5">{meaning}</td>
                <td className="px-4 py-2.5 text-zinc-500">{works}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageDlqReplay() {
  return (
    <div>
      <PageHeader
        title="DLQ & Replay"
        badge="Advanced"
        description="Dead-letter entries are created when a message exhausts all retry attempts. They can be replayed individually or in bulk."
      />
      <P>
        <strong className="text-foreground">Via UI:</strong> Open the DLQ page → click{" "}
        <strong>Replay All</strong> to re-publish up to 500 entries, or replay individual entries
        via the action button. Admin login required.
      </P>
      <Callout type="info">
        Replayed messages are published as new events with a fresh trace ID. The original DLQ entry
        is not deleted — use the UI to clear the DLQ after confirming successful redelivery.
      </Callout>
    </div>
  );
}

function PageAlertsOverview() {
  return (
    <div>
      <PageHeader
        title="Alerts Overview"
        badge="Alerts"
        description="ServiceBridge has a built-in alerting system that evaluates rules every 30 seconds and sends notifications to configured channels."
      />
      <P>
        Rules are managed entirely through the dashboard UI — no config files or restarts required.
        Alerts support three channel types: <strong className="text-foreground">UI push</strong>,{" "}
        <strong className="text-foreground">Telegram</strong>, and{" "}
        <strong className="text-foreground">Webhook</strong>.
      </P>
      <Callout type="tip">
        Alerts use a <strong>cooldown</strong> mechanism: once a rule fires, it won't fire again
        until the cooldown period has elapsed. This prevents alert storms during prolonged
        incidents.
      </Callout>
      <div className="grid sm:grid-cols-3 gap-3 my-5">
        {[
          [
            "6",
            "Alert condition types",
            "dlq_new, error_rate, service_offline, delivery_failures, job_error, workflow_error",
          ],
          ["3", "Channel types", "UI push via WebSocket, Telegram Bot API, custom Webhook"],
          ["30s", "Evaluation interval", "Rules are evaluated every 30 seconds on the server"],
        ].map(([num, label, desc]) => (
          <div key={label} className="rounded-2xl border border-surface-border bg-surface p-4">
            <p className="text-2xl font-bold font-display text-primary mb-1">{num}</p>
            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageAlertsRules() {
  return (
    <div>
      <PageHeader
        title="Alert Rules"
        badge="Alerts"
        description="Each rule has a condition type and a set of parameters stored as JSON. Six built-in condition types cover the most common failure scenarios."
      />

      <H2 id="condition-types">Condition Types</H2>
      <ParamTable
        rows={[
          {
            name: "dlq_new",
            type: "—",
            desc: "Fires whenever new DLQ entries appear since the last evaluation cycle.",
          },
          {
            name: "error_rate",
            type: "threshold_pct, window_minutes, service?",
            desc: "Fires when the error percentage of runs in the last window exceeds the threshold.",
          },
          {
            name: "service_offline",
            type: "service, offline_after_seconds",
            desc: "Fires when a specific service has not sent a heartbeat within the specified duration.",
          },
          {
            name: "delivery_failures",
            type: "threshold, window_minutes, topic?",
            desc: "Fires when the count of rejected/DLQ deliveries in the window exceeds the threshold.",
          },
          {
            name: "job_error",
            type: "threshold, window_minutes, job_ref?",
            desc: "Fires when the count of failed job executions in the window exceeds the threshold.",
          },
          {
            name: "workflow_error",
            type: "threshold, window_minutes, workflow_name?",
            desc: "Fires when the count of failed workflow runs in the window exceeds the threshold.",
          },
        ]}
      />

      <H2 id="rule-settings">Rule Settings</H2>
      <ParamTable
        rows={[
          {
            name: "cooldown_seconds",
            type: "number",
            default: "300",
            desc: "Minimum seconds between repeated notifications for the same rule.",
          },
          {
            name: "enabled",
            type: "boolean",
            default: "true",
            desc: "Rules can be toggled on/off from the UI without deleting them.",
          },
          {
            name: "channels",
            type: "Channel[]",
            desc: "One or more notification channels to deliver the alert to.",
          },
        ]}
      />
    </div>
  );
}

function PageAlertsChannels() {
  return (
    <div>
      <PageHeader
        title="Notification Channels"
        badge="Alerts"
        description="Three channel types are supported: UI push, Telegram Bot, and custom Webhook."
      />
      <ParamTable
        rows={[
          {
            name: "ui",
            type: "—",
            desc: "Real-time in-app notification delivered via WebSocket push to all connected dashboard clients.",
          },
          {
            name: "telegram",
            type: "bot_token, chat_id",
            desc: "Sends a Markdown-formatted message via Telegram Bot API. chat_id is resolved automatically via the binding flow.",
          },
          {
            name: "webhook",
            type: "url, headers?",
            desc: "HTTP POST with a structured JSON payload to any URL. Optional custom headers (e.g. Authorization).",
          },
        ]}
      />

      <H2 id="webhook-payload">Webhook Payload</H2>
      <P>The webhook payload schema:</P>
      <CodeBlock
        lang="json"
        filename="alert payload"
        code={`{
  "rule_id":        "uuid",
  "rule_name":      "DLQ spike",
  "condition_type": "dlq_new",
  "message":        "3 new dead-letter message(s) in the last cycle",
  "details":        { "dlq_count": 3, "since": "2026-03-08T10:00:00Z" },
  "fired_at":       "2026-03-08T10:00:30Z"
}`}
      />
    </div>
  );
}

function PageAlertsTelegram() {
  return (
    <div>
      <PageHeader
        title="Telegram Binding"
        badge="Alerts"
        description="Link a Telegram chat to a notification channel using a Telegram bot and the built-in binding flow."
      />
      <P>
        Create a bot via{" "}
        <a
          href="https://t.me/BotFather"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          @BotFather
        </a>{" "}
        and copy the bot token. Then follow the steps:
      </P>
      <ol className="list-none space-y-3 my-5">
        {[
          "In the dashboard, go to Alerts → Channels → Add Channel, select Telegram, and paste the bot token.",
          "Click Save. The channel status will show Pending.",
          "Click Get Binding Link. A deep link like https://t.me/YourBot?start=TOKEN will appear.",
          "Click the link (or copy it and open on your phone). Telegram opens and shows a Start button.",
          "Press Start. The server receives your chat_id and marks the channel Active automatically.",
        ].map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-zinc-400">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
      <Callout type="info">
        The binding link expires after 10 minutes. If it expires, click{" "}
        <strong>Get Binding Link</strong> again to generate a new one. Each bot token runs a
        dedicated long-polling goroutine on the server — no webhook registration needed.
      </Callout>
    </div>
  );
}

// ── Pages registry ────────────────────────────────────────────────────────────

const PAGES: Record<string, () => React.ReactNode> = {
  installation: PageInstallation,
  "quick-start": PageQuickStart,
  architecture: PageArchitecture,
  primitives: PagePrimitives,
  "rpc-call": PageRpcCall,
  "rpc-handle": PageRpcHandle,
  serve: PageServe,
  "event-publish": PageEventPublish,
  "event-handle": PageEventHandle,
  jobs: PageJobs,
  workflows: PageWorkflows,
  "realtime-streams": PageRealtimeStreams,
  schema: PageSchema,
  express: PageExpress,
  fastify: PageFastify,
  tracing: PageTracing,
  "manual-spans": PageManualSpans,
  "sdk-options": PageSdkOptions,
  "server-config": PageServerConfig,
  reliability: PageReliability,
  "offline-queue": PageOfflineQueue,
  "service-keys": PageServiceKeys,
  "tls-mtls": PageTlsMtls,
  "filter-expr": PageFilterExpr,
  "dlq-replay": PageDlqReplay,
  "alerts-overview": PageAlertsOverview,
  "alerts-rules": PageAlertsRules,
  "alerts-channels": PageAlertsChannels,
  "alerts-telegram": PageAlertsTelegram,
};

// ── SearchModal ───────────────────────────────────────────────────────────────

function SearchModal({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = NAV.flatMap((g) => g.items.map((item) => ({ ...item, group: g.group })));

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.group.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (filtered[selectedIndex]) {
        onNavigate(filtered[selectedIndex].id);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKey}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            <div className="py-1.5">
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer gap-3 mx-1 rounded-md",
                    i === selectedIndex
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-3xs text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                    {item.group}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-2xs text-muted-foreground/60 bg-muted/30">
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">
              ↵
            </kbd>{" "}
            select
          </span>
          <span>
            <kbd className="font-mono bg-background/50 border border-border px-1 py-0.5 rounded text-3xs">
              esc
            </kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}

// ── RightToc ─────────────────────────────────────────────────────────────────

function RightToc({
  toc,
  contentRoot,
}: {
  toc: TocItem[];
  contentRoot: React.RefObject<HTMLDivElement | null>;
}) {
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    setActiveId(toc[0]?.id ?? "");
  }, [toc]);

  useEffect(() => {
    const container = contentRoot.current;
    if (!container || !toc.length) return;

    const onScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let currentId = toc[0].id;
      for (const { id } of toc) {
        const el = document.getElementById(id);
        if (!el) continue;
        const elTop = el.getBoundingClientRect().top - containerTop;
        if (elTop <= 48) currentId = id;
      }
      setActiveId(currentId);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [toc, contentRoot.current]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!toc.length) return null;

  return (
    <aside className="hidden xl:block w-52 shrink-0 py-8 pl-8 pr-4">
      <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">
        On this page
      </p>
      <nav className="space-y-px border-l border-border">
        {toc.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={cn(
              "block w-full text-left text-xs py-1.5 pl-3.5 -ml-px transition-all cursor-pointer border-l",
              activeId === item.id
                ? "text-primary border-primary font-medium"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  activePage,
  onSelect,
  onSearch,
}: {
  activePage: string;
  onSelect: (id: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Search trigger */}
      <div className="px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={onSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/60 border border-border/60 hover:border-border hover:bg-muted text-sm text-muted-foreground transition-all cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Search docs...</span>
          <kbd className="hidden sm:block text-3xs bg-background/60 border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-4">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="px-2 mb-1.5 text-3xs font-semibold uppercase tracking-widest text-muted-foreground/50">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    activePage === item.id
                      ? "bg-primary/[0.15] text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border/50">
        <a
          href="https://github.com/service-bridge/sdk"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          GitHub
        </a>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DocsPage({ onBack }: { onBack: () => void }) {
  const [activePage, setActivePage] = useState("installation");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeItem = ALL_PAGES.find((p) => p.id === activePage);
  const currentIndex = ALL_PAGES.findIndex((p) => p.id === activePage);
  const prevPage = currentIndex > 0 ? ALL_PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < ALL_PAGES.length - 1 ? ALL_PAGES[currentIndex + 1] : null;
  const PageComponent = PAGES[activePage];

  const navigateTo = useCallback((id: string) => {
    setActivePage(id);
    setMobileNavOpen(false);
    contentRef.current?.scrollTo({ top: 0 });
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground font-sans flex">
      {/* Search modal */}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onNavigate={(id) => {
            navigateTo(id);
            setSearchOpen(false);
          }}
        />
      )}

      {/* ── Left sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border bg-card h-full">
        {/* Sidebar header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="p-1.5 bg-primary rounded-md text-primary-foreground">
              <BrandMark className="w-3.5 h-3.5" />
            </div>
            <span className="text-foreground">ServiceBridge</span>
            <span className="text-muted-foreground/40 font-normal text-xs">docs</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            title="Back to landing"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          <Sidebar
            activePage={activePage}
            onSelect={navigateTo}
            onSearch={() => setSearchOpen(true)}
          />
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm cursor-default"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-2xl">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                <div className="p-1 bg-primary rounded text-primary-foreground">
                  <BrandMark className="w-3.5 h-3.5" />
                </div>
                <span>ServiceBridge</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                activePage={activePage}
                onSelect={navigateTo}
                onSearch={() => {
                  setMobileNavOpen(false);
                  setSearchOpen(true);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ── Right: mobile topbar + content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden h-12 flex items-center gap-3 px-4 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm flex-1">
            <div className="p-1 bg-primary rounded text-primary-foreground">
              <BrandMark className="w-3.5 h-3.5" />
            </div>
            <span>ServiceBridge</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </header>

        {/* Content area */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex max-w-[900px] mx-auto">
            {/* Page content */}
            <div className="flex-1 min-w-0 px-6 sm:px-10 py-10 pb-28">
              {PageComponent && <PageComponent />}

              {/* Prev / Next navigation */}
              <div className="mt-14 pt-6 border-t border-border grid grid-cols-2 gap-3">
                {prevPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(prevPage.id)}
                    className="flex items-center gap-3 text-left p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.04] transition-all cursor-pointer group"
                  >
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0" />
                    <div>
                      <p className="text-3xs text-muted-foreground/60 uppercase tracking-wider mb-0.5 font-medium">
                        Previous
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {prevPage.label}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                {nextPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(nextPage.id)}
                    className="flex items-center gap-3 justify-end text-right p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/[0.04] transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-3xs text-muted-foreground/60 uppercase tracking-wider mb-0.5 font-medium">
                        Next
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {nextPage.label}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>

            {/* Right TOC */}
            <RightToc toc={activeItem?.toc ?? []} contentRoot={contentRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
