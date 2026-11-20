import { localized } from "../../../i18n/legacy/components/ui/Timeline/Timeline.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import TimelineWithLogic from ".";

const meta: Meta<typeof TimelineWithLogic> = {
  title: "FACET/Timeline",
  component: TimelineWithLogic,
  parameters: {
    docs: {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function series(start: string, counts: number[]) {
  const year = Number(start.slice(0, 4));
  const month = Number(start.slice(5, 7)) - 1;
  return counts.flatMap((count, offset) => {
    const index = year * 12 + month + offset;
    const key = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
    return Array.from({ length: count }, () => ({ date: `${key}-01` }));
  });
}

export const Months: Story = {
  args: {
    events: series("2025-01", [3, 5, 8, 4, 2, 0, 0, 1, 6, 9, 12, 7, 4, 3, 5, 11, 8, 2, 1]),
    unit: "records",
  },
};

export const OneMonth: Story = {
  args: { events: series("2026-07", [4]) },
};

export const Years: Story = {
  args: {
    events: [
      ...series(
        "2021-01",
        Array.from({ length: 12 }, (_, i) => (i % 3) + 1),
      ),
      ...series(
        "2022-01",
        Array.from({ length: 12 }, (_, i) => (i % 4) + 2),
      ),
      ...series(
        "2023-01",
        Array.from({ length: 12 }, () => 2),
      ),
      ...series(
        "2024-01",
        Array.from({ length: 12 }, (_, i) => (i % 5) + 1),
      ),
      ...series(
        "2025-01",
        Array.from({ length: 12 }, () => 3),
      ),
      ...series(
        "2026-01",
        Array.from({ length: 8 }, (_, i) => i),
      ),
    ],
    unit: "records",
  },
};

export const Empty: Story = {
  args: { events: [], emptyText: localized.text2 },
};
