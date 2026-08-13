import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Migration guide",
    title: "Migrating from RabbitMQ to Durable Events",
    description:
      "RabbitMQ is AMQP: exchanges route messages by routing key to bound queues, consumers ack/nack, and a dead-letter-exchange catches poison messages. ServiceBridge Durable Events collapse exchange + routing key + queue + binding into one thing — the event name — and the runtime does the routing, retry, and dead-lettering. No broker to run, no channel/connection lifecycle to manage.",

    overviewTitle: "Model differences",
    overviewP1:
      "AMQP separates the topology (exchanges, queues, bindings — declared imperatively with assertExchange/assertQueue/bindQueue) from the messages flowing through it. A publisher doesn't know who's listening; a consumer binds a queue to an exchange with a routing key pattern and pulls from that queue.",
    overviewP2:
      "ServiceBridge has no exchange or queue objects to declare. A publisher calls sb.event.define(name, spec) once (this registers the schema, not a queue) then sb.event.publish(name, payload). A subscriber calls sb.event.handle(pattern, fn). The runtime's registry does the routing server-side — there's no separate binding step, and no queue to inspect independently of its consumer.",
    overviewCallout:
      "Delivery is push, not pull: the runtime holds a long-lived bidi gRPC stream per subscriber and pushes deliveries down it. There's no channel.consume() polling loop and no manual channel/connection management — sb.start() opens the stream, sb.stop() closes it.",

    mappingTitle: "RabbitMQ → Durable Events",
    mappingRows: [
      { name: "exchange + routing key", type: "RabbitMQ", desc: "Event name (\"payment.charged\"). No separate exchange object — the name itself is what gets routed, always [a-z0-9_-]+ segments joined by dots." },
      { name: "topic exchange wildcards (*, #)", type: "RabbitMQ", desc: "Same two symbols, same meaning, in the handler's pattern: * = exactly one segment, # = zero or more. Matched server-side (registry.TopicMatch)." },
      { name: "queue + ch.bindQueue(q, exchange, key)", type: "RabbitMQ", desc: "sb.event.handle(pattern, fn) — one call both subscribes and installs the handler; no separate queue object." },
      { name: "ch.ack(msg)", type: "RabbitMQ", desc: "Handler resolves without throwing. No explicit ack call — see Ack / nack." },
      { name: "ch.nack(msg, false, requeue)", type: "RabbitMQ", desc: "Handler throws. Always \"requeues\" for redelivery up to events.max_attempts — there's no per-nack requeue=false to drop immediately (see What's missing)." },
      { name: "dead-letter-exchange + DLQ", type: "RabbitMQ", desc: "events_dlq Postgres table, browsable and replayable from the dashboard — see Dead-letter & replay." },
      { name: "channel.prefetch(n)", type: "RabbitMQ", desc: "eventsMaxInFlight constructor option (default 32) — caps concurrent inbound deliveries to one subscriber instance, declared to the runtime as SubscribeInit.max_in_flight. See Prefetch & ordering." },
      { name: "publisher confirms", type: "RabbitMQ", desc: "SDK outbox: publish() resolves after a local SQLite COMMIT (WAL mode); a background drainer ships the row to the runtime. Durable across a publisher crash between confirm and broker ack." },
      { name: "message / queue TTL", type: "RabbitMQ", desc: "Not supported per-message. Only DLQ rows have a retention window (events.dlq_retention_ms, default 30d)." },
      { name: "fanout / direct / topic / headers exchange types", type: "RabbitMQ", desc: "One flat model: exact name match plus optional wildcard pattern. No headers-exchange-style routing on arbitrary metadata." },
    ],

    beforeAfterTitle: "Before / after",
    beforeAfterP:
      "A topic exchange, one queue bound with a wildcard, ack on success, reject-without-requeue on bad payload:",
    beforeCode: `// before: RabbitMQ (amqplib)
import amqp from "amqplib";

const conn = await amqp.connect("amqp://localhost");
const ch = await conn.createChannel();
await ch.assertExchange("payments", "topic", { durable: true });
await ch.assertQueue("receipts", { durable: true });
await ch.bindQueue("receipts", "payments", "payment.*");

// publisher
ch.publish(
  "payments",
  "payment.charged",
  Buffer.from(JSON.stringify({ transactionId: "tx-7", amount: 42.0 })),
  { persistent: true },
);

// consumer
ch.prefetch(10);
ch.consume("receipts", async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    await sendReceipt(payload.transactionId);
    ch.ack(msg);
  } catch (err) {
    ch.nack(msg, false, false); // drop straight to DLX
  }
});`,
    afterCode: `// after: ServiceBridge Durable Events
import { ServiceBridge } from "service-bridge";

// publisher side
const sb = new ServiceBridge(url, serviceKey);
sb.event.define("payment.charged", { schemaFile: "schemas/payment.json" });
await sb.start();
await sb.event.publish("payment.charged", { transactionId: "tx-7", amount: 42.0 });

// consumer side (same schema, exact-name handler)
const sb2 = new ServiceBridge(url, otherServiceKey, { eventsMaxInFlight: 10 });
sb2.event.define("payment.charged", { schemaFile: "schemas/payment.json" });
sb2.event.handle("payment.charged", async (payload) => {
  await sendReceipt((payload as { transactionId: string }).transactionId);
  // resolving normally = ack; throwing = nack, runtime retries with backoff
});
await sb2.start();`,
    beforeAfterCallout:
      "The subscriber pattern controls what the runtime routes to this service (\"payment.*\" would also match), but the SDK dispatches locally by exact event name — the handler that actually fires needs sb.event.handle(\"payment.charged\", ...) matching the delivered name literally. See Wildcard routing in the Events reference for the full rule.",
    wildcardNote:
      "Both publisher and subscriber must declare sb.event.define(name, spec) with the same schema. Unlike RabbitMQ where the exchange doesn't care about message shape, ServiceBridge encodes payloads as Protobuf — a subscriber without a matching schema declaration gets Nack \"no_schema\" on every delivery.",

    ackNackTitle: "Ack / nack",
    ackNackP1:
      "There's no ch.ack(msg) or ch.nack(msg, ...) call. The contract is implicit in the handler's return: resolving (or returning) without throwing acks the delivery; throwing nacks it with the error's string as the reason.",
    ackNackCode: `sb.event.handle("payment.charged", async (payload) => {
  if (!isValid(payload)) {
    throw new Error("invalid payload"); // → nack, runtime retries per backoff ladder
  }
  await sendReceipt(payload.transactionId); // returns normally → ack
});`,
    ackNackP2:
      "If the runtime doesn't see an ack within events.visibility_timeout_ms (default 30 000ms) — e.g. the consumer crashed mid-handler — it treats the delivery as lost and redelivers. A late ack after that window is accepted as a no-op, not an error.",
    ackNackMulti:
      "Multiple handlers registered on the same exact event name all run for one delivery, sequentially, in registration order. One Ack/Nack covers the whole delivery: any handler throwing nacks it for all of them.",

    dlqTitle: "Dead-letter & replay",
    dlqP1:
      "A delivery that exhausts events.max_attempts (default 5) moves to the events_dlq table with a copy of the payload, the event name, headers, and the last error. This is the direct equivalent of a dead-letter exchange — except there's no second exchange to declare, it's automatic once max_attempts is set (it always is, by default).",
    dlqP2Pre: "Manage DLQ entries from the dashboard — ",
    dlqLink: "DLQ & Replay",
    dlqP2Post:
      " — where Replay re-queues a fresh pending delivery for the same consumer with a clean attempt counter, and Purge deletes rows without redelivering. There is no SDK method for either; runtime gRPC exposes ReplayDlq / ListDlq, but Node SDK has no admin-helper wrapper around them.",
    dlqCallout:
      "Replay requires the original event_log row to still exist. If registry.gc_retention_days (default 30) or events.dlq_retention_ms (default 30d) has already purged it, replay returns ErrEventLogPurged — there's no message body kept forever the way a manually-drained RabbitMQ DLQ can be.",

    prefetchTitle: "Prefetch & ordering",
    prefetchP1:
      "channel.prefetch(n) caps how many unacked messages a RabbitMQ consumer can hold at once. The direct equivalent is the eventsMaxInFlight constructor option (default 32) — it's declared to the runtime as SubscribeInit.max_in_flight and caps concurrent inbound deliveries to that subscriber instance.",
    prefetchCode: `const sb = new ServiceBridge(url, key, {
  eventsMaxInFlight: 10, // like channel.prefetch(10)
});`,
    prefetchP2:
      "Ordering is the bigger behavioral difference. RabbitMQ queues are FIFO per queue by default; ServiceBridge fans deliveries out in parallel across a consumer service's instances unless you opt into per-key ordering with partitionKey on publish:",
    prefetchOrderCode: `await sb.event.publish("order.line.added",   payload, { partitionKey: "order-42" });
await sb.event.publish("order.line.removed", payload, { partitionKey: "order-42" });
// → strictly in order, on ONE instance of the consumer`,
    prefetchP3:
      "Without partitionKey, deliveries for the same consumer service run with full parallelism across its live instances — closer to a RabbitMQ queue with multiple competing consumers and no message grouping than to a single ordered queue.",

    notSupportedTitle: "What's missing",
    notSupportedItems: [
      "Headers-exchange-style routing. Routing is by event name plus AMQP-style wildcard only — there's no matching on arbitrary message headers or content.",
      "Selective nack-without-requeue. A handler throw always goes through the retry ladder toward the DLQ; there's no equivalent of nack(msg, false, false) to drop a single message immediately without consuming a retry slot.",
      "Per-message or per-queue TTL. Only the DLQ itself has a retention window (events.dlq_retention_ms); there's no way to expire a normal, still-retrying delivery early.",
      "Multiple independent queues per exchange with different bindings. One event name has exactly one routing surface; fan-out to N different consumer services works (each declares its own handler), but there's no queue-level configuration divergence the way two RabbitMQ queues bound to the same exchange can each set their own TTL, length limit, or dead-letter target.",
      "Broker-level management UI for topology (exchanges/queues/bindings) — because there is no topology to manage. The tradeoff is less flexibility in routing shape, not a missing feature to work around.",
    ],
  },
  ru: {
    badge: "Гайд по миграции",
    title: "Миграция с RabbitMQ на Durable Events",
    description:
      "RabbitMQ — это AMQP: exchange маршрутизирует сообщения по routing key к привязанным очередям, консьюмеры делают ack/nack, dead-letter-exchange ловит отравленные сообщения. ServiceBridge Durable Events схлопывает exchange + routing key + queue + binding в одну сущность — имя события — а маршрутизацию, повторы и dead-letter берёт на себя рантайм. Без брокера для запуска, без жизненного цикла channel/connection для управления.",

    overviewTitle: "Отличия модели",
    overviewP1:
      "AMQP отделяет топологию (exchange, queue, binding — объявляются императивно через assertExchange/assertQueue/bindQueue) от сообщений, которые через неё текут. Издатель не знает, кто слушает; консьюмер привязывает очередь к exchange с паттерном routing key и тянет из этой очереди.",
    overviewP2:
      "У ServiceBridge нет объектов exchange или queue для объявления. Издатель один раз вызывает sb.event.define(name, spec) (регистрирует схему, не очередь), затем sb.event.publish(name, payload). Подписчик вызывает sb.event.handle(pattern, fn). Реестр рантайма делает маршрутизацию на своей стороне — отдельного шага «привязка» нет, и нет очереди, которую можно инспектировать отдельно от её консьюмера.",
    overviewCallout:
      "Доставка — push, не pull: рантайм держит долгоживущий bidi gRPC-стрим на подписчика и пушит доставки в него. Нет цикла опроса channel.consume() и ручного управления channel/connection — sb.start() открывает стрим, sb.stop() закрывает.",

    mappingTitle: "RabbitMQ → Durable Events",
    mappingRows: [
      { name: "exchange + routing key", type: "RabbitMQ", desc: "Имя события (\"payment.charged\"). Отдельного объекта exchange нет — маршрутизируется само имя, всегда сегменты [a-z0-9_-]+ через точку." },
      { name: "wildcard'ы topic exchange (*, #)", type: "RabbitMQ", desc: "Те же два символа, тот же смысл, в паттерне handler'а: * = ровно один сегмент, # = ноль или больше. Матчинг на стороне рантайма (registry.TopicMatch)." },
      { name: "queue + ch.bindQueue(q, exchange, key)", type: "RabbitMQ", desc: "sb.event.handle(pattern, fn) — один вызов одновременно подписывает и устанавливает handler; отдельного объекта очереди нет." },
      { name: "ch.ack(msg)", type: "RabbitMQ", desc: "Handler резолвится без throw. Явного вызова ack нет — см. «Ack / nack»." },
      { name: "ch.nack(msg, false, requeue)", type: "RabbitMQ", desc: "Handler бросает исключение. Всегда «requeue» для редоставки до events.max_attempts — нет per-nack requeue=false для немедленного дропа (см. «Чего нет»)." },
      { name: "dead-letter-exchange + DLQ", type: "RabbitMQ", desc: "Таблица events_dlq в Postgres, просматриваемая и воспроизводимая из дашборда — см. «DLQ и replay»." },
      { name: "channel.prefetch(n)", type: "RabbitMQ", desc: "Опция конструктора eventsMaxInFlight (по умолчанию 32) — ограничивает конкурентные входящие доставки одному инстансу подписчика, объявляется рантайму как SubscribeInit.max_in_flight. См. «Prefetch и порядок»." },
      { name: "publisher confirms", type: "RabbitMQ", desc: "SDK outbox: publish() резолвится после локального COMMIT в SQLite (WAL). Фоновый drainer отправляет строку рантайму. Переживает краш издателя между confirm и подтверждением брокера." },
      { name: "TTL сообщения / очереди", type: "RabbitMQ", desc: "На уровне сообщения не поддерживается. Только у строк DLQ есть окно хранения (events.dlq_retention_ms, по умолчанию 30д)." },
      { name: "типы exchange fanout / direct / topic / headers", type: "RabbitMQ", desc: "Одна плоская модель: точное совпадение имени плюс опциональный wildcard-паттерн. Маршрутизации в стиле headers-exchange по произвольным метаданным нет." },
    ],

    beforeAfterTitle: "До / после",
    beforeAfterP:
      "Topic exchange, одна очередь с wildcard-привязкой, ack на успех, reject-без-requeue на битый payload:",
    beforeCode: `// до: RabbitMQ (amqplib)
import amqp from "amqplib";

const conn = await amqp.connect("amqp://localhost");
const ch = await conn.createChannel();
await ch.assertExchange("payments", "topic", { durable: true });
await ch.assertQueue("receipts", { durable: true });
await ch.bindQueue("receipts", "payments", "payment.*");

// издатель
ch.publish(
  "payments",
  "payment.charged",
  Buffer.from(JSON.stringify({ transactionId: "tx-7", amount: 42.0 })),
  { persistent: true },
);

// консьюмер
ch.prefetch(10);
ch.consume("receipts", async (msg) => {
  if (!msg) return;
  try {
    const payload = JSON.parse(msg.content.toString());
    await sendReceipt(payload.transactionId);
    ch.ack(msg);
  } catch (err) {
    ch.nack(msg, false, false); // сразу в DLX
  }
});`,
    afterCode: `// после: ServiceBridge Durable Events
import { ServiceBridge } from "service-bridge";

// сторона издателя
const sb = new ServiceBridge(url, serviceKey);
sb.event.define("payment.charged", { schemaFile: "schemas/payment.json" });
await sb.start();
await sb.event.publish("payment.charged", { transactionId: "tx-7", amount: 42.0 });

// сторона подписчика (та же схема, handler по точному имени)
const sb2 = new ServiceBridge(url, otherServiceKey, { eventsMaxInFlight: 10 });
sb2.event.define("payment.charged", { schemaFile: "schemas/payment.json" });
sb2.event.handle("payment.charged", async (payload) => {
  await sendReceipt((payload as { transactionId: string }).transactionId);
  // нормальный резолв = ack; throw = nack, рантайм ретраит с backoff
});
await sb2.start();`,
    beforeAfterCallout:
      "Паттерн подписчика управляет тем, что рантайм маршрутизирует этому сервису (\"payment.*\" тоже бы совпал), но SDK диспатчит локально по точному имени события — реально сработает handler с sb.event.handle(\"payment.charged\", ...), буквально совпадающим с доставленным именем. Полное правило — в разделе Wildcard routing справочника Events.",
    wildcardNote:
      "И издатель, и подписчик должны объявить sb.event.define(name, spec) с одинаковой схемой. В отличие от RabbitMQ, где exchange не заботится о форме сообщения, ServiceBridge кодирует payload как Protobuf — подписчик без совпадающего объявления схемы получает Nack \"no_schema\" на каждую доставку.",

    ackNackTitle: "Ack / nack",
    ackNackP1:
      "Вызовов ch.ack(msg) или ch.nack(msg, ...) нет. Контракт неявный, через возврат handler'а: резолв (или return) без throw подтверждает доставку (ack); throw — nack с текстом ошибки как причиной.",
    ackNackCode: `sb.event.handle("payment.charged", async (payload) => {
  if (!isValid(payload)) {
    throw new Error("invalid payload"); // → nack, рантайм ретраит по лестнице backoff
  }
  await sendReceipt(payload.transactionId); // нормальный возврат → ack
});`,
    ackNackP2:
      "Если рантайм не видит ack за events.visibility_timeout_ms (по умолчанию 30 000мс) — например консьюмер упал в середине handler'а — доставка считается потерянной и редоставляется. Поздний ack после этого окна принимается как no-op, не как ошибка.",
    ackNackMulti:
      "Несколько handler'ов, зарегистрированных на одно точное имя события, все выполняются на одну доставку, последовательно, в порядке регистрации. Один Ack/Nack покрывает всю доставку: throw любого handler'а даёт nack для всех.",

    dlqTitle: "DLQ и replay",
    dlqP1:
      "Доставка, исчерпавшая events.max_attempts (по умолчанию 5), переезжает в таблицу events_dlq с копией payload, именем события, headers и последней ошибкой. Это прямой эквивалент dead-letter exchange — только без второго exchange для объявления, это происходит автоматически, раз max_attempts всегда задан (по умолчанию тоже).",
    dlqP2Pre: "Управляйте записями DLQ из дашборда — ",
    dlqLink: "DLQ и Replay",
    dlqP2Post:
      " — где Replay заново ставит свежую pending-доставку тому же консьюмеру с обнулённым счётчиком попыток, а Purge удаляет строки без редоставки. Метода SDK для этого нет; runtime gRPC предоставляет ReplayDlq / ListDlq, но в Node SDK нет admin-helper обёртки над ними.",
    dlqCallout:
      "Replay требует, чтобы исходная строка event_log всё ещё существовала. Если registry.gc_retention_days (по умолчанию 30) или events.dlq_retention_ms (по умолчанию 30д) её уже вычистили, replay возвращает ErrEventLogPurged — тела сообщения, хранящегося вечно, как в вручную дренируемом DLQ RabbitMQ, здесь нет.",

    prefetchTitle: "Prefetch и порядок",
    prefetchP1:
      "channel.prefetch(n) ограничивает, сколько неподтверждённых сообщений консьюмер RabbitMQ может держать одновременно. Прямой эквивалент — опция конструктора eventsMaxInFlight (по умолчанию 32) — она объявляется рантайму как SubscribeInit.max_in_flight и ограничивает конкурентные входящие доставки этому инстансу подписчика.",
    prefetchCode: `const sb = new ServiceBridge(url, key, {
  eventsMaxInFlight: 10, // как channel.prefetch(10)
});`,
    prefetchP2:
      "Больше поведенческая разница — в порядке. Очереди RabbitMQ по умолчанию FIFO на очередь; ServiceBridge раздаёт доставки параллельно по инстансам сервиса-потребителя, если не подключить упорядочивание по ключу через partitionKey при publish:",
    prefetchOrderCode: `await sb.event.publish("order.line.added",   payload, { partitionKey: "order-42" });
await sb.event.publish("order.line.removed", payload, { partitionKey: "order-42" });
// → строго по порядку, на ОДНОМ инстансе консьюмера`,
    prefetchP3:
      "Без partitionKey доставки для одного сервиса-потребителя идут с полным параллелизмом по его живым инстансам — это ближе к очереди RabbitMQ с несколькими конкурирующими консьюмерами без группировки сообщений, чем к одной упорядоченной очереди.",

    notSupportedTitle: "Чего нет",
    notSupportedItems: [
      "Маршрутизация в стиле headers-exchange. Маршрутизация только по имени события плюс AMQP-style wildcard — совпадения по произвольным заголовкам или содержимому сообщения нет.",
      "Селективный nack-без-requeue. Throw в handler'е всегда идёт через лестницу повторов к DLQ; эквивалента nack(msg, false, false) для немедленного дропа одного сообщения без траты попытки нет.",
      "TTL на сообщение или очередь. Только у самого DLQ есть окно хранения (events.dlq_retention_ms); способа заранее истечь ещё-ретраящуюся обычную доставку нет.",
      "Несколько независимых очередей на один exchange с разными привязками. У одного имени события ровно одна поверхность маршрутизации; fan-out на N разных сервисов-потребителей работает (каждый объявляет свой handler), но нет расхождения конфигурации на уровне очереди — как две очереди RabbitMQ, привязанные к одному exchange, каждая со своим TTL, лимитом длины или dead-letter целью.",
      "UI управления топологией на уровне брокера (exchange/queue/binding) — потому что топологии для управления нет. Это компромисс в гибкости формы маршрутизации, а не недостающая фича, которую нужно обходить.",
    ],
  },
};

