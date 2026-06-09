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
    badge: "Transport & Resilience",
    title: "Config Push",
    description:
      "The runtime keeps a live stream open to every worker and pushes config changes over it. The SDK applies them in place — no reconnect, no restart.",

    whatIsTitle: "What config push is",
    whatIsP1:
      "When you call start(), the SDK opens a long-lived gRPC stream to the runtime called RegisterAndWatch. The SDK sends one register request describing this worker; the runtime answers with a snapshot and then keeps the stream open, sending an update every time something the worker cares about changes.",
    whatIsP2:
      "There is no separate control channel and no polling. The same stream that registers your handlers is the one that pushes config down. You never call a refresh method — the SDK applies each frame as it arrives and exposes the current state through accessors on the client.",
    whatIsNote:
      "The runtime is the single source of truth. The SDK never invents config locally — it only reflects what the runtime pushes.",

    whatCanBePushedTitle: "What gets pushed",
    whatCanBePushedP:
      "Each frame is either a full snapshot (sent first, and again after a reconnect) or an incremental update. Both carry the same four kinds of data:",
    rowServiceMapName: "Service map",
    rowServiceMapDesc:
      "Visible methods and live instances of the services this worker is allowed to reach. Surfaced via sb.serviceMap().",
    rowPeersName: "Peers",
    rowPeersDesc:
      "Added or removed peers. When a peer leaves the worker's policy scope, the SDK drops its cached entries and closes stale direct connections.",
    rowPolicyName: "Policy evaluation",
    rowPolicyDesc:
      "The current access policy for this worker. Surfaced via sb.policyEvaluation(); warnings raise policy_violation.",
    rowCaptureName: "Capture modes",
    rowCaptureDesc:
      "Per-channel payload capture mode (rpc / http / event / workflow). Surfaced via sb.telemetry.captureModeForChannel(channel).",

    exampleTitle: "Reading pushed config",
    exampleP:
      "You don't subscribe to the stream yourself — you read the latest pushed state through the client. These accessors always return the most recent value the runtime sent.",
    captureP:
      "Payload capture is decided entirely by the runtime and pushed per channel (rpc, http, event, workflow). The SDK applies it automatically — you do not wire it up. Every channel stays at none until the runtime pushes a mode, so a worker never records a payload the runtime hasn't authorised.",
    captureNote:
      "Jobs carry no payload, so there is no job capture channel. A per-handler captureMode on an RPC handler can only narrow the runtime mode (none < errors < all), never widen it.",

    applyOrderTitle: "How updates are applied",
    applyOrderP:
      "A snapshot replaces the cached state wholesale; an update applies precise add/remove operations on top of it. Applying a frame never interrupts work in flight — a running RPC call or workflow step keeps its current behaviour, and the new config takes effect for the next operation.",
    applyOrderBullet1:
      "Policy change → the new evaluation is stored; any new warning emits policy_violation. With failOnPolicyViolation, a warning makes start() surface disconnected (reason policy) and stop.",
    applyOrderBullet2:
      "Capture mode change → the next captured op uses the new per-channel mode immediately.",
    applyOrderBullet3:
      "Peer removed → cached methods, instances, subscriptions and outgoing calls tied to that peer are dropped, and stale direct connections are closed.",
    applyOrderNote:
      "After a reconnect the runtime sends a fresh snapshot, so the worker re-syncs to current config without you doing anything.",
  },
  ru: {
    badge: "Транспорт и отказоустойчивость",
    title: "Config Push",
    description:
      "Runtime держит с каждым воркером живой стрим и шлёт по нему изменения конфигурации. SDK применяет их на месте — без переподключения и перезапуска.",

    whatIsTitle: "Что такое config push",
    whatIsP1:
      "При вызове start() SDK открывает к runtime долгоживущий gRPC-стрим RegisterAndWatch. SDK отправляет один register-запрос с описанием воркера; runtime отвечает снимком (snapshot) и держит стрим открытым, присылая обновление каждый раз, когда меняется то, что важно воркеру.",
    whatIsP2:
      "Отдельного управляющего канала нет, опроса (polling) тоже нет. Тот же стрим, что регистрирует ваши хендлеры, присылает и конфигурацию. Метода «обновить» вы не вызываете: SDK применяет каждый фрейм по мере прихода и отдаёт текущее состояние через геттеры на клиенте.",
    whatIsNote:
      "Runtime — единственный источник истины. SDK не придумывает конфигурацию локально, он лишь отражает то, что прислал runtime.",

    whatCanBePushedTitle: "Что приходит по стриму",
    whatCanBePushedP:
      "Каждый фрейм — это либо полный снимок (приходит первым и снова после переподключения), либо инкрементальное обновление. Оба несут одни и те же четыре вида данных:",
    rowServiceMapName: "Карта сервисов",
    rowServiceMapDesc:
      "Видимые методы и живые инстансы сервисов, к которым этому воркеру разрешён доступ. Доступ через sb.serviceMap().",
    rowPeersName: "Пиры",
    rowPeersDesc:
      "Добавленные или удалённые пиры. Когда пир выходит из policy-scope воркера, SDK сбрасывает его кеш и закрывает устаревшие прямые соединения.",
    rowPolicyName: "Оценка политики",
    rowPolicyDesc:
      "Текущая access-политика воркера. Доступ через sb.policyEvaluation(); предупреждения поднимают policy_violation.",
    rowCaptureName: "Режимы захвата",
    rowCaptureDesc:
      "Режим захвата payload по каналам (rpc / http / event / workflow). Доступ через sb.telemetry.captureModeForChannel(channel).",

    exampleTitle: "Чтение присланной конфигурации",
    exampleP:
      "Вы не подписываетесь на стрим сами — вы читаете последнее присланное состояние через клиент. Эти геттеры всегда возвращают самое свежее значение, которое прислал runtime.",
    captureP:
      "Захват payload решает целиком runtime и шлёт его по каналам (rpc, http, event, workflow). SDK применяет это автоматически — настраивать вручную не нужно. Каждый канал остаётся в none, пока runtime не пришлёт режим, поэтому воркер никогда не пишет payload, который runtime не разрешил.",
    captureNote:
      "У джоб нет payload, поэтому канала захвата для джоб нет. Per-handler captureMode на RPC-хендлере может только сузить режим runtime (none < errors < all), но не расширить.",

    applyOrderTitle: "Как применяются обновления",
    applyOrderP:
      "Снимок заменяет кешированное состояние целиком; обновление накладывает точечные add/remove поверх него. Применение фрейма никогда не прерывает текущую работу — идущий RPC-вызов или шаг workflow сохраняет своё поведение, а новая конфигурация вступает в силу для следующей операции.",
    applyOrderBullet1:
      "Смена политики → новая оценка сохраняется; любое новое предупреждение поднимает policy_violation. При failOnPolicyViolation предупреждение приводит к disconnected (причина policy) и остановке start().",
    applyOrderBullet2:
      "Смена режима захвата → следующая захватываемая операция сразу использует новый режим канала.",
    applyOrderBullet3:
      "Удаление пира → кеш методов, инстансов, подписок и исходящих вызовов этого пира сбрасывается, устаревшие прямые соединения закрываются.",
    applyOrderNote:
      "После переподключения runtime присылает свежий снимок, поэтому воркер пересинхронизируется с текущей конфигурацией сам, без ваших действий.",
  },
};

