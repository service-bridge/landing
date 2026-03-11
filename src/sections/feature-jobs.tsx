import { motion } from "framer-motion";
import { AlarmClock, CalendarClock, GitBranch } from "lucide-react";
import { AnimatedSection, fadeInUp } from "../components/animations";
import { CodeBlock } from "../ui/CodeBlock";
import { MiniCard } from "../ui/MiniCard";
import { SectionHeader } from "../ui/SectionHeader";
import { FlowTile, SectionTag } from "./feature-shared";

const JOBS_CODE = `import { servicebridge } from "@servicebridge/sdk";

const sb = servicebridge("127.0.0.1:14445", SERVICE_KEY, "reports");

await sb.job("reports.generate", {
  cron: "0 * * * *",
  timezone: "UTC",
  misfire: "fire_now",
  via: "rpc",
});

await sb.job("trial.reminder", {
  delay: 24 * 60 * 60 * 1000,
  via: "event",
});`;

export function JobsSection() {
  const timelineRows = [
    { label: "reports.generate", schedule: "0 * * * *", offset: "08:00", width: "64%" },
    { label: "sync.billing", schedule: "*/15 * * * *", offset: "08:15", width: "42%" },
    { label: "trial.reminder", schedule: "delay 24h", offset: "09:05", width: "28%" },
  ];

  return (
    <AnimatedSection id="jobs" className="py-24 border-t border-white/[0.04]">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Built-in Jobs"
          title="Cron and delayed runs on the same runtime."
          subtitle="Schedule recurring or one-shot work without a second queueing stack. Jobs can dispatch through RPC, events, or workflows with misfire handling built in."
        />

        <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="type-overline-mono text-zinc-500">scheduler api</p>
              <h3 className="mt-2 text-xl font-semibold font-display">
                Jobs are another primitive, not another subsystem.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The same service key, UI, traces, and run list cover background schedules too. No
                extra cron daemon or queue worker farm required.
              </p>
            </div>

            <CodeBlock code={JOBS_CODE} filename="reports-scheduler.ts" />

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <MiniCard
                icon={AlarmClock}
                title="Cron + delayed"
                desc="Mix recurring schedules with one-shot reminders or delayed follow-up tasks."
                iconClassName="text-amber-400"
              />
              <MiniCard
                icon={CalendarClock}
                title="Misfire handling"
                desc="Choose whether missed schedules fire now, skip, or follow the configured catch-up policy."
                iconClassName="text-blue-400"
              />
              <MiniCard
                icon={GitBranch}
                title="Dispatch anywhere"
                desc="Jobs can invoke an RPC, publish an event, or kick off a workflow run."
                iconClassName="text-fuchsia-400"
              />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7"
          >
            <div className="rounded-3xl border border-white/[0.06] bg-[#081018] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="type-overline-mono text-zinc-500">next runs</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Schedules are visible as first-class runs with the same observability as user
                    traffic.
                  </p>
                </div>
                <SectionTag tone="border-amber-500/20 bg-amber-500/[0.08] text-amber-300">
                  scheduler live
                </SectionTag>
              </div>

              <div className="mt-5 space-y-3">
                {timelineRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold font-display">{row.label}</p>
                        <p className="mt-1 text-2xs font-mono text-zinc-500">{row.schedule}</p>
                      </div>
                      <span className="text-2xs font-mono text-amber-300">{row.offset}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400/70 to-primary/70"
                        style={{ width: row.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <FlowTile label="dispatch" value="rpc | event | workflow" tone="text-amber-300" />
              <FlowTile label="clock drift" value="misfire aware" tone="text-blue-300" />
              <FlowTile label="visibility" value="shows up in Runs UI" tone="text-emerald-300" />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
}
