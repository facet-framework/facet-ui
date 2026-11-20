import { localized } from "../../../i18n/legacy/components/ui/Dot/Dot.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import DotWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof DotWithLogic> = {
  title: "Atoms/Dot",
  component: DotWithLogic,
  parameters: {
    docs: {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { label: "present" } };

export const Filled: Story = {
  name: "Filled",
  args: { meaning: "ok", label: "Test zugeordnet" },
};

export const Overdue: Story = { args: { meaning: "deadline", label: localized.text2 } };

export const Open: Story = { args: { meaning: "plan", hollow: true, label: "planned" } };

export const WithWord: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8 }}>
      {(
        [
          ["ok", localized.text3],
          ["signal", localized.text4],
          ["deadline", localized.text5],
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
