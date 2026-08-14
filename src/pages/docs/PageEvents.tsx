import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "SDK Reference",
    title: "Events",
    description:
      "Durable pub/sub with at-least-once delivery. Events go through a local SQLite outbox, so publishing survives a transient runtime outage. No broker required.",
    intro:
      "A publisher declares an event, then emits it; a subscriber registers a handler for it. In Node that reads sb.event.define / publish / handle; in Go it is sb.DefineEvent, Publish and sb.SubscribeEvent, because a type parameter cannot ride on a method. Delivery, dedup, retries and DLQ all live in the runtime — the SDK only enqueues, sends, and acks.",

    publishTitle: "sb.event.publish()",
    publishP:
      "Publish a payload to a declared event. You get back the event id — a UUID v7 minted locally, wrapped as { eventId } in Node and returned as a plain string in Go. The name has to be declared before the client goes online, and publishing happens after.",
    publishUnderHood:
      "By default the event is encoded with the registered schema, inserted into the local SQLite outbox inside a transaction, and the call resolves after commit. A background drainer ships outbox rows to the runtime, so a publish survives a short runtime outage and is sent on reconnect.",

    optsTitle: "PublishOpts",
    optsP:
      "Optional third argument to sb.event.publish(). All fields are optional.",
    optIdempotency:
      "Deduplication key. The runtime drops a second publish with the same key from the same publisher service (returns REJECTED_DUPLICATE — one event_log, one fan-out).",
    optPartition:
      "Orders delivery per key: events sharing a partitionKey are delivered strictly in publication order to one consumer instance. An empty key means parallel delivery.",
    optFireForget:
      "When true, skip the outbox and send straight to the runtime — lower latency, but no durability and no retries. For metrics / telemetry where loss is acceptable.",
    optHeaders:
      "Arbitrary envelope metadata. Carried on the wire, but not passed to the subscriber handler (the handler receives only the decoded payload).",
    optOccurredAt:
      "Business-event time, unix-ms. Defaults to Date.now(). Carried in EventEnvelope.occurred_at_unix_ms.",

    handleTitle: "sb.event.handle()",
    handleP:
      "Register a subscriber handler before the client goes online. It receives the decoded payload — headers stay on the envelope. Node needs the same schema declared on the subscriber side, otherwise it replies Nack with reason no_schema; Go takes the payload type from the handler you pass, so there is nothing extra to declare.",
    handleDispatchNote:
      "Several handlers for the same exact name run sequentially on one delivery, with a single Ack for the whole delivery.",

    defineTitle: "sb.event.define()",
    defineP1:
      "Declare a published (or consumed) event before the client goes online. In Node the schema source is a SchemaSpec — the same type sb.rpc.handle uses: a .proto file or a .schema.json file with an explicit fieldNumber per property, never an inline JSON Schema. In Go the generated message type is the declaration.",
    defineP2:
      "spec is optional, but a schema-less define only registers the name in the service map. Publishing it throws no schema registered, and a subscriber replies Nack no_schema. A real, deliverable event needs a spec. Re-declaring with the same spec is a no-op; a different spec throws.",
    defineProtoNote:
      "In Node, method must match the rpc <method> name in the .proto service block; with no service block, set the input and output message names explicitly. Go needs only the messages — no service block and no protoc-gen-go-grpc.",

    retryTitle: "Retry & DLQ",
    retryP:
      "Delivery is at-least-once and the retry budget lives in the runtime, not in the SDK. A subscriber handler that throws makes the SDK reply Nack; the runtime redelivers. If the consumer is offline, the delivery simply waits — no retry attempt is burned.",
    retryWaiting:
      "Subscriber offline — the delivery waits in the queue; on reconnect the runtime dispatches it automatically.",
    retryThrow:
      "The handler fails — the SDK replies Nack and the runtime redelivers after the visibility timeout.",
    retryDlq:
      "After the runtime's events.max_attempts (default 5) is reached, the delivery moves to the DLQ with a copy of the payload.",
    retryTip:
      "The handler must be idempotent: at-least-once means the same event can arrive more than once. The SDK does no client-side dedup.",

    policyTitle: "Retry policy",
    policyP:
      "Visibility timeout, max attempts, DLQ retention and the backoff ladder are runtime settings (the events.* group), edited live in the UI /settings — not SDK arguments. There is no per-handle retry option in the SDK. The defaults below are the runtime defaults.",
    policyVisibility: "Redelivery if the consumer does not Ack in time.",
    policyMaxAttempts: "Attempts before the delivery moves to the DLQ.",
    policyDlqRetention: "How long a DLQ row is kept.",

    filterTitle: "Server-side filter",
    filterP:
      "sb.event.handle() takes a pattern and nothing else, so every matching event reaches the handler. Content-based filtering lives in workflows: a wait_event step takes a filter that parks the run until a matching event is ingested. See the wait_event step on the Workflows page.",

    wildcardTitle: "Wildcard depth",
    wildcardP:
      "A subscription pattern may use AMQP-style wildcards, and the runtime routes on it. Node has no client-side matcher: it dispatches an incoming delivery to the handler whose pattern equals the event name exactly. Go also matches the pattern locally, so a family subscription reaches the handler under the concrete name the publisher used.",
    wildcardStar: "matches exactly one segment.",
    wildcardHash: "matches zero or more segments.",
    wildcardCombine:
      "matches order.online.created, does not match order.created.",

    occurredHint: "matches",
    notMatch: "does not match",
  },
  ru: {
    badge: "SDK Reference",
    title: "События",
    description:
      "Надёжный pub/sub с гарантией доставки at-least-once. События идут через локальный SQLite-outbox, поэтому публикация переживает кратковременную недоступность runtime. Брокер не нужен.",
    intro:
      "Издатель декларирует событие и публикует его; подписчик регистрирует обработчик. В Node это sb.event.define / publish / handle, в Go — sb.DefineEvent, Publish и sb.SubscribeEvent, потому что параметр типа нельзя навесить на метод. Доставка, дедуп, повторы и DLQ живут в runtime — SDK только кладёт в очередь, отправляет и подтверждает (ack).",

    publishTitle: "sb.event.publish()",
    publishP:
      "Публикует payload в задекларированное событие. Возвращает id события — UUID v7, сгенерированный локально: в Node он приходит как { eventId }, в Go — обычной строкой. Имя нужно задекларировать до подъёма клиента, а публиковать — после.",
    publishUnderHood:
      "По умолчанию событие кодируется зарегистрированной схемой, вставляется в локальный SQLite-outbox в транзакции, и вызов завершается после commit. Фоновый drainer отправляет строки outbox в runtime, поэтому публикация переживает короткий простой runtime и уходит при переподключении.",

    optsTitle: "PublishOpts",
    optsP:
      "Необязательный третий аргумент sb.event.publish(). Все поля опциональны.",
    optIdempotency:
      "Ключ дедупликации. Runtime отбрасывает повторную публикацию с тем же ключом от того же сервиса-издателя (отвечает REJECTED_DUPLICATE — один event_log, один fan-out).",
    optPartition:
      "Упорядочивает доставку по ключу: события с одним partitionKey доставляются строго в порядке публикации одному инстансу-потребителю. Пустой ключ — параллельная доставка.",
    optFireForget:
      "При true пропускает outbox и отправляет напрямую в runtime — меньше задержка, но без durability и без повторов. Для метрик / телеметрии, где потеря допустима.",
    optHeaders:
      "Произвольные метаданные envelope. Едут по wire, но в обработчик подписчика не передаются (обработчик получает только декодированный payload).",
    optOccurredAt:
      "Время бизнес-события, unix-ms. По умолчанию Date.now(). Едет в EventEnvelope.occurred_at_unix_ms.",

    handleTitle: "sb.event.handle()",
    handleP:
      "Регистрирует обработчик подписчика — до подъёма клиента. Обработчик получает декодированный payload, заголовки остаются в конверте. Node требует объявить у подписчика ту же схему, иначе он отвечает Nack с причиной no_schema; Go берёт тип payload из переданного обработчика, объявлять отдельно нечего.",
    handleDispatchNote:
      "Несколько обработчиков на одно точное имя выполняются последовательно на одну доставку, с одним Ack за всю доставку.",

    defineTitle: "sb.event.define()",
    defineP1:
      "Декларирует публикуемое (или потребляемое) событие до подъёма клиента. В Node источник схемы — SchemaSpec, тот же тип, что у sb.rpc.handle: файл .proto или файл .schema.json с явным fieldNumber у каждого поля, но не inline JSON Schema. В Go декларация — это сам сгенерированный тип сообщения.",
    defineP2:
      "spec опционален, но define без схемы лишь регистрирует имя в service map. Публикация такого события бросает no schema registered, а подписчик отвечает Nack no_schema. Для реального, доставляемого события spec обязателен. Повторный define с тем же spec — no-op; с другим spec — бросает.",
    defineProtoNote:
      "В Node method должен совпадать с именем rpc <method> в service-блоке .proto; если service-блока нет, задайте имена сообщений input и output явно. Go нужны только сообщения — ни service-блока, ни protoc-gen-go-grpc.",

    retryTitle: "Повторы и DLQ",
    retryP:
      "Доставка — at-least-once, и бюджет повторов живёт в runtime, а не в SDK. Если обработчик подписчика бросает исключение, SDK отвечает Nack; runtime повторяет доставку. Если потребитель офлайн — доставка просто ждёт, попытка повтора не тратится.",
    retryWaiting:
      "Подписчик офлайн — доставка ждёт в очереди; при переподключении runtime отправляет её автоматически.",
    retryThrow:
      "Обработчик отработал неуспешно — SDK отвечает Nack, и runtime повторяет доставку после visibility timeout.",
    retryDlq:
      "По достижении events.max_attempts (по умолчанию 5) доставка перемещается в DLQ с копией payload.",
    retryTip:
      "Обработчик обязан быть идемпотентным: at-least-once означает, что одно событие может прийти более одного раза. SDK не делает client-side дедуп.",

    policyTitle: "Политика повторов",
    policyP:
      "Visibility timeout, максимум попыток, retention DLQ и лестница backoff — это настройки runtime (группа events.*), правятся вживую в UI /settings, а не аргументы SDK. Опции повторов на уровне handle в SDK нет. Значения ниже — дефолты runtime.",
    policyVisibility: "Повторная доставка, если потребитель не Ack'нул вовремя.",
    policyMaxAttempts: "Попыток до перемещения доставки в DLQ.",
    policyDlqRetention: "Сколько хранится строка DLQ.",

    filterTitle: "Серверный фильтр",
    filterP:
      "sb.event.handle() принимает только pattern и больше ничего, поэтому каждое совпавшее событие доходит до обработчика. Фильтрация по содержимому живёт в воркфлоу: шаг wait_event принимает filter, который паркует запуск до прихода совпадающего события. Смотрите шаг wait_event на странице Workflows.",

    wildcardTitle: "Глубина wildcard",
    wildcardP:
      "Шаблон подписки может использовать wildcard в стиле AMQP, и runtime маршрутизирует по нему. В Node клиентского matcher'а нет: входящая доставка диспатчится обработчику, чей pattern точно равен имени события. Go дополнительно сопоставляет шаблон локально, поэтому подписка на семейство доходит до обработчика под конкретным именем, которое использовал издатель.",
    wildcardStar: "совпадает ровно с одним сегментом.",
    wildcardHash: "совпадает с нулём или более сегментов.",
    wildcardCombine:
      "ловит order.online.created, не ловит order.created.",

    occurredHint: "совпадает с",
    notMatch: "не совпадает с",
  },
};

