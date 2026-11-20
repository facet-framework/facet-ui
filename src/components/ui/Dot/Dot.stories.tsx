import type { Meta, StoryObj } from "@storybook/react-vite";
import DotWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof DotWithLogic> = {
  title: "Atoms/Dot",
  component: DotWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "State dot. Colour alone never carries the meaning — a word or a number always stands next to it.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { label: "present" } };

/** Test mapped — a promise with a test reference. */
export const Backed: Story = {
  name: "Test mapped",
  args: { meaning: "ok", label: "Test mapped" },
};

/** Overdue — the only real warning colour. */
export const Overdue: Story = { args: { meaning: "due", label: "overdue" } };

/** Open: planned, still without a test mapping. */
export const Open: Story = { args: { meaning: "plan", hollow: true, label: "planned" } };

/** Always with a word beside it — so the state reads even without colour. */
export const WithWord: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {(
        [
          ["ok", "4 of 4 promises with a mapped test"],
          ["signal", "2 promises without a test"],
          ["due", "Check was due on 2026-07-12"],
        ] as const
      ).map(([meaning, text]) => (
        <div key={meaning} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DotWithLogic meaning={meaning} />
          <Text variant="meta" tone="dim">
            {text}
          </Text>
        </div>
      ))}
    </div>
  ),
};
