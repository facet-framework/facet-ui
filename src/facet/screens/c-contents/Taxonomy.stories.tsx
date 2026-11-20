import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { TaxonomyPage, type TaxonomyView } from "./Structure";
import { taxonomy } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Taxonomy" };
export default meta;

function Demo({ initial, mobile }: { initial: TaxonomyView; mobile: boolean }) {
  const [view, setView] = useState(initial);
  const [expanded, setExpanded] = useState<string[]>(["navigation", "docs"]);
  const [sel, setSel] = useState<string | null>(initial === "sunburst" ? "navigation" : null);
  return (
    <TaxonomyPage
      view={view}
      domains={taxonomy}
      expanded={expanded}
      selected={sel}
      mobile={mobile}
      onView={setView}
      onToggle={(id) =>
        setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))
      }
      onSelect={setSel}
    />
  );
}

export const Tree = desk("contents", "Tree", (m) => <Demo initial="tree" mobile={m} />);
export const TreeMobile = mob("contents", "Tree Mobile", (m) => <Demo initial="tree" mobile={m} />);
export const Sunburst = desk("contents", "Sunburst", (m) => <Demo initial="sunburst" mobile={m} />);
export const SunburstMobile = mob("contents", "Sunburst Mobile", (m) => (
  <Demo initial="sunburst" mobile={m} />
));
