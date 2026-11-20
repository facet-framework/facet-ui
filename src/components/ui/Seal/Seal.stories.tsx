import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import SealWithLogic from ".";

const meta: Meta<typeof SealWithLogic> = {
  title: "FACET UI/Seal",
  component: SealWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Seven stripes, one per facet — filled or empty, plus `n/7`. The stripe does not judge, it counts.",
      },
    },
  },
  args: { record: taskflowRecord("tasks/create/quick-add") },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FromTheRecord: Story = {};

/** All seven facets filled. */
export const Complete: Story = {
  args: {
    record: undefined,
    present: {
      intent: true,
      contract: true,
      verification: true,
      observation: true,
      knowledge: true,
      lineage: true,
      anchors: true,
    },
  },
};

/** A freshly created record. */
export const Empty: Story = { args: { record: undefined, present: {} } };

/** On one line, without a count. */
export const InTheRow: Story = { args: { hideCount: true, height: 11 } };
