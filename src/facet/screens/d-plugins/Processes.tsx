import type { ReactNode } from "react";
import { Icon } from "../../primitives/Icon";
import { Badge, Button, Chip, IconButton, SearchField, Tabs } from "../../primitives/controls";
import { EmptyState, Stat } from "../../primitives/display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  type CollectionState,
} from "../../primitives/collection";
import { Sheet } from "../../primitives/overlay";
import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { Facts, PluginHead, noop } from "./shared";
import {
  EdgeDefs,
  PlacedLabel,
  ElementGlyph,
  ShapeGlyph,
  edgeStyle,
  formOf,
  isContainer,
  isTask,
  markerUrl,
} from "./bpmnGlyphs";

export type BpmnLabel = {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];

  vertical?: boolean;
  align?: "left" | "center";
};

export type BpmnShape = {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lane?: string;

  form?: string;

  border?: string;

  dashed?: boolean;

  symbol?: string;

  filled?: boolean;

  markers?: string[];

  collection?: boolean;

  labelBox?: BpmnLabel;
};
export type BpmnEdge = {
  id: string;
  kind: string;
  label: string;
  points: [number, number][];
  from?: string;
  to?: string;

  stroke?: string;

  start?: string;
  end?: string;
  labelBox?: BpmnLabel;
};
export type ProcessDiagram = {
  shapes: BpmnShape[];
  edges: BpmnEdge[];
  box: { x: number; y: number; w: number; h: number };
};

export type ProcessFinding = {
  key: string;
  severity: "Error" | "Warning" | "Note";
  text: string;
  element?: string;
};

export type ProcessWalk = {
  step: number;
  total: number;
  visited: string[];
  edges: string[];
  current: string;

  choices?: { edge: string; label: string; target: string }[];
  log: { id: string; label: string; kind: string }[];
};

const KIND_KEY: Record<string, TextKey> = {
  participant: "d.proc.kind.participant",
  lane: "d.proc.kind.lane",
  endEvent: "d.proc.kind.endEvent",
  intermediateCatchEvent: "d.proc.kind.intermediateCatchEvent",
  intermediateThrowEvent: "d.proc.kind.intermediateThrowEvent",
  boundaryEvent: "d.proc.kind.boundaryEvent",
  manualTask: "d.proc.kind.manualTask",
  businessRuleTask: "d.proc.kind.businessRuleTask",
  sendTask: "d.proc.kind.sendTask",
  receiveTask: "d.proc.kind.receiveTask",
  subProcess: "d.proc.kind.subProcess",
  adHocSubProcess: "d.proc.kind.adHocSubProcess",
  transaction: "d.proc.kind.transaction",
  callActivity: "d.proc.kind.callActivity",
  parallelGateway: "d.proc.kind.parallelGateway",
  inclusiveGateway: "d.proc.kind.inclusiveGateway",
  eventBasedGateway: "d.proc.kind.eventBasedGateway",
  complexGateway: "d.proc.kind.complexGateway",
  dataObjectReference: "d.proc.kind.dataObject",
  dataStoreReference: "d.proc.kind.dataStore",
  group: "d.proc.kind.group",
  task: "d.proc.kind.task",
  userTask: "d.proc.kind.userTask",
  serviceTask: "d.proc.kind.serviceTask",
  scriptTask: "d.proc.kind.scriptTask",
  exclusiveGateway: "d.proc.kind.exclusiveGateway",
  textAnnotation: "d.proc.kind.textAnnotation",
  sequenceFlow: "d.proc.kind.sequenceFlow",
  messageFlow: "d.proc.kind.messageFlow",
  association: "d.proc.kind.association",
};

export function useKindLabel() {
  const { t } = useText();
  return (kind: string) =>
    KIND_KEY[kind] ? t(KIND_KEY[kind]) : kind === "startEvent" ? "Start" : kind;
}

const SEVERITY_KEY: Record<ProcessFinding["severity"], TextKey> = {
  Error: "d.proc.severity.error",
  Warning: "d.proc.severity.warning",
  Note: "d.proc.severity.note",
};

