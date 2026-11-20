import { localized } from "../../../i18n/legacy/components/ui/RestCloud/RestCloud.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import RestCloudWithLogic from ".";
import Text from "../Text";

const many = Array.from({ length: 87 }, (_, index) => ({
  id: `rest-${index}`,
  meaning:
    index % 7 === 0 ? ("deadline" as const) : index % 3 === 0 ? ("signal" as const) : undefined,
}));

const meta: Meta<typeof RestCloudWithLogic> = {
  title: "FACET UI/RestCloud",
  component: RestCloudWithLogic,
  parameters: {
    docs: {},
  },
  args: { items: many, noun: ["more Row", "more Rows"] },
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

export const OneRow: Story = { args: { items: [{ id: "rest-1" }] } };

export const VeryLarge: Story = {
  args: { items: Array.from({ length: 480 }, (_, index) => ({ id: `r-${index}` })) },
};

export const InAList: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);
    return (
      <div>
        {Array.from({ length: 12 }, (_, index) => (
          <Text key={index} as="div" variant="meta" tone="soft" style={{ padding: "6px 0" }}>
            {String(index + 1).padStart(2, "0")}
            {localized.text2}
          </Text>
        ))}
        <RestCloudWithLogic
          items={many}
          expanded={expanded}
          onToggle={setExpanded}
          noun={["more Row", "more Rows"]}
        />
        {expanded
          ? many.slice(0, 6).map((item, index) => (
              <Text key={item.id} as="div" variant="meta" tone="soft" style={{ padding: "6px 0" }}>
                {String(index + 13).padStart(2, "0")}
                {localized.text3}
              </Text>
            ))
          : null}
      </div>
    );
  },
};
