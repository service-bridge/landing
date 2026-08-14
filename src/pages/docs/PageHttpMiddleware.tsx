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
    badge: "HTTP Integration",
    title: "Middleware",
    description:
      "Attach your own HTTP server — Express, Fastify or Hono on Node, net/http, chi or gin on Go — to ServiceBridge. The runtime never proxies business HTTP. These helpers only catalog your routes, publish the server endpoint, and instrument each request with tracing.",

    whatTitle: "What it does",
    whatP:
      "Business HTTP is not proxied by the runtime (ADR 0001). You run your own HTTP server; the integration plugs into it and does four things on top:",
    whatItem1:
      "Walks the framework's route table and declares every route to the registry, so routes show up in the dashboard Service Map and in Service Discovery.",
    whatItem2: "Publishes the server's address as this instance's HTTP endpoint in the registry.",
    whatItem3Start: "Reads the incoming",
    whatItem3End:
      "header and runs the whole request inside that trace context, so every RPC call and event publish you make from the handler inherits the same trace.",
    whatItem3Tail: "",
    whatItem4Start: "Emits one",
    whatItem4Mid: "operation per request, ending",
    whatItem4Suc: "(status < 400),",
    whatItem4Err: "(status >= 400), or",
    whatItem4Tmo: "(client abort).",

    onlyThreeCallout:
      "Node ships Express, Fastify and Hono. Go ships net/http and chi inside sbhttp, plus gin as the separate sbgin module. FastAPI and Flask are roadmap, not shipped.",
    pkgCallout:
      "The Node package is service-bridge and the HTTP integrations are subpath exports: service-bridge/express, service-bridge/fastify, service-bridge/hono. In Go they are github.com/service-bridge/sdk/go/sbhttp for net/http and chi, and github.com/service-bridge/sdk/go/sbgin — its own module, because Go has no optional dependencies and gin in the main module would land in every SDK user's dependency graph.",
    beforeStartCallout:
      "Attach before you start the client. The endpoint and routes land in the registry and ship in the first registration, so attaching before the worker connects is safe. Publishing after start is allowed too: it reopens the registry stream so the routes arrive now rather than at the next reconnect.",

    paramHostDesc:
      "Host published as this instance's HTTP endpoint in the registry. Defaults to 127.0.0.1, so set it to a reachable address when other services need to call you.",
    paramPortDesc:
      "Port your HTTP server actually listens on. Express, Hono and every Go integration need it explicitly, since a server bound to :0 does not know its port when routes are collected.",

    expressTitle: "Express · net/http",
    expressP:
      "Call attachExpress after your routes are defined. It walks the router stack (including sub-routers mounted with app.use) and installs the trace middleware. Use express.json() if you want request bodies captured. On Go, sbhttp.NewMux is a thin wrapper over http.ServeMux that remembers the patterns you register; PublishMux hands them to the registry and Middleware wraps each request in one span.",

    fastifyTitle: "Fastify · chi",
    fastifyP:
      "Register sbFastify as a plugin. It collects routes via the onRoute hook and reads the real listen port in onListen, so { port: 0 } works. No explicit port needed. On Go, keep the chi router you already own: integration.PublishChi walks it and integration.Middleware plugs into r.Use.",
    paramSbDesc: "The ServiceBridge instance to attach to.",
    paramFastifyHostDesc:
      "Optional published host. Defaults to 127.0.0.1; set it when the endpoint must be reachable from other hosts.",

    honoTitle: "Hono · gin",
    honoP:
      "Hono is server-agnostic and does not open a socket itself. You start Bun.serve (or @hono/node-server) yourself, then call attachHono with the same port. It collects routes from app.routes and wraps app.fetch for tracing. On Go, gin lives in the separate sbgin module: install sbgin.Middleware before the routes, since gin runs handlers in registration order, and publish with sbgin.Publish.",
  },
  ru: {
    badge: "HTTP Integration",
    title: "Middleware",
    description:
      "Подключите свой HTTP-сервер — Express, Fastify или Hono на Node, net/http, chi или gin на Go — к ServiceBridge. Рантайм не проксирует бизнес-HTTP: эти хелперы только заносят ваши роуты в каталог, публикуют адрес сервера и инструментируют каждый запрос трассировкой.",

    whatTitle: "Что делает",
    whatP:
      "Бизнес-HTTP не проксируется рантаймом (ADR 0001). Вы запускаете свой HTTP-сервер; интеграция подключается к нему и делает поверх четыре вещи:",
    whatItem1:
      "Обходит таблицу роутов фреймворка и объявляет каждый роут реестру — роуты появляются в Service Map дашборда и в Service Discovery.",
    whatItem2: "Публикует адрес сервера как HTTP-endpoint этого инстанса в реестре.",
    whatItem3Start: "Читает входящий заголовок",
    whatItem3End:
      "и выполняет весь запрос внутри этого контекста трассировки — каждый RPC-вызов и публикация события из обработчика наследуют тот же трейс.",
    whatItem3Tail: "",
    whatItem4Start: "Эмиттит одну операцию",
    whatItem4Mid: "на запрос, завершая её как",
    whatItem4Suc: "(статус < 400),",
    whatItem4Err: "(статус >= 400) или",
    whatItem4Tmo: "(обрыв клиента).",

    onlyThreeCallout:
      "На Node есть Express, Fastify и Hono. На Go — net/http и chi внутри sbhttp плюс gin отдельным модулем sbgin. FastAPI и Flask — дорожная карта, а не готовый код.",
    pkgCallout:
      "Node-пакет — service-bridge, HTTP-интеграции в нём subpath-экспорты: service-bridge/express, service-bridge/fastify, service-bridge/hono. В Go это github.com/service-bridge/sdk/go/sbhttp для net/http и chi и github.com/service-bridge/sdk/go/sbgin — отдельный модуль, потому что в Go нет опциональных зависимостей и gin в основном модуле попал бы в граф зависимостей каждого пользователя SDK.",
    beforeStartCallout:
      "Подключайте до старта клиента. Endpoint и роуты оседают в реестре и уходят в первой регистрации, поэтому подключаться до соединения воркера безопасно. Публиковать после старта тоже можно: реестровый стрим переоткрывается, и роуты доезжают сразу, а не при следующем переподключении.",

    paramHostDesc:
      "Host, под которым этот инстанс публикует свой HTTP-endpoint в реестре. По умолчанию 127.0.0.1 — задайте достижимый адрес, если вас должны звать другие сервисы.",
    paramPortDesc:
      "Порт, на котором реально слушает ваш HTTP-сервер. Express, Hono и все Go-интеграции требуют его явно — сервер, привязанный к :0, не знает своего порта в момент сбора роутов.",

    expressTitle: "Express · net/http",
    expressP:
      "Вызовите attachExpress после объявления роутов. Он обходит стек роутера (включая sub-роутеры, подключённые через app.use) и ставит trace-middleware. Подключите express.json(), если хотите захват тел запросов. В Go sbhttp.NewMux — тонкая обёртка над http.ServeMux, которая запоминает регистрируемые паттерны; PublishMux отдаёт их в реестр, а Middleware оборачивает каждый запрос в один спан.",

    fastifyTitle: "Fastify · chi",
    fastifyP:
      "Зарегистрируйте sbFastify как плагин. Он собирает роуты через хук onRoute и читает реальный порт прослушивания в onListen, так что { port: 0 } работает. Порт указывать явно не нужно. В Go оставьте свой chi-роутер: integration.PublishChi его обходит, а integration.Middleware подключается через r.Use.",
    paramSbDesc: "Экземпляр ServiceBridge, к которому подключаемся.",
    paramFastifyHostDesc:
      "Опциональный публикуемый host. По умолчанию 127.0.0.1; задайте его, когда endpoint должен быть достижим с других хостов.",

    honoTitle: "Hono · gin",
    honoP:
      "Hono агностичен к серверу — он сам не открывает сокет. Вы сами запускаете Bun.serve (или @hono/node-server), затем вызываете attachHono с тем же портом. Он собирает роуты из app.routes и оборачивает app.fetch для трассировки. В Go gin живёт в отдельном модуле sbgin: ставьте sbgin.Middleware до роутов, потому что gin выполняет обработчики в порядке регистрации, и публикуйте через sbgin.Publish.",
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
        <li>{t.whatItem1}</li>
        <li>{t.whatItem2}</li>
        <li>
          {t.whatItem3Start} <Mono>X-SB-Trace</Mono> {t.whatItem3End}{" "}
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
      <MultiCodeBlock
        code={{
          ts: `bun add express service-bridge`,
          go: `go get github.com/service-bridge/sdk/go`,
        }}
      />
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
          go: `package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"example.com/gen/userpb"
	sb "github.com/service-bridge/sdk/go"
	"github.com/service-bridge/sdk/go/sbhttp"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	users, err := sb.NewMethod[*userpb.GetUserRequest, *userpb.User](
		sb.NewClient(c, "users"), "get")
	if err != nil {
		log.Fatal(err)
	}

	integration, err := sbhttp.New(c)
	if err != nil {
		log.Fatal(err)
	}

	// NewMux remembers the patterns as you register them.
	mux := sbhttp.NewMux()
	mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
		// Inside the HTTP trace context, so this call inherits the same trace.
		user, err := users.Call(r.Context(), &userpb.GetUserRequest{Id: r.PathValue("id")})
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		fmt.Fprint(w, user.GetName())
	})

	// Publish before Start: the endpoint rides the first registration.
	if err := integration.PublishMux(mux, sbhttp.Endpoint{Host: "10.0.0.4", Port: 3000}); err != nil {
		log.Fatal(err)
	}

	if err := c.Start(context.Background()); err != nil {
		log.Fatal(err)
	}

	srv := &http.Server{Addr: ":3000", Handler: integration.Middleware(mux)}
	log.Fatal(srv.ListenAndServe())
}`,
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
      <MultiCodeBlock
        code={{
          ts: `bun add fastify service-bridge`,
          go: `go get github.com/service-bridge/sdk/go github.com/go-chi/chi/v5`,
        }}
      />
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
          go: `package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"example.com/gen/userpb"
	"github.com/go-chi/chi/v5"
	sb "github.com/service-bridge/sdk/go"
	"github.com/service-bridge/sdk/go/sbhttp"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	users, err := sb.NewMethod[*userpb.GetUserRequest, *userpb.User](
		sb.NewClient(c, "users"), "get")
	if err != nil {
		log.Fatal(err)
	}

	integration, err := sbhttp.New(c)
	if err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Use(integration.Middleware) // trace context is active in every handler
	r.Get("/users/{id}", func(w http.ResponseWriter, req *http.Request) {
		user, err := users.Call(req.Context(), &userpb.GetUserRequest{
			Id: chi.URLParam(req, "id"),
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		fmt.Fprint(w, user.GetName())
	})

	// PublishChi walks the router you already own — no wrapper mux needed.
	if err := integration.PublishChi(r, sbhttp.Endpoint{Host: "10.0.0.4", Port: 3000}); err != nil {
		log.Fatal(err)
	}

	if err := c.Start(context.Background()); err != nil {
		log.Fatal(err)
	}
	log.Fatal(http.ListenAndServe(":3000", r))
}`,
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
      <MultiCodeBlock
        code={{
          ts: `bun add hono service-bridge`,
          go: `go get github.com/service-bridge/sdk/go/sbgin`,
        }}
      />
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
          go: `package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"example.com/gen/userpb"
	"github.com/gin-gonic/gin"
	sb "github.com/service-bridge/sdk/go"
	"github.com/service-bridge/sdk/go/sbgin"
	"github.com/service-bridge/sdk/go/sbhttp"
)

func main() {
	c, err := sb.New("localhost:14445", os.Getenv("SERVICE_KEY"))
	if err != nil {
		log.Fatal(err)
	}

	users, err := sb.NewMethod[*userpb.GetUserRequest, *userpb.User](
		sb.NewClient(c, "users"), "get")
	if err != nil {
		log.Fatal(err)
	}

	integration, err := sbhttp.New(c)
	if err != nil {
		log.Fatal(err)
	}

	engine := gin.New()
	// Before the routes: gin runs handlers in registration order.
	engine.Use(sbgin.Middleware(integration))
	engine.GET("/users/:id", func(gc *gin.Context) {
		user, err := users.Call(gc.Request.Context(), &userpb.GetUserRequest{
			Id: gc.Param("id"),
		})
		if err != nil {
			gc.String(http.StatusBadGateway, err.Error())
			return
		}
		gc.String(http.StatusOK, user.GetName())
	})

	if err := sbgin.Publish(integration, engine, sbhttp.Endpoint{Host: "10.0.0.4", Port: 3000}); err != nil {
		log.Fatal(err)
	}

	if err := c.Start(context.Background()); err != nil {
		log.Fatal(err)
	}
	log.Fatal(engine.Run(":3000"))
}`,
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
