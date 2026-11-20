import type { Meta, StoryObj } from "@storybook/react-vite";
import EntryCardsWithLogic from ".";
import Bar from "../Bar";

const meta: Meta<typeof EntryCardsWithLogic> = {
  title: "FACET/EntryCards",
  component: EntryCardsWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Entry points as large surfaces. “Card” means surface, not a little card: paper instead of shadow, hairline instead of a frame, no rounding. Open entry points come first and carry a mark — colour alone tells nobody that something is pending.",
      },
    },
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
    key: "items",
    tag: "Items",
    title: "What is described",
    value: "42",
    valueMeta: "28 active · 14 planned",
    lead: "Every item has a team and an entry point in code.",
    action: "Open register",
  },
  {
    key: "tasks",
    tag: "Tasks",
    title: "Which tests are mapped",
    value: "68 %",
    valueMeta: "31/46 with a mapped test",
    lead: "15 tasks still have no test that holds them.",
    action: "Open tasks",
    open: true,
    figure: <Bar value={31} total={46} label="31 of 46 tasks with a mapped test" height={3} />,
  },
  {
    key: "ops",
    tag: "Operations",
    title: "What is monitored",
    value: "17",
    valueMeta: "9 SLOs · 8 alerts",
    lead: "Two alerts have no runbook.",
    action: "Open operations",
    open: true,
  },
  {
    key: "rules",
    tag: "Policies",
    title: "What is binding",
    value: "6",
    valueMeta: "4 policies · 2 assumptions",
    lead: "No assumption is past its deadline.",
    action: "Open policies",
  },
];

/** Four entries, two of them open. */
export const EntryPoints: Story = { args: { entries: ENTRIES, onOpen: () => {} } };

/** Nothing is pending — the order stays as it was passed in. */
export const AllQuiet: Story = {
  args: { entries: ENTRIES.map((entry) => ({ ...entry, open: false, figure: undefined })) },
};

/** Nothing read yet. */
export const Empty: Story = {
  args: { entries: [], emptyText: "No item read yet." },
};
