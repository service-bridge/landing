import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, DocCodeBlock, H2, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "TLS / mTLS",
    description:
      "Every SDK ↔ runtime and worker ↔ worker connection runs over mutual TLS. Certificates are issued automatically over gRPC from a single service key — no cert-manager, no Vault, no manual PKI.",

    autoTitle: "Auto-generated CA",
    autoP1: "On first access the runtime generates a self-signed CA (EC P-256) and stores it in Postgres — a single row in the runtime_ca table holding the certificate and private key as DER:",
    autoP2: "The runtime never writes the CA to disk: there is no certs/ volume and nothing to configure. On later starts it reads the same row back from Postgres and reuses it, so the container stays stateless and can be recreated freely. Postgres is the single source of truth for the CA.",
    autoP3: "The CA private key never leaves the runtime process — only the CA certificate (DER) is handed out, embedded in every service key. The gRPC listener uses a server certificate signed by this CA, cached once at startup, with TLS 1.3 as the minimum version.",
    autoKeyP: "A service key is a string with an",
    autoKeyP2: "prefix that carries the runtime address, the key id, a secret, and the embedded CA certificate. That embedded CA is the trust root the SDK pins to — so the very first connection is already verified, with nothing to configure.",

    provTitle: "SDK gRPC provisioning",
    provP: "When you call",
    provPAfter: ", the SDK provisions its own mutual-TLS leaf certificate before opening any real traffic. The flow:",
    provSteps: [
      <>
        The SDK generates an <strong className="text-foreground">ECDSA P-256</strong> key pair and a
        PKCS#10 CSR locally, entirely inside your process.
      </>,
      <>
        It opens a gRPC channel pinned to the CA embedded in the service key, then calls{" "}
        <Mono>Bootstrap.Provision</Mono> sending the <strong className="text-foreground">key id,
        secret and CSR</strong> — never the private key.
      </>,
      <>
        The runtime verifies the key, signs the CSR and returns the leaf certificate, the CA chain,
        and the service identity (<Mono>serviceId</Mono>, <Mono>serviceName</Mono>,{" "}
        <Mono>instanceId</Mono>) plus an expiry.
      </>,
      <>
        The SDK builds mutual-TLS credentials from the leaf and CA and opens the control stream. From
        here on every connection is mutual TLS.{" "}
        <strong className="text-foreground">The private key never leaves your process.</strong>
      </>,
    ],
    provLeafP: "Leaf certificates are short-lived — at most",
    provLeafP2: "Well before a leaf expires the SDK rotates it automatically: it calls",
    provLeafP3: "over the existing authenticated channel to get a fresh leaf, brings up the new session, then drops the old one (overlap rotation, no dropped requests). The leaf carries a SPIFFE identity in its SAN, e.g.",
    provCallout: "You do not pass certificates, CA files, or TLS options to the constructor. A single service key is enough — the SDK does the rest at",

    archTitle: "Architecture",
    archP: "Three connection types, all mutual TLS, all rooted at the same CA:",
    archItems: [
      <>
        <strong className="text-foreground">SDK ↔ runtime control plane (port 14445):</strong>{" "}
        mutual TLS. The SDK presents its provisioned leaf; the runtime presents its CA-signed server
        certificate. Identity travels in the leaf, not in a header.
      </>,
      <>
        <strong className="text-foreground">Worker ↔ worker (direct RPC):</strong> full mutual TLS.
        Each side verifies the other's leaf chains up to the same CA. Hostname checks are off by
        design — trust comes from the chain, since leaf SANs are SPIFFE URIs, not DNS names.
      </>,
      <>
        <strong className="text-foreground">Runtime → worker:</strong> the runtime presents its
        server certificate as a client certificate and verifies the worker's leaf against the CA.
      </>,
    ],
    archOutageP: "If the runtime is briefly unavailable, direct RPC between two workers keeps working: they already hold each other's certificates and addresses from the last discovery refresh, and both leaves still chain to the same CA.",
    keysCallout1: "Certificates are issued per service key, and the leaf identity is the service from that key. See",
    keysCalloutBtn: "Service Keys & RBAC",
    keysCallout2: "for what a key may do and how per-handler access is enforced.",
  },
  ru: {
    badge: "Production",
    title: "TLS / mTLS",
    description:
      "Каждое соединение SDK ↔ runtime и воркер ↔ воркер идёт поверх взаимного TLS. Сертификаты выдаются автоматически через gRPC по одному service key — без cert-manager, без Vault, без ручного PKI.",

    autoTitle: "Автосгенерированный CA",
    autoP1: "При первом обращении runtime генерирует самоподписанный CA (EC P-256) и хранит его в Postgres — одна строка в таблице runtime_ca с сертификатом и приватным ключом в DER:",
    autoP2: "Runtime никогда не пишет CA на диск: нет volume certs/ и нечего настраивать. При последующих запусках он перечитывает ту же строку из Postgres и переиспользует её, поэтому контейнер остаётся stateless и его можно свободно пересоздавать. Postgres — единственный источник истины по CA.",
    autoP3: "Приватный ключ CA никогда не покидает процесс runtime — наружу отдаётся только сертификат CA (DER), встроенный в каждый service key. gRPC-листенер использует серверный сертификат, подписанный этим CA, закешированный один раз при старте, с TLS 1.3 как минимальной версией.",
    autoKeyP: "Service key — это строка с префиксом",
    autoKeyP2: ", которая несёт адрес runtime, id ключа, секрет и встроенный сертификат CA. Этот встроенный CA — корень доверия, к которому SDK привязывается (pin), поэтому самое первое соединение уже проверено и ничего настраивать не нужно.",

    provTitle: "Провижининг gRPC в SDK",
    provP: "При вызове",
    provPAfter: ", SDK выдаёт собственный leaf-сертификат для взаимного TLS до того, как пойдёт реальный трафик. Поток:",
    provSteps: [
      <>
        SDK генерирует пару ключей <strong className="text-foreground">ECDSA P-256</strong> и CSR в
        формате PKCS#10 локально, целиком внутри вашего процесса.
      </>,
      <>
        Открывает gRPC-канал, привязанный к CA, встроенному в service key, и вызывает{" "}
        <Mono>Bootstrap.Provision</Mono>, отправляя <strong className="text-foreground">id ключа,
        секрет и CSR</strong> — но не приватный ключ.
      </>,
      <>
        Runtime проверяет ключ, подписывает CSR и возвращает leaf-сертификат, цепочку CA и
        идентичность сервиса (<Mono>serviceId</Mono>, <Mono>serviceName</Mono>,{" "}
        <Mono>instanceId</Mono>) вместе со сроком действия.
      </>,
      <>
        SDK строит credentials взаимного TLS из leaf и CA и открывает control-поток. Дальше каждое
        соединение — взаимный TLS.{" "}
        <strong className="text-foreground">Приватный ключ никогда не покидает ваш процесс.</strong>
      </>,
    ],
    provLeafP: "Leaf-сертификаты короткоживущие — не более",
    provLeafP2: "Задолго до истечения leaf SDK ротирует его автоматически: вызывает",
    provLeafP3: "по уже аутентифицированному каналу, получает свежий leaf, поднимает новую сессию и затем закрывает старую (overlap-ротация, без потерянных запросов). Leaf несёт SPIFFE-идентичность в SAN, например",
    provCallout: "Вы не передаёте в конструктор сертификаты, файлы CA или TLS-опции. Достаточно одного service key — всё остальное SDK делает на",

    archTitle: "Архитектура",
    archP: "Три типа соединений, все — взаимный TLS, все с корнем в одном CA:",
    archItems: [
      <>
        <strong className="text-foreground">SDK ↔ runtime, плоскость управления (порт 14445):</strong>{" "}
        взаимный TLS. SDK предъявляет выданный leaf; runtime предъявляет серверный сертификат,
        подписанный CA. Идентичность едет в leaf, а не в заголовке.
      </>,
      <>
        <strong className="text-foreground">Воркер ↔ воркер (прямой RPC):</strong> полный взаимный
        TLS. Каждая сторона проверяет, что leaf другой стороны выстраивается в цепочку до того же CA.
        Проверка hostname отключена осознанно — доверие даёт цепочка, так как SAN у leaf — это SPIFFE
        URI, а не DNS-имена.
      </>,
      <>
        <strong className="text-foreground">Runtime → воркер:</strong> runtime предъявляет свой
        серверный сертификат как клиентский и проверяет leaf воркера против CA.
      </>,
    ],
    archOutageP: "Если runtime ненадолго недоступен, прямой RPC между двумя воркерами продолжает работать: у них уже есть сертификаты и адреса друг друга из последнего обновления discovery, и оба leaf по-прежнему выстраиваются в цепочку до того же CA.",
    keysCallout1: "Сертификаты выдаются на каждый service key, и идентичность leaf — это сервис из этого ключа. См.",
    keysCalloutBtn: "Service Keys & RBAC",
    keysCallout2: "о том, что ключ может делать и как применяется доступ на уровне обработчиков.",
  },
};

