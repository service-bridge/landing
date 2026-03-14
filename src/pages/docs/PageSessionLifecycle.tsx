import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageSessionLifecycle() {
  return (
    <div>
      <PageHeader
        badge="Transport & Resilience"
        title="Session Lifecycle"
        description="ServiceBridge implements an Enterprise 8-state FSM for worker sessions — covering connect, suspend, fence, and drain paths."
      />

      <H2 id="states">States</H2>
      <P>Each worker session progresses through a deterministic finite state machine:</P>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-6 font-medium text-muted-foreground">State</th>
              <th className="text-left py-2 font-medium text-muted-foreground">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ["Connecting", "Initial state when worker opens stream"],
              ["Handshaking", "Hello/HelloAck exchange"],
              ["Ready", "Session established, waiting for commands"],
              ["Active", "Commands in-flight"],
              ["Suspended", "Heartbeat missed, temporary hold (ZooKeeper pattern)"],
              ["Draining", "Graceful shutdown in progress"],
              ["Fenced", "Epoch mismatch detected (Kafka KIP-848 pattern)"],
              ["Closed", "Session terminated"],
            ].map(([state, desc]) => (
              <tr key={state} className="border-b border-border/50">
                <td className="py-2 pr-6 font-mono text-foreground">{state}</td>
                <td className="py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="epoch-fencing">Epoch Fencing</H2>
      <P>
        When a new worker connects with the same <Mono>(service_name, instance_id)</Mono>, the
        server sends <Mono>GoawaySignal(FENCED)</Mono> to the old session. This prevents split-brain
        scenarios where two instances believe they are the active handler for the same logical slot.
      </P>
      <Callout type="warning">
        Epoch fencing is based on the Kafka KIP-848 pattern. The old session transitions immediately
        to <Mono>Closed</Mono> — any in-flight commands must be retried by the caller.
      </Callout>

      <H2 id="suspended-recovery">Suspended Recovery</H2>
      <P>
        If 2 or more consecutive heartbeats are missed, the session moves to <Mono>Suspended</Mono>{" "}
        state. Worker registrations are preserved in the registry. If a heartbeat resumes within 30
        seconds, the session recovers to <Mono>Ready</Mono> without re-registration — no command
        replay is needed.
      </P>
      <Callout type="tip">
        The Suspended state follows the ZooKeeper ephemeral node pattern: the session is logically
        alive but temporarily unreachable. Callers will not route to a suspended worker.
      </Callout>

      <H2 id="drain-path">Drain Path</H2>
      <P>
        Graceful shutdown sends a <Mono>DrainSignal</Mono> to the session. The worker stops
        accepting new commands and waits for in-flight work to complete. Once all inflight commands
        drain, the session moves to <Mono>Closed</Mono> and is removed from the manager.
      </P>
    </div>
  );
}

export default PageSessionLifecycle;
