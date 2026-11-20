import { localized } from "../../../i18n/legacy/facet/screens/d-plugins/Processes.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Screen, desktop, mobile } from "../Screen";
import {
  ProcessCollection,
  ProcessUnreadable,
  ProcessWorkspace,
  type ProcessWalk,
} from "./Processes";
import {
  diagram,
  diagramById,
  diagramTabs,
  processDocs,
  processFindings,
  processLinks,
  processes,
  shapeGallery,
  walkAt,
  walkPath,
} from "./storyData";
import { registry } from "../../fixtures";

const tablet = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "tablet" } },
};

const meta: Meta = { title: "Screens/D Plugins/Processes" };
export default meta;
type Story = StoryObj;

function List({
  mobile,
  view: initial,
  empty,
}: {
  mobile?: boolean;
  view: "gallery" | "table";
  empty?: boolean;
}) {
  const [view, setView] = useState(initial);
  const [page, setPage] = useState(1);
  const size = mobile ? 6 : 12;
  return (
    <Screen area="bpmn" mobile={mobile}>
      <ProcessCollection
        state={empty ? "empty" : "ready"}
        view={view}
        items={empty ? [] : processes.slice(0, page * size).slice(mobile ? 0 : (page - 1) * size)}
        total={empty ? 0 : processes.length}
        page={page}
        pageSize={size}
        query=""
        withWarnings={processes.filter((p) => p.warnings).length}
        mobile={mobile}
        onView={setView}
        onPage={setPage}
      />
    </Screen>
  );
}

const PATH = walkPath(diagram);

