import { Callout, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "Availability & Upgrades",
    description:
      "ServiceBridge runs exactly one runtime instance. An upgrade is a stop, schema migrations on boot, then a start — a bounded window where the control plane is unavailable. This page defines that window and the built-in mitigations that absorb it.",

    windowTitle: "The upgrade window",
    windowDesc:
      "An upgrade replaces the running binary. The sequence: SIGTERM to the old process → graceful gRPC drain (bounded by grpc.shutdown_timeout_ms) → process exit → new binary starts → schema migrations run synchronously before gRPC accepts frames → data plane opens. A trivial or no-op migration restart is typically 1–3 s. A heavy schema change extends the window by however long that statement runs.",
    windowCallout:
      "Migrations are embedded in the binary, up-only, and idempotent — an already-applied migration is skipped. The window inherits the runtime of the slowest migration statement. Design destructive or large-table changes to run as background work, not as blocking boot migrations.",

    degradationTitle: "Degradation by capability",
    degradationNote:
      "works = unaffected. degrades = continues with reduced guarantees. stalls = pauses, resumes automatically. fails = rejected during the window.",
    degradationRows: [
      { capability: "Direct RPC (peer-to-peer mTLS)", during: "works", recovery: "Cache refills on next registry snapshot" },
      { capability: "Event publish (SDK side)", during: "degrades — buffered to local outbox", recovery: "Drains automatically once runtime is back" },
      { capability: "Durable event delivery (runtime side)", during: "stalls", recovery: "Dispatcher resumes, at-least-once preserved" },
      { capability: "DLQ processing", during: "stalls", recovery: "Resumes" },
      { capability: "Workflows (DAG execution)", during: "stalls", recovery: "Runtime resumes lease-owned runs" },
      { capability: "Jobs / cron / delayed", during: "stalls", recovery: "Scheduler resumes; catch-up per job policy" },
      { capability: "New connections (Bootstrap / Provision)", during: "fails", recovery: "Succeed once data plane reopens" },
      { capability: "Certificate issuance / refresh", during: "fails", recovery: "Succeeds once data plane reopens" },
      { capability: "Service discovery (new deltas)", during: "fails — no new snapshots", recovery: "Resumes on reconnect" },
      { capability: "Alerts evaluation", during: "stalls", recovery: "Evaluator resumes" },
      { capability: "Rate-limiting gate (job registration)", during: "fails", recovery: "Resumes" },
      { capability: "UI console", during: "fails", recovery: "Available once :14444 rebinds" },
    ] as { capability: string; during: string; recovery: string }[],
    degradationHeader: ["Capability", "During window", "Recovery"],

    mitigationsTitle: "Built-in mitigations",
    mitigationsDesc:
      "These are not operational add-ons. They ship in the SDK and runtime and turn the window from an outage into a buffered pause.",

    outboxTitle: "SDK outbox — event publish survives the window",
    outboxDesc:
      "Durable events write to a local SQLite outbox before returning. A background drainer ships rows when the runtime is reachable.",
    outboxRows: [
      { name: "Outbox cap", value: "100 000 rows", note: "publish() throws OutboxFullError at the cap" },
      { name: "Drainer backoff ladder", value: "[1s, 5s, 30s, 120s, 600s] ±25% jitter", note: "Window shorter than the ladder is absorbed transparently" },
      { name: "Max attempts per row", value: "5", note: "After 5 failures the row is set status='failed' and not retried" },
    ] as { name: string; value: string; note: string }[],

    directRpcTitle: "Direct RPC connection cache",
    directRpcDesc:
      "DirectTransport caches one mTLS gRPC client per endpoint. The cache lives until just before the leaf cert expires (expiresAt = notAfter − 5 min, floored at 60 s). Routing uses runtime-supplied health hints trusted for 60 s — twice the runtime's 30 s health-inference window. Past 60 s the hint is treated as stale and the local circuit breaker carries routing.",

    reconnectTitle: "Session reconnect ladder",
    reconnectDesc:
      "When the control stream breaks, the SDK reconnects on [1s, 5s, 15s, 30s, 60s] ±20% jitter. The jitter smears a fleet of SDKs that all lost the runtime at once into a window instead of a synchronized spike.",

    aleastOnceTitle: "At-least-once resume across restart",
    aleastOnceDesc:
      "Event state lives in Postgres. A restart does not drop in-flight deliveries — the dispatcher resumes from the persisted state. Idempotency entries outlive the window (24 h TTL for event and workflow-step keys). Handlers must be idempotent: at-least-once means a handler can see the same event twice across a restart.",

    boundariesTitle: "Model boundaries",
    boundariesDesc:
      "The mitigations bound the window; they do not make it free.",
    boundaries: [
      "Failed outbox rows. A window outlasting 5 drainer attempts leaves rows with status='failed'. No automatic retry past MAX_ATTEMPTS.",
      "OutboxFullError. If publishing continues faster than the drainer empties the outbox during a long window, publish() starts throwing.",
      "No new discovery without the runtime. Direct RPC keeps flowing only for peers the caller already resolved.",
      "New connections and cert issuance fail outright. Bootstrap, Provision, and cert refresh require the control plane.",
      "Window length is migration-bound, not constant. The 1–3 s figure is the restart floor with a trivial migration.",
    ],

    operatorTitle: "Operator guidance",
    operatorRows: [
      { name: "Keep migrations cheap", desc: "The window inherits the slowest migration statement. Design large-table changes as background work." },
      { name: "Tune grpc.shutdown_timeout_ms", desc: "Too low truncates in-flight control calls; too high lengthens the window on every upgrade." },
      { name: "Watch outbox depth", desc: "Rising depth after the runtime is back means the drainer is not keeping up — investigate before it hits OutboxFullError." },
      { name: "Watch event_outbox status='failed'", desc: "Each one is an event that exhausted 5 attempts. Non-zero count after upgrade means the window outlasted the drainer ladder." },
      { name: "Measure :14445 / :14444 accept time", desc: "This is the real measured window. A jump across upgrades points at a migration that grew." },
    ] as { name: string; desc: string }[],
  },
  ru: {
    badge: "Production",
    title: "Доступность и обновления",
    description:
      "ServiceBridge запускает ровно один инстанс рантайма. Обновление — это остановка, миграции схемы при старте, затем запуск: ограниченное окно, когда control plane недоступен. Страница определяет это окно и встроенные смягчения, которые его поглощают.",

    windowTitle: "Окно обновления",
    windowDesc:
      "Обновление заменяет работающий бинарь. Последовательность: SIGTERM старому процессу → graceful drain gRPC (ограничен grpc.shutdown_timeout_ms) → выход процесса → запуск нового бинаря → синхронные миграции схемы до открытия gRPC → открытие data plane. Тривиальный или пустой рестарт — типично 1–3 с. Тяжёлое изменение схемы удлиняет окно настолько, насколько работает тот SQL-запрос.",
    windowCallout:
      "Миграции встроены в бинарь, только вперёд (up-only), идемпотентны — уже применённая миграция пропускается. Окно наследует время самого медленного оператора. Деструктивные изменения или изменения больших таблиц проектируйте как фоновую работу, не как блокирующие boot-миграции.",

    degradationTitle: "Деградация по возможностям",
    degradationNote:
      "works = не затронуто. degrades = продолжает с меньшими гарантиями. stalls = пауза, возобновляется автоматически. fails = отклоняется в течение окна.",
    degradationRows: [
      { capability: "Direct RPC (peer-to-peer mTLS)", during: "works", recovery: "Кэш обновляется при следующем снапшоте реестра" },
      { capability: "Публикация событий (SDK)", during: "degrades — буферизуется в локальный outbox", recovery: "Дренируется автоматически после возврата рантайма" },
      { capability: "Durable-доставка событий (рантайм)", during: "stalls", recovery: "Диспетчер возобновляет, at-least-once сохраняется" },
      { capability: "Обработка DLQ", during: "stalls", recovery: "Возобновляется" },
      { capability: "Воркфлоу (выполнение DAG)", during: "stalls", recovery: "Рантайм возобновляет lease-owned запуски" },
      { capability: "Задачи / cron / delayed", during: "stalls", recovery: "Планировщик возобновляет; catch-up по политике задачи" },
      { capability: "Новые подключения (Bootstrap / Provision)", during: "fails", recovery: "Успешно после открытия data plane" },
      { capability: "Выпуск / обновление сертификатов", during: "fails", recovery: "Успешно после открытия data plane" },
      { capability: "Service discovery (новые дельты)", during: "fails — нет новых снапшотов", recovery: "Возобновляется при переподключении" },
      { capability: "Оценка алертов", during: "stalls", recovery: "Evaluator возобновляется" },
      { capability: "Gate rate-limiting (регистрация задач)", during: "fails", recovery: "Возобновляется" },
      { capability: "UI-консоль", during: "fails", recovery: "Доступна после привязки :14444" },
    ] as { capability: string; during: string; recovery: string }[],
    degradationHeader: ["Возможность", "В течение окна", "Восстановление"],

    mitigationsTitle: "Встроенные смягчения",
    mitigationsDesc:
      "Это не операционные надстройки. Они поставляются в SDK и рантайме и превращают окно из сбоя в буферизованную паузу.",

    outboxTitle: "SDK outbox — публикация событий переживает окно",
    outboxDesc:
      "Durable-события пишутся в локальный SQLite outbox до возврата. Фоновый drainer отправляет строки, когда рантайм доступен.",
    outboxRows: [
      { name: "Ёмкость outbox", value: "100 000 строк", note: "publish() кидает OutboxFullError при достижении лимита" },
      { name: "Лестница backoff drainer'а", value: "[1с, 5с, 30с, 120с, 600с] ±25% jitter", note: "Окно короче лестницы поглощается прозрачно" },
      { name: "Максимум попыток на строку", value: "5", note: "После 5 неудач строка получает status='failed' и не повторяется" },
    ] as { name: string; value: string; note: string }[],

    directRpcTitle: "Кэш соединений Direct RPC",
    directRpcDesc:
      "DirectTransport кэширует один mTLS gRPC-клиент на endpoint. Кэш живёт до истечения leaf-сертификата (expiresAt = notAfter − 5 мин, не менее 60 с). Маршрутизация использует health-хинты рантайма с TTL 60 с — вдвое больше 30-с окна health-inference рантайма. После 60 с хинт считается устаревшим, маршрутизацию ведёт локальный circuit breaker.",

    reconnectTitle: "Лестница переподключения сессии",
    reconnectDesc:
      "При разрыве control-stream SDK переподключается по лестнице [1с, 5с, 15с, 30с, 60с] ±20% jitter. Jitter размазывает флот SDK, потерявших рантайм одновременно, по окну вместо синхронного шторма.",

    aleastOnceTitle: "At-least-once resume после рестарта",
    aleastOnceDesc:
      "Состояние событий лежит в Postgres. Рестарт не теряет in-flight доставки — диспетчер возобновляет из персистентного состояния. Записи идемпотентности переживают окно (TTL 24 ч для событий и шагов воркфлоу). Обработчики должны быть идемпотентны: at-least-once означает, что один и тот же event можно получить дважды после рестарта.",

    boundariesTitle: "Границы модели",
    boundariesDesc:
      "Смягчения ограничивают окно, но не делают его бесплатным.",
    boundaries: [
      "Отказавшие строки outbox. Окно, пережившее 5 попыток drainer'а, оставляет строки с status='failed'. Автоматического повтора после MAX_ATTEMPTS нет.",
      "OutboxFullError. Если публикация продолжается быстрее, чем drainer опустошает outbox в долгом окне, publish() начинает кидать исключения.",
      "Новый discovery без рантайма невозможен. Direct RPC работает только для пиров, которых вызывающий уже разрешил.",
      "Новые подключения и выпуск сертификатов отказывают полностью. Bootstrap, Provision и обновление сертификатов требуют control plane.",
      "Длина окна ограничена миграцией, а не постоянна. Цифра 1–3 с — нижняя граница для тривиальной миграции.",
    ],

    operatorTitle: "Рекомендации оператору",
    operatorRows: [
      { name: "Держите миграции дешёвыми", desc: "Окно наследует время самого медленного SQL-оператора. Проектируйте изменения больших таблиц как фоновую работу." },
      { name: "Тюньте grpc.shutdown_timeout_ms", desc: "Слишком маленький — усекает in-flight control-вызовы; слишком большой — удлиняет окно при каждом обновлении." },
      { name: "Следите за глубиной outbox", desc: "Растущая глубина после возврата рантайма означает, что drainer не успевает — расследуйте до попадания в OutboxFullError." },
      { name: "Следите за event_outbox status='failed'", desc: "Каждая строка — это событие, исчерпавшее 5 попыток. Ненулевое количество после обновления означает, что окно пережило лестницу drainer'а." },
      { name: "Измеряйте время приёма :14445 / :14444", desc: "Это реально измеренное окно. Скачок между обновлениями указывает на выросшую миграцию." },
    ] as { name: string; desc: string }[],
  },
};

