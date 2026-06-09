import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  H3,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "Service Keys & RBAC",
    description:
      "Every service authenticates with a bootstrap key and gets a per-service access policy: seven capability flags plus optional egress/acceptance rules. The runtime enforces them; the SDK surfaces violations.",
    intro:
      "You mint a service key with the sbkey-gen CLI and pass it to the ServiceBridge constructor. The runtime is the only authority: it owns the policy in Postgres and gates every register, call, publish, and run.",

    keyTitle: "Bootstrap key",
    keyP1:
      "A key is a single string of the form sb.<base64url>. It encodes the key id, a secret, and the CA cert, so the SDK can build an mTLS channel without a separate trust step. Generate one with sbkey-gen against the runtime's Postgres:",
    keyP2:
      "stdout is exactly the key line, nothing else, so you can pipe it straight into your secret store. Pass the runtime url and the key to the constructor:",
    keyCallout:
      "Keys start with the sb. prefix. There are no header-based keys: the SDK presents the key over mTLS during the gRPC handshake, never as an HTTP header.",

    capsTitle: "Capabilities",
    capsP1:
      "Each service carries seven boolean capability flags. They are coarse kill-switches: a disabled flag denies that operation regardless of any finer rule. Four are acceptance-side (registering a handler of that type), three are egress-side (sending at all). All default to on after sbkey-gen. The Type column below shows the side.",
    capRows: [
      { name: "rpc.handle", side: "acceptance", desc: "Register RPC handlers (sb.rpc.handle)" },
      { name: "event.handle", side: "acceptance", desc: "Subscribe to events (sb.event.handle)" },
      { name: "workflow.handle", side: "acceptance", desc: "Register workflow definitions (sb.workflow.handle)" },
      { name: "job.handle", side: "acceptance", desc: "Register jobs (sb.job.handle). Jobs are self-only: no egress, no external caller" },
      { name: "rpc.call", side: "egress", desc: "Call RPC on other services (sb.rpc.call)" },
      { name: "event.publish", side: "egress", desc: "Publish events (sb.event.publish)" },
      { name: "workflow.run", side: "egress", desc: "Start workflows on other services (sb.workflow.start)" },
    ],

    capsDisable:
      "Disable acceptance capabilities at key-creation time with -no-cap (comma-separated). Only the four *.handle flags can be disabled this way:",

    policyTitle: "Granular policy",
    policyP1:
      'Beyond the coarse flags, a service can carry fine-grained rules in two directions. Egress rules say what this service may send; acceptance rules say who may address it. Both live in one table and are set per service.',
    policyDefaultAllow:
      "Default-allow: if a service has no rules for a given (direction, action), that action is allowed. A fresh key can do everything; you add rules to restrict.",
    policyBilateral:
      "An RPC call is checked on both sides: the caller must be allowed to send (rpc.call to that target) and the callee must be allowed to accept (rpc.handle from that caller). Both must allow. workflow.run / workflow.handle work the same way. event.publish checks only the egress side, since events have no per-service routing.",
    policyKindsTitle: "Rule kinds",
    egressHead: "Egress rules (direction E) — what I may send. The Type column is the target form:",
    egressRows: [
      { name: "rpc.call", target: "peer/method", desc: "Call this method on this peer service" },
      { name: "workflow.run", target: "peer/workflow", desc: "Start this workflow on this peer service" },
      { name: "event.publish", target: "pattern", desc: "Publish events matching this AMQP pattern (no peer)" },
    ],
    acceptHead: "Acceptance rules (direction A) — who may address me:",
    acceptRows: [
      { name: "rpc.handle", target: "peer/method", desc: "This peer may call my method" },
      { name: "workflow.handle", target: "peer/workflow", desc: "This peer may run my workflow" },
      { name: "event.handle", target: "pattern", desc: "I may subscribe to this AMQP pattern (no peer)" },
    ],
    wildcardP:
      "Event patterns use AMQP wildcards: * matches exactly one segment, # matches zero or more. A subscription pattern P is accepted only if some acceptance rule R contains it (P ⊆ R).",

    sdkTitle: "SDK side: violations",
    sdkP1:
      "The SDK never sets policy — that is the operator's job. What it does is surface what the runtime decides. On the first registry snapshot the runtime sends a PolicyEvaluation; the SDK logs each violation and emits a policy_violation event:",
    sdkP2:
      "For strict environments set failOnPolicyViolation: true — any warning in the first snapshot makes start() stop the service (disconnected, reason starts with \"policy:\") instead of running degraded.",
    sdkP3:
      "Read the last evaluation at any time with sb.policyEvaluation() — it returns the capabilities, your egress/acceptance rules, and warnings, or null before the first snapshot.",
    sdkRuntimeErr:
      "A denied call rejects at the runtime: sb.rpc.call throws RpcAccessDeniedError, sb.workflow.start throws WorkflowAccessDeniedError. A denied publish is fire-and-forget into the local outbox, so it does not throw — the outbox row is marked failed and policy_violation fires with denySide: 'self_egress'.",

    exampleTitle: "Example: locked-down payments key",
    exampleP1:
      "Create a payments service that may only be called by analytics, may publish only payments.* events, and may not register workflows or jobs:",
    exampleP2:
      "This key keeps rpc.handle and event.handle on, disables workflow.handle and job.handle, restricts publishing to the payments.* pattern, and accepts RPC only from analytics on the charge method. Everything else is denied at the runtime.",
    exampleEditP:
      "Policy is editable live with the sb-policy CLI; changes apply in under a second via Postgres NOTIFY, no restart needed:",
  },
  ru: {
    badge: "Production",
    title: "Сервисные ключи и RBAC",
    description:
      "Каждый сервис аутентифицируется bootstrap-ключом и получает свою политику доступа: семь capability-флагов плюс опциональные egress/acceptance-правила. Применяет их runtime; SDK показывает нарушения.",
    intro:
      "Ключ сервиса вы создаёте утилитой sbkey-gen и передаёте в конструктор ServiceBridge. Единственный авторитет — runtime: он держит политику в Postgres и гейтит каждую регистрацию, вызов, публикацию и запуск.",

    keyTitle: "Bootstrap-ключ",
    keyP1:
      "Ключ — одна строка вида sb.<base64url>. В ней закодированы id ключа, секрет и CA-сертификат, поэтому SDK строит mTLS-канал без отдельного шага доверия. Сгенерируйте ключ через sbkey-gen в Postgres рантайма:",
    keyP2:
      "В stdout уходит ровно строка ключа и ничего больше, поэтому её можно сразу положить в ваш secret store. Передайте url рантайма и ключ в конструктор:",
    keyCallout:
      "Ключи начинаются с префикса sb. Ключей через HTTP-заголовок нет: SDK предъявляет ключ по mTLS во время gRPC-рукопожатия, а не как HTTP-заголовок.",

    capsTitle: "Возможности",
    capsP1:
      "У каждого сервиса семь булевых capability-флагов. Это грубые kill-switch: выключенный флаг денит операцию независимо от любых тонких правил. Четыре — acceptance-сторона (регистрация хендлера этого типа), три — egress-сторона (отправка в принципе). После sbkey-gen все включены. В колонке Type ниже указана сторона.",
    capRows: [
      { name: "rpc.handle", side: "acceptance", desc: "Регистрация RPC-хендлеров (sb.rpc.handle)" },
      { name: "event.handle", side: "acceptance", desc: "Подписка на события (sb.event.handle)" },
      { name: "workflow.handle", side: "acceptance", desc: "Регистрация определений воркфлоу (sb.workflow.handle)" },
      { name: "job.handle", side: "acceptance", desc: "Регистрация задач (sb.job.handle). Задачи self-only: без egress и без внешнего вызывающего" },
      { name: "rpc.call", side: "egress", desc: "Вызов RPC других сервисов (sb.rpc.call)" },
      { name: "event.publish", side: "egress", desc: "Публикация событий (sb.event.publish)" },
      { name: "workflow.run", side: "egress", desc: "Запуск воркфлоу на других сервисах (sb.workflow.start)" },
    ],

    capsDisable:
      "Acceptance-возможности отключаются при создании ключа флагом -no-cap (через запятую). Так отключаются только четыре *.handle-флага:",

    policyTitle: "Гранулярная политика",
    policyP1:
      "Поверх грубых флагов сервис может нести тонкие правила в двух направлениях. Egress-правила говорят, что этот сервис может отправлять; acceptance-правила — кто может его адресовать. Оба лежат в одной таблице и задаются по сервису.",
    policyDefaultAllow:
      "Default-allow: если у сервиса нет правил для пары (direction, action), это действие разрешено. Свежий ключ может всё; правила вы добавляете, чтобы ограничить.",
    policyBilateral:
      "RPC-вызов проверяется с обеих сторон: вызывающему должно быть разрешено отправить (rpc.call к этому target), а вызываемому — принять (rpc.handle от этого caller'а). Оба должны разрешать. workflow.run / workflow.handle устроены так же. event.publish проверяет только egress-сторону, потому что у событий нет per-service маршрутизации.",
    policyKindsTitle: "Виды правил",
    egressHead: "Egress-правила (direction E) — что я могу отправлять. В колонке Type — форма target:",
    egressRows: [
      { name: "rpc.call", target: "peer/method", desc: "Вызвать этот метод на этом сервисе-пире" },
      { name: "workflow.run", target: "peer/workflow", desc: "Запустить этот воркфлоу на этом сервисе-пире" },
      { name: "event.publish", target: "pattern", desc: "Публиковать события под этот AMQP-паттерн (без peer)" },
    ],
    acceptHead: "Acceptance-правила (direction A) — кто может меня адресовать:",
    acceptRows: [
      { name: "rpc.handle", target: "peer/method", desc: "Этот пир может вызвать мой метод" },
      { name: "workflow.handle", target: "peer/workflow", desc: "Этот пир может запустить мой воркфлоу" },
      { name: "event.handle", target: "pattern", desc: "Я могу подписаться на этот AMQP-паттерн (без peer)" },
    ],
    wildcardP:
      "Паттерны событий используют AMQP-wildcards: * — ровно один сегмент, # — ноль или более. Паттерн подписки P принимается, только если какое-то acceptance-правило R его накрывает (P ⊆ R).",

    sdkTitle: "Сторона SDK: нарушения",
    sdkP1:
      "SDK никогда не задаёт политику — это работа оператора. Он показывает то, что решает runtime. В первом снапшоте реестра runtime присылает PolicyEvaluation; SDK логирует каждое нарушение и эмитит событие policy_violation:",
    sdkP2:
      "Для строгих окружений ставьте failOnPolicyViolation: true — любое предупреждение в первом снапшоте заставит start() остановить сервис (disconnected, reason начинается с «policy:») вместо работы в деградированном режиме.",
    sdkP3:
      "Последнюю оценку можно прочитать в любой момент через sb.policyEvaluation() — она вернёт capabilities, ваши egress/acceptance-правила и warnings, либо null до первого снапшота.",
    sdkRuntimeErr:
      "Заденённый вызов реджектится в рантайме: sb.rpc.call бросает RpcAccessDeniedError, sb.workflow.start — WorkflowAccessDeniedError. Заденённая публикация — fire-and-forget в локальный outbox, поэтому исключения нет: строка outbox помечается failed, а policy_violation эмитится с denySide: 'self_egress'.",

    exampleTitle: "Пример: ключ payments с ограничениями",
    exampleP1:
      "Создадим сервис payments, который может вызывать только analytics, публиковать только события payments.* и не может регистрировать воркфлоу и задачи:",
    exampleP2:
      "Этот ключ оставляет rpc.handle и event.handle включёнными, отключает workflow.handle и job.handle, ограничивает публикацию паттерном payments.* и принимает RPC только от analytics на метод charge. Всё остальное денится в рантайме.",
    exampleEditP:
      "Политика редактируется на лету через CLI sb-policy; изменения вступают в силу меньше чем за секунду через Postgres NOTIFY, без перезапуска:",
  },
};

