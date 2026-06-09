import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "Offline Queue",
    description:
      "Every event you publish first lands in a local SQLite outbox on disk, then a background drainer ships it to the runtime. If the runtime is unreachable, events wait on disk and flush automatically after reconnect — no code changes needed.",

    introP1:
      "When you call sb.event.publish(), the SDK does not send the event straight over the network. It writes the event into a local SQLite database (file sdk.db) and returns immediately. A background loop called the drainer reads pending rows and publishes them to the runtime over gRPC.",
    introP2:
      "Because the event is already persisted on disk, publishing survives a runtime outage, a network blip, or even a process restart. This is the at-least-once delivery guarantee for events.",
    introScope:
      "Only sb.event.publish() is backed by the outbox. RPC calls (sb.rpc.call), workflow starts (sb.workflow.start), job triggers, and streams are not queued offline — they need a live connection and fail fast when the runtime is unreachable.",

    behaviorTitle: "How it works",
    flowTitle: "Publish flow",
    flowStep1: "sb.event.publish() encodes the payload and inserts one row into the event_outbox table with status pending. It returns { eventId } right away.",
    flowStep2: "The drainer selects due pending rows, marks them inflight, and sends a batch to the runtime via Events.Publish.",
    flowStep3: "On success (accepted or duplicate) the row is deleted. On a network error the row goes back to pending with a backoff delay. After 5 failed attempts it is marked failed.",
    flowStep4: "On reconnect the drainer wakes up automatically and ships everything that accumulated while offline.",
    flowCode:
      "// publish never blocks on the network — it writes to disk and returns\nconst { eventId } = await sb.event.publish(\"order.created\", {\n  orderId: \"ord_123\",\n  total: 4990,\n});\n\n// eventId is real immediately (UUIDv7), even if the runtime is down.\n// The drainer delivers the event once the connection is back.",

    crashTitle: "Crash recovery",
    crashP:
      "If the process is killed (SIGKILL, crash) while rows are inflight, they would otherwise be stuck. On the next Storage.open() every inflight row is reset back to pending, so it is retried on the next start. Nothing is silently lost.",

    backoffTitle: "Retry backoff",
    backoffP:
      "When the runtime is unreachable, the drainer retries each row on a growing delay ladder (with ±25% jitter): 1s, 5s, 30s, 2m, 10m. After 5 attempts the row is marked failed and stops retrying.",

    configTitle: "Configuration",
    configP:
      "You tune the outbox through ServiceBridge constructor options. The SDK reads no environment variables; pass what you need when you build the client.",
    optDataDir: "Directory that holds the SQLite file sdk.db. The outbox lives here, so the path must be writable and persistent (not a tmpfs) for events to survive a restart.",
    optMaxRows: "Cap on rows in the outbox. When it is reached, sb.event.publish() throws OutboxFullError instead of enqueuing.",
    optDrainerBatch: "How many pending rows the drainer pulls and ships per iteration.",
    optMaxInFlight: "Max concurrent event deliveries the subscriber declares to the runtime; it bounds back-pressure.",
    configCode: `const sb = new ServiceBridge("localhost:14445", serviceKey, {
  dataDir: "/var/lib/myapp/sb", // persistent volume for sdk.db
  maxOutboxRows: 200_000,
  eventsDrainerBatch: 100,
  eventsMaxInFlight: 64,
});`,

    fullTitle: "When the outbox is full",
    fullP:
      "The SDK never drops your events to make room; there is no eviction policy. If the outbox reaches the cap because the runtime has been unreachable for a while, publish() throws OutboxFullError. Catch it, slow the producer down, or raise maxOutboxRows.",
    fullCode:
      'import { OutboxFullError } from "servicebridge";\n\ntry {\n  await sb.event.publish("order.created", payload);\n} catch (err) {\n  if (err instanceof OutboxFullError) {\n    // runtime has been down too long and the local outbox is full —\n    // slow down the producer or raise maxOutboxRows in the constructor\n  }\n  throw err;\n}',

    calloutPersist:
      "The offline queue is durable, not in-memory. Events buffered while offline live in sdk.db on disk and survive a process restart. Point dataDir at a persistent volume.",
    calloutScope:
      "Only events use the outbox. If you need a workflow or RPC to survive an outage, model it as a durable workflow on the runtime side — the SDK does not queue RPC or workflow calls locally.",
  },
  ru: {
    badge: "Production",
    title: "Офлайн-очередь",
    description:
      "Каждое опубликованное событие сначала попадает в локальный SQLite-outbox на диске, затем фоновый drainer отправляет его в runtime. Если runtime недоступен, события ждут на диске и автоматически сбрасываются после переподключения — менять код не нужно.",

    introP1:
      "Когда вы вызываете sb.event.publish(), SDK не отправляет событие сразу по сети. Он записывает событие в локальную базу SQLite (файл sdk.db) и сразу возвращает управление. Фоновый цикл — drainer — читает строки в статусе pending и публикует их в runtime по gRPC.",
    introP2:
      "Так как событие уже сохранено на диске, публикация переживает недоступность runtime, сетевой сбой и даже перезапуск процесса. Это и есть гарантия доставки событий at-least-once.",
    introScope:
      "Outbox обслуживает только sb.event.publish(). RPC-вызовы (sb.rpc.call), запуски воркфлоу (sb.workflow.start), триггеры заданий и стримы офлайн не буферизуются — им нужно живое соединение, и при недоступности runtime они падают сразу.",

    behaviorTitle: "Как это работает",
    flowTitle: "Поток публикации",
    flowStep1: "sb.event.publish() кодирует payload и вставляет одну строку в таблицу event_outbox со статусом pending. Сразу возвращает { eventId }.",
    flowStep2: "Drainer выбирает готовые pending-строки, помечает их inflight и отправляет пачкой в runtime через Events.Publish.",
    flowStep3: "При успехе (accepted или duplicate) строка удаляется. При сетевой ошибке строка возвращается в pending с задержкой backoff. После 5 неудачных попыток помечается failed.",
    flowStep4: "При переподключении drainer просыпается автоматически и отправляет всё, что накопилось в офлайне.",
    flowCode:
      "// publish никогда не блокируется на сети — пишет на диск и возвращается\nconst { eventId } = await sb.event.publish(\"order.created\", {\n  orderId: \"ord_123\",\n  total: 4990,\n});\n\n// eventId реальный сразу (UUIDv7), даже если runtime недоступен.\n// Drainer доставит событие, как только соединение восстановится.",

    crashTitle: "Восстановление после краха",
    crashP:
      "Если процесс убит (SIGKILL, краш) пока строки в статусе inflight, они иначе зависли бы. При следующем Storage.open() каждая inflight-строка сбрасывается обратно в pending и повторяется на следующем старте. Ничего молча не теряется.",

    backoffTitle: "Backoff повторов",
    backoffP:
      "Когда runtime недоступен, drainer повторяет каждую строку по растущей лестнице задержек (с джиттером ±25%): 1с, 5с, 30с, 2м, 10м. После 5 попыток строка помечается failed и повторы прекращаются.",

    configTitle: "Конфигурация",
    configP:
      "Outbox настраивается опциями конструктора ServiceBridge. SDK не читает переменные окружения — передайте нужное при создании клиента.",
    optDataDir: "Каталог с файлом SQLite sdk.db. Outbox лежит здесь, поэтому путь должен быть записываемым и постоянным (не tmpfs), чтобы события пережили перезапуск.",
    optMaxRows: "Лимит строк в outbox. Когда он достигнут, sb.event.publish() бросает OutboxFullError вместо постановки в очередь.",
    optDrainerBatch: "Сколько pending-строк drainer берёт и отправляет за одну итерацию.",
    optMaxInFlight: "Максимум одновременных доставок событий, которые подписчик заявляет рантайму; ограничивает back-pressure.",
    configCode: `const sb = new ServiceBridge("localhost:14445", serviceKey, {
  dataDir: "/var/lib/myapp/sb", // постоянный том для sdk.db
  maxOutboxRows: 200_000,
  eventsDrainerBatch: 100,
  eventsMaxInFlight: 64,
});`,

    fullTitle: "Когда outbox заполнен",
    fullP:
      "SDK никогда не выбрасывает ваши события, чтобы освободить место; политики вытеснения нет. Если outbox достиг лимита из-за долгой недоступности runtime, publish() бросает OutboxFullError. Поймайте ошибку, притормозите производителя или поднимите maxOutboxRows.",
    fullCode:
      'import { OutboxFullError } from "servicebridge";\n\ntry {\n  await sb.event.publish("order.created", payload);\n} catch (err) {\n  if (err instanceof OutboxFullError) {\n    // runtime недоступен слишком долго, локальный outbox заполнен —\n    // замедлите производителя или увеличьте maxOutboxRows в конструкторе\n  }\n  throw err;\n}',

    calloutPersist:
      "Офлайн-очередь долговечная, а не в памяти. События, буферизованные в офлайне, лежат в файле sdk.db на диске и переживают перезапуск процесса. Укажите dataDir на постоянном томе.",
    calloutScope:
      "Outbox используют только события. Если нужно, чтобы воркфлоу или RPC пережили сбой, моделируйте это как durable-воркфлоу на стороне runtime — SDK не ставит RPC и воркфлоу-вызовы в локальную очередь.",
  },
};

