import { MultiCodeBlock } from "../../ui/CodeBlock";
import {
  Callout,
  DocCodeBlock,
  H2,
  Mono,
  P,
  PageHeader,
  ParamTable,
} from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "HTTP Integration",
    title: "Middleware",
    description:
      "Attach your own HTTP server (Express, Fastify, or Hono) to ServiceBridge. The runtime never proxies business HTTP. These helpers only catalog your routes, publish the server endpoint, and instrument each request with tracing.",

    whatTitle: "What it does",
    whatP:
      "Business HTTP is not proxied by the runtime (ADR 0001). You run your own HTTP server; the integration plugs into it and does four things on top:",
    whatItem1: "Walks the framework's route table and registers every route in",
    whatItem1End:
      "— routes show up in the dashboard Service Map and Service Discovery.",
    whatItem2: "Publishes the server's address as this instance's HTTP endpoint in the registry.",
    whatItem3Start: "Reads the incoming",
    whatItem3End:
      "header and runs the whole request inside that trace context, so any",
    whatItem3Tail:
      "you make from the handler inherits the same trace.",
    whatItem4Start: "Emits one",
    whatItem4Mid: "operation per request, ending",
    whatItem4Suc: "(status < 400),",
    whatItem4Err: "(status >= 400), or",
    whatItem4Tmo: "(client abort).",

    onlyThreeCallout:
      "Three integrations exist today: Express, Fastify, and Hono, all on Node. FastAPI, Flask, and Go web frameworks are roadmap, not shipped.",
    pkgCallout:
      "The package is published as service-bridge. HTTP integrations are subpath exports: service-bridge/express, service-bridge/fastify, service-bridge/hono.",
    beforeStartCallout:
      "Attach before sb.start(). The endpoint and routes land in the registry and ship in the first registration. It is safe to attach before the worker connects.",

    paramHostDesc:
      "Host published as this instance's HTTP endpoint in the registry. Defaults to 127.0.0.1, so set it to a reachable address when other services need to call you.",
    paramPortDesc:
      "Port your HTTP server actually listens on. Express and Hono need it explicitly, since the framework may bind to 0 and the real port is unknown when routes are collected.",

    expressTitle: "Express",
    expressP:
      "Call attachExpress after your routes are defined. It walks the router stack (including sub-routers mounted with app.use) and installs the trace middleware. Use express.json() if you want request bodies captured.",

    fastifyTitle: "Fastify",
    fastifyP:
      "Register sbFastify as a plugin. It collects routes via the onRoute hook and reads the real listen port in onListen, so { port: 0 } works. No explicit port needed.",
    paramSbDesc: "The ServiceBridge instance to attach to.",
    paramFastifyHostDesc:
      "Optional published host. Defaults to 127.0.0.1; set it when the endpoint must be reachable from other hosts.",

    honoTitle: "Hono",
    honoP:
      "Hono is server-agnostic and does not open a socket itself. You start Bun.serve (or @hono/node-server) yourself, then call attachHono with the same port. It collects routes from app.routes and wraps app.fetch for tracing.",
  },
  ru: {
    badge: "HTTP Integration",
    title: "Middleware",
    description:
      "Подключите свой HTTP-сервер (Express, Fastify или Hono) к ServiceBridge. Рантайм не проксирует бизнес-HTTP — эти хелперы только заносят ваши роуты в каталог, публикуют адрес сервера и инструментируют каждый запрос трассировкой.",

    whatTitle: "Что делает",
    whatP:
      "Бизнес-HTTP не проксируется рантаймом (ADR 0001). Вы запускаете свой HTTP-сервер; интеграция подключается к нему и делает поверх четыре вещи:",
    whatItem1: "Обходит таблицу роутов фреймворка и регистрирует каждый роут в",
    whatItem1End:
      "— роуты появляются в Service Map дашборда и в Service Discovery.",
    whatItem2: "Публикует адрес сервера как HTTP-endpoint этого инстанса в реестре.",
    whatItem3Start: "Читает входящий заголовок",
    whatItem3End:
      "и выполняет весь запрос внутри этого контекста трассировки — любой",
    whatItem3Tail:
      "из обработчика наследует тот же трейс.",
    whatItem4Start: "Эмиттит одну операцию",
    whatItem4Mid: "на запрос, завершая её как",
    whatItem4Suc: "(статус < 400),",
    whatItem4Err: "(статус >= 400) или",
    whatItem4Tmo: "(обрыв клиента).",

    onlyThreeCallout:
      "Существует ровно три интеграции: Express, Fastify и Hono — все на Node. FastAPI, Flask и Go-фреймворки — это дорожная карта, а не готовый код.",
    pkgCallout:
      "Пакет публикуется как service-bridge. HTTP-интеграции — subpath-экспорты: service-bridge/express, service-bridge/fastify, service-bridge/hono.",
    beforeStartCallout:
      "Подключайте до sb.start(). Endpoint и роуты оседают в реестре и уходят в первой регистрации. Подключение до подключения воркера безопасно.",

    paramHostDesc:
      "Host, под которым этот инстанс публикует свой HTTP-endpoint в реестре. По умолчанию 127.0.0.1 — задайте достижимый адрес, если вас должны звать другие сервисы.",
    paramPortDesc:
      "Порт, на котором реально слушает ваш HTTP-сервер. Express и Hono требуют его явно — фреймворк может биндиться на 0, и реальный порт неизвестен в момент сбора роутов.",

    expressTitle: "Express",
    expressP:
      "Вызовите attachExpress после объявления роутов. Он обходит стек роутера (включая sub-роутеры, подключённые через app.use) и ставит trace-middleware. Подключите express.json(), если хотите захват тел запросов.",

    fastifyTitle: "Fastify",
    fastifyP:
      "Зарегистрируйте sbFastify как плагин. Он собирает роуты через хук onRoute и читает реальный порт прослушивания в onListen, так что { port: 0 } работает. Порт указывать явно не нужно.",
    paramSbDesc: "Экземпляр ServiceBridge, к которому подключаемся.",
    paramFastifyHostDesc:
      "Опциональный публикуемый host. По умолчанию 127.0.0.1; задайте его, когда endpoint должен быть достижим с других хостов.",

    honoTitle: "Hono",
    honoP:
      "Hono агностичен к серверу — он сам не открывает сокет. Вы сами запускаете Bun.serve (или @hono/node-server), затем вызываете attachHono с тем же портом. Он собирает роуты из app.routes и оборачивает app.fetch для трассировки.",
  },
};

