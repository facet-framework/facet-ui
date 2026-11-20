import { localized } from "../../../i18n/legacy/components/ui/QuietLine/QuietLine.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import QuietLineWithLogic from ".";

const meta: Meta<typeof QuietLineWithLogic> = {
  title: "Atoms/QuietLine",
  component: QuietLineWithLogic,
  parameters: {
    docs: {},
  },
  args: { children: localized.text2 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Calm: Story = {};

export const Filled: Story = {
  args: { tone: "ok", children: localized.text3 },
};

export const ContextColumn: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
      <QuietLineWithLogic>{localized.text4}</QuietLineWithLogic>
      <QuietLineWithLogic>{localized.text5}</QuietLineWithLogic>
      <QuietLineWithLogic tone="ok">{localized.text6}</QuietLineWithLogic>
    </div>
  ),
};
