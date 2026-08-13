import { Callout, DocCodeBlock, H2, H3, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const walSetup = `ALTER SYSTEM SET wal_level = 'replica';        -- default in PG18, confirm it
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'test ! -f /wal-archive/%f && cp %p /wal-archive/%f';
-- restart Postgres: wal_level and archive_mode require a restart, not a reload`;

const baseBackup = `pg_basebackup -h localhost -p 5433 -U servicebridge \\
  -D /backup/base/$(date +%Y%m%d-%H%M%S) \\
  -Ft -z -Xs -P`;

const restore = `# Stop the runtime first — it must not connect to a DB mid-restore.
tar -xzf /backup/base/<snapshot>/base.tar.gz -C /var/lib/postgresql/data
cat > /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'cp /wal-archive/%f %p'
recovery_target_time = '2026-08-13 03:00:00+00'
EOF
touch /var/lib/postgresql/data/recovery.signal
# start Postgres; it replays WAL to the target, then promotes`;

const verify = `SELECT count(*) FROM runtime_ca;                         -- must be 1
SELECT count(*) FROM services WHERE status = 'active';    -- matches expectation
SELECT max(started_at) FROM workflow_runs;                -- sanity-checks the target`;

const T = {
  en: {
    badge: "Production",
    title: "Backup & Disaster Recovery",
    description:
      "ServiceBridge keeps every byte of runtime state in one Postgres database — no local disk state, no second store to get right. This page defines what a backup covers, a practical PITR recipe, exactly what happens when you restore to the past, and the one row whose loss is categorically worse than any other.",

    whatTitle: "What backup covers",
    whatDesc:
      "Everything lives in the single Postgres database passed via -pg-url. A pg_dump/PITR backup of that database is a complete backup of the runtime — identity, policy, in-flight operations, and history. Nothing in the runtime writes state anywhere else; there is no certs/ volume, no SQLite, no file the runtime depends on across a restart.",
    whatRows: [
      { domain: "CA & identity", tables: "runtime_ca (single row, id=1)" },
      { domain: "Service keys", tables: "services (key_id, secret_hash, capability flags)" },
      { domain: "Access policy", tables: "service_policy_rules (bilateral egress/acceptance)" },
      { domain: "Idempotency", tables: "idempotency_cache (namespace rpc/event/wf_step)" },
      { domain: "Durable events", tables: "event_log, event_deliveries, events_dlq" },
      { domain: "Workflows", tables: "workflow_definitions, workflow_runs, workflow_steps, workflow_timers, workflow_signals" },
      { domain: "Jobs", tables: "job_definitions, job_schedules, job_executions, jobs_dlq" },
      { domain: "Telemetry", tables: "operations, op_payloads" },
      { domain: "Runtime settings", tables: "runtime_settings" },
      { domain: "UI console", tables: "uigw_users, uigw_secrets (cookie-signing secret)" },
    ] as { domain: string; tables: string }[],
    whatHeader: ["Domain", "Table(s)"],
    whatSdkNote:
      "The Node SDK keeps its own durable outbox in a local SQLite file, separate from the runtime and not covered by this backup. Its interaction with a restore is covered below.",

    pitrTitle: "PITR recipe (Postgres 18)",
    pitrDesc:
      "The reference deployment runs postgres:18-alpine. wal_level defaults to replica (sufficient for physical PITR); archive_mode is off by default and must be enabled explicitly.",
    pitr1: "1. Enable WAL archiving",
    pitr2: "2. Take a base backup — -Xs streams the WAL needed to make it self-consistent. Cadence sets your recovery replay time, not your RPO.",
    pitr3Title: "RPO / RTO",
    pitr3: "RPO is bounded by archive_command cadence, not base-backup cadence — seconds to low minutes with healthy archiving. RTO is base-backup restore time plus WAL replay to the target, plus runtime boot (migrations + CA load, typically 1–3s for a healthy schema).",
    pitr4: "4. Restore",
    pitr5: "5. Verify before pointing the runtime at it",
    pitrCallout:
      "A restore rehearsal — restoring to a scratch instance and pointing a non-production runtime at it — is the only way to know the recipe works before you need it under pressure.",

    semanticsTitle: "What restoring to the past actually does",
    semanticsDesc:
      "A PITR restore does not just roll back rows — it rolls back decisions the runtime and every connected SDK had already acted on. Each piece of live state behaves differently.",

    leaseTitle: "Workflow leases (lease_epoch)",
    leaseDesc:
      "lease_epoch is a fencing token bumped on every assignment and reclaim; a checkpoint is accepted only if it presents the current epoch. After a restore, ReclaimExpiredLeases finds every in-flight run's lease already expired (now is ahead of the restored lease_expires_at) and bumps the epoch again. An SDK instance that kept running past the restore point gets its next checkpoint fenced (ErrLeaseFenced) instead of silently accepted — this converts what would be silent double-execution into an explicit failure to reconcile.",

    deliveryTitle: "Event deliveries (visibility_expires_at)",
    deliveryDesc:
      "A restore resets deliveries that had since completed back to pending/in_flight with a stale visibility window that has already lapsed by wall-clock time — they become immediately claimable and are redelivered. Not new risk (at-least-once already requires idempotent handlers), but a restore produces a redelivery burst covering everything delivered between the restore point and the failure, not just what was genuinely in flight.",

    idempotencyTitle: "Idempotency cache and the 24h TTL",
    idempotencyDesc:
      "idempotency_cache rows carry an absolute expires_at; both rpc.idempotency_event_ttl_ms and rpc.idempotency_workflow_step_ttl_ms default to 86400000 (24h). A restore gap smaller than 24h still dedups correctly. A restore gap larger than 24h means every restored idempotency row already looks expired against real wall-clock time — dedup for anything processed before the restore point is gone, and redelivered work is treated as new. Handler-side idempotency has to cover the gap the runtime's window no longer can.",

    outboxTitle: "SDK outbox ahead of a rolled-back database",
    outboxDesc:
      "This is the one place data can be silently lost, not just redelivered. The drainer deletes a local outbox row as soon as the runtime acknowledges it — once deleted, the SDK keeps no record the event was ever published. If the runtime rolls back past the point where it committed and acknowledged that event, the event is gone from both sides: not in event_log (rolled back), not in the SDK outbox (already deleted on ack). No error, no retry, no signal anything is missing. This gap is bounded by the restore window and can only be closed by reconciling against an application-level record — ServiceBridge provides no mechanism to detect it.",

    afterTitle: "After restore",
    afterSteps: [
      "Start the runtime and let StartupSweep and ReclaimExpiredLeases run — they convert stale in-flight state into ABANDONED/reclaimed rows automatically.",
      "Expect a burst of ErrLeaseFenced errors and redelivered events immediately after restore — that is the fencing/at-least-once machinery working, not a new fault.",
      "If the restore gap exceeds the idempotency TTL, verify handler-side idempotency independently before trusting downstream side effects.",
      "Reconcile events published in the restore gap against an out-of-band source, if one exists — the runtime cannot detect this gap on its own.",
    ],

    caTitle: "The CA: the one row that must never be silently lost",
    caDesc:
      "runtime_ca (id=1) holds the runtime's entire cryptographic identity — the self-signed CA cert and its private key. Every leaf certificate ever issued chains to this key, and every bootstrap key ever handed to a service has this CA's certificate embedded directly in it.",
    caCallout:
      "If the runtime_ca row is lost, tlsca.OpenDB does not fail and does not warn — a missing row falls straight into generating a brand new CA and persisting it. The runtime logs \"CA loaded\" either way; there is no distinct log line for a fresh boot with an intact CA versus one that just silently re-keyed the entire fleet.",
    caConsequenceTitle: "Consequence",
    caConsequences: [
      "Every leaf cert already issued was signed by the CA that is now gone — direct-RPC mTLS and every SDK's control-plane connection fail to verify on next handshake or reconnect.",
      "Every bootstrap key already handed out embeds the old CA cert — an SDK bootstrapping cold or refreshing its cert verifies a runtime identity that no longer exists.",
      "There is no supported recovery short of re-provisioning every service through the UI console and redistributing new keys to every SDK deployment.",
    ],
    caRule:
      "Operational rule: any restore must be checked for runtime_ca presence before the runtime is pointed at it. A restore that produces a new CA is a full re-bootstrap event, not a smaller version of a normal restore — treat and communicate it as one.",

    rotationTitle: "CA rotation",
    rotationDesc:
      "There is no CA rotation pipeline. This is a deliberate, documented absence, not an oversight — see ADR-0017 for the decision and what to do instead if the CA is ever suspected compromised.",
    rotationPoints: [
      "runtime_ca is a single row — there is no schema for a second, transitional CA to coexist while clients migrate.",
      "Every bootstrap key embeds the CA cert at encode time; the SDK verifies the runtime's leaf against exactly that embedded cert, not a hostname. There is no updatable trust store to stage a new root into ahead of a cutover.",
      "RotateServiceKey exists, but it only regenerates a service's key_id/secret pair — it re-embeds whichever CA already exists, it does not rotate the CA.",
      "CA compromise is handled as a full re-bootstrap incident: replace the runtime_ca row, restart, then re-provision every service and redistribute new bootstrap keys. Plan for full fleet downtime during the cutover.",
    ],
  },
  ru: {
    badge: "Production",
    title: "Бэкап и восстановление после сбоя",
    description:
      "ServiceBridge хранит всё состояние рантайма в одной базе Postgres — ни локального дискового состояния, ни второго хранилища, которое нужно бы отдельно защищать. Страница описывает, что покрывает бэкап, практичный рецепт PITR, что именно происходит при восстановлении в прошлое, и строку, потеря которой опаснее любой другой.",

    whatTitle: "Что покрывает бэкап",
    whatDesc:
      "Всё лежит в одной базе Postgres, переданной через -pg-url. Бэкап pg_dump/PITR этой базы — полный бэкап рантайма: identity, политика, in-flight операции, история. Рантайм не пишет состояние больше никуда: нет тома certs/, нет SQLite, нет файла, от которого зависел бы рестарт.",
    whatRows: [
      { domain: "CA и identity", tables: "runtime_ca (одна строка, id=1)" },
      { domain: "Сервисные ключи", tables: "services (key_id, secret_hash, флаги capability)" },
      { domain: "Access policy", tables: "service_policy_rules (двусторонние egress/acceptance)" },
      { domain: "Идемпотентность", tables: "idempotency_cache (namespace rpc/event/wf_step)" },
      { domain: "Durable-события", tables: "event_log, event_deliveries, events_dlq" },
      { domain: "Воркфлоу", tables: "workflow_definitions, workflow_runs, workflow_steps, workflow_timers, workflow_signals" },
      { domain: "Задачи", tables: "job_definitions, job_schedules, job_executions, jobs_dlq" },
      { domain: "Телеметрия", tables: "operations, op_payloads" },
      { domain: "Настройки рантайма", tables: "runtime_settings" },
      { domain: "UI-консоль", tables: "uigw_users, uigw_secrets (секрет подписи cookie)" },
    ] as { domain: string; tables: string }[],
    whatHeader: ["Домен", "Таблица(ы)"],
    whatSdkNote:
      "Node SDK держит собственный durable outbox в локальном файле SQLite — отдельно от рантайма, этот бэкап его не покрывает. Взаимодействие с restore описано ниже.",

    pitrTitle: "Рецепт PITR (Postgres 18)",
    pitrDesc:
      "Референсное развёртывание использует postgres:18-alpine. wal_level по умолчанию replica (достаточно для физического PITR); archive_mode по умолчанию выключен и требует явного включения.",
    pitr1: "1. Включить архивирование WAL",
    pitr2: "2. Снять базовый бэкап — -Xs стримит WAL, нужный для самосогласованности. Частота задаёт время replay при восстановлении, не RPO.",
    pitr3Title: "RPO / RTO",
    pitr3: "RPO ограничен частотой archive_command, не частотой базового бэкапа — секунды-минуты при здоровом архивировании. RTO — время восстановления базового бэкапа плюс replay WAL до цели плюс загрузка рантайма (миграции + загрузка CA, обычно 1–3с при здоровой схеме).",
    pitr4: "4. Восстановление",
    pitr5: "5. Проверка перед запуском рантайма",
    pitrCallout:
      "Репетиция восстановления — restore на тестовый инстанс и запуск non-production рантайма на нём — единственный способ узнать, что рецепт работает, до того как он понадобится под давлением.",

    semanticsTitle: "Что реально происходит при восстановлении в прошлое",
    semanticsDesc:
      "PITR-restore не просто откатывает строки — он откатывает решения, на которые рантайм и все подключённые SDK уже среагировали. Каждый вид live-состояния ведёт себя по-своему.",

    leaseTitle: "Lease воркфлоу (lease_epoch)",
    leaseDesc:
      "lease_epoch — fencing-токен, увеличивается при каждом назначении и reclaim; checkpoint принимается только с текущим эпохом. После restore ReclaimExpiredLeases находит lease каждого in-flight запуска уже истёкшим (now опережает восстановленный lease_expires_at) и снова бампает эпох. SDK-инстанс, продолживший работу после точки восстановления, получит на следующем checkpoint fencing (ErrLeaseFenced) вместо тихого принятия — это превращает потенциальное тихое двойное исполнение в явную ошибку для разбора.",

    deliveryTitle: "Доставки событий (visibility_expires_at)",
    deliveryDesc:
      "Restore возвращает уже завершённые доставки в pending/in_flight с устаревшим окном видимости, которое по реальному времени уже истекло — они сразу становятся доступны для захвата и передоставляются. Не новый риск (at-least-once и так требует идемпотентных обработчиков), но restore даёт всплеск передоставок по всему, что было доставлено между точкой восстановления и сбоем, а не только по реально in-flight.",

    idempotencyTitle: "Кэш идемпотентности и TTL 24ч",
    idempotencyDesc:
      "Строки idempotency_cache несут абсолютный expires_at; и rpc.idempotency_event_ttl_ms, и rpc.idempotency_workflow_step_ttl_ms по умолчанию 86400000 (24ч). Разрыв restore меньше 24ч — дедупликация работает корректно. Разрыв больше 24ч — все восстановленные строки идемпотентности уже выглядят истёкшими по реальному времени: дедупликация всего обработанного до точки восстановления пропадает, передоставленная работа обрабатывается как новая. Идемпотентность на стороне обработчика должна закрыть то, что уже не покрывает окно рантайма.",

    outboxTitle: "SDK outbox опережает откатившуюся БД",
    outboxDesc:
      "Единственное место, где данные теряются тихо, а не передоставляются. Drainer удаляет строку локального outbox сразу после подтверждения от рантайма — после удаления SDK не хранит запись о том, что событие вообще публиковалось. Если рантайм откатывается за точку, где он закоммитил и подтвердил это событие, событие пропадает с обеих сторон: нет в event_log (откачен), нет в SDK outbox (уже удалён при подтверждении). Ни ошибки, ни повтора, ни сигнала о пропаже. Разрыв ограничен окном restore и закрывается только сверкой с прикладной записью — сам ServiceBridge механизма обнаружения не даёт.",

    afterTitle: "После восстановления",
    afterSteps: [
      "Запустить рантайм и дать отработать StartupSweep и ReclaimExpiredLeases — они автоматически превращают устаревшее in-flight состояние в ABANDONED/reclaimed строки.",
      "Ожидать всплеск ErrLeaseFenced и передоставленных событий сразу после restore — это работает механика fencing/at-least-once, а не новая проблема.",
      "Если разрыв restore превышает TTL идемпотентности, отдельно проверить идемпотентность на стороне обработчиков перед тем как доверять downstream-эффектам.",
      "Сверить события, опубликованные в разрыве restore, с внешним источником, если он есть — сам рантайм этот разрыв не обнаруживает.",
    ],

    caTitle: "CA: строка, потеря которой недопустима незаметно",
    caDesc:
      "runtime_ca (id=1) хранит всю криптографическую идентичность рантайма — сертификат self-signed CA и его приватный ключ. К этому ключу восходит каждый когда-либо выпущенный leaf-сертификат, и каждый выданный сервису bootstrap-ключ несёт сертификат этого CA прямо внутри себя.",
    caCallout:
      "Если строка runtime_ca потеряна, tlsca.OpenDB не падает и не предупреждает — отсутствие строки сразу ведёт к генерации нового CA и его сохранению. Рантайм логирует «CA loaded» в обоих случаях; отдельной строки лога для «загрузили существующий CA» и «тихо перевыпустили CA для всего флота» — нет.",
    caConsequenceTitle: "Последствие",
    caConsequences: [
      "Каждый уже выпущенный leaf-сертификат подписан CA, которого больше нет — direct-RPC mTLS и подключение любого SDK к control plane перестают проходить верификацию на следующем handshake или переподключении.",
      "Каждый уже выданный bootstrap-ключ несёт старый сертификат CA — SDK при холодном bootstrap или обновлении сертификата проверяет identity рантайма, которого больше не существует.",
      "Поддерживаемого восстановления, кроме перевыпуска ключей для каждого сервиса через UI-консоль и раздачи новых ключей каждому SDK-развёртыванию, нет.",
    ],
    caRule:
      "Операционное правило: любой restore нужно проверять на наличие runtime_ca до того, как на него направлен рантайм. Restore, породивший новый CA — это полноценное событие переinициализации флота, а не облегчённая версия обычного restore.",

    rotationTitle: "Ротация CA",
    rotationDesc:
      "Пайплайна ротации CA нет. Это осознанное задокументированное отсутствие, а не пробел — решение и план действий при подозрении на компрометацию CA см. в ADR-0017.",
    rotationPoints: [
      "runtime_ca — одна строка: схемы для второго, переходного CA, сосуществующего пока клиенты мигрируют, нет.",
      "Каждый bootstrap-ключ несёт сертификат CA на момент кодирования; SDK проверяет leaf рантайма именно против этого встроенного сертификата, не против hostname. Обновляемого trust store, куда можно заранее положить новый корень, нет.",
      "RotateServiceKey существует, но только перегенерирует пару key_id/secret сервиса — он заново встраивает уже существующий CA, а не ротирует сам CA.",
      "Компрометация CA обрабатывается как полноценный инцидент переinициализации: заменить строку runtime_ca, перезапустить, затем перевыпустить ключи для каждого сервиса и раздать новые bootstrap-ключи. На время cutover — простой всего флота.",
    ],
  },
};

export function PageBackupDr() {
  const { locale } = useDocLocale();
  const t = T[locale];
  return (
    <div className="space-y-5">
      <PageHeader badge={t.badge} title={t.title} description={t.description} />

      <H2 id="what-to-backup">{t.whatTitle}</H2>
      <P>{t.whatDesc}</P>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t.whatHeader[0]}</th>
              <th className="text-left py-2 font-medium text-muted-foreground">{t.whatHeader[1]}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {t.whatRows.map((row) => (
              <tr key={row.domain} className="border-b border-border/50">
                <td className="py-2 pr-4 text-foreground text-xs font-medium w-44 shrink-0">{row.domain}</td>
                <td className="py-2 font-mono text-xs">{row.tables}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>{t.whatSdkNote}</P>

      <H2 id="pitr-recipe">{t.pitrTitle}</H2>
      <P>{t.pitrDesc}</P>

      <H3 id="pitr-archive">{t.pitr1}</H3>
      <DocCodeBlock code={walSetup} lang="sh" />

      <H3 id="pitr-base">{t.pitr2}</H3>
      <DocCodeBlock code={baseBackup} lang="bash" />

      <H3 id="pitr-rpo-rto">{t.pitr3Title}</H3>
      <P>{t.pitr3}</P>

      <H3 id="pitr-restore">{t.pitr4}</H3>
      <DocCodeBlock code={restore} lang="sh" />

      <H3 id="pitr-verify">{t.pitr5}</H3>
      <DocCodeBlock code={verify} lang="sh" />
      <Callout type="tip">{t.pitrCallout}</Callout>

      <H2 id="restore-semantics">{t.semanticsTitle}</H2>
      <P>{t.semanticsDesc}</P>

      <H3 id="lease-epoch">{t.leaseTitle}</H3>
      <P>{t.leaseDesc}</P>

      <H3 id="event-delivery">{t.deliveryTitle}</H3>
      <P>{t.deliveryDesc}</P>

      <H3 id="idempotency-ttl">{t.idempotencyTitle}</H3>
      <P>{t.idempotencyDesc}</P>

      <H3 id="sdk-outbox-gap">{t.outboxTitle}</H3>
      <P>{t.outboxDesc}</P>

      <H3 id="after-restore">{t.afterTitle}</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.afterSteps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <H2 id="ca-warning">{t.caTitle}</H2>
      <P>{t.caDesc}</P>
      <Callout type="warning">{t.caCallout}</Callout>
      <H3 id="ca-consequence">{t.caConsequenceTitle}</H3>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.caConsequences.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <Callout type="warning">{t.caRule}</Callout>

      <H2 id="ca-rotation">{t.rotationTitle}</H2>
      <P>{t.rotationDesc}</P>
      <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground my-3">
        {t.rotationPoints.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <P>
        <Mono>runtime/docs/adr/0017-no-ca-rotation.md</Mono>
      </P>
    </div>
  );
}
