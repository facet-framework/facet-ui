import type { Meta, StoryObj } from "@storybook/react-vite";
import KbdWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof KbdWithLogic> = {
  title: "Atoms/Kbd",
  component: KbdWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Keyboard shortcut. The whole contract: ⌘K searches, R opens the register, Esc goes back exactly one level.",
      },
    },
  },
  args: { keys: "⌘K" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {};

export const Register: Story = { args: { keys: "R" } };

export const Sequence: Story = { args: { keys: ["→", "←"] } };

/** The complete keyboard contract. */
export const Contract: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {(
        [
          ["⌘K", "Search records, promises, tests and code paths"],
          ["R", "Open register"],
          ["→", "one level deeper"],
          ["Esc", "exactly one level back"],
        ] as const
      ).map(([keys, what]) => (
        <div key={keys} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <KbdWithLogic keys={keys} />
          <Text variant="meta" tone="dim">
            {what}
          </Text>
        </div>
      ))}
    </div>
  ),
};
