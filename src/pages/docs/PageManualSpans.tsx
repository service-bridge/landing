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
    badge: "Observability",
    title: "Manual Spans",
    description:
      "Every built-in domain (RPC, HTTP, events, workflows, jobs) is traced for you. Reach for startOp only when you want a custom operation of your own on the trace.",

    startOpTitle: "Starting your own operation",
    startOpP1:
      "An operation is one row in the trace: a unit of work with a start, an end, and a status. The runtime emits these automatically for incoming calls, event delivery, workflow steps, and job runs, so you write zero code for those. startOp() lets you add your own operation for a chunk of business logic that isn't an SDK domain call, like a cache rebuild, a third-party API call, or a batch import.",
    startOpP2:
      "Call it on the telemetry domain. In Node it returns an OpHandle you must close with .end(). In Go it returns a context and an Operation: the context carries the operation as the parent, so pass that context down and close the operation with End or Fail. Either way the START frame goes into a local ring buffer and ships to the runtime once the session is live, so you can emit before the client starts.",
    startOpParamsIntro:
      "In Node startOp() takes a single params object. In Go the name is the first argument and the rest are functional options — sb.WithOpBusinessKey(key) and sb.WithOpPeer(serviceID); the channel and kind are fixed to the user channel, and the parent trace comes from the ctx you pass in.",
    pChannel:
      "Which channel the op belongs to. For your own work pass Channel.USER.",
    pKind: "Op kind inside the channel. User ops use kind 1.",
    pSubject:
      "Human-readable identifier, shown in the trace UI as the op title, like \"import.customers\".",
    pBusinessKey:
      "Optional correlation or idempotency key, like an order id. Lets you pull every op for one entity.",
    pTraceId:
      "Optional. Defaults to the active trace from AsyncLocalStorage, so a startOp inside an RPC or event handler nests under the parent on its own.",

    enumNote1:
      "Channel and Status are real enums exported from",
    enumNote2:
      " — use Channel.USER and Status.SUCCESS instead of hand-copied numbers. The Go SDK exposes neither: a user operation is always on the user channel, and End / Fail decide the status. For most observability you want",
    enumNote3:
      "(logs) and counter / gauge / histogram (metrics): no enums, no handle to close. Reach for a manual operation only when you need your own row on the trace timeline.",

    lifecycleTitle: "Operation lifecycle",
    lifecycleP1:
      "The op stays PENDING (in-flight) until it is closed with a terminal status. In Node .end(status) does that and is idempotent, so a try/catch/finally is the natural shape. In Go End closes it as SUCCESS and Fail(err) closes it as ERROR with err.Error() as the message; an operation that never started is still closable, so no call site needs a nil check.",
    lifecycleP2:
      "Statuses are part of one shared vocabulary. An in-flight op is PENDING; it finishes as exactly one terminal status. The wire string for the happy path is \"success\".",

    sStatus: "Status",
    sWhen: "When",
    statusPending: "In-flight, not finished yet (the START frame).",
    statusSuccess: "Finished successfully. Wire string is \"success\".",
    statusError: "Failed with an error.",
    statusTimeout: "Exceeded its deadline.",
    statusAbandoned:
      "The instance disappeared without closing the op; the runtime marks these during its disconnect sweep.",

    handleTitle: "Handle members (Node)",
    hEnd: "Closes the op with a terminal status and optional message. Idempotent.",
    hOpId: "UUIDv7 of this in-flight op.",
    hTraceId: "Trace this op belongs to.",
    hSetAttempt:
      "Records the retry attempt count; the END frame carries the final value so one op row reflects how many tries it took.",
    hCapture:
      "Capture the inbound / outbound payload for this op. Honors the per-channel capture mode the runtime pushes (all / errors / none).",

    autoNote:
      "You almost never close an operation for SDK domain work. The RPC server, HTTP integrations, event delivery, and workflow engine open and close their ops for you. A manual operation is purely for the gaps your own code fills.",
  },
  ru: {
    badge: "Observability",
    title: "Ручные спаны",
    description:
      "Каждый встроенный домен — RPC, HTTP, события, workflow, jobs — трейсится за вас. startOp нужен, только когда вы хотите, чтобы в трейсе появилась ваша собственная операция.",

    startOpTitle: "Своя операция",
    startOpP1:
      "Операция — это одна строка в трейсе: единица работы со стартом, концом и статусом. Рантайм пишет их сам для входящих вызовов, доставки событий, шагов workflow и запусков job — кода с вашей стороны для этого ноль. startOp() позволяет добавить собственную операцию для куска бизнес-логики, который не является вызовом SDK-домена (пересборка кэша, обращение к стороннему API, пакетный импорт).",
    startOpP2:
      "Вызывается на домене телеметрии. В Node возвращает OpHandle, который надо закрыть через .end(). В Go возвращает контекст и Operation: контекст несёт операцию как родителя, поэтому передавайте именно его дальше, а операцию закрывайте через End или Fail. В обоих случаях START-кадр уходит в локальный ring-буфер и отправляется в рантайм, как только появится сессия, поэтому эмитить можно ещё до старта клиента.",
    startOpParamsIntro:
      "В Node startOp() принимает один объект params. В Go имя — первый аргумент, остальное — функциональные опции: sb.WithOpBusinessKey(key) и sb.WithOpPeer(serviceID); канал и kind зафиксированы на пользовательском канале, а родительский трейс берётся из переданного ctx.",
    pChannel:
      "К какому каналу относится операция. Для своей работы передавайте Channel.USER.",
    pKind: "Тип операции внутри канала. Пользовательские операции используют kind 1.",
    pSubject:
      "Человекочитаемый идентификатор, показывается в UI трейса как заголовок операции, например \"import.customers\".",
    pBusinessKey:
      "Необязательный ключ корреляции или идемпотентности, например id заказа. Позволяет вытащить все операции по одной сущности.",
    pTraceId:
      "Необязательный. По умолчанию берётся активный трейс из AsyncLocalStorage, поэтому startOp внутри RPC- или event-хендлера сам вкладывается в родителя.",

    enumNote1:
      "Channel и Status — настоящие энумы, экспортируемые из",
    enumNote2:
      " — берите Channel.USER и Status.SUCCESS, а не переписанные руками числа. В Go SDK их нет вовсе: пользовательская операция всегда на пользовательском канале, а статус решают End и Fail. Для большинства задач наблюдаемости подойдут",
    enumNote3:
      "(логи) и counter / gauge / histogram (метрики): без энумов и без хендла, который надо закрывать. Ручную операцию берите, только когда нужна своя строка на таймлайне трейса.",

    lifecycleTitle: "Жизненный цикл операции",
    lifecycleP1:
      "Операция остаётся в PENDING (in-flight), пока её не закроют терминальным статусом. В Node это делает .end(status), и он идемпотентен, поэтому естественная форма — try/catch/finally. В Go End закрывает её как SUCCESS, а Fail(err) — как ERROR с err.Error() в качестве сообщения; операцию, которая не стартовала, всё равно можно закрыть, поэтому проверка на nil на местах вызова не нужна.",
    lifecycleP2:
      "Статусы — часть единого общего словаря. In-flight операция в PENDING; завершается ровно одним терминальным статусом. Строка на wire для успеха — \"success\".",

    sStatus: "Статус",
    sWhen: "Когда",
    statusPending: "In-flight, ещё не завершена (START-кадр).",
    statusSuccess: "Успешно завершена. Строка на wire — \"success\".",
    statusError: "Упала с ошибкой.",
    statusTimeout: "Превысила дедлайн.",
    statusAbandoned:
      "Инстанс пропал, не закрыв операцию — рантайм помечает такие при disconnect-sweep.",

    handleTitle: "Члены хендла (Node)",
    hEnd: "Закрывает операцию терминальным статусом и необязательным сообщением. Идемпотентен.",
    hOpId: "UUIDv7 этой in-flight операции.",
    hTraceId: "Трейс, которому принадлежит операция.",
    hSetAttempt:
      "Записывает счётчик попыток ретрая; END-кадр несёт финальное значение, поэтому одна строка операции отражает, сколько попыток понадобилось.",
    hCapture:
      "Захватывает входящий / исходящий payload операции. Уважает per-channel режим захвата, который пушит рантайм (all / errors / none).",

    autoNote:
      "Для работы SDK-доменов операции вы почти никогда не закрываете руками — RPC-сервер, HTTP-интеграции, доставка событий и движок workflow открывают и закрывают свои операции сами. Ручная операция — исключительно для пробелов, которые заполняет ваш собственный код.",
  },
};

