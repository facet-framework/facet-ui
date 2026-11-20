import { localized } from "../../../i18n/legacy/components/ui/GroupTiles/GroupTiles.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import GroupTilesWithLogic from ".";

const meta: Meta<typeof GroupTilesWithLogic> = {
  title: "FACET/GroupTiles",
  component: GroupTilesWithLogic,
  parameters: {
    docs: {},
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

export const Areas: Story = {
  args: { groups: DOMAINS, noun: "Areas", unit: "records", shareNoun: localized.text2 },
};

export const Teams: Story = {
  args: {
    groups: [
      { key: "platform", label: "platform", count: 11, meta: "ops@example.com" },
      { key: "growth", label: "growth", count: 7, meta: localized.text3 },
      { key: "core", label: "core", count: 18, meta: "core@example.com" },
    ],
    noun: "teams",
    unit: "records",
  },
};

export const Clickable: Story = {
  args: { groups: DOMAINS, noun: "Areas", shareNoun: localized.text4, onOpen: () => {} },
};

export const Empty: Story = {
  args: { groups: [], emptyText: localized.text5 },
};
