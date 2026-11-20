import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/Text/Text.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import TextWithLogic from ".";

const meta: Meta<typeof TextWithLogic> = {
  title: "Primitives/Text",
  component: TextWithLogic,
  parameters: {
    docs: {},
  },
  args: { children: remainingText.text155 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const LeadSentence: Story = {
  args: { as: "p", variant: "hero", tone: "ink" },
};

export const Label: Story = {
  args: { variant: "label", tone: "dim", children: "EntryPoints in Code" },
};

export const FieldValue: Story = {
  args: { variant: "meta", tone: "soft", mono: true, children: "tasks/create/quick-add" },
};

export const Deadline: Story = {
  args: { variant: "meta", tone: "deadline", mono: true, nowrap: true, children: localized.text2 },
};

export const SingleLine: Story = {
  args: {
    variant: "meta",
    mono: true,
    truncate: true,
    children: "packages/core/src/reminders/quiet_hours.ts",
    style: { maxWidth: 180, display: "block" },
  },
};

export const Description: Story = {
  args: {
    as: "p",
    clamp: 2,
    tone: "dim",
    children: localized.text3,
    style: { maxWidth: 320 },
  },
};

export const TabularFigures: Story = {
  args: { variant: "display", tabular: true, mono: true, children: "77%" },
};

export const Scale: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {(
        ["hero", "display", "title", "lead", "body", "meta", "label", "caption", "micro"] as const
      ).map((variant) => (
        <TextWithLogic key={variant} as="div" variant={variant}>
          {variant} {remainingText.text156}
        </TextWithLogic>
      ))}
    </div>
  ),
};
