import { localized } from "../../../i18n/legacy/components/ui/ProbeNumber/ProbeNumber.stories.text";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ProbeNumberWithLogic from ".";
import Text from "../Text";

const meta: Meta<typeof ProbeNumberWithLogic> = {
  title: "Atoms/ProbeNumber",
  component: ProbeNumberWithLogic,
  parameters: {
    docs: {},
  },
  args: { probeKey: "open", label: "16 open Punkte show", children: "16" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = { args: { activeProbe: "open" } };

export const InLeadSentence: Story = {
  render: () => {
    const [probe, setProbe] = useState<string | null>(null);
    return (
      <div style={{ maxWidth: 560 }}>
        <Text as="p" variant="hero">
          <ProbeNumberWithLogic
            probeKey={"open"}
            activeProbe={probe}
            onToggle={setProbe}
            label="16 open Punkte show"
          >
            16
          </ProbeNumberWithLogic>{" "}
          Punkte brauchen dich, davon{" "}
          <ProbeNumberWithLogic
            probeKey="deadline"
            activeProbe={probe}
            onToggle={setProbe}
            label={localized.text5}
          >
            2
          </ProbeNumberWithLogic>{" "}
          {localized.text6}
        </Text>
        <Text variant="meta" tone="dim" style={{ marginTop: 12, display: "block" }}>
          open Sonde: {probe ?? "none"}
        </Text>
      </div>
    );
  },
};
