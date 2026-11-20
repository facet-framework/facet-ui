import type { Meta, StoryObj } from "@storybook/react-vite";
import TimelineWithLogic from ".";

const meta: Meta<typeof TimelineWithLogic> = {
  title: "FACET/Timeline",
  component: TimelineWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Timeline over dated events. The axis runs without gaps — a month without an event gets an empty column, not a skipped one.",
      },
    },
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

/** Builds a sequence of counts from a start month. */
function series(start: string, counts: number[]) {
  const year = Number(start.slice(0, 4));
  const month = Number(start.slice(5, 7)) - 1;
  return counts.flatMap((count, offset) => {
    const index = year * 12 + month + offset;
    const key = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
    return Array.from({ length: count }, () => ({ date: `${key}-01` }));
  });
}

/** Two years of monthly history with a visible gap in the summer. */
export const Months: Story = {
  args: {
    events: series("2025-01", [3, 5, 8, 4, 2, 0, 0, 1, 6, 9, 12, 7, 4, 3, 5, 11, 8, 2, 1]),
    unit: "Records",
  },
};

/** A single month: axis, baseline and sentence stay in place. */
export const OneMonth: Story = {
  args: { events: series("2026-07", [4]) },
};

/** Over five years the axis switches to years by itself. */
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
    unit: "Records",
  },
};

/** Nothing is dated. */
export const Empty: Story = {
  args: { events: [], emptyText: "No record carries a creation date." },
};