export type CanvasProps = {
  diagram: ProcessDiagram;
  selected?: string | null;
  walk?: ProcessWalk | null;
  thumb?: boolean;
  label: string;
  onSelect?: (id: string) => void;
};

export function ProcessCanvas({
  diagram,
  selected,
  walk,
  thumb,
  label,
  onSelect = noop,
}: CanvasProps) {
  const { t } = useText();
  const kindLabel = useKindLabel();
  const { box } = diagram;
  const pad = 20;
  const related = new Set<string>();
  if (selected) {
    related.add(selected);
    for (const e of diagram.edges) {
      if (e.from === selected || e.to === selected) {
        related.add(e.id);
        if (e.from) related.add(e.from);
        if (e.to) related.add(e.to);
      }
    }
  }
  const containers = new Set(diagram.shapes.filter(isContainer).map((s) => s.id));
  const state = (id: string): string | undefined => {
    const keep = containers.has(id) ? undefined : "dim";
    if (walk) {
      if (walk.current === id) return "current";
      if (walk.visited.includes(id) || walk.edges.includes(id)) return "visited";
      return keep;
    }
    if (selected) {
      if (id === selected) return "focus";
      if (related.has(id)) return "related";
      return keep;
    }
    return undefined;
  };
  const area = (s: BpmnShape) => s.w * s.h;
  const rank = (s: BpmnShape) => {
    const f = formOf(s);
    return f === "pool" ? 0 : f === "lane" ? 1 : f === "group" ? 3 : 2;
  };

  const back = diagram.shapes
    .filter((s) => containers.has(s.id))
    .sort((a, b) => rank(a) - rank(b) || area(b) - area(a));
  const front = diagram.shapes
    .filter((s) => !containers.has(s.id))
    .sort((a, b) => Number(a.kind === "boundaryEvent") - Number(b.kind === "boundaryEvent"));
  const named = (s: BpmnShape) => `${kindLabel(s.kind)}: ${s.label || t("d.proc.unnamed")}`;
  const element = (s: BpmnShape) => {
    const f = formOf(s);

    const frame = f === "pool" || f === "lane" || f === "group";
    return (
      <g
        key={s.id}
        className="t-d-bpmn__el"
        data-state={state(s.id)}
        data-form={f}
        data-kind={s.kind}
        data-testid={thumb ? undefined : `shape-${s.id}`}
        role={thumb ? undefined : frame ? "group" : "button"}
        tabIndex={thumb || frame ? undefined : 0}
        aria-label={thumb ? undefined : named(s)}
        onClick={thumb || frame ? undefined : () => onSelect(s.id)}
      >
        <ShapeGlyph s={s} thumb={thumb} />
      </g>
    );
  };
  return (
    <svg
      className="t-d-bpmn"
      data-thumb={thumb || undefined}
      viewBox={`${box.x - pad} ${box.y - pad} ${box.w + pad * 2} ${box.h + pad * 2}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <EdgeDefs />
      {back.map(element)}
      {diagram.edges.map((e) => {
        const style = edgeStyle(e);
        return (
          <g
            key={e.id}
            className="t-d-bpmn__edge"
            data-kind={e.kind}
            data-stroke={style.stroke}
            data-start={style.start || undefined}
            data-end={style.end || undefined}
            data-state={state(e.id)}
            data-testid={thumb ? undefined : `edge-${e.id}`}
          >
            <polyline
              points={e.points.map((p) => p.join(",")).join(" ")}
              markerStart={markerUrl(style.start)}
              markerEnd={markerUrl(style.end)}
            />
            {!e.label || thumb ? null : e.labelBox ? (
              <PlacedLabel box={e.labelBox} className="t-d-bpmn__edgetext" />
            ) : (
              <text
                x={
                  (e.points[Math.min(1, e.points.length - 1)][0] +
                    e.points[e.points.length - 1][0]) /
                  2
                }
                y={e.points[e.points.length - 1][1] - 6}
                textAnchor="middle"
                className="t-d-bpmn__edgetext"
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}
      {front.map(element)}
    </svg>
  );
}

export type ProcessSummary = {
  file: string;
  name: string;
  shapes: number;
  edges: number;
  lanes: number;
  warnings: number;

  records: number | null;
  updatedAt: string;
  thumb: ProcessDiagram;
};

export type ProcessCollectionProps = {
  state: CollectionState;
  view: "gallery" | "table";
  items: ProcessSummary[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  withWarnings: number;
  mobile?: boolean;
  onView?: (v: "gallery" | "table") => void;
  onQuery?: (q: string) => void;
  onOpen?: (file: string) => void;
  onPage?: (p: number) => void;
  onReset?: () => void;
};

export function ProcessCollection({
  state,
  view,
  items,
  total,
  page,
  pageSize,
  query,
  withWarnings,
  mobile,
  onView = noop,
  onQuery = noop,
  onOpen = noop,
  onPage = noop,
  onReset = noop,
}: ProcessCollectionProps) {
  const { t, plural, number } = useText();
  return (
    <div className="t-page t-stack" style={{ gap: 20 }}>
      <PluginHead
        icon="process"
        title={t("d.proc.title")}
        count={number(total)}
        sentence={
          total ? t("d.proc.sentence", { with: withWarnings, total }) : t("d.proc.sentenceNone")
        }
      />
      <Collection
        state={state}
        toolbar={
          state === "empty" ? null : (
            <CollectionToolbar<"gallery" | "table">
              query={query}
              queryLabel={t("d.proc.search")}
              placeholder={t("d.proc.searchPlaceholder")}
              facets={[
                { key: "warn", label: t("d.proc.facet.warn"), count: withWarnings },
                { key: "records", label: t("d.proc.facet.records") },
              ]}
              views={[
                { value: "gallery", label: t("d.proc.view.gallery"), icon: "grid" },
                { value: "table", label: t("d.proc.view.table"), icon: "table" },
              ]}
              view={view}
              sortLabel="name"
              onQuery={onQuery}
              onView={onView}
              onReset={onReset}
            />
          )
        }
        empty={{
          icon: "process",
          title: t("d.proc.empty.title"),
          body: (
            <>
              {t("d.proc.empty.before")}
              <span className="t-mono">.bpmn</span>
              {t("d.proc.empty.middle")}
              <span className="t-mono">docs/bpmn/</span>
              {t("d.proc.empty.after")}
            </>
          ),
          action: (
            <Button icon="external" onClick={onReset}>
              {t("d.proc.empty.sample")}
            </Button>
          ),
        }}
        filteredEmpty={{ query, onReset }}
        pagination={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            compact={mobile}
            onPage={onPage}
          />
        }
      >
        {view === "gallery" || mobile ? (
          <div className="t-d-gallery t-stagger">
            {items.map((p) => (
              <button
                key={p.file}
                type="button"
                className="t-d-procard t-interactive"
                onClick={() => onOpen(p.file)}
              >
                <span className="t-d-procard__thumb">
                  <ProcessCanvas
                    diagram={p.thumb}
                    thumb
                    label={t("d.proc.thumb", { name: p.name })}
                  />
                </span>
                <span className="t-d-procard__name t-wrap">{p.name}</span>
                <span className="t-mono t-meta t-wrap">{p.file}</span>
                <span className="t-row t-row--wrap t-meta t-d-procard__meta" style={{ gap: 10 }}>
                  <span>{plural("d.proc.shapes", p.shapes)}</span>
                  <span>{plural("d.proc.flows", p.edges)}</span>
                  <span>{plural("d.proc.lanes", p.lanes)}</span>
                  {p.warnings ? (
                    <Badge tone="warn">{plural("d.proc.findings", p.warnings)}</Badge>
                  ) : (
                    <Badge tone="ok">{t("d.proc.clean")}</Badge>
                  )}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <DataTable<ProcessSummary>
            label={t("d.proc.title")}
            rows={items}
            rowKey={(p) => p.file}
            onRowClick={(p) => onOpen(p.file)}
            sort={{ key: "name", dir: "asc" }}
            columns={[
              {
                key: "name",
                label: t("d.proc.col.process"),
                sortable: true,
                render: (p) => (
                  <span className="t-row" style={{ gap: 10 }}>
                    <span className="t-d-minithumb">
                      <ProcessCanvas
                        diagram={p.thumb}
                        thumb
                        label={t("d.proc.thumb", { name: p.name })}
                      />
                    </span>
                    <span className="t-stack" style={{ gap: 0 }}>
                      <span>{p.name}</span>
                      <span className="t-mono t-meta">{p.file}</span>
                    </span>
                  </span>
                ),
              },
              {
                key: "shapes",
                label: t("d.proc.col.shapes"),
                numeric: true,
                sortable: true,
                render: (p) => p.shapes,
              },
              {
                key: "edges",
                label: t("d.proc.col.flows"),
                numeric: true,
                sortable: true,
                render: (p) => p.edges,
              },
              { key: "lanes", label: t("d.proc.col.lanes"), numeric: true, render: (p) => p.lanes },
              {
                key: "warnings",
                label: t("d.proc.col.findings"),
                numeric: true,
                sortable: true,
                render: (p) => (p.warnings ? <span className="t-warn">{p.warnings}</span> : "0"),
              },
              { key: "records", label: "records", numeric: true, render: (p) => p.records ?? "—" },
              {
                key: "updatedAt",
                label: t("d.proc.col.changed"),
                sortable: true,
                render: (p) => <span className="t-mono">{p.updatedAt}</span>,
              },
            ]}
          />
        )}
      </Collection>
    </div>
  );
}

export type ProcessMetrics = {
  elements: number;
  flows: number;
  lanes: number;

  paths: number | null;
  longest: number | null;
};

export type ProcessWorkspaceProps = {
  name: string;
  file: string;
  diagram: ProcessDiagram;
  metrics: ProcessMetrics;
  selected?: string | null;
  walk?: ProcessWalk | null;
  panel: "detail" | "walkthrough";
  findings: ProcessFinding[];
  findingsOpen?: boolean;
  outlineQuery: string;
  zoom: number;

  viewport?: { x: number; y: number; w: number; h: number };
  linked: Record<string, { id: string; summary: string }[]>;
  docs?: Record<string, string>;

  diagrams?: { id: string; name: string; elements: number }[];
  activeDiagram?: string;
  mobile?: boolean;
  outlineOpen?: boolean;
  onDiagram?: (id: string) => void;
  onSelect?: (id: string | null) => void;
  onPanel?: (p: "detail" | "walkthrough") => void;
  onZoom?: (dir: "in" | "out" | "fit") => void;
  onOutlineQuery?: (q: string) => void;
  onOutline?: () => void;
  onFindings?: () => void;
  onWalk?: (action: "start" | "next" | "back" | "stop" | "choose", edge?: string) => void;
  onOpenRecord?: (id: string) => void;
  onBack?: () => void;
};

function Outline({
  diagram,
  query,
  selected,
  onQuery,
  onSelect,
}: {
  diagram: ProcessDiagram;
  query: string;
  selected?: string | null;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useText();
  const kindLabel = useKindLabel();
  const q = query.trim().toLowerCase();

  const nameOf = (s: BpmnShape) => s.label || kindLabel(s.kind);
  const pools = diagram.shapes.filter((s) => s.kind === "participant");
  const groups: [string, (k: string) => boolean][] = [
    ["Start", (k) => k === "startEvent"],
    [t("d.proc.group.tasks"), isTask],
    ["Gateways", (k) => /gateway/i.test(k)],
    [t("d.proc.kind.endEvent"), (k) => k === "endEvent"],
    [t("d.proc.group.annotations"), (k) => k === "textAnnotation"],
  ];
  return (
    <nav className="t-d-outline" aria-label={t("d.proc.outline")}>
      <SearchField
        label={t("d.proc.searchElements")}
        value={query}
        placeholder="Element …"
        onChange={onQuery}
      />
      {pools.map((p) => {
        const inPool = diagram.shapes.filter(
          (s) => s.lane === p.id && (!q || nameOf(s).toLowerCase().includes(q)),
        );
        return (
          <section key={p.id} className="t-d-outline__pool">
            <span className="t-label t-row" style={{ gap: 6 }}>
              <Icon name="layers" size={12} /> {p.label}
            </span>
            {groups.map(([label, test]) => {
              const els = inPool.filter((s) => test(s.kind));
              if (!els.length) return null;
              return (
                <div key={label} className="t-d-outline__group">
                  <span className="t-meta">
                    {label} · {els.length}
                  </span>
                  {els.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="t-d-outline__el"
                      aria-pressed={selected === s.id}
                      onClick={() => onSelect(s.id)}
                    >
                      <ElementGlyph s={s} />
                      <span className="t-wrap">
                        {s.label || <em className="t-muted">{nameOf(s)}</em>}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </nav>
  );
}

function Detail({
  diagram,
  selected,
  linked,
  docs,
  onSelect,
  onOpenRecord,
}: {
  diagram: ProcessDiagram;
  selected?: string | null;
  linked: ProcessWorkspaceProps["linked"];
  docs?: Record<string, string>;
  onSelect: (id: string | null) => void;
  onOpenRecord: (id: string) => void;
}) {
  const { t } = useText();
  const kindLabel = useKindLabel();
  const s = diagram.shapes.find((x) => x.id === selected);
  if (!s) {
    return (
      <EmptyState
        plain
        icon="info"
        title={t("d.proc.noElement")}
        body={t("d.proc.noElementBody")}
      />
    );
  }
  const byId = (id?: string) => diagram.shapes.find((x) => x.id === id);
  const incoming = diagram.edges.filter((e) => e.to === s.id);
  const outgoing = diagram.edges.filter((e) => e.from === s.id);
  const lane = byId(s.lane);
  const recs = linked[s.id] ?? [];
  const flow = (e: BpmnEdge, other?: BpmnShape) => (
    <button
      key={e.id}
      type="button"
      className="t-d-flow"
      onClick={() => onSelect(other?.id ?? null)}
    >
      <span className="t-d-flow__kind" data-kind={e.kind}>
        {kindLabel(e.kind)}
      </span>
      <span className="t-wrap">{other?.label || "—"}</span>
      {e.label ? <Badge plain>{e.label}</Badge> : null}
    </button>
  );
  return (
    <div className="t-stack t-anim-rise" style={{ gap: 14 }} data-testid="process-detail">
      <div className="t-stack" style={{ gap: 4 }}>
        <span className="t-eyebrow">{kindLabel(s.kind)}</span>
        <span className="t-h2">
          {s.label || <em className="t-muted">{t("d.proc.unnamed")}</em>}
        </span>
      </div>
      <Facts
        rows={[
          [t("d.proc.lane"), lane?.label ?? "—"],
          [
            "id",
            <span key="i" className="t-mono">
              {s.id}
            </span>,
          ],
          ["Position", <span key="p" className="t-mono">{`${s.x}, ${s.y} · ${s.w}×${s.h}`}</span>],
        ]}
      />
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("d.proc.incoming", { count: incoming.length })}</span>
        {incoming.length ? (
          incoming.map((e) => flow(e, byId(e.from)))
        ) : (
          <span className="t-meta">{t("d.proc.noneStart")}</span>
        )}
      </div>
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("d.proc.outgoing", { count: outgoing.length })}</span>
        {outgoing.length ? (
          outgoing.map((e) => flow(e, byId(e.to)))
        ) : (
          <span className="t-meta">{t("d.proc.noneEnd")}</span>
        )}
      </div>
      {docs?.[s.id] ? (
        <div className="t-stack" style={{ gap: 6 }}>
          <span className="t-label">{t("d.proc.docs")}</span>
          <p className="t-ink2">{docs[s.id]}</p>
        </div>
      ) : null}
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("d.proc.linked", { count: recs.length })}</span>
        {recs.length ? (
          recs.map((r) => (
            <button
              key={r.id}
              type="button"
              className="t-d-recordlink"
              onClick={() => onOpenRecord(r.id)}
            >
              <span className="t-mono t-wrap">{r.id}</span>
              <span className="t-meta t-clamp-2">{r.summary}</span>
            </button>
          ))
        ) : (
          <span className="t-meta">{t("d.proc.noRecord")}</span>
        )}
      </div>
    </div>
  );
}

function Walkthrough({
  walk,
  onWalk,
}: {
  walk?: ProcessWalk | null;
  onWalk: NonNullable<ProcessWorkspaceProps["onWalk"]>;
}) {
  const { t } = useText();
  const kindLabel = useKindLabel();
  if (!walk) {
    return (
      <EmptyState
        plain
        icon="play"
        title={t("d.proc.walk")}
        body={t("d.proc.walkBody")}
        action={
          <Button variant="primary" icon="play" onClick={() => onWalk("start")}>
            {t("d.proc.walkStart")}
          </Button>
        }
      />
    );
  }
  return (
    <div className="t-stack" style={{ gap: 12 }} data-testid="process-walk">
      <div className="t-row t-row--between">
        <span className="t-h3">
          {t("d.proc.step", { step: walk.step })}
          <span className="t-muted">{t("d.proc.stepOf", { total: walk.total })}</span>
        </span>
        <div className="t-row" style={{ gap: 4 }}>
          <IconButton
            icon="back"
            label={t("d.proc.stepBack")}
            size="small"
            disabled={walk.step <= 1}
            onClick={() => onWalk("back")}
          />
          <IconButton
            icon="step"
            label={t("d.proc.stepNext")}
            size="small"
            disabled={!!walk.choices?.length || walk.step >= walk.total}
            onClick={() => onWalk("next")}
          />
          <IconButton
            icon="stop"
            label={t("d.proc.walkStop")}
            size="small"
            onClick={() => onWalk("stop")}
          />
        </div>
      </div>
      <div className="t-d-walkbar" aria-hidden="true">
        <span style={{ width: `${(walk.step / walk.total) * 100}%` }} />
      </div>
      <ol className="t-d-walklog">
        {walk.log.map((l, i) => (
          <li key={l.id} data-current={l.id === walk.current || undefined}>
            <span className="t-d-walklog__n t-mono">{i + 1}</span>
            <span className="t-stack" style={{ gap: 0 }}>
              <span>{l.label}</span>
              <span className="t-meta">{kindLabel(l.kind)}</span>
            </span>
          </li>
        ))}
      </ol>
      {walk.choices?.length ? (
        <div className="t-d-choice" role="group" aria-label={t("d.proc.chooseBranch")}>
          <span className="t-label">{t("d.proc.chooseBranch")}</span>
          {walk.choices.map((c) => (
            <Button key={c.edge} icon="branch" onClick={() => onWalk("choose", c.edge)}>
              {c.label} → {c.target}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Findings({
  findings,
  open,
  onToggle,
  onSelect,
}: {
  findings: ProcessFinding[];
  open?: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useText();
  const errors = findings.filter((f) => f.severity === "Error").length;
  return (
    <section
      className="t-d-pfind"
      data-open={open || undefined}
      aria-label={t("d.proc.parserFindings")}
    >
      <button type="button" className="t-d-pfind__head" aria-expanded={!!open} onClick={onToggle}>
        <Icon name={findings.length ? "warning" : "check"} size={14} />
        <span>{t("d.proc.parserFindings")}</span>
        <Badge tone={errors ? "bad" : findings.length ? "warn" : "ok"}>{findings.length}</Badge>
        <span className="t-spacer" />
        <Icon name={open ? "chevronDown" : "up"} size={14} />
      </button>
      {open ? (
        <ul className="t-d-pfind__list">
          {findings.map((f) => (
            <li key={f.key} data-severity={f.severity}>
              <Badge
                tone={
                  f.severity === "Error" ? "bad" : f.severity === "Warning" ? "warn" : "neutral"
                }
              >
                {t(SEVERITY_KEY[f.severity])}
              </Badge>
              <span>{f.text}</span>
              <span className="t-spacer" />
              {f.element ? (
                <Button
                  size="small"
                  variant="quiet"
                  icon="eye"
                  onClick={() => onSelect(f.element as string)}
                >
                  {t("d.proc.show")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Minimap({
  diagram,
  viewport,
}: {
  diagram: ProcessDiagram;
  viewport: { x: number; y: number; w: number; h: number };
}) {
  const { t } = useText();
  const { box } = diagram;
  return (
    <svg
      className="t-d-minimap"
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={t("d.proc.minimap")}
    >
      {diagram.shapes.map((s) => (
        <rect
          key={s.id}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={s.kind === "participant" ? 4 : 2}
          data-kind={s.kind}
        />
      ))}
      <rect
        className="t-d-minimap__view"
        x={viewport.x}
        y={viewport.y}
        width={viewport.w}
        height={viewport.h}
      />
    </svg>
  );
}

export function ProcessWorkspace({
  name,
  file,
  diagram,
  metrics,
  selected,
  walk,
  panel,
  findings,
  findingsOpen,
  outlineQuery,
  zoom,
  viewport,
  linked,
  docs,
  diagrams = [],
  activeDiagram,
  mobile,
  outlineOpen,
  onDiagram = noop,
  onSelect = noop,
  onPanel = noop,
  onZoom = noop,
  onOutlineQuery = noop,
  onOutline = noop,
  onFindings = noop,
  onWalk = noop,
  onOpenRecord = noop,
  onBack = noop,
}: ProcessWorkspaceProps) {
  const { t, plural, number } = useText();
  const side: ReactNode = (
    <>
      <Tabs<"detail" | "walkthrough">
        label={t("d.proc.sidebar")}
        value={panel}
        onChange={onPanel}
        items={[
          { value: "detail", label: "Element" },
          {
            value: "walkthrough",
            label: t("d.proc.walk"),
            count: walk ? `${walk.step}/${walk.total}` : undefined,
          },
        ]}
      />
      {panel === "detail" ? (
        <Detail
          diagram={diagram}
          selected={selected}
          linked={linked}
          docs={docs}
          onSelect={onSelect}
          onOpenRecord={onOpenRecord}
        />
      ) : (
        <Walkthrough walk={walk} onWalk={onWalk} />
      )}
    </>
  );
  const outline = (
    <Outline
      diagram={diagram}
      query={outlineQuery}
      selected={selected}
      onQuery={onOutlineQuery}
      onSelect={onSelect}
    />
  );
  const stats = [
    { key: "elements", value: number(metrics.elements), label: t("d.proc.stat.elements") },
    { key: "flows", value: number(metrics.flows), label: t("d.proc.col.flows") },
    { key: "lanes", value: number(metrics.lanes), label: t("d.proc.col.lanes") },
    {
      key: "paths",
      value: metrics.paths == null ? "—" : number(metrics.paths),
      label: t("d.proc.stat.paths"),
    },
    {
      key: "longest",
      value: metrics.longest == null ? "—" : number(metrics.longest),
      label: t("d.proc.stat.longest"),
    },
  ];

  const zoomBar = (
    <div
      className="t-d-proc__zoom"
      role="toolbar"
      aria-label="Zoom"
      data-compact={mobile || undefined}
    >
      <IconButton
        icon="zoomOut"
        label={t("d.proc.zoomOut")}
        size="small"
        onClick={() => onZoom("out")}
      />
      <span className="t-mono t-meta" data-testid="zoom">
        {t("shell.percent", { value: zoom })}
      </span>
      <IconButton
        icon="zoomIn"
        label={t("d.proc.zoomIn")}
        size="small"
        onClick={() => onZoom("in")}
      />
      <IconButton icon="fit" label={t("d.proc.fit")} size="small" onClick={() => onZoom("fit")} />
    </div>
  );
  return (
    <div className="t-d-proc" data-mobile={mobile || undefined}>
      <header className="t-d-proc__top">
        <IconButton icon="back" label={t("d.proc.all")} onClick={onBack} />
        <div className="t-stack" style={{ gap: 0, minWidth: 0 }}>
          <span className="t-h3 t-wrap">{name}</span>
          <span className="t-mono t-meta t-wrap">{file}</span>
        </div>
        <span className="t-spacer" />
        {mobile ? null : (
          <div className="t-d-proc__stats">
            <Stat value={metrics.elements} label={t("d.proc.stat.elements")} />
            <Stat value={metrics.flows} label={t("d.proc.col.flows")} />
            <Stat value={metrics.lanes} label={t("d.proc.col.lanes")} />
            <Stat value={metrics.paths ?? "—"} label={t("d.proc.stat.paths")} />
            <Stat value={metrics.longest ?? "—"} label={t("d.proc.stat.longest")} />
          </div>
        )}
        <Button
          variant={walk ? "default" : "primary"}
          icon={walk ? "stop" : "play"}
          onClick={() => onWalk(walk ? "stop" : "start")}
        >
          {walk ? t("d.proc.walkStop") : t("d.proc.walk")}
        </Button>
      </header>
      {diagrams.length > 1 ? (
        <nav className="t-d-chipbar t-d-proc__diagrams" aria-label={t("d.proc.diagramsHere")}>
          <span className="t-label">{plural("d.proc.diagrams", diagrams.length)}</span>
          {diagrams.map((d) => (
            <Chip
              key={d.id}
              icon="process"
              pressed={d.id === activeDiagram}
              count={d.elements}
              onClick={() => onDiagram(d.id)}
            >
              {d.name}
            </Chip>
          ))}
        </nav>
      ) : null}
      {mobile ? (
        <div className="t-d-mobilebar t-d-proc__mobilebar">
          <Button size="small" icon="tree" onClick={onOutline}>
            {t("d.proc.outline")}
          </Button>
          {zoomBar}
          <ul className="t-d-proc__mstats" data-testid="process-mobile-stats">
            {stats.map((s) => (
              <li key={s.key}>
                <span className="t-mono">{s.value}</span> {s.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="t-d-proc__body">
        {mobile ? null : <aside className="t-d-proc__left">{outline}</aside>}
        <div className="t-d-proc__canvas" data-zoom={zoom}>
          <div className="t-d-proc__stage" style={{ transform: `scale(${zoom / 100})` }}>
            <ProcessCanvas
              diagram={diagram}
              selected={selected}
              walk={walk}
              label={t("d.proc.diagram", { name })}
              onSelect={onSelect}
            />
          </div>
          {mobile ? null : zoomBar}
          {viewport && !mobile ? (
            <div className="t-d-proc__mini">
              <Minimap diagram={diagram} viewport={viewport} />
            </div>
          ) : null}
        </div>
        {mobile ? null : <aside className="t-d-proc__right">{side}</aside>}
      </div>
      <Findings
        findings={findings}
        open={findingsOpen}
        onToggle={onFindings}
        onSelect={(id) => onSelect(id)}
      />
      {mobile ? (
        <>
          <Sheet open={!!outlineOpen} side="bottom" title={t("d.proc.outline")} onClose={onOutline}>
            {outline}
          </Sheet>
          <Sheet
            open={!!selected || !!walk}
            side="bottom"
            title={walk ? t("d.proc.walk") : "Element"}
            onClose={() => (walk ? onWalk("stop") : onSelect(null))}
            modal={false}
          >
            {side}
          </Sheet>
        </>
      ) : null}
    </div>
  );
}

export function ProcessUnreadable({
  file,
  error,
  line,
  excerpt,
  onBack = noop,
  onRetry = noop,
}: {
  file: string;
  error: string;
  line: number;
  excerpt: { n: number; text: string }[];
  onBack?: () => void;
  onRetry?: () => void;
}) {
  const { t } = useText();
  return (
    <div className="t-page t-stack" style={{ gap: 20 }}>
      <PluginHead
        icon="process"
        title={t("d.proc.unreadable")}
        sentence={<span className="t-mono">{file}</span>}
        actions={
          <>
            <Button variant="quiet" icon="back" onClick={onBack}>
              {t("d.proc.all")}
            </Button>
            <Button variant="primary" icon="refresh" onClick={onRetry}>
              {t("d.proc.reread")}
            </Button>
          </>
        }
      />
      <div className="t-d-banner" data-tone="bad" role="alert">
        <Icon name="error" size={18} />
        <div className="t-stack" style={{ gap: 2 }}>
          <strong>{t("d.proc.rejected")}</strong>
          <span>{t("d.proc.errorLine", { error, line })}</span>
          <span className="t-meta">{t("d.proc.othersFine")}</span>
        </div>
      </div>
      <pre className="t-d-excerpt" aria-label={t("d.proc.excerpt")}>
        {excerpt.map((l) => (
          <span key={l.n} data-bad={l.n === line || undefined}>
            <span className="t-d-excerpt__n">{l.n}</span>
            {l.text}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
