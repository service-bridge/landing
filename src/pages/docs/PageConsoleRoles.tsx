import { DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const CLI_LS = `$ sb account ls
LOGIN     ROLE     CREATED
admin     admin    2026-01-04 10:12
operator  viewer   2026-02-11 09:03`;

const CLI_ADD = `$ sb account add --user operator --role viewer
Password for new account: ********
account operator created (id 3f9c..., role viewer)`;

const CLI_RM = `$ sb account rm 3f9c...
account 3f9c... deleted`;

const T = {
  en: {
    badge: "Production",
    title: "Console Roles",
    description:
      "Every UI console account has exactly one role, ROLE_ADMIN or ROLE_VIEWER, enforced server-side on the gRPC procedures the console (and the sb CLI) call. This page covers what a viewer can and cannot do, and why.",

    schemaTitle: "Schema & default",
    schemaDesc:
      "Role lives on uigw_users.role, a TEXT column constrained to admin or viewer, added by migration 0014_uigw_users_role.sql. It defaults to admin, so accounts created before this migration keep full access — nobody is locked out by the upgrade.",
    schemaEnumNote:
      "On the wire, role is the Role enum from servicebridge/ui/v1/ui.proto: ROLE_ADMIN = 1, ROLE_VIEWER = 2. ROLE_UNSPECIFIED (0) has no storage representation and is rejected wherever a concrete role is required.",

    enforceTitle: "How it's enforced",
    enforceDesc:
      "A unary auth interceptor on the UI gateway (runtime/internal/uigw/server.go) reads the caller's role fresh from the database on every request — never from the session cookie — so a role change or account deletion takes effect on that account's very next call. Before the handler runs, the interceptor checks the called procedure against a fixed set of mutating procedures; if the caller is ROLE_VIEWER and the procedure is in that set, the call is rejected with PermissionDenied before any handler code executes.",
    enforceCallout:
      "Read-only calls are unaffected — a viewer can list services, read settings, browse traces, and everything else that doesn't write state or reveal a secret (e.g. a service key).",

    selfTitle: "The self-account exception",
    selfDesc:
      "Logout, ChangePassword, and ChangeUsername are deliberately left out of the mutating-procedure set. All three act only on the caller's own account.",
    selfWhy:
      "A viewer session must be able to end itself and rotate its own credentials. If those calls were gated the same as everything else, a viewer whose password was compromised would have no way to change it or log out — the account would be stuck as-is until an admin intervened. Excluding self-service account actions from the role gate closes that gap without widening what a viewer can do to anyone else's account or to the rest of the system.",

    domainsTitle: "What's gated — by domain",
    domainsDesc:
      "26 procedures are gated behind ROLE_ADMIN. Every one of them either writes state or reveals a secret (a service's signing key). They group into seven domains:",
    domainsGroups: [
      {
        name: "Accounts",
        procs: ["AccountService.Register", "AccountService.Delete"],
      },
      {
        name: "Services",
        procs: [
          "ServiceService.Create",
          "ServiceService.Update",
          "ServiceService.Delete",
          "ServiceService.Activate",
          "ServiceService.Revoke",
          "ServiceService.ApplyManifest",
          "ServiceService.RotateServiceKey",
        ],
      },
      {
        name: "DLQ",
        procs: ["BrokerService.ReplayDlq", "BrokerService.PurgeDlq"],
      },
      {
        name: "Jobs",
        procs: ["JobService.ExecuteNow"],
      },
      {
        name: "Workflows",
        procs: ["WorkflowService.Cancel"],
      },
      {
        name: "Alerts",
        procs: [
          "AlertService.CreateRule",
          "AlertService.UpdateRule",
          "AlertService.UpsertRule",
          "AlertService.DeleteRule",
          "AlertService.ManualFireRule",
          "AlertService.CreateChannel",
          "AlertService.UpdateChannel",
          "AlertService.DeleteChannel",
          "AlertService.TestChannel",
          "AlertService.SetTelegramWebhook",
          "AlertService.RegisterPushSubscription",
          "AlertService.UnregisterPushSubscription",
        ],
      },
      {
        name: "Settings",
        procs: ["SettingsService.UpdateSettings"],
      },
    ] as { name: string; procs: string[] }[],

    uiTitle: "Console UI",
    uiRows: [
      { name: "Accounts page", desc: "Lists all accounts (login, role badge, created date). Admin can create an account (login, password, role) and delete any account except itself." },
      { name: "Sidebar role badge", desc: "Shows the signed-in account's own role at a glance." },
      { name: "Disabled controls", desc: "Mutating buttons (create account, delete account, delete/revoke a service, replay/purge DLQ, execute a job now, cancel a workflow, alert rule/channel edits, settings save, ...) render disabled for a viewer session, with a tooltip explaining why." },
      { name: "Server-side denial toast", desc: "If a mutating call reaches the server anyway (e.g. a stale client), the PermissionDenied response surfaces as a toast — the UI never silently swallows it." },
    ] as { name: string; desc: string }[],
    uiCallout:
      "The role check on the client (useIsViewer, runtime/ui/src/hooks/useAccountRole.ts) fails closed: any role value other than a confirmed ROLE_ADMIN — including ROLE_UNSPECIFIED before the account has resolved — is treated as a viewer. Disabling controls in the UI is a usability convenience; the server-side interceptor is the actual boundary.",

    cliTitle: "CLI",
    cliDesc:
      "sb account manages accounts from the terminal. It calls the same gated procedures as the console, so the same rules apply to a viewer's token.",
    cliLsDesc: "List accounts. The ROLE column prints admin or viewer.",
    cliAddDesc: "Register a new account. --role accepts admin or viewer and defaults to viewer.",
    cliRmDesc: "Delete an account by id.",
    cliSelfNote: "sb account passwd and sb account rename act on the caller's own account — reachable by a viewer token for the same reason Logout/ChangePassword/ChangeUsername are excluded server-side.",

    limitsTitle: "Limits",
    limits: [
      "Exactly two roles. There is no per-domain or per-procedure permission — a viewer is blocked from all 26 gated procedures, or none of them.",
      "No granular policy. You cannot grant a viewer write access to, say, DLQ replay alone without granting admin everywhere else.",
      "No audit log of operator actions. The interceptor enforces the boundary but does not record who did what — there is no history of role changes, account creation/deletion, or which admin fired a given mutation.",
    ],
  },
  ru: {
    badge: "Production",
    title: "Роли консоли",
    description:
      "У каждого аккаунта UI-консоли ровно одна роль — ROLE_ADMIN или ROLE_VIEWER, — которая проверяется на сервере для gRPC-процедур, вызываемых консолью (и CLI sb). Эта страница — что может и не может viewer, и почему.",

    schemaTitle: "Схема и значение по умолчанию",
    schemaDesc:
      "Роль лежит в uigw_users.role — колонке TEXT с ограничением admin/viewer, добавленной миграцией 0014_uigw_users_role.sql. По умолчанию — admin, поэтому аккаунты, созданные до этой миграции, сохраняют полный доступ — обновление никого не запирает.",
    schemaEnumNote:
      "На wire-уровне role — это enum Role из servicebridge/ui/v1/ui.proto: ROLE_ADMIN = 1, ROLE_VIEWER = 2. У ROLE_UNSPECIFIED (0) нет представления в хранилище, и он отклоняется везде, где нужна конкретная роль.",

    enforceTitle: "Как проверяется",
    enforceDesc:
      "Unary auth-интерцептор на UI gateway (runtime/internal/uigw/server.go) читает роль вызывающего свежей из БД на каждом запросе — никогда не из cookie сессии, — поэтому смена роли или удаление аккаунта действуют уже на следующем вызове этого аккаунта. До выполнения хендлера интерцептор сверяет вызванную процедуру с фиксированным набором мутирующих процедур; если вызывающий — ROLE_VIEWER, а процедура в этом наборе — вызов отклоняется с PermissionDenied до выполнения кода хендлера.",
    enforceCallout:
      "Read-only вызовы не затронуты — viewer может листать сервисы, читать настройки, смотреть трейсы и всё остальное, что не пишет состояние и не раскрывает секрет (например, ключ сервиса).",

    selfTitle: "Исключение для собственного аккаунта",
    selfDesc:
      "Logout, ChangePassword и ChangeUsername намеренно исключены из набора мутирующих процедур. Все три действуют только на собственный аккаунт вызывающего.",
    selfWhy:
      "Сессия viewer'а должна уметь завершить саму себя и сменить собственные credentials. Если бы эти вызовы были заблокированы наравне с остальными, viewer со скомпрометированным паролем не смог бы ни сменить его, ни выйти — аккаунт остался бы в текущем состоянии до вмешательства админа. Исключение self-service-действий из ролевой проверки закрывает эту дыру, не расширяя то, что viewer может сделать с чужим аккаунтом или с остальной системой.",

    domainsTitle: "Что закрыто — по доменам",
    domainsDesc:
      "26 процедур закрыты за ROLE_ADMIN. Каждая из них либо пишет состояние, либо раскрывает секрет (подписывающий ключ сервиса). Они группируются в семь доменов:",
    domainsGroups: [
      {
        name: "Аккаунты",
        procs: ["AccountService.Register", "AccountService.Delete"],
      },
      {
        name: "Сервисы",
        procs: [
          "ServiceService.Create",
          "ServiceService.Update",
          "ServiceService.Delete",
          "ServiceService.Activate",
          "ServiceService.Revoke",
          "ServiceService.ApplyManifest",
          "ServiceService.RotateServiceKey",
        ],
      },
      {
        name: "DLQ",
        procs: ["BrokerService.ReplayDlq", "BrokerService.PurgeDlq"],
      },
      {
        name: "Задачи",
        procs: ["JobService.ExecuteNow"],
      },
      {
        name: "Воркфлоу",
        procs: ["WorkflowService.Cancel"],
      },
      {
        name: "Алерты",
        procs: [
          "AlertService.CreateRule",
          "AlertService.UpdateRule",
          "AlertService.UpsertRule",
          "AlertService.DeleteRule",
          "AlertService.ManualFireRule",
          "AlertService.CreateChannel",
          "AlertService.UpdateChannel",
          "AlertService.DeleteChannel",
          "AlertService.TestChannel",
          "AlertService.SetTelegramWebhook",
          "AlertService.RegisterPushSubscription",
          "AlertService.UnregisterPushSubscription",
        ],
      },
      {
        name: "Настройки",
        procs: ["SettingsService.UpdateSettings"],
      },
    ] as { name: string; procs: string[] }[],

    uiTitle: "UI консоли",
    uiRows: [
      { name: "Страница аккаунтов", desc: "Список всех аккаунтов (логин, бейдж роли, дата создания). Admin может создать аккаунт (логин, пароль, роль) и удалить любой аккаунт, кроме собственного." },
      { name: "Бейдж роли в сайдбаре", desc: "Показывает роль текущего аккаунта с первого взгляда." },
      { name: "Задизейбленные контролы", desc: "Мутирующие кнопки (создать аккаунт, удалить аккаунт, удалить/отозвать сервис, replay/purge DLQ, выполнить задачу сейчас, отменить воркфлоу, правки правил/каналов алертов, сохранение настроек, ...) рендерятся задизейбленными в сессии viewer'а, с тултипом-объяснением." },
      { name: "Тост при отказе сервера", desc: "Если мутирующий вызов всё же доходит до сервера (например, устаревший клиент), ответ PermissionDenied всплывает тостом — UI никогда не проглатывает его молча." },
    ] as { name: string; desc: string }[],
    uiCallout:
      "Проверка роли на клиенте (useIsViewer, runtime/ui/src/hooks/useAccountRole.ts) fail-closed: любое значение роли, кроме подтверждённого ROLE_ADMIN — включая ROLE_UNSPECIFIED до того, как аккаунт разрешился, — считается viewer'ом. Дизейбл контролов в UI — удобство, реальная граница — серверный интерцептор.",

    cliTitle: "CLI",
    cliDesc:
      "sb account управляет аккаунтами из терминала. Он вызывает те же закрытые процедуры, что и консоль, поэтому те же правила действуют для токена viewer'а.",
    cliLsDesc: "Список аккаунтов. Колонка ROLE печатает admin или viewer.",
    cliAddDesc: "Регистрация нового аккаунта. --role принимает admin или viewer, по умолчанию viewer.",
    cliRmDesc: "Удаление аккаунта по id.",
    cliSelfNote: "sb account passwd и sb account rename действуют на собственный аккаунт вызывающего — доступны токену viewer'а по той же причине, по которой Logout/ChangePassword/ChangeUsername исключены на сервере.",

    limitsTitle: "Границы",
    limits: [
      "Ровно две роли. Нет прав по домену или по процедуре — viewer заблокирован либо на всех 26 закрытых процедурах, либо ни на одной.",
      "Нет гранулярной политики. Нельзя дать viewer'у право писать, скажем, только в DLQ replay, не давая admin-доступ везде остальном.",
      "Нет audit log действий оператора. Интерцептор поддерживает границу, но не записывает, кто что сделал — нет истории смен ролей, создания/удаления аккаунтов или того, какой admin вызвал конкретную мутацию.",
    ],
  },
};

export function PageConsoleRoles() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="schema">{t.schemaTitle}</H2>
      <P>{t.schemaDesc}</P>
      <P>{t.schemaEnumNote}</P>

      <H2 id="enforcement">{t.enforceTitle}</H2>
      <P>{t.enforceDesc}</P>
      <P>{t.enforceCallout}</P>

      <H2 id="self-account">{t.selfTitle}</H2>
      <P>{t.selfDesc}</P>
      <P>{t.selfWhy}</P>

      <H2 id="gated-domains">{t.domainsTitle}</H2>
      <P>{t.domainsDesc}</P>
      <div className="space-y-4 my-4">
        {t.domainsGroups.map((g) => (
          <div key={g.name}>
            <Mono>{g.name}</Mono>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {g.procs.map((p) => (
                <span
                  key={p}
                  className="font-mono text-2xs text-muted-foreground bg-muted/70 px-2 py-1 rounded"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <H2 id="console-ui">{t.uiTitle}</H2>
      <div className="space-y-3 my-3">
        {t.uiRows.map((row) => (
          <div key={row.name} className="flex gap-3">
            <Mono>{row.name}</Mono>
            <span className="text-sm text-muted-foreground">{row.desc}</span>
          </div>
        ))}
      </div>
      <P>{t.uiCallout}</P>

      <H2 id="cli">{t.cliTitle}</H2>
      <P>{t.cliDesc}</P>

      <H3 id="cli-ls">sb account ls</H3>
      <P>{t.cliLsDesc}</P>
      <DocCodeBlock code={CLI_LS} lang="bash" />

      <H3 id="cli-add">sb account add</H3>
      <P>{t.cliAddDesc}</P>
      <DocCodeBlock code={CLI_ADD} lang="bash" />

      <H3 id="cli-rm">sb account rm</H3>
      <P>{t.cliRmDesc}</P>
      <DocCodeBlock code={CLI_RM} lang="bash" />
      <P>{t.cliSelfNote}</P>

      <H2 id="limits">{t.limitsTitle}</H2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.limits.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
