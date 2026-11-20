import type { Meta } from "@storybook/react-vite";
import { useState } from "react";
import { FilesPage, type FilesView } from "./Code";
import { fileGaps, fileScan, fileTree } from "./data";
import { desk, mob } from "./kit";

const meta: Meta = { title: "Screens/C Contents/Files" };
export default meta;

function Demo({ initial }: { initial: FilesView }) {
  const [view, setView] = useState(initial);
  const [expanded, setExpanded] = useState<string[]>(["internal", "packages/task", "web"]);
  return (
    <FilesPage
      view={view}
      scan={fileScan}
      tree={fileTree}
      expanded={expanded}
      gaps={fileGaps}
      onView={setView}
      onToggle={(p) => setExpanded((e) => (e.includes(p) ? e.filter((x) => x !== p) : [...e, p]))}
    />
  );
}

export const CoverageTree = desk("contents", "Coverage Tree", () => <Demo initial="tree" />);
export const CoverageTreeMobile = mob("contents", "Coverage Tree Mobile", () => (
  <Demo initial="tree" />
));
export const LargestGaps = desk("contents", "Largest Gaps", () => <Demo initial="gaps" />);
export const LargestGapsMobile = mob("contents", "Largest Gaps Mobile", () => (
  <Demo initial="gaps" />
));