export function PageConfigPush() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="what-is-configpush">{t.whatIsTitle}</H2>
      <P>{t.whatIsP1}</P>
      <P>{t.whatIsP2}</P>
      <Callout type="info">{t.whatIsNote}</Callout>

      <H2 id="what-can-be-pushed">{t.whatCanBePushedTitle}</H2>
      <P>{t.whatCanBePushedP}</P>
      <ParamTable
        rows={[
          { name: t.rowServiceMapName, type: "—", desc: t.rowServiceMapDesc },
          { name: t.rowPeersName, type: "—", desc: t.rowPeersDesc },
          { name: t.rowPolicyName, type: "—", desc: t.rowPolicyDesc },
          { name: t.rowCaptureName, type: "—", desc: t.rowCaptureDesc },
        ]}
      />

      <H2 id="config-example">{t.exampleTitle}</H2>
      <P>{t.exampleP}</P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICE_KEY!);
await sb.start();

// Live service map pushed by the runtime — methods + instances per service.
for (const [name, entry] of sb.serviceMap()) {
  console.log(name, entry.instances.length, "instance(s)");
}

// Current access policy for this worker (null before the first snapshot).
const policy = sb.policyEvaluation();
console.log("policy warnings:", policy?.warnings.length ?? 0);

// React to policy changing live.
sb.on("policy_violation", (v) => {
  console.warn("policy denied", v.declaration, v.reason);
});`,
        }}
      />

      <H3>{t.rowCaptureName}</H3>
      <P>{t.captureP}</P>
      <Callout type="info">{t.captureNote}</Callout>

      <H2 id="apply-order">{t.applyOrderTitle}</H2>
      <P>{t.applyOrderP}</P>
      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <Mono>policy_violation</Mono> — {t.applyOrderBullet1}
        </li>
        <li>{t.applyOrderBullet2}</li>
        <li>{t.applyOrderBullet3}</li>
      </ul>
      <Callout type="tip">{t.applyOrderNote}</Callout>
    </div>
  );
}

export default PageConfigPush;
