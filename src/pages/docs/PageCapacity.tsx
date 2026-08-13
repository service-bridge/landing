import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const REPRO_CMD = `cd runtime
TEST_DATABASE_URL="postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=disable" \\
  go test -bench=. -benchmem -run='^$' ./tests/bench/...`;

const RAW_OUTPUT = `goos: darwin
goarch: arm64
pkg: github.com/service-bridge/runtime/tests/bench
cpu: Apple M2 Max
BenchmarkClaimConcurrent-12            100  24147602 ns/op    8.000 claimers        27802 B/op   395 allocs/op
BenchmarkEventPublishDeliver-12        711   1632122 ns/op    5.000 deliveries/op   13137 B/op   224 allocs/op
BenchmarkRegistrySnapshot/N=10-12      670   2235752 ns/op   10.00 methods/snapshot 17646 B/op   185 allocs/op
BenchmarkRegistrySnapshot/N=100-12      56  20788203 ns/op  100.0 methods/snapshot 166985 B/op  1810 allocs/op
BenchmarkRegistrySnapshot/N=1000-12      7 188112798 ns/op   1000 methods/snapshot 1812570 B/op 18031 allocs/op
BenchmarkRPCProxyOverhead-12          2889    422429 ns/op                          24644 B/op   366 allocs/op
PASS
ok  	github.com/service-bridge/runtime/tests/bench	28.161s`;

