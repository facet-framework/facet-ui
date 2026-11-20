import type { Meta, StoryObj } from "@storybook/react-vite";
import CoverageRingWithLogic from ".";

const meta: Meta<typeof CoverageRingWithLogic> = {
  title: "Atoms/CoverageRing",
  component: CoverageRingWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Test coverage as a ring. The percentage sits in the middle — the picture alone says nothing.",
      },
    },
  },
  args: { value: 31, total: 38 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Partial: Story = {};

/** Fully assigned — the ring turns green. */
export const Complete: Story = { args: { value: 38, total: 38 } };

/** No test assignment. */
export const Empty: Story = { args: { value: 0, total: 38 } };

/** Without promises there is no share — the ring says "—" instead of 0 %. */
export const WithoutPromises: Story = { args: { value: 0, total: 0 } };

/** Compact in the context column. */
export const Compact: Story = { args: { size: 56, strokeWidth: 5 } };
