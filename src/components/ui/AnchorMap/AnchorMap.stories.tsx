import type { Meta, StoryObj } from "@storybook/react-vite";
import { SCAN, taskflowModel } from "../../../core/fixtures";
import AnchorMapWithLogic from ".";

const model = taskflowModel();

const meta: Meta<typeof AnchorMapWithLogic> = {
  title: "FACET UI/AnchorMap",
  component: AnchorMapWithLogic,
  parameters: {
    docs: {},
  },
  args: { anchors: model.anchorMap["sync/queue/offline-queue"] ?? [] },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EntryPoints: Story = {};

export const WithDrift: Story = {
  args: {
    anchors: model.anchorMap["sync/conflict/last-write-wins"] ?? [],
    drift: SCAN.drift ?? [],
  },
};

export const WithoutEntryPoint: Story = { args: { anchors: [], lifecycle: "active" } };

export const WithRepoLink: Story = {
  args: {
    buildHref: (anchor) =>
      `https://github.example.invalid/example/taskflow/blob/main/${anchor.path}#L${anchor.line}`,
  },
};