export function PageAvailability() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="upgrade-window">{t.windowTitle}</H2>
      <P>{t.windowDesc}</P>
      <Callout type="warning">{t.windowCallout}</Callout>

      <H2 id="degradation">{t.degradationTitle}</H2>
      <P>{t.degradationNote}</P>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.degradationHeader[0]}</th>
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.degradationHeader[1]}</th>
              <th className="text-left py-2 font-medium text-muted-foreground">{t.degradationHeader[2]}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {t.degradationRows.map((row) => (
              <tr key={row.capability} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium">{row.capability}</td>
                <td className="py-2 pr-4 text-xs">{row.during}</td>
                <td className="py-2 text-xs">{row.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="mitigations">{t.mitigationsTitle}</H2>
      <P>{t.mitigationsDesc}</P>

      <H3 id="sdk-outbox">{t.outboxTitle}</H3>
      <P>{t.outboxDesc}</P>
      <div className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <tbody className="text-muted-foreground">
            {t.outboxRows.map((row) => (
              <tr key={row.name} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium w-48 shrink-0">{row.name}</td>
                <td className="py-2 pr-4 font-mono text-xs">{row.value}</td>
                <td className="py-2 text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3 id="direct-rpc-cache">{t.directRpcTitle}</H3>
      <P>{t.directRpcDesc}</P>

      <H3 id="reconnect-ladder">{t.reconnectTitle}</H3>
      <P>{t.reconnectDesc}</P>

      <H3 id="at-least-once">{t.aleastOnceTitle}</H3>
      <P>{t.aleastOnceDesc}</P>

      <H2 id="boundaries">{t.boundariesTitle}</H2>
      <P>{t.boundariesDesc}</P>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.boundaries.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      <H2 id="operator-guidance">{t.operatorTitle}</H2>
      <div className="space-y-3 my-3">
        {t.operatorRows.map((row) => (
          <div key={row.name} className="flex gap-3">
            <Mono>{row.name}</Mono>
            <span className="text-sm text-muted-foreground">{row.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
