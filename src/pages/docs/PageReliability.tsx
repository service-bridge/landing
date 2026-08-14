import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "Reliability Semantics",
    description:
      "What each primitive guarantees, and how the SDK behaves when the runtime is temporarily unreachable.",

    guaranteesTitle: "Delivery guarantees",
    guaranteesP:
      "Each primitive has a different delivery contract. Pick handlers and retry expectations based on the contract you actually get.",

    eventsTitle: "Events — at-least-once",
    eventsP1:
      "Every publish goes through a local SQLite outbox first, then a background drainer ships rows to the runtime. The runtime routes the event, retries failed deliveries, and parks them in a DLQ after the attempts run out. A subscriber that throws or returns a decode error sends a Nack, which makes the runtime retry that delivery.",
    eventsP2:
      "Because delivery is at-least-once, a handler can run more than once for the same event. Make handlers idempotent — keying writes by event id is the simplest way.",
    eventsIdemNote1: "On the publisher side, set",
    eventsIdemNote2:
      "so the runtime deduplicates retried publishes of the same logical event within its dedup window.",

    rpcTitle: "RPC — retries with timeout",
    rpcP1:
      "By default a call is retried up to 3 attempts with exponential backoff and jitter, so a silent downstream is cut off and retried instead of hanging forever. In Node each attempt carries its own timeout (default 30s) and the whole policy is a per-call RetryOpts; set maxAttempts: 1 to disable retries for a non-idempotent call. In Go the budget is one client-wide option, sb.WithCallAttempts(n) (default 3, 1 disables retries), and a call is bounded by sb.WithTimeout or the caller's context deadline.",
    retryHead: "RetryOpts defaults (Node)",
    retryMaxAttempts: "Total attempts including the first. Set to 1 to disable retries.",
    retryBaseDelay: "Delay before the first retry; grows exponentially.",
    retryFactor: "Multiplier applied to the delay on each subsequent attempt.",
    retryMaxDelay: "Upper bound on the backoff delay.",
    retryJitter: "Random fraction (0–1) added to each delay to spread retries.",
    rpcIdemNote1: "Pass",
    rpcIdemNote2:
      "to make a write-RPC safe to retry: the runtime claims the key, and replays within the TTL return the cached response instead of running the handler twice.",

    outageTitle: "On server outage",
    outageP:
      "The control plane (port 14445) can go away for a while. Here is what keeps working and what waits.",

    outageEventsTitle: "Events keep buffering",
    outageEventsP:
      "Publishes still succeed: they land in the local SQLite outbox on disk. The drainer keeps retrying with backoff until the runtime is reachable again, then flushes the backlog. Nothing is lost across a restart — on startup any stuck rows are reset and re-queued.",
    outageEventsWarn1: "Durability comes from the outbox. A fire-and-forget publish —",
    outageEventsWarn2:
      "— skips the outbox and goes straight to the runtime: fast, but lost if the runtime is down. Use it only when the event is disposable.",

    outageRpcTitle: "Direct RPC keeps flowing",
    outageRpcP:
      "The SDK caches the service registry from the last successful snapshot. Direct calls (caller → callee mTLS) keep resolving endpoints from that cache, so service-to-service RPC continues even while the control plane is unreachable. Proxy-mode calls, which go through the runtime, will fail until it is back.",

    outageWorkflowTitle: "Workflows resume",
    outageWorkflowP:
      "Workflow state is owned by the runtime and persisted per step in PostgreSQL. If the runtime restarts mid-run, it resumes from the last completed step.",
    outageWorkflowWait1: "A",
    outageWorkflowWait2:
      "step parks the run until the matching event or external signal arrives, so a run survives arbitrary downtime between steps.",
  },
  ru: {
    badge: "Production",
    title: "Гарантии надёжности",
    description:
      "Что гарантирует каждый примитив и как ведёт себя SDK, когда runtime временно недоступен.",

    guaranteesTitle: "Гарантии доставки",
    guaranteesP:
      "У каждого примитива свой контракт доставки. Выбирайте обработчики и ожидания по повторам исходя из того контракта, который реально получаете.",

    eventsTitle: "События — at-least-once",
    eventsP1:
      "Каждая публикация сначала проходит через локальный SQLite-outbox, затем фоновый drainer отправляет строки в runtime. Runtime маршрутизирует событие, повторяет неудавшиеся доставки и кладёт их в DLQ после исчерпания попыток. Подписчик, который бросил исключение или вернул ошибку декодирования, шлёт Nack — это заставляет runtime повторить доставку.",
    eventsP2:
      "Так как доставка at-least-once, обработчик может выполниться для одного события несколько раз. Делайте обработчики идемпотентными — проще всего ключевать записи по id события.",
    eventsIdemNote1: "На стороне издателя задайте",
    eventsIdemNote2:
      ", чтобы runtime дедуплицировал повторные публикации одного и того же логического события в пределах окна дедупликации.",

    rpcTitle: "RPC — повторы с таймаутом",
    rpcP1:
      "По умолчанию вызов повторяется до 3 попыток с экспоненциальным backoff и jitter, поэтому молчащий downstream отсекается и повторяется, а не висит вечно. В Node у каждой попытки свой таймаут (по умолчанию 30s), а вся политика — это RetryOpts на конкретный вызов; maxAttempts: 1 отключает повторы для неидемпотентного вызова. В Go бюджет попыток — одна опция клиента, sb.WithCallAttempts(n) (по умолчанию 3, 1 отключает повторы), а вызов ограничивается sb.WithTimeout или дедлайном контекста вызывающего.",
    retryHead: "RetryOpts — значения по умолчанию (Node)",
    retryMaxAttempts: "Всего попыток, включая первую. Значение 1 отключает повторы.",
    retryBaseDelay: "Задержка перед первым повтором; растёт экспоненциально.",
    retryFactor: "Множитель, применяемый к задержке на каждой следующей попытке.",
    retryMaxDelay: "Верхняя граница задержки backoff.",
    retryJitter: "Случайная доля (0–1), добавляемая к каждой задержке для разброса повторов.",
    rpcIdemNote1: "Передайте",
    rpcIdemNote2:
      ", чтобы сделать пишущий RPC безопасным для повтора: runtime захватывает ключ, и повторы в пределах TTL возвращают кешированный ответ вместо повторного выполнения обработчика.",

    outageTitle: "При недоступности сервера",
    outageP:
      "Плоскость управления (порт 14445) может отсутствовать какое-то время. Вот что продолжает работать, а что ждёт.",

    outageEventsTitle: "События продолжают буферизоваться",
    outageEventsP:
      "Публикации всё равно успешны: они попадают в локальный SQLite-outbox на диске. Drainer продолжает повторять с backoff, пока runtime снова не станет доступен, затем сбрасывает накопленное. Ничего не теряется при перезапуске — на старте зависшие строки сбрасываются и снова ставятся в очередь.",
    outageEventsWarn1: "Durability обеспечивает outbox. Публикация fire-and-forget —",
    outageEventsWarn2:
      "— минует outbox и идёт напрямую в runtime: быстро, но теряется, если runtime недоступен. Используйте только для одноразовых событий.",

    outageRpcTitle: "Прямой RPC продолжает работать",
    outageRpcP:
      "SDK кеширует реестр сервисов из последнего успешного снимка. Прямые вызовы (вызывающий → вызываемый по mTLS) продолжают резолвить endpoint'ы из этого кеша, поэтому RPC между сервисами работает даже при недоступной плоскости управления. Вызовы в режиме proxy, идущие через runtime, будут падать, пока он не вернётся.",

    outageWorkflowTitle: "Воркфлоу возобновляются",
    outageWorkflowP:
      "Состояние воркфлоу принадлежит runtime и сохраняется пошагово в PostgreSQL. Если runtime перезапустился в середине запуска, он возобновляется с последнего завершённого шага.",
    outageWorkflowWait1: "Шаг",
    outageWorkflowWait2:
      "паркует запуск до прихода соответствующего события или внешнего сигнала, поэтому запуск переживает произвольные простои между шагами.",
  },
};

