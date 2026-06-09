import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  H2,
  H3,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "SDK Reference",
    title: "Jobs & Scheduling",
    description:
      "Cron, one-shot delayed, and interval jobs. The runtime owns the schedule (stored in PostgreSQL); your service runs the handler. No Redis, no cron daemon, no separate queue workers.",

    howTitle: "How it works",
    howP1:
      "The runtime is the single source of truth for the schedule. Cron expressions, delayed run-at moments, and intervals live in PostgreSQL and show up in the Service Map. The runtime triggers; your service runs the handler.",
    howP2:
      "Run as many replicas of a service as you like — the runtime delivers each tick to exactly one live replica through a PostgreSQL lease plus a 5-second heartbeat. A job is a one-step tracker: one handler, one attempt plus retries. For multi-step durable flows use a workflow.",
    howCallout:
      "A job handler receives no payload — only a context object. Pass nothing through the trigger; read what you need from the schedule moment (ctx.scheduledAt / ctx.localScheduledAt) or from your own storage.",

    handleTitle: "sb.job.handle()",
    handleP:
      "Declare a job before sb.start(). The signature is (name, opts, fn) — the same singular-namespace, handle-verb shape as sb.event.handle / sb.workflow.handle. A duplicate job name throws immediately at registration.",

    optsTitle: "JobOpts",
    optsTrigger:
      "Exactly one of cron, delayed, or interval. The other fields tune delivery, retries, and concurrency.",

    cronTitle: "Cron trigger",
    cronP:
      "A 5-field cron expression (no seconds field) with an optional IANA timezone. Minimum granularity is one minute — for sub-minute schedules use an interval trigger.",
    cronCallout:
      "6-field cron (with seconds) is rejected by the SDK before it reaches the runtime. The validator splits on whitespace and requires exactly 5 fields.",

    delayTitle: "Delayed trigger (one-shot)",
    delayP:
      "Fire once at a specific moment. The at field accepts a Date, a unix-ms number, or an ISO date string. Useful for trial expirations, follow-ups, or reminders. The schedule survives a runtime restart — a delayed job set today for tomorrow still fires.",

    intervalTitle: "Interval trigger",
    intervalP:
      "Fire every N milliseconds. Minimum is 100 ms (runtime-configurable). Use this for sub-minute schedules where cron cannot help.",

    policyTitle: "Catchup & overlap policy",
    catchupP:
      "Catchup decides what happens to ticks that were missed while the runtime was down:",
    catchupSkip:
      'skip (default) — missed ticks are ignored; resume at the next future tick.',
    catchupOnce:
      'fire_once — exactly one catch-up run right after recovery.',
    catchupAll:
      'fire_all — every missed tick, up to a per-job cap and a global recovery budget.',
    overlapP:
      "Overlap decides what happens when the next tick arrives while the previous run is still in flight:",
    overlapSkip: "skip (default) — the new tick is dropped.",
    overlapBuffer:
      "buffer_one — one tick may queue behind the running one; the rest are dropped.",
    overlapAllow:
      "allow — runs in parallel, bounded by maxConcurrent.",

    retryTitle: "Retry policy",
    retryP:
      "If a handler throws and the error is retryable (the default), the runtime retries up to maxAttempts with exponential backoff. When attempts are exhausted the execution moves to dead_letter. A successful run ends as success.",
    retryRetryP:
      "Tune the backoff with the retry option — initialMs, maxMs, multiplier, and jitter (a 0..1 fraction).",
    retryNonP:
      "To send an error straight to the DLQ without retrying, mark it non-retryable:",
    retryIdemCallout:
      "Delivery is at-least-once. The same tick can arrive more than once after a lease expiry or a replica crash. Make the handler idempotent by ctx.idempotencyKey (stable per scheduled tick) — never by ctx.attempt, which is diagnostic only.",

    ctxTitle: "JobHandlerCtx",
    ctxP:
      "The handler receives a single ctx argument. There is no payload. Trace context is not on ctx — it is propagated automatically, so any sb.rpc.call / sb.event.publish / sb.workflow.start inside the handler inherits the incoming trace.",
    ctxFieldsTitle: "Fields",
    depsTitle: "Declared dependencies & access",
    depsP:
      "If the handler makes downstream calls, declare them in deps so the runtime can check access policy. The job.handle capability is required at registration; each egress dep is checked when the job runs. Jobs are self-only — the runtime is the only caller, so a job has no inbound policy.",

    cName: "cron / delayed / interval",
    cDesc:
      'The trigger. Exactly one key. { cron: string, tz?: string } for 5-field cron (e.g. "0 9 * * *"). { delayed: { at } } where at is a Date, unix-ms number, or ISO string. { interval: number } in milliseconds.',
    catchupDesc:
      '"skip" | "fire_once" | "fire_all" — how to handle ticks missed during a runtime outage.',
    overlapDesc:
      '"skip" | "allow" | "buffer_one" — what to do when a tick arrives while the previous run is still active.',
    depsDesc:
      "Downstream calls the handler is allowed to make: { rpc } | { event } | { workflow }. Checked against the service access policy.",
    maxAttemptsDesc:
      "Maximum delivery attempts before the execution goes to dead_letter.",
    leaseTtlMsDesc:
      "Lease duration in ms. If the replica does not acknowledge within the lease, the tick is re-dispatched to another replica.",
    maxConcurrentDesc:
      "With overlap: \"allow\", the cap on parallel runs of this job.",
    retryDesc:
      "Exponential backoff config: { initialMs, maxMs, multiplier, jitter }.",

    fJobName: "Job name as registered.",
    fExecutionId: "Id of this execution.",
    fScheduledAt: "UTC moment the tick was scheduled for.",
    fLocalScheduledAt:
      "Same moment in the cron timezone (UTC for interval / delayed).",
    fAttempt: "Attempt counter: 1, 2, 3, … Diagnostic, not for dedup.",
    fIdempotencyKey: "Stable key per scheduled tick. Dedup on this.",
    fSignal: "AbortSignal that fires on lease loss or reconnect.",
  },
  ru: {
    badge: "SDK Reference",
    title: "Задания и планировщик",
    description:
      "Cron-, одноразовые отложенные и интервальные задания. Расписанием владеет runtime (хранит в PostgreSQL); handler выполняет ваш сервис. Без Redis, cron-демона и отдельных воркеров очередей.",

    howTitle: "Как работает",
    howP1:
      "Runtime — единственный источник истины по расписанию. Cron-выражения, моменты отложенного запуска и интервалы хранятся в PostgreSQL и видны в Service Map. Runtime триггерит; handler выполняет ваш сервис.",
    howP2:
      "Запускайте сколько угодно реплик сервиса — runtime доставляет каждый тик ровно одной живой реплике через аренду (lease) в PostgreSQL и heartbeat раз в 5 секунд. Задание — одношаговый трекер: один handler, одна попытка плюс повторы. Для многошаговых durable-процессов используйте workflow.",
    howCallout:
      "Handler задания не получает payload — только объект контекста. Через триггер ничего не передаётся; берите нужное из момента расписания (ctx.scheduledAt / ctx.localScheduledAt) или из собственного хранилища.",

    handleTitle: "sb.job.handle()",
    handleP:
      "Объявите задание до sb.start(). Сигнатура — (name, opts, fn): та же форма с singular-неймспейсом и глаголом handle, что у sb.event.handle / sb.workflow.handle. Дубликат имени задания бросает исключение сразу при регистрации.",

    optsTitle: "JobOpts",
    optsTrigger:
      "Ровно одно из cron, delayed или interval. Остальные поля настраивают доставку, повторы и конкурентность.",

    cronTitle: "Cron-триггер",
    cronP:
      "5-полевое cron-выражение (без поля секунд) с опциональной IANA-таймзоной. Минимальная гранулярность — одна минута; для суб-минутных расписаний используйте интервальный триггер.",
    cronCallout:
      "6-полевой cron (с секундами) отклоняется SDK до отправки на runtime. Валидатор разбивает строку по пробелам и требует ровно 5 полей.",

    delayTitle: "Отложенный триггер (одноразовый)",
    delayP:
      "Срабатывает один раз в конкретный момент. Поле at принимает Date, число unix-ms или ISO-строку даты. Полезно для истечения пробных периодов, напоминаний, follow-up. Расписание переживает перезапуск runtime — отложенное задание, заведённое сегодня на завтра, всё равно сработает.",

    intervalTitle: "Интервальный триггер",
    intervalP:
      "Срабатывает каждые N миллисекунд. Минимум — 100 мс (настраивается в runtime). Используйте для суб-минутных расписаний, где cron не помогает.",

    policyTitle: "Политика catchup и overlap",
    catchupP:
      "Catchup решает, что делать с тиками, пропущенными пока runtime был недоступен:",
    catchupSkip:
      "skip (по умолчанию) — пропущенные тики игнорируются; продолжаем со следующего будущего тика.",
    catchupOnce:
      "fire_once — ровно один догоняющий запуск сразу после восстановления.",
    catchupAll:
      "fire_all — все пропущенные тики, до per-job лимита и глобального бюджета восстановления.",
    overlapP:
      "Overlap решает, что делать, когда следующий тик наступает, а предыдущий запуск ещё выполняется:",
    overlapSkip: "skip (по умолчанию) — новый тик отбрасывается.",
    overlapBuffer:
      "buffer_one — один тик может встать в очередь за выполняющимся; остальные отбрасываются.",
    overlapAllow:
      "allow — выполняется параллельно, ограничено maxConcurrent.",

    retryTitle: "Политика повторов",
    retryP:
      "Если handler бросает исключение и ошибка retryable (по умолчанию), runtime повторяет до maxAttempts с экспоненциальным backoff. Когда попытки исчерпаны, execution переходит в dead_letter. Успешный запуск завершается как success.",
    retryRetryP:
      "Настройте backoff опцией retry — initialMs, maxMs, multiplier и jitter (доля 0..1).",
    retryNonP:
      "Чтобы отправить ошибку сразу в DLQ без повторов, пометьте её как non-retryable:",
    retryIdemCallout:
      "Доставка — at-least-once. Один и тот же тик может прийти несколько раз после истечения lease или краша реплики. Делайте handler идемпотентным по ctx.idempotencyKey (стабилен для каждого тика) — никогда по ctx.attempt, он только диагностический.",

    ctxTitle: "JobHandlerCtx",
    ctxP:
      "Handler получает один аргумент ctx. Payload нет. Trace-контекст на ctx не приходит — он распространяется автоматически, поэтому любой sb.rpc.call / sb.event.publish / sb.workflow.start внутри handler-а наследует входящий trace.",
    ctxFieldsTitle: "Поля",
    depsTitle: "Объявленные зависимости и доступ",
    depsP:
      "Если handler делает downstream-вызовы, объявите их в deps, чтобы runtime проверил политику доступа. Capability job.handle обязательна на регистрации; каждая egress-зависимость проверяется в момент выполнения задания. Задания self-only — единственный вызывающий это runtime, поэтому у задания нет inbound-политики.",

    cName: "cron / delayed / interval",
    cDesc:
      'Триггер. Ровно один ключ. { cron: string, tz?: string } для 5-полевого cron (напр. "0 9 * * *"). { delayed: { at } }, где at — Date, число unix-ms или ISO-строка. { interval: number } в миллисекундах.',
    catchupDesc:
      '"skip" | "fire_once" | "fire_all" — как обрабатывать тики, пропущенные во время простоя runtime.',
    overlapDesc:
      '"skip" | "allow" | "buffer_one" — что делать, когда тик приходит, а предыдущий запуск ещё активен.',
    depsDesc:
      "Downstream-вызовы, разрешённые handler-у: { rpc } | { event } | { workflow }. Проверяются по политике доступа сервиса.",
    maxAttemptsDesc:
      "Максимум попыток доставки до перехода execution в dead_letter.",
    leaseTtlMsDesc:
      "Длительность аренды в мс. Если реплика не подтвердит в пределах lease, тик переотправляется другой реплике.",
    maxConcurrentDesc:
      'При overlap: "allow" — лимит параллельных запусков этого задания.',
    retryDesc:
      "Конфиг экспоненциального backoff: { initialMs, maxMs, multiplier, jitter }.",

    fJobName: "Имя зарегистрированного задания.",
    fExecutionId: "Id этого execution.",
    fScheduledAt: "UTC-момент, на который запланирован тик.",
    fLocalScheduledAt:
      "Тот же момент в таймзоне cron (UTC для interval / delayed).",
    fAttempt: "Счётчик попыток: 1, 2, 3, … Диагностический, не для дедупликации.",
    fIdempotencyKey: "Стабильный ключ для каждого тика. Дедуп по нему.",
    fSignal: "AbortSignal, срабатывает при потере lease или реконнекте.",
  },
};