export function PageTlsMtls() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="tls-auto">{t.autoTitle}</H2>
      <P>{t.autoP1}</P>
      <DocCodeBlock lang="sql" code={`-- runtime_ca: one row, id = 1
-- cert_der   bytea   CA certificate (DER)
-- key_der    bytea   CA private key  (DER, never leaves the runtime)
SELECT cert_der, key_der FROM runtime_ca WHERE id = 1;`} />
      <P>{t.autoP2}</P>
      <P>{t.autoP3}</P>
      <P>
        {t.autoKeyP} <Mono>sb.</Mono> {t.autoKeyP2}
      </P>

      <H2 id="tls-provision">{t.provTitle}</H2>
      <P>
        {t.provP} <Mono>sb.start()</Mono>{t.provPAfter}
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm my-3">
        {t.provSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <MultiCodeBlock
        code={{
          ts: `import { ServiceBridge } from "service-bridge";

// One service key is all the TLS material you provide.
// start() provisions the mTLS leaf and opens the encrypted control stream.
const sb = new ServiceBridge("localhost:14445", serviceKey);

await sb.start();
// from here every connection is mutual TLS

const id = sb.identity();
// { sessionId, serviceId, serviceName, instanceId }`,
          go: `// One service key is all the TLS material you provide.
// Start provisions the mTLS leaf and opens the encrypted control stream.
c, err := sb.New("localhost:14445", serviceKey)
if err != nil {
	log.Fatal(err)
}

if err := c.Start(ctx); err != nil {
	log.Fatal(err)
}
// from here every connection is mutual TLS

id := c.Identity()
log.Println(id.SessionID, id.ServiceID, id.ServiceName, id.InstanceID)`,
        }}
      />
      <P>
        {t.provLeafP} <Mono>1 hour</Mono>. {t.provLeafP2} <Mono>Control.RefreshCert</Mono>{" "}
        {t.provLeafP3}{" "}
        <Mono>spiffe://servicebridge/service/&lt;serviceId&gt;/instance/&lt;instanceId&gt;</Mono>.
      </P>
      <Callout type="info">
        {t.provCallout} <Mono>sb.start()</Mono>.
      </Callout>

      <H2 id="tls-arch">{t.archTitle}</H2>
      <P>{t.archP}</P>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm my-3">
        {t.archItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <P>{t.archOutageP}</P>

      <Callout type="info">
        {t.keysCallout1}{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("sb-nav", { detail: "service-keys" }))
          }
        >
          {t.keysCalloutBtn}
        </button>{" "}
        {t.keysCallout2}
      </Callout>
    </div>
  );
}
