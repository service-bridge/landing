import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { type SdkLang, useSdkLang } from "../lib/language-context";
import { fadeInUp } from "../components/animations";
import { Button } from "../ui/button";
import { CopyButton } from "../ui/CopyButton";
import { Eyebrow } from "../ui/Eyebrow";
import { Section } from "../ui/Section";
import { TabStrip } from "../ui/Tabs";

type TabId = "pkg" | "degit";

// Each SDK ships its own skill, so both the package-manager path and the repo
// path follow the language the reader picked.
const TAB_LABEL: Record<SdkLang, string> = { ts: "npm", go: "go get", py: "pip" };

const CMDS: Record<SdkLang, Record<TabId, string>> = {
  ts: {
    pkg: "npm i service-bridge && cp -r node_modules/service-bridge/skill .claude/skills/servicebridge-node",
    degit: "npx degit service-bridge/sdk/node/skill .claude/skills/servicebridge-node",
  },
  go: {
    pkg: 'go get github.com/service-bridge/sdk/go && cp -r "$(go env GOMODCACHE)"/github.com/service-bridge/sdk/go@*/skill .claude/skills/servicebridge-go',
    degit: "npx degit service-bridge/sdk/go/skill .claude/skills/servicebridge-go",
  },
  py: {
    pkg: "# The Python SDK is not released yet.",
    degit: "# The Python SDK is not released yet.",
  },
};

const SKILL_NAME: Record<SdkLang, string> = { ts: "Node SDK", go: "Go SDK", py: "Python SDK" };

const PAYOFF = [
  "Fewer wrong API guesses",
  "Correct lifecycle: declare → start → act",
  "Idiomatic proto schemas, the way the SDK expects them",
];

const SKILL_URL: Record<SdkLang, string> = {
  ts: "https://github.com/service-bridge/sdk/tree/main/node/skill",
  go: "https://github.com/service-bridge/sdk/tree/main/go/skill",
  py: "https://github.com/service-bridge/sdk",
};

export function AiSkillSection() {
  const [tab, setTab] = useState<TabId>("pkg");
  const { lang } = useSdkLang();
  const cmd = (CMDS[lang] ?? CMDS.ts)[tab];
  const tabs = [
    { id: "pkg" as const, label: TAB_LABEL[lang] ?? TAB_LABEL.ts },
    { id: "degit" as const, label: "degit" },
  ];

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
          Teaches Claude Code and other agents the real {SKILL_NAME[lang] ?? SKILL_NAME.ts} — RPC, events, workflows, jobs,
          HTTP integrations. Grounded in the shipped API, not a guess.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp} className="mt-10 md:mt-12">
        <div className="rounded-2xl border border-surface-border bg-code overflow-hidden">
          <div className="border-b border-surface-border bg-code-chrome px-3 py-2 flex items-center justify-between">
            <TabStrip size="sm" items={tabs} active={tab} onChange={setTab} />
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
        <a href={SKILL_URL[lang] ?? SKILL_URL.ts} target="_blank" rel="noreferrer">
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