export function PageJobs() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      {/* ── How it works ─────────────────────────────────────────── */}
      <H2 id="handler-side">{t.howTitle}</H2>
      <P>{t.howP1}</P>
      <P>{t.howP2}</P>
      <Callout type="info">{t.howCallout}</Callout>

      {/* ── sb.job.handle() ──────────────────────────────────────── */}
      <H2 id="job-schedule">{t.handleTitle}</H2>
      <P>{t.handleP}</P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

sb.job.handle(
  "daily-report",
  {
    trigger: { cron: "0 9 * * *", tz: "Europe/Moscow" },
    catchup: "fire_once",
    deps: [{ rpc: "billing.GenerateReport" }],
  },
  async (ctx) => {
    await sb.rpc.call("billing", "GenerateReport", {
      date: ctx.localScheduledAt,
    });
  },
);

await sb.start();`,
        }}
      />

      {/* ── JobOpts ──────────────────────────────────────────────── */}
      <H2 id="schedule-opts">{t.optsTitle}</H2>
      <P>{t.optsTrigger}</P>
      <ParamTable
        rows={[
          { name: t.cName, type: "Trigger", desc: t.cDesc },
          { name: "catchup", type: "CatchupPolicy", default: '"skip"', desc: t.catchupDesc },
          { name: "overlap", type: "OverlapPolicy", default: '"skip"', desc: t.overlapDesc },
          { name: "deps", type: "DeclaredDep[]", desc: t.depsDesc },
          { name: "maxAttempts", type: "number", desc: t.maxAttemptsDesc },
          { name: "leaseTtlMs", type: "number (ms)", desc: t.leaseTtlMsDesc },
          { name: "maxConcurrent", type: "number", default: "1", desc: t.maxConcurrentDesc },
          { name: "retry", type: "RetryPolicy", desc: t.retryDesc },
        ]}
      />

      {/* ── Cron trigger ─────────────────────────────────────────── */}
      <H2 id="job-cron">{t.cronTitle}</H2>
      <P>{t.cronP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Every 15 minutes, evaluated in the given timezone.
sb.job.handle(
  "sync-inventory",
  { trigger: { cron: "*/15 * * * *", tz: "America/New_York" } },
  async (ctx) => {
    await syncInventory(ctx.localScheduledAt);
  },
);`,
        }}
      />
      <Callout type="warning">{t.cronCallout}</Callout>

      {/* ── Delayed trigger ──────────────────────────────────────── */}
      <H2 id="job-delay">{t.delayTitle}</H2>
      <P>{t.delayP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Fire once, 24 hours from now.
sb.job.handle(
  "send-reminder",
  { trigger: { delayed: { at: Date.now() + 24 * 3600_000 } } },
  async (ctx) => {
    await sb.event.publish("reminders.sent", { at: ctx.scheduledAt });
  },
);`,
        }}
      />

      {/* ── Interval trigger ─────────────────────────────────────── */}
      <H2 id="job-event">{t.intervalTitle}</H2>
      <P>{t.intervalP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Every 5 seconds.
sb.job.handle(
  "heartbeat-probe",
  { trigger: { interval: 5_000 } },
  async (ctx) => {
    await probeHealth();
  },
);`,
        }}
      />

      {/* ── Catchup & overlap ────────────────────────────────────── */}
      <H2 id="job-workflow">{t.policyTitle}</H2>
      <P>{t.catchupP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.catchupSkip}</li>
        <li>{t.catchupOnce}</li>
        <li>{t.catchupAll}</li>
      </ul>
      <P>{t.overlapP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.overlapSkip}</li>
        <li>{t.overlapBuffer}</li>
        <li>{t.overlapAllow}</li>
      </ul>
      <MultiCodeBlock
        code={{
          ts: `sb.job.handle(
  "heavy-etl",
  {
    trigger: { interval: 60_000 },
    catchup: "fire_all",
    overlap: "allow",
    maxConcurrent: 5,
  },
  async (ctx) => {
    await runEtl(ctx.scheduledAt);
  },
);`,
        }}
      />

      {/* ── Retry policy ─────────────────────────────────────────── */}
      <H2 id="job-retry">{t.retryTitle}</H2>
      <P>{t.retryP}</P>
      <P>{t.retryRetryP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.job.handle(
  "billing-collect",
  {
    trigger: { cron: "0 * * * *" },
    maxAttempts: 5,
    retry: { initialMs: 1_000, maxMs: 600_000, multiplier: 2, jitter: 0.25 },
  },
  async (ctx) => {
    await chargeAllSubscriptions();
  },
);`,
        }}
      />
      <P>{t.retryNonP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.job.handle(
  "import-feed",
  { trigger: { cron: "0 2 * * *" } },
  async (ctx) => {
    if (await feedIsMalformed()) {
      const err = new Error("malformed feed") as Error & { retryable?: boolean };
      err.retryable = false; // straight to DLQ, no retries
      throw err;
    }
    await importFeed();
  },
);`,
        }}
      />
      <Callout type="warning">{t.retryIdemCallout}</Callout>

      {/* ── JobHandlerCtx ────────────────────────────────────────── */}
      <H2 id="job-manage">{t.ctxTitle}</H2>
      <P>{t.ctxP}</P>
      <H3 id="ctx-fields">{t.ctxFieldsTitle}</H3>
      <ParamTable
        rows={[
          { name: "jobName", type: "string", desc: t.fJobName },
          { name: "executionId", type: "string", desc: t.fExecutionId },
          { name: "scheduledAt", type: "Date", desc: t.fScheduledAt },
          { name: "localScheduledAt", type: "Date", desc: t.fLocalScheduledAt },
          { name: "attempt", type: "number", desc: t.fAttempt },
          { name: "idempotencyKey", type: "string", desc: t.fIdempotencyKey },
          { name: "signal", type: "AbortSignal", desc: t.fSignal },
        ]}
      />
      <MultiCodeBlock
        code={{
          ts: `sb.job.handle(
  "process-batch",
  { trigger: { interval: 30_000 } },
  async (ctx) => {
    // Idempotent on ctx.idempotencyKey — the same tick may arrive twice.
    const inserted = await db.query(
      \`INSERT INTO processed (idempotency_key) VALUES ($1)
         ON CONFLICT (idempotency_key) DO NOTHING RETURNING id\`,
      [ctx.idempotencyKey],
    );
    if (inserted.rows.length === 0) return; // already handled this tick
    await processBatch(ctx.localScheduledAt, ctx.signal);
  },
);`,
        }}
      />
      <H3 id="deps-access">{t.depsTitle}</H3>
      <P>{t.depsP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.job.handle(
  "send-reminders",
  {
    trigger: { cron: "0 8 * * *" },
    deps: [
      { rpc: "notifications.SendEmail" },
      { event: "reminders.sent" },
      { workflow: "send-reminder-flow" },
    ],
  },
  async (ctx) => {
    await sb.rpc.call("notifications", "SendEmail", { batch: ctx.executionId });
  },
);`,
        }}
      />
    </div>
  );
}
