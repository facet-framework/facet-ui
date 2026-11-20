import type { Meta, StoryObj } from "@storybook/react-vite";
import StackWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof StackWithLogic> = {
  title: "Primitives/Stack",
  component: StackWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Layout primitive for tracks. `minWidth: 0` is set so long paths truncate instead of widening the grid.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const items = ["Records", "Promises & Tests", "Operations", "Policies"];

/** Vertical track — the register index. */
export const Vertical: Story = {
  args: {
    gap: "s2",
    children: items.map((label) => (
      <Text key={label} variant="meta">
        {label}
      </Text>
    )),
  },
};

/** Horizontal track with a gap from the grid. */
export const Horizontal: Story = {
  args: {
    direction: "row",
    gap: "s4",
    align: "baseline",
    children: items.map((label) => (
      <Text key={label} variant="meta" tone="dim" nowrap>
        {label}
      </Text>
    )),
  },
};

/** Wrapping track for rows of chips. */
export const Wrapping: Story = {
  args: {
    direction: "row",
    gap: 8,
    wrap: true,
    style: { maxWidth: 260 },
    children: Array.from({ length: 9 }, (_, i) => (
      <Text key={i} variant="caption" tone="dim" mono>
        FIELD-{i + 1}
      </Text>
    )),
  },
};
