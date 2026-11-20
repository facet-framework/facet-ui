import type { Meta, StoryObj } from "@storybook/react-vite";
import MarkWithLogic from ".";
import Stack from "../Stack";
import Text from "../Text";

const meta: Meta<typeof MarkWithLogic> = {
  title: "Primitives/Mark",
  component: MarkWithLogic,
  parameters: {
    docs: {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { variant: "static", size: 28 } };

export const LoadingAnimation: Story = { args: { variant: "loading", size: 158 } };

export const BrandAnimation: Story = { args: { variant: "brand", size: 79 } };

export const InTheHeader: Story = {
  render: () => (
    <Stack direction="row" align="center" gap="s3">
      <MarkWithLogic size={16} />
      <Text variant="micro" tone="dim" mono style={{ letterSpacing: "0.2em" }}>
        ATLAS
      </Text>
    </Stack>
  ),
};
