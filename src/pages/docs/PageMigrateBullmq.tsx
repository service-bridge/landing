import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Migration guide",
    title: "Migrating from BullMQ / Bull",
    description:
      "BullMQ (and Bull before it) runs queues and workers on Redis: a Queue producer, a Worker consumer, repeat schedulers, delayed jobs, attempts/backoff, and a failed set you poll or subscribe to. ServiceBridge Jobs replaces all of it with one call — sb.job.handle() — registered on the SDK side and triggered by the runtime from PostgreSQL. No Redis, no separate worker process, no queue library to configure.",

    overviewTitle: "Model differences",
    overviewP1:
      "BullMQ splits a job into two objects: a Queue you push work onto (queue.add) and one or more Worker processes that pull from it. The schedule (repeat), retry policy, and concurrency are all Worker/Queue options, and Redis is the source of truth for queue state.",
    overviewP2:
      "ServiceBridge collapses this into a single registration: sb.job.handle(name, opts, fn). There is no separate \"add a job\" call for scheduled work — the trigger (cron / delayed / interval) is part of the job definition itself, stored in Postgres, and the runtime is the only thing that decides when a tick fires. Your service just runs the handler when the runtime calls it.",
    overviewCallout:
      "Jobs are runtime-triggered, self-only tasks — nothing calls a job handler except the scheduler. If you need something another service can invoke on demand, that's an RPC handler or an event subscriber, not a job.",

    mappingTitle: "BullMQ → ServiceBridge Jobs",
    mappingRows: [
      { name: "new Queue(name) + new Worker(name, fn)", type: "BullMQ", desc: "sb.job.handle(name, opts, fn) — one registration, no separate producer/consumer objects." },
      { name: "repeat: { pattern: cron }", type: "BullMQ", desc: "trigger: { cron: \"...\", tz? }." },
      { name: "delay: ms (on queue.add)", type: "BullMQ", desc: "trigger: { delayed: { at } } — at accepts a Date, unix-ms number, or ISO string." },
      { name: "repeat: { every: ms }", type: "BullMQ", desc: "trigger: { interval: ms } — minimum 100ms, runtime-configurable." },
      { name: "attempts + backoff: { type, delay }", type: "BullMQ", desc: "maxAttempts + retry: { initialMs, maxMs, multiplier, jitter } (default exponential 1s → 600s, ×2, ±25% jitter)." },
      { name: "Worker({ concurrency })", type: "BullMQ", desc: "overlap: \"allow\" + maxConcurrent on the job def — see Concurrency below, the model is not the same." },
      { name: "queue.getFailed() / 'failed' event", type: "BullMQ", desc: "jobs_dlq Postgres table (execution_id + last_error). No SDK method or dashboard view for jobs — see Retries & DLQ." },
      { name: "opts.priority", type: "BullMQ", desc: "Not supported. No priority field on JobOpts — see What's missing." },
      { name: "opts.jobId (dedup key)", type: "BullMQ", desc: "ctx.idempotencyKey — stable per (job def, scheduled_at), not settable by the caller since jobs have no caller." },
      { name: "Redis", type: "Infra", desc: "PostgreSQL — job_definitions / job_schedules / job_executions / jobs_dlq tables." },
    ],

    beforeAfterTitle: "Before / after",
    beforeAfterP:
      "A daily report job: cron schedule, 5 retries, run in Moscow time.",
    beforeCode: `// before: BullMQ
import { Queue, Worker } from "bullmq";

const connection = { host: "localhost", port: 6379 };
const queue = new Queue("daily-report", { connection });

await queue.add("run", {}, {
  repeat: { pattern: "0 9 * * *", tz: "Europe/Moscow" },
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
});

new Worker("daily-report", async (job) => {
  await generateReport(job.data.date);
}, { connection, concurrency: 1 });`,
    afterCode: `// after: ServiceBridge Jobs
import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(url, serviceKey);

sb.job.handle(
  "daily-report",
  {
    trigger: { cron: "0 9 * * *", tz: "Europe/Moscow" },
    maxAttempts: 5,
  },
  async (ctx) => {
    await generateReport(ctx.localScheduledAt);
  },
);

await sb.start();`,
    beforeAfterCallout:
      "No Redis connection object, no separate Worker process to deploy, no queue.add() call to trigger the schedule — the trigger lives in the job definition and the runtime is the only caller.",

    delayedTitle: "Delayed (one-shot) jobs",
    delayedBeforeCode: `// before: BullMQ
await queue.add("send-reminder", { userId }, { delay: 24 * 3600_000 });`,
    delayedAfterCode: `// after: ServiceBridge Jobs
sb.job.handle(
  "send-reminder",
  { trigger: { delayed: { at: Date.now() + 24 * 3600_000 } } },
  async (ctx) => { await sendReminder(userId); },
);`,
    delayedNote:
      "BullMQ's queue.add() both defines and enqueues the job in one call, per invocation, with arbitrary job data. ServiceBridge separates the two: sb.job.handle() is a one-time registration (call it once, before sb.start()); there is no per-run \"enqueue with custom data\" call. A delayed job fires once at the given moment and reads what it needs from ctx or your own storage, not from an ad-hoc payload — see the callout in Model differences.",

    concurrencyTitle: "Concurrency & priorities",
    concurrencyP1:
      "BullMQ's Worker({ concurrency: N }) lets one worker process pull and run up to N jobs from the shared Redis queue at once — concurrency is a property of the consumer process pulling from an unbounded backlog.",
    concurrencyP2:
      "ServiceBridge ties concurrency to the job definition, not to a process. Each tick (cron fire, delayed fire, interval fire) is one execution, dispatched to exactly one live replica by round-robin. Running more replicas of your service gives horizontal fan-out across different jobs and different ticks — it does not make one job run N-at-a-time by itself.",
    concurrencyOverlapTitle:
      "For the same job definition to run more than one execution concurrently — the overlap policy controls it:",
    concurrencyOverlapCode: `sb.job.handle(
  "heavy-etl",
  {
    trigger: { interval: 60_000 },
    overlap: "allow",
    maxConcurrent: 5, // up to 5 concurrent runs of THIS job
  },
  async (ctx) => { /* ... */ },
);`,
    concurrencyNote:
      "Default overlap is \"skip\": if the previous tick is still running when the next one fires, the new tick is dropped. There's no BullMQ-style unbounded backlog of pending jobs to drain — a job's queue depth is bounded by its own trigger cadence, not by how fast producers push work.",

    prioritiesNote:
      "BullMQ job priorities (opts.priority, lower runs first) have no equivalent. JobOpts has no priority field — every job definition is scheduled independently by its own trigger; there's no shared backlog to order.",

    retriesTitle: "Retries & DLQ",
    retriesP1:
      "maxAttempts and retry replace attempts and backoff. Default retry policy is exponential, 1s → 600s, multiplier 2, ±25% jitter — tune per job with retry: { initialMs, maxMs, multiplier, jitter }.",
    retriesCode: `sb.job.handle(
  "charge-invoices",
  {
    trigger: { cron: "0 6 * * *" },
    maxAttempts: 5,
    retry: { initialMs: 1000, maxMs: 60_000, multiplier: 2, jitter: 0.25 },
  },
  async (ctx) => {
    if (badInput) {
      const err = new Error("bad input");
      (err as any).retryable = false; // straight to jobs_dlq, no retry
      throw err;
    }
    await chargeInvoices(ctx.localScheduledAt);
  },
);`,
    retriesCallout:
      "Handlers must be idempotent by ctx.idempotencyKey, not by ctx.attempt. Delivery is at-least-once: the same tick can invoke the handler more than once after a lease expiry or an SDK crash. BullMQ's job.data is fixed per enqueue; ServiceBridge has no enqueue-time payload, so idempotency keys off the schedule slot, not caller-supplied data.",
    retriesDlqP:
      "Exhausted retries land a row in the jobs_dlq Postgres table (execution_id + last_error) — this is the ServiceBridge equivalent of BullMQ's failed set. Unlike Durable Events, which have a dashboard DLQ view with one-click replay, jobs_dlq in the current version has no SDK method and no dashboard replay button — inspect it via Postgres directly, and re-trigger by waiting for the next natural tick (there is no manual re-run API yet).",

    notSupportedTitle: "What's missing",
    notSupportedItems: [
      "Job priorities. No priority field on JobOpts — nothing orders execution across job definitions the way BullMQ's opts.priority orders a shared queue.",
      "Per-job rate limiting. BullMQ's limiter: { max, duration } throttles job execution. ServiceBridge only rate-limits job registration (jobs.register_rate_per_min, default 10/min) — there is no execution-throughput limiter.",
      "Dashboard/SDK replay for failed jobs. jobs_dlq is a plain table with no admin RPC or UI action (Durable Events DLQ has both — see the RabbitMQ migration guide).",
      "Manual trigger, pause/resume, dynamic per-job schedule updates. All explicitly out of scope in the current version — updating a schedule means re-registering the whole job set on deploy.",
      "Arbitrary per-enqueue payload. BullMQ's queue.add(name, data) carries custom data per call; a ServiceBridge job has no caller-supplied payload — the handler reads ctx (schedule time, attempt, idempotency key) and your own storage.",
      "Redis. Not a downgrade to replace, just gone — PostgreSQL is the only datastore, already required for everything else ServiceBridge does.",
    ],
  },
  ru: {
    badge: "Гайд по миграции",
    title: "Миграция с BullMQ / Bull",
    description:
      "BullMQ (и Bull до него) держит очереди и воркеры на Redis: Queue-продюсер, один или несколько Worker-консьюмеров, repeat-шедулеры, delayed-джобы, attempts/backoff и failed-набор, который нужно опрашивать или слушать. ServiceBridge Jobs заменяет всё это одним вызовом — sb.job.handle() — регистрируемым на стороне SDK и триггерящимся рантаймом из PostgreSQL. Без Redis, без отдельного воркер-процесса, без библиотеки очередей для настройки.",

    overviewTitle: "Отличия модели",
    overviewP1:
      "BullMQ разбивает job на два объекта: Queue, в которую пушится работа (queue.add), и один или несколько Worker-процессов, которые из неё тянут. Расписание (repeat), retry-политика и concurrency — все это опции Worker/Queue, а Redis — источник истины по состоянию очереди.",
    overviewP2:
      "ServiceBridge схлопывает это в одну регистрацию: sb.job.handle(name, opts, fn). Отдельного вызова «добавить job» для запланированной работы нет — триггер (cron / delayed / interval) — часть самого определения job, хранится в Postgres, и только рантайм решает, когда сработает тик. Ваш сервис просто выполняет handler, когда рантайм его вызывает.",
    overviewCallout:
      "Jobs — это runtime-triggered, self-only задачи: ничто, кроме планировщика, не вызывает handler job. Если нужно что-то, что другой сервис может вызвать по требованию — это RPC-handler или подписчик на событие, а не job.",

    mappingTitle: "BullMQ → ServiceBridge Jobs",
    mappingRows: [
      { name: "new Queue(name) + new Worker(name, fn)", type: "BullMQ", desc: "sb.job.handle(name, opts, fn) — одна регистрация, без отдельных объектов producer/consumer." },
      { name: "repeat: { pattern: cron }", type: "BullMQ", desc: "trigger: { cron: \"...\", tz? }." },
      { name: "delay: ms (в queue.add)", type: "BullMQ", desc: "trigger: { delayed: { at } } — at принимает Date, unix-ms число или ISO-строку." },
      { name: "repeat: { every: ms }", type: "BullMQ", desc: "trigger: { interval: ms } — минимум 100мс, настраивается рантаймом." },
      { name: "attempts + backoff: { type, delay }", type: "BullMQ", desc: "maxAttempts + retry: { initialMs, maxMs, multiplier, jitter } (default exponential 1с → 600с, ×2, jitter ±25%)." },
      { name: "Worker({ concurrency })", type: "BullMQ", desc: "overlap: \"allow\" + maxConcurrent на определении job — см. «Конкурентность» ниже, модель другая." },
      { name: "queue.getFailed() / событие 'failed'", type: "BullMQ", desc: "Таблица jobs_dlq в Postgres (execution_id + last_error). Нет метода SDK или дашборда для jobs — см. «Повторы и DLQ»." },
      { name: "opts.priority", type: "BullMQ", desc: "Не поддерживается. У JobOpts нет поля priority — см. «Чего нет»." },
      { name: "opts.jobId (ключ дедупа)", type: "BullMQ", desc: "ctx.idempotencyKey — стабилен для (job def, scheduled_at), вызывающая сторона его не задаёт, потому что у jobs нет вызывающей стороны." },
      { name: "Redis", type: "Инфра", desc: "PostgreSQL — таблицы job_definitions / job_schedules / job_executions / jobs_dlq." },
    ],

    beforeAfterTitle: "До / после",
    beforeAfterP:
      "Ежедневный отчёт: cron-расписание, 5 повторов, время по Москве.",
    beforeCode: `// до: BullMQ
import { Queue, Worker } from "bullmq";

const connection = { host: "localhost", port: 6379 };
const queue = new Queue("daily-report", { connection });

await queue.add("run", {}, {
  repeat: { pattern: "0 9 * * *", tz: "Europe/Moscow" },
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
});

new Worker("daily-report", async (job) => {
  await generateReport(job.data.date);
}, { connection, concurrency: 1 });`,
    afterCode: `// после: ServiceBridge Jobs
import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge(url, serviceKey);

sb.job.handle(
  "daily-report",
  {
    trigger: { cron: "0 9 * * *", tz: "Europe/Moscow" },
    maxAttempts: 5,
  },
  async (ctx) => {
    await generateReport(ctx.localScheduledAt);
  },
);

await sb.start();`,
    beforeAfterCallout:
      "Нет объекта подключения к Redis, нет отдельного Worker-процесса для деплоя, нет вызова queue.add() для запуска расписания — триггер живёт в определении job, единственный, кто его вызывает — рантайм.",

    delayedTitle: "Delayed (одноразовые) jobs",
    delayedBeforeCode: `// до: BullMQ
await queue.add("send-reminder", { userId }, { delay: 24 * 3600_000 });`,
    delayedAfterCode: `// после: ServiceBridge Jobs
sb.job.handle(
  "send-reminder",
  { trigger: { delayed: { at: Date.now() + 24 * 3600_000 } } },
  async (ctx) => { await sendReminder(userId); },
);`,
    delayedNote:
      "queue.add() в BullMQ одним вызовом одновременно определяет и ставит job в очередь, с произвольными данными job на каждый вызов. ServiceBridge разделяет это: sb.job.handle() — одноразовая регистрация (вызывается один раз, до sb.start()); отдельного вызова «поставить в очередь с кастомными данными» на каждый запуск нет. Delayed job срабатывает один раз в заданный момент и читает нужное из ctx или своего хранилища, а не из ad-hoc payload — см. коллаут в «Отличиях модели».",

    concurrencyTitle: "Конкурентность и приоритеты",
    concurrencyP1:
      "Worker({ concurrency: N }) в BullMQ позволяет одному воркер-процессу тянуть и выполнять до N job'ов из общей Redis-очереди одновременно — concurrency здесь свойство процесса-консьюмера, тянущего из неограниченного бэклога.",
    concurrencyP2:
      "ServiceBridge привязывает concurrency к определению job, а не к процессу. Каждый тик (cron, delayed, interval) — одна execution, диспатчится ровно одной живой реплике по round-robin. Больше реплик сервиса даёт горизонтальный fan-out по разным job'ам и разным тикам — это само по себе не заставляет один job выполняться N раз одновременно.",
    concurrencyOverlapTitle:
      "Чтобы одно определение job выполняло больше одной execution одновременно — этим управляет overlap policy:",
    concurrencyOverlapCode: `sb.job.handle(
  "heavy-etl",
  {
    trigger: { interval: 60_000 },
    overlap: "allow",
    maxConcurrent: 5, // до 5 параллельных запусков ЭТОГО job
  },
  async (ctx) => { /* ... */ },
);`,
    concurrencyNote:
      "Дефолтный overlap — \"skip\": если предыдущий тик ещё бежит, когда наступает следующий, новый тик пропускается. Нет BullMQ-style неограниченного бэклога pending-job'ов для дренирования — глубина очереди job'а ограничена его собственным триггером, а не скоростью продюсеров.",

    prioritiesNote:
      "Приоритетам job в BullMQ (opts.priority, меньше — выполняется раньше) эквивалента нет. У JobOpts нет поля priority — каждое определение job планируется независимо своим триггером, общего бэклога для упорядочивания нет.",

    retriesTitle: "Повторы и DLQ",
    retriesP1:
      "maxAttempts и retry заменяют attempts и backoff. Дефолтная retry-политика — exponential, 1с → 600с, множитель 2, jitter ±25% — настраивается per-job через retry: { initialMs, maxMs, multiplier, jitter }.",
    retriesCode: `sb.job.handle(
  "charge-invoices",
  {
    trigger: { cron: "0 6 * * *" },
    maxAttempts: 5,
    retry: { initialMs: 1000, maxMs: 60_000, multiplier: 2, jitter: 0.25 },
  },
  async (ctx) => {
    if (badInput) {
      const err = new Error("bad input");
      (err as any).retryable = false; // сразу в jobs_dlq, без retry
      throw err;
    }
    await chargeInvoices(ctx.localScheduledAt);
  },
);`,
    retriesCallout:
      "Handler должен быть идемпотентен по ctx.idempotencyKey, не по ctx.attempt. Доставка at-least-once: один и тот же тик может вызвать handler больше одного раза после истечения lease или краша SDK. job.data в BullMQ фиксирован на момент enqueue; в ServiceBridge нет payload на момент enqueue, поэтому идемпотентность привязана к слоту расписания, а не к данным вызывающей стороны.",
    retriesDlqP:
      "Исчерпанные повторы кладут строку в таблицу jobs_dlq в Postgres (execution_id + last_error) — это эквивалент failed-набора BullMQ. В отличие от Durable Events, у которых есть дашборд DLQ с replay в один клик, jobs_dlq в текущей версии не имеет ни метода SDK, ни кнопки replay в дашборде — смотрите её напрямую через Postgres, а повторный запуск — только дождавшись следующего естественного тика (ручного API повторного запуска пока нет).",

    notSupportedTitle: "Чего нет",
    notSupportedItems: [
      "Приоритеты job. У JobOpts нет поля priority — ничто не упорядочивает выполнение между определениями job так, как opts.priority в BullMQ упорядочивает общую очередь.",
      "Rate limiting на job. limiter: { max, duration } в BullMQ троттлит выполнение job. ServiceBridge лимитирует только регистрацию job (jobs.register_rate_per_min, по умолчанию 10/мин) — лимитера пропускной способности выполнения нет.",
      "Replay через дашборд/SDK для упавших job. jobs_dlq — обычная таблица без admin RPC или UI-действия (у DLQ Durable Events есть оба — см. гайд по миграции с RabbitMQ).",
      "Ручной триггер, pause/resume, динамическое обновление расписания отдельного job. Всё это явно вне охвата текущей версии — обновление расписания означает передеплой всего набора job с их регистрацией заново.",
      "Произвольный payload на enqueue. queue.add(name, data) в BullMQ несёт кастомные данные на каждый вызов; у job в ServiceBridge нет payload от вызывающей стороны — handler читает ctx (время расписания, попытка, ключ идемпотентности) и своё хранилище.",
      "Redis. Не замена с потерей функциональности, а просто отсутствует — единственное хранилище данных — PostgreSQL, уже обязательный для всего остального в ServiceBridge.",
    ],
  },
};

