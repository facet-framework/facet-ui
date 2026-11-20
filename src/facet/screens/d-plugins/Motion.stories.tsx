import { labelText } from "../../../i18n/legacy/labels";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { Button } from "../../primitives/controls";
import { CountUpBoard, FlightDemo, ReducedMotionDemo, StaggerDemo } from "./Motion";
import { SUMMARY } from "../../fixtures";
import { adrs480, motionRows, staggerRows } from "./storyData";

const meta: Meta = { title: "Screens/D Plugins/Motion" };
export default meta;
type Story = StoryObj;

function Replay({
  mobile,
  area,
  children,
}: {
  mobile?: boolean;
  area: string;
  children: (run: number) => ReactNode;
}) {
  const [run, setRun] = useState(0);
  return (
    <Screen area={area} mobile={mobile}>
      <div className="t-page t-stack t-d-replay">
        <Button icon="refresh" onClick={() => setRun((r) => r + 1)}>
          {labelText.text171}
        </Button>
        <Fragment key={run}>{children(run)}</Fragment>
      </div>
    </Screen>
  );
}

function useAutoOpen(at: number, delay = 450) {
  const [opened, setOpened] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setOpened(at), delay);
    return () => clearTimeout(t);
  }, [at, delay]);
  return [opened, setOpened] as const;
}

function FlightPlay({ reduced }: { reduced?: boolean }) {
  const [opened, setOpened] = useAutoOpen(2);
  const props = { rows: motionRows, opened, onOpen: setOpened, onClose: () => setOpened(null) };
  return reduced ? <ReducedMotionDemo {...props} /> : <FlightDemo {...props} />;
}

const Flight = ({ mobile }: { mobile?: boolean }) => (
  <Replay mobile={mobile} area="records">
    {() => <FlightPlay />}
  </Replay>
);

const Stagger = ({ mobile }: { mobile?: boolean }) => (
  <Replay mobile={mobile} area="records">
    {(run) => <StaggerDemo rows={staggerRows} run={run} />}
  </Replay>
);

const Count = ({ mobile }: { mobile?: boolean }) => (
  <Replay mobile={mobile} area="overview">
    {(run) => (
      <CountUpBoard
        run={run}
        figures={[
          { value: SUMMARY.activeFeatures, label: "Features" },
          { value: SUMMARY.provenPct, label: "proven", tone: "ok", suffix: " %" },
          { value: SUMMARY.driftRecords, label: "Drift", tone: "warn" },
          { value: adrs480.length, label: "Decisions" },
        ]}
      />
    )}
  </Replay>
);

const Reduced = ({ mobile }: { mobile?: boolean }) => (
  <Replay mobile={mobile} area="records">
    {() => <FlightPlay reduced />}
  </Replay>
);

export const OpenRecord: Story = {
  name: "Open Record",
  ...desktop,
  render: () => <Flight />,
};
export const OpenRecordMobile: Story = {
  name: "Open Record Mobile",
  ...mobile,
  render: () => <Flight mobile />,
};
export const StaggeredList: Story = {
  name: "Staggered List",
  ...desktop,
  render: () => <Stagger />,
};
export const StaggeredListMobile: Story = {
  name: "Staggered List Mobile",
  ...mobile,
  render: () => <Stagger mobile />,
};
export const NumberCountsUp: Story = {
  name: "Number Counts Up",
  ...desktop,
  render: () => <Count />,
};
export const NumberCountsUpMobile: Story = {
  name: "Number Counts Up Mobile",
  ...mobile,
  render: () => <Count mobile />,
};
export const ReducedMotion: Story = {
  name: "Reduced Motion",
  ...desktop,
  render: () => <Reduced />,
};
export const ReducedMotionMobile: Story = {
  name: "Reduced Motion Mobile",
  ...mobile,
  render: () => <Reduced mobile />,
};