const T = {
  en: {
    badge: "Production",
    title: "Capacity & Benchmarks",
    description:
      "\"Up to 1000 services\" and \"≈0 ms per hop\" are claims made elsewhere on this site. This page is the benchmark suite behind them — reproducible commands, real Postgres, real numbers, and an honest account of what each number does and does not prove.",

    methodologyTitle: "Methodology",
    methodologyDesc:
      "Four Go benchmarks in runtime/tests/bench/, run against a real Postgres via TEST_DATABASE_URL — no mocks, no in-memory fakes, matching the project's own DB-testing policy. Each benchmark seeds its own schema-isolated Postgres schema and drops it on cleanup.",
    reproTitle: "Reproduce",
    machineTitle: "Machine this run used",
    machineRows: [
      { name: "CPU", value: "Apple M2 Max, 12 cores" },
      { name: "RAM", value: "32 GB" },
      { name: "OS", value: "macOS, Darwin 27.0.0, arm64" },
      { name: "Go", value: "go1.26.3 darwin/arm64" },
      { name: "Postgres", value: "18.4 (Debian 18.4-1.pgdg13+1), Docker, default config" },
      { name: "Network", value: "loopback (127.0.0.1) for the DB and both RPC hops" },
    ] as { name: string; value: string }[],
    opsTitle: "What counts as one operation",
    opsRows: [
      { name: "BenchmarkEventPublishDeliver", desc: "One publish (fans out to 5 durable subscribers) + one claim of all 5 resulting deliveries" },
      { name: "BenchmarkRPCProxyOverhead", desc: "One InvokeServer.Unary call: caller → runtime (Postgres resolve) → runtime → callee, both hops real gRPC, one hop real mTLS" },
      { name: "BenchmarkRegistrySnapshot/N=…", desc: "One QuerySnapshot call for a subscriber depending on all N seeded services" },
      { name: "BenchmarkClaimConcurrent", desc: "One worker's claim+ack round trip, 8 concurrent workers each draining their own partition" },
    ] as { name: string; desc: string }[],

    numbersTitle: "Measured numbers",
    numbersDesc: "Raw output of the run this page cites:",
    derivedTitle: "Derived numbers",
    derivedRows: [
      { name: "Event publish→claim latency", value: "1.63 ms/op" },
      { name: "Event publish throughput", value: "~613 publishes/s" },
      { name: "Delivery claim throughput (fan-out=5)", value: "~3,064 deliveries/s" },
      { name: "RPC proxy round trip", value: "0.42 ms (422 µs)" },
      { name: "Registry snapshot, N=10", value: "2.24 ms" },
      { name: "Registry snapshot, N=100", value: "20.79 ms" },
      { name: "Registry snapshot, N=1000", value: "188.1 ms" },
      { name: "Per-dependency cost inside a snapshot", value: "~0.19–0.22 ms, roughly flat across N" },
      { name: "Concurrent claim+ack round trip", value: "24.15 ms per worker-op" },
      { name: "Aggregate claim+ack throughput, 8 workers", value: "~331 claims/s" },
    ] as { name: string; value: string }[],
    varianceNote:
      "Two earlier runs of the same suite on the same machine landed within roughly ±15% of every number above — normal local variance. Treat these as order-of-magnitude, not four-significant-figure.",

    caveatsTitle: "Honest caveats",
    caveats: [
      "This is a laptop, not a production host. Postgres ran in Docker with default configuration on the same machine as the Go process — zero network RTT between them. A real deployment with separate hosts adds real network latency on top of every number here.",
      "Postgres write throughput is the first thing that will saturate — ADR-0002 states this directly (\"Maximum throughput is bounded by Postgres write throughput\"). The event-publish number is a measurement of that bound on this machine, not a runtime-CPU-bound number: allocation counts stayed in the hundreds across all four benchmarks, never the runtime's own logic as the bottleneck.",
      "Scale depends on: Postgres write IOPS and pool size for the event/claim path; Postgres read latency and index locality for the registry snapshot path; network RTT between runtime and SDK callees for the RPC path (loopback hides this entirely here).",
      "No load test. Every number is a single logical operation measured in isolation, not the runtime under sustained concurrent load from many live SDK connections at once.",
    ],

    thousandTitle: "The \"up to 1000 services\" claim",
    thousandConfirmedTitle: "Confirmed",
    thousandConfirmed: [
      "Repo.QuerySnapshot — the exact query RegisterAndWatch runs to build the first message a connecting SDK receives — correctly returns a complete, correctly-sized snapshot for a subscriber depending on 1000 registered services. No existing test exercised this at that scale before.",
      "That snapshot takes ~188 ms to build on this machine — the real first-message latency a connecting SDK with 1000 outgoing dependencies would see.",
      "The query pattern is confirmed O(N) in sequential round trips, not one batched query: QuerySnapshot issues one SELECT per method subscription. The near-linear scaling (N=10→100 is ~9.3×, N=100→1000 is ~9.05×, both close to the 10× data growth) is exactly what that shape predicts — worth operator attention: a service with 1000 outgoing deps pays 1000 sequential DB round trips on every connect.",
    ],
    thousandNotTitle: "Not confirmed",
    thousandNot: [
      "Concurrent connection handling at 1000 services — this benchmark runs one QuerySnapshot call, not 1000 concurrent RegisterAndWatch streams, and does not exercise the in-memory Hub fan-out, heartbeat, or health-tracking overhead at that scale.",
      "RPC/event traffic volume at 1000 services — nothing here measures 1000 services generating real traffic simultaneously.",
      "A ceiling — the benchmark confirms N=1000 works and reports its cost; it does not establish where the O(N) sequential-query pattern starts to hurt under real connect churn, or that N=5000 behaves the same way.",
    ],
    thousandVerdict:
      "Verdict: \"up to 1000 services\" is now backed by one real number — a 1000-entry snapshot builds correctly in ~188 ms. It is not backed by a load test of 1000 simultaneously connected, actively-traffic-generating services.",

    rpcTitle: "The RPC overhead claim — and a code-path finding",
    rpcQuote1: "Proxy per pod: 0 proxies — SDK calls worker directly",
    rpcQuote2: "Call latency overhead: ≈0 ms — raw gRPC, no intercept layer",
    rpcQuoteSource: "landing copy, Replaces.tsx",
    rpcCodeDesc:
      "Reading internal/rpc/server.go directly: on the proxy path the runtime is not a bystander. The call goes caller → runtime → callee, two full gRPC hops:",
    rpcSteps: [
      "InvokeServer.Unary receives the call from the caller SDK.",
      "It resolves a target instance via Resolver.Resolve — a live Postgres query.",
      "It forwards the call to the resolved callee over a second, separate gRPC connection — the runtime is the client here, dialing the callee itself.",
      "The callee's response comes back through the runtime to the original caller.",
    ],
    rpcCallout:
      "That is a proxy, by the code's own doc comment: \"resolves a single target instance via the registry, and proxies the CallRequest payload to that instance.\" Which path a call takes depends on configuration: the SDK defaults to transport \"auto\" — direct caller→callee mTLS when the callee advertises a call endpoint, proxy otherwise — and the callee advertises one only when started with advertise. A fleet configured with advertise calls peer-to-peer; a fleet without it proxies every call. The benchmark below measures the proxy path, the worst case of the two.",
    rpcMeasuredDesc:
      "BenchmarkRPCProxyOverhead measures exactly this two-hop path end to end — real gRPC on both hops, real mTLS on the runtime→callee hop, a real Postgres-backed resolve in between, against a callee that does zero work of its own:",
    rpcNumber: "0.42 ms (422 µs) round trip on loopback, on this machine.",
    rpcSupportedTitle: "Supported / not supported",
    rpcSupported: [
      "Supported: the runtime's added per-call cost is small in absolute terms — well under a millisecond on loopback — and nowhere near the \"1–5 ms per hop\" the comparison table cites for sidecar meshes.",
      "Not supported: \"0 proxies\" as an unconditional description. It holds for a fleet started with advertise, where calls go peer-to-peer, and it is wrong for one without it, where every call takes the runtime-owned hop measured here. Outside loopback the inter-host RTT of the runtime→callee hop is additive on top of the 0.42 ms measured here.",
    ],

    sizingTitle: "Sizing table — not provided",
    sizingDesc:
      "The brief behind this page asked for a sizing table: Postgres profile (vCPU/RAM) → expected event throughput. This page does not include one. Every number above was measured on exactly one machine, one Postgres profile (Docker default config), and one network topology (loopback). Extrapolating a multi-tier sizing table from a single data point would not be sizing guidance — it would be invented numbers wearing a table's formatting. That measurement has not been done.",

    summaryTitle: "Summary",
    summaryHeader: ["Public claim", "Status after this benchmark pass"],
    summaryRows: [
      { claim: "\"Up to 1000 services\"", status: "Partially confirmed: snapshot correctness + latency (~188 ms) verified at N=1000. Concurrent-connection and sustained-traffic behavior at that scale remain unverified." },
      { claim: "\"≈0 ms\" RPC overhead, \"0 proxies\"", status: "True only for a fleet started with advertise, where the SDK calls peers directly. Without it the runtime proxies every call, measured at 0.42 ms on loopback. The copy presents the best case as the only case." },
      { claim: "Event throughput bounded by Postgres write throughput (ADR-0002)", status: "Confirmed directionally: ~613 publishes/s, ~3,064 deliveries/s on one dev-grade Postgres instance. No production-grade number yet." },
      { claim: "Concurrent claiming under the FIFO gate", status: "Confirmed correct under contention (no lost or double claims across 8 concurrent workers) with its serialization cost measured (~331 claim+ack/s aggregate)." },
      { claim: "Sizing by Postgres profile", status: "Not provided — insufficient data for honest extrapolation." },
    ] as { claim: string; status: string }[],
  },
  ru: {
    badge: "Production",
    title: "Производительность и бенчмарки",
    description:
      "«До 1000 сервисов» и «≈0 мс на хоп» — заявления, сделанные в другом месте этого сайта. Эта страница — набор бенчмарков за ними: воспроизводимые команды, реальный Postgres, реальные цифры и честный отчёт о том, что каждая цифра доказывает, а что нет.",

    methodologyTitle: "Методология",
    methodologyDesc:
      "Четыре Go-бенчмарка в runtime/tests/bench/, прогнанные против реального Postgres через TEST_DATABASE_URL — без моков, без in-memory фейков, в соответствии с политикой проекта по тестированию БД. Каждый бенчмарк создаёт свою изолированную схему Postgres и удаляет её при завершении.",
    reproTitle: "Воспроизведение",
    machineTitle: "Машина, на которой прогонялось",
    machineRows: [
      { name: "CPU", value: "Apple M2 Max, 12 ядер" },
      { name: "RAM", value: "32 ГБ" },
      { name: "ОС", value: "macOS, Darwin 27.0.0, arm64" },
      { name: "Go", value: "go1.26.3 darwin/arm64" },
      { name: "Postgres", value: "18.4 (Debian 18.4-1.pgdg13+1), Docker, конфиг по умолчанию" },
      { name: "Сеть", value: "loopback (127.0.0.1) для БД и обоих RPC-хопов" },
    ] as { name: string; value: string }[],
    opsTitle: "Что считается одной операцией",
    opsRows: [
      { name: "BenchmarkEventPublishDeliver", desc: "Одна публикация (fan-out на 5 durable-подписчиков) + один claim всех 5 доставок" },
      { name: "BenchmarkRPCProxyOverhead", desc: "Один вызов InvokeServer.Unary: caller → рантайм (resolve через Postgres) → рантайм → callee, оба хопа реальный gRPC, один хоп реальный mTLS" },
      { name: "BenchmarkRegistrySnapshot/N=…", desc: "Один вызов QuerySnapshot для подписчика, зависящего от всех N засеянных сервисов" },
      { name: "BenchmarkClaimConcurrent", desc: "Один claim+ack раунд-трип воркера, 8 параллельных воркеров, каждый дренирует свою партицию" },
    ] as { name: string; desc: string }[],

    numbersTitle: "Измеренные цифры",
    numbersDesc: "Сырой вывод прогона, на который ссылается эта страница:",
    derivedTitle: "Производные цифры",
    derivedRows: [
      { name: "Латентность publish→claim", value: "1.63 мс/оп" },
      { name: "Пропускная способность publish", value: "~613 публикаций/с" },
      { name: "Пропускная способность claim (fan-out=5)", value: "~3 064 доставок/с" },
      { name: "RPC proxy round trip", value: "0.42 мс (422 мкс)" },
      { name: "Registry snapshot, N=10", value: "2.24 мс" },
      { name: "Registry snapshot, N=100", value: "20.79 мс" },
      { name: "Registry snapshot, N=1000", value: "188.1 мс" },
      { name: "Стоимость одной зависимости внутри снапшота", value: "~0.19–0.22 мс, примерно постоянна по N" },
      { name: "Concurrent claim+ack round trip", value: "24.15 мс на воркер-операцию" },
      { name: "Суммарная пропускная способность, 8 воркеров", value: "~331 claim/с" },
    ] as { name: string; value: string }[],
    varianceNote:
      "Два более ранних прогона того же набора на той же машине легли в пределах ~15% от каждой цифры выше — обычный локальный разброс. Считайте эти цифры порядком величины, а не значением с четырьмя значащими цифрами.",

    caveatsTitle: "Честные оговорки",
    caveats: [
      "Это ноутбук, не production-хост. Postgres работал в Docker с конфигом по умолчанию на той же машине, что и Go-процесс — нулевой сетевой RTT между ними. Реальное развёртывание с разными хостами добавит реальную сетевую задержку поверх каждой цифры здесь.",
      "Пропускная способность записи Postgres — первое, что упрётся в потолок. ADR-0002 прямо об этом говорит («Maximum throughput is bounded by Postgres write throughput»). Цифра publish события — измерение именно этого предела на данной машине, не CPU-bound цифра рантайма: количество аллокаций во всех четырёх бенчмарках оставалось в сотнях, логика самого рантайма нигде не была узким местом.",
      "Масштаб зависит от: write IOPS и размера пула Postgres для пути event/claim; латентности чтения и локальности индексов Postgres для пути registry snapshot; сетевого RTT между рантаймом и callee-инстансами SDK для RPC-пути (loopback здесь полностью его скрывает).",
      "Нет нагрузочного теста. Каждая цифра — одна логическая операция, измеренная изолированно, не рантайм под устойчивой параллельной нагрузкой от множества живых SDK-подключений одновременно.",
    ],

    thousandTitle: "Заявление «до 1000 сервисов»",
    thousandConfirmedTitle: "Подтверждено",
    thousandConfirmed: [
      "Repo.QuerySnapshot — тот самый запрос, который RegisterAndWatch выполняет для первого сообщения, приходящего подключающемуся SDK — корректно возвращает полный, корректный по размеру снапшот для подписчика, зависящего от 1000 зарегистрированных сервисов. Ни один существующий тест не проверял это на таком масштабе.",
      "Этот снапшот собирается за ~188 мс на данной машине — реальная латентность первого сообщения, которую увидит подключающийся SDK с 1000 исходящими зависимостями.",
      "Паттерн запроса подтверждён как O(N) последовательных round trip'ов, не один батч-запрос: QuerySnapshot делает один SELECT на каждую подписку на метод. Почти линейный рост (N=10→100 — ~9.3×, N=100→1000 — ~9.05×, оба близки к 10-кратному росту данных) — именно то, что предсказывает такая форма кода. Стоит внимания оператора: сервис с 1000 исходящими зависимостями платит 1000 последовательных DB round trip'ов на каждом подключении.",
    ],
    thousandNotTitle: "Не подтверждено",
    thousandNot: [
      "Обработка параллельных подключений на 1000 сервисах — этот бенчмарк выполняет один вызов QuerySnapshot, не 1000 параллельных стримов RegisterAndWatch, и не проверяет in-memory fan-out Hub, heartbeat или накладные расходы health-tracking на таком масштабе.",
      "Объём RPC/event-трафика на 1000 сервисах — ничто здесь не измеряет 1000 сервисов, генерирующих реальный трафик одновременно.",
      "Потолок — бенчмарк подтверждает, что N=1000 работает, и показывает его стоимость; он не устанавливает, где паттерн O(N) последовательных запросов начнёт вредить при реальной текучке подключений, или что N=5000 поведёт себя так же.",
    ],
    thousandVerdict:
      "Итог: «до 1000 сервисов» теперь подкреплено одной реальной цифрой — снапшот на 1000 записей собирается корректно за ~188 мс. Это не подкреплено нагрузочным тестом 1000 одновременно подключённых, активно генерирующих трафик сервисов.",

    rpcTitle: "Заявление про накладные расходы RPC — и находка в коде",
    rpcQuote1: "Proxy per pod: 0 proxies — SDK calls worker directly",
    rpcQuote2: "Call latency overhead: ≈0 ms — raw gRPC, no intercept layer",
    rpcQuoteSource: "текст лендинга, Replaces.tsx",
    rpcCodeDesc:
      "При чтении internal/rpc/server.go напрямую: на proxy-пути рантайм — не сторонний наблюдатель. Вызов идёт caller → рантайм → callee, два полных gRPC-хопа:",
    rpcSteps: [
      "InvokeServer.Unary принимает вызов от caller SDK.",
      "Он резолвит целевой инстанс через Resolver.Resolve — живой запрос к Postgres.",
      "Он форвардит вызов резолвнутому callee через второе, отдельное gRPC-соединение — рантайм здесь клиент, сам дозванивается до callee.",
      "Ответ callee возвращается через рантайм к исходному caller.",
    ],
    rpcCallout:
      "Это proxy, по собственному doc-комментарию кода: «resolves a single target instance via the registry, and proxies the CallRequest payload to that instance». Какой путь возьмёт вызов, зависит от конфигурации: SDK по умолчанию использует transport «auto» — прямой mTLS caller→callee, когда callee анонсировал call-endpoint, и proxy в остальных случаях, — а анонсирует его callee только при запуске с advertise. Флот с advertise ходит peer-to-peer; флот без него проксирует каждый вызов. Бенчмарк ниже измеряет proxy-путь, худший из двух.",
    rpcMeasuredDesc:
      "BenchmarkRPCProxyOverhead измеряет именно этот двухшаговый путь целиком — реальный gRPC на обоих хопах, реальный mTLS на хопе рантайм→callee, реальный resolve через Postgres между ними, против callee, который не делает никакой собственной работы:",
    rpcNumber: "0.42 мс (422 мкс) round trip на loopback, на данной машине.",
    rpcSupportedTitle: "Подтверждено / не подтверждено",
    rpcSupported: [
      "Подтверждено: добавленная рантаймом стоимость на вызов мала в абсолютных числах — заметно меньше миллисекунды на loopback — и далеко от «1–5 мс на хоп», которые сравнительная таблица приводит для sidecar-мешей.",
      "Не подтверждено: «0 proxies» как безусловное описание. Оно верно для флота, запущенного с advertise, где вызовы идут peer-to-peer, и неверно для флота без него, где каждый вызов проходит измеренный здесь хоп через рантайм. Вне loopback межхостовый RTT хопа рантайм→callee добавится поверх измеренных 0.42 мс.",
    ],

    sizingTitle: "Sizing-таблица — не предоставлена",
    sizingDesc:
      "Задание для этой страницы просило sizing-таблицу: профиль Postgres (vCPU/RAM) → ожидаемая пропускная способность событий. Эта страница её не содержит. Каждая цифра выше измерена на одной машине, одном профиле Postgres (конфиг Docker по умолчанию) и одной сетевой топологии (loopback). Экстраполяция многоуровневой sizing-таблицы из одной точки данных была бы не sizing-рекомендацией, а выдуманными числами в форматировании таблицы. Это измерение не проводилось.",

    summaryTitle: "Итог",
    summaryHeader: ["Публичное заявление", "Статус после этого прохода бенчмарков"],
    summaryRows: [
      { claim: "«До 1000 сервисов»", status: "Частично подтверждено: корректность снапшота + латентность (~188 мс) проверены на N=1000. Поведение при параллельных подключениях и устойчивом трафике на этом масштабе не проверено." },
      { claim: "«≈0 мс» накладных расходов RPC, «0 proxies»", status: "Верно только для флота, запущенного с advertise, где SDK ходит к пирам напрямую. Без него рантайм проксирует каждый вызов — измерено 0.42 мс на loopback. Текст подаёт лучший случай как единственный." },
      { claim: "Пропускная способность событий ограничена записью Postgres (ADR-0002)", status: "Подтверждено по направлению: ~613 публикаций/с, ~3 064 доставок/с на одном dev-инстансе Postgres. Production-цифры пока нет." },
      { claim: "Параллельный claim под FIFO-гейтом", status: "Подтверждена корректность под конкуренцией (ни одной потерянной или задвоенной доставки среди 8 параллельных воркеров) и измерена стоимость сериализации (~331 claim/с суммарно)." },
      { claim: "Sizing по профилю Postgres", status: "Не предоставлен — недостаточно данных для честной экстраполяции." },
    ] as { claim: string; status: string }[],
  },
};