const KEY_GEN = `go run ./cmd/sbkey-gen \\
  -name=payments \\
  -ca-cert=./certs/ca.crt \\
  -ca-key=./certs/ca.key \\
  -dsn="postgres://servicebridge:servicebridge@localhost:5433/servicebridge"`;

const KEY_CONSTRUCT = `import { ServiceBridge } from "servicebridge";

const sb = new ServiceBridge(
  "localhost:14445", // gRPC control plane
  serviceKey,        // the sb.<...> string from sbkey-gen
);
await sb.start();`;

const NO_CAP = `go run ./cmd/sbkey-gen \\
  -name=payments \\
  -ca-cert=./certs/ca.crt -ca-key=./certs/ca.key \\
  -dsn="postgres://..." \\
  -no-cap=workflow.handle,job.handle`;

const POLICY_VIOLATION = `sb.on("policy_violation", ({ declaration, value, denySide, reason }) => {
  // declaration: "rpc.call" | "rpc.handle" | "event.publish"
  //            | "event.handle" | "workflow.run" | "workflow.handle"
  // value:      "payments/charge" | "orders.*" | ...
  // denySide:   "capability" | "self_egress" | "self_acceptance" | "peer_acceptance"
  // reason:     human-readable explanation from the runtime
  console.warn("policy:", declaration, value, reason);
});`;