export function PageReliability() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="guarantees">{t.guaranteesTitle}</H2>
      <P>{t.guaranteesP}</P>

      <H3>{t.eventsTitle}</H3>
      <P>{t.eventsP1}</P>
      <P>{t.eventsP2}</P>
      <MultiCodeBlock
        code={{
          ts: `// Subscriber may run more than once for the same event — stay idempotent.
sb.event.handle("payment.captured", async (payload) => {
  const e = payload as { eventId: string; orderId: string };
  // Key the write by a stable id so a re-delivery is a no-op.
  await markPaidOnce(e.eventId, e.orderId);
});`,
          go: `// Subscriber may run more than once for the same event — stay idempotent.
err := sb.SubscribeEvent(c, "payment.captured",
	func(ctx context.Context, e *paymentpb.PaymentCaptured) error {
		// Key the write by a stable id so a re-delivery is a no-op.
		return markPaidOnce(ctx, e.GetEventId(), e.GetOrderId())
	})
if err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <P>
        {t.eventsIdemNote1} <Mono>idempotencyKey</Mono> {t.eventsIdemNote2}
      </P>
      <MultiCodeBlock
        code={{
          ts: `await sb.event.publish(
  "payment.captured",
  { eventId, orderId, amountCents: 4200 },
  { idempotencyKey: eventId },
);`,
          go: `captured, err := sb.DefineEvent[*paymentpb.PaymentCaptured](c, "payment.captured")
if err != nil {
	log.Fatal(err)
}

// after Start
_, err = captured.Publish(ctx,
	&paymentpb.PaymentCaptured{EventId: eventID, OrderId: orderID, AmountCents: 4200},
	sb.WithEventIdempotencyKey(eventID),
)
if err != nil {
	log.Fatal(err)
}`,
        }}
      />

      <H3>{t.rpcTitle}</H3>
      <P>{t.rpcP1}</P>
      <MultiCodeBlock
        code={{
          ts: `// Default: up to 3 attempts, exponential backoff + jitter.
await sb.rpc.call("payments", "charge", { amountCents: 4200 });

// Tune the retry policy per call.
await sb.rpc.call(
  "payments",
  "charge",
  { amountCents: 4200 },
  {
    timeout: "5s",
    retry: { maxAttempts: 5, baseDelayMs: 200, maxDelayMs: 5000 },
  },
);

// Disable retries for a non-idempotent call.
await sb.rpc.call("ledger", "appendOnce", entry, { retry: { maxAttempts: 1 } });`,
          go: `// Default: up to 3 attempts, exponential backoff + jitter.
if _, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, c, "payments", "charge", &paymentpb.ChargeRequest{AmountCents: 4200},
); err != nil {
	log.Fatal(err)
}

// Bound one call and opt it into runtime-side dedup, which is also what
// unlocks retrying a failure that leaves the callee's state unknown.
if _, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, c, "payments", "charge", &paymentpb.ChargeRequest{AmountCents: 4200},
	sb.WithTimeout(5*time.Second),
	sb.WithIdempotencyKey("order-42"),
); err != nil {
	log.Fatal(err)
}

