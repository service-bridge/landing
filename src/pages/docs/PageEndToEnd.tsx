import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";
import { useDocLocale } from "../../lib/locale-context";

const T = {
	en: {
		badge: "Getting Started",
		title: "End-to-End Example",
		description:
			"A complete order flow across three services: an RPC handler, an RPC caller that publishes an event, and an event consumer. Then the same flow expressed as a workflow.",
		introA: "This example wires three services:",
		introMid: "(RPC handler),",
		introMid2: "(RPC caller + event publisher), and",
		introEnd:
			"(event consumer). Each one is a separate process connecting to the same runtime on port 14445.",
		paymentsTitle: "Payments worker",
		paymentsP:
			"The payments service registers one RPC handler. It takes the decoded request and returns a result, and that is the whole contract. The handler declares a Protobuf schema so the runtime can decode payloads and route by contract. Register it before",
		paymentsPEnd: "; once that resolves, the worker is live.",
		ordersTitle: "Orders caller",
		ordersP:
			"The orders service calls payments over RPC, then publishes a durable event. Declare the outgoing dependency once with",
		ordersPMid:
			"before start. The publish goes through a local outbox, so it survives a runtime hiccup and lands at-least-once.",
		notificationsTitle: "Notifications consumer",
		notificationsP:
			"The notifications service subscribes to an event pattern. The handler gets only the decoded payload. Throw from it and the runtime retries on a fixed backoff ladder, then parks the event in the DLQ once attempts run out. The",
		notificationsPMid: "in",
		notificationsPEnd:
			"is an AMQP-style wildcard the runtime matches against one path segment, so it catches every event under that prefix.",
		workflowTitle: "Orchestrate as a workflow",
		workflowP:
			"The same flow as a declarative DAG. Each step lists its dependencies in",
		workflowPMid:
			"; a step runs only after the ones it waits for finish. The runtime owns the state, so a run picks up where it left off after a restart. A",
		workflowPEnd:
			"step parks the run until a matching event arrives, then the final step publishes the result.",
		tipCallout:
			"Every step here lands in one trace timeline in the built-in dashboard on port 14444: the RPC call, the event publish and delivery, and the whole workflow. No external collector to wire up.",
	},
	ru: {
		badge: "Начало работы",
		title: "Полный пример",
		description:
			"Полный поток заказа через три сервиса: обработчик RPC, вызывающий RPC и публикующий событие, и потребитель события. Затем тот же поток в виде воркфлоу.",
		introA: "Пример связывает три сервиса:",
		introMid: "(обработчик RPC),",
		introMid2: "(вызов RPC + публикация события) и",
		introEnd:
			"(потребитель событий). Каждый — отдельный процесс, подключённый к одному runtime на порту 14445.",
		paymentsTitle: "Воркер платежей",
		paymentsP:
			"Сервис payments регистрирует один обработчик RPC. Он получает раскодированный запрос и возвращает результат — это весь контракт. Обработчик объявляет Protobuf-схему, чтобы runtime раскодировал payload и маршрутизировал по контракту. Регистрируйте его до",
		paymentsPEnd: "; как только вызов завершился, воркер работает.",
		ordersTitle: "Вызывающий заказы",
		ordersP:
			"Сервис orders вызывает payments по RPC, затем публикует устойчивое событие. Исходящую зависимость объявите один раз через",
		ordersPMid:
			"до старта. Публикация идёт через локальный outbox, поэтому переживает сбой runtime и доходит хотя бы один раз.",
		notificationsTitle: "Потребитель уведомлений",
		notificationsP:
			"Сервис notifications подписывается на шаблон события. Обработчик получает только раскодированный payload. Бросьте из него исключение — и runtime повторит доставку по фиксированной лестнице задержек, а когда попытки кончатся, отправит событие в DLQ. Символ",
		notificationsPMid: "в",
		notificationsPEnd:
			"— это AMQP-подобный wildcard, который runtime сопоставляет с одним сегментом пути, так что ловятся все события под этим префиксом.",
		workflowTitle: "Оркестрация как воркфлоу",
		workflowP:
			"Тот же поток в виде декларативного DAG. Каждый шаг перечисляет свои зависимости в",
		workflowPMid:
			"; шаг запускается только после того, как завершатся те, кого он ждёт. Состоянием владеет runtime, поэтому запуск продолжается с места остановки после перезапуска. Шаг",
		workflowPEnd:
			"паркует запуск до прихода подходящего события, затем финальный шаг публикует результат.",
		tipCallout:
			"Каждый шаг здесь попадает в одну временную шкалу трассировки во встроенной панели на порту 14444: вызов RPC, публикация и доставка события, весь воркфлоу. Внешний сборщик подключать не нужно.",
	},
};

