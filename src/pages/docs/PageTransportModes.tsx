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
    title: "Transport Modes",
    description:
      "Every RPC call picks a transport: direct caller-to-callee mTLS, or proxy through the runtime. Selection is per-call via CallOpts.transport, with the SDK's load balancer and per-instance circuit breaker on top.",

    directTitle: "Direct Mode",
    directP1:
      "In direct mode the caller SDK opens an mTLS gRPC connection straight to the callee instance and invokes its Call server. No proxy hop, no runtime in the data path — the runtime only supplied the endpoint through the registry watch stream.",
    directP2:
      "Direct works only when the callee published a call_endpoint and the caller has an outbound transport ready. The caller validates the callee's SPIFFE identity from its leaf cert, so a direct call is still authenticated end to end.",
    directTip:
      "Direct is where a call goes by default. In Node the default is auto, which picks direct whenever an endpoint is known; set transport: \"direct\" to force it and fail fast when no endpoint exists. The Go SDK has no auto: TransportDirect is the default and there is nothing to force.",

    proxyTitle: "Proxy Mode",
    proxyP1:
      "In proxy mode the call goes caller → runtime Invoke → callee. The runtime forwards the request, so the callee does not need to be directly reachable from the caller — useful across NAT or separate networks.",
    proxyP2:
      "Ask for it per call: transport: \"proxy\" in Node, sb.WithTransport(sb.TransportProxy) in Go. Node's auto mode also falls back to proxy on its own whenever the picked instance has no call_endpoint; Go never falls back, so a direct call with nowhere to go returns CodeNoLiveInstance.",

    hierarchyTitle: "Config Hierarchy",
    hierarchyP:
      "Transport is not a server-side YAML setting. It is resolved per call in the SDK, from two layers:",
    hierItem1Pre: "Per-call",
    hierItem1Post:
      " — the transport field on the CallOpts you pass to sb.rpc.call() or sb.stream(). Highest priority.",
    hierItem2Pre: "Client default",
    hierItem2Post:
      " — callDefaults on the ServiceBridge constructor in Node (and the per-client callDefaults on sb.client(...)), sb.WithCallDefaults(...) on sb.New in Go. The constructor default is merged into sb.stream() and into the typed methods returned by sb.client(); a bare sb.rpc.call() reads only its own CallOpts. In Go the defaults apply under every call and stream that does not override them.",
    hierMerge:
      "Where a default applies, the SDK merges it shallowly as { ...callDefaults, ...perCallOpts }, so a per-call value always wins.",
    autoNote:
      "When neither layer sets transport, Node falls back to \"auto\": direct if the chosen instance has an endpoint, proxy otherwise. Go falls back to TransportDirect — the choice is explicit or it is direct.",

    cbTitle: "Circuit Breakers",
    cbP1:
      "The SDK keeps one circuit breaker per callee instance, keyed by serviceId:instanceId. It is a CLOSED / OPEN / HALF_OPEN state machine over a sliding error window, so a single failing instance stops draining your call budget while healthy instances keep serving.",
    cbStateClosed:
      "CLOSED — calls flow. The breaker counts successes and errors in a 10-second window split into 10 one-second buckets.",
    cbStateOpen:
      "OPEN — once the window holds at least 10 requests and the error rate is above 50%, the breaker opens. The load balancer skips this instance entirely.",
    cbStateHalf:
      "HALF_OPEN — 30 seconds after opening, one probe call is allowed. Success closes the breaker and clears the window; failure re-opens it for another 30 seconds.",
    cbConstTitle: "Fixed thresholds",
    cbWindow: "Sliding window length.",
    cbBuckets: "Buckets the window is split into (1s each).",
    cbMin: "Minimum requests in the window before OPEN can trigger.",
    cbRate: "Error rate above this opens the breaker.",
    cbOpen: "Time spent OPEN before a HALF_OPEN probe.",
    cbInfo:
      "Breaker state is per SDK instance, not shared across your worker replicas. Each replica decides independently. Cross-replica coherence comes from the runtime's health hints, not from a shared breaker.",

    zoneTitle: "Zone-Aware LB",
    zoneP1:
      "When several instances of a service are live, the SDK load balancer picks one with Power-of-Two-Choices: it samples two eligible instances at random and routes to the one with fewer in-flight calls. This spreads load without a central coordinator and naturally avoids a momentarily slow instance.",
    zoneP2:
      "Before picking, the balancer filters out instances that are not eligible:",
    zoneFilter1:
      "no call_endpoint published (cannot be reached directly),",
    zoneFilter2:
      "marked unhealthy by the runtime within the last 60 seconds (the health hint from the watch stream),",
    zoneFilter3:
      "with an OPEN circuit breaker.",
    zoneP3:
      "If a runtime health hint is older than 60 seconds it is treated as stale — the runtime itself might be impaired — and the local circuit breaker carries the routing decision instead.",
    zoneWarn:
      "Neither SDK has an availability-zone field and neither has a zone weight or affinity setting. Load balancing is by live in-flight count, not by topology. There is nothing to configure — it is automatic.",
  },
  ru: {
    badge: "Транспорт и отказоустойчивость",
    title: "Режимы транспорта",
    description:
      "Каждый RPC-вызов выбирает транспорт: direct (mTLS напрямую от вызывающего к получателю) или proxy (через runtime). Выбор — на уровне вызова через CallOpts.transport; поверх работают балансировщик SDK и circuit breaker на каждый инстанс.",

    directTitle: "Прямой режим (Direct)",
    directP1:
      "В режиме direct SDK вызывающего открывает mTLS gRPC-соединение прямо к инстансу получателя и обращается к его Call-серверу. Нет прокси-хопа, runtime не в пути данных — он лишь отдал endpoint через watch-стрим реестра.",
    directP2:
      "Direct работает, только если получатель опубликовал call_endpoint, а у вызывающего поднят исходящий транспорт. Вызывающий проверяет SPIFFE-идентичность получателя из его leaf-сертификата, так что прямой вызов остаётся аутентифицированным сквозным образом.",
    directTip:
      "По умолчанию вызов идёт direct. В Node дефолт — auto: он выбирает direct, когда endpoint известен; transport: \"direct\" принуждает и быстро падает, если endpoint'а нет. В Go SDK auto нет: TransportDirect — значение по умолчанию, принуждать нечего.",

    proxyTitle: "Прокси-режим (Proxy)",
    proxyP1:
      "В режиме proxy вызов идёт вызывающий → runtime Invoke → получатель. Runtime пересылает запрос, поэтому получатель не обязан быть напрямую достижим от вызывающего — полезно за NAT или в разных сетях.",
    proxyP2:
      "Запросить на конкретный вызов: transport: \"proxy\" в Node, sb.WithTransport(sb.TransportProxy) в Go. Режим auto в Node ещё и сам уходит в proxy, когда у выбранного инстанса нет call_endpoint; Go не переключается сам — прямой вызов, которому некуда идти, возвращает CodeNoLiveInstance.",

    hierarchyTitle: "Иерархия конфигурации",
    hierarchyP:
      "Транспорт — это не серверная YAML-настройка. Он разрешается на каждый вызов в SDK из двух уровней:",
    hierItem1Pre: "На уровне вызова",
    hierItem1Post:
      " — поле transport в CallOpts, которое вы передаёте в sb.rpc.call() или sb.stream(). Высший приоритет.",
    hierItem2Pre: "Дефолт клиента",
    hierItem2Post:
      " — callDefaults в конструкторе ServiceBridge в Node (и per-client callDefaults в sb.client(...)), sb.WithCallDefaults(...) в sb.New в Go. Дефолт из конструктора Node мёржится в sb.stream() и в типизированные методы из sb.client(); голый sb.rpc.call() читает только свой CallOpts. В Go дефолты применяются под каждым вызовом и стримом, который их не переопределил.",
    hierMerge:
      "Там, где дефолт применяется, SDK мёржит его поверхностно как { ...callDefaults, ...perCallOpts }, поэтому значение из вызова всегда побеждает.",
    autoNote:
      "Если ни один уровень не задал transport, Node уходит в \"auto\": direct, если у выбранного инстанса есть endpoint, иначе proxy. Go уходит в TransportDirect — выбор либо явный, либо direct.",

    cbTitle: "Circuit Breakers",
    cbP1:
      "SDK держит по одному circuit breaker на инстанс получателя, ключ — serviceId:instanceId. Это конечный автомат CLOSED / OPEN / HALF_OPEN поверх скользящего окна ошибок: один сбойный инстанс перестаёт съедать ваш бюджет вызовов, а здоровые продолжают обслуживать.",
    cbStateClosed:
      "CLOSED — вызовы идут. Breaker считает успехи и ошибки в окне 10 секунд, разбитом на 10 односекундных бакетов.",
    cbStateOpen:
      "OPEN — как только в окне накопилось минимум 10 запросов и доля ошибок выше 50%, breaker открывается. Балансировщик полностью пропускает этот инстанс.",
    cbStateHalf:
      "HALF_OPEN — через 30 секунд после открытия пропускается один пробный вызов. Успех закрывает breaker и очищает окно; ошибка снова открывает его на 30 секунд.",
    cbConstTitle: "Фиксированные пороги",
    cbWindow: "Длина скользящего окна.",
    cbBuckets: "Число бакетов окна (по 1 c).",
    cbMin: "Минимум запросов в окне до возможного OPEN.",
    cbRate: "Доля ошибок выше этого значения открывает breaker.",
    cbOpen: "Время в OPEN до пробного HALF_OPEN.",
    cbInfo:
      "Состояние breaker — на инстанс SDK, не разделяется между репликами вашего воркера. Каждая реплика решает независимо. Согласованность между репликами даёт health-хинт runtime, а не общий breaker.",

    zoneTitle: "Зональная балансировка",
    zoneP1:
      "Когда живо несколько инстансов сервиса, балансировщик SDK выбирает один по схеме Power-of-Two-Choices: берёт два подходящих инстанса случайно и направляет вызов туда, где меньше вызовов «в полёте». Это распределяет нагрузку без центрального координатора и естественно обходит временно медленный инстанс.",
    zoneP2:
      "Перед выбором балансировщик отсеивает неподходящие инстансы:",
    zoneFilter1:
      "нет опубликованного call_endpoint (нельзя достучаться напрямую),",
    zoneFilter2:
      "помечен runtime как нездоровый за последние 60 секунд (health-хинт из watch-стрима),",
    zoneFilter3:
      "с OPEN circuit breaker.",
    zoneP3:
      "Если health-хинт от runtime старше 60 секунд, он считается устаревшим — сам runtime мог сломаться — и решение о маршрутизации берёт на себя локальный circuit breaker.",
    zoneWarn:
      "Ни в одном SDK нет поля зоны доступности и настройки веса или аффинити зоны. Балансировка — по числу живых вызовов «в полёте», а не по топологии. Настраивать нечего — всё автоматически.",
  },
};

