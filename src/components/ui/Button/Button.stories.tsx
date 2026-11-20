import { localized } from "../../../i18n/legacy/components/ui/Button/Button.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ButtonWithLogic from ".";

const meta: Meta<typeof ButtonWithLogic> = {
  title: "Atoms/Button",
  component: ButtonWithLogic,
  parameters: {
    docs: {},
  },
  args: { children: localized.text2 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Supporting: Story = {};

export const Signal: Story = { args: { variant: "signal", children: localized.text3 } };

export const Ghost: Story = { args: { variant: "ghost", children: "all 16 →" } };

export const Disabled: Story = { args: { disabled: true, children: localized.text4 } };

export const FullWidth: Story = { args: { block: true, variant: "signal" } };