export function PageEndToEnd() {
	const { locale } = useDocLocale();
	const t = T[locale];

	return (
		<div className="space-y-5">
			<PageHeader badge={t.badge} title={t.title} description={t.description} />

			<P>
				{t.introA} <Mono>payments</Mono> {t.introMid} <Mono>orders</Mono>{" "}
				{t.introMid2} <Mono>notifications</Mono> {t.introEnd}
			</P>

			<H2 id="payments-worker">{t.paymentsTitle}</H2>
			<P>
				{t.paymentsP} <Mono>start()</Mono>
				{t.paymentsPEnd}
			</P>
			<MultiCodeBlock
				code={{
					ts: `import { ServiceBridge } from "servicebridge";

const payments = new ServiceBridge(
  "localhost:14445",
  process.env.PAYMENTS_KEY!, // this service's own bootstrap key
);

payments.rpc.handle<{ orderId: string; amount: number }, { txId: string }>(
  "charge",
  async (req) => {
    // ... run the actual charge ...
    return { txId: \`tx_\${Date.now()}\` };
  },
  { schema: { protoFile: "./proto/payments.proto", method: "charge" } },
);

await payments.start();`,
				}}
			/>

			<H2 id="orders-caller">{t.ordersTitle}</H2>
			<P>
				{t.ordersP} <Mono>sb.service()</Mono> {t.ordersPMid}
			</P>
			<MultiCodeBlock
				code={{
					ts: `const orders = new ServiceBridge(
  "localhost:14445",
  process.env.ORDERS_KEY!, // this service's own bootstrap key
);

// Declare outgoing dependencies before start()
orders.service("payments", { rpc: ["charge"] });
orders.event.define("orders.completed", {
  protoFile: "./proto/orders.proto",
  input: "OrderCompleted",
});

await orders.start();

const charge = await orders.rpc.call<
  { orderId: string; amount: number },
  { txId: string }
>("payments", "charge", { orderId: "ord_42", amount: 4990 });

await orders.event.publish(
  "orders.completed",
  { orderId: "ord_42", txId: charge.txId },
  { idempotencyKey: "order:ord_42:completed" },
);`,
				}}
			/>

			<H2 id="notifications">{t.notificationsTitle}</H2>
			<P>
				{t.notificationsP} <Mono>*</Mono> {t.notificationsPMid}{" "}
				<Mono>orders.*</Mono> {t.notificationsPEnd}
			</P>
			<MultiCodeBlock
				code={{
					ts: `const notifications = new ServiceBridge(
  "localhost:14445",
  process.env.NOTIFICATIONS_KEY!, // this service's own bootstrap key
);

notifications.event.handle("orders.*", async (payload) => {
  const body = payload as { orderId: string; txId: string };
  // ... send the confirmation email ...
  // Throwing here triggers retry, then DLQ after the policy is exhausted.
});

await notifications.start();`,
				}}
			/>

			<H2 id="workflow">{t.workflowTitle}</H2>
			<P>
				{t.workflowP} <Mono>waitFor</Mono>
				{t.workflowPMid} <Mono>wait_event</Mono> {t.workflowPEnd}
			</P>
			<MultiCodeBlock
				code={{
					ts: `orders.workflow.handle("order.fulfillment", {
  steps: [
    {
      id: "charge",
      type: "call",
      service: "payments",
      method: "charge",
      input: { orderId: "$.input.orderId", amount: "$.input.amount" },
    },
    {
      id: "wait_delivery",
      type: "wait_event",
      event: "shipping.delivered",
      waitFor: ["charge"],
    },
    {
      id: "notify",
      type: "publish",
      event: "orders.fulfilled",
      input: { orderId: "$.input.orderId", txId: "$.charge.txId" },
      waitFor: ["wait_delivery"],
    },
  ],
});

await orders.start();

const { runId } = await orders.workflow.start("order.fulfillment", {
  orderId: "ord_42",
  amount: 4990,
});
const state = await orders.workflow.await(runId); // resolves on "success"`,
				}}
			/>

			<Callout type="tip">{t.tipCallout}</Callout>
		</div>
	);
}
