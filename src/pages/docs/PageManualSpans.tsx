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
      "Every built-in domain (RPC, HTTP, events, workflows, jobs) is traced for you. Reach for sb.telemetry.startOp() only when you want a custom operation of your own on the trace.",

    startOpTitle: "sb.telemetry.startOp()",
    startOpP1:
      "An operation is one row in the trace: a unit of work with a start, an end, and a status. The runtime emits these automatically for incoming calls, event delivery, workflow steps, and job runs, so you write zero code for those. startOp() lets you add your own operation for a chunk of business logic that isn't an SDK domain call, like a cache rebuild, a third-party API call, or a batch import.",
    startOpP2:
      "Call it through the sb.telemetry getter. It returns an OpHandle you must close with .end(). The START frame goes into a local ring buffer and ships to the runtime once the session is live, so you can emit before start().",
    startOpParamsIntro: "startOp() takes a single params object:",
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
      ". Use Channel.USER and Status.SUCCESS instead of hand-copied numbers. For most observability you want",
    enumNote3:
      "(logs) and counter / gauge / histogram (metrics): no enums, no handle to close. Reach for startOp() only when you need your own row on the trace timeline.",

    lifecycleTitle: "OpHandle lifecycle",
    lifecycleP1:
      "startOp() returns an OpHandle. The op stays PENDING (in-flight) until you call .end() with a terminal status. .end() is idempotent: calling it twice is a no-op, so a try/catch/finally is the natural shape.",
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

    handleTitle: "Handle members",
    hEnd: "Closes the op with a terminal status and optional message. Idempotent.",
    hOpId: "UUIDv7 of this in-flight op.",
    hTraceId: "Trace this op belongs to.",
    hSetAttempt:
      "Records the retry attempt count; the END frame carries the final value so one op row reflects how many tries it took.",
    hCapture:
      "Capture the inbound / outbound payload for this op. Honors the per-channel capture mode the runtime pushes (all / errors / none).",

    autoNote:
      "You almost never call .end() for SDK domain work. The RPC server, HTTP integrations, event delivery, and workflow engine open and close their ops for you. startOp() is purely for the gaps your own code fills.",
  },
  ru: {
    badge: "Observability",
    title: "Ручные спаны",
    description:
      "Каждый встроенный домен — RPC, HTTP, события, workflow, jobs — трейсится за вас. sb.telemetry.startOp() нужен, только когда вы хотите, чтобы в трейсе появилась ваша собственная операция.",

    startOpTitle: "sb.telemetry.startOp()",
    startOpP1:
      "Операция — это одна строка в трейсе: единица работы со стартом, концом и статусом. Рантайм пишет их сам для входящих вызовов, доставки событий, шагов workflow и запусков job — кода с вашей стороны для этого ноль. startOp() позволяет добавить собственную операцию для куска бизнес-логики, который не является вызовом SDK-домена (пересборка кэша, обращение к стороннему API, пакетный импорт).",
    startOpP2:
      "Вызывается через геттер sb.telemetry. Возвращает OpHandle, который вы обязаны закрыть через .end(). START-кадр уходит в локальный ring-буфер и отправляется в рантайм, как только появится сессия, поэтому эмитить можно ещё до start().",
    startOpParamsIntro: "startOp() принимает один объект params:",
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
      ". Берите Channel.USER и Status.SUCCESS, а не переписанные руками числа. Для большинства задач наблюдаемости подойдут",
    enumNote3:
      "(логи) и counter / gauge / histogram (метрики): без энумов и без хендла, который надо закрывать. startOp() берите, только когда нужна своя строка на таймлайне трейса.",

    lifecycleTitle: "Жизненный цикл OpHandle",
    lifecycleP1:
      "startOp() возвращает OpHandle. Операция остаётся в PENDING (in-flight), пока вы не вызовете .end() с терминальным статусом. .end() идемпотентен — повторный вызов ничего не делает — поэтому естественная форма это try/catch/finally.",
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

    handleTitle: "Члены хендла",
    hEnd: "Закрывает операцию терминальным статусом и необязательным сообщением. Идемпотентен.",
    hOpId: "UUIDv7 этой in-flight операции.",
    hTraceId: "Трейс, которому принадлежит операция.",
    hSetAttempt:
      "Записывает счётчик попыток ретрая; END-кадр несёт финальное значение, поэтому одна строка операции отражает, сколько попыток понадобилось.",
    hCapture:
      "Захватывает входящий / исходящий payload операции. Уважает per-channel режим захвата, который пушит рантайм (all / errors / none).",

    autoNote:
      ".end() для работы SDK-доменов вы почти никогда не вызываете — RPC-сервер, HTTP-интеграции, доставка событий и движок workflow открывают и закрывают свои операции за вас. startOp() — исключительно для пробелов, которые заполняет ваш собственный код.",
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
          ts: `import { ServiceBridge, Channel } from "servicebridge";

const sb = new ServiceBridge("localhost:14445", serviceKey);

const op = sb.telemetry.startOp({
  channel: Channel.USER,
  kind: 1, // user op kind
  subject: "import.customers",
  businessKey: batchId,
  // traceId omitted -> inherits the active trace from the handler.
});`,
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
          ts: `import { Channel, Status } from "servicebridge";

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
