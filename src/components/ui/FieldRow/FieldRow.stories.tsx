import { localized } from "../../../i18n/legacy/components/ui/FieldRow/FieldRow.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FieldRowWithLogic from ".";

const meta: Meta<typeof FieldRowWithLogic> = {
  title: "Atoms/FieldRow",
  component: FieldRowWithLogic,
  parameters: {
    docs: {},
  },
  args: { label: "Rhythm", value: "quarterly" },
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

export const Emphasized: Story = {
  args: {
    label: "Guide",
    value: localized.text2,
    emphasis: true,
  },
};

export const MultiLine: Story = {
  args: {
    label: "Used by",
    value: "tasks/create/quick-add\nsync/queue/offline-queue\nlists/core/list-store",
    preserveLines: true,
  },
};

export const Block: Story = {
  render: () => (
    <dl style={{ margin: 0, width: 420 }}>
      <FieldRowWithLogic label={localized.text3} value="quiet-hours-audit" />
      <FieldRowWithLogic label="Rhythm" value="quarterly" />
      <FieldRowWithLogic label="Recent" value="2026-04-12" />
      <FieldRowWithLogic label="Evidence" value="docs/audits/2026-Q1.pdf" />
    </dl>
  ),
};
