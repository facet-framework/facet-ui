import type { Meta, StoryObj } from "@storybook/react-vite";
import EmptyStateWithLogic from ".";
import Button from "../Button";

const meta: Meta<typeof EmptyStateWithLogic> = {
  title: "FACET UI/EmptyState",
  component: EmptyStateWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "One of the four mandatory states. It names the missing facet and says what depends on it — instead of showing an empty surface.",
      },
    },
  },
  args: {
    headline: "No task described.",
    body: "Without items[] there is nothing a test could back.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 460 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Quiet: Story = {};

/** Open task — the sentence gets ink instead of grey. */
export const OpenPoint: Story = {
  args: {
    tone: "open",
    headline: "Active, but no entry point in code.",
    body: "Changes to the code cannot be traced to this item.",
  },
};

/** With a way forward. */
export const WithWayForward: Story = {
  args: { action: <Button variant="ghost">check the register →</Button> },
};
