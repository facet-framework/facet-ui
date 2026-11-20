import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { reader } from "./data";
import { DomainPage } from "./DomainPage";
import { domainData } from "./data";

const meta: Meta = { title: "Screens/A Frame/Area" };
export default meta;
type Story = StoryObj;

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
} as const;

function Area({
  id,
  mobile,
  noDrift,
  noRecords,
  crumb = null,
}: {
  id: string;
  mobile?: boolean;
  noDrift?: boolean;
  noRecords?: boolean;
  crumb?: string | null;
}) {
  const [open, setOpen] = useState<string | null>(crumb);
  const data = domainData(id);
  const props = noRecords
    ? {
        ...data,
        features: [],
        drift: [],
        adrs: [],
        recent: [],
        links: { incoming: [], outgoing: [] },
      }
    : noDrift
      ? { ...data, drift: [], features: data.features.map((f) => ({ ...f, drift: 0 })) }
      : data;
  return (
    <Screen area="product" mobile={mobile} {...reader("leadership")}>
      <DomainPage
        {...props}
        mobile={mobile}
        crumbOpen={open}
        onToggleCrumb={(k) => setOpen((o) => (o === k ? null : k))}
      />
    </Screen>
  );
}

export const OverviewTablet: Story = {
  ...tablet,
  name: "Overview Tablet",
  render: () => <Area id="lists" />,
};
export const Overview: Story = {
  ...desktop,
  name: "Overview",
  render: () => <Area id="lists" />,
};
export const OverviewMobile: Story = {
  ...mobile,
  name: "Overview Mobile",
  render: () => <Area id="lists" mobile />,
};
export const Siblings: Story = {
  ...desktop,
  name: "Siblings",
  render: () => <Area id="workspace" crumb="workspace" />,
};
export const SiblingsMobile: Story = {
  ...mobile,
  name: "Siblings Mobile",
  render: () => <Area id="workspace" crumb="workspace" mobile />,
};
export const WithoutDrift: Story = {
  ...desktop,
  name: "Without Drift",
  render: () => <Area id="notifications" noDrift />,
};
export const WithoutDriftMobile: Story = {
  ...mobile,
  name: "Without Drift Mobile",
  render: () => <Area id="notifications" noDrift mobile />,
};
export const WithoutRecords: Story = {
  ...desktop,
  name: "Without Records",
  render: () => <Area id="delivery" noRecords />,
};
export const WithoutRecordsMobile: Story = {
  ...mobile,
  name: "Without Records Mobile",
  render: () => <Area id="delivery" noRecords mobile />,
};
