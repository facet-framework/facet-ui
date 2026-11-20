import { localized } from "../../../i18n/legacy/components/ui/GherkinStatement/GherkinStatement.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import GherkinStatementWithLogic from ".";

const meta: Meta<typeof GherkinStatementWithLogic> = {
  title: "FACET UI/GherkinStatement",
  component: GherkinStatementWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    statement: [localized.text2, localized.text3, localized.text4, localized.text5].join("\n"),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Promise: Story = {};

export const Compact: Story = { args: { compact: true } };

export const WithException: Story = {
  args: {
    statement: [localized.text6, localized.text7, localized.text8, localized.text9].join("\n"),
  },
};

export const FromTheRecord: Story = {
  args: { steps: taskflowRecord("tasks/create/quick-add").scenarios[0].steps },
};
