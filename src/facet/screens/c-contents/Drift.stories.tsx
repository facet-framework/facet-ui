import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { registry } from "../../fixtures/registry";
import { DriftPage, type DriftView } from "./Evidence";
import { NOW } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Drift" };
export default meta;

function Demo({ initial, empty }: { initial: DriftView; empty?: boolean }) {
  const [view, setView] = useState(initial);
  return (
    <DriftPage
      view={view}
      state={empty ? "empty" : "ready"}
      items={
        empty
          ? []
          : registry.drift.map((d) => ({ recordId: d.id, path: d.path, changedAt: d.changedAt }))
      }
      now={NOW}
      onView={setView}
    />
  );
}

export const ByRecord = desk("contents", "By Record", () => <Demo initial="record" />);
export const ByRecordMobile = mob("contents", "By Record Mobile", () => <Demo initial="record" />);
export const Timeline = desk("contents", "Timeline", () => <Demo initial="time" />);
export const TimelineMobile = mob("contents", "Timeline Mobile", () => <Demo initial="time" />);
export const Empty = desk("contents", "Empty", () => <Demo initial="record" empty />);
export const EmptyMobile = mob("contents", "Empty Mobile", () => <Demo initial="record" empty />);
