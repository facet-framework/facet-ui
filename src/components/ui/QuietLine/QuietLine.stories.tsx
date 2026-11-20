import type { Meta, StoryObj } from "@storybook/react-vite";
import QuietLineWithLogic from ".";

const meta: Meta<typeof QuietLineWithLogic> = {
  title: "Atoms/QuietLine",
  component: QuietLineWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 4 · threshold display: as long as a value is below its limit, the metric does not exist — a sentence stands there instead.",
      },
    },
  },
  args: { children: "No check is overdue." },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Calm: Story = {};

/** When calm is a good result. */
export const Backed: Story = {
  args: { tone: "ok", children: "Every record has a team." },
};

/** Several quiet lines below each other — the context column in the normal case. */
export const ContextColumn: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
      <QuietLineWithLogic>No check is overdue.</QuietLineWithLogic>
      <QuietLineWithLogic>No personal-data field without retention.</QuietLineWithLogic>
      <QuietLineWithLogic tone="ok">
        All active records have an entry point in code.
      </QuietLineWithLogic>
    </div>
  ),
};
