import type { Meta, StoryObj } from "@storybook/react-vite";
import CoverageRingWithLogic from ".";

const meta: Meta<typeof CoverageRingWithLogic> = {
  title: "Atoms/CoverageRing",
  component: CoverageRingWithLogic,
  parameters: {
    docs: {},
  },
  args: { value: 31, total: 38 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Partial: Story = {};

export const Complete: Story = { args: { value: 38, total: 38 } };

export const Empty: Story = { args: { value: 0, total: 38 } };

export const WithoutPromises: Story = { args: { value: 0, total: 0 } };

export const Compact: Story = { args: { size: 56, strokeWidth: 5 } };
