import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import ProofMatrixWithLogic from ".";

const meta: Meta<typeof ProofMatrixWithLogic> = {
  title: "FACET UI/ProofMatrix",
  component: ProofMatrixWithLogic,
  parameters: {
    docs: {},
  },
  args: { scenarios: taskflowRecord("tasks/create/quick-add").scenarios },
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

export const FromTheRecord: Story = {};

export const OnlyGaps: Story = {
  args: { scenarios: taskflowRecord("sync/queue/offline-queue").scenarios, onlyGaps: true },
};

export const WithoutPromises: Story = { args: { scenarios: [] } };