export function PageManualSpans() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="start-span">{t.startOpTitle}</H2>
      <P>{t.startOpP1}</P>
      <P>{t.startOpP2}</P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge, Channel } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

const op = sb.telemetry.startOp({
  channel: Channel.USER,
  kind: 1, // user op kind
  subject: "import.customers",
  businessKey: batchId,
  // traceId omitted -> inherits the active trace from the handler.
});`,
          go: `c, err := sb.New("localhost:14445", serviceKey)
if err != nil {
	log.Fatal(err)
}

// StartOp returns a context carrying the operation as the parent. Pass THAT
// context down, or the calls made underneath start their own trace root and
// one request becomes two trees.
ctx, op := c.Telemetry.StartOp(ctx, "import.customers",
	sb.WithOpBusinessKey(batchID),
)
defer op.End()`,
        }}
      />

      <P>{t.startOpParamsIntro}</P>
      <ParamTable
        rows={[
          { name: "channel", type: "Channel", default: "—", desc: t.pChannel },
          { name: "kind", type: "number", default: "—", desc: t.pKind },
          { name: "subject", type: "string", default: "—", desc: t.pSubject },
          {
            name: "businessKey",
            type: "string",
            default: '""',
            desc: t.pBusinessKey,
          },
          {
            name: "traceId",
            type: "string",
            default: "active trace",
            desc: t.pTraceId,
          },
        ]}
      />

      <Callout type="info">
        {t.enumNote1} <Mono>servicebridge</Mono>
        {t.enumNote2} <Mono>sb.telemetry.log</Mono> {t.enumNote3}
      </Callout>

      <H2 id="register-endpoint">{t.lifecycleTitle}</H2>
      <P>{t.lifecycleP1}</P>
      <MultiCodeBlock
        code={{
          ts: `import { Channel, Status } from "service-bridge";

