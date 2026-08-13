import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, H3, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Migration guide",
    title: "Migrating from Temporal to Workflows",
    description:
      "Read this one carefully before porting anything. Temporal lets you write a workflow as ordinary application code and gives you deterministic replay to reconstruct state after any restart. ServiceBridge Workflows are a different model: a static, declarative DAG of typed steps — a frozen plan, not a function — executed by a thin SDK runner while the runtime owns retries, recovery, and compensation. If your Temporal workflows lean on arbitrary imperative logic, this is not a drop-in replacement.",

    overviewTitle: "Model differences",
    overviewP1:
      "A Temporal workflow is a function in your language (TypeScript, Go, Java...). It can branch, loop, call Activities conditionally, spawn child workflows dynamically, and hold arbitrary local state — as long as it stays deterministic. Temporal's SDK replays that function against the recorded event history to rebuild in-memory state whenever a worker restarts, moves, or reconnects. Determinism is the whole game: no direct randomness, wall-clock time, or I/O inside workflow code — those go through Activities, Timers, or Side Effects.",
    overviewP2:
      "ServiceBridge Workflows have no workflow function to replay. sb.workflow.handle(name, def) registers a static graph of typed steps (call, publish, workflow, sleep, wait_event, wait_signal, parallel, sequence, local) with waitFor dependencies. The SDK canonicalizes this graph and hashes it (contract_hash) at registration. The runner is intentionally thin: for each ready step it does beginStep → resolve JsonExpression inputs → exactly one call → completeStep. No retries, no backoff, no circuit breaker on the SDK side — all of that (lease, heartbeat, dispatcher, compensation) lives in the runtime, driven off persisted state in Postgres.",
    overviewCallout:
      "There is no replay-determinism concept here because there is no user code being replayed. Recovery after an SDK-instance crash means the runtime reassigns the run to a live instance and beginStep returns the cached output for already-completed steps (\"alreadyDone\") — not a re-execution of your function from the top.",

    mappingTitle: "Temporal → ServiceBridge Workflows",
    mappingRows: [
      { name: "Workflow function (arbitrary code, replayed)", type: "Temporal", desc: "Static Step[] DAG registered via sb.workflow.handle(name, def) — a declarative plan, not code you write in a loop/branch-heavy style." },
      { name: "Activity, called via proxyActivities", type: "Temporal", desc: "A call step (runs sb.rpc.call under the hood) or a publish step (sb.event.publish), addressed by service/method or event name." },
      { name: "Child workflow (executeChild)", type: "Temporal", desc: "workflow step type — nests another registered workflow and waits for it to finish." },
      { name: "Signal (defineSignal + setHandler)", type: "Temporal", desc: "wait_signal step — parks the run at that specific DAG point until sb.workflow.signal(runId, name, payload)." },
      { name: "Timer (sleep() inside workflow code)", type: "Temporal", desc: "sleep step — durationSec, durable park/resume; the runtime writes a WORKFLOW.SLEEP op on park and updates it on fire." },
      { name: "Task Queue (workers poll a named queue)", type: "Temporal", desc: "The service field on each step — direct routing to whichever service owns that RPC method / event / workflow name, not a pull-based worker pool." },
      { name: "Query (defineQuery + setHandler)", type: "Temporal", desc: "sb.workflow.query(runId) — a fixed shape ({ status, state, steps }), not a custom handler you author." },
      { name: "Hand-rolled saga (try/catch + manual reverse calls)", type: "Temporal", desc: "compensate field on a call/publish step — declarative; the runtime walks completed steps in reverse automatically on cancel or failure." },
      { name: "GetVersion() / patching", type: "Temporal", desc: "Not supported. Re-registering the same workflow name with a different DAG shape is rejected outright (contract_hash mismatch) — version by renaming the workflow." },
      { name: "Continue-As-New", type: "Temporal", desc: "Not present in the current feature set — a run's step list is fixed and finite." },
    ],

    exampleTitle: "Example",
    exampleP:
      "Charge a customer, wait for manual approval, provision an account, refund on failure — the same saga in both models.",
    beforeCode: `// before: Temporal TypeScript SDK
import { proxyActivities, defineSignal, condition, sleep, setHandler } from "@temporalio/workflow";
import type * as activities from "./activities";

const { charge, refund, provisionAccount, deleteAccount } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const userApproved = defineSignal<[{ approvedBy: string }]>("user-approved");

export async function onboardUser(userId: string): Promise<void> {
  const chargeResult = await charge(userId);

  let approved = false;
  setHandler(userApproved, () => { approved = true; });
  await condition(() => approved, "1 hour");

  try {
    await provisionAccount(userId);
  } catch (err) {
    await refund(chargeResult.transactionId);
    throw err;
  }

  await sleep("60 seconds");
  // ... publish notification via an Activity
}`,
    afterCode: `// after: ServiceBridge Workflows
sb.workflow.handle("onboard-user", {
  input: { userId: { type: "string" } },
  steps: [
    { type: "call", id: "charge", service: "payments", method: "Charge",
      input: { userId: "$.input.userId" },
      compensate: { service: "payments", method: "Refund",
        input: { chargeId: "$.charge.transactionId" } } },

    { type: "wait_signal", id: "approved", signal: "user-approved",
      waitFor: ["charge"], timeoutSec: 3600 },

    { type: "call", id: "provision", service: "accounts", method: "Create",
      input: { userId: "$.input.userId" }, waitFor: ["approved"],
      compensate: { service: "accounts", method: "Delete",
        input: { id: "$.provision.id" } } },

    { type: "sleep", id: "cooldown", durationSec: 60, waitFor: ["provision"] },

    { type: "publish", id: "notify", event: "user.onboarded",
      input: { userId: "$.input.userId" }, waitFor: ["cooldown"] },
  ],
});

await sb.start();

const { runId } = await sb.workflow.start("onboard-user", { userId: "u-1" });
await sb.workflow.signal(runId, "user-approved", { approvedBy: "admin" });
const finalState = await sb.workflow.await(runId); // resolves only on status "success"`,
    exampleCallout:
      "Read the two side by side: the Temporal version is a function you could extend with any control flow at any point. The ServiceBridge version is data — a fixed list of steps wired by waitFor. That's the whole trade: less code to reason about for a fixed shape, no room for a runtime if/else you didn't declare up front.",

    signalsTitle: "Signals & timers",
    signalsP1:
      "A Temporal signal handler (setHandler(mySignal, fn)) can run at any point the workflow function is live and affect arbitrary in-flight state — you write the logic for what it does. A ServiceBridge wait_signal is a specific parking point in the DAG: the run stops there and only resumes when sb.workflow.signal(runId, signalName, payload) arrives (or timeoutSec elapses). You cannot \"receive\" a signal from an arbitrary point in the middle of other logic — only at a step explicitly typed wait_signal.",
    signalsP2:
      "sleep is closer to a 1:1 match: both are durable timers, both survive worker/instance restarts, and both are the recommended way to pause without holding a thread.",
    signalsCode: `{ type: "wait_signal", id: "approved", signal: "user-approved", timeoutSec: 3600 }
{ type: "sleep", id: "cooldown", durationSec: 60 }
{ type: "wait_event", id: "payment_confirmed", event: "payment.confirmed" }`,

    compensationTitle: "Compensation",
    compensationP1:
      "Temporal has no built-in saga primitive — teams typically hand-roll compensation with try/catch inside workflow code, tracking which steps completed and calling their inverses manually in reverse order.",
    compensationP2:
      "ServiceBridge makes this declarative: a call or publish step can carry a compensate spec (its own service/method/event and input). On cancel or a failed run with a compensate-bearing chain, the runtime transitions the run to compensating and the runner walks completed steps in reverse, invoking compensate for each one that has output. Terminal status is cancelled (user-initiated cancel) or failed_compensated (compensation after a step failure).",
    compensationCallout:
      "Compensation only runs for steps that both completed (have output) and declare compensate. A step that never ran, or one without a compensate spec, is skipped in the reverse pass — the same responsibility you'd have in Temporal to write the right compensation for the right steps, just declared instead of coded.",

    determinismTitle: "Determinism & replay",
    determinismP1:
      "This is the section to read before committing to a migration. Temporal's core value proposition is that workflow code looks like normal application code — loops, conditionals, local variables, dynamically constructed child-workflow IDs — and the platform makes it durable via deterministic replay. ServiceBridge does not offer that. You are not writing a workflow function; you are writing a configuration object.",
    determinismRows: [
      { id: "control-flow", name: "Control flow", en: "Static Step[] DAG, wired by waitFor. Conditional branching only via the when predicate (equals / in / and / or / not against resolved state) and forEach over a state array — both evaluated once per step, not arbitrary runtime logic." },
      { id: "local-computation", name: "Local computation", en: "The local step type runs a plain JS function (fn: (state) => Promise<unknown>) — but it is documented as \"no I/O\". Every I/O-having unit of work has to be its own call / publish / workflow step, not inline code inside a bigger function." },
      { id: "schema-evolution", name: "Schema evolution", en: "Re-registering the same workflow name with a different step graph is rejected at registration (contract_hash mismatch). There is no GetVersion()-style branch-and-deprecate; a changed shape needs a new workflow name." },
      { id: "long-running", name: "Long-running / infinite workflows", en: "No Continue-As-New equivalent in the current feature set. A run's step list is fixed and finite at registration time." },
      { id: "recovery-model", name: "Recovery model", en: "Not replay. The runtime persists state per step in Postgres; on lease reclaim beginStep returns the cached output for finished steps. There's no possibility of a nondeterminism bug because there's no code being re-run." },
    ] as { id: string; name: string; en: string }[],

    whenNotTitle: "When not to migrate",
    whenNotItems: [
      "Your workflows have deep imperative branching — nested conditionals on business data beyond simple equality, dynamically computed activity targets, loops with variable iteration counts driven by runtime logic. Porting this to a static DAG means restructuring the process, not translating syntax.",
      "You rely on Continue-As-New for effectively-infinite or very-long-running workflows (polling loops that run for months, etc.) — there's no equivalent primitive here.",
      "You use GetVersion() to evolve running workflow definitions in place. ServiceBridge rejects a changed DAG under an existing name outright; you'd need a rename-and-cutover strategy for every schema change instead.",
      "You lean on Local Activities or Side Effects for lightweight in-workflow I/O or non-deterministic values threaded through complex logic — ServiceBridge's local step is explicitly non-I/O, so there's no equivalent slot for that pattern.",
      "Your Queries are custom read handlers over rich in-memory workflow state — sb.workflow.query() returns a fixed { status, state, steps } shape, not something you can extend with your own query handlers.",
    ],
    whenYesTitle: "Good fit instead",
    whenYesP:
      "Business processes that are naturally a fixed DAG of RPC/event/sleep/signal steps with straightforward branching — order fulfillment, onboarding, approval flows, multi-service sagas with compensation. If the process diagrams cleanly as boxes and arrows before you write any code, the migration is close to a direct translation, with less code to maintain than the equivalent Temporal workflow function plus its Activities.",
  },
  ru: {
    badge: "Гайд по миграции",
    title: "Миграция с Temporal на Workflows",
    description:
      "Прочитайте эту страницу внимательно, прежде чем переносить что-либо. Temporal позволяет писать workflow как обычный код приложения и даёт детерминированный replay для восстановления состояния после любого рестарта. ServiceBridge Workflows — другая модель: статический декларативный DAG типизированных шагов — frozen plan, не функция — исполняемый тонким SDK-раннером, пока рантайм владеет повторами, восстановлением и компенсацией. Если ваши Temporal-workflow опираются на произвольную императивную логику, это не drop-in замена.",

    overviewTitle: "Отличия модели",
    overviewP1:
      "Temporal-workflow — это функция на вашем языке (TypeScript, Go, Java...). Она может ветвиться, зацикливаться, условно вызывать Activity, динамически порождать дочерние workflow и держать произвольное локальное состояние — пока остаётся детерминированной. SDK Temporal реплеит эту функцию против записанной истории событий, чтобы восстановить in-memory состояние при рестарте, переезде или переподключении воркера. Детерминизм — вся суть: никакой прямой случайности, wall-clock времени или I/O внутри кода workflow — это идёт через Activity, Timer'ы или Side Effect'ы.",
    overviewP2:
      "У ServiceBridge Workflows нет функции workflow для replay. sb.workflow.handle(name, def) регистрирует статический граф типизированных шагов (call, publish, workflow, sleep, wait_event, wait_signal, parallel, sequence, local) с зависимостями waitFor. SDK canonicalize'ит этот граф и хеширует его (contract_hash) при регистрации. Раннер намеренно тонкий: для каждого готового шага он делает beginStep → резолв JsonExpression входов → ровно один вызов → completeStep. Никаких повторов, backoff, circuit breaker на стороне SDK — всё это (lease, heartbeat, диспетчер, компенсация) живёт в рантайме, управляется персистентным состоянием в Postgres.",
    overviewCallout:
      "Концепции replay-детерминизма здесь нет, потому что нет пользовательского кода для replay. Восстановление после краша SDK-инстанса означает, что рантайм переназначает run живому инстансу, и beginStep возвращает закешированный output для уже завершённых шагов (\"alreadyDone\") — а не повторное выполнение вашей функции с начала.",

    mappingTitle: "Temporal → ServiceBridge Workflows",
    mappingRows: [
      { name: "Функция workflow (произвольный код, replay)", type: "Temporal", desc: "Статический DAG Step[], регистрируется через sb.workflow.handle(name, def) — декларативный план, не код в стиле циклов/ветвлений." },
      { name: "Activity, вызывается через proxyActivities", type: "Temporal", desc: "Шаг call (внутри sb.rpc.call) или publish (sb.event.publish), адресуется по service/method или имени события." },
      { name: "Дочерний workflow (executeChild)", type: "Temporal", desc: "Тип шага workflow — вкладывает другой зарегистрированный workflow и ждёт его завершения." },
      { name: "Signal (defineSignal + setHandler)", type: "Temporal", desc: "Шаг wait_signal — паркует run в этой конкретной точке DAG до sb.workflow.signal(runId, name, payload)." },
      { name: "Timer (sleep() внутри кода workflow)", type: "Temporal", desc: "Шаг sleep — durationSec, устойчивый park/resume; рантайм пишет WORKFLOW.SLEEP op на парковке и обновляет при пробуждении." },
      { name: "Task Queue (воркеры опрашивают именованную очередь)", type: "Temporal", desc: "Поле service на каждом шаге — прямая маршрутизация к сервису, владеющему этим RPC-методом / событием / workflow, не pull-based пул воркеров." },
      { name: "Query (defineQuery + setHandler)", type: "Temporal", desc: "sb.workflow.query(runId) — фиксированная форма ({ status, state, steps }), не кастомный handler, который вы пишете." },
      { name: "Самописная saga (try/catch + ручные обратные вызовы)", type: "Temporal", desc: "Поле compensate на шаге call/publish — декларативно; рантайм автоматически проходит завершённые шаги в обратном порядке при cancel или провале." },
      { name: "GetVersion() / patching", type: "Temporal", desc: "Не поддерживается. Повторная регистрация того же имени workflow с другой формой DAG отвергается сразу (несовпадение contract_hash) — версионирование через переименование workflow." },
      { name: "Continue-As-New", type: "Temporal", desc: "Отсутствует в текущем наборе фич — список шагов run'а фиксирован и конечен." },
    ],

    exampleTitle: "Пример",
    exampleP:
      "Списать деньги с клиента, дождаться ручного одобрения, провижинить аккаунт, откатить при сбое — одна и та же сага в обеих моделях.",
    beforeCode: `// до: Temporal TypeScript SDK
import { proxyActivities, defineSignal, condition, sleep, setHandler } from "@temporalio/workflow";
import type * as activities from "./activities";

const { charge, refund, provisionAccount, deleteAccount } = proxyActivities<typeof activities>({
  startToCloseTimeout: "1 minute",
});

export const userApproved = defineSignal<[{ approvedBy: string }]>("user-approved");

export async function onboardUser(userId: string): Promise<void> {
  const chargeResult = await charge(userId);

  let approved = false;
  setHandler(userApproved, () => { approved = true; });
  await condition(() => approved, "1 hour");

  try {
    await provisionAccount(userId);
  } catch (err) {
    await refund(chargeResult.transactionId);
    throw err;
  }

  await sleep("60 seconds");
  // ... публикация уведомления через Activity
}`,
    afterCode: `// после: ServiceBridge Workflows
sb.workflow.handle("onboard-user", {
  input: { userId: { type: "string" } },
  steps: [
    { type: "call", id: "charge", service: "payments", method: "Charge",
      input: { userId: "$.input.userId" },
      compensate: { service: "payments", method: "Refund",
        input: { chargeId: "$.charge.transactionId" } } },

    { type: "wait_signal", id: "approved", signal: "user-approved",
      waitFor: ["charge"], timeoutSec: 3600 },

    { type: "call", id: "provision", service: "accounts", method: "Create",
      input: { userId: "$.input.userId" }, waitFor: ["approved"],
      compensate: { service: "accounts", method: "Delete",
        input: { id: "$.provision.id" } } },

    { type: "sleep", id: "cooldown", durationSec: 60, waitFor: ["provision"] },

    { type: "publish", id: "notify", event: "user.onboarded",
      input: { userId: "$.input.userId" }, waitFor: ["cooldown"] },
  ],
});

await sb.start();

const { runId } = await sb.workflow.start("onboard-user", { userId: "u-1" });
await sb.workflow.signal(runId, "user-approved", { approvedBy: "admin" });
const finalState = await sb.workflow.await(runId); // резолвится только на статусе "success"`,
    exampleCallout:
      "Сравните эти два примера рядом: версия Temporal — функция, которую можно расширить любым control flow в любой точке. Версия ServiceBridge — данные: фиксированный список шагов, связанных через waitFor. Это и есть весь обмен: меньше кода для фиксированной формы, но нет места для runtime if/else, который вы не объявили заранее.",

    signalsTitle: "Сигналы и таймеры",
    signalsP1:
      "Обработчик сигнала в Temporal (setHandler(mySignal, fn)) может сработать в любой момент, пока функция workflow жива, и повлиять на произвольное in-flight состояние — вы сами пишете логику того, что он делает. wait_signal в ServiceBridge — конкретная точка парковки в DAG: run останавливается там и возобновляется только когда приходит sb.workflow.signal(runId, signalName, payload) (или истекает timeoutSec). «Принять» сигнал из произвольной точки посреди другой логики нельзя — только на шаге, явно типизированном как wait_signal.",
    signalsP2:
      "sleep ближе к прямому соответствию: оба — устойчивые таймеры, оба переживают рестарт воркера/инстанса, оба — рекомендуемый способ приостановиться без удержания потока.",
    signalsCode: `{ type: "wait_signal", id: "approved", signal: "user-approved", timeoutSec: 3600 }
{ type: "sleep", id: "cooldown", durationSec: 60 }
{ type: "wait_event", id: "payment_confirmed", event: "payment.confirmed" }`,

    compensationTitle: "Компенсация",
    compensationP1:
      "У Temporal нет встроенного примитива saga — команды обычно пишут компенсацию вручную через try/catch внутри кода workflow, отслеживая, какие шаги завершились, и вызывая их обратные операции вручную в обратном порядке.",
    compensationP2:
      "ServiceBridge делает это декларативным: шаг call или publish может нести спецификацию compensate (свои service/method/event и input). При cancel или провале run'а с цепочкой, несущей compensate, рантайм переводит run в compensating, и раннер проходит завершённые шаги в обратном порядке, вызывая compensate для каждого, у кого есть output. Терминальный статус — cancelled (отмена пользователем) или failed_compensated (компенсация после провала шага).",
    compensationCallout:
      "Компенсация выполняется только для шагов, которые и завершились (есть output), и объявляют compensate. Шаг, который не выполнился, или без спецификации compensate, пропускается в обратном проходе — та же ответственность, что и в Temporal, написать правильную компенсацию для правильных шагов, только декларативно, а не в коде.",

    determinismTitle: "Детерминизм и replay",
    determinismP1:
      "Это раздел, который нужно прочитать перед тем, как решиться на миграцию. Ключевое предложение Temporal — код workflow выглядит как обычный код приложения: циклы, условия, локальные переменные, динамически строящиеся ID дочерних workflow — а платформа делает это durable через детерминированный replay. ServiceBridge этого не предлагает. Вы не пишете функцию workflow — вы пишете объект конфигурации.",
    determinismRows: [
      { id: "control-flow", name: "Control flow", en: "Статический DAG Step[], связанный через waitFor. Условное ветвление только через предикат when (equals / in / and / or / not против резолвнутого состояния) и forEach по массиву состояния — оба вычисляются один раз на шаг, не произвольная runtime-логика." },
      { id: "local-computation", name: "Локальные вычисления", en: "Тип шага local запускает обычную JS-функцию (fn: (state) => Promise<unknown>) — но задокументирован как «без I/O». Каждая единица работы с I/O должна быть отдельным шагом call / publish / workflow, не инлайн-кодом внутри большей функции." },
      { id: "schema-evolution", name: "Эволюция схемы", en: "Повторная регистрация того же имени workflow с другим графом шагов отвергается при регистрации (несовпадение contract_hash). Нет GetVersion()-style паттерна ветвления и депрекации; изменённая форма требует нового имени workflow." },
      { id: "long-running", name: "Долгоживущие / бесконечные workflow", en: "Нет эквивалента Continue-As-New в текущем наборе фич. Список шагов run'а фиксирован и конечен на момент регистрации." },
      { id: "recovery-model", name: "Модель восстановления", en: "Не replay. Рантайм персистит состояние по шагам в Postgres; при lease reclaim beginStep возвращает закешированный output для завершённых шагов. Баг недетерминизма невозможен, потому что нет кода, который переисполняется." },
    ] as { id: string; name: string; en: string }[],

    whenNotTitle: "Когда не стоит переезжать",
    whenNotItems: [
      "У ваших workflow глубокое императивное ветвление — вложенные условия по бизнес-данным сложнее простого равенства, динамически вычисляемые цели activity, циклы с переменным числом итераций, управляемым runtime-логикой. Перенос этого на статический DAG означает реструктуризацию процесса, а не перевод синтаксиса.",
      "Вы опираетесь на Continue-As-New для практически бесконечных или очень долгих workflow (poll-циклы месяцами и т.д.) — эквивалентного примитива здесь нет.",
      "Вы используете GetVersion() для эволюции работающих определений workflow на месте. ServiceBridge отвергает изменённый DAG под существующим именем сразу; для каждого изменения схемы понадобится стратегия переименования и cutover.",
      "Вы опираетесь на Local Activities или Side Effects для лёгкого I/O внутри workflow или недетерминированных значений, прошитых через сложную логику — шаг local в ServiceBridge явно без I/O, эквивалентного слота для этого паттерна нет.",
      "Ваши Query — кастомные read-хендлеры над богатым in-memory состоянием workflow — sb.workflow.query() возвращает фиксированную форму { status, state, steps }, не то, что можно расширить своими query-хендлерами.",
    ],
    whenYesTitle: "Хорошо подходит",
    whenYesP:
      "Бизнес-процессы, естественно являющиеся фиксированным DAG из шагов RPC/event/sleep/signal с прямолинейным ветвлением — выполнение заказа, онбординг, флоу согласований, мультисервисные саги с компенсацией. Если процесс чисто рисуется как коробки и стрелки ещё до написания кода, миграция близка к прямому переводу, с меньшим количеством кода для поддержки, чем эквивалентная функция workflow Temporal плюс её Activity.",
  },
};

