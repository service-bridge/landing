import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Transport & Resilience",
    title: "Instance Selection & Load Balancing",
    description:
      "When a service has several connected instances, the caller SDK picks one per call using Power-of-Two-Choices, a per-instance circuit breaker, and runtime health hints. Selection is automatic — there is nothing to configure.",

    howItWorksTitle: "How It Works",
    howItWorksP1:
      "Each instance of a service opens its own control-plane session and advertises a call endpoint. The caller SDK keeps a live registry snapshot, so for any call it already knows every connected instance of the target service.",
    howItWorksP2:
      "On each call the load balancer uses Power-of-Two-Choices (P2C): it samples two eligible instances at random and routes to the one with fewer in-flight requests. With one eligible instance it routes there directly. This keeps load even without a central coordinator.",
    howItWorksP3:
      "Eligibility is filtered before P2C runs. An instance is dropped from the pool when it has no call endpoint, when its local circuit breaker is OPEN, or when the runtime marked it unhealthy recently. There is no availability-zone, region, or weight concept — every healthy instance is an equal candidate.",
    howItWorksNote:
      "Selection happens entirely inside the caller SDK. Each caller tracks in-flight counts and circuit-breaker state for its own process; instances are not coordinated across callers — cross-caller coherence comes from the runtime health hint, not shared state.",

    configTitle: "Configuration",
    configP1:
      "There are no zone, region, or weight knobs to set. Load balancing is on by default and applies to every multi-instance call. The only call-level lever is the transport mode, which decides how the chosen instance is reached, not which instance is chosen.",
    configTransportRows: [
      { name: '"auto"', type: "default", default: "—", desc: "Direct mTLS to the instance if its endpoint is known, otherwise proxy through the runtime." },
      { name: '"direct"', type: "transport", default: "—", desc: "Caller connects to the instance over mTLS; fails if the instance has no call endpoint." },
      { name: '"proxy"', type: "transport", default: "—", desc: "Call is forwarded through the runtime Invoke path." },
    ],
    configP2Before: "Set it per call via",
    configP2After: ", or globally via",
    configP2End: "on the constructor.",
    configCb: "Circuit-breaker and health-hint thresholds are internal constants, not user settings:",
    cbRows: [
      { name: "window", type: "constant", default: "10s", desc: "Sliding window the breaker measures error rate over (10 buckets of 1s)." },
      { name: "min requests", type: "constant", default: "10", desc: "Minimum requests in the window before the breaker can open." },
      { name: "error rate", type: "constant", default: "> 0.5", desc: "Above this rate over the window the breaker trips to OPEN." },
      { name: "open duration", type: "constant", default: "30s", desc: "How long OPEN lasts before a single HALF_OPEN probe is allowed." },
      { name: "health hint TTL", type: "constant", default: "60s (60000 ms)", desc: "How long a runtime unhealthy hint is trusted before it is treated as stale." },
    ],

    fallbackTitle: "Fallback",
    fallbackP1:
      "Filtering and selection degrade gracefully without any manual fallback config.",
    fallbackP2:
      "While an instance's circuit breaker is OPEN it is excluded, and traffic spreads across the remaining healthy instances. After the open duration the breaker moves to HALF_OPEN and lets one probe call through; a success closes it, a failure re-opens it.",
    fallbackP3Before: "A runtime unhealthy hint also drops an instance, but only for ",
    fallbackP3After:
      ". If the runtime itself is unreliable the hint goes stale and the caller's local circuit breaker carries the routing decision instead.",
    fallbackWarn:
      "If every instance is filtered out — no endpoint, all breakers OPEN, all hinted unhealthy — the call throws NoLiveInstanceError. That is a real signal that the target service has no reachable instance, not something to silence.",

    multiTitle: "Multi-Runtime",
    multiP1:
      "ServiceBridge runs exactly one runtime instance — that is an architectural axiom, not a tunable. The runtime is the single source of truth for state in PostgreSQL, so there is no multi-runtime, multi-region, or per-zone runtime topology to configure.",
    multiP2:
      "Horizontal scaling lives on the SDK side: you run many instances of your service, all connected to the same runtime. Load balancing across those instances is exactly what the sections above describe. Scaling out means starting more instances, not more runtimes.",
    multiNote:
      "Because identity is per service key, every started instance of the same service joins the same pool automatically. Start, stop, or crash an instance and the registry snapshot updates; the load balancer simply stops picking instances that are gone.",
  },
  ru: {
    badge: "Транспорт и устойчивость",
    title: "Выбор инстанса и балансировка",
    description:
      "Когда у сервиса несколько подключённых инстансов, SDK вызывающей стороны выбирает один на каждый вызов через Power-of-Two-Choices, per-instance circuit breaker и health-подсказки от runtime. Выбор автоматический — настраивать нечего.",

    howItWorksTitle: "Как работает",
    howItWorksP1:
      "Каждый инстанс сервиса открывает собственную сессию control-plane и публикует свой call-endpoint. SDK вызывающей стороны держит живой снимок реестра, поэтому для любого вызова уже знает все подключённые инстансы целевого сервиса.",
    howItWorksP2:
      "На каждый вызов балансировщик применяет Power-of-Two-Choices (P2C): случайно берёт два подходящих инстанса и направляет вызов туда, где меньше запросов в полёте. Если подходящий инстанс один — идёт прямо к нему. Так нагрузка остаётся равномерной без центрального координатора.",
    howItWorksP3:
      "Отбор кандидатов происходит до P2C. Инстанс исключается из пула, если у него нет call-endpoint, его локальный circuit breaker в состоянии OPEN или runtime недавно пометил его нездоровым. Понятий зоны доступности, региона и весов нет — каждый здоровый инстанс равноправный кандидат.",
    howItWorksNote:
      "Выбор целиком происходит внутри SDK вызывающей стороны. Каждый вызывающий процесс ведёт собственные счётчики запросов в полёте и состояние circuit breaker; между вызывающими они не синхронизируются — согласованность даёт health-подсказка runtime, а не общее состояние.",

    configTitle: "Конфигурация",
    configP1:
      "Нет настроек зоны, региона или весов. Балансировка включена по умолчанию и применяется к каждому вызову с несколькими инстансами. Единственный рычаг на уровне вызова — режим транспорта, и он решает, как добраться до выбранного инстанса, а не какой инстанс выбрать.",
    configTransportRows: [
      { name: '"auto"', type: "default", default: "—", desc: "Прямой mTLS к инстансу, если его endpoint известен, иначе proxy через runtime." },
      { name: '"direct"', type: "transport", default: "—", desc: "Вызывающий идёт к инстансу по mTLS; падает, если у инстанса нет call-endpoint." },
      { name: '"proxy"', type: "transport", default: "—", desc: "Вызов проходит через путь Invoke в runtime." },
    ],
    configP2Before: "Задаётся на вызов через",
    configP2After: ", либо глобально через",
    configP2End: "в конструкторе.",
    configCb: "Пороги circuit breaker и health-подсказок — внутренние константы, не пользовательские настройки:",
    cbRows: [
      { name: "окно", type: "constant", default: "10s", desc: "Скользящее окно, по которому breaker считает долю ошибок (10 корзин по 1s)." },
      { name: "минимум запросов", type: "constant", default: "10", desc: "Минимум запросов в окне, прежде чем breaker может открыться." },
      { name: "доля ошибок", type: "constant", default: "> 0.5", desc: "Выше этой доли по окну breaker переходит в OPEN." },
      { name: "длительность OPEN", type: "constant", default: "30s", desc: "Сколько длится OPEN до одного пробного вызова HALF_OPEN." },
      { name: "TTL health-подсказки", type: "constant", default: "60s (60000 мс)", desc: "Сколько подсказке runtime о нездоровье доверяют, прежде чем считать её устаревшей." },
    ],

    fallbackTitle: "Резервный вариант",
    fallbackP1:
      "Отбор и выбор деградируют плавно без какой-либо ручной настройки fallback.",
    fallbackP2:
      "Пока circuit breaker инстанса в OPEN, он исключён, и трафик распределяется по остальным здоровым инстансам. После длительности OPEN breaker переходит в HALF_OPEN и пропускает один пробный вызов; успех закрывает его, ошибка снова открывает.",
    fallbackP3Before: "Health-подсказка runtime тоже исключает инстанс, но только на ",
    fallbackP3After:
      ". Если сам runtime ненадёжен, подсказка устаревает, и решение о маршрутизации берёт на себя локальный circuit breaker вызывающей стороны.",
    fallbackWarn:
      "Если отфильтрованы все инстансы — нет endpoint, все breaker в OPEN, все помечены нездоровыми — вызов бросает NoLiveInstanceError. Это настоящий сигнал, что у целевого сервиса нет достижимого инстанса, а не то, что нужно глушить.",

    multiTitle: "Несколько runtime",
    multiP1:
      "ServiceBridge запускает ровно один экземпляр runtime — это архитектурная аксиома, а не настройка. Runtime — единственный источник истины по состоянию в PostgreSQL, поэтому конфигурации с несколькими runtime, регионами или per-zone топологией не существует.",
    multiP2:
      "Горизонтальное масштабирование живёт на стороне SDK: вы запускаете много инстансов своего сервиса, все подключены к одному runtime. Балансировка между ними — ровно то, что описано в разделах выше. Масштабироваться вширь — значит запускать больше инстансов, а не больше runtime.",
    multiNote:
      "Поскольку identity привязана к ключу сервиса, каждый запущенный инстанс одного сервиса автоматически входит в общий пул. Запустите, остановите или уроните инстанс — снимок реестра обновится, и балансировщик просто перестанет выбирать исчезнувшие инстансы.",
  },
};

