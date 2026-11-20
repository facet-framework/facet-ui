import type { Meta, StoryObj } from "@storybook/react-vite";
import LifecycleBadgeWithLogic from ".";

const meta: Meta<typeof LifecycleBadgeWithLogic> = {
  title: "FACET UI/LifecycleBadge",
  component: LifecycleBadgeWithLogic,
  parameters: {
    docs: {},
  },
  args: { lifecycle: "active", createdAt: "2026-01-14", today: new Date("2026-07-30") },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Planned: Story = { args: { lifecycle: "planned" } };
export const Superseded: Story = {
  args: { lifecycle: "deprecated", supersededBy: "sync/conflict/crdt-merge" },
};

export const WithoutDate: Story = { args: { createdAt: undefined } };
