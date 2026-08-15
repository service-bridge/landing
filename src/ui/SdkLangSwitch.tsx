import { type SdkLang, useSdkLang } from "../lib/language-context";
import { TabStrip } from "./Tabs";

// The landing has no other way to reach the Go content: the only other switch
// lives inside the documentation code blocks. Every section reads the same
// context, so flipping this moves install commands, examples and the skill.
const SHIPPED: { id: SdkLang; label: string }[] = [
  { id: "ts", label: "Node" },
  { id: "go", label: "Go" },
];

export function SdkLangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useSdkLang();

  return (
    <TabStrip
      size="sm"
      items={SHIPPED}
      active={lang === "go" ? "go" : "ts"}
      onChange={setLang}
      className={className}
    />
  );
}
