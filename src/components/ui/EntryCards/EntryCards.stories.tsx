import { localized } from "../../../i18n/legacy/components/ui/EntryCards/EntryCards.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import EntryCardsWithLogic from ".";
import Bar from "../Bar";

const meta: Meta<typeof EntryCardsWithLogic> = {
  title: "FACET/EntryCards",
  component: EntryCardsWithLogic,
  parameters: {
    docs: {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 860 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ENTRIES = [
  {
    key: "records",
    tag: "records",
    title: localized.text2,
    value: "42",
    valueMeta: "28 active · 14 planned",
    lead: localized.text3,
    action: localized.text4,
  },
  {
    key: "promises",
    tag: "Promises",
    title: localized.text6,
    value: "68%",
    valueMeta: localized.text7,
    lead: localized.text8,
    action: localized.text9,
    open: true,
    figure: <Bar value={31} total={46} label={localized.text10} height={3} />,
  },
  {
    key: "ops",
    tag: "Operations",
    title: localized.text11,
    value: "17",
    valueMeta: "9 SLOs · 8 Alerts",
    lead: localized.text12,
    action: localized.text13,
    open: true,
  },
  {
    key: "rules",
    tag: "RuleSets",
    title: localized.text14,
    value: "6",
    valueMeta: "4 Richtlinien · 2 Assumptions",
    lead: localized.text15,
    action: localized.text16,
  },
];

export const EntryPoints: Story = { args: { entries: ENTRIES, onOpen: () => {} } };

export const AllQuiet: Story = {
  args: { entries: ENTRIES.map((entry) => ({ ...entry, open: false, figure: undefined })) },
};

export const Empty: Story = {
  args: { entries: [], emptyText: localized.text17 },
};