export function PageMigrateRabbitmq() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="overview">{t.overviewTitle}</H2>
      <P>{t.overviewP1}</P>
      <P>{t.overviewP2}</P>
      <Callout type="info">{t.overviewCallout}</Callout>

      <H2 id="mapping">{t.mappingTitle}</H2>
      <ParamTable rows={t.mappingRows} />

      <H2 id="before-after">{t.beforeAfterTitle}</H2>
      <P>{t.beforeAfterP}</P>
      <MultiCodeBlock code={{ ts: t.beforeCode }} />
      <MultiCodeBlock code={{ ts: t.afterCode }} />
      <Callout type="tip">{t.beforeAfterCallout}</Callout>
      <P>{t.wildcardNote}</P>

      <H2 id="ack-nack">{t.ackNackTitle}</H2>
      <P>{t.ackNackP1}</P>
      <MultiCodeBlock code={{ ts: t.ackNackCode }} />
      <P>{t.ackNackP2}</P>
      <P>{t.ackNackMulti}</P>

      <H2 id="dlq-replay">{t.dlqTitle}</H2>
      <P>{t.dlqP1}</P>
      <P>
        {t.dlqP2Pre}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() => document.dispatchEvent(new CustomEvent("sb-nav", { detail: "dlq-replay" }))}
        >
          {t.dlqLink}
        </button>
        {t.dlqP2Post}
      </P>
      <Callout type="warning">{t.dlqCallout}</Callout>

      <H2 id="prefetch">{t.prefetchTitle}</H2>
      <P>{t.prefetchP1}</P>
      <MultiCodeBlock code={{ ts: t.prefetchCode }} />
      <P>{t.prefetchP2}</P>
      <MultiCodeBlock code={{ ts: t.prefetchOrderCode }} />
      <P>{t.prefetchP3}</P>

      <H2 id="not-supported">{t.notSupportedTitle}</H2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.notSupportedItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <P>
        <Mono>eventsMaxInFlight</Mono> · <Mono>partitionKey</Mono> · <Mono>events_dlq</Mono>
      </P>
    </div>
  );
}
