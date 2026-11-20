import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import SignalStackWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof SignalStackWithLogic> = {
  title: "FACET UI/SignalStack",
  component: SignalStackWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "SLOs and alerts in one stack. Alerts without a runbook come first — they are the open item of this compartment.",
      },
    },
  },
  args: { slos: model.slos, alerts: model.alerts },
  decorators: [
    (Story) => (
      <div style={{ width: 580 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Operations: Story = {};

export const OnlyGaps: Story = { args: { onlyGaps: true } };

export const NothingMeasured: Story = { args: { slos: [], alerts: [] } };