export function PageMigrateTemporal() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="overview">{t.overviewTitle}</H2>
      <P>{t.overviewP1}</P>
      <P>{t.overviewP2}</P>
      <Callout type="warning">{t.overviewCallout}</Callout>

      <H2 id="mapping">{t.mappingTitle}</H2>
      <ParamTable rows={t.mappingRows} />

      <H2 id="example">{t.exampleTitle}</H2>
      <P>{t.exampleP}</P>
      <MultiCodeBlock code={{ ts: t.beforeCode }} />
      <MultiCodeBlock code={{ ts: t.afterCode }} />
      <Callout type="tip">{t.exampleCallout}</Callout>

      <H2 id="signals-timers">{t.signalsTitle}</H2>
      <P>{t.signalsP1}</P>
      <P>{t.signalsP2}</P>
      <MultiCodeBlock code={{ ts: t.signalsCode }} />

      <H2 id="compensation">{t.compensationTitle}</H2>
      <P>{t.compensationP1}</P>
      <P>{t.compensationP2}</P>
      <Callout type="info">{t.compensationCallout}</Callout>

      <H2 id="determinism">{t.determinismTitle}</H2>
      <P>{t.determinismP1}</P>
      <div className="space-y-3 my-4">
        {t.determinismRows.map((row) => (
          <div key={row.id}>
            <H3 id={`determinism-${row.id}`}>{row.name}</H3>
            <P>{row.en}</P>
          </div>
        ))}
      </div>

      <H2 id="when-not">{t.whenNotTitle}</H2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.whenNotItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <Callout type="tip">
        <strong>{t.whenYesTitle}.</strong> {t.whenYesP}
      </Callout>
      <P>
        <Mono>waitFor</Mono> · <Mono>compensate</Mono> · <Mono>contract_hash</Mono>
      </P>
    </div>
  );
}
