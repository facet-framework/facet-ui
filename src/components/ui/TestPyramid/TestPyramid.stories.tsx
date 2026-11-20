import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import TestPyramidWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof TestPyramidWithLogic> = {
  title: "FACET UI/TestPyramid",
  component: TestPyramidWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Distribution of the tests across the levels. The statement is in the answer line — the picture alone claims nothing.",
      },
    },
  },
  args: { counts: model.testKinds },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FromTheCorpus: Story = {};

/** Healthy shape: broad at the bottom. */
export const BroadBase: Story = {
  args: { counts: { unit: 42, property: 6, integration: 18, e2e: 7 } },
};

/** Top-heavy — the answer line says so. */
export const TopHeavy: Story = {
  args: { counts: { unit: 3, property: 0, integration: 5, e2e: 19 } },
};

export const WithoutTests: Story = { args: { counts: {} } };
