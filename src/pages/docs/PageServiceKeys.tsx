import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageServiceKeys() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="Service Keys & RBAC"
        description="ServiceBridge uses a capability-based access model. Each service key defines explicit capabilities and optional fine-grained traffic policies enforced at multiple layers."
      />

      <P>
        Policies are enforced at the control plane, SDK, and worker levels. An empty policy field
        means unrestricted. All non-empty fields are enforced independently — a request must
        satisfy all applicable rules.
      </P>

      <H2 id="capabilities">Capabilities</H2>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2.5 font-semibold">Capability</th>
              <th className="px-4 py-2.5 font-semibold">Allows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {[
              ["rpc.call", "Discover and call RPC functions on other services"],
              ["rpc.handle", "Register RPC handlers and send function heartbeats"],
              ["events.publish", "Publish events to topics"],
              ["events.handle", "Register consumer groups/members and event heartbeats"],
              ["jobs", "Register scheduled and delayed jobs"],
              ["workflows", "Register workflow definitions"],
            ].map(([capability, desc]) => (
              <tr key={capability} className="hover:bg-surface text-muted-foreground">
                <td className="px-4 py-2.5 font-mono text-xs text-violet-400">{capability}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info">
        Admin operations (create/revoke keys, replay DLQ, issue TLS certs) are performed via the{" "}
        <strong>dashboard</strong> with admin login. Service keys cannot manage other keys.
      </Callout>

      <Callout type="info">
        Service keys can be provided in two ways: <Mono>x-service-key: {"<key>"}</Mono> header OR{" "}
        <Mono>Authorization: Bearer {"<key>"}</Mono> header. Both are accepted by the runtime.
        Valid keys start with <Mono>sbv2.</Mono>; legacy <Mono>sb_</Mono> keys are disabled.
      </Callout>

      <Callout type="info">
        Keys support an optional expiration date (<Mono>expires_at</Mono>). Expired keys are
        automatically rejected. Each key also tracks <Mono>last_used_at</Mono>, updated on every
        use — useful for detecting dormant or potentially compromised keys.
      </Callout>

      <H2 id="policy">Granular Policy</H2>
      <P>
        Beyond capabilities, each key can carry fine-grained policy rules. All policies use
        comma-separated patterns with single-segment wildcard <Mono>*</Mono> (e.g.{" "}
        <Mono>orders.*</Mono>).
      </P>

      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2.5 font-semibold">Policy field</th>
              <th className="px-4 py-2.5 font-semibold">Enforced at</th>
              <th className="px-4 py-2.5 font-semibold">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {[
              ["allowed_topics", "Control plane (event())", "Topics this key may publish events to"],
              ["allowed_subscribe_topics", "Control plane (RegisterConsumerGroup)", "Event patterns this service may subscribe to"],
              ["allowed_functions", "Control plane (RegisterFunction)", "RPC function names this service may register"],
              ["allowed_call_targets", "Registry filter + SDK", "RPC functions this service may discover and call"],
              ["allowed_callers", "Registry + SDK + Worker", "Services allowed to call functions registered by this key"],
            ].map(([field, layer, desc]) => (
              <tr key={field} className="hover:bg-white/[0.02] text-muted-foreground">
                <td className="px-4 py-2.5 font-mono text-xs text-violet-400">{field}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground/70 whitespace-nowrap">{layer}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="warning">
        <strong>allowed_call_targets</strong> is a <em>discovery-only</em> restriction — it does{" "}
        <strong>not</strong> enforce at the wire level. For wire-level enforcement, configure{" "}
        <Mono>allowed_callers</Mono> on the receiving service's key.
      </Callout>

      <H2 id="key-example">Example: locked-down payments key</H2>
      <P>Create a service key from the <strong>Service Keys</strong> page in the dashboard:</P>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 my-3 text-sm">
        <li>Name: <Mono>payments-service</Mono></li>
        <li>Capabilities: <Mono>events.publish</Mono>, <Mono>events.handle</Mono>, <Mono>rpc.call</Mono>, <Mono>rpc.handle</Mono></li>
        <li>Allowed topics: <Mono>payments.*</Mono></li>
        <li>Allowed subscribe topics: <Mono>orders.*</Mono></li>
        <li>Allowed functions: <Mono>payments.*</Mono></li>
        <li>Allowed callers: <Mono>api-gateway</Mono></li>
      </ul>
      <P>
        This key can only handle/call <Mono>payments.*</Mono> RPC functions, publish to{" "}
        <Mono>payments.*</Mono> topics, subscribe to <Mono>orders.*</Mono>, and be called only by{" "}
        <Mono>api-gateway</Mono>.
      </P>
    </div>
  );
}
