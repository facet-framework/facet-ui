import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { OverviewPage, type OverviewRole } from "./OverviewPage";
import type { OverviewModel } from "./model";
import {
  TEAM_NAMES,
  allFilled,
  allProven,
  UNMEASURED,
  emptyRegistry,
  overviewModel,
  manyDrift,
  noDrift,
  noTests,
  oneTeam,
  reader,
  statsFor,
} from "./data";

const meta: Meta = { title: "Screens/A Frame/Overview" };
export default meta;
type Story = StoryObj;

const BASE = overviewModel();

function Overview({
  who: role,
  model = BASE,
  mobile,
  loading,
}: {
  who: OverviewRole;
  model?: OverviewModel;
  mobile?: boolean;
  loading?: boolean;
}) {
  const [page, setPage] = useState(1);
  return (
    <Screen
      area="overview"
      mobile={mobile}
      {...reader(role)}
      stats={loading ? UNMEASURED : statsFor(model)}
      badges={loading || model.totals.records === 0 ? null : undefined}
    >
      <OverviewPage
        reader={role}
        model={model}
        state={loading ? "loading" : "ready"}
        mobile={mobile}
        driftPage={page}
        onDriftPage={setPage}
        teamNames={TEAM_NAMES}
      />
    </Screen>
  );
}

export const LeadershipStandard: Story = {
  ...desktop,
  name: "Leadership Standard",
  render: () => <Overview who="leadership" />,
};
export const LeadershipStandardMobile: Story = {
  ...mobile,
  name: "Leadership Standard Mobile",
  render: () => <Overview who="leadership" mobile />,
};
export const LeadershipLoading: Story = {
  ...desktop,
  name: "Leadership Loading",
  render: () => <Overview who="leadership" loading />,
};
export const LeadershipLoadingMobile: Story = {
  ...mobile,
  name: "Leadership Loading Mobile",
  render: () => <Overview who="leadership" loading mobile />,
};
export const LeadershipEmpty: Story = {
  ...desktop,
  name: "Leadership Empty",
  render: () => <Overview who="leadership" model={emptyRegistry(BASE)} />,
};
export const LeadershipEmptyMobile: Story = {
  ...mobile,
  name: "Leadership Empty Mobile",
  render: () => <Overview who="leadership" model={emptyRegistry(BASE)} mobile />,
};
export const LeadershipAllProven: Story = {
  ...desktop,
  name: "Leadership All Proven",
  render: () => <Overview who="leadership" model={allProven(BASE)} />,
};
export const LeadershipAllProvenMobile: Story = {
  ...mobile,
  name: "Leadership All Proven Mobile",
  render: () => <Overview who="leadership" model={allProven(BASE)} mobile />,
};
export const DeveloperStandard: Story = {
  ...desktop,
  name: "Developer Standard",
  render: () => <Overview who="developer" />,
};
export const DeveloperStandardMobile: Story = {
  ...mobile,
  name: "Developer Standard Mobile",
  render: () => <Overview who="developer" mobile />,
};
export const DeveloperNoDrift: Story = {
  ...desktop,
  name: "Developer No Drift",
  render: () => <Overview who="developer" model={noDrift(BASE)} />,
};
export const DeveloperNoDriftMobile: Story = {
  ...mobile,
  name: "Developer No Drift Mobile",
  render: () => <Overview who="developer" model={noDrift(BASE)} mobile />,
};
export const DeveloperWithExtensiveDrift: Story = {
  ...desktop,
  name: "Developer With Extensive Drift",
  render: () => <Overview who="developer" model={manyDrift(BASE)} />,
};
export const DeveloperWithExtensiveDriftMobile: Story = {
  ...mobile,
  name: "Developer With Extensive Drift Mobile",
  render: () => <Overview who="developer" model={manyDrift(BASE)} mobile />,
};
export const TestStandard: Story = {
  ...desktop,
  name: "Test Standard",
  render: () => <Overview who="test" />,
};
export const TestStandardMobile: Story = {
  ...mobile,
  name: "Test Standard Mobile",
  render: () => <Overview who="test" mobile />,
};
export const TestWithoutTests: Story = {
  ...desktop,
  name: "Test Without Tests",
  render: () => <Overview who="test" model={noTests(BASE)} />,
};
export const TestWithoutTestsMobile: Story = {
  ...mobile,
  name: "Test Without Tests Mobile",
  render: () => <Overview who="test" model={noTests(BASE)} mobile />,
};
export const AuthorStandard: Story = {
  ...desktop,
  name: "Author Standard",
  render: () => <Overview who="author" />,
};
export const AuthorStandardMobile: Story = {
  ...mobile,
  name: "Author Standard Mobile",
  render: () => <Overview who="author" mobile />,
};
export const AuthorAllFilled: Story = {
  ...desktop,
  name: "Author All Filled",
  render: () => <Overview who="author" model={allFilled(BASE)} />,
};
export const AuthorAllFilledMobile: Story = {
  ...mobile,
  name: "Author All Filled Mobile",
  render: () => <Overview who="author" model={allFilled(BASE)} mobile />,
};
export const OwnershipStandard: Story = {
  ...desktop,
  name: "Ownership Standard",
  render: () => <Overview who="ownership" />,
};
export const OwnershipStandardMobile: Story = {
  ...mobile,
  name: "Ownership Standard Mobile",
  render: () => <Overview who="ownership" mobile />,
};
export const OwnershipOneTeam: Story = {
  ...desktop,
  name: "Ownership One Team",
  render: () => <Overview who="ownership" model={oneTeam(BASE)} />,
};
export const OwnershipOneTeamMobile: Story = {
  ...mobile,
  name: "Ownership One Team Mobile",
  render: () => <Overview who="ownership" model={oneTeam(BASE)} mobile />,
};
export const NewHereStandard: Story = {
  ...desktop,
  name: "New Here Standard",
  render: () => <Overview who="new" />,
};
export const NewHereStandardMobile: Story = {
  ...mobile,
  name: "New Here Standard Mobile",
  render: () => <Overview who="new" mobile />,
};
export const AgentStandard: Story = {
  ...desktop,
  name: "Agent Standard",
  render: () => <Overview who="agent" />,
};
export const AgentStandardMobile: Story = {
  ...mobile,
  name: "Agent Standard Mobile",
  render: () => <Overview who="agent" mobile />,
};
