import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FocusRowWithLogic from ".";
import FieldRow from "../FieldRow";

const meta: Meta<typeof FocusRowWithLogic> = {
  title: "FACET UI/FocusRow",
  component: FocusRowWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 2 · Solo focus: exactly one open row, neighbours dimmed, position snaps in. Enter opens, arrow right goes deeper, Esc closes.",
      },
    },
  },
  args: {
    rank: 1,
    id: "policy/notifications/quiet-hours",
    title: "Quiet hours",
    why: "Check quiet-hours-audit was due on 2026-07-12",
    meta: "platform-notify",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

/** Overdue — here red carries the reason, not the row. */
export const Overdue: Story = { args: { overdue: true } };

/** Dimmed because another row is being touched (coupling shadow). */
export const Muted: Story = { args: { dimmed: true } };

/** A focus list with real solo behaviour. */
export const FocusList: Story = {
  render: () => {
    const [openId, setOpenId] = useState<string | null>(null);
    const items = [
      {
        id: "policy/notifications/quiet-hours",
        title: "Quiet hours",
        why: "Check quiet-hours-audit was due on 2026-07-12",
        meta: "platform-notify",
        overdue: true,
        body: [
          ["Check", "quiet-hours-audit"],
          ["Cadence", "quarterly"],
          ["Last", "2026-04-12"],
        ],
      },
      {
        id: "sync/conflict/last-write-wins",
        title: "Last write wins",
        why: "Promise without a test",
        meta: "core-sync",
        body: [
          ["Record", "sync/conflict/last-write-wins"],
          ["Test", "none named"],
        ],
      },
      {
        id: "search/fulltext/task-search",
        title: "Task search",
        why: "active, but no entry point in code",
        meta: "core-search",
        body: [["Consequence", "Changes to the code cannot be traced to this record."]],
      },
    ];

    return (
      <div>
        {items.map((item, index) => (
          <FocusRowWithLogic
            key={item.id}
            rank={index + 1}
            id={item.id}
            title={item.title}
            why={item.why}
            meta={item.meta}
            overdue={item.overdue}
            openId={openId}
            dimmed={openId !== null && openId !== item.id}
            onOpenChange={setOpenId}
          >
            <dl style={{ margin: 0 }}>
              {item.body.map(([label, value]) => (
                <FieldRow key={label} label={label} value={value} />
              ))}
            </dl>
          </FocusRowWithLogic>
        ))}
      </div>
    );
  },
};