export function PageTransportModes() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="direct-mode">{t.directTitle}</H2>
      <P>{t.directP1}</P>
      <P>{t.directP2}</P>
      <MultiCodeBlock
        code={{
          ts: `// Force a direct mTLS call; throws if the callee published no endpoint.
const res = await sb.rpc.call("payments", "charge", { amount: 100 }, {
  transport: "direct",
});`,
          go: `// Direct mTLS call — the Go default; fails if the callee published no endpoint.
res, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, c, "payments", "charge",
	&paymentpb.ChargeRequest{AmountCents: 100},
	sb.WithTransport(sb.TransportDirect),
)
if err != nil {
	log.Fatal(err)
}
log.Println(res.GetTransactionId())`,
        }}
      />
      <Callout type="tip">{t.directTip}</Callout>

      <H2 id="proxy-mode">{t.proxyTitle}</H2>
      <P>{t.proxyP1}</P>
      <P>{t.proxyP2}</P>
      <MultiCodeBlock
        code={{
          ts: `// Route through the runtime even if a direct endpoint is known.
const res = await sb.rpc.call("payments", "charge", { amount: 100 }, {
  transport: "proxy",
});`,
          go: `// Route through the runtime even if a direct endpoint is known.
res, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, c, "payments", "charge",
	&paymentpb.ChargeRequest{AmountCents: 100},
	sb.WithTransport(sb.TransportProxy),
)
if err != nil {
	log.Fatal(err)
}
log.Println(res.GetTransactionId())`,
        }}
      />

      <H2 id="config-hierarchy">{t.hierarchyTitle}</H2>
      <P>{t.hierarchyP}</P>
      <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          <strong>{t.hierItem1Pre}</strong>
          {t.hierItem1Post}
        </li>
        <li>
          <strong>{t.hierItem2Pre}</strong>
          {t.hierItem2Post}
        </li>
      </ol>
      <P>{t.hierMerge}</P>
      <MultiCodeBlock
        code={{
          ts: `// Client default: applied to sb.stream() and sb.client() typed methods.
const sb = new ServiceBridge("localhost:14445", key, {
  callDefaults: { transport: "proxy", timeout: "10s" },
});

// Inherits the proxy default from callDefaults.
for await (const chunk of sb.stream("payments", "watch", payload)) { /* ... */ }

// Per-call override always wins; transport here is explicit.
await sb.rpc.call("payments", "charge", payload, { transport: "direct" });`,
          go: `// Client default: applied under every call that does not override it.
c, err := sb.New("localhost:14445", key,
	sb.WithCallDefaults(
		sb.WithTransport(sb.TransportProxy),
		sb.WithTimeout(10*time.Second),
	),
)
if err != nil {
	log.Fatal(err)
}

// Inherits the proxy default from WithCallDefaults.
for chunk, err := range sb.Stream[*orderpb.OrderCreated, *orderpb.OrderCompleted](
	ctx, c, "payments", "watch", &orderpb.OrderCreated{OrderId: "ord_42"},
) {
	if err != nil {
		log.Fatal(err)
	}
	log.Println(chunk.GetTxId())
}

// Per-call override always wins; transport here is explicit.
if _, err := sb.Call[*paymentpb.ChargeRequest, *paymentpb.ChargeReply](
	ctx, c, "payments", "charge",
	&paymentpb.ChargeRequest{AmountCents: 100},
	sb.WithTransport(sb.TransportDirect),
); err != nil {
	log.Fatal(err)
}`,
        }}
      />
      <Callout type="info">{t.autoNote}</Callout>

      <H2 id="circuit-breakers">{t.cbTitle}</H2>
      <P>{t.cbP1}</P>
      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.cbStateClosed}</li>
        <li>{t.cbStateOpen}</li>
        <li>{t.cbStateHalf}</li>
      </ul>
      <H3 id="cb-config">{t.cbConstTitle}</H3>
      <ParamTable
        rows={[
          { name: "window", type: "10s", default: "—", desc: t.cbWindow },
          { name: "buckets", type: "10", default: "—", desc: t.cbBuckets },
          { name: "min requests", type: "10", default: "—", desc: t.cbMin },
          { name: "error rate", type: "> 50%", default: "—", desc: t.cbRate },
          { name: "open duration", type: "30s", default: "—", desc: t.cbOpen },
        ]}
      />
      <Callout type="info">{t.cbInfo}</Callout>

      <H2 id="zone-aware">{t.zoneTitle}</H2>
      <P>{t.zoneP1}</P>
      <P>{t.zoneP2}</P>
      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground my-3">
        <li>{t.zoneFilter1}</li>
        <li>{t.zoneFilter2}</li>
        <li>{t.zoneFilter3}</li>
      </ul>
      <P>{t.zoneP3}</P>
      <Callout type="warning">
        <Mono>zone</Mono> — {t.zoneWarn}
      </Callout>
    </div>
  );
}

export default PageTransportModes;
