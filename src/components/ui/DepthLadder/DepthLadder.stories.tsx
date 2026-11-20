import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import DepthLadderWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof DepthLadderWithLogic> = {
  title: "FACET UI/DepthLadder",
  component: DepthLadderWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 3 · Depth ladder: answer → evidence → raw source. Three levels instead of six tabs — one direction, one key.",
      },
    },
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

/** With real depth control — the arrow keys work. */
export const Interactive: Story = {
  render: () => {
    const [depth, setDepth] = useState(1);
    const content = [
      "Creates a task from a single input line.",
      "4 of 4 promises with a mapped test",
      "id: tasks/create/quick-add",
    ];
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
