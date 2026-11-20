import { localized } from "../../../i18n/legacy/facet/screens/c-contents/Settings.stories.text";
import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { useText } from "../../i18n/TextProvider";
import {
  AiSection,
  ForgeSection,
  GenUiSection,
  LanguageSection,
  PluginDetailSection,
  PluginGrantSection,
  PluginsSection,
  SETTINGS_SECTIONS,
  sectionLabel,
  SettingsPage,
  StorageSection,
  ThemeSection,
  type AiSettings,
  type Appearance,
  type ForgeSettings,
  type GenUiSettings,
  type LanguageSettings,
  type StorageSettings,
} from "./Settings";
import { grantItems, plugins } from "./data";
import { desk, mob, tab } from "./kit";
import type { SettingsSectionKey } from "./model";

const meta: Meta = { title: "Screens/C Contents/Settings" };
export default meta;

type Variant = "standard" | "ai-out" | "no-remote" | "plugin-detail" | "plugin-grant";

function Demo({
  section: initial,
  variant = "standard",
  mobile,
  query: q0 = "",
  list,
}: {
  section: SettingsSectionKey;
  variant?: Variant;
  mobile: boolean;
  query?: string;
  list?: boolean;
}) {
  const { t } = useText();
  const [section, setSection] = useState(initial);
  const [detail, setDetail] = useState(!list);
  const [query, setQuery] = useState(q0);
  const [pluginView, setPluginView] = useState<"list" | "detail" | "grant">(
    variant === "plugin-detail" ? "detail" : variant === "plugin-grant" ? "grant" : "list",
  );
  const [look, setLook] = useState<Appearance>({
    theme: "facet",
    mode: "dark",
    followSystem: false,
    density: "normal",
    motion: "system",
    surface: "v3",
  });
  const [lang, setLang] = useState<LanguageSettings>({
    ui: "de",
    content: "record",
    dates: "relative",
    week: "monday",
  });
  const [store, setStore] = useState<StorageSettings>({
    historyLimit: "200",
    historyCount: 37,
    keepChat: true,
    restoreLast: true,
    items: [
      { key: "atlas.v3.history", label: "Visited places", bytes: 6_420, entries: 37 },
      { key: "atlas.v3.chat", label: "Chat-Sessions", bytes: 48_210, entries: 12 },
      { key: "atlas.v3.views", label: localized.text1, bytes: 1_180, entries: 19 },
      { key: "atlas.v3.look", label: localized.text2, bytes: 240, entries: 2 },
    ],
  });
  const [ai, setAi] = useState<AiSettings>({
    state: variant === "ai-out" ? "signed-out" : "ready",
    account: "Lokale Anmeldung · claude 2.4",
    model: "Opus",
    models: ["Opus", "Sonnet", "Haiku"],
    mode: "read",
    tools: [
      { name: "Read", allowed: true },
      { name: "Grep", allowed: true },
      { name: "Glob", allowed: true },
      { name: "mcp__facet__rag_query", allowed: true },
      { name: "Bash", allowed: false },
      { name: "Write", allowed: false },
      { name: "Edit", allowed: false },
    ],
    lastCheck: "14:08",
  });
  const [forge, setForge] = useState<ForgeSettings>({
    state: variant === "no-remote" ? "no-remote" : "ok",
    remote: "https://github.com/facet-framework/facet.git",
    provider: "github",
    branch: "main",
    branchPrefix: "atlas/",
    prDraft: true,
    codeLinks: true,
    manualUrl: variant === "no-remote" ? "github.com/facet" : "",
    error: variant === "no-remote" ? localized.text3 : undefined,
  });
  const [gen, setGen] = useState<GenUiSettings>({
    enabled: true,
    scope: "blocks",
    maxBlocks: "6",
    surfaces: [
      {
        key: "chat",
        label: "Ask Atlas",
        desc: localized.text4,
        on: true,
      },
      { key: "record", label: "Record", desc: localized.text5, on: false },
      { key: "overview", label: "Overview", desc: localized.text6, on: false },
    ],
  });
  const [decisions, setDecisions] = useState<Record<string, "grant" | "deny" | undefined>>({
    g3: "grant",
  });
  const results = query
    ? SETTINGS_SECTIONS.filter((s) =>
        `${sectionLabel(s, t)} ${t(s.sub)}`.toLowerCase().includes(query.toLowerCase()),
      ).map((s) => s.key)
    : null;
  const bpmn = plugins.find((p) => p.id === "bpmn") ?? plugins[0];
  const body =
    section === "appearance" ? (
      <ThemeSection value={look} onChange={(p) => setLook((l) => ({ ...l, ...p }))} />
    ) : section === "language" ? (
      <LanguageSection
        value={lang}
        sample={{ relative: "6 days ago", absolute: "06.11.2026, 18:18", number: "1.226" }}
        onChange={(p) => setLang((l) => ({ ...l, ...p }))}
      />
    ) : section === "history" ? (
      <StorageSection
        value={store}
        onChange={(p) =>
          setStore((s) => {
            const n = { ...s, ...p };
            const v = Number(n.historyLimit);
            return {
              ...n,
              error: Number.isInteger(v) && v >= 1 && v <= 200 ? undefined : localized.text9,
            };
          })
        }
      />
    ) : section === "ai" ? (
      <AiSection value={ai} onChange={(p) => setAi((a) => ({ ...a, ...p }))} />
    ) : section === "forge" ? (
      <ForgeSection
        value={forge}
        onChange={(p) =>
          setForge((f) => {
            const n = { ...f, ...p };
            return {
              ...n,
              error:
                n.state === "no-remote" && !/^https:\/\/.+\/.+/.test(n.manualUrl)
                  ? localized.text10
                  : undefined,
            };
          })
        }
      />
    ) : section === "plugins" ? (
      pluginView === "detail" ? (
        <PluginDetailSection
          plugin={bpmn}
          manifest={{
            entry: "dist/bpmn.js",
            path: ".facet/plugins/bpmn/0.8.1/",
            installedAt: localized.text11,
            sidecars: [
              {
                name: "bpmn",
                sha256: "3f9c1be04a7d22c5e8a9b0f61d7735e2c4a8f0d19b6e3c27a5d48f90e1b2c3d4",
              },
            ],
          }}
          grants={grantItems}
          onBack={() => setPluginView("list")}
          onOpenGrant={() => setPluginView("grant")}
        />
      ) : pluginView === "grant" ? (
        <PluginGrantSection
          plugin={bpmn}
          items={grantItems}
          decisions={decisions}
          token={{ valid: true, until: "14:32", origin: "http://127.0.0.1:47811" }}
          onDecide={(k, d) => setDecisions((x) => ({ ...x, [k]: d }))}
          onCancel={() => setPluginView("detail")}
        />
      ) : (
        <PluginsSection plugins={plugins} onOpen={() => setPluginView("detail")} />
      )
    ) : section === "genui" ? (
      <GenUiSection
        value={gen}
        onChange={(p) =>
          setGen((g) => {
            const n = { ...g, ...p };
            const v = Number(n.maxBlocks);
            return {
              ...n,
              error: Number.isInteger(v) && v >= 1 && v <= 12 ? undefined : "1 to 12 Blocks.",
            };
          })
        }
      />
    ) : null;
  return (
    <SettingsPage
      active={section}
      mobile={mobile}
      detailOpen={detail}
      query={query}
      results={results}
      badges={{
        plugins: { label: localized.text12, tone: "warn" },
        ai: ai.state === "signed-out" ? { label: "signedout", tone: "warn" } : undefined,
        forge: forge.state === "no-remote" ? { label: localized.text13, tone: "warn" } : undefined,
      }}
      onQuery={setQuery}
      onSection={(s) => {
        setSection(s);
        setDetail(true);
        setPluginView("list");
      }}
      onBack={() => setDetail(false)}
    >
      {body}
    </SettingsPage>
  );
}

