import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import SealWithLogic from ".";

const meta: Meta<typeof SealWithLogic> = {
  title: "FACET UI/Seal",
  component: SealWithLogic,
  parameters: {
    docs: {},
  },
  args: { record: taskflowRecord("tasks/create/quick-add") },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FromTheRecord: Story = {};

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

export const Empty: Story = { args: { record: undefined, present: {} } };

export const InTheRow: Story = { args: { hideCount: true, height: 11 } };
