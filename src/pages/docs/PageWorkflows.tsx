import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  H2,
  H3,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "SDK Reference",
    title: "Workflows",
    description:
      "Durable, declarative orchestration of RPC calls, events, waits, and child workflows. You describe a graph of steps; the runtime drives execution, persists every step in PostgreSQL, and resumes after restarts.",

    conceptTitle: "How it works",
    conceptP:
      "A workflow is a declarative graph of steps. You register the graph once with sb.workflow.handle(name, def). To run it you call sb.workflow.start(name, input) — the runtime schedules steps, persists each one in PostgreSQL, and retries on failure. The SDK does not run retries or backoff itself; the runtime owns recovery, so a run survives any restart and continues from where it left off.",
    conceptStepCall: "calls a registered RPC handler and waits for the result",
    conceptStepPublish: "publishes a durable event and continues",
    conceptStepWaitEvent:
      "parks the run until a matching event is ingested",
    conceptStepWaitSignal:
      "parks the run until an external sb.workflow.signal() arrives",
    conceptStepSleep: "durable timer — pauses N seconds, survives restarts",
    conceptStepWorkflow: "starts a child workflow and waits for it",
    conceptStepParallel:
      "group whose inner steps all start at once",
    conceptStepSequence: "group whose inner steps run one after another",
    conceptStepLocal: "arbitrary JS run inside the SDK (use sparingly)",
    conceptCallout:
      "Top-level steps run in parallel by default. Order comes only from waitFor: a step waits for the step ids you list before it runs. Position in the array means nothing.",

    handlersTitle: "Define handlers first",
    handlersP:
      "Workflow call / publish steps target existing sb.rpc.handle and sb.event.handle handlers by service + method (or event name). Register those handlers in their owning services before any run starts:",

    workflowStartTitle: "sb.workflow.handle() — register the graph",
    signatureTitle: "Signature",
    handleReturnsP:
      "handle() validates the graph and registers it under name. Registering the same name with a different graph is rejected by the runtime as a contract change. Call it before sb.start().",
    handleDefP: "WorkflowDef — the second argument:",

    stepFieldsTitle: "Step fields",
    stepFieldsP:
      "Every step shares the control fields below. The remaining fields depend on the step type.",
    stepTypesTitle: "Per-type fields",

    outputTitle: "Output chaining",
    outputP:
      "Each step writes its result into the run state under its own id. Downstream steps read it with a JSONPath-lite expression — a string starting with $. Anywhere a step takes input you can pass such an expression instead of a literal.",
    outputPathList:
      "Supported path forms:",
    outputPath1: "the original run input",
    outputPath2: "a field of the charge step's output",
    outputPath3: "array index",
    outputPath4: "map a field over every array element",
    outputLiteral:
      'A plain string that does not start with "$." is a literal. To force a literal that looks like a path, wrap it: { literal: "$.weird" }.',

    exampleTitle: "Order fulfillment workflow",
    exampleP:
      "A four-step graph: reserve stock, charge the card, wait for delivery, then notify. Each step waits for the previous one via waitFor and reads its input from earlier output.",

    parallelTitle: "Parallel steps",
    parallelP:
      "Steps that share a dependency but not each other run at the same time. Here send_welcome and init_billing both start after create_user, and activate waits for both. The dependency edges do all the work; there is no parallel keyword.",

    eventWaitTitle: "wait_event / wait_signal",
    eventWaitP:
      "A wait_event step parks the run until an ingested event matches event (and the optional filter). A wait_signal step parks until an external caller delivers sb.workflow.signal(runId, name, payload). Use timeoutSec on the step to bound the wait — on expiry the run enters compensation.",

    conditionalTitle: "Conditional steps",
    conditionalP:
      "Add a when predicate to run a step only if a condition holds against the current run state. The predicate is a JSONPath-lite expression or a structured form (not / equals / in / and / or). If it evaluates false, the step is skipped.",

    childTitle: "Child workflows",
    childP:
      'A type: "workflow" step starts a named child workflow and parks the parent until the child reaches a terminal status. The runtime sets parentRunId automatically and performs cycle detection. The child run\'s final state becomes the step output, chainable downstream.',

    sleepTitle: "Durable sleep",
    sleepP:
      "A sleep step pauses the run for durationSec seconds. The deadline is stored in PostgreSQL — if the runtime restarts mid-sleep, the run resumes correctly once the deadline passes. Durations here are seconds (durationSec), a user-facing time field.",

    runTitle: "await() / signal() / cancel() / query()",
    runP:
      "Caller-side operations are available after sb.start(). They take the runId returned by start().",
    runStartP:
      "start(name, input, opts?) schedules a run and returns its runId. opts may carry an idempotencyKey to dedupe re-submits and a timeoutSec wall-clock cap.",
    runAwaitP:
      'await(runId) blocks on a server stream until the run is terminal. It resolves with the final state map only when the terminal status is exactly "success"; any other terminal status (failed / cancelled / failed_compensated) rejects.',
    runSignalP:
      "signal(runId, name, payload) delivers a signal to a parked wait_signal step.",
    runQueryP:
      "query(runId) returns a point-in-time snapshot: the run status, the accumulated state, and per-step info (stepId, status, output, lastError, compensatedBy).",
    runReplayP:
      "replay(runId, { fromStepId }) forks a new run from an existing one, reusing its frozen plan and re-executing from the named step (or from the start).",

    cancelTitle: "Cancel a run",
    cancelP:
      "cancel(runId) requests cooperative cancellation. The runtime moves the run to compensating and dispatches each step's compensate action in reverse order. Steps already executing are not interrupted.",

    statusCallout:
      'Run statuses form one vocabulary: pending, running, waiting, success, failed, cancelling, cancelled, compensating, failed_compensated. The terminal success value is the string "success". The full timeline — step statuses, inputs, outputs, timings — is visible in the dashboard.',

    // control field descriptions
    fId: "Unique step id within this workflow (matches ^[a-z0-9_]+$).",
    fWaitFor:
      "Step ids that must complete before this step runs. Empty/absent means it can start immediately.",
    fWhen:
      "Predicate evaluated against run state; if false the step is skipped. String expression or { not | equals | in | and | or }.",
    fCompensate:
      'Reverse action for "call" / "publish" steps, run during compensation (cancel or timeout).',
    fTimeoutSec:
      "Step-level wall-clock timeout in seconds; on expiry the run enters compensation.",
    fRetry:
      "Per-step retry override (maxAttempts, baseDelayMs, factor, maxDelayMs, jitter).",
    fType: "Step kind — selects the per-type fields below.",

    // per-type field descriptions
    tCall: 'service + method + input (+ opts: CallOpts). Does sb.rpc.call.',
    tPublish: "event + input (+ opts: PublishOpts). Does sb.event.publish.",
    tSleep: "durationSec — durable pause in seconds.",
    tWaitEvent:
      "event (name/pattern) + optional filter map. Parks until a matching event is ingested.",
    tWaitSignal: "signal — name awaited via sb.workflow.signal().",
    tWorkflow:
      "workflow (child name) + input (+ opts: WorkflowStartOpts). Starts a child and waits.",
    tParallel: "steps[] (+ optional forEach). All inner steps start at once.",
    tSequence: "steps[] (+ optional forEach). Inner steps run in order.",
    tLocal: "fn(state) — arbitrary JS executed inside the SDK.",

    defInput: "JSON Schema for the run input (validated by the runtime).",
    defSteps: "The step graph.",
    defRetry: "Default retry policy for steps that do not set their own.",
    defMaxParallelism:
      "Max steps the runner dispatches concurrently; 0 = unlimited.",
    defTimeoutSec: "Wall-clock timeout for the whole run, in seconds.",
  },
  ru: {
    badge: "SDK Reference",
    title: "Воркфлоу",
    description:
      "Надёжная декларативная оркестрация RPC-вызовов, событий, ожиданий и дочерних воркфлоу. Вы описываете граф шагов; runtime ведёт выполнение, сохраняет каждый шаг в PostgreSQL и возобновляет работу после перезапусков.",

    conceptTitle: "Как это работает",
    conceptP:
      "Воркфлоу — это декларативный граф шагов. Граф один раз регистрируется через sb.workflow.handle(name, def). Чтобы запустить его, вызовите sb.workflow.start(name, input) — runtime планирует шаги, сохраняет каждый в PostgreSQL и повторяет при сбоях. SDK сам не делает ретраи и backoff; за восстановление отвечает runtime, поэтому запуск переживает любой перезапуск и продолжается с того места, где остановился.",
    conceptStepCall: "вызывает зарегистрированный RPC-обработчик и ждёт результат",
    conceptStepPublish: "публикует надёжное событие и продолжает",
    conceptStepWaitEvent:
      "паркует запуск до прихода подходящего события",
    conceptStepWaitSignal:
      "паркует запуск до внешнего sb.workflow.signal()",
    conceptStepSleep: "надёжный таймер — пауза N секунд, переживает перезапуски",
    conceptStepWorkflow: "запускает дочерний воркфлоу и ждёт его",
    conceptStepParallel:
      "группа, все вложенные шаги которой стартуют одновременно",
    conceptStepSequence: "группа, вложенные шаги которой идут друг за другом",
    conceptStepLocal: "произвольный JS внутри SDK (использовать осторожно)",
    conceptCallout:
      "Шаги верхнего уровня по умолчанию идут параллельно. Порядок задаёт только waitFor: шаг ждёт перечисленные id шагов, прежде чем стартовать. Позиция в массиве ни на что не влияет.",

    handlersTitle: "Сначала определите обработчики",
    handlersP:
      "Шаги call / publish обращаются к существующим обработчикам sb.rpc.handle и sb.event.handle по service + method (или имени события). Зарегистрируйте эти обработчики в их сервисах до старта любого запуска:",

    workflowStartTitle: "sb.workflow.handle() — регистрация графа",
    signatureTitle: "Сигнатура",
    handleReturnsP:
      "handle() валидирует граф и регистрирует его под name. Регистрация того же name с другим графом отвергается runtime как смена контракта. Вызывайте до sb.start().",
    handleDefP: "WorkflowDef — второй аргумент:",

    stepFieldsTitle: "Поля шага",
    stepFieldsP:
      "У каждого шага есть управляющие поля ниже. Остальные поля зависят от типа шага.",
    stepTypesTitle: "Поля по типам",

    outputTitle: "Цепочка вывода",
    outputP:
      "Каждый шаг пишет свой результат в state запуска под своим id. Нижестоящие шаги читают его выражением JSONPath-lite — строкой, начинающейся с $. Везде, где шаг принимает input, можно передать такое выражение вместо литерала.",
    outputPathList: "Поддерживаемые формы пути:",
    outputPath1: "исходный ввод запуска",
    outputPath2: "поле вывода шага charge",
    outputPath3: "индекс массива",
    outputPath4: "взять поле у каждого элемента массива",
    outputLiteral:
      'Обычная строка, не начинающаяся с "$.", — это литерал. Чтобы принудительно сделать литералом строку, похожую на путь, оберните её: { literal: "$.weird" }.',

    exampleTitle: "Воркфлоу выполнения заказа",
    exampleP:
      "Граф из четырёх шагов: зарезервировать товар, списать оплату, дождаться доставки, уведомить. Каждый шаг ждёт предыдущий через waitFor и читает ввод из ранее полученного вывода.",

    parallelTitle: "Параллельные шаги",
    parallelP:
      "Шаги, у которых общая зависимость, но нет зависимости друг от друга, идут одновременно. Здесь send_welcome и init_billing стартуют после create_user, а activate ждёт обоих. Всю работу делают рёбра зависимостей; никакого ключевого слова parallel нет.",

    eventWaitTitle: "wait_event / wait_signal",
    eventWaitP:
      "Шаг wait_event паркует запуск, пока принятое событие не совпадёт с event (и опциональным filter). Шаг wait_signal паркует до внешнего sb.workflow.signal(runId, name, payload). Поле timeoutSec ограничивает ожидание — при истечении запуск уходит в компенсацию.",

    conditionalTitle: "Условные шаги",
    conditionalP:
      "Добавьте предикат when, чтобы выполнить шаг только при истинности условия относительно текущего state. Предикат — это выражение JSONPath-lite или структурная форма (not / equals / in / and / or). Если ложно — шаг пропускается.",

    childTitle: "Дочерние воркфлоу",
    childP:
      'Шаг type: "workflow" запускает именованный дочерний воркфлоу и паркует родителя до достижения дочерним терминального статуса. Runtime сам проставляет parentRunId и выполняет проверку циклов. Финальный state дочернего запуска становится выводом шага и передаётся дальше.',

    sleepTitle: "Надёжная пауза",
    sleepP:
      "Шаг sleep ставит запуск на паузу на durationSec секунд. Дедлайн хранится в PostgreSQL — если runtime перезапустится во время паузы, запуск корректно возобновится после дедлайна. Длительности здесь в секундах (durationSec) — пользовательское поле времени.",

    runTitle: "await() / signal() / cancel() / query()",
    runP:
      "Операции со стороны вызывающего доступны после sb.start(). Они принимают runId, который вернул start().",
    runStartP:
      "start(name, input, opts?) планирует запуск и возвращает его runId. opts может нести idempotencyKey для дедупликации повторных отправок и timeoutSec — лимит по wall-clock.",
    runAwaitP:
      'await(runId) блокируется на серверном стриме до терминального состояния. Резолвится финальным state только при статусе ровно "success"; любой другой терминальный статус (failed / cancelled / failed_compensated) — reject.',
    runSignalP:
      "signal(runId, name, payload) доставляет сигнал запаркованному шагу wait_signal.",
    runQueryP:
      "query(runId) возвращает снимок на момент времени: статус запуска, накопленный state и информацию по шагам (stepId, status, output, lastError, compensatedBy).",
    runReplayP:
      "replay(runId, { fromStepId }) форкует новый запуск из существующего, переиспользуя его зафиксированный план и переисполняя с указанного шага (или с начала).",

    cancelTitle: "Отмена запуска",
    cancelP:
      "cancel(runId) запрашивает кооперативную отмену. Runtime переводит запуск в compensating и выполняет действие compensate каждого шага в обратном порядке. Уже выполняющиеся шаги не прерываются.",

    statusCallout:
      'Статусы запуска образуют единый словарь: pending, running, waiting, success, failed, cancelling, cancelled, compensating, failed_compensated. Терминальное успешное значение — строка "success". Полная временная шкала — статусы шагов, вводы, выводы, тайминги — видна в дашборде.',

    fId: "Уникальный id шага внутри воркфлоу (соответствует ^[a-z0-9_]+$).",
    fWaitFor:
      "Id шагов, которые должны завершиться до этого. Пусто/отсутствует — может стартовать сразу.",
    fWhen:
      "Предикат относительно state; если ложь — шаг пропускается. Строка-выражение или { not | equals | in | and | or }.",
    fCompensate:
      'Обратное действие для шагов "call" / "publish", выполняется при компенсации (отмена или таймаут).',
    fTimeoutSec:
      "Таймаут шага по wall-clock в секундах; при истечении запуск уходит в компенсацию.",
    fRetry:
      "Переопределение ретраев шага (maxAttempts, baseDelayMs, factor, maxDelayMs, jitter).",
    fType: "Тип шага — выбирает поля по типу ниже.",

    tCall: 'service + method + input (+ opts: CallOpts). Делает sb.rpc.call.',
    tPublish: "event + input (+ opts: PublishOpts). Делает sb.event.publish.",
    tSleep: "durationSec — надёжная пауза в секундах.",
    tWaitEvent:
      "event (имя/шаблон) + опциональный filter. Паркует до подходящего события.",
    tWaitSignal: "signal — имя, ожидаемое через sb.workflow.signal().",
    tWorkflow:
      "workflow (имя дочернего) + input (+ opts: WorkflowStartOpts). Запускает дочерний и ждёт.",
    tParallel: "steps[] (+ опц. forEach). Все вложенные шаги стартуют сразу.",
    tSequence: "steps[] (+ опц. forEach). Вложенные шаги идут по порядку.",
    tLocal: "fn(state) — произвольный JS внутри SDK.",

    defInput: "JSON Schema для ввода запуска (валидируется runtime).",
    defSteps: "Граф шагов.",
    defRetry: "Политика ретраев по умолчанию для шагов без своей.",
    defMaxParallelism:
      "Сколько шагов раннер запускает параллельно; 0 = без ограничения.",
    defTimeoutSec: "Таймаут всего запуска по wall-clock, в секундах.",
  },
};

