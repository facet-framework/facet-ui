import type { Meta, StoryObj } from "@storybook/react-vite";
import TrailWithLogic from ".";

const meta: Meta<typeof TrailWithLogic> = {
  title: "FACET UI/Trail",
  component: TrailWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 10 · trail: a visible way back at the foot. Every level is clickable, Esc goes back exactly one level.",
      },
    },
  },
  args: {
    steps: [
      { key: "overview", label: "Overview", onSelect: () => {} },
      { key: "register", label: "Register · Records", onSelect: () => {} },
      { key: "record", label: "Quick add" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLevels: Story = {};

/** Only the stage — the trail stays visible anyway. */
export const OneLevel: Story = { args: { steps: [{ key: "overview", label: "Overview" }] } };

/** All the way into the raw source. */
export const DownToTheRawSource: Story = {
  args: {
    steps: [
      { key: "overview", label: "Overview", onSelect: () => {} },
      { key: "record", label: "Quick add", onSelect: () => {} },
      { key: "evidence", label: "Evidence", onSelect: () => {} },
      { key: "source", label: "Raw source" },
    ],
  },
};
