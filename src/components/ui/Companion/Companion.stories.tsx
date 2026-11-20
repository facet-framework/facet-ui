import { localized } from "../../../i18n/legacy/components/ui/Companion/Companion.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { COMPANION_INTRO } from "../../../core";
import CompanionWithLogic, { type CompanionEntry } from ".";

const meta: Meta<typeof CompanionWithLogic> = {
  title: "Mechanisms/Companion",
  component: CompanionWithLogic,
  parameters: {
    docs: {},
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
  scope: localized.text2,
  intro: COMPANION_INTRO,
  foot: localized.text3,
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
  { key: "1", text: "Womit sollte ich begin?", onAsk: () => {} },
  { key: "2", text: localized.text4, onAsk: () => {} },
  { key: "3", text: localized.text5, onAsk: () => {} },
];

const conversation: CompanionEntry[] = [
  { kind: "ask", id: "1", text: localized.text6 },
  {
    kind: "answer",
    id: "2",
    plan: {
      text: localized.text7,
      facts: [
        { label: "TEST ZUGEORDNET", value: "31/46", meaning: "neutral" },
        { label: localized.text8, value: "15", meaning: "signal" },
        { label: "MODULE", value: "22", meaning: "neutral" },
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
      follow: [localized.text9, "end tests missing?.to.Where are end"],
    },
  },
];

export const Start: Story = { args: { ...base, entries: [], suggestions } };

export const WithAnswer: Story = { args: { ...base, entries: conversation, suggestions: [] } };

export const Reads: Story = {
  args: {
    ...base,
    entries: [conversation[0]],
    suggestions: [],
    busy: true,
    reads: ["docs/facets/features/billing/invoice/list.yaml", "apps/web/src/billing/list.tsx"],
  },
};