const PROTO_SNIPPET = `// schemas/payment.proto
syntax = "proto3";
package payments;

message PaymentCharged {
  string transaction_id = 1;
  double amount         = 2;
  string user_id        = 3;
  string currency       = 4;
}

service Payments {
  rpc PaymentCharged (PaymentCharged) returns (PaymentCharged);
}`;

export function PageEvents() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>{t.intro}</P>

      {/* ── sb.event.publish ───────────────────────────────────────── */}
      <H2 id="event-publish">{t.publishTitle}</H2>
      <P>{t.publishP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.event.define("payment.charged", {
  protoFile: "schemas/payment.proto",
  method: "PaymentCharged",
});

await sb.start();

const { eventId } = await sb.event.publish("payment.charged", {
  transactionId: "tx-7",
  amount: 42.0,
  userId: "u-1",
  currency: "USD",
});`,
          go: `// The generated type is the declaration — before Start.
charged, err := sb.DefineEvent[*orderpb.PaymentCharged](c, "payment.charged")
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}

// Publish returns once the row is durably in the local outbox.
eventID, err := charged.Publish(ctx, &orderpb.PaymentCharged{
	TransactionId: "tx-7",
	Amount:        4200,
	UserId:        "u-1",
	Currency:      "USD",
})
if err != nil {
	log.Fatal(err)
}
log.Println("buffered", eventID)`,
        }}
      />
      <P>{t.publishUnderHood}</P>

      {/* ── PublishOpts ────────────────────────────────────────────── */}
      <H2 id="event-opts">{t.optsTitle}</H2>
      <P>{t.optsP}</P>
      <ParamTable
        rows={[
          { name: "idempotencyKey", type: "string", default: '""', desc: t.optIdempotency },
          { name: "partitionKey", type: "string", default: '""', desc: t.optPartition },
          { name: "fireAndForget", type: "boolean", default: "false", desc: t.optFireForget },
          { name: "headers", type: "Record<string, string>", default: "{}", desc: t.optHeaders },
          { name: "occurredAtMs", type: "number", default: "Date.now()", desc: t.optOccurredAt },
        ]}
      />
      <MultiCodeBlock
        code={{
          ts: `// Deduplicate on ingest
