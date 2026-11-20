import { localized } from "../../../i18n/legacy/components/ui/Skeleton/Skeleton.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import SkeletonWithLogic from ".";

const meta: Meta<typeof SkeletonWithLogic> = {
  title: "Atoms/Skeleton",
  component: SkeletonWithLogic,
  parameters: {
    docs: {},
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

export const Row: Story = { args: { label: localized.text2 } };

export const LeadSentence: Story = { args: { height: 34, label: localized.text3 } };

export const FocusList: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 14 }}>
      {[100, 82, 91, 74].map((width, index) => (
        <div key={index} style={{ display: "grid", gap: 6 }}>
          <SkeletonWithLogic height={15} width={`${width}%`} label={localized.text4} />
          <SkeletonWithLogic height={11} width={`${width - 30}%`} label={localized.text5} />
        </div>
      ))}
    </div>
  ),
};
