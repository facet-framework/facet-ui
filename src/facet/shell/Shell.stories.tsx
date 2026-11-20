import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  AppShell,
  BootScreen,
  MobileTabBar,
  MoreSheet,
  NavBar,
  RoleMenu,
  TopBar,
  type BootPhase,
} from "./Shell";
import { useText } from "../i18n/TextProvider";
import { HISTORY, useNav, useRoles } from "../fixtures/shell";

const meta: Meta = { title: "Shell/App", parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;

function Frame({
  mobile,
  historyOpen,
  roleOpen,
}: {
  mobile?: boolean;
  historyOpen?: boolean;
  roleOpen?: boolean;
}) {
  const nav = useNav();
  const { t: text } = useText();
  const roles = useRoles();
  const [hist, setHist] = useState(!!historyOpen);
  const [role, setRole] = useState(!!roleOpen);
  const [more, setMore] = useState(false);
  return (
    <AppShell
      mobile={mobile}
      top={
        <TopBar
          compact={mobile}
          canBack
          canForward={false}
          historyOpen={hist}
          onHistory={() => setHist((h) => !h)}
          history={{ entries: HISTORY }}
          stats={{ features: 217, provenPct: 94, drift: 18 }}
          roleName={roles[1].name}
          roleOpen={role}
          onRole={() => setRole((r) => !r)}
          roleMenu={<RoleMenu roles={roles} current="dev" />}
          theme={{ label: text("shell.theme.light"), icon: "sun" }}
          onMenu={() => setMore(true)}
        />
      }
      nav={<NavBar items={nav} />}
      tabbar={
        <MobileTabBar
          items={[
            {
              key: "overview",
              label: text("shell.nav.item.overview"),
              icon: "home",
              current: true,
            },
            { key: "product", label: text("shell.nav.item.product"), icon: "product" },
            { key: "records", label: text("shell.nav.item.records"), icon: "records", badge: true },
            { key: "ask", label: text("shell.tab.ask"), icon: "chat" },
            { key: "more", label: text("shell.tab.more"), icon: "menu" },
          ]}
          onPick={(k) => k === "more" && setMore(true)}
        />
      }
      overlay={
        <MoreSheet
          open={more}
          items={nav}
          roleName={roles[1].name}
          onClose={() => setMore(false)}
        />
      }
    >
      <div className="t-page">
        <p className="t-muted">Content</p>
      </div>
    </AppShell>
  );
}

export const Desktop: Story = { render: () => <Frame /> };
export const HistoryOpen: Story = { name: "History open", render: () => <Frame historyOpen /> };
export const RoleOpen: Story = { name: "Role open", render: () => <Frame roleOpen /> };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  render: () => <Frame mobile />,
};

function BootDemo({
  phase,
  progress,
  leaving,
}: {
  phase: BootPhase;
  progress: number | null;
  leaving?: boolean;
}) {
  return (
    <BootScreen
      phase={phase}
      file="docs/facets/features/navigation/atlas/adr-plugin.yaml"
      progress={progress}
      leaving={leaving}
      counts={{
        records: phase === "connect" ? null : 220,
        files: progress == null ? null : 1852,
        anchors: phase === "index" || phase === "model" ? 525 : null,
      }}
    />
  );
}

export const BootConnecting: Story = {
  name: "Boot · connecting",
  render: () => <BootDemo phase="connect" progress={null} />,
};
export const BootRecords: Story = {
  name: "Boot · reading records",
  render: () => <BootDemo phase="records" progress={34} />,
};
export const BootIndex: Story = {
  name: "Boot · indexing anchors",
  render: () => <BootDemo phase="index" progress={78} />,
};
export const BootFlight: Story = {
  name: "Boot · flight into the logo",
  render: () => <BootDemo phase="ready" progress={100} leaving />,
};
export const BootError: Story = {
  name: "Boot · error",
  render: () => (
    <BootScreen
      phase="connect"
      progress={null}
      counts={{ records: null, files: null, anchors: null }}
      error={{
        title: "facet ui does not answer",
        reason: "GET /api/model timed out after 10 s. Is `facet ui` still running?",
        onRetry: () => undefined,
      }}
    />
  ),
};
export const BootMobile: Story = {
  name: "Boot · mobile",
  globals: { viewport: { value: "mobile" } },
  render: () => <BootDemo phase="records" progress={34} />,
};
