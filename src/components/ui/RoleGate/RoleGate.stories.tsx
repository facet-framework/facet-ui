import type { Meta, StoryObj } from "@storybook/react-vite";
import RoleGateWithLogic from ".";

const meta: Meta<typeof RoleGateWithLogic> = {
  title: "Mechanics/RoleGate",
  component: RoleGateWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "“What are you here for?” — the gate between reading and the Overview. The choice decides which lead sentence the Overview opens with; it hides nothing and unlocks nothing.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 620, display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** How it looks on first opening. */
export const Gate: Story = {};

/** Otherwise continuing without a choice lands on management. */
export const WithOtherFallback: Story = { args: { fallback: "eng" } };
