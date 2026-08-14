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
      "A workflow is a declarative graph of steps. You register the graph once by name, then start a run with an input — the runtime schedules steps, persists each one in PostgreSQL, and retries on failure. The SDK does not run retries or backoff itself; the runtime owns recovery, so a run survives any restart and continues from where it left off.",
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
    conceptStepLocal: "a function run in the declaring process (use sparingly)",
    conceptCallout:
      "Top-level steps run in parallel by default. Order comes only from waitFor: a step waits for the step ids you list before it runs. Position in the array means nothing.",

    handlersTitle: "Define handlers first",
    handlersP:
      "Call and publish steps target existing RPC and event handlers by service + method (or event name). Register those handlers in their owning services before any run starts:",

    workflowStartTitle: "sb.workflow.handle() — register the graph",
    signatureTitle: "Signature",
    handleReturnsP:
      "Registration validates the graph and freezes it under that name; an invalid graph is refused locally, before anything reaches the runtime. Registering the same name with a different graph is rejected by the runtime as a contract change. Declare it before the client goes online.",
    handleDefP: "WorkflowDef — the second argument:",

    stepFieldsTitle: "Step fields",
    stepFieldsP:
      "Every step shares the control fields below. The remaining fields depend on the step type.",
    stepTypesTitle: "Per-type fields",

    outputTitle: "Output chaining",
    outputP:
      "Each step writes its result into the run state under its own id. Downstream steps read it with a JSONPath-lite expression — a string starting with $. in Node, a wf.Path in Go. Anywhere a step takes input you can pass such an expression instead of a literal, at any depth inside the value.",
    outputPathList:
      "Supported path forms:",
    outputPath1: "the original run input",
    outputPath2: "a field of the charge step's output",
    outputPath3: "array index",
    outputPath4: "map a field over every array element",
    outputLiteral:
      'In Node a plain string that does not start with "$." is a literal, and a literal that looks like a path is wrapped: { literal: "$.weird" }. Go keeps the two apart by type instead — wf.Path reads from run state, wf.Name is written at declaration — so nothing needs escaping.',

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
      "A child-workflow step starts a named workflow and parks the parent until the child reaches a terminal status. The runtime sets parentRunId automatically and performs cycle detection. The child run's final state becomes the step output, chainable downstream.",

    sleepTitle: "Durable sleep",
    sleepP:
      "A sleep step pauses the run for durationSec seconds. The deadline is stored in PostgreSQL — if the runtime restarts mid-sleep, the run resumes correctly once the deadline passes. Durations here are seconds (durationSec), a user-facing time field.",

    runTitle: "await() / signal() / cancel() / query()",
    runP:
      "Caller-side operations are available once the client is online. They take the run id returned when the run was started.",
    runStartP:
      "Starting a run schedules it and returns its run id. Options may carry an idempotency key, which makes a re-submit return the existing run, and a wall-clock timeoutSec cap.",
    runAwaitP:
      'Awaiting a run blocks on a server stream until the run is terminal. It hands back the final state map only when the terminal status is exactly "success"; any other terminal status (failed / cancelled / failed_compensated) fails instead — a rejected promise in Node, CodeTerminal in Go. There is no SDK-side timeout on the wait.',
    runSignalP:
      "Signalling a run delivers a named payload to a step parked on a matching wait_signal.",
    runQueryP:
      "Querying a run returns a point-in-time snapshot: the run status, the accumulated state, and per-step info (stepId, status, output, lastError, compensatedBy).",
    runReplayP:
      "Replaying forks a new run from an existing one, reusing its frozen plan and re-executing from the named step — or from the beginning when no step is named.",

    cancelTitle: "Cancel a run",
    cancelP:
      "Cancelling requests cooperative cancellation. The runtime moves the run to compensating and dispatches each step's compensate action in reverse order. Steps already executing are not interrupted.",

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
    tLocal: "a function of run state executed in the declaring process.",

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
      "Воркфлоу — это декларативный граф шагов. Граф один раз регистрируется по имени, затем вы запускаете прогон с входными данными — runtime планирует шаги, сохраняет каждый в PostgreSQL и повторяет при сбоях. SDK сам не делает ретраи и backoff; за восстановление отвечает runtime, поэтому запуск переживает любой перезапуск и продолжается с того места, где остановился.",
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
    conceptStepLocal: "функция, выполняемая в объявляющем процессе (использовать осторожно)",
    conceptCallout:
      "Шаги верхнего уровня по умолчанию идут параллельно. Порядок задаёт только waitFor: шаг ждёт перечисленные id шагов, прежде чем стартовать. Позиция в массиве ни на что не влияет.",

    handlersTitle: "Сначала определите обработчики",
    handlersP:
      "Шаги call / publish обращаются к существующим RPC- и event-обработчикам по service + method (или имени события). Зарегистрируйте эти обработчики в их сервисах до старта любого запуска:",

    workflowStartTitle: "sb.workflow.handle() — регистрация графа",
    signatureTitle: "Сигнатура",
    handleReturnsP:
      "Регистрация валидирует граф и фиксирует его под этим именем; невалидный граф отвергается локально, до того как что-то уйдёт в runtime. Регистрация того же имени с другим графом отвергается runtime как смена контракта. Объявляйте до подъёма клиента.",
    handleDefP: "WorkflowDef — второй аргумент:",

    stepFieldsTitle: "Поля шага",
    stepFieldsP:
      "У каждого шага есть управляющие поля ниже. Остальные поля зависят от типа шага.",
    stepTypesTitle: "Поля по типам",

    outputTitle: "Цепочка вывода",
    outputP:
      "Каждый шаг пишет свой результат в state запуска под своим id. Нижестоящие шаги читают его выражением JSONPath-lite — строкой, начинающейся с $., в Node и значением wf.Path в Go. Везде, где шаг принимает input, можно передать такое выражение вместо литерала, на любой глубине значения.",
    outputPathList: "Поддерживаемые формы пути:",
    outputPath1: "исходный ввод запуска",
    outputPath2: "поле вывода шага charge",
    outputPath3: "индекс массива",
    outputPath4: "взять поле у каждого элемента массива",
    outputLiteral:
      'В Node обычная строка, не начинающаяся с "$.", — это литерал, а похожую на путь строку оборачивают: { literal: "$.weird" }. В Go эти два случая разведены типами — wf.Path читает из state, wf.Name пишется при объявлении — поэтому экранировать нечего.',

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
      "Шаг дочернего воркфлоу запускает именованный воркфлоу и паркует родителя до достижения дочерним терминального статуса. Runtime сам проставляет parentRunId и выполняет проверку циклов. Финальный state дочернего запуска становится выводом шага и передаётся дальше.",

    sleepTitle: "Надёжная пауза",
    sleepP:
      "Шаг sleep ставит запуск на паузу на durationSec секунд. Дедлайн хранится в PostgreSQL — если runtime перезапустится во время паузы, запуск корректно возобновится после дедлайна. Длительности здесь в секундах (durationSec) — пользовательское поле времени.",

    runTitle: "await() / signal() / cancel() / query()",
    runP:
      "Операции со стороны вызывающего доступны после подъёма клиента. Они принимают id запуска, полученный при его старте.",
    runStartP:
      "Старт планирует запуск и возвращает его id. Опции могут нести ключ идемпотентности — тогда повторная отправка вернёт уже существующий запуск — и timeoutSec как лимит по wall-clock.",
    runAwaitP:
      'Ожидание запуска блокируется на серверном стриме до терминального состояния. Финальный state отдаётся только при статусе ровно "success"; любой другой терминальный статус (failed / cancelled / failed_compensated) — ошибка: reject промиса в Node и CodeTerminal в Go. Собственного таймаута на ожидание в SDK нет.',
    runSignalP:
      "Сигнал доставляет именованный payload шагу, запаркованному на соответствующем wait_signal.",
    runQueryP:
      "Запрос состояния возвращает снимок на момент времени: статус запуска, накопленный state и информацию по шагам (stepId, status, output, lastError, compensatedBy).",
    runReplayP:
      "Replay форкует новый запуск из существующего, переиспользуя его зафиксированный план и переисполняя с указанного шага — или с начала, если шаг не назван.",

    cancelTitle: "Отмена запуска",
    cancelP:
      "Отмена запрашивает кооперативную остановку. Runtime переводит запуск в compensating и выполняет действие compensate каждого шага в обратном порядке. Уже выполняющиеся шаги не прерываются.",

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
    tLocal: "функция от state запуска, выполняемая в объявляющем процессе.",

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
          go: `package main

import (
	"context"
	"log"
	"os"

	"example.com/orders/inventorypb"
	"example.com/orders/orderpb"
	"example.com/orders/paymentpb"
	sb "github.com/service-bridge/sdk/go"
)

func main() {
	// inventory service. Credentials are arguments, not environment lookups.
	c, err := sb.New("localhost:14445", os.Getenv("SERVICEBRIDGE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	err = sb.Handle(c, "stock.reserve",
		func(ctx context.Context, req *inventorypb.ReserveRequest) (*inventorypb.ReserveReply, error) {
			reserved, err := reserveStock(ctx, req.GetOrderId())
			if err != nil {
				return nil, err
			}
			return &inventorypb.ReserveReply{Reserved: reserved}, nil
		})
	if err != nil {
		log.Fatal(err)
	}

	// payments service
	err = sb.Handle(c, "payment.charge",
		func(ctx context.Context, req *paymentpb.ChargeRequest) (*paymentpb.ChargeReply, error) {
			return &paymentpb.ChargeReply{TransactionId: "tx-" + req.GetUserId(), Ok: true}, nil
		})
	if err != nil {
		log.Fatal(err)
	}

	// notifications service reacts to the workflow's final event
	err = sb.SubscribeEvent(c, "orders.fulfilled",
		func(ctx context.Context, e *orderpb.OrderPlaced) error {
			return sendEmail(ctx, e)
		})
	if err != nil {
		log.Fatal(err)
	}

	if err := c.Start(context.Background()); err != nil {
		log.Fatal(err)
	}
	select {}
}`,
        }}
      />

      {/* ── handle() ─────────────────────────────────────────────── */}
      <H2 id="workflow-start">{t.workflowStartTitle}</H2>
      <H3 id="handle-signature">{t.signatureTitle}</H3>
      <MultiCodeBlock
        code={{
          ts: `sb.workflow.handle(name: string, def: WorkflowDef, opts?: WorkflowHandlerOpts): void`,
          go: `func (d *sb.WorkflowDomain) Handle(name string, def wf.Definition) error`,
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
          go: `err := c.Workflow.Handle("order.fulfillment", wf.Definition{
	Input: map[string]any{
		"type":       "object",
		"properties": map[string]any{"orderId": map[string]any{"type": "string"}},
	},
	Steps: []wf.Step{
		wf.Call{
			Control: wf.Control{ID: "reserve"},
			Service: wf.Name("inventory"),
			Method:  wf.Name("stock.reserve"),
			Input:   map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
		wf.Call{
			Control: wf.Control{ID: "charge", WaitFor: []string{"reserve"}},
			Service: wf.Name("payments"),
			Method:  wf.Name("payment.charge"),
			Input: map[string]any{
				"orderId": wf.Path("$.input.orderId"),
				"amount":  wf.Path("$.input.amount"),
			},
		},
		wf.WaitEvent{
			Control: wf.Control{
				ID:         "wait_delivery",
				WaitFor:    []string{"charge"},
				TimeoutSec: 86_400,
			},
			Event:  wf.Name("shipping.delivered"),
			Filter: map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
		wf.Publish{
			Control: wf.Control{ID: "notify", WaitFor: []string{"wait_delivery"}},
			Event:   wf.Name("orders.fulfilled"),
			Input: map[string]any{
				"orderId": wf.Path("$.input.orderId"),
				"txId":    wf.Path("$.charge.txId"),
			},
		},
	},
})
if err != nil {
	log.Fatal(err) // CodeValidation names the step and the field
}`,
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
          go: `err := c.Workflow.Handle("onboarding", wf.Definition{
	Steps: []wf.Step{
		wf.Call{
			Control: wf.Control{ID: "create_user"},
			Service: wf.Name("users"),
			Method:  wf.Name("user.create"),
			Input:   map[string]any{"email": wf.Path("$.input.email")},
		},
		// These two run in parallel after create_user:
		wf.Publish{
			Control: wf.Control{ID: "send_welcome", WaitFor: []string{"create_user"}},
			Event:   wf.Name("emails.welcome"),
			Input:   map[string]any{"userId": wf.Path("$.create_user.id")},
		},
		wf.Call{
			Control: wf.Control{ID: "init_billing", WaitFor: []string{"create_user"}},
			Service: wf.Name("billing"),
			Method:  wf.Name("subscription.init"),
			Input:   map[string]any{"userId": wf.Path("$.create_user.id")},
		},
		// This waits for BOTH:
		wf.Call{
			Control: wf.Control{
				ID:      "activate",
				WaitFor: []string{"send_welcome", "init_billing"},
			},
			Service: wf.Name("users"),
			Method:  wf.Name("user.activate"),
			Input:   map[string]any{"userId": wf.Path("$.create_user.id")},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `err := c.Workflow.Handle("manual.approval", wf.Definition{
	Steps: []wf.Step{
		wf.Call{
			Control: wf.Control{ID: "submit"},
			Service: wf.Name("expenses"),
			Method:  wf.Name("report.submit"),
			Input:   map[string]any{"amount": wf.Path("$.input.amount")},
		},
		// Park until an operator delivers Signal(runID, "approved", ...)
		wf.WaitSignal{
			Control: wf.Control{
				ID:         "wait_approval",
				WaitFor:    []string{"submit"},
				TimeoutSec: 3_600,
			},
			Signal: "approved",
		},
		wf.Call{
			Control: wf.Control{ID: "pay", WaitFor: []string{"wait_approval"}},
			Service: wf.Name("expenses"),
			Method:  wf.Name("report.pay"),
			Input:   map[string]any{"reportId": wf.Path("$.submit.reportId")},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `err := c.Workflow.Handle("order.fulfillment", wf.Definition{
	Steps: []wf.Step{
		wf.Call{
			Control: wf.Control{ID: "reserve"},
			Service: wf.Name("inventory"),
			Method:  wf.Name("stock.reserve"),
			Input:   map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
		// Only notify when reserve actually reserved stock:
		wf.Publish{
			Control: wf.Control{
				ID:      "notify",
				WaitFor: []string{"reserve"},
				When:    wf.Equals(wf.Path("$.reserve.reserved"), true),
			},
			Event: wf.Name("orders.confirmed"),
			Input: map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
		// Skip premium shipping unless the order qualifies:
		wf.Call{
			Control: wf.Control{
				ID:      "express_ship",
				WaitFor: []string{"notify"},
				When:    wf.Truthy(wf.Path("$.input.priority")),
			},
			Service: wf.Name("shipping"),
			Method:  wf.Name("shipment.express"),
			Input:   map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `err := c.Workflow.Handle("order.post_purchase", wf.Definition{
	Steps: []wf.Step{
		wf.SubWorkflow{
			Control:  wf.Control{ID: "fulfillment"},
			Workflow: wf.Name("order.fulfillment"),
			Input:    map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
		// Runs after the entire child workflow completes:
		wf.Call{
			Control: wf.Control{ID: "analytics", WaitFor: []string{"fulfillment"}},
			Service: wf.Name("analytics"),
			Method:  wf.Name("usage.record"),
			Input:   map[string]any{"orderId": wf.Path("$.input.orderId")},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `err := c.Workflow.Handle("trial.expiry", wf.Definition{
	Steps: []wf.Step{
		wf.Call{
			Control: wf.Control{ID: "remind"},
			Service: wf.Name("emails"),
			Method:  wf.Name("send.trial_reminder"),
			Input:   map[string]any{"userId": wf.Path("$.input.userId")},
		},
		// 7 days, durable across restarts:
		wf.Sleep{
			Control:     wf.Control{ID: "wait_7d", WaitFor: []string{"remind"}},
			DurationSec: 604_800,
		},
		wf.Call{
			Control: wf.Control{ID: "expire", WaitFor: []string{"wait_7d"}},
			Service: wf.Name("billing"),
			Method:  wf.Name("subscription.expire_trial"),
			Input:   map[string]any{"userId": wf.Path("$.input.userId")},
		},
	},
})
if err != nil {
	log.Fatal(err)
}`,
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
          go: `runID, err := c.Workflow.Start(ctx, "order.fulfillment",
	map[string]any{"orderId": "o_123", "amount": 4999},
	sb.WithRunIdempotencyKey("o_123"), // a repeat returns the same run
	sb.WithRunTimeoutSec(3_600),
)
if err != nil {
	log.Fatal(err)
}
log.Println("run:", runID)`,
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
          go: `// Blocks until terminal; hands back state only for a successful run.
state, err := c.Workflow.Await(ctx, runID)
switch {
case errors.Is(err, sb.ErrTerminal):
	log.Println("run ended without success")
case err != nil:
	log.Fatal(err)
default:
	log.Println("final state:", state)
}

// Point-in-time snapshot
snap, err := c.Workflow.Query(ctx, runID)
if err != nil {
	log.Fatal(err)
}
log.Println(snap.Status) // e.g. "running" | "waiting" | "success"
for _, step := range snap.Steps {
	log.Println(step.StepID, step.Status, step.Output)
}

// Deliver a signal to a parked WaitSignal step
if err := c.Workflow.Signal(ctx, runID, "approved",
	map[string]any{"by": "ops@acme.com"}); err != nil {
	log.Fatal(err)
}`,
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
          go: `if err := c.Workflow.Cancel(ctx, runID); err != nil {
	log.Fatal(err)
}

// Fork a fresh run from a finished one, re-executing from a step:
replayID, err := c.Workflow.Replay(ctx, runID, "charge")
if err != nil {
	log.Fatal(err)
}
log.Println("replay:", replayID)`,
        }}
      />

      <Callout type="info">{t.statusCallout}</Callout>
    </div>
  );
}
