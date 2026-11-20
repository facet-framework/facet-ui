import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import TestPyramidWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof TestPyramidWithLogic> = {
  title: "FACET UI/TestPyramid",
  component: TestPyramidWithLogic,
  parameters: {
    docs: {},
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

export const BroadBase: Story = {
  args: { counts: { unit: 42, property: 6, integration: 18, e2e: 7 } },
};

export const TopHeavy: Story = {
  args: { counts: { unit: 3, property: 0, integration: 5, e2e: 19 } },
};

export const WithoutTests: Story = { args: { counts: {} } };
