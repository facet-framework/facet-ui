import { localized } from "../../i18n/legacy/facet/shell/Shell.stories.text";
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

const meta: Meta = { title: "Frame/App", parameters: { layout: "fullscreen" } };
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
            { key: "overview", label: "Overview", icon: "home", current: true },
            { key: "product", label: "Product", icon: "product" },
            { key: "records", label: "records", icon: "records", badge: true },
            { key: "ask", label: localized.text2, icon: "chat" },
            { key: "more", label: "More", icon: "menu" },
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
        <p className="t-muted">{localized.text3}</p>
      </div>
    </AppShell>
  );
}

export const Desktop: Story = { render: () => <Frame /> };
export const HistoryOpen: Story = { name: "History Open", render: () => <Frame historyOpen /> };
export const RoleOpen: Story = { name: "Role Open", render: () => <Frame roleOpen /> };
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
      file="docs/facets/features/workspace/board/column.yaml"
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

export const StartConnect: Story = {
  name: "Start Connect",
  render: () => <BootDemo phase="connect" progress={null} />,
};
export const StartRecords: Story = {
  name: "Start Records",
  render: () => <BootDemo phase="records" progress={34} />,
};
export const StartIndex: Story = {
  name: "Start Index",
  render: () => <BootDemo phase="index" progress={78} />,
};
export const StartFlight: Story = {
  name: "Start Flight",
  render: () => <BootDemo phase="ready" progress={100} leaving />,
};
export const StartError: Story = {
  name: "Start Error",
  render: () => (
    <BootScreen
      phase="connect"
      progress={null}
      counts={{ records: null, files: null, anchors: null }}
      error={{
        title: localized.text6,
        reason: localized.text7,
        onRetry: () => undefined,
      }}
    />
  ),
};
export const StartMobile: Story = {
  name: "Start Mobile",
  globals: { viewport: { value: "mobile" } },
  render: () => <BootDemo phase="records" progress={34} />,
};