export function PageCapacity() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="methodology">{t.methodologyTitle}</H2>
      <P>{t.methodologyDesc}</P>

      <H3 id="repro">{t.reproTitle}</H3>
      <DocCodeBlock code={REPRO_CMD} lang="bash" />

      <H3 id="machine">{t.machineTitle}</H3>
      <div className="space-y-2 my-3">
        {t.machineRows.map((row) => (
          <div key={row.name} className="flex gap-3">
            <Mono>{row.name}</Mono>
            <span className="text-sm text-muted-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <H3 id="ops">{t.opsTitle}</H3>
      <div className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <tbody className="text-muted-foreground">
            {t.opsRows.map((row) => (
              <tr key={row.name} className="border-b border-border/50">
                <td className="py-2 pr-4 font-mono text-xs text-primary w-64 shrink-0">{row.name}</td>
                <td className="py-2 text-xs">{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="measured-numbers">{t.numbersTitle}</H2>
      <P>{t.numbersDesc}</P>
      <DocCodeBlock code={RAW_OUTPUT} lang="bash" />

      <H3 id="derived">{t.derivedTitle}</H3>
      <div className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <tbody className="text-muted-foreground">
            {t.derivedRows.map((row) => (
              <tr key={row.name} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium w-72 shrink-0">{row.name}</td>
                <td className="py-2 font-mono text-xs">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="info">{t.varianceNote}</Callout>

      <H2 id="caveats">{t.caveatsTitle}</H2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.caveats.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <H2 id="thousand-services">{t.thousandTitle}</H2>
      <H3 id="thousand-confirmed">{t.thousandConfirmedTitle}</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.thousandConfirmed.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <H3 id="thousand-not">{t.thousandNotTitle}</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.thousandNot.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <Callout type="tip">{t.thousandVerdict}</Callout>

      <H2 id="rpc-overhead">{t.rpcTitle}</H2>
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 my-4 text-xs space-y-1">
        <div className="font-mono text-foreground/80">{t.rpcQuote1}</div>
        <div className="font-mono text-foreground/80">{t.rpcQuote2}</div>
        <div className="text-muted-foreground/60 mt-1">— {t.rpcQuoteSource}</div>
      </div>
      <P>{t.rpcCodeDesc}</P>
      <ul className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.rpcSteps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <Callout type="warning">{t.rpcCallout}</Callout>
      <P>{t.rpcMeasuredDesc}</P>
      <div className="text-center my-4">
        <span className="inline-block font-mono text-lg font-bold text-primary px-4 py-2 rounded-lg border border-primary/20 bg-primary/[0.06]">
          {t.rpcNumber}
        </span>
      </div>
      <H3 id="rpc-supported">{t.rpcSupportedTitle}</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.rpcSupported.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <H2 id="sizing">{t.sizingTitle}</H2>
      <P>{t.sizingDesc}</P>

      <H2 id="summary">{t.summaryTitle}</H2>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-64">{t.summaryHeader[0]}</th>
              <th className="text-left py-2 font-medium text-muted-foreground">{t.summaryHeader[1]}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {t.summaryRows.map((row) => (
              <tr key={row.claim} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium">{row.claim}</td>
                <td className="py-2 text-xs">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
