import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import ClauseSheetWithLogic from ".";

const meta: Meta<typeof ClauseSheetWithLogic> = {
  title: "FACET UI/ClauseSheet",
  component: ClauseSheetWithLogic,
  parameters: {
    docs: {},
  },
  args: { clauses: taskflowRecord("policy/notifications/quiet-hours").clauses },
  decorators: [
    (Story) => (
      <div style={{ width: 540 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Rules: Story = {};

export const OnlyRequired: Story = { args: { onlyBinding: true } };

export const Empty: Story = { args: { clauses: [] } };
