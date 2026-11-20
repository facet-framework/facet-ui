import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import ClauseSheetWithLogic from ".";

const meta: Meta<typeof ClauseSheetWithLogic> = {
  title: "FACET UI/ClauseSheet",
  component: ClauseSheetWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Clauses of a policy with their bindingness and metric. If the metric is missing, the clause cannot be checked — and that is what it says there.",
      },
    },
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

export const Policy: Story = {};

export const OnlyBinding: Story = { args: { onlyBinding: true } };

export const Empty: Story = { args: { clauses: [] } };
