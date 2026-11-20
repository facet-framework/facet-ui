import type { Meta, StoryObj } from "@storybook/react-vite";
import RoleGateWithLogic from ".";

const meta: Meta<typeof RoleGateWithLogic> = {
  title: "Mechanisms/RoleGate",
  component: RoleGateWithLogic,
  parameters: {
    docs: {},
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

export const Gate: Story = {};

export const WithAlternativeFallback: Story = { args: { fallback: "eng" } };
