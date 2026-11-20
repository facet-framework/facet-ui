import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowModel } from "../../../core/fixtures";
import RecordPickerWithLogic from ".";
import Kbd from "../Kbd";

const model = taskflowModel();

const items = [
  ...model.recs.map((record) => ({
    id: record.id,
    label: record.label,
    kind: "Record",
    hint: record.id,
    terms: [record.team],
  })),
  ...model.allScn.map((scenario) => ({
    id: scenario.rec.id,
    label: scenario.id,
    kind: "Promise",
    hint: scenario.rec.id,
  })),
  ...model.anchorPairs.map((anchor) => ({
    id: anchor.id,
    label: anchor.path,
    kind: "Codepfad",
    hint: `:${anchor.line} · ${anchor.role}`,
  })),
];

const meta: Meta<typeof RecordPickerWithLogic> = {
  title: "FACET UI/RecordPicker",
  component: RecordPickerWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "⌘K: one line for everything — records, promises, tests, code paths. ↑/↓ select, Enter opens.",
      },
    },
  },
  args: { items },
  decorators: [
    (Story) => (
      <div style={{ width: 520, border: "1px solid var(--line)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {};

/** With a footer for the keyboard contract. */
export const WithKeyHint: Story = {
  args: {
    footer: (
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 12px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <Kbd keys={["↑", "↓"]} />
        <Kbd keys="Enter" />
        <Kbd keys="Esc" />
      </div>
    ),
  },
};

/** Nothing found — the sentence names everywhere that was searched. */
export const WithoutMatches: Story = { args: { items: [] } };
