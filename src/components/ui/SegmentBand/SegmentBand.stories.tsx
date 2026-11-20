import type { Meta, StoryObj } from "@storybook/react-vite";
import SegmentBandWithLogic from ".";
import { color } from "../../../design-system/tokens";

const meta: Meta<typeof SegmentBandWithLogic> = {
  title: "Atoms/SegmentBand",
  component: SegmentBandWithLogic,
  parameters: {
    docs: {
      description: {
        component: "Distribution of a set in one row — lifecycle, test types, severities.",
      },
    },
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

/** Status across all items. */
export const Lifecycle: Story = {
  args: {
    segments: [
      { key: "active", label: "active", value: 11, color: color.ink },
      { key: "planned", label: "planned", value: 4, color: color.plan },
      { key: "deprecated", label: "deprecated", value: 2, color: color.line2 },
    ],
  },
};

/** Test kinds in the corpus. */
export const TestKinds: Story = {
  args: {
    height: 6,
    segments: [
      { key: "unit", label: "Unit", value: 42, color: color.signal },
      { key: "integration", label: "Integration", value: 18, color: color.signalMid },
      { key: "e2e", label: "End-to-end", value: 7, color: color.line2 },
    ],
  },
};

/** Empty set — the band stays a quiet line. */
export const Empty: Story = {
  args: { segments: [{ key: "active", label: "active", value: 0, color: color.ink }] },
};
