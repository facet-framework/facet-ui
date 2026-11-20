import type { Meta, StoryObj } from "@storybook/react-vite";
import FieldRowWithLogic from ".";

const meta: Meta<typeof FieldRowWithLogic> = {
  title: "Atoms/FieldRow",
  component: FieldRowWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "One field, one row. The factual label on the left, the value from the item on the right.",
      },
    },
  },
  args: { label: "Cadence", value: "quarterly" },
  decorators: [
    (Story) => (
      <dl style={{ margin: 0, width: 420 }}>
        <Story />
      </dl>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Field: Story = {};

/** The field that is currently missing — emphasised, not red. */
export const Emphasised: Story = {
  args: {
    label: "Guide",
    value: "missing — when this alert fires there is no described way forward",
    emphasis: true,
  },
};

/** Multi-line values keep their line breaks. */
export const MultiLine: Story = {
  args: {
    label: "Used by",
    value: "tasks/create/quick-add\nsync/queue/offline-queue\nlists/core/list-store",
    preserveLines: true,
  },
};

/** A detail view consists of rows like these. */
export const Block: Story = {
  render: () => (
    <dl style={{ margin: 0, width: 420 }}>
      <FieldRowWithLogic label="Check" value="quiet-hours-audit" />
      <FieldRowWithLogic label="Cadence" value="quarterly" />
      <FieldRowWithLogic label="Last" value="2026-04-12" />
      <FieldRowWithLogic label="Evidence" value="docs/audits/2026-Q1.pdf" />
    </dl>
  ),
};
