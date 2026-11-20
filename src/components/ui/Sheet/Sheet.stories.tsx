import { localized } from "../../../i18n/legacy/components/ui/Sheet/Sheet.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import SheetWithLogic from ".";
import Button from "../Button";
import Text from "../Text";

const meta: Meta<typeof SheetWithLogic> = {
  title: "FACET UI/Sheet",
  component: SheetWithLogic,
  parameters: {
    docs: {},
    layout: "fullscreen",
  },
  args: { label: localized.text2 },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    children: (
      <div style={{ padding: 24 }}>
        <Text variant="micro" tone="dim">
          {localized.text3}
        </Text>
        <Text as="p" variant="title" style={{ marginTop: 8 }}>
          All Records
        </Text>
      </div>
    ),
  },
};

export const Closed: Story = { args: { open: false, children: null } };

export const WithSwitch: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <Button variant="signal" onClick={() => setOpen(true)}>
          {localized.text4}
        </Button>
        <SheetWithLogic {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: 24, display: "grid", gap: 12 }}>
            <Text variant="micro" tone="dim">
              {localized.text5}
            </Text>
            <Text as="p" variant="title">
              {localized.text6}
            </Text>
            <Button onClick={() => setOpen(false)}>{localized.text7}</Button>
          </div>
        </SheetWithLogic>
      </div>
    );
  },
};
