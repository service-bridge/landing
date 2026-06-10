import { DocCodeBlock } from "../../ui/DocComponents";
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
    badge: "Getting Started",
    title: "CLI",
    description:
      "sb is a command-line client for the runtime. It talks to the UI gateway API over the same port as the dashboard (14444), logs in once, and renders every result as a table or, with -o json, as machine-readable protojson for AI agents.",
    intro:
      "There is no separate install. sb ships inside the runtime Docker image at /usr/local/bin/sb, built from the same source and stamped with the same version. Install or update the runtime and you get a matching sb.",

    installTitle: "Run it",
    installP1:
      "If the runtime runs in Docker, exec into the container. The CLI is already on the PATH:",
    installP2:
      "If you have the host binary on your machine instead, run it directly. Point it at the gateway with --addr or the SB_ADDR environment variable when it is not on the local default:",
    installCheck:
      "Confirm the CLI and the runtime agree on version — both come from the same build:",

    authTitle: "Log in",
    authP1:
      "On a fresh runtime, create the first admin account and log in in one step. On an already-initialized runtime, use login. Either way the session cookie is written to ~/.config/servicebridge/session.json (0600) and reused by every later command:",
    authP2:
      "The password comes from -p, the SB_PASSWORD environment variable, or an interactive no-echo prompt — in that order. whoami shows who you are; logout clears the session.",
    authCallout:
      "Inside a container the home directory is usually the container's. Set XDG_CONFIG_HOME or SB_SESSION_FILE to control where the session lives, or log in once per exec session.",

    outputTitle: "Output format",
    outputP1:
      "Every command takes a global -o (--output) flag. table is the default, human-readable form. json emits protojson — the exact wire shape of the gateway response, with default values included — so an agent can parse it without scraping a table:",
    outputP2:
      "Errors follow the format too. In json mode a failure prints a JSON object with the Connect status code and message instead of a table.",
    outputAgent:
      "For AI agents, always pass -o json. The shape is stable and matches the gateway contract; table output is for humans and may reflow.",

    globalTitle: "Global flags",
    globalRows: [
      { name: "-o, --output", type: "table | json", def: "table", desc: "Human table, or protojson for agents." },
      { name: "--addr", type: "string", def: "http://127.0.0.1:14444", desc: "Gateway address. Also reads SB_ADDR; http:// uses h2c, https:// uses TLS." },
      { name: "--insecure-skip-verify", type: "bool", def: "false", desc: "Skip TLS verification for an https address (self-signed)." },
    ],

    surfaceTitle: "Command overview",
    surfaceP1:
      "Commands are grouped by domain. A service is its key: service create prints the API key once — there is no separate keys concept. Run any group with --help to see its flags.",

    grpAuth: "Auth & utility",
    grpAuthRows: [
      { name: "setup", type: "—", desc: "Create the first admin account and log in" },
      { name: "login / logout", type: "—", desc: "Authenticate and persist a session / clear it" },
      { name: "whoami", type: "—", desc: "Show the current authenticated account" },
      { name: "version", type: "—", desc: "Print the sb build version" },
    ],

    grpApply: "apply",
    grpApplyRows: [
      { name: "apply -f <file>", type: "—", desc: "Apply a ServiceSet manifest atomically. --dry-run previews, --prune soft-revokes absent services, --keys-out saves new API keys to a JSON file for CI." },
    ],

    grpService: "service",
    grpServiceRows: [
      { name: "ls / get", type: "—", desc: "List services / show one" },
      { name: "create", type: "—", desc: "Create a service and print its API key (shown once)" },
      { name: "update / rm", type: "—", desc: "Update name and/or policy / delete" },
      { name: "activate / revoke", type: "—", desc: "Activate a revoked service / revoke an active one" },
      { name: "stats / metrics / activity", type: "—", desc: "Service counts / per-channel metrics / activity series" },
      { name: "policy show / set", type: "—", desc: "Show or set capabilities and allow-lists" },
      { name: "export", type: "—", desc: "Export all active services as a ServiceSet manifest (stdout or --out file)." },
      { name: "key rotate <name>", type: "—", desc: "Rotate the API key for a service by name. New key shown once — UUID and policy unchanged." },
    ],

    grpObs: "Traces, logs, metrics, map",
    grpObsRows: [
      { name: "trace ls / get / running / stats", type: "—", desc: "List traces / causal tree / in-flight ops / aggregate stats" },
      { name: "logs", type: "—", desc: "Query collected logs" },
      { name: "metrics query / server / dashboard / runs", type: "—", desc: "Metric series, server metrics, dashboard rollup, recent runs" },
      { name: "map", type: "—", desc: "Service map and connections" },
    ],

    grpAsync: "Events, jobs, workflows",
    grpAsyncRows: [
      { name: "events deliveries / patterns / pattern / pattern-events", type: "—", desc: "Delivery status and subscription patterns" },
      { name: "events dlq ls / replay / purge", type: "—", desc: "Inspect, replay, or purge the dead-letter queue" },
      { name: "job defs / def / runs / run / exec", type: "—", desc: "Job definitions, runs, and ad-hoc execution" },
      { name: "wf defs / def / def-runs / runs / run / cancel", type: "—", desc: "Workflow definitions, runs, and cancellation (alias: workflow)" },
    ],

    grpAdmin: "Registry, alerts, settings, accounts",
    grpAdminRows: [
      { name: "registry services / rpc / http / events", type: "—", desc: "Registered services and per-channel method registry (ls / get)" },
      { name: "alert rules / rule / history / channels / channel", type: "—", desc: "Alert rules, fire, history, and notification channels" },
      { name: "settings get / set", type: "—", desc: "Read settings; set one (surfaces restart_required)" },
      { name: "account ls / add / passwd / rename", type: "—", desc: "List/add accounts; change your own password or login" },
    ],

    settingsNote:
      "settings set surfaces a restart-required warning when the changed key only takes effect after a runtime restart (ports, shutdown timeout, session TTL, pprof). Other settings apply live.",

    traceTitle: "Reading a trace",
    traceP1:
      "trace get renders a compact causal tree: the root operation, then each child indented under its parent, ordered by start time. Each line carries a channel glyph (H/R/E/W/J/U), the actor, the operation name, an arrow to the peer it called, the status, and the duration (… while still running):",
    traceP2:
      "Pass -o json to get the raw operations array instead of the tree — that is the form an agent should consume.",
  },
  ru: {
    badge: "Getting Started",
    title: "CLI",
    description:
      "sb — командный клиент рантайма. Ходит в API UI-gateway по тому же порту, что и дашборд (14444), логинится один раз и рендерит результат таблицей либо, с -o json, машиночитаемым protojson для AI-агентов.",
    intro:
      "Отдельной установки нет. sb едет внутри Docker-образа рантайма по пути /usr/local/bin/sb, собран из того же исходника и проштампован той же версией. Установили или обновили рантайм — получили совпадающий sb.",

    installTitle: "Запуск",
    installP1:
      "Если рантайм работает в Docker, зайдите внутрь контейнера — CLI уже в PATH:",
    installP2:
      "Если у вас вместо этого хост-бинарь, запускайте его напрямую. Когда gateway не на локальном дефолте, укажите его через --addr или переменную окружения SB_ADDR:",
    installCheck:
      "Сверьте версию CLI и рантайма — обе из одной сборки:",

    authTitle: "Вход",
    authP1:
      "На свежем рантайме создайте первый admin-аккаунт и войдите одной командой. На уже инициализированном — используйте login. В обоих случаях session-cookie пишется в ~/.config/servicebridge/session.json (0600) и переиспользуется всеми следующими командами:",
    authP2:
      "Пароль берётся из -p, переменной окружения SB_PASSWORD или интерактивного no-echo prompt — в этом порядке. whoami показывает, кто вы; logout очищает сессию.",
    authCallout:
      "Внутри контейнера домашний каталог — обычно каталог контейнера. Задайте XDG_CONFIG_HOME или SB_SESSION_FILE, чтобы управлять, где лежит сессия, либо логиньтесь раз на каждую exec-сессию.",

    outputTitle: "Формат вывода",
    outputP1:
      "У каждой команды есть глобальный флаг -o (--output). table — человекочитаемый дефолт. json отдаёт protojson — точную wire-форму ответа gateway, со значениями по умолчанию, — чтобы агент разобрал её без парсинга таблицы:",
    outputP2:
      "Ошибки следуют тому же формату. В режиме json сбой печатает JSON-объект с Connect-кодом статуса и сообщением вместо таблицы.",
    outputAgent:
      "Для AI-агентов всегда передавайте -o json. Форма стабильна и совпадает с контрактом gateway; табличный вывод — для людей и может переформатироваться.",

    globalTitle: "Глобальные флаги",
    globalRows: [
      { name: "-o, --output", type: "table | json", def: "table", desc: "Таблица для людей или protojson для агентов." },
      { name: "--addr", type: "string", def: "http://127.0.0.1:14444", desc: "Адрес gateway. Также читает SB_ADDR; http:// — h2c, https:// — TLS." },
      { name: "--insecure-skip-verify", type: "bool", def: "false", desc: "Пропустить проверку TLS для https-адреса (self-signed)." },
    ],

    surfaceTitle: "Обзор команд",
    surfaceP1:
      "Команды сгруппированы по домену. Сервис — это его ключ: service create печатает API-ключ один раз, отдельной концепции «ключей» нет. Любую группу можно вызвать с --help, чтобы увидеть флаги.",

    grpAuth: "Auth и утилиты",
    grpAuthRows: [
      { name: "setup", type: "—", desc: "Создать первый admin-аккаунт и войти" },
      { name: "login / logout", type: "—", desc: "Аутентифицироваться и сохранить сессию / очистить её" },
      { name: "whoami", type: "—", desc: "Показать текущий аутентифицированный аккаунт" },
      { name: "version", type: "—", desc: "Напечатать build-версию sb" },
    ],

    grpApply: "apply",
    grpApplyRows: [
      { name: "apply -f <file>", type: "—", desc: "Применить манифест ServiceSet атомарно. --dry-run показывает diff, --prune soft-revoke отсутствующих сервисов, --keys-out сохраняет новые API-ключи в JSON-файл для CI." },
    ],

    grpService: "service",
    grpServiceRows: [
      { name: "ls / get", type: "—", desc: "Список сервисов / показать один" },
      { name: "create", type: "—", desc: "Создать сервис и напечатать его API-ключ (показывается один раз)" },
      { name: "update / rm", type: "—", desc: "Обновить имя и/или политику / удалить" },
      { name: "activate / revoke", type: "—", desc: "Активировать отозванный сервис / отозвать активный" },
      { name: "stats / metrics / activity", type: "—", desc: "Счётчики сервисов / per-channel метрики / ряды активности" },
      { name: "policy show / set", type: "—", desc: "Показать или задать возможности и allow-листы" },
      { name: "export", type: "—", desc: "Экспортировать все активные сервисы как манифест ServiceSet (stdout или --out файл)." },
      { name: "key rotate <name>", type: "—", desc: "Ротировать API-ключ сервиса по имени. Новый ключ показывается один раз — UUID и политика не меняются." },
    ],

    grpObs: "Трейсы, логи, метрики, карта",
    grpObsRows: [
      { name: "trace ls / get / running / stats", type: "—", desc: "Список трейсов / причинное дерево / активные операции / агрегаты" },
      { name: "logs", type: "—", desc: "Запрос собранных логов" },
      { name: "metrics query / server / dashboard / runs", type: "—", desc: "Ряды метрик, серверные метрики, сводка дашборда, недавние запуски" },
      { name: "map", type: "—", desc: "Карта сервисов и связей" },
    ],

    grpAsync: "События, задачи, воркфлоу",
    grpAsyncRows: [
      { name: "events deliveries / patterns / pattern / pattern-events", type: "—", desc: "Статус доставки и паттерны подписок" },
      { name: "events dlq ls / replay / purge", type: "—", desc: "Просмотр, воспроизведение или очистка dead-letter queue" },
      { name: "job defs / def / runs / run / exec", type: "—", desc: "Определения задач, запуски и ad-hoc выполнение" },
      { name: "wf defs / def / def-runs / runs / run / cancel", type: "—", desc: "Определения воркфлоу, запуски и отмена (alias: workflow)" },
    ],

    grpAdmin: "Реестр, алерты, настройки, аккаунты",
    grpAdminRows: [
      { name: "registry services / rpc / http / events", type: "—", desc: "Зарегистрированные сервисы и per-channel реестр методов (ls / get)" },
      { name: "alert rules / rule / history / channels / channel", type: "—", desc: "Правила алертов, fire, история и каналы уведомлений" },
      { name: "settings get / set", type: "—", desc: "Прочитать настройки; задать одну (поднимает restart_required)" },
      { name: "account ls / add / passwd / rename", type: "—", desc: "Список/добавление аккаунтов; смена своего пароля или логина" },
    ],

    settingsNote:
      "settings set поднимает предупреждение о необходимости перезапуска, когда изменённый ключ вступает в силу только после рестарта рантайма (порты, shutdown-timeout, TTL сессии, pprof). Остальные настройки применяются на лету.",

    traceTitle: "Чтение трейса",
    traceP1:
      "trace get рисует компактное причинно-следственное дерево: корневая операция, затем каждый потомок с отступом под своим родителем, по времени старта. В каждой строке: глиф канала (H/R/E/W/J/U), актор, имя операции, стрелка к peer, статус и длительность (… пока операция работает):",
    traceP2:
      "Передайте -o json, чтобы получить сырой массив операций вместо дерева — именно эту форму должен потреблять агент.",
  },
};