export function PageZoneAware() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="how-it-works">{t.howItWorksTitle}</H2>
      <P>{t.howItWorksP1}</P>
      <P>{t.howItWorksP2}</P>
      <P>{t.howItWorksP3}</P>
      <Callout type="info">{t.howItWorksNote}</Callout>

      <H2 id="configuration">{t.configTitle}</H2>
      <P>{t.configP1}</P>
      <ParamTable rows={t.configTransportRows} />
      <P>
        {t.configP2Before} <Mono>opts.transport</Mono> {t.configP2After}{" "}
        <Mono>callDefaults.transport</Mono> {t.configP2End}
      </P>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "servicebridge";

const sb = new ServiceBridge("localhost:14445", key, {
  callDefaults: { transport: "auto" },
});

await sb.start();

// Picks one healthy instance of "payments" via Power-of-Two-Choices.
const res = await sb.rpc.call("payments", "charge", { amount: 100 });

// Force a transport mode for a single call.
await sb.rpc.call("payments", "charge", { amount: 100 }, { transport: "direct" });`,
        }}
      />
      <P>{t.configCb}</P>
      <ParamTable rows={t.cbRows} />

      <H2 id="fallback">{t.fallbackTitle}</H2>
      <P>{t.fallbackP1}</P>
      <P>{t.fallbackP2}</P>
      <P>
        {t.fallbackP3Before}
        <Mono>60s</Mono>
        {t.fallbackP3After}
      </P>
      <Callout type="warning">{t.fallbackWarn}</Callout>

      <H2 id="multi-runtime">{t.multiTitle}</H2>
      <P>{t.multiP1}</P>
      <P>{t.multiP2}</P>
      <Callout type="info">{t.multiNote}</Callout>
    </div>
  );
}

export default PageZoneAware;
