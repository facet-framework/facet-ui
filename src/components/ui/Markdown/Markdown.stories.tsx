import { localized } from "../../../i18n/legacy/components/ui/Markdown/Markdown.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import MarkdownWithLogic from ".";

const meta: Meta<typeof MarkdownWithLogic> = {
  title: "Primitives/Markdown",
  component: MarkdownWithLogic,
  parameters: {
    docs: {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Answer: Story = {
  args: {
    text: [
      localized.text2,
      "",
      "Three Dinge, by Dringlichkeit:",
      "",
      localized.text3,
      localized.text4,
      localized.text5,
      "",
      localized.text6,
      "",
      "```yaml",
      "contract:",
      "  scenarios:",
      "    - id: empty-list-shown",
      "      backing:",
      "        state: unbacked",
      "```",
      "",
      localized.text7,
    ].join("\n"),
  },
};

export const UnsafeReference: Story = {
  args: { text: localized.text8 },
};

export const Empty: Story = { args: { text: "" } };
