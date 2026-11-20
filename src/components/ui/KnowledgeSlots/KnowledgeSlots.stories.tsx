import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import KnowledgeSlotsWithLogic from ".";

const meta: Meta<typeof KnowledgeSlotsWithLogic> = {
  title: "FACET UI/KnowledgeSlots",
  component: KnowledgeSlotsWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "`knowledge.*` as question and answer. Unanswered questions stay visible — they are the purpose of the slot.",
      },
    },
  },
  args: { slots: taskflowRecord("sync/queue/offline-queue").knowledge },
  decorators: [
    (Story) => (
      <div style={{ width: 520 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Knowledge: Story = {};

export const OnlyOpen: Story = { args: { onlyOpen: true } };

export const WithoutKnowledge: Story = { args: { slots: [] } };
