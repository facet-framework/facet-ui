import { localized } from "../../../i18n/legacy/facet/screens/a-frame/Start.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Screen, desktop, mobile } from "../Screen";
import type { BootPhase } from "../../shell/Shell";
import { OverviewPage } from "./OverviewPage";
import { StartPage } from "./StatusPages";
import { TEAM_NAMES, UNMEASURED, overviewModel, reader } from "./data";

const meta: Meta = { title: "Screens/A Frame/Start" };
export default meta;
type Story = StoryObj;

const M = overviewModel();
const FILE = "docs/facets/features/workspace/board/column.yaml";

type Boot = {
  phase: BootPhase;
  progress: number | null;
  file?: string;
  counts: { records: number | null; files: number | null; anchors: number | null };
  leaving?: boolean;
  error?: { title: string; reason: string; onRetry?: () => void };
};

function Start({ boot, mobile, at }: { boot: Boot; mobile?: boolean; at?: number }) {
  return (
    <Screen
      area="overview"
      mobile={mobile}
      {...reader("leadership")}
      canBack={false}
      stats={boot.leaving ? undefined : UNMEASURED}
      badges={boot.leaving ? undefined : null}
      overlay={<StartPage {...boot} freezeAt={at} />}
    >
      {boot.leaving ? (
        <OverviewPage reader="leadership" model={M} mobile={mobile} teamNames={TEAM_NAMES} />
      ) : (
        <div className="t-page" />
      )}
    </Screen>
  );
}

const CONNECT: Boot = {
  phase: "connect",
  progress: null,
  file: "GET /api/corpus",
  counts: { records: null, files: null, anchors: null },
};
const RECORDS: Boot = {
  phase: "records",
  progress: 41,
  file: FILE,
  counts: { records: 91, files: null, anchors: null },
};
const COUNT: Boot = {
  phase: "enumerate",
  progress: null,
  file: "packages/task/signing_activity.go",
  counts: { records: 220, files: 1204, anchors: null },
};
const INDEX: Boot = {
  phase: "index",
  progress: 78,
  file: "apps/sidebar-presence/src/session-theme/header-parser/offline-store.ts",
  counts: { records: 220, files: 1852, anchors: 412 },
};
const READY: Boot = {
  phase: "ready",
  progress: 100,
  counts: { records: 220, files: 1852, anchors: 525 },
  leaving: true,
};
const FAILED: Boot = {
  phase: "connect",
  progress: null,
  counts: { records: null, files: null, anchors: null },
  error: {
    title: localized.text1,
    reason: localized.text2,
    onRetry: () => undefined,
  },
};

export const Connect: Story = {
  ...desktop,
  render: () => <Start boot={CONNECT} />,
};
export const ConnectMobile: Story = {
  ...mobile,
  render: () => <Start boot={CONNECT} mobile />,
};
export const ReadingRecords: Story = {
  ...desktop,
  name: "Reading Records",
  render: () => <Start boot={RECORDS} />,
};
export const ReadingRecordsMobile: Story = {
  ...mobile,
  name: "Reading Records Mobile",
  render: () => <Start boot={RECORDS} mobile />,
};
export const Count: Story = {
  ...desktop,
  name: "Count",
  render: () => <Start boot={COUNT} />,
};
export const CountMobile: Story = {
  ...mobile,
  name: "Count Mobile",
  render: () => <Start boot={COUNT} mobile />,
};
export const Index: Story = {
  ...desktop,
  name: "Index",
  render: () => <Start boot={INDEX} />,
};
export const IndexMobile: Story = {
  ...mobile,
  name: "Index Mobile",
  render: () => <Start boot={INDEX} mobile />,
};
export const Ready: Story = {
  ...desktop,
  name: "Ready",
  render: () => <Start boot={READY} />,
};
export const ReadyMobile: Story = {
  ...mobile,
  name: "Ready Mobile",
  render: () => <Start boot={READY} mobile />,
};
export const ReadyInFlight: Story = {
  ...desktop,
  name: "Ready In Flight",
  render: () => <Start boot={READY} at={0.2} />,
};
export const ReadyInFlightMobile: Story = {
  ...mobile,
  name: "Ready In Flight Mobile",
  render: () => <Start boot={READY} mobile at={0.2} />,
};
export const Error: Story = {
  ...desktop,
  name: "Error",
  render: () => <Start boot={FAILED} />,
};
export const ErrorMobile: Story = {
  ...mobile,
  name: "Error Mobile",
  render: () => <Start boot={FAILED} mobile />,
};