const RUN_DOCKER = `# the CLI is inside the runtime image
docker exec -it <container> sb whoami

# or run a one-off command
docker exec -it <container> sb service ls`;

const RUN_HOST = `sb --addr http://runtime.internal:14444 service ls

# or set it once for the shell
export SB_ADDR=http://runtime.internal:14444
sb service ls`;

const CHECK = `sb version
# dev   (or the stamped release version, identical to the runtime)`;

const LOGIN = `# fresh runtime: create the first admin and log in
sb setup -u admin

# already initialized: just log in
sb login -u admin

sb whoami
# admin`;

const OUTPUT = `sb service ls -o json
# {
#   "services": [
#     { "id": "...", "name": "payments", "status": "active", ... }
#   ]
# }`;

const CREATE = `sb service create payments
# service payments created (id 0a1b...)
# API key (shown once, store it now):
# sb.AbC123...`;

const TRACE = `sb trace get 9f3c1a2b
# trace 9f3c1a2b…  checkout  SUCCESS  142ms  (5 ops)
# └─ W orders checkout  SUCCESS  142ms
#    ├─ R orders Charge → payments  SUCCESS  38ms
#    └─ E orders order.placed  SUCCESS  4ms`;

export function PageCli() {
  const { locale } = useDocLocale();
  const t = T[locale];

  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <P>{t.intro}</P>

      <H2 id="run">{t.installTitle}</H2>
      <P>{t.installP1}</P>
      <DocCodeBlock code={RUN_DOCKER} lang="bash" />
      <P>{t.installP2}</P>
      <DocCodeBlock code={RUN_HOST} lang="bash" />
      <P>{t.installCheck}</P>
      <DocCodeBlock code={CHECK} lang="bash" />

      <H2 id="login">{t.authTitle}</H2>
      <P>{t.authP1}</P>
      <DocCodeBlock code={LOGIN} lang="bash" />
      <P>{t.authP2}</P>
      <Callout type="info">{t.authCallout}</Callout>

      <H2 id="output">{t.outputTitle}</H2>
      <P>{t.outputP1}</P>
      <DocCodeBlock code={OUTPUT} lang="bash" />
      <P>{t.outputP2}</P>
      <Callout type="tip">{t.outputAgent}</Callout>

      <H3 id="global-flags">{t.globalTitle}</H3>
      <ParamTable
        rows={t.globalRows.map((r) => ({ name: r.name, type: r.type, default: r.def, desc: r.desc }))}
      />

      <H2 id="commands">{t.surfaceTitle}</H2>
      <P>{t.surfaceP1}</P>

      <H3 id="auth-util">{t.grpAuth}</H3>
      <ParamTable rows={t.grpAuthRows} />

      <H3 id="apply">{t.grpApply}</H3>
      <ParamTable rows={t.grpApplyRows} />

      <H3 id="service">{t.grpService}</H3>
      <P>
        <Mono>sb service create &lt;name&gt;</Mono>
      </P>
      <DocCodeBlock code={CREATE} lang="bash" />
      <ParamTable rows={t.grpServiceRows} />

      <H3 id="observability">{t.grpObs}</H3>
      <ParamTable rows={t.grpObsRows} />

      <H3 id="async">{t.grpAsync}</H3>
      <ParamTable rows={t.grpAsyncRows} />

      <H3 id="admin">{t.grpAdmin}</H3>
      <ParamTable rows={t.grpAdminRows} />
      <Callout type="info">{t.settingsNote}</Callout>

      <H2 id="trace-tree">{t.traceTitle}</H2>
      <P>{t.traceP1}</P>
      <DocCodeBlock code={TRACE} lang="bash" />
      <P>{t.traceP2}</P>
    </div>
  );
}
