import type { Meta, StoryObj } from "@storybook/react-vite";
import LifecycleBadgeWithLogic from ".";

const meta: Meta<typeof LifecycleBadgeWithLogic> = {
  title: "FACET UI/LifecycleBadge",
  component: LifecycleBadgeWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "`lifecycle` plus days since `lineage.created_at`. The state appears twice: as the shape of the mark and as a word.",
      },
    },
  },
  args: { lifecycle: "active", createdAt: "2026-01-14", today: new Date("2026-07-30") },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Planned: Story = { args: { lifecycle: "planned" } };
export const Deprecated: Story = {
  args: { lifecycle: "deprecated", supersededBy: "sync/conflict/crdt-merge" },
};

/** Without `created_at` only the state is shown. */
export const WithoutDate: Story = { args: { createdAt: undefined } };
