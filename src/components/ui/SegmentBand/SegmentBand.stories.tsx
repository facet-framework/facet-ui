import type { Meta, StoryObj } from "@storybook/react-vite";
import SegmentBandWithLogic from ".";
import { color } from "../../../design-system/tokens";

const meta: Meta<typeof SegmentBandWithLogic> = {
  title: "Atoms/SegmentBand",
  component: SegmentBandWithLogic,
  parameters: {
    docs: {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Lifecycle: Story = {
  args: {
    segments: [
      { key: "active", label: "active", value: 11, color: color.ink },
      { key: "planned", label: "planned", value: 4, color: color.plan },
      { key: "deprecated", label: "superseded", value: 2, color: color.line2 },
    ],
  },
};

export const TestKinds: Story = {
  args: {
    height: 6,
    segments: [
      { key: "unit", label: "Module", value: 42, color: color.signal },
      { key: "integration", label: "Integration", value: 18, color: color.signalMid },
      { key: "e2e", label: "end.to.End", value: 7, color: color.line2 },
    ],
  },
};

export const Empty: Story = {
  args: { segments: [{ key: "active", label: "active", value: 0, color: color.ink }] },
};
