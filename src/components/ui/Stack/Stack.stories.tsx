import { localized } from "../../../i18n/legacy/components/ui/Stack/Stack.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import StackWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof StackWithLogic> = {
  title: "Primitives/Stack",
  component: StackWithLogic,
  parameters: {
    docs: {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const items = ["records", localized.text2, "Operations", "RuleSets"];

export const Vertical: Story = {
  args: {
    gap: "s2",
    children: items.map((label) => (
      <Text key={label} variant="meta">
        {label}
      </Text>
    )),
  },
};

export const Horizontal: Story = {
  args: {
    direction: "row",
    gap: "s4",
    align: "baseline",
    children: items.map((label) => (
      <Text key={label} variant="meta" tone="dim" nowrap>
        {label}
      </Text>
    )),
  },
};

export const Wrapping: Story = {
  args: {
    direction: "row",
    gap: 8,
    wrap: true,
    style: { maxWidth: 260 },
    children: Array.from({ length: 9 }, (_, i) => (
      <Text key={i} variant="caption" tone="dim" mono>
        FIELD-{i + 1}
      </Text>
    )),
  },
};
