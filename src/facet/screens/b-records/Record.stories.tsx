import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
} as const;
import {
  RecordDossierPage,
  type CrumbLevel,
  type DossierSectionKey,
  type RecordDossier,
} from "./RecordDossierPage";
import { RULE_ANCHORED, dossierOf, featureById, siblingsOf } from "./storyData";

const meta: Meta = { title: "Screens/B Records/Record" };
export default meta;
type Story = StoryObj;

type DemoProps = {
  id: string;
  mobile?: boolean;
  record?: RecordDossier;
  tab?: "record" | "raw";
  siblingsOpen?: CrumbLevel;
  collapsed?: DossierSectionKey[];
  filter?: "all" | "open" | "proven";
  section?: DossierSectionKey;
};

const MOBILE_FOLDED: DossierSectionKey[] = ["code", "history", "relations", "operations", "rules"];

function Demo({
  id,
  mobile,
  record,
  tab: t0 = "record",
  siblingsOpen,
  collapsed: c0,
  filter: f0 = "all",
  section: s0,
}: DemoProps) {
  const [tab, setTab] = useState(t0);
  const [raw, setRaw] = useState<"yaml" | "json">("yaml");
  const [open, setOpen] = useState<CrumbLevel | null>(siblingsOpen ?? null);
  const [collapsed, setCollapsed] = useState<DossierSectionKey[]>(
    c0 ?? (mobile ? MOBILE_FOLDED : []),
  );
  const [filter, setFilter] = useState(f0);
  const [section, setSection] = useState<DossierSectionKey>(s0 ?? "promises");
  return (
    <Screen area="records" mobile={mobile}>
      <RecordDossierPage
        state="ready"
        mobile={mobile}
        record={record ?? dossierOf(id)}
        siblings={siblingsOf(id)}
        siblingsOpen={open}
        tab={tab}
        rawFormat={raw}
        section={section}
        collapsed={collapsed}
        scenarioFilter={filter}
        now="2026-11"
        onTab={setTab}
        onRawFormat={setRaw}
        onSection={(s) => {
          setSection(s);
          setCollapsed((c) => c.filter((x) => x !== s));
          document.getElementById(s)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onToggleSection={(s) =>
          setCollapsed((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))
        }
        onToggleSiblings={(l) => setOpen((o) => (o === l ? null : l))}
        onScenarioFilter={setFilter}
      />
    </Screen>
  );
}

const ADR = "workspace/board/column";
const GATE = "lists/permissions/admin";

const StandardArgs: DemoProps = { id: ADR };
export const Standard: Story = {
  ...desktop,

  render: () => <Demo {...StandardArgs} />,
};
export const StandardMobile: Story = {
  ...mobile,

  render: () => <Demo {...StandardArgs} mobile />,
};

const gateAll = (): RecordDossier => ({
  ...dossierOf(GATE, { allLog: true }),
  rules: [{ id: RULE_ANCHORED.id, title: RULE_ANCHORED.title, states: RULE_ANCHORED.states }],
});
const AllSectionsArgs: DemoProps = { id: GATE, record: gateAll(), collapsed: [] };
export const AllSections: Story = {
  ...desktop,
  name: "All Sections",
  render: () => <Demo {...AllSectionsArgs} />,
};
export const AllSectionsMobile: Story = {
  ...mobile,
  name: "All Sections Mobile",
  render: () => <Demo {...AllSectionsArgs} mobile />,
};

const PromiseOpenArgs: DemoProps = {
  id: "delivery/ci/cache",
  filter: "open",
  collapsed: ["code", "knowledge", "history", "relations", "operations", "rules"],
};
export const PromiseOpen: Story = {
  ...desktop,
  name: "Promise Open",
  render: () => <Demo {...PromiseOpenArgs} />,
};
export const PromiseOpenMobile: Story = {
  ...mobile,
  name: "Promise Open Mobile",
  render: () => <Demo {...PromiseOpenArgs} mobile />,
};

const WithDriftArgs: DemoProps = {
  id: "lists/sharing/handoff-create",
};
export const WithDrift: Story = {
  ...desktop,
  name: "With Drift",
  render: () => <Demo {...WithDriftArgs} />,
};
export const WithDriftMobile: Story = {
  ...mobile,
  name: "With Drift Mobile",
  render: () => <Demo {...WithDriftArgs} mobile />,
};

const plannedNoAnchor = (): RecordDossier => ({
  ...dossierOf("workspace/assistant/summary-restore"),
  anchors: [],
  anchorCount: 0,
});
const PlannedArgs: DemoProps = {
  id: "workspace/assistant/summary-restore",
  record: plannedNoAnchor(),
  collapsed: ["promises", "knowledge", "history", "relations", "operations", "rules"],
};
export const Planned: Story = {
  ...desktop,
  name: "Planned",
  render: () => <Demo {...PlannedArgs} />,
};
export const PlannedMobile: Story = {
  ...mobile,
  name: "Planned Mobile",
  render: () => <Demo {...PlannedArgs} mobile />,
};

const AssumptionArgs: DemoProps = { id: "assumption/sync/push-optin-rate", collapsed: [] };
export const Assumption: Story = {
  ...desktop,

  render: () => <Demo {...AssumptionArgs} />,
};
export const AssumptionMobile: Story = {
  ...mobile,

  render: () => <Demo {...AssumptionArgs} mobile />,
};

const DeprecatedArgs: DemoProps = { id: "delivery/releases/mirror-sort" };
export const Deprecated: Story = {
  ...desktop,
  name: "Deprecated",
  render: () => <Demo {...DeprecatedArgs} />,
};
export const DeprecatedMobile: Story = {
  ...mobile,
  name: "Deprecated Mobile",
  render: () => <Demo {...DeprecatedArgs} mobile />,
};

const WithoutTestsArgs: DemoProps = {
  id: "lists/sharing/comment-archive",
  collapsed: ["code", "history", "relations", "operations", "rules"],
};
export const WithoutTests: Story = {
  ...desktop,
  name: "Without Tests",
  render: () => <Demo {...WithoutTestsArgs} />,
};
export const WithoutTestsMobile: Story = {
  ...mobile,
  name: "Without Tests Mobile",
  render: () => <Demo {...WithoutTestsArgs} mobile />,
};

const WithoutKnowledgeArgs: DemoProps = {
  id: "workspace/board/card",
  collapsed: ["promises", "code", "history", "relations", "operations", "rules"],
};
export const WithoutKnowledge: Story = {
  ...desktop,
  name: "Without Knowledge",
  render: () => <Demo {...WithoutKnowledgeArgs} />,
};
export const WithoutKnowledgeMobile: Story = {
  ...mobile,
  name: "Without Knowledge Mobile",
  render: () => <Demo {...WithoutKnowledgeArgs} mobile />,
};

const RawArgs: DemoProps = { id: GATE, tab: "raw" };
export const Raw: Story = { ...desktop, name: "Raw", render: () => <Demo {...RawArgs} /> };
export const RawMobile: Story = {
  ...mobile,
  name: "Raw Mobile",
  render: () => <Demo {...RawArgs} mobile />,
};

const PathSiblingsArgs: DemoProps = {
  id: ADR,
  siblingsOpen: "capability",
};
export const PathSiblings: Story = {
  ...desktop,
  name: "Path Siblings",
  render: () => <Demo {...PathSiblingsArgs} />,
};
export const PathSiblingsMobile: Story = {
  ...mobile,
  name: "Path Siblings Mobile",
  render: () => <Demo {...PathSiblingsArgs} mobile />,
};

function Missing({ mobile }: { mobile?: boolean }) {
  return (
    <Screen area="records" mobile={mobile}>
      <RecordDossierPage
        state="not-found"
        mobile={mobile}
        tab="record"
        missingId="workspace/board/columns"
        nearest={[ADR, "workspace/board/card", featureById("lists/permissions/role").id]}
      />
    </Screen>
  );
}
export const NotFound: Story = {
  ...desktop,
  name: "Not Found",
  render: () => <Missing />,
};
export const NotFoundMobile: Story = {
  ...mobile,
  name: "Not Found Mobile",
  render: () => <Missing mobile />,
};

export const StandardTablet: Story = {
  ...tablet,
  render: () => <Demo id={ADR} />,
};