export function PageOfflineQueue() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>{t.introP1}</P>
      <P>{t.introP2}</P>

      <Callout type="info">{t.introScope}</Callout>

      <H2 id="behavior">{t.behaviorTitle}</H2>

      <H3>{t.flowTitle}</H3>
      <ul className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.flowStep1}</li>
        <li>{t.flowStep2}</li>
        <li>{t.flowStep3}</li>
        <li>{t.flowStep4}</li>
      </ul>

      <MultiCodeBlock code={{ ts: t.flowCode }} />

      <Callout type="info">{t.calloutPersist}</Callout>

      <H3>{t.crashTitle}</H3>
      <P>{t.crashP}</P>

      <H3>{t.backoffTitle}</H3>
      <P>{t.backoffP}</P>

      <H2 id="config">{t.configTitle}</H2>
      <P>{t.configP}</P>

      <ParamTable
        rows={[
          { name: "dataDir", type: "string", default: '"./.servicebridge"', desc: t.optDataDir },
          { name: "maxOutboxRows", type: "number", default: "100000", desc: t.optMaxRows },
          { name: "eventsDrainerBatch", type: "number", default: "50", desc: t.optDrainerBatch },
          { name: "eventsMaxInFlight", type: "number", default: "32", desc: t.optMaxInFlight },
        ]}
      />
      <DocCodeBlock code={t.configCode} lang="ts" />

      <H3>{t.fullTitle}</H3>
      <P>{t.fullP}</P>
      <MultiCodeBlock code={{ ts: t.fullCode }} />

      <Callout type="tip">{t.calloutScope}</Callout>
    </div>
  );
}
