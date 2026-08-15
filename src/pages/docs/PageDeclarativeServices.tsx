import { Callout, DocCodeBlock, H2, H3, P, PageHeader, ParamTable } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
  en: {
    badge: "Production",
    title: "GitOps & sb apply",
    description:
      "sb apply -f services.yaml applies a declarative ServiceSet manifest to the runtime in one atomic transaction — create, update, or optionally prune services. CI pipelines can provision environments reproducibly without scripting individual API calls.",

    whyTitle: "Why apply",
    whyDesc:
      "The dashboard is for humans. Automating service provisioning (CI creating services for a new environment, or IaC keeping a fleet in sync) requires something declarative. sb apply lets you express the desired state of all services as a single YAML file and apply it atomically — the runtime validates the whole manifest before writing anything.",
    whyPoints: [
      "Atomic: the full transaction succeeds or the whole apply rolls back — no partial state.",
      "Idempotent: re-running the same manifest with no changes produces no writes.",
      "Reproducible: commit services.yaml to your repo; the environment is fully described in source control.",
      "Safe by default: services not in the manifest are left untouched unless --prune is set.",
    ],

    manifestTitle: "services.yaml",
    manifestDesc:
      "The manifest envelope is apiVersion: servicebridge.io/v1, kind: ServiceSet. The services list maps directly to service specs.",
    manifestCode: `apiVersion: servicebridge.io/v1
kind: ServiceSet
services:
  - name: gateway
    capabilities: [RPC_CALL]

  - name: payments
    capabilities: [RPC_HANDLE, EVENTS_PUBLISH]
    allow_caller_services: [orders]
    allow_publish_topics: [order.*]

  - name: orders
    capabilities: [RPC_CALL, RPC_HANDLE, EVENTS_HANDLE]
    allow_caller_services: [gateway]
    allow_subscribe_topics: [order.*]

  - name: notifications
    capabilities: [EVENTS_HANDLE]
    allow_subscribe_topics: [order.paid, order.failed]`,

    semanticsTitle: "Apply semantics",
    semanticsDesc:
      "Each service in the manifest is matched to the runtime by name. The apply produces one of four outcomes per entry:",
    semanticsRows: [
      { name: "created", type: "—", desc: "Service did not exist; created with a new API key. Key is shown once (or written to --keys-out)." },
      { name: "updated", type: "—", desc: "Service exists; capabilities and policy updated in place. UUID and existing key unchanged." },
      { name: "unchanged", type: "—", desc: "Service exists and the spec matches what is in the DB. No write." },
      { name: "pruned", type: "--prune only", desc: "Service exists in the DB but not in the manifest; status set to revoked." },
    ],

    flagsTitle: "Flags",
    flags: [
      { name: "-f, --file", type: "string", default: "(required)", desc: "Path to the ServiceSet manifest YAML." },
      { name: "--prune", type: "bool", default: "false", desc: "Soft-revoke services present in the DB but absent from the manifest." },
      { name: "--dry-run", type: "bool", default: "false", desc: "Compute and display the diff without writing anything. No keys are generated." },
      { name: "--keys-out", type: "string", default: "—", desc: "Write new API keys for created services to a JSON file instead of stdout." },
    ],

    dryRunCallout:
      "--dry-run runs the full validation and diff inside a transaction that is always rolled back. Use it to preview changes before applying in CI.",

    keysTitle: "Keys & CI",
    keysCreatedDesc:
      "API keys for newly created services are shown once on stdout. For CI pipelines where stdout is ephemeral, write them to a file with --keys-out and upload to your secret store:",
    keysCode: `# in CI: apply and capture new keys
sb apply -f services.yaml --keys-out /tmp/new-keys.json

# new-keys.json: [{"name":"payments","api_key":"sb.AbC123..."}]`,
    keysRotateDesc:
      "Rotate a service key without changing its UUID or policy. The new key is printed once — save it immediately:",
    keysRotateCode: `sb service key rotate payments
# rotated key for payments (id 0a1b…)
# New API key (shown once, store it now):
# sb.XyZ987...`,

    ciAuthTitle: "CI authentication",
    ciAuthDesc:
      "Use --password-stdin to pass the admin password from an environment variable without an interactive prompt. This is the canonical pattern for CI pipelines:",
    ciAuthCode: `echo "$SB_ADMIN_PASSWORD" | sb login --password-stdin -u admin
sb apply -f services.yaml --keys-out /tmp/keys.json
sb logout`,
    ciAuthCallout:
      "The session cookie is written to ~/.config/servicebridge/session.json. In ephemeral CI runners the file vanishes with the job; no cleanup needed.",

    exportTitle: "sb service export",
    exportDesc:
      "Export the current state of all active services back into a ServiceSet manifest. Use this to bootstrap a services.yaml from an existing runtime or to diff a live environment against a committed manifest:",
    exportCode: `# export all active services to stdout
sb service export

# save to file
sb service export --out services.yaml

# filter to specific services
sb service export --service payments --service orders`,
    exportNote:
      "Exported specs do not include API keys — only names, capabilities, and policies. Round-trip: export → edit → apply.",
  },
  ru: {
    badge: "Production",
    title: "GitOps и sb apply",
    description:
      "sb apply -f services.yaml применяет декларативный манифест ServiceSet к рантайму в одной атомарной транзакции — создаёт, обновляет или опционально удаляет сервисы. CI-пайплайны могут воспроизводимо провижинить окружения без скриптования отдельных API-вызовов.",

    whyTitle: "Зачем apply",
    whyDesc:
      "Дашборд — для людей. Автоматизация провижининга сервисов (CI создаёт сервисы для нового окружения, IaC синхронизирует флот) требует чего-то декларативного. sb apply позволяет выразить желаемое состояние всех сервисов как один YAML-файл и применить его атомарно — рантайм валидирует манифест целиком перед любой записью.",
    whyPoints: [
      "Атомарность: вся транзакция успешна или откатывается полностью — частичного состояния нет.",
      "Идемпотентность: повторный apply того же манифеста без изменений не производит записей.",
      "Воспроизводимость: закоммитьте services.yaml в репо — окружение полностью описано в source control.",
      "Безопасно по умолчанию: сервисы, не вошедшие в манифест, не трогаются без --prune.",
    ],

    manifestTitle: "services.yaml",
    manifestDesc:
      "Конверт манифеста: apiVersion: servicebridge.io/v1, kind: ServiceSet. Список services отображается напрямую на спецификации сервисов.",
    manifestCode: `apiVersion: servicebridge.io/v1
kind: ServiceSet
services:
  - name: gateway
    capabilities: [RPC_CALL]

  - name: payments
    capabilities: [RPC_HANDLE, EVENTS_PUBLISH]
    allow_caller_services: [orders]
    allow_publish_topics: [order.*]

  - name: orders
    capabilities: [RPC_CALL, RPC_HANDLE, EVENTS_HANDLE]
    allow_caller_services: [gateway]
    allow_subscribe_topics: [order.*]

  - name: notifications
    capabilities: [EVENTS_HANDLE]
    allow_subscribe_topics: [order.paid, order.failed]`,

    semanticsTitle: "Семантика apply",
    semanticsDesc:
      "Каждый сервис в манифесте сопоставляется с рантаймом по имени. Apply производит один из четырёх исходов для каждой записи:",
    semanticsRows: [
      { name: "created", type: "—", desc: "Сервис не существовал; создан с новым API-ключом. Ключ показывается один раз (или пишется в --keys-out)." },
      { name: "updated", type: "—", desc: "Сервис существует; capabilities и политика обновлены на месте. UUID и существующий ключ не меняются." },
      { name: "unchanged", type: "—", desc: "Сервис существует и спека совпадает с тем, что в БД. Запись не производится." },
      { name: "pruned", type: "только --prune", desc: "Сервис есть в БД, но отсутствует в манифесте; статус устанавливается в revoked." },
    ],

    flagsTitle: "Флаги",
    flags: [
      { name: "-f, --file", type: "string", default: "(обязателен)", desc: "Путь к YAML-манифесту ServiceSet." },
      { name: "--prune", type: "bool", default: "false", desc: "Soft-revoke сервисов, отсутствующих в манифесте, но существующих в БД." },
      { name: "--dry-run", type: "bool", default: "false", desc: "Рассчитать и показать diff без записи. Ключи не генерируются." },
      { name: "--keys-out", type: "string", default: "—", desc: "Записать новые API-ключи созданных сервисов в JSON-файл вместо stdout." },
    ],

    dryRunCallout:
      "--dry-run выполняет полную валидацию и diff внутри транзакции, которая всегда откатывается. Используйте для предпросмотра изменений перед apply в CI.",

    keysTitle: "Ключи и CI",
    keysCreatedDesc:
      "API-ключи вновь созданных сервисов показываются один раз на stdout. Для CI-пайплайнов, где stdout эфемерен, запишите их в файл через --keys-out и загрузите в ваше хранилище секретов:",
    keysCode: `# в CI: apply и сохранение новых ключей
sb apply -f services.yaml --keys-out /tmp/new-keys.json

# new-keys.json: [{"name":"payments","api_key":"sb.AbC123..."}]`,
    keysRotateDesc:
      "Ротация ключа сервиса без изменения UUID или политики. Новый ключ печатается один раз — сохраните немедленно:",
    keysRotateCode: `sb service key rotate payments
# rotated key for payments (id 0a1b…)
# New API key (shown once, store it now):
# sb.XyZ987...`,

    ciAuthTitle: "Аутентификация в CI",
    ciAuthDesc:
      "Используйте --password-stdin для передачи пароля администратора из переменной окружения без интерактивного ввода. Это канонический паттерн для CI-пайплайнов:",
    ciAuthCode: `echo "$SB_ADMIN_PASSWORD" | sb login --password-stdin -u admin
sb apply -f services.yaml --keys-out /tmp/keys.json
sb logout`,
    ciAuthCallout:
      "Session-cookie пишется в ~/.config/servicebridge/session.json. В эфемерных CI-раннерах файл исчезает вместе с задачей — очистка не нужна.",

    exportTitle: "sb service export",
    exportDesc:
      "Экспортирует текущее состояние всех активных сервисов в манифест ServiceSet. Используйте для начальной генерации services.yaml из существующего рантайма или для сравнения живого окружения с зафиксированным манифестом:",
    exportCode: `# экспорт всех активных сервисов в stdout
sb service export

# сохранить в файл
sb service export --out services.yaml

# фильтр по конкретным сервисам
sb service export --service payments --service orders`,
    exportNote:
      "Экспортированные спеки не содержат API-ключей — только имена, capabilities и политики. Round-trip: export → редактирование → apply.",
  },
};

