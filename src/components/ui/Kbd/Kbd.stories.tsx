import { localized } from "../../../i18n/legacy/components/ui/Kbd/Kbd.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import KbdWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof KbdWithLogic> = {
  title: "Atoms/Kbd",
  component: KbdWithLogic,
  parameters: {
    docs: {},
  },
  args: { keys: "⌘K" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {};

export const Register: Story = { args: { keys: "R" } };

export const Sequence: Story = { args: { keys: ["→", "←"] } };

export const Contract: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {(
        [
          ["⌘K", localized.text2],
          ["R", localized.text3],
          ["→", localized.text4],
          ["Esc", localized.text5],
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
