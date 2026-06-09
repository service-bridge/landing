import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Transport & Resilience",
    title: "Reconnect & Resume",
    description:
      "When the control-plane connection drops, the SDK re-provisions a fresh session and resumes work automatically. Reconnect is a fixed-interval retry loop; durability lives in the outbox and the runtime, not in a session replay token.",

    resumeTitle: "Resume on reconnect",
    resumeP1:
      "The SDK keeps one mTLS session to the runtime: a read-only Control.Open stream that carries Welcome and Drain frames. When that stream ends or errors, the SDK does not try to splice the old session back together. It builds a brand-new one.",
    resumeP2: "Each reconnect attempt runs the same path as the first connect:",
    resumeSteps: [
      "Re-run Bootstrap.Provision to get a fresh leaf certificate and a new instanceId.",
      "Open a new mTLS channel and a new Control.Open server stream.",
      "Re-send the RegisterRequest (handlers, event subscriptions, declared deps, HTTP endpoint).",
      "Restart the event / workflow / job subscribers and the telemetry stream.",
    ],
    resumeP3:
      "When the runtime answers with a Welcome frame, the SDK emits connected with a fresh sessionId, and work flows again. Because the session is stateless and rebuilt, there is no resume token, no epoch fencing, and no command replay at the SDK level — those concepts do not exist here.",
    resumeWhyTitle: "Then how is nothing lost?",
    resumeWhyP:
      "Durability is owned by the parts that hold state, not by the session:",
    resumeWhyBullets: [
      <>
        <Mono>sb.event.publish()</Mono> writes to a local SQLite outbox first, then
        a drainer ships rows to the runtime. A reconnect just resumes draining —
        events queued during the outage are delivered once the link is back.
      </>,
      <>
        Workflow and job execution is durable on the runtime. After reconnect the
        runtime re-dispatches in-flight steps to the worker, which re-runs the
        handler graph. Completed steps are not re-executed.
      </>,
      <>
        In-flight RPC calls fail fast during the gap; retry them with{" "}
        <Mono>CallOpts.retry</Mono> or an <Mono>idempotencyKey</Mono>.
      </>,
    ],
    resumeTip:
      "You observe the cycle through events: reconnecting fires before each attempt, connected fires on the next Welcome. Subscribe with sb.on(...) to drive your own health checks.",
    resumeCode: `sb.on("reconnecting", ({ attempt, delayMs, reason }) => {
  console.warn(\`reconnect #\${attempt} in \${delayMs}ms — \${reason}\`);
});

sb.on("connected", ({ sessionId }) => {
  console.info(\`session up again: \${sessionId}\`);
});

sb.on("disconnected", ({ reason }) => {
  // reason === "exhausted" means reconnectAttempts ran out and the SDK stopped.
  console.error(\`disconnected: \${reason}\`);
});`,

    backoffTitle: "Backoff strategy",
    backoffP1:
      "Reconnect uses a fixed interval, not exponential backoff. After a drop the SDK waits reconnectIntervalMs, then tries again, up to reconnectAttempts times.",
    backoffP2:
      "When the attempt counter passes reconnectAttempts, the SDK emits disconnected with reason \"exhausted\" and calls stop() on itself. Set reconnectAttempts to 0 for an unlimited retry loop that never gives up.",
    backoffParams: {
      interval: "Delay between reconnect attempts.",
      attempts: 'Max attempts before disconnected{reason:"exhausted"} + auto-stop. 0 = unlimited.',
    },
    backoffCode: `const sb = new ServiceBridge("localhost:14445", key, {
  reconnectIntervalMs: 3000, // wait 3s between attempts
  reconnectAttempts: 0,      // 0 = retry forever, never auto-stop
});`,
    backoffNote:
      "Certificate rotation is a separate, scheduled path (RefreshCert ~30 min before expiry) and does add random jitter to spread thousands of clients across a window. That jitter applies to cert refresh, not to the reconnect loop.",

    positionTitle: "Where progress is tracked",
    positionP1:
      "Because the session is rebuilt on every reconnect, the SDK carries no per-session position cursor. Each stateful channel tracks its own progress so nothing is replayed twice after the link comes back:",
    positionTable: {
      outbox: "Per-row delivery state in the local SQLite outbox; the drainer advances past rows the runtime has acknowledged.",
      workflow: "Runtime-owned durable state. Step outputs are persisted, so re-dispatch after reconnect skips completed steps.",
      job: "Runtime-owned lease (leaseEpoch). Only the current lease holder runs a job; a stale instance after reconnect cannot double-fire.",
      idempotency: "Caller-supplied idempotencyKey on an RPC call lets the runtime dedup a replayed request within its TTL.",
    },
    positionCallout:
      "There is no PositionUpdate control message and no completed-command filter in the SDK. Progress is held by the outbox, the runtime, and your idempotency keys — each at its own boundary.",
  },
  ru: {
    badge: "Транспорт и отказоустойчивость",
    title: "Переподключение и возобновление",
    description:
      "Когда соединение control-plane обрывается, SDK заново выпускает сессию и автоматически продолжает работу. Переподключение — это цикл повторов с фиксированным интервалом; устойчивость живёт в outbox и в runtime, а не в токене воспроизведения сессии.",

    resumeTitle: "Возобновление при переподключении",
    resumeP1:
      "SDK держит одну mTLS-сессию к runtime: read-only поток Control.Open, который несёт кадры Welcome и Drain. Когда этот поток завершается или падает, SDK не пытается срастить старую сессию обратно. Он строит совершенно новую.",
    resumeP2: "Каждая попытка переподключения проходит тот же путь, что и первый connect:",
    resumeSteps: [
      "Заново выполнить Bootstrap.Provision и получить свежий leaf-сертификат и новый instanceId.",
      "Открыть новый mTLS-канал и новый server-поток Control.Open.",
      "Повторно отправить RegisterRequest (обработчики, подписки на события, объявленные зависимости, HTTP-эндпоинт).",
      "Перезапустить subscriber'ы событий / воркфлоу / заданий и telemetry-поток.",
    ],
    resumeP3:
      "Когда runtime отвечает кадром Welcome, SDK эмитит connected с новым sessionId, и работа возобновляется. Поскольку сессия не хранит состояние и строится заново, на уровне SDK нет токена возобновления, нет epoch-фенсинга и нет воспроизведения команд — этих понятий здесь не существует.",
    resumeWhyTitle: "Тогда почему ничего не теряется?",
    resumeWhyP:
      "Устойчивость держат те части, которые хранят состояние, а не сессия:",
    resumeWhyBullets: [
      <>
        <Mono>sb.event.publish()</Mono> сначала пишет в локальный SQLite-outbox, а
        затем drainer отправляет строки в runtime. Переподключение просто
        возобновляет слив — события, накопленные во время простоя, доставляются
        после восстановления связи.
      </>,
      <>
        Исполнение воркфлоу и заданий устойчиво на стороне runtime. После
        переподключения runtime повторно раздаёт незавершённые шаги воркеру,
        который заново прогоняет граф обработчиков. Завершённые шаги не
        выполняются повторно.
      </>,
      <>
        RPC-вызовы «в полёте» быстро падают на время разрыва; повторяйте их через{" "}
        <Mono>CallOpts.retry</Mono> или <Mono>idempotencyKey</Mono>.
      </>,
    ],
    resumeTip:
      "Цикл виден через события: reconnecting срабатывает перед каждой попыткой, connected — на следующем Welcome. Подпишитесь через sb.on(...), чтобы строить собственные health-проверки.",
    resumeCode: `sb.on("reconnecting", ({ attempt, delayMs, reason }) => {
  console.warn(\`reconnect #\${attempt} через \${delayMs}ms — \${reason}\`);
});

sb.on("connected", ({ sessionId }) => {
  console.info(\`сессия снова поднята: \${sessionId}\`);
});

sb.on("disconnected", ({ reason }) => {
  // reason === "exhausted" — попытки закончились, SDK остановлен.
  console.error(\`disconnected: \${reason}\`);
});`,

    backoffTitle: "Стратегия backoff",
    backoffP1:
      "Переподключение использует фиксированный интервал, а не экспоненциальный backoff. После разрыва SDK ждёт reconnectIntervalMs, затем пробует снова — до reconnectAttempts раз.",
    backoffP2:
      "Когда счётчик попыток превышает reconnectAttempts, SDK эмитит disconnected с reason \"exhausted\" и вызывает stop() сам на себе. Поставьте reconnectAttempts в 0, чтобы получить бесконечный цикл повторов, который никогда не сдаётся.",
    backoffParams: {
      interval: "Задержка между попытками переподключения.",
      attempts: 'Макс. попыток до disconnected{reason:"exhausted"} + авто-stop. 0 = без лимита.',
    },
    backoffCode: `const sb = new ServiceBridge("localhost:14445", key, {
  reconnectIntervalMs: 3000, // ждать 3с между попытками
  reconnectAttempts: 0,      // 0 = повторять вечно, без авто-остановки
});`,
    backoffNote:
      "Ротация сертификата — это отдельный плановый путь (RefreshCert примерно за 30 минут до истечения), и он действительно добавляет случайный jitter, чтобы размазать тысячи клиентов по окну. Этот jitter относится к ротации cert'а, а не к циклу переподключения.",

    positionTitle: "Где отслеживается прогресс",
    positionP1:
      "Поскольку сессия пересоздаётся при каждом переподключении, SDK не несёт курсор позиции в рамках сессии. Каждый канал с состоянием отслеживает свой прогресс сам, чтобы после восстановления связи ничего не воспроизводилось дважды:",
    positionTable: {
      outbox: "Состояние доставки по каждой строке в локальном SQLite-outbox; drainer продвигается мимо строк, подтверждённых runtime.",
      workflow: "Устойчивое состояние на стороне runtime. Выходы шагов сохраняются, поэтому повторная раздача после переподключения пропускает завершённые шаги.",
      job: "Lease на стороне runtime (leaseEpoch). Задание выполняет только текущий держатель lease; устаревший инстанс после переподключения не сработает дважды.",
      idempotency: "Переданный вызывающим idempotencyKey на RPC-вызове позволяет runtime дедуплицировать повторённый запрос в пределах его TTL.",
    },
    positionCallout:
      "В SDK нет control-сообщения PositionUpdate и нет фильтра завершённых команд. Прогресс держат outbox, runtime и ваши ключи идемпотентности — каждый на своей границе.",
  },
};

