import type { Meta, StoryObj } from "@storybook/react-vite";
import MarkdownWithLogic from ".";

const meta: Meta<typeof MarkdownWithLogic> = {
  title: "Primitives/Markdown",
  component: MarkdownWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "A small Markdown reader for answers from a model. It handles paragraphs, headings, lists, quotes, horizontal rules, code blocks and the four inline markups — and deliberately no tables, no nested lists, no HTML. Whatever it does not know stays as text.",
      },
    },
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

/** An answer as it comes from the companion. */
export const Answer: Story = {
  args: {
    text: [
      "## What is open for `billing/invoice/list`",
      "",
      "Three things, by urgency:",
      "",
      "1. **Two promises without a test** — `empty-list-shown` and `paging-keeps-order`.",
      "2. No entry point in code since the rework in `apps/web`.",
      "3. The assumption *discount-codes-do-not-stack* has gone unchecked for 14 months.",
      "",
      "> Deadlines first: they are the only items with a date that has already passed.",
      "",
      "```yaml",
      "contract:",
      "  scenarios:",
      "    - id: empty-list-shown",
      "      backing:",
      "        state: unbacked",
      "```",
      "",
      "More in [the spec](https://example.org/facet#backing).",
    ].join("\n"),
  },
};

/** A link that must not be visited becomes text with its address. */
export const UnsafeLink: Story = {
  args: { text: "Have a look at [this](data:text/html,boom)." },
};

/** Nothing to show. */
export const Empty: Story = { args: { text: "" } };
