import { MultiCodeBlock } from "../../ui/CodeBlock";
import { DocCodeBlock, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageFilterExpr() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="Filter Expressions"
        description="Attach a server-side filter expression to a consumer group. Non-matching events are never delivered — evaluated before creating deliveries, so they incur zero overhead."
      />

      <H2 id="syntax">DSL syntax</H2>
      <P>
        Filters are comma-separated conditions (comma = AND). Each condition is a{" "}
        <Mono>field operator value</Mono> triple:
      </P>
      <DocCodeBlock
        lang="ts"
        code={`type=order.paid               // equality on dot-path field
amount>100                    // numeric greater-than
status=paid,amount>100        // AND: status equals "paid" AND amount > 100
region!=us-east               // inequality
price>=9.99                   // numeric >=`}
      />

      <H2 id="usage">Usage in handleEvent</H2>
      <MultiCodeBlock
        code={{
          ts: `sb.handleEvent("orders.*", handler, {
  filterExpr: "status=paid,amount>100",
  groupName: "billing.high-value",
});`,
          go: `svc.HandleEvent("orders.*", handler,
  &servicebridge.HandleEventOpts{
    FilterExpr: "status=paid,amount>100",
    GroupName:  "billing.high-value",
  })`,
          py: `@sb.handle_event(
    "orders.*",
    group_name="billing.high-value",
    filter_expr="status=paid,amount>100",
)
async def on_high_value_order(payload: dict, ctx) -> None:
    ...`,
        }}
      />

      <H2 id="operators">Supported operators</H2>
      <div className="overflow-x-auto rounded-xl border border-surface-border my-4">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-surface-border text-left text-2xs uppercase tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2.5">Operator</th>
              <th className="px-4 py-2.5">Meaning</th>
              <th className="px-4 py-2.5">Works on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-muted-foreground text-xs">
            {[
              ["=", "equals", "string, number"],
              ["!=", "not equals", "string, number"],
              [
                ">",
                "greater than",
                "number; falls back to lexicographic string comparison if expected value is non-numeric",
              ],
              [
                ">=",
                "greater than or equal",
                "number; falls back to lexicographic string comparison if expected value is non-numeric",
              ],
              [
                "<",
                "less than",
                "number; falls back to lexicographic string comparison if expected value is non-numeric",
              ],
              [
                "<=",
                "less than or equal",
                "number; falls back to lexicographic string comparison if expected value is non-numeric",
              ],
            ].map(([op, meaning, works]) => (
              <tr key={op}>
                <td className="px-4 py-2.5 text-primary">{op}</td>
                <td className="px-4 py-2.5">{meaning}</td>
                <td className="px-4 py-2.5 text-muted-foreground/70">{works}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="fields">Field access</H2>
      <P>
        Fields are accessed using dot notation on the event payload. For example, a payload{" "}
        <Mono>{`{ "order": { "status": "paid", "amount": 150 } }`}</Mono> can be filtered with{" "}
        <Mono>order.status=paid,order.amount&gt;100</Mono>.
      </P>
      <P>
        If the referenced field does not exist in the payload (null or missing), all operators
        return <Mono>false</Mono> except <Mono>!=</Mono> which returns <Mono>true</Mono>.
      </P>
      <P>
        Boolean fields can be compared with <Mono>=</Mono> (e.g. <Mono>active=true</Mono>) —
        booleans are compared as the strings <Mono>"true"</Mono> and <Mono>"false"</Mono>.
      </P>
    </div>
  );
}
