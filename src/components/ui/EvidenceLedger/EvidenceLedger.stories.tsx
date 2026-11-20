import type { Meta, StoryObj } from "@storybook/react-vite";
import { taskflowRecord } from "../../../core/fixtures";
import EvidenceLedgerWithLogic from ".";

const meta: Meta<typeof EvidenceLedgerWithLogic> = {
  title: "FACET UI/EvidenceLedger",
  component: EvidenceLedgerWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Evidence of an assumption, newest first. Without evidence the assumption is a claim — and that is the only sentence this compartment then shows.",
      },
    },
  },
  args: {
    evidence: taskflowRecord("assumption/sync/clock-skew-bounded").evidence,
    today: new Date("2026-07-30"),
  },
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

export const EvidenceList: Story = {};

/** Not checked for too long — the answer line becomes a deadline. */
export const Outdated: Story = { args: { staleMonths: 3 } };

export const WithoutEvidence: Story = { args: { evidence: [] } };
