import type { Meta, StoryObj } from "@storybook/react-vite";
import StatValueWithLogic from ".";
import Counter from "../Counter";

const meta: Meta<typeof StatValueWithLogic> = {
  title: "Atoms/StatValue",
  component: StatValueWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "A metric with a factual label and a classification. Without a reference total a number is decoration — that is why the classification sits below it.",
      },
    },
  },
  args: { label: "Test mapped", value: "31/38", hint: "Promises with a test" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

/** Overdue — the only case for red. */
export const Deadline: Story = {
  args: {
    label: "Overdue",
    value: "2",
    hint: "Checks with an expired deadline",
    meaning: "due",
  },
};

/** Backed. */
export const Backed: Story = {
  args: { label: "Complete", value: "6", hint: "Records without an open point", meaning: "ok" },
};

/** On stage, with the number landing. */
export const Stage: Story = {
  args: {
    size: "stage",
    label: "Open",
    value: <Counter value={16} />,
    hint: "points need you",
    meaning: "signal",
  },
};

/** Compact for the context column. */
export const Compact: Story = {
  args: { size: "compact", label: "Teams", value: "4", hint: "carry records" },
};
