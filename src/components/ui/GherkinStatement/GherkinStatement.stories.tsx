import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import GherkinStatementWithLogic from ".";

const meta: Meta<typeof GherkinStatementWithLogic> = {
  title: "FACET UI/GherkinStatement",
  component: GherkinStatementWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "`contract.scenarios[].statement` as Gherkin: keyword, German role, coloured rail and token highlighting. And and But inherit the colour of their step.",
      },
    },
  },
  args: {
    statement: [
      'Given a list "Groceries" exists',
      'When the user enters "Buy milk tomorrow 9:00 #groceries"',
      "Then the task is created with a due date and a list",
      "And it appears at the top of the list immediately",
    ].join("\n"),
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

/** Compact, for lists and preview rows. */
export const Compact: Story = { args: { compact: true } };

/** With `But` — the only place where red appears outside of deadlines. */
export const WithException: Story = {
  args: {
    statement: [
      "Given the queue contains 3 changes",
      "When the connection returns",
      "Then all changes are transferred",
      "But one change with conflict_state stays in quarantine",
    ].join("\n"),
  },
};

/** Straight from the demo corpus. */
export const FromTheRecord: Story = {
  args: { steps: taskflowRecord("tasks/create/quick-add").scenarios[0].steps },
};
