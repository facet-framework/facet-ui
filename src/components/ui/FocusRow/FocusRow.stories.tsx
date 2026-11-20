import { localized } from "../../../i18n/legacy/components/ui/FocusRow/FocusRow.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FocusRowWithLogic from ".";
import FieldRow from "../FieldRow";

const meta: Meta<typeof FocusRowWithLogic> = {
  title: "FACET UI/FocusRow",
  component: FocusRowWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    rank: 1,
    id: "policy/notifications/quiet-hours",
    title: "Quiet hours",
    why: localized.text2,
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

export const Overdue: Story = { args: { overdue: true } };

export const Muted: Story = { args: { dimmed: true } };

export const FocusList: Story = {
  render: () => {
    const [openId, setOpenId] = useState<string | null>(null);
    const items = [
      {
        id: "policy/notifications/quiet-hours",
        title: "Quiet hours",
        why: localized.text3,
        meta: "platform-notify",
        overdue: true,
        body: [
          [localized.text4, "quiet-hours-audit"],
          ["Rhythm", "quarterly"],
          ["Recent", "2026-04-12"],
        ],
      },
      {
        id: "sync/conflict/last-write-wins",
        title: "Last write wins",
        why: localized.text5,
        meta: "core-sync",
        body: [
          ["Record", "sync/conflict/last-write-wins"],
          ["Test", "keiner benannt"],
        ],
      },
      {
        id: "search/fulltext/task-search",
        title: "Task search",
        why: localized.text6,
        meta: "core-search",
        body: [["Sequence", localized.text7]],
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