const op = sb.telemetry.startOp({
  channel: Channel.USER,
  kind: 1,
  subject: "import.customers",
});

try {
  await importCustomers(batch);
  op.end(Status.SUCCESS);
} catch (err) {
  op.end(Status.ERROR, String(err));
  throw err;
}`,
          go: `ctx, op := c.Telemetry.StartOp(ctx, "import.customers")

if err := importCustomers(ctx, batchID); err != nil {
	op.Fail(err) // closes the op as ERROR, with err.Error() as the message
	log.Fatal(err)
}
op.End() // closes it as SUCCESS`,
        }}
      />

      <P>{t.lifecycleP2}</P>
      <ParamTable
        rows={[
          { name: "PENDING", type: "1", default: t.sWhen, desc: t.statusPending },
          { name: "SUCCESS", type: "2", default: t.sWhen, desc: t.statusSuccess },
          { name: "ERROR", type: "3", default: t.sWhen, desc: t.statusError },
          { name: "TIMEOUT", type: "4", default: t.sWhen, desc: t.statusTimeout },
          {
            name: "ABANDONED",
            type: "5",
            default: t.sWhen,
            desc: t.statusAbandoned,
          },
        ]}
      />

      <H3 id="handle-members">{t.handleTitle}</H3>
      <ParamTable
        rows={[
          {
            name: "end(status, message?)",
            type: "void",
            default: "—",
            desc: t.hEnd,
          },
          { name: "opId", type: "string", default: "—", desc: t.hOpId },
          { name: "traceId", type: "string", default: "—", desc: t.hTraceId },
          {
            name: "setAttempt(n)",
            type: "void",
            default: "—",
            desc: t.hSetAttempt,
          },
          {
            name: "captureIn / captureOut",
            type: "void",
            default: "—",
            desc: t.hCapture,
          },
        ]}
      />

      <Callout type="tip">{t.autoNote}</Callout>
    </div>
  );
}
