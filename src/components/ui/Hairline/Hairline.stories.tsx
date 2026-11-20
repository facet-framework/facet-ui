import type { Meta, StoryObj } from "@storybook/react-vite";
import HairlineWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof HairlineWithLogic> = {
  title: "Primitives/Hairline",
  component: HairlineWithLogic,
  parameters: {
    docs: {
      description: {
        component: "Hairline — the only means of separation. No boxes, no shadows.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal line between two blocks. */
export const Horizontal: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12, width: 320 }}>
      <Text variant="meta">Promises &amp; Tests</Text>
      <HairlineWithLogic {...args} />
      <Text variant="meta" tone="dim">
        77 % of the promised behaviour has a mapped test
      </Text>
    </div>
  ),
};

/** Vertical line between two columns. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", gap: 16, height: 48, alignItems: "stretch" }}>
      <Text variant="meta">Focus</Text>
      <HairlineWithLogic {...args} />
      <Text variant="meta" tone="dim">
        Kontext
      </Text>
    </div>
  ),
};

/** The stronger level separates zones, not rows. */
export const Strong: Story = { args: { strength: "line2" } };
