import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import FieldSheetWithLogic from ".";

const meta: Meta<typeof FieldSheetWithLogic> = {
  title: "FACET UI/FieldSheet",
  component: FieldSheetWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Fields of a data object with sensitivity and retention. Personal data without a retention period is an open point, not an empty field.",
      },
    },
  },
  args: { fields: taskflowRecord("data/tasks/task-item").fields },
  decorators: [
    (Story) => (
      <div style={{ width: 620 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DataObject: Story = {};

export const OnlyPersonalData: Story = { args: { onlyPii: true } };

export const WithoutFields: Story = { args: { fields: [] } };
