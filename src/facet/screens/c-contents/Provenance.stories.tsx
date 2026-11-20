import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { ProvenancePage, type ProvenanceView } from "./Registry";
import {
  provenanceDays,
  provenanceMonths,
  provenanceRange,
  provenanceTeams,
  provenanceUndated,
  provenanceUnowned,
} from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Provenance" };
export default meta;

function Demo({ initial, mobile }: { initial: ProvenanceView; mobile?: boolean }) {
  const [view, setView] = useState(initial);
  const busiest = [...provenanceDays].sort((a, b) => b.count - a.count)[0];
  const [day, setDay] = useState<string | null>(busiest?.date ?? null);
  return (
    <ProvenancePage
      view={view}
      teams={provenanceTeams}
      unowned={provenanceUnowned}
      days={provenanceDays}
      range={provenanceRange}
      months={provenanceMonths}
      undated={provenanceUndated}
      mobile={mobile}
      selectedDay={provenanceDays.find((d) => d.date === day) ?? null}
      onView={setView}
      onPickDay={setDay}
    />
  );
}

export const ByTeam = desk("contents", "By Team", () => <Demo initial="team" />);
export const ByTeamMobile = mob("contents", "By Team Mobile", () => <Demo initial="team" mobile />);
export const Calendar = desk("contents", "Calendar", () => <Demo initial="calendar" />);
export const CalendarMobile = mob("contents", "Calendar Mobile", () => (
  <Demo initial="calendar" mobile />
));
