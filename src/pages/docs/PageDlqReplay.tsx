import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "DLQ & Replay",
    description:
      "When an event delivery fails too many times it lands in the dead-letter queue (DLQ). You inspect and replay DLQ entries from the dashboard — there is no SDK method for it.",

    introP1pre: "Each event is delivered to every subscribed consumer service. A delivery is retried with a backoff ladder. Once its attempts reach",
    introP1mid: "(default",
    introP1end: "), the runtime stops retrying and moves that delivery to the DLQ with reason",
    introP2pre: "Retry timing comes from the backoff ladder",
    introP2mid: ", applied with ±25% jitter. Both settings are DB-backed and editable at",
    introP2end: "in the dashboard, no restart required.",

    ladderTitle: "Default delivery settings",
    rowMaxAttempts: "Total delivery attempts before a delivery is dead-lettered.",
    rowLadder: "Comma-separated delay ladder (ms) between retries; the last value repeats. Applied with ±25% jitter.",
    rowVisibility: "How long a claimed delivery stays invisible before it can be reclaimed for redelivery.",
    rowRetention: "How long DLQ rows are kept before the GC worker purges them (default 30 days).",

    calloutSettings:
      "These live in the events section of runtime settings, not in your code. There is no retry-policy object on sb.event.handle() and no ctx.retry()/ctx.reject() — a handler simply throws to fail a delivery, and the runtime applies the ladder.",

    viaUiTitle: "Via dashboard",
    viaUiP1pre: "Open the",
    viaUiP1bold: "DLQ",
    viaUiP1end: "view in the dashboard (admin login required). Each row is one dead-lettered delivery — a unique (event, consumer service) pair — with its event name, the last error, attempt count and replay count.",
    viaUiOps: "From there you can:",
    viaUiItem1bold: "Replay",
    viaUiItem1: "— re-queue that delivery for its consumer. The runtime inserts a fresh pending delivery (skipped if one is already pending) and removes the DLQ row in the same transaction.",
    viaUiItem2bold: "Purge",
    viaUiItem2: "— delete DLQ rows without redelivering, optionally filtered by consumer service or event name.",
    viaUiReplayNote:
      "Replay re-delivers the same event to the same consumer with a clean attempt counter — it is not a new event and keeps the original event id. Replaying does not leave the old DLQ row behind; the row is consumed by the replay.",

    notesTitle: "Notes",
    noteRetentionPre: "DLQ rows are not kept forever. The GC worker purges rows older than",
    noteRetentionEnd: ". Replay before that window or the entry is gone.",
    noteAlertPre: "To get notified when deliveries start dead-lettering, add an alert rule with condition",
    noteAlertEnd: "in the dashboard; it fires when new DLQ entries appear.",
    noteIdempotencyPre: "Deliveries are",
    noteIdempotencyBold: "at-least-once",
    noteIdempotencyEnd: ", so a replayed event may be processed alongside a partial earlier attempt. Make event handlers idempotent (dedupe on a stable key from the payload).",
  },
  ru: {
    badge: "Production",
    title: "DLQ и воспроизведение",
    description:
      "Когда доставка события слишком много раз завершается ошибкой, она попадает в очередь мёртвых сообщений (DLQ). Просмотр и воспроизведение записей DLQ — из дашборда; метода в SDK для этого нет.",

    introP1pre: "Каждое событие доставляется каждому подписанному сервису-потребителю. Доставка повторяется по лестнице бэкоффа. Как только число попыток достигает",
    introP1mid: "(по умолчанию",
    introP1end: "), рантайм прекращает повторы и перемещает эту доставку в DLQ с причиной",
    introP2pre: "Тайминг повторов берётся из лестницы бэкоффа",
    introP2mid: ", применяется с джиттером ±25%. Обе настройки хранятся в БД и редактируются на",
    introP2end: "в дашборде, без перезапуска.",

    ladderTitle: "Настройки доставки по умолчанию",
    rowMaxAttempts: "Сколько всего попыток доставки до перемещения в DLQ.",
    rowLadder: "Лестница задержек (мс) между повторами через запятую; последнее значение повторяется. Применяется с джиттером ±25%.",
    rowVisibility: "Сколько взятая доставка остаётся невидимой, прежде чем её можно вернуть для повторной доставки.",
    rowRetention: "Сколько строки DLQ хранятся до того, как GC-воркер их удалит (по умолчанию 30 дней).",

    calloutSettings:
      "Они живут в секции events настроек рантайма, а не в коде. У sb.event.handle() нет объекта политики повтора, нет ctx.retry()/ctx.reject() — обработчик просто бросает ошибку, чтобы доставка считалась неуспешной, а рантайм применяет лестницу.",

    viaUiTitle: "Через дашборд",
    viaUiP1pre: "Откройте раздел",
    viaUiP1bold: "DLQ",
    viaUiP1end: "в дашборде (нужен вход администратора). Каждая строка — одна мёртвая доставка, уникальная пара (событие, сервис-потребитель), с именем события, последней ошибкой, числом попыток и числом воспроизведений.",
    viaUiOps: "Оттуда доступно:",
    viaUiItem1bold: "Replay",
    viaUiItem1: "— заново поставить эту доставку в очередь для её потребителя. Рантайм вставляет новую pending-доставку (пропускается, если pending уже есть) и в той же транзакции удаляет строку DLQ.",
    viaUiItem2bold: "Purge",
    viaUiItem2: "— удалить строки DLQ без повторной доставки, опционально с фильтром по сервису-потребителю или имени события.",
    viaUiReplayNote:
      "Replay повторно доставляет то же событие тому же потребителю с обнулённым счётчиком попыток — это не новое событие, исходный event id сохраняется. Воспроизведение не оставляет старую строку DLQ; строка поглощается воспроизведением.",

    notesTitle: "Заметки",
    noteRetentionPre: "Строки DLQ хранятся не вечно. GC-воркер удаляет строки старше",
    noteRetentionEnd: ". Воспроизводите до истечения этого окна, иначе запись исчезнет.",
    noteAlertPre: "Чтобы получать уведомления, когда доставки начинают попадать в DLQ, добавьте правило оповещения с условием",
    noteAlertEnd: "в дашборде; оно срабатывает при появлении новых записей DLQ.",
    noteIdempotencyPre: "Доставка —",
    noteIdempotencyBold: "at-least-once",
    noteIdempotencyEnd: ", поэтому воспроизведённое событие может обрабатываться вместе с частичной более ранней попыткой. Делайте обработчики событий идемпотентными (дедуп по стабильному ключу из payload).",
  },
};