await sb.event.publish("payment.charged", payload, { idempotencyKey: "tx-7" });

// FIFO per order, parallel across orders
await sb.event.publish("order.line.added",   payload, { partitionKey: "order-42" });
await sb.event.publish("order.line.removed", payload, { partitionKey: "order-42" });

// Best-effort metric — skip the outbox
await sb.event.publish("metric.counter", { name: "page_view", value: 1 }, {
  fireAndForget: true,
});`,
          go: `// Deduplicate on ingest
_, err := sb.PublishEvent(ctx, c, "payment.charged",
	&orderpb.PaymentCharged{TransactionId: "tx-7", Amount: 4200},
	sb.WithEventIdempotencyKey("tx-7"))
if err != nil {
	log.Fatal(err)
}

// FIFO per order, parallel across orders
if _, err := sb.PublishEvent(ctx, c, "order.line.added",
	&orderpb.OrderPlaced{OrderId: "order-42"},
	sb.WithPartitionKey("order-42")); err != nil {
	log.Fatal(err)
}
if _, err := sb.PublishEvent(ctx, c, "order.line.removed",
	&orderpb.OrderPlaced{OrderId: "order-42"},
	sb.WithPartitionKey("order-42")); err != nil {
	log.Fatal(err)
}

// Best-effort metric — skip the outbox and every retry with it
if _, err := sb.PublishEvent(ctx, c, "metric.counter",
	&metricpb.Counter{Name: "page_view", Value: 1},
	sb.WithFireAndForget()); err != nil {
	log.Fatal(err)
}`,
        }}
      />

      {/* ── sb.event.handle ────────────────────────────────────────── */}
      <H2 id="handle-event">{t.handleTitle}</H2>
      <P>{t.handleP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Subscriber declares the same schema to decode the payload
sb.event.define("payment.charged", {
  protoFile: "schemas/payment.proto",
  method: "PaymentCharged",
});

sb.event.handle("payment.charged", async (payload) => {
  const { transactionId } = payload as { transactionId: string };
  // at-least-once → make this idempotent
  await sendReceipt(transactionId);
});

await sb.start();`,
          go: `// The subscriber decodes into the same generated type the publisher used.
err := sb.SubscribeEvent(c, "payment.charged",
	func(ctx context.Context, e *orderpb.PaymentCharged) error {
		// at-least-once → make this idempotent
		return sendReceipt(ctx, e.GetTransactionId())
	})
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <P>{t.handleDispatchNote}</P>

      {/* ── sb.event.define ────────────────────────────────────────── */}
      <H2 id="handle-event-ctx">{t.defineTitle}</H2>
      <P>{t.defineP1}</P>
      <P>{t.defineP2}</P>
      <Callout type="info">{t.defineProtoNote}</Callout>
      <DocCodeBlock lang="ts" code={PROTO_SNIPPET} />
      <MultiCodeBlock
        code={{
          ts: `// From a .proto service block
