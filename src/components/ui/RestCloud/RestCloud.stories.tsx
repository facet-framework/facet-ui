import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import RestCloudWithLogic from ".";
import Text from "../Text";

const many = Array.from({ length: 87 }, (_, index) => ({
  id: `rest-${index}`,
  meaning: index % 7 === 0 ? ("due" as const) : index % 3 === 0 ? ("signal" as const) : undefined,
}));

const meta: Meta<typeof RestCloudWithLogic> = {
  title: "FACET UI/RestCloud",
  component: RestCloudWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 6 · Rest cloud: 12 rows, then a proportional strip. 99 rows must not be shown 99 times.",
      },
    },
  },
  args: { items: many, noun: ["further line", "further lines"] },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = { args: { expanded: true } };

/** A single remainder — the grammatical number is right. */
export const OneLine: Story = { args: { items: [{ id: "rest-1" }] } };

/** Very large sets are bundled instead of drawing 500 strokes. */
export const VeryLarge: Story = {
  args: { items: Array.from({ length: 480 }, (_, index) => ({ id: `r-${index}` })) },
};

/** With real expanding and collapsing below twelve visible rows. */
export const InAList: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index} as="div" variant="meta" tone="soft" style={{ padding: "6px 0" }}>
            {String(index + 1).padStart(2, "0")} · Promise without a test
          </Text>
        ))}
        <RestCloudWithLogic
          items={many}
          expanded={expanded}
          onToggle={setExpanded}
          noun={["further line", "further lines"]}
        />
        {expanded
          ? many.slice(0, 6).map((item, index) => (
              <Text key={item.id} as="div" variant="meta" tone="soft" style={{ padding: "6px 0" }}>
                {String(index + 13).padStart(2, "0")} · Promise without a test
              </Text>
            ))
          : null}
      </div>
    );
  },
};