export function PageDlqReplay() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>
        {t.introP1pre} <Mono>events.max_attempts</Mono> {t.introP1mid}{" "}
        <Mono>5</Mono>
        {t.introP1end} <Mono>max_attempts_exceeded</Mono>.
      </P>
      <P>
        {t.introP2pre} <Mono>events.backoff_ladder_ms</Mono>
        {t.introP2mid} <Mono>/settings</Mono>
        {t.introP2end}
      </P>

      <ParamTable
        rows={[
          { name: "events.max_attempts", type: "int", default: "5", desc: t.rowMaxAttempts },
          {
            name: "events.backoff_ladder_ms",
            type: "string",
            default: '"1000,5000,30000,120000,600000"',
            desc: t.rowLadder,
          },
          { name: "events.visibility_timeout_ms", type: "int64 ms", default: "30000", desc: t.rowVisibility },
          { name: "events.dlq_retention_ms", type: "int64 ms", default: "2592000000", desc: t.rowRetention },
        ]}
      />

      <Callout type="info">{t.calloutSettings}</Callout>

      <H2 id="via-ui">{t.viaUiTitle}</H2>
      <P>
        {t.viaUiP1pre} <strong>{t.viaUiP1bold}</strong> {t.viaUiP1end}
      </P>
      <P>{t.viaUiOps}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong>{t.viaUiItem1bold}</strong> {t.viaUiItem1}
        </li>
        <li>
          <strong>{t.viaUiItem2bold}</strong> {t.viaUiItem2}
        </li>
      </ul>
      <Callout type="info">{t.viaUiReplayNote}</Callout>

      <H2 id="notes">{t.notesTitle}</H2>
      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground my-3">
        <li>
          {t.noteRetentionPre} <Mono>events.dlq_retention_ms</Mono>
          {t.noteRetentionEnd}
        </li>
        <li>
          {t.noteAlertPre} <Mono>dlq_new</Mono> {t.noteAlertEnd}
        </li>
        <li>
          {t.noteIdempotencyPre} <strong>{t.noteIdempotencyBold}</strong>
          {t.noteIdempotencyEnd}
        </li>
      </ul>
      <MultiCodeBlock
        code={{
          ts: `sb.event.handle("orders.created", async (payload) => {
  // throwing fails the delivery; the runtime retries it on the
  // backoff ladder, then dead-letters after events.max_attempts.
  await chargeCustomer(payload);
});`,
          go: `sb.SubscribeEvent(c, "orders.created",
	func(ctx context.Context, e *orderpb.Created) error {
		// returning an error fails the delivery; the runtime retries it
		// on the backoff ladder, then dead-letters after events.max_attempts.
		return chargeCustomer(ctx, e)
	})`,
        }}
      />
    </div>
  );
}