export function PageWorkflows() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      {/* ── Concept ──────────────────────────────────────────────── */}
      <H2 id="concept">{t.conceptTitle}</H2>
      <P>{t.conceptP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>call</Mono> — {t.conceptStepCall}
        </li>
        <li>
          <Mono>publish</Mono> — {t.conceptStepPublish}
        </li>
        <li>
          <Mono>wait_event</Mono> — {t.conceptStepWaitEvent}
        </li>
        <li>
          <Mono>wait_signal</Mono> — {t.conceptStepWaitSignal}
        </li>
        <li>
          <Mono>sleep</Mono> — {t.conceptStepSleep}
        </li>
        <li>
          <Mono>workflow</Mono> — {t.conceptStepWorkflow}
        </li>
        <li>
          <Mono>parallel</Mono> — {t.conceptStepParallel}
        </li>
        <li>
          <Mono>sequence</Mono> — {t.conceptStepSequence}
        </li>
        <li>
          <Mono>local</Mono> — {t.conceptStepLocal}
        </li>
      </ul>
      <Callout type="info">{t.conceptCallout}</Callout>

      {/* ── Handlers ─────────────────────────────────────────────── */}
      <H2 id="handlers">{t.handlersTitle}</H2>
      <P>{t.handlersP}</P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

// inventory service. Credentials come from the constructor, not the environment.
const sb = new ServiceBridge("localhost:14445", serviceKey);

sb.rpc.handle<{ orderId: string }, { reserved: boolean }>(
  "stock.reserve",
  async (payload) => {
    await db.reserve(payload.orderId);
    return { reserved: true };
  },
  { schema: { protoFile: "./inventory.proto" } },
);

// payments service
sb.rpc.handle<{ orderId: string; amount: number }, { txId: string }>(
  "payment.charge",
  async (payload) => {
    const tx = await gateway.charge(payload);
    return { txId: tx.id };
  },
  { schema: { protoFile: "./payments.proto" } },
);

// notifications service reacts to the workflow's final event
sb.event.handle("orders.fulfilled", async (payload) => {
  await sendEmail(payload);
});

await sb.start();`,
        }}
      />

      {/* ── handle() ─────────────────────────────────────────────── */}
      <H2 id="workflow-start">{t.workflowStartTitle}</H2>
      <H3 id="handle-signature">{t.signatureTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle(name: string, def: WorkflowDef, opts?: WorkflowHandlerOpts): void`,
        }}
      />
      <P>{t.handleReturnsP}</P>
      <P>{t.handleDefP}</P>
      <ParamTable
        rows={[
          { name: "input", type: "object (JSON Schema)", desc: t.defInput },
          { name: "steps", type: "Step[]", desc: t.defSteps },
          { name: "retry", type: "Partial<RetryOpts>", desc: t.defRetry },
          {
            name: "maxParallelism",
            type: "number",
            default: "0",
            desc: t.defMaxParallelism,
          },
          { name: "timeoutSec", type: "number", desc: t.defTimeoutSec },
        ]}
      />

      {/* ── Step fields ──────────────────────────────────────────── */}
      <H2 id="step-fields">{t.stepFieldsTitle}</H2>
      <P>{t.stepFieldsP}</P>
      <ParamTable
        rows={[
          { name: "id", type: "string", desc: t.fId },
          { name: "type", type: "string", desc: t.fType },
          { name: "waitFor", type: "string[]", default: "[]", desc: t.fWaitFor },
          { name: "when", type: "Predicate", desc: t.fWhen },
          { name: "compensate", type: "CompensateSpec", desc: t.fCompensate },
          { name: "timeoutSec", type: "number", desc: t.fTimeoutSec },
          { name: "retry", type: "Partial<RetryOpts>", desc: t.fRetry },
        ]}
      />

      <H3 id="step-types">{t.stepTypesTitle}</H3>
      <ParamTable
        rows={[
          { name: '"call"', type: "CallStep", desc: t.tCall },
          { name: '"publish"', type: "PublishStep", desc: t.tPublish },
          { name: '"sleep"', type: "SleepStep", desc: t.tSleep },
          { name: '"wait_event"', type: "WaitEventStep", desc: t.tWaitEvent },
          { name: '"wait_signal"', type: "WaitSignalStep", desc: t.tWaitSignal },
          { name: '"workflow"', type: "WorkflowStep", desc: t.tWorkflow },
          { name: '"parallel"', type: "ParallelStep", desc: t.tParallel },
          { name: '"sequence"', type: "SequenceStep", desc: t.tSequence },
          { name: '"local"', type: "LocalStep", desc: t.tLocal },
        ]}
      />

      {/* ── Output chaining ──────────────────────────────────────── */}
      <H2 id="output-chaining">{t.outputTitle}</H2>
      <P>{t.outputP}</P>
      <P>{t.outputPathList}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>$.input.orderId</Mono> — {t.outputPath1}
        </li>
        <li>
          <Mono>$.charge.txId</Mono> — {t.outputPath2}
        </li>
        <li>
          <Mono>$.items[0]</Mono> — {t.outputPath3}
        </li>
        <li>
          <Mono>$.items[*].sku</Mono> — {t.outputPath4}
        </li>
      </ul>
      <P>{t.outputLiteral}</P>

      {/* ── Example ──────────────────────────────────────────────── */}
      <H2 id="workflow-example">{t.exampleTitle}</H2>
      <P>{t.exampleP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("order.fulfillment", {
  input: { type: "object", properties: { orderId: { type: "string" } } },
  steps: [
    {
      id: "reserve",
      type: "call",
      service: "inventory",
      method: "stock.reserve",
      input: { orderId: "$.input.orderId" },
    },
    {
      id: "charge",
      type: "call",
      service: "payments",
      method: "payment.charge",
      input: { orderId: "$.input.orderId", amount: "$.input.amount" },
      waitFor: ["reserve"],
    },
    {
      id: "wait_delivery",
      type: "wait_event",
      event: "shipping.delivered",
      filter: { orderId: "$.input.orderId" },
      waitFor: ["charge"],
      timeoutSec: 86_400,
    },
    {
      id: "notify",
      type: "publish",
      event: "orders.fulfilled",
      input: { orderId: "$.input.orderId", txId: "$.charge.txId" },
      waitFor: ["wait_delivery"],
    },
  ],
});`,
        }}
      />

      {/* ── Parallel steps ───────────────────────────────────────── */}
      <H2 id="parallel-steps">{t.parallelTitle}</H2>
      <P>{t.parallelP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("onboarding", {
  steps: [
    {
      id: "create_user",
      type: "call",
      service: "users",
      method: "user.create",
      input: { email: "$.input.email" },
    },
    // These two run in parallel after create_user:
    {
      id: "send_welcome",
      type: "publish",
      event: "emails.welcome",
      input: { userId: "$.create_user.id" },
      waitFor: ["create_user"],
    },
    {
      id: "init_billing",
      type: "call",
      service: "billing",
      method: "subscription.init",
      input: { userId: "$.create_user.id" },
      waitFor: ["create_user"],
    },
    // This waits for BOTH:
    {
      id: "activate",
      type: "call",
      service: "users",
      method: "user.activate",
      input: { userId: "$.create_user.id" },
      waitFor: ["send_welcome", "init_billing"],
    },
  ],
});`,
        }}
      />

      {/* ── wait_event / wait_signal ─────────────────────────────── */}
      <H2 id="event-wait">{t.eventWaitTitle}</H2>
      <P>{t.eventWaitP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("manual.approval", {
  steps: [
    {
      id: "submit",
      type: "call",
      service: "expenses",
      method: "report.submit",
      input: { amount: "$.input.amount" },
    },
    // Park until an operator delivers sb.workflow.signal(runId, "approved", ...)
    {
      id: "wait_approval",
      type: "wait_signal",
      signal: "approved",
      waitFor: ["submit"],
      timeoutSec: 3_600,
    },
    {
      id: "pay",
      type: "call",
      service: "expenses",
      method: "report.pay",
      input: { reportId: "$.submit.reportId" },
      waitFor: ["wait_approval"],
    },
  ],
});`,
        }}
      />

      {/* ── Conditional steps ────────────────────────────────────── */}
      <H2 id="conditional-if">{t.conditionalTitle}</H2>
      <P>{t.conditionalP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("order.fulfillment", {
  steps: [
    {
      id: "reserve",
      type: "call",
      service: "inventory",
      method: "stock.reserve",
      input: { orderId: "$.input.orderId" },
    },
    // Only notify when reserve actually reserved stock:
    {
      id: "notify",
      type: "publish",
      event: "orders.confirmed",
      input: { orderId: "$.input.orderId" },
      waitFor: ["reserve"],
      when: { equals: ["$.reserve.reserved", true] },
    },
    // Skip premium shipping unless the order qualifies:
    {
      id: "express_ship",
      type: "call",
      service: "shipping",
      method: "shipment.express",
      input: { orderId: "$.input.orderId" },
      waitFor: ["notify"],
      when: "$.input.priority",
    },
  ],
});`,
        }}
      />

      {/* ── Child workflows ──────────────────────────────────────── */}
      <H2 id="child-workflow">{t.childTitle}</H2>
      <P>{t.childP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("order.post_purchase", {
  steps: [
    {
      id: "fulfillment",
      type: "workflow",
      workflow: "order.fulfillment",
      input: { orderId: "$.input.orderId" },
    },
    // Runs after the entire child workflow completes:
    {
      id: "analytics",
      type: "call",
      service: "analytics",
      method: "usage.record",
      input: { orderId: "$.input.orderId" },
      waitFor: ["fulfillment"],
    },
  ],
});`,
        }}
      />

      {/* ── Durable sleep ────────────────────────────────────────── */}
      <H2 id="sleep-step">{t.sleepTitle}</H2>
      <P>{t.sleepP}</P>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle("trial.expiry", {
  steps: [
    {
      id: "remind",
      type: "call",
      service: "emails",
      method: "send.trial_reminder",
      input: { userId: "$.input.userId" },
    },
    // 7 days, durable across restarts:
    {
      id: "wait_7d",
      type: "sleep",
      durationSec: 604_800,
      waitFor: ["remind"],
    },
    {
      id: "expire",
      type: "call",
      service: "billing",
      method: "subscription.expire_trial",
      input: { userId: "$.input.userId" },
      waitFor: ["wait_7d"],
    },
  ],
});`,
        }}
      />

      {/* ── Caller-side ops ──────────────────────────────────────── */}
      <H2 id="run-workflow">{t.runTitle}</H2>
      <P>{t.runP}</P>

      <H3 id="run-start">
        <Mono>start()</Mono>
      </H3>
      <P>{t.runStartP}</P>
      <MultiCodeBlock
        code={{
          ts: `const { runId } = await sb.workflow.start(
  "order.fulfillment",
  { orderId: "o_123", amount: 4999 },
  { idempotencyKey: "o_123", timeoutSec: 3_600 },
);`,
        }}
      />

      <H3 id="run-await">
        <Mono>await()</Mono> / <Mono>query()</Mono> / <Mono>signal()</Mono>
      </H3>
      <P>{t.runAwaitP}</P>
      <MultiCodeBlock
        code={{
          ts: `// Block until terminal; resolves only on "success"
const finalState = await sb.workflow.await(runId);

// Point-in-time snapshot
const snap = await sb.workflow.query(runId);
console.log(snap.status); // e.g. "running" | "waiting" | "success"
for (const step of snap.steps) {
  console.log(step.stepId, step.status, step.output);
}

// Deliver a signal to a parked wait_signal step
await sb.workflow.signal(runId, "approved", { by: "ops@acme.com" });`,
        }}
      />
      <P>{t.runSignalP}</P>
      <P>{t.runQueryP}</P>
      <P>{t.runReplayP}</P>

      {/* ── Cancel ───────────────────────────────────────────────── */}
      <H2 id="cancel">{t.cancelTitle}</H2>
      <P>{t.cancelP}</P>
      <MultiCodeBlock
        code={{
          ts: `await sb.workflow.cancel(runId);

// Fork a fresh run from a failed one, re-executing from a step:
const { runId: replayId } = await sb.workflow.replay(runId, {
  fromStepId: "charge",
});`,
        }}
      />

      <Callout type="info">{t.statusCallout}</Callout>
    </div>
  );
}
