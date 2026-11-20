import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ScanValue/ScanValue.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ScanValueWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof ScanValueWithLogic> = {
  title: "Atoms/ScanValue",
  component: ScanValueWithLogic,
  parameters: {
    docs: {},
  },
  args: { children: "84 200" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FromTheScan: Story = {};

export const WithProvenance: Story = {
  args: { children: "22 800", originLabel: "Repo-Scan vom 2026-07-28" },
};

export const InSentence: Story = {
  render: () => (
    <Text as="p" variant="lead" style={{ maxWidth: 480 }}>
      In Code liegen <ScanValueWithLogic>22 800</ScanValueWithLogic> {germanLabels.text182}{" "}
      <ScanValueWithLogic>84 200</ScanValueWithLogic>
      {localized.text2}
    </Text>
  ),
};
