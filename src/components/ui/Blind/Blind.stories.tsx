import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import BlindWithLogic from ".";
import Button from "../Button";
import Text from "../Text";

const meta: Meta<typeof BlindWithLogic> = {
  title: "FACET UI/Blind",
  component: BlindWithLogic,
  parameters: {
    docs: {
      description: {
        component: "The detail slides in from the right and goes back to the right.",
      },
    },
    layout: "fullscreen",
  },
  args: { label: "Detail: Quick add" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Opened: Story = {
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

export const Narrow: Story = { ...Opened, args: { ...Opened.args, width: 420 } };

export const WithSwitch: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <Button variant="signal" onClick={() => setOpen(true)}>
          Open detail
        </Button>
        <BlindWithLogic {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: 24, display: "grid", gap: 12 }}>
            <Text as="p" variant="title">
              Quick add
            </Text>
            <Button onClick={() => setOpen(false)}>back</Button>
          </div>
        </BlindWithLogic>
      </div>
    );
  },
};