const S = "settings";
export const Themes = desk(S, "Themes", (m) => <Demo section="appearance" mobile={m} />);
export const ThemesMobile = mob(S, "Themes Mobile", (m) => (
  <Demo section="appearance" mobile={m} />
));
export const List = desk(S, "List", (m) => <Demo section="appearance" mobile={m} list />);
export const ListMobile = mob(S, "List Mobile", (m) => (
  <Demo section="appearance" mobile={m} list />
));
export const Language = desk(S, "Language", (m) => <Demo section="language" mobile={m} />);
export const LanguageMobile = mob(S, "Language Mobile", (m) => (
  <Demo section="language" mobile={m} />
));
export const HistoryStorage = desk(S, "History Storage", (m) => (
  <Demo section="history" mobile={m} />
));
export const HistoryStorageMobile = mob(S, "History Storage Mobile", (m) => (
  <Demo section="history" mobile={m} />
));
export const AtlasAi = desk(S, "Atlas Ai", (m) => <Demo section="ai" mobile={m} />);
export const AtlasAiMobile = mob(S, "Atlas Ai Mobile", (m) => <Demo section="ai" mobile={m} />);
export const AtlasAiNotSignedIn = desk(S, "Atlas Ai Not Signed In", (m) => (
  <Demo section="ai" variant="ai-out" mobile={m} />
));
export const AtlasAiNotSignedInMobile = mob(S, "Atlas Ai Not Signed In Mobile", (m) => (
  <Demo section="ai" variant="ai-out" mobile={m} />
));
export const GitForge = desk(S, "Git Forge", (m) => <Demo section="forge" mobile={m} />);
export const GitForgeMobile = mob(S, "Git Forge Mobile", (m) => (
  <Demo section="forge" mobile={m} />
));
export const GitForgeWithoutRemote = desk(S, "Git Forge Without Remote", (m) => (
  <Demo section="forge" variant="no-remote" mobile={m} />
));
export const GitForgeWithoutRemoteMobile = mob(S, "Git Forge Without Remote Mobile", (m) => (
  <Demo section="forge" variant="no-remote" mobile={m} />
));
export const Plugins = desk(S, "Plugins", (m) => <Demo section="plugins" mobile={m} />);
export const PluginsMobile = mob(S, "Plugins Mobile", (m) => <Demo section="plugins" mobile={m} />);
export const PluginDetail = desk(S, "Plugin Detail", (m) => (
  <Demo section="plugins" variant="plugin-detail" mobile={m} />
));
export const PluginDetailMobile = mob(S, "Plugin Detail Mobile", (m) => (
  <Demo section="plugins" variant="plugin-detail" mobile={m} />
));
export const PluginGrant = desk(S, "Plugin Grant", (m) => (
  <Demo section="plugins" variant="plugin-grant" mobile={m} />
));
export const PluginGrantMobile = mob(S, "Plugin Grant Mobile", (m) => (
  <Demo section="plugins" variant="plugin-grant" mobile={m} />
));
export const GenerativeUi = desk(S, "Generative Ui", (m) => <Demo section="genui" mobile={m} />);
export const GenerativeUiMobile = mob(S, "Generative Ui Mobile", (m) => (
  <Demo section="genui" mobile={m} />
));
export const SearchWithoutMatches = desk(S, "Search Without Matches", (m) => (
  <Demo section="appearance" mobile={m} query={localized.text21} list />
));
export const SearchWithoutMatchesMobile = mob(S, "Search Without Matches Mobile", (m) => (
  <Demo section="appearance" mobile={m} query={localized.text23} list />
));
export const PluginGrantTablet = tab(S, "Plugin-Grant (ADR 0006)", (m) => (
  <Demo section="plugins" variant="plugin-grant" mobile={m} />
));