// The attempt budget is set once on the client, not per call.
c, err := sb.New(url, key, sb.WithCallAttempts(1)) // 1 = no retries
if err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <H3>{t.retryHead}</H3>
      <ParamTable
        rows={[
          { name: "maxAttempts", type: "number", default: "3", desc: t.retryMaxAttempts },
          { name: "baseDelayMs", type: "number", default: "200", desc: t.retryBaseDelay },
          { name: "factor", type: "number", default: "2", desc: t.retryFactor },
          { name: "maxDelayMs", type: "number", default: "5000", desc: t.retryMaxDelay },
          { name: "jitter", type: "number", default: "0.3", desc: t.retryJitter },
        ]}
      />
      <P>
        {t.rpcIdemNote1} <Mono>idempotencyKey</Mono> {t.rpcIdemNote2}
      </P>

      <H2 id="outage">{t.outageTitle}</H2>
      <P>{t.outageP}</P>

      <H3>{t.outageEventsTitle}</H3>
      <P>{t.outageEventsP}</P>
      <Callout type="warning">
        {t.outageEventsWarn1} <Mono>fireAndForget: true</Mono> /{" "}
        <Mono>sb.WithFireAndForget()</Mono> {t.outageEventsWarn2}
      </Callout>

      <H3>{t.outageRpcTitle}</H3>
      <P>{t.outageRpcP}</P>

      <H3>{t.outageWorkflowTitle}</H3>
      <P>{t.outageWorkflowP}</P>
      <P>
        {t.outageWorkflowWait1} <Mono>wait_event</Mono> / <Mono>wait_signal</Mono>{" "}
        {t.outageWorkflowWait2}
      </P>
    </div>
  );
}