export function PageMigrateBullmq() {
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

      <H3 id="delayed">{t.delayedTitle}</H3>
      <MultiCodeBlock code={{ ts: t.delayedBeforeCode }} />
      <MultiCodeBlock code={{ ts: t.delayedAfterCode }} />
      <P>{t.delayedNote}</P>

      <H2 id="concurrency">{t.concurrencyTitle}</H2>
      <P>{t.concurrencyP1}</P>
      <P>{t.concurrencyP2}</P>
      <P>{t.concurrencyOverlapTitle}</P>
      <MultiCodeBlock code={{ ts: t.concurrencyOverlapCode }} />
      <P>{t.concurrencyNote}</P>
      <Callout type="warning">{t.prioritiesNote}</Callout>

      <H2 id="retries-dlq">{t.retriesTitle}</H2>
      <P>{t.retriesP1}</P>
      <MultiCodeBlock code={{ ts: t.retriesCode }} />
      <Callout type="warning">{t.retriesCallout}</Callout>
      <P>{t.retriesDlqP}</P>

      <H2 id="not-supported">{t.notSupportedTitle}</H2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.notSupportedItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <P>
        <Mono>jobs_dlq</Mono> · <Mono>overlap</Mono> · <Mono>maxConcurrent</Mono>
      </P>
    </div>
  );
}
