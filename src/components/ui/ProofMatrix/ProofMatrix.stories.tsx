import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import ProofMatrixWithLogic from ".";

const meta: Meta<typeof ProofMatrixWithLogic> = {
  title: "FACET UI/ProofMatrix",
  component: ProofMatrixWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Promise × test type from `test_ref.proves[]`. The answer line sits above the matrix — the picture alone says nothing.",
      },
    },
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

/** Only the gaps — the question quality assurance arrives with. */
export const OnlyGaps: Story = {
  args: { scenarios: taskflowRecord("sync/queue/offline-queue").scenarios, onlyGaps: true },
};

/** A record without promises says so instead of showing an empty matrix. */
export const WithoutPromises: Story = { args: { scenarios: [] } };
