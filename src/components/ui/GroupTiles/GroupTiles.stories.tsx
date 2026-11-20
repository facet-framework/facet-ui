import type { Meta, StoryObj } from "@storybook/react-vite";
import GroupTilesWithLogic from ".";

const meta: Meta<typeof GroupTilesWithLogic> = {
  title: "FACET/GroupTiles",
  component: GroupTilesWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Areas or teams as a field of tiles. A tile's identity stands there as a word, not as a colour: the four semantic colours are a status palette and, measured, fall below the distinguishability threshold as soon as they are used as categories.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 760 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const DOMAINS = [
  {
    key: "billing",
    label: "billing",
    count: 14,
    meta: "6 active · 8 planned",
    proven: 31,
    total: 38,
  },
  { key: "auth", label: "auth", count: 9, meta: "9 active", proven: 24, total: 24 },
  {
    key: "multiplayer",
    label: "multiplayer",
    count: 6,
    meta: "2 active · 4 planned",
    proven: 3,
    total: 19,
  },
  { key: "search", label: "search", count: 4, meta: "4 active", proven: 7, total: 11 },
  { key: "infra", label: "infra", count: 3, meta: "3 active", proven: 5, total: 5 },
];

/** Areas with their share of promises with a test mapping. */
export const Areas: Story = {
  args: { groups: DOMAINS, noun: "areas", unit: "records", shareNoun: "with a mapped test" },
};

/** Teams count records and have nothing to measure — the bar is dropped. */
export const Teams: Story = {
  args: {
    groups: [
      { key: "platform", label: "platform", count: 11, meta: "ops@example.com" },
      { key: "growth", label: "growth", count: 7, meta: "no contact" },
      { key: "core", label: "core", count: 18, meta: "core@example.com" },
    ],
    noun: "Teams",
    unit: "records",
  },
};

/** Clickable tiles — the surface is the button. */
export const Clickable: Story = {
  args: { groups: DOMAINS, noun: "areas", shareNoun: "with a mapped test", onOpen: () => {} },
};

/** Nothing to show: a sentence instead of an empty grid. */
export const Empty: Story = {
  args: { groups: [], emptyText: "No record carries an area." },
};
