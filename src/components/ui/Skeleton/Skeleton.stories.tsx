import type { Meta, StoryObj } from "@storybook/react-vite";
import SkeletonWithLogic from ".";

const meta: Meta<typeof SkeletonWithLogic> = {
  title: "Atoms/Skeleton",
  component: SkeletonWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Loading placeholder in the final geometry — no spinner, no progress bar. Nothing shifts after loading.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = { args: { label: "Reading records" } };

export const LeadSentence: Story = { args: { height: 34, label: "Overview is being computed" } };

/** The silhouette of a focus list. */
export const FocusList: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 14 }}>
      {[100, 82, 91, 74].map((width, index) => (
        <div key={index} style={{ display: "grid", gap: 6 }}>
          <SkeletonWithLogic height={15} width={`${width}%`} label="Row is loading" />
          <SkeletonWithLogic height={11} width={`${width - 30}%`} label="Reason is loading" />
        </div>
      ))}
    </div>
  ),
};