export function PageHttpMiddleware() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      {/* ── What it does ─────────────────────────────────────────── */}
      <H2 id="what-it-does">{t.whatTitle}</H2>
      <P>{t.whatP}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        <li>
          {t.whatItem1} <Mono>sb.serviceMap()</Mono> {t.whatItem1End}
        </li>
        <li>{t.whatItem2}</li>
        <li>
          {t.whatItem3Start} <Mono>X-SB-Trace</Mono> {t.whatItem3End}{" "}
          <Mono>sb.rpc.call()</Mono> / <Mono>sb.event.publish()</Mono>{" "}
          {t.whatItem3Tail}
        </li>
        <li>
          {t.whatItem4Start} <Mono>HTTP.HANDLE</Mono> {t.whatItem4Mid}{" "}
          <Mono>SUCCESS</Mono> {t.whatItem4Suc} <Mono>ERROR</Mono>{" "}
          {t.whatItem4Err} <Mono>TIMEOUT</Mono> {t.whatItem4Tmo}
        </li>
      </ul>

      <Callout type="info">{t.onlyThreeCallout}</Callout>
      <Callout type="info">{t.pkgCallout}</Callout>
      <Callout type="tip">{t.beforeStartCallout}</Callout>

      {/* ── Express ──────────────────────────────────────────────── */}
      <H2 id="express">{t.expressTitle}</H2>
      <DocCodeBlock lang="bash" code={`bun add express service-bridge`} />
      <P>{t.expressP}</P>
      <MultiCodeBlock
        code={{
          ts: `import express from "express";
import { ServiceBridge } from "service-bridge";
import { attachExpress } from "service-bridge/express";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICE_KEY!);
const app = express();
app.use(express.json());

app.get("/users/:id", async (req, res) => {
  // Inside the HTTP trace context, so this call inherits the same trace.
  const user = await sb.rpc.call("users", "get", { id: req.params.id });
  res.json(user);
});

const PORT = 3000;
app.listen(PORT);

// Attach after routes are defined.
attachExpress(app, sb, { port: PORT });

await sb.start();`,
        }}
      />
      <ParamTable
        rows={[
          { name: "host", type: "string", default: "127.0.0.1", desc: t.paramHostDesc },
          { name: "port", type: "number", desc: t.paramPortDesc },
        ]}
      />

      {/* ── Fastify ──────────────────────────────────────────────── */}
      <H2 id="fastify">{t.fastifyTitle}</H2>
      <DocCodeBlock lang="bash" code={`bun add fastify service-bridge`} />
      <P>{t.fastifyP}</P>
      <MultiCodeBlock
        code={{
          ts: `import Fastify from "fastify";
import { ServiceBridge } from "service-bridge";
import { sbFastify } from "service-bridge/fastify";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICE_KEY!);
const app = Fastify();

await app.register(sbFastify, { sb });

app.get("/users/:id", async (request) => {
  const id = (request.params as { id: string }).id;
  // Trace context is active here, so nested SDK calls inherit it.
  return sb.rpc.call("users", "get", { id });
});

await app.listen({ port: 3000 });   // onListen reads the real port
await sb.start();`,
        }}
      />
      <ParamTable
        rows={[
          { name: "sb", type: "ServiceBridge", desc: t.paramSbDesc },
          { name: "host", type: "string", default: "127.0.0.1", desc: t.paramFastifyHostDesc },
        ]}
      />

      {/* ── Hono ─────────────────────────────────────────────────── */}
      <H2 id="hono">{t.honoTitle}</H2>
      <DocCodeBlock lang="bash" code={`bun add hono service-bridge`} />
      <P>{t.honoP}</P>
      <MultiCodeBlock
        code={{
          ts: `import { Hono } from "hono";
import { ServiceBridge } from "service-bridge";
import { attachHono } from "service-bridge/hono";

const sb = new ServiceBridge("localhost:14445", process.env.SERVICE_KEY!);
const app = new Hono();

app.get("/users/:id", async (c) => {
  // Request runs inside the HTTP trace context.
  const user = await sb.rpc.call("users", "get", { id: c.req.param("id") });
  return c.json(user);
});

const PORT = 3000;
Bun.serve({ port: PORT, fetch: app.fetch });

// Same port you gave Bun.serve.
attachHono(app, sb, { port: PORT });

await sb.start();`,
        }}
      />
      <ParamTable
        rows={[
          { name: "host", type: "string", default: "127.0.0.1", desc: t.paramHostDesc },
          { name: "port", type: "number", desc: t.paramPortDesc },
        ]}
      />
    </div>
  );
}