sb.event.define("payment.charged", {
  protoFile: "schemas/payment.proto",
  method: "PaymentCharged",
});

// From a .schema.json (explicit fieldNumber per property)
sb.event.define("payment.charged", { schemaFile: "schemas/payment.json" });`,
          go: `// The generated type is the whole declaration: no file, no method name.
charged, err := sb.DefineEvent[*orderpb.PaymentCharged](c, "payment.charged")
if err != nil {
	log.Fatal(err)
}
log.Println("declared", charged.Name())

// For a name whose payload shape varies by publisher, take it undecoded.
if err := sb.SubscribeEventRaw(c, "audit.#",
	func(ctx context.Context, payload []byte) error {
		return archive(ctx, payload)
	}); err != nil {
	log.Fatal(err)
}`,
        }}
      />

      {/* ── Retry & DLQ ────────────────────────────────────────────── */}
      <H2 id="handle-event-retry">{t.retryTitle}</H2>
      <P>{t.retryP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.retryWaiting}</li>
        <li>{t.retryThrow}</li>
        <li>{t.retryDlq}</li>
      </ul>
      <Callout type="warning">{t.retryTip}</Callout>

      {/* ── Retry policy ───────────────────────────────────────────── */}
      <H2 id="retry-policy">{t.policyTitle}</H2>
      <P>{t.policyP}</P>
      <ParamTable
        rows={[
          { name: "events.visibility_timeout_ms", type: "runtime setting", default: "30000", desc: t.policyVisibility },
          { name: "events.max_attempts", type: "runtime setting", default: "5", desc: t.policyMaxAttempts },
          { name: "events.dlq_retention_ms", type: "runtime setting", default: "2592000000", desc: t.policyDlqRetention },
        ]}
      />

      {/* ── Server-side filter ─────────────────────────────────────── */}
      <H2 id="handle-event-filter">{t.filterTitle}</H2>
      <P>{t.filterP}</P>

      {/* ── Wildcard depth ─────────────────────────────────────────── */}
      <H2 id="wildcard-depth">{t.wildcardTitle}</H2>
      <P>{t.wildcardP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>*</Mono> — {t.wildcardStar}
        </li>
        <li>
          <Mono>#</Mono> — {t.wildcardHash}
        </li>
        <li>
          <Mono>payment.*</Mono> {t.occurredHint} <Mono>payment.charged</Mono>, {t.notMatch}{" "}
          <Mono>payment.charged.partial</Mono>
        </li>
        <li>
          <Mono>payment.#</Mono> {t.occurredHint} <Mono>payment</Mono>, <Mono>payment.charged</Mono>,{" "}
          <Mono>payment.charged.partial</Mono>
        </li>
        <li>
          <Mono>order.*.created</Mono> — {t.wildcardCombine}
        </li>
      </ul>
    </div>
  );
}
