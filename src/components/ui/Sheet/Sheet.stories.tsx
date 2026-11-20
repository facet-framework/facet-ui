import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import SheetWithLogic from ".";
import Button from "../Button";
import Text from "../Text";

const meta: Meta<typeof SheetWithLogic> = {
  title: "FACET UI/Sheet",
  component: SheetWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "The register slides in from below — looking something up comes out of the drawer. Esc goes back exactly one level.",
      },
    },
    layout: "fullscreen",
  },
  args: { label: "Register" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Opened: Story = {
  args: {
    open: true,
    children: (
      <div style={{ padding: 24 }}>
        <Text variant="micro" tone="dim">
          Register
        </Text>
        <Text as="p" variant="title" style={{ marginTop: 8 }}>
          All records
        </Text>
      </div>
    ),
  },
};

/** When closed the register renders nothing — no placeholder in the tree. */
export const Closed: Story = { args: { open: false, children: null } };

/** With toggle and Escape. */
export const WithSwitch: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <Button variant="signal" onClick={() => setOpen(true)}>
          Open register
        </Button>
        <SheetWithLogic {...args} open={open} onClose={() => setOpen(false)}>
          <div style={{ padding: 24, display: "grid", gap: 12 }}>
            <Text variant="micro" tone="dim">
              Register
            </Text>
            <Text as="p" variant="title">
              Promises &amp; Tests
            </Text>
            <Button onClick={() => setOpen(false)}>close</Button>
          </div>
        </SheetWithLogic>
      </div>
    );
  },
};