export function PageDeclarativeServices() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="why-apply">{t.whyTitle}</H2>
      <P>{t.whyDesc}</P>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground my-3">
        {t.whyPoints.map((p, i) => <li key={i}>{p}</li>)}
      </ul>

      <H2 id="manifest">{t.manifestTitle}</H2>
      <P>{t.manifestDesc}</P>
      <DocCodeBlock lang="yaml" code={t.manifestCode} />

      <H2 id="semantics">{t.semanticsTitle}</H2>
      <P>{t.semanticsDesc}</P>
      <ParamTable rows={t.semanticsRows} />

      <H3 id="apply-flags">{t.flagsTitle}</H3>
      <ParamTable rows={t.flags} />
      <Callout type="tip">{t.dryRunCallout}</Callout>

      <H2 id="keys-ci">{t.keysTitle}</H2>
      <P>{t.keysCreatedDesc}</P>
      <DocCodeBlock lang="bash" code={t.keysCode} />
      <P>{t.keysRotateDesc}</P>
      <DocCodeBlock lang="bash" code={t.keysRotateCode} />

      <H3 id="ci-auth">{t.ciAuthTitle}</H3>
      <P>{t.ciAuthDesc}</P>
      <DocCodeBlock lang="bash" code={t.ciAuthCode} />
      <Callout type="info">{t.ciAuthCallout}</Callout>

      <H2 id="export">{t.exportTitle}</H2>
      <P>{t.exportDesc}</P>
      <DocCodeBlock lang="bash" code={t.exportCode} />
      <P>{t.exportNote}</P>
    </div>
  );
}