export function PageReconnectResume() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="resume-protocol">{t.resumeTitle}</H2>
      <P>{t.resumeP1}</P>
      <P>{t.resumeP2}</P>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        {t.resumeSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <P>{t.resumeP3}</P>
      <P>
        <strong>{t.resumeWhyTitle}</strong> {t.resumeWhyP}
      </P>
      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground my-3">
        {t.resumeWhyBullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <Callout type="tip">{t.resumeTip}</Callout>
      <MultiCodeBlock code={{ ts: t.resumeCode }} />

      <H2 id="backoff">{t.backoffTitle}</H2>
      <P>{t.backoffP1}</P>
      <ParamTable
        rows={[
          {
            name: "reconnectIntervalMs",
            type: "number",
            default: "3000",
            desc: t.backoffParams.interval,
          },
          {
            name: "reconnectAttempts",
            type: "number",
            default: "3",
            desc: t.backoffParams.attempts,
          },
        ]}
      />
      <P>{t.backoffP2}</P>
      <MultiCodeBlock code={{ ts: t.backoffCode }} />
      <Callout type="info">{t.backoffNote}</Callout>

      <H2 id="position-update">{t.positionTitle}</H2>
      <P>{t.positionP1}</P>
      <ParamTable
        rows={[
          { name: "event outbox", type: "SQLite", default: "—", desc: t.positionTable.outbox },
          { name: "workflow run", type: "runtime", default: "—", desc: t.positionTable.workflow },
          { name: "job lease", type: "leaseEpoch", default: "—", desc: t.positionTable.job },
          { name: "idempotencyKey", type: "CallOpts", default: '""', desc: t.positionTable.idempotency },
        ]}
      />
      <Callout type="info">{t.positionCallout}</Callout>
    </div>
  );
}

export default PageReconnectResume;
