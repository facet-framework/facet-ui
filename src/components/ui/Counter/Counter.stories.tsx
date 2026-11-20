import type { Meta, StoryObj } from "@storybook/react-vite";
import CounterWithLogic from ".";

const meta: Meta<typeof CounterWithLogic> = {
  title: "Atoms/Counter",
  component: CounterWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 8 · Number landing: values count in once when they appear. After that they jump instead of feigning freshness. `prefers-reduced-motion` switches the motion off.",
      },
    },
  },
  args: { value: 77, unit: " %" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Percentage: Story = {};

/** Large key figure on the stage. */
export const Metric: Story = {
  args: { value: 16, unit: "", style: { fontSize: "var(--text-hero)", fontWeight: 300 } },
};

/** Without the count-in — for values that change constantly while filtering. */
export const WithoutCountUp: Story = { args: { value: 38, animate: false } };
