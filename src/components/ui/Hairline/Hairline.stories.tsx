import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Hairline/Hairline.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import HairlineWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof HairlineWithLogic> = {
  title: "Primitives/Hairline",
  component: HairlineWithLogic,
  parameters: {
    docs: {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12, width: 320 }}>
      <Text variant="meta">{localized.text2}</Text>
      <HairlineWithLogic {...args} />
      <Text variant="meta" tone="dim">
        {localized.text3}
      </Text>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", gap: 16, height: 48, alignItems: "stretch" }}>
      <Text variant="meta">{labelText.text338}</Text>
      <HairlineWithLogic {...args} />
      <Text variant="meta" tone="dim">
        Context
      </Text>
    </div>
  ),
};

export const Strong: Story = { args: { strength: "line2" } };
