import type { Meta, StoryObj } from "@storybook/react-vite";
import { COMPANION_INTRO } from "../../../core";
import CompanionWithLogic, { type CompanionEntry } from ".";

const meta: Meta<typeof CompanionWithLogic> = {
  title: "Mechanics/Companion",
  component: CompanionWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "The advisor column. It answers questions from the corpus it has read and names, for every answer, what it read — information about a repository is only worth as much as the statement of where it comes from.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: 640, display: "flex", justifyContent: "flex-end" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  scope: "sees: 42 records · apps, packages · 84,200 lines\nrole QUALITY",
  intro: COMPANION_INTRO,
  foot: "Sample data · answers and actions are predefined in this story",
  draft: "",
  busy: false,
  onDraft: () => {},
  onSend: () => {},
  onClear: () => {},
  onClose: () => {},
  onAsk: () => {},
  onOpenRecord: () => {},
  onOpenSection: () => {},
};

const suggestions = [
  { key: "1", text: "Where should I start?", onAsk: () => {} },
  { key: "2", text: "What is overdue?", onAsk: () => {} },
  { key: "3", text: "What is the test coverage?", onAsk: () => {} },
];

const conversation: CompanionEntry[] = [
  { kind: "ask", id: "1", text: "What is the test coverage?" },
  {
    kind: "answer",
    id: "2",
    plan: {
      text: "68 % of the promised behaviour has a mapped test — 31 of 46 promises.\n\nWeakest area: multiplayer at 16 %. In code, 12 400 of 84 200 lines are in tests; line coverage is not connected.",
      facts: [
        { label: "TEST MAPPED", value: "31/46", meaning: "neutral" },
        { label: "WITHOUT TEST", value: "15", meaning: "signal" },
        { label: "UNIT", value: "22", meaning: "neutral" },
      ],
      reads: [],
      sources: [
        {
          text: "docs/facets/features/billing/invoice/list.yaml",
          recordId: "billing/invoice/list",
        },
        {
          text: "docs/facets/features/auth/session/refresh.yaml",
          recordId: "auth/session/refresh",
        },
      ],
      openId: null,
      section: "promises",
      follow: ["Which promises have no test?", "Where are end-to-end tests missing?"],
    },
  },
];

/** Nothing asked yet: opening sentence and suggestions. */
export const Start: Story = { args: { ...base, entries: [], suggestions } };

/** One question, one answer with key figures, sources and follow-up questions. */
export const WithAnswer: Story = { args: { ...base, entries: conversation, suggestions: [] } };

/** While reading, every file stands on its own line. */
export const Reading: Story = {
  args: {
    ...base,
    entries: [conversation[0]],
    suggestions: [],
    busy: true,
    reads: ["docs/facets/features/billing/invoice/list.yaml", "apps/web/src/billing/list.tsx"],
  },
};