function Workspace({
  mobile,
  selected: sel0 = null,
  walkStep,
  atGateway,
  findingsOpen: f0 = false,
  multi,
  gallery,
}: {
  multi?: boolean;

  gallery?: boolean;
  mobile?: boolean;
  selected?: string | null;
  walkStep?: number;
  atGateway?: boolean;
  findingsOpen?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(sel0);
  const [step, setStep] = useState<number | null>(walkStep ?? null);
  const [gw, setGw] = useState(!!atGateway);
  const [panel, setPanel] = useState<"detail" | "walkthrough">(walkStep ? "walkthrough" : "detail");
  const [zoom, setZoom] = useState(100);
  const [query, setQuery] = useState("");
  const [findings, setFindings] = useState(f0);
  const [outline, setOutline] = useState(false);
  const [active, setActive] = useState("d1");
  const d = gallery ? shapeGallery : multi ? diagramById[active] : diagram;
  const lanes = d.shapes.filter((x) => x.kind === "participant").length;
  const walk: ProcessWalk | null = step ? walkAt(d, step, gw) : null;
  return (
    <Screen area="bpmn" mobile={mobile}>
      <ProcessWorkspace
        name={registry.bpmn[0].name}
        file={registry.bpmn[0].file}
        diagram={d}
        metrics={{
          elements: d.shapes.length - lanes,
          flows: d.edges.length,
          lanes,
          paths:
            d === diagram ? 2 : 1 + (d.shapes.some((x) => x.kind === "exclusiveGateway") ? 1 : 0),
          longest: walkPath(d).nodes.length,
        }}
        diagrams={multi ? diagramTabs : undefined}
        activeDiagram={active}
        onDiagram={(id) => {
          setActive(id);
          setSelected(null);
          setStep(null);
        }}
        selected={walk ? null : selected}
        walk={walk}
        panel={panel}
        findings={d === diagram ? processFindings : []}
        findingsOpen={findings}
        outlineQuery={query}
        zoom={zoom}
        viewport={{ x: 100, y: 40, w: 620, h: 420 }}
        linked={processLinks}
        docs={processDocs}
        mobile={mobile}
        outlineOpen={outline}
        onSelect={(id) => {
          setSelected(id);
          setPanel("detail");
          setOutline(false);
        }}
        onPanel={setPanel}
        onZoom={(d) =>
          setZoom((z) =>
            d === "fit" ? 100 : Math.max(25, Math.min(200, z + (d === "in" ? 25 : -25))),
          )
        }
        onOutlineQuery={setQuery}
        onOutline={() => setOutline((o) => !o)}
        onFindings={() => setFindings((f) => !f)}
        onWalk={(a) => {
          setPanel("walkthrough");
          if (a === "start") setStep(1);
          else if (a === "stop") setStep(null);
          else if (a === "back") setStep((s) => Math.max(1, (s ?? 1) - 1));
          else if (a === "choose") setGw(false);
          else
            setStep((s) => {
              const n = Math.min(PATH.nodes.length, (s ?? 0) + 1);
              setGw(
                diagram.shapes.find((x) => x.id === PATH.nodes[n - 1])?.kind === "exclusiveGateway",
              );
              return n;
            });
        }}
      />
    </Screen>
  );
}

const Unreadable = ({ mobile }: { mobile?: boolean }) => (
  <Screen area="bpmn" mobile={mobile}>
    <ProcessUnreadable
      file="docs/bpmn/grant-a-tool.bpmn"
      error={localized.text1}
      line={42}
      excerpt={[
        { n: 39, text: localized.text2 },
        { n: 40, text: "      <bpmn:incoming>Flow_2</bpmn:incoming>" },
        { n: 41, text: "      <bpmn:outgoing>Flow_3</bpmn:outgoing>" },
        { n: 42, text: "  </bpmn:process>" },
        { n: 43, text: '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">' },
      ]}
    />
  </Screen>
);

export const Gallery: Story = {
  ...desktop,
  render: () => <List view="gallery" />,
};
export const GalleryMobile: Story = {
  name: "Gallery Mobile",
  ...mobile,
  render: () => <List mobile view="gallery" />,
};
export const Table: Story = {
  ...desktop,
  render: () => <List view="table" />,
};
export const TableMobile: Story = {
  name: "Table Mobile",
  ...mobile,
  render: () => <List mobile view="table" />,
};
export const Canvas: Story = {
  name: "Canvas",
  ...desktop,
  render: () => <Workspace />,
};
export const CanvasMobile: Story = {
  name: "Canvas Mobile",
  ...mobile,
  render: () => <Workspace mobile />,
};
export const ElementSelected: Story = {
  name: "Element Selected",
  ...desktop,
  render: () => <Workspace selected="el-6" />,
};
export const ElementSelectedMobile: Story = {
  name: "Element Selected Mobile",
  ...mobile,
  render: () => <Workspace mobile selected="el-6" />,
};
export const Walkthrough: Story = {
  ...desktop,
  render: () => <Workspace walkStep={4} atGateway />,
};
export const WalkthroughMobile: Story = {
  name: "Walkthrough Mobile",
  ...mobile,
  render: () => <Workspace mobile walkStep={4} atGateway />,
};
export const Findings: Story = {
  ...desktop,
  render: () => <Workspace findingsOpen selected="el-7" />,
};
export const FindingsMobile: Story = {
  name: "Findings Mobile",
  ...mobile,
  render: () => <Workspace mobile findingsOpen />,
};
export const NoProcess: Story = {
  name: "No Process",
  ...desktop,
  render: () => <List view="gallery" empty />,
};
export const NoProcessMobile: Story = {
  name: "No Process Mobile",
  ...mobile,
  render: () => <List mobile view="gallery" empty />,
};
export const FileNotReadable: Story = {
  name: "File Not Readable",
  ...desktop,
  render: () => <Unreadable />,
};
export const FileNotReadableMobile: Story = {
  name: "File Not Readable Mobile",
  ...mobile,
  render: () => <Unreadable mobile />,
};
export const MultipleDiagrams: Story = {
  name: "Multiple Diagrams",
  ...desktop,
  render: () => <Workspace multi />,
};
export const MultipleDiagramsMobile: Story = {
  name: "Multiple Diagrams Mobile",
  ...mobile,
  render: () => <Workspace mobile multi />,
};
export const CanvasTablet: Story = {
  name: "Canvas Tablet",
  ...tablet,
  render: () => <Workspace selected="el-6" />,
};
export const AllShapes: Story = {
  name: "All Shapes",
  ...desktop,
  render: () => <Workspace gallery />,
};
export const AllShapesMobile: Story = {
  name: "All Shapes Mobile",
  ...mobile,
  render: () => <Workspace mobile gallery />,
};
export const AllShapesSelected: Story = {
  name: "All Shapes Selected",
  ...desktop,
  render: () => <Workspace gallery selected="SP1" />,
};
