import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import RecordSourceWithLogic from ".";

const record = taskflowRecord("tasks/create/quick-add");

const meta: Meta<typeof RecordSourceWithLogic> = {
  title: "FACET UI/RecordSource",
  component: RecordSourceWithLogic,
  parameters: {
    docs: {},
  },
  args: { raw: record.raw, path: record.path },
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

export const RawSource: Story = {};

export const WithErrorRow: Story = { args: { markLine: 6 } };

export const Empty: Story = { args: { raw: "", path: "empty.yaml" } };
