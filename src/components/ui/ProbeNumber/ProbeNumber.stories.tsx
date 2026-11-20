import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ProbeNumberWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof ProbeNumberWithLogic> = {
  title: "Atoms/ProbeNumber",
  component: ProbeNumberWithLogic,
  parameters: {
    docs: {
      description: {
        component:
          "Mechanic 1 · Lead sentence with probes: a number in the sentence is the shortest way into its derivation.",
      },
    },
  },
  args: { probeKey: "open", label: "Show 16 open points", children: "16" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Opened: Story = { args: { activeProbe: "open" } };

/** In a sentence, as on the stage — with working toggling. */
export const InTheLeadSentence: Story = {
  render: () => {
    const [probe, setProbe] = useState<string | null>(null);
    return (
      <div style={{ maxWidth: 560 }}>
        <Text as="p" variant="hero">
          <ProbeNumberWithLogic
            probeKey="open"
            activeProbe={probe}
            onToggle={setProbe}
            label="Show 16 open points"
          >
            16
          </ProbeNumberWithLogic>{" "}
          points need you, of which{" "}
          <ProbeNumberWithLogic
            probeKey="due"
            activeProbe={probe}
            onToggle={setProbe}
            label="Show 2 overdue deadlines"
          >
            2
          </ProbeNumberWithLogic>{" "}
          with an expired deadline.
        </Text>
        <Text variant="meta" tone="dim" style={{ marginTop: 12, display: "block" }}>
          open probe: {probe ?? "none"}
        </Text>
      </div>
    );
  },
};
