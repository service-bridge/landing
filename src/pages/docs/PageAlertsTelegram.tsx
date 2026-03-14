import { Callout, H2, P, PageHeader } from "../../ui/DocComponents";

export function PageAlertsTelegram() {
  return (
    <div>
      <PageHeader
        badge="Alerts"
        title="Telegram Binding"
        description="Link a Telegram chat to a notification channel. Uses a Telegram bot and a built-in binding flow to resolve your chat ID automatically."
      />

      <H2 id="steps">Binding steps</H2>
      <P>
        First, create a bot via{" "}
        <a
          href="https://t.me/BotFather"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          @BotFather
        </a>{" "}
        and copy the bot token. Then:
      </P>
      <ol className="list-none space-y-3 my-5">
        {[
          "In the dashboard, go to Alerts → Channels → Add Channel, select Telegram, and paste the bot token.",
          "Click Save. The channel status will show Pending.",
          "Click Get Binding Link. A deep link like https://t.me/YourBot?start=TOKEN will appear.",
          "Click the link (or copy and open on your phone). Telegram opens and shows a Start button.",
          "Press Start. The server receives your chat_id and marks the channel Active automatically.",
        ].map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-muted-foreground">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <Callout type="info">
        The binding link expires after <strong>10 minutes</strong>. If it expires, click{" "}
        <strong>Get Binding Link</strong> again to generate a new one. Each bot token runs a
        dedicated long-polling goroutine on the server — no webhook registration needed.
      </Callout>

      <H2 id="message-format">Alert message format</H2>
      <P>Telegram notifications are sent as Markdown-formatted messages. Example:</P>
      <div className="rounded-xl border border-surface-border bg-surface p-4 my-4 text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
        {`🚨 *DLQ spike* fired
Condition: dlq_new
Message: 3 new dead-letter message(s) in the last cycle
Time: 2026-03-08 10:00:30 UTC`}
      </div>
    </div>
  );
}
