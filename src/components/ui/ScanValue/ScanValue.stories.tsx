import type { Meta, StoryObj } from "@storybook/react-vite";
import ScanValueWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof ScanValueWithLogic> = {
  title: "Atoms/ScanValue",
  component: ScanValueWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Numbers from the repo scan have a dotted underline. The schema knows neither line counts nor commit dates — the separation stays visible.",
      },
    },
  },
  args: { children: "84 200" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FromTheScan: Story = {};

/** With the exact origin in the hover view. */
export const WithOrigin: Story = {
  args: { children: "22 800", originLabel: "Repo scan of 2026-07-28" },
};

/** In a sentence — the difference from the field value stays readable. */
export const InTheSentence: Story = {
  render: () => (
    <Text as="p" variant="lead" style={{ maxWidth: 480 }}>
      In code, <ScanValueWithLogic>22 800</ScanValueWithLogic> of{" "}
      <ScanValueWithLogic>84 200</ScanValueWithLogic> lines are in tests; line coverage is not
      connected.
    </Text>
  ),
};
