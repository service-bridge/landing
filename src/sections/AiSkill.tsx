import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { fadeInUp } from "../components/animations";
import { Button } from "../ui/button";
import { CopyButton } from "../ui/CopyButton";
import { Eyebrow } from "../ui/Eyebrow";
import { Section } from "../ui/Section";
import { TabStrip } from "../ui/Tabs";

const INSTALL_TABS = [
  { id: "npm" as const, label: "npm" },
  { id: "degit" as const, label: "degit" },
];

type TabId = (typeof INSTALL_TABS)[number]["id"];

const CMDS: Record<TabId, string> = {
  npm: "npm i service-bridge && cp -r node_modules/service-bridge/skill .claude/skills/servicebridge-node",
  degit: "npx degit service-bridge/sdk/node/skill .claude/skills/servicebridge-node",
};

const PAYOFF = [
  "Fewer wrong API guesses",
  "Correct lifecycle: declare → start → act",
  "Idiomatic proto schemas, the way the SDK expects them",
];

const SKILL_URL = "https://github.com/service-bridge/sdk/tree/main/node/skill";

export function AiSkillSection() {
  const [tab, setTab] = useState<TabId>("npm");
  const cmd = CMDS[tab];

  return (
    <Section id="ai-skill" maxWidth="3xl">
      <motion.div variants={fadeInUp} className="text-center">
        <div className="flex justify-center">
          <Eyebrow
            variant="pill"
            tone="border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            AI Coding Skill
          </Eyebrow>
        </div>
        <h2 className="font-display font-bold tracking-tight text-3xl sm:text-4xl">
          Your agent already knows ServiceBridge
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Teaches Claude Code and other agents the real Node SDK — RPC, events, workflows, jobs,
          HTTP integrations. Grounded in the shipped API, not a guess.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="mt-10 md:mt-12">
        <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
          <div className="border-b border-surface-border bg-code-chrome px-3 py-2 flex items-center justify-between">
            <TabStrip size="sm" items={INSTALL_TABS} active={tab} onChange={setTab} />
            <CopyButton text={cmd} />
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
            <code>$ {cmd}</code>
          </pre>
          <div className="border-t border-surface-border px-4 py-2.5">
            <p className="type-caption text-muted-foreground/80">
              Drops into <code>.claude/skills/</code> (or wherever your agent reads skills). Restart
              the agent to load it.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6"
      >
        {PAYOFF.map((t) => (
          <span key={t} className="flex items-center gap-2 text-sm text-foreground/80">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {t}
          </span>
        ))}
      </motion.div>

      <motion.div variants={fadeInUp} className="mt-8 flex justify-center">
        <a href={SKILL_URL} target="_blank" rel="noreferrer">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Browse the skill <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </motion.div>
    </Section>
  );
}
