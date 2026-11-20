import { localized } from "../../../i18n/legacy/components/ui/EmptyState/EmptyState.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import EmptyStateWithLogic from ".";
import Button from "../Button";

const meta: Meta<typeof EmptyStateWithLogic> = {
  title: "FACET UI/EmptyState",
  component: EmptyStateWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    headline: localized.text2,
    body: localized.text3,
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

export const OpenPoint: Story = {
  args: {
    tone: "open",
    headline: localized.text4,
    body: localized.text5,
  },
};

export const WithPath: Story = {
  args: { action: <Button variant="ghost">{localized.text6}</Button> },
};
