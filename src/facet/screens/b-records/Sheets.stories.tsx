import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Screen, desktop, mobile } from "../Screen";
import { RecordDossierPage } from "./RecordDossierPage";
import { AnchorSheet, ConfigSheet, RuleSheet, TermSheet } from "./RecordSheets";
import {
  COMMIT_GATE_CONFIG,
  COMMIT_GATE_EXCERPT,
  RULE_ANCHORED,
  anchorsIn,
  dossierOf,
  featureById,
  ruleAppliesTo,
  siblingsOf,
  termOf,
} from "./storyData";

const meta: Meta = { title: "Screens/B Records/Sheets" };
export default meta;
type Story = StoryObj;

const GATE = "lists/permissions/admin";

function Behind({ mobile, sheet }: { mobile?: boolean; sheet: ReactNode }) {
  return (
    <Screen area="records" mobile={mobile} overlay={sheet}>
      <RecordDossierPage
        state="ready"
        mobile={mobile}
        record={dossierOf(GATE)}
        siblings={siblingsOf(GATE)}
        tab="record"
        section="code"
        collapsed={
          mobile ? ["promises", "knowledge", "history", "relations", "operations", "rules"] : []
        }
      />
    </Screen>
  );
}

function Anchor({ mobile }: { mobile?: boolean }) {
  const gate = featureById(GATE);
  return (
    <Behind
      mobile={mobile}
      sheet={
        <AnchorSheet
          open
          mobile={mobile}
          recordId={GATE}
          path="packages/board/store.go"
          line={1170}
          anchorRole="primary"
          excerpt={{ ...COMMIT_GATE_EXCERPT, lang: "go" }}
          fileAnchors={anchorsIn("packages/board/store.go")}
          lastCommit={gate.log[0]}
        />
      }
    />
  );
}

function Rule({ mobile }: { mobile?: boolean }) {
  return (
    <Behind
      mobile={mobile}
      sheet={
        <RuleSheet
          open
          mobile={mobile}
          {...RULE_ANCHORED}
          appliesTo={ruleAppliesTo("guardrails")}
        />
      }
    />
  );
}

function Config({ mobile }: { mobile?: boolean }) {
  return (
    <Behind
      mobile={mobile}
      sheet={
        <ConfigSheet
          open
          mobile={mobile}
          {...COMMIT_GATE_CONFIG}
          line={null}
          value={null}
          snippet={{ firstLine: 1, text: "hooks:\n  commit_gate: off" }}
        />
      }
    />
  );
}

function Term({ mobile }: { mobile?: boolean }) {
  return (
    <Behind
      mobile={mobile}
      sheet={
        <TermSheet
          open
          mobile={mobile}
          {...termOf("Drift")}
          translation="drift"
          records={[
            GATE,
            "workspace/board/filter-create",
            "workspace/board/progress-group",
            "lists/sharing/member",
          ]}
        />
      }
    />
  );
}

export const AnchorDetails: Story = { ...desktop, render: () => <Anchor /> };
export const AnchorMobile: Story = { ...mobile, render: () => <Anchor mobile /> };
export const Rules: Story = { ...desktop, render: () => <Rule /> };
export const RulesMobile: Story = { ...mobile, render: () => <Rule mobile /> };
export const Configuration: Story = { ...desktop, render: () => <Config /> };
export const ConfigurationMobile: Story = {
  ...mobile,

  render: () => <Config mobile />,
};
export const TermDetails: Story = { ...desktop, render: () => <Term /> };
export const TermMobile: Story = {
  ...mobile,

  render: () => <Term mobile />,
};
