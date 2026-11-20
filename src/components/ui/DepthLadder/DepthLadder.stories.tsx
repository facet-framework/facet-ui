import { localized } from "../../../i18n/legacy/components/ui/DepthLadder/DepthLadder.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import DepthLadderWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof DepthLadderWithLogic> = {
  title: "FACET UI/DepthLadder",
  component: DepthLadderWithLogic,
  parameters: {
    docs: {},
  },
  args: { depth: 1 },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Answer: Story = {};
export const Evidence: Story = { args: { depth: 2 } };
export const RawSource: Story = { args: { depth: 3 } };

export const Walkable: Story = {
  render: () => {
    const [depth, setDepth] = useState(1);
    const content = [localized.text2, localized.text3, "id: tasks/create/quick-add"];
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <DepthLadderWithLogic depth={depth} onDepthChange={setDepth} />
        <Text variant="body" mono={depth === 3} tone={depth === 3 ? "soft" : "ink"}>
          {content[depth - 1]}
        </Text>
      </div>
    );
  },
};
