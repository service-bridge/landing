import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageReconnectResume() {
  return (
    <div>
      <PageHeader
        badge="Transport & Resilience"
        title="Reconnect and Resume"
        description="ServiceBridge implements bidirectional selective replay for zero-loss reconnects with exponential backoff and PositionUpdate tracking."
      />

      <H2 id="resume-protocol">Resume Protocol</H2>
      <P>
        When a worker reconnects after a disconnect, the runtime can resume the session without
        re-registering handlers or replaying already-completed commands.
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>Server issues <Mono>resume_token</Mono> + <Mono>epoch</Mono> in HelloAck</li>
        <li>On reconnect, worker sends resume fields in Hello</li>
        <li>Server replays missed commands (filtered by <Mono>completed_command_ids</Mono>)</li>
        <li>Resumed session confirmed with <Mono>HelloAck(resumed=true)</Mono></li>
      </ol>
      <Callout type="tip">
        The resume window is 120 seconds. If the worker reconnects within this window, commands are
        replayed selectively — already-completed commands are skipped via the completed ID filter.
      </Callout>

      <H2 id="backoff">Backoff Strategy</H2>
      <P>
        The SDK uses exponential backoff with full jitter on reconnect attempts:
      </P>
      <DocCodeBlock
        lang="text"
        code={`base:     100ms
max:      30s
strategy: exponential with full jitter
retries:  infinite`}
      />
      <P>
        Full jitter spreads reconnect load across all workers during a mass-reconnect event (e.g. runtime
        restart), preventing thundering-herd spikes.
      </P>

      <H2 id="position-update">PositionUpdate</H2>
      <H3 id="why-position">Why it exists</H3>
      <P>
        The runtime needs to know which commands the worker has seen so it can set accurate replay
        boundaries on reconnect. The worker sends <Mono>PositionUpdate</Mono> proactively to advance
        the server-side cursor.
      </P>
      <H3 id="frequency">Frequency</H3>
      <P>
        Workers send <Mono>PositionUpdate</Mono> every 5 seconds or every 100 received frames, whichever
        comes first. This keeps the replay window tight and minimizes duplicate delivery.
      </P>
      <Callout type="info">
        PositionUpdate is a control-plane message sent over the session stream — it does not affect
        the data plane or RPC latency.
      </Callout>
    </div>
  );
}

export default PageReconnectResume;
