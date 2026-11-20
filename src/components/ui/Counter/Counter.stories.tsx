import type { Meta, StoryObj } from "@storybook/react-vite";
import CounterWithLogic from ".";

const meta: Meta<typeof CounterWithLogic> = {
  title: "Atoms/Counter",
  component: CounterWithLogic,
  parameters: {
    docs: {},
  },
  args: { value: 77, unit: " %" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Percentage: Story = {};

export const Metric: Story = {
  args: { value: 16, unit: "", style: { fontSize: "var(--text-hero)", fontWeight: 300 } },
};

export const WithoutIncoming: Story = { args: { value: 38, animate: false } };
