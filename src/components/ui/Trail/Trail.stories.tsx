import { localized } from "../../../i18n/legacy/components/ui/Trail/Trail.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import TrailWithLogic from ".";

const meta: Meta<typeof TrailWithLogic> = {
  title: "FACET UI/Trail",
  component: TrailWithLogic,
  parameters: {
    docs: {},
  },
  args: {
    steps: [
      { key: "overview", label: "Overview", onSelect: () => {} },
      { key: localized.text2, label: localized.text3, onSelect: () => {} },
      { key: "record", label: "Quick add" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLevels: Story = {};

export const OneLevel: Story = { args: { steps: [{ key: "overview", label: "Overview" }] } };

export const ToTheRawSource: Story = {
  args: {
    steps: [
      { key: "overview", label: "Overview", onSelect: () => {} },
      { key: "record", label: "Quick add", onSelect: () => {} },
      { key: "evidence", label: "Evidence", onSelect: () => {} },
      { key: "source", label: "RawSource" },
    ],
  },
};