const FAIL_ON = `const sb = new ServiceBridge(url, key, {
  failOnPolicyViolation: true,
});

sb.on("disconnected", ({ reason, error }) => {
  if (reason.startsWith("policy:")) {
    console.error("policy violations on start:", error);
    process.exit(1);
  }
});

await sb.start();`;

const EXAMPLE_GEN = `go run ./cmd/sbkey-gen \\
  -name=payments \\
  -ca-cert=./certs/ca.crt -ca-key=./certs/ca.key \\
  -dsn="postgres://..." \\
  -no-cap=workflow.handle,job.handle \\
  -allow-action='event.publish:payments.*' \\
  -allow-acceptance='rpc.handle:analytics/charge'`;

const SB_POLICY = `# inspect current policy
sb-policy show --dsn=... --service=payments

# add an egress rule (this service may call analytics/track)
sb-policy action add --dsn=... --service=payments \\
  --kind=rpc.call --target=analytics/track

# add an acceptance rule (api-gateway may call my charge method)
sb-policy acceptance add --dsn=... --service=payments \\
  --kind=rpc.handle --caller=api-gateway --method=charge`;

export function PageServiceKeys() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>{t.intro}</P>

      <H2 id="capabilities">{t.capsTitle}</H2>

      <H3 id="bootstrap-key">{t.keyTitle}</H3>
      <P>{t.keyP1}</P>
      <DocCodeBlock code={KEY_GEN} lang="bash" />
      <P>{t.keyP2}</P>
      <MultiCodeBlock code={{ ts: KEY_CONSTRUCT }} />
      <Callout type="info">{t.keyCallout}</Callout>

      <H3 id="capability-flags">{t.capsTitle}</H3>
      <P>{t.capsP1}</P>
      <ParamTable
        rows={t.capRows.map((r) => ({ name: r.name, type: r.side, desc: r.desc }))}
      />
      <P>{t.capsDisable}</P>
      <DocCodeBlock code={NO_CAP} lang="bash" />

      <H2 id="policy">{t.policyTitle}</H2>
      <P>{t.policyP1}</P>
      <Callout type="info">{t.policyDefaultAllow}</Callout>
      <P>{t.policyBilateral}</P>

      <H3 id="rule-kinds">{t.policyKindsTitle}</H3>
      <P>{t.egressHead}</P>
      <ParamTable rows={t.egressRows.map((r) => ({ name: r.name, type: r.target, desc: r.desc }))} />
      <P>{t.acceptHead}</P>
      <ParamTable rows={t.acceptRows.map((r) => ({ name: r.name, type: r.target, desc: r.desc }))} />
      <Callout type="info">{t.wildcardP}</Callout>

      <H3 id="sdk-violations">{t.sdkTitle}</H3>
      <P>{t.sdkP1}</P>
      <MultiCodeBlock code={{ ts: POLICY_VIOLATION }} />
      <P>{t.sdkP2}</P>
      <MultiCodeBlock code={{ ts: FAIL_ON }} />
      <P>{t.sdkP3}</P>
      <Callout type="warning">{t.sdkRuntimeErr}</Callout>

      <H2 id="key-example">{t.exampleTitle}</H2>
      <P>{t.exampleP1}</P>
      <DocCodeBlock code={EXAMPLE_GEN} lang="bash" />
      <P>{t.exampleP2}</P>
      <P>{t.exampleEditP}</P>
      <DocCodeBlock code={SB_POLICY} lang="bash" />
    </div>
  );
}
