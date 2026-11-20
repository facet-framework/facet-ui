import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { KnowledgePage, type KnowledgeView } from "./Registry";
import { KNOW_SLOTS, knowledgeOpenPerSlot, knowledgeRows, knowledgeTotals } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Knowledge" };
export default meta;

function Demo({ initial, mobile }: { initial: KnowledgeView; mobile: boolean }) {
  const [view, setView] = useState(initial);
  const [page, setPage] = useState(1);
  const [slot, setSlot] = useState(1);
  const size = view === "matrix" ? 25 : 20;
  const rows =
    view === "matrix"
      ? knowledgeRows.slice((page - 1) * size, page * size)
      : knowledgeRows.filter((r) => r.slots[slot] == null).slice((page - 1) * size, page * size);
  return (
    <KnowledgePage
      view={view}
      slots={KNOW_SLOTS}
      rows={rows}
      totals={knowledgeTotals}
      openPerSlot={knowledgeOpenPerSlot}
      page={page}
      pageSize={size}
      total={knowledgeRows.length}
      slot={slot}
      mobile={mobile}
      onView={(v) => {
        setView(v);
        setPage(1);
      }}
      onPage={setPage}
      onSlot={(s) => {
        setSlot(s);
        setPage(1);
      }}
    />
  );
}

export const FacetsMatrix = desk("contents", "Facets Matrix", (m) => (
  <Demo initial="matrix" mobile={m} />
));
export const FacetsMatrixMobile = mob("contents", "Facets Matrix Mobile", (m) => (
  <Demo initial="matrix" mobile={m} />
));
export const OpenQuestions = desk("contents", "Open Questions", (m) => (
  <Demo initial={"open"} mobile={m} />
));
export const OpenQuestionsMobile = mob("contents", "Open Questions Mobile", (m) => (
  <Demo initial={"open"} mobile={m} />
));
