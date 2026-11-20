import { localized } from "../../../i18n/legacy/components/ui/Blind/Blind.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import BlindWithLogic from ".";
import Button from "../Button";
import Text from "../Text";

const meta: Meta<typeof BlindWithLogic> = {
  title: "FACET UI/Blind",
  component: BlindWithLogic,
  parameters: {
    docs: {},
    layout: "fullscreen",
  },
  args: { label: "Detail: Quick add" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    children: (
      <div style={{ padding: 24 }}>
        <Text variant="meta" mono tone="dim">
          tasks/create/quick-add
        </Text>
        <Text as="p" variant="title" style={{ marginTop: 8 }}>
          Quick add
        </Text>
      </div>
    ),
  },
};

export const Narrow: Story = { ...Open, args: { ...Open.args, width: 420 } };

export const WithSwitch: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <Button variant="signal" onClick={() => setOpen(true)}>
          {localized.text2}
        </Button>
        <BlindWithLogic {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: 24, display: "grid", gap: 12 }}>
            <Text as="p" variant="title">
              Quick add
            </Text>
            <Button onClick={() => setOpen(false)}>{localized.text3}</Button>
          </div>
        </BlindWithLogic>
      </div>
    );
  },
};
