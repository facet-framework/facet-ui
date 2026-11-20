import type { Meta, StoryObj } from "@storybook/react-vite";
import TextWithLogic from ".";

const meta: Meta<typeof TextWithLogic> = {
  title: "Primitives/Text",
  component: TextWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Text primitive of the design system. At most five levels per view; mono is reserved for field values, IDs, paths and numbers.",
      },
    },
  },
  args: { children: "This software has 10 features in 6 areas." },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Body text, the default case. */
export const Body: Story = {};

/** The lead sentence on the stage — lightest weight, largest area. */
export const LeadSentence: Story = {
  args: { as: "p", variant: "hero", tone: "ink" },
};

/** Subject label above a block. Capitals, letter-spaced, never longer than three words. */
export const FactualLabel: Story = {
  args: { variant: "label", tone: "dim", children: "Entry points in code" },
};

/** Field values are set in mono — here a record id. */
export const FieldValue: Story = {
  args: { variant: "meta", tone: "soft", mono: true, children: "tasks/create/quick-add" },
};

/** An overdue deadline is the only case in which red carries. */
export const Deadline: Story = {
  args: { variant: "meta", tone: "due", mono: true, nowrap: true, children: "due 2026-07-12" },
};

/** Paths and dates never wrap — they truncate with an ellipsis. */
export const SingleLine: Story = {
  args: {
    variant: "meta",
    mono: true,
    truncate: true,
    children: "packages/core/src/reminders/quiet_hours.ts",
    style: { maxWidth: 180, display: "block" },
  },
};

/** Descriptions are limited to two lines. */
export const Description: Story = {
  args: {
    as: "p",
    clamp: 2,
    tone: "dim",
    children:
      "Creates a task from a single input line. Recognises due date, list and priority while typing and works offline with a local queue.",
    style: { maxWidth: 320 },
  },
};

/** Columns of numbers get tabular figures. */
export const TabularFigures: Story = {
  args: { variant: "display", tabular: true, mono: true, children: "77 %" },
};

/** All steps of the scale one below the other. */
export const Scale: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {(
        ["hero", "display", "title", "lead", "body", "meta", "label", "caption", "micro"] as const
      ).map((variant) => (
        <TextWithLogic key={variant} as="div" variant={variant}>
          {variant} · This software has 10 features
        </TextWithLogic>
      ))}
    </div>
  ),
};
