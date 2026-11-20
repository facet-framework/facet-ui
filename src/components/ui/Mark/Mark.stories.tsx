import type { Meta, StoryObj } from "@storybook/react-vite";
import MarkWithLogic from ".";
import Stack from "../Stack";
import Text from "../Text";

const meta: Meta<typeof MarkWithLogic> = {
  title: "Primitives/Mark",
  component: MarkWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "The Facet Atlas mark: two offset blocks. `static` stands still, `loading` runs as long as something is not there yet, `brand` plays once on appearing and again on click.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Resting: Story = { args: { variant: "static", size: 28 } };

/** Runs as long as the corpus is still being read - no end state intended. */
export const LoadingAnimation: Story = { args: { variant: "loading", size: 158 } };

/** Once on appearing, then at the home position; a click plays it again. */
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
