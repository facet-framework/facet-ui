import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import RecordSourceWithLogic from ".";

const record = taskflowRecord("tasks/create/quick-add");

const meta: Meta<typeof RecordSourceWithLogic> = {
  title: "FACET UI/RecordSource",
  component: RecordSourceWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Third level of the depth ladder: the file itself. No reconstruction — whoever goes this far wants to see the raw source.",
      },
    },
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

/** With a highlighted line — this is how a YAML error points to its location. */
export const WithErrorLine: Story = { args: { markLine: 6 } };

/** An empty file stays one line. */
export const Empty: Story = { args: { raw: "", path: "empty.yaml" } };
