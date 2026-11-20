import type { Meta, StoryObj } from "@storybook/react-vite";
import ButtonWithLogic from ".";

const meta: Meta<typeof ButtonWithLogic> = {
  title: "Atoms/Button",
  component: ButtonWithLogic,
  parameters: {
    docs: {
      description: {
        component: "Button without rounding and without shadow. Hit area at least 32 px.",
      },
    },
  },
  args: { children: "Open in register" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Accompanying: Story = {};

/** Leads on — at most one signal button per view. */
export const Signal: Story = { args: { variant: "signal", children: "Open detail" } };

/** Text only, for side paths. */
export const Ghost: Story = { args: { variant: "ghost", children: "all 16 →" } };

export const Disabled: Story = { args: { disabled: true, children: "no target configured" } };

export const FullWidth: Story = { args: { block: true, variant: "signal" } };
