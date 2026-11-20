import { localized } from "../../../i18n/legacy/components/ui/StatValue/StatValue.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import StatValueWithLogic from ".";
import Counter from "../Counter";

const meta: Meta<typeof StatValueWithLogic> = {
  title: "Atoms/StatValue",
  component: StatValueWithLogic,
  parameters: {
    docs: {},
  },
  args: { label: "Test zugeordnet", value: "31/38", hint: localized.text2 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Deadline: Story = {
  args: {
    label: localized.text3,
    value: "2",
    hint: localized.text4,
    meaning: "deadline",
  },
};

export const Filled: Story = {
  args: { label: localized.text5, value: "6", hint: localized.text6, meaning: "ok" },
};

export const Stage: Story = {
  args: {
    size: "stage",
    label: "Open",
    value: <Counter value={16} />,
    hint: "Punkte brauchen dich",
    meaning: "signal",
  },
};

export const Compact: Story = {
  args: { size: "compact", label: "teams", value: "4", hint: "tragen records" },
};
