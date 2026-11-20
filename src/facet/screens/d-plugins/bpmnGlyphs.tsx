import type { ReactNode } from "react";
import type { BpmnEdge, BpmnLabel, BpmnShape } from "./Processes";

export type BpmnForm =
  | "roundrect"
  | "circle"
  | "diamond"
  | "document"
  | "datastore"
  | "bracket"
  | "group"
  | "pool"
  | "lane"
  | "rect";

const FORMS = new Set<string>([
  "roundrect",
  "circle",
  "diamond",
  "document",
  "datastore",
  "bracket",
  "group",
  "pool",
  "lane",
  "rect",
]);

const TASK_SYMBOL: Record<string, string> = {
  userTask: "user",
  manualTask: "manual",
  serviceTask: "service",
  scriptTask: "script",
  businessRuleTask: "business-rule",
  sendTask: "send",
  receiveTask: "receive",
};
const GATEWAY_SYMBOL: Record<string, string> = {
  exclusiveGateway: "exclusive",
  inclusiveGateway: "inclusive",
  parallelGateway: "parallel",
  complexGateway: "complex",
  eventBasedGateway: "event-based",
};
const SUBPROCESS = new Set(["subProcess", "adHocSubProcess", "transaction", "callActivity"]);

export const isTask = (k: string) => /task$/i.test(k);
export const isSubprocess = (k: string) => SUBPROCESS.has(k);

export function formOf(s: Pick<BpmnShape, "kind" | "form">): BpmnForm {
  if (s.form && FORMS.has(s.form)) return s.form as BpmnForm;
  const k = s.kind;
  if (k === "participant") return "pool";
  if (k === "lane") return "lane";
  if (/Event$/.test(k)) return "circle";
  if (/Gateway$/.test(k)) return "diamond";
  if (k === "textAnnotation") return "bracket";
  if (k === "group") return "group";
  if (k === "dataStoreReference") return "datastore";
  if (/^data(Object|ObjectReference|Input|Output)$/.test(k)) return "document";

  return "roundrect";
}

export function borderOf(s: BpmnShape): string {
  if (s.border) return s.border;
  if (s.kind === "endEvent" || s.kind === "callActivity") return "thick";
  if (/^intermediate|^boundary/.test(s.kind) || s.kind === "transaction") return "double";
  return "single";
}

export function symbolOf(s: BpmnShape): string {
  if (s.symbol != null) return s.symbol;
  if (s.form) return "";
  return TASK_SYMBOL[s.kind] ?? GATEWAY_SYMBOL[s.kind] ?? "";
}

export const filledOf = (s: BpmnShape) =>
  s.filled ?? (s.kind === "endEvent" || s.kind === "intermediateThrowEvent");

export const isExpanded = (s: BpmnShape) =>
  isSubprocess(s.kind) && !!s.form && !(s.markers ?? []).includes("collapsed");

export function isContainer(s: BpmnShape): boolean {
  const f = formOf(s);
  return f === "pool" || f === "lane" || f === "group" || isExpanded(s);
}

const LINE = 13;

export function PlacedLabel({
  box,
  className = "t-d-bpmn__text",
}: {
  box: BpmnLabel;
  className?: string;
}) {
  const lines = box.lines.length ? box.lines : [""];
  if (box.vertical) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    return (
      <text
        x={cx}
        y={cy}
        transform={`rotate(-90 ${cx} ${cy})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className={className}
      >
        {lines.join(" ")}
      </text>
    );
  }
  const left = box.align === "left";
  const x = left ? box.x + 4 : box.x + box.w / 2;
  const top = box.y + (box.h - lines.length * LINE) / 2 + LINE - 3;
  return (
    <text x={x} y={top} textAnchor={left ? "start" : "middle"} className={className}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : LINE}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function wrap(label: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of label.split(/\s+/)) {
    if (line && (line + " " + w).length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out.slice(0, 4);
}

const EVENT_GLYPH: Record<string, (filled: boolean) => ReactNode> = {
  message: (f) => (
    <>
      <rect x={-7} y={-5} width={14} height={10} className={f ? "t-d-bpmn__ink" : undefined} />
      <path d="M-7 -5 L0 1 L7 -5" className={f ? "t-d-bpmn__inkline" : undefined} />
    </>
  ),
  timer: () => (
    <>
      <circle r={8} />
      <path d="M0 -5 V0 L4 2" />
    </>
  ),
  error: (f) => (
    <path d="M-6 7 L-2 -5 L2 1 L6 -7 L2 5 L-2 -1 Z" className={f ? "t-d-bpmn__ink" : undefined} />
  ),
  escalation: (f) => (
    <path d="M0 -7 L6 7 L0 2 L-6 7 Z" className={f ? "t-d-bpmn__ink" : undefined} />
  ),
  cancel: (f) => (
    <path
      d="M-6 -4 L-4 -6 L0 -2 L4 -6 L6 -4 L2 0 L6 4 L4 6 L0 2 L-4 6 L-6 4 L-2 0 Z"
      className={f ? "t-d-bpmn__ink" : undefined}
    />
  ),
  compensation: (f) => (
    <path d="M-1 -5 L-8 0 L-1 5 Z M7 -5 L0 0 L7 5 Z" className={f ? "t-d-bpmn__ink" : undefined} />
  ),
  conditional: () => (
    <>
      <rect x={-5} y={-7} width={10} height={14} />
      <path d="M-3 -4 H3 M-3 -1 H3 M-3 2 H3 M-3 5 H3" />
    </>
  ),
  link: (f) => (
    <path d="M-7 -3 H1 V-7 L7 0 L1 7 V3 H-7 Z" className={f ? "t-d-bpmn__ink" : undefined} />
  ),
  signal: (f) => <path d="M0 -7 L7 6 H-7 Z" className={f ? "t-d-bpmn__ink" : undefined} />,
  terminate: () => <circle r={8} className="t-d-bpmn__ink" />,
  multiple: (f) => (
    <path d="M0 -7 L7 -2 L4 6 H-4 L-7 -2 Z" className={f ? "t-d-bpmn__ink" : undefined} />
  ),
  "parallel-multiple": (f) => (
    <path
      d="M-2 -7 H2 V-2 H7 V2 H2 V7 H-2 V2 H-7 V-2 H-2 Z"
      className={f ? "t-d-bpmn__ink" : undefined}
    />
  ),
};

const GATEWAY_GLYPH: Record<string, ReactNode> = {
  exclusive: <path d="M-6 -6 L6 6 M6 -6 L-6 6" className="t-d-bpmn__gwmark" />,
  parallel: <path d="M0 -9 V9 M-9 0 H9" className="t-d-bpmn__gwmark" />,
  inclusive: <circle r={8} className="t-d-bpmn__gwmark t-d-bpmn__hollow" />,
  complex: <path d="M0 -9 V9 M-9 0 H9 M-6 -6 L6 6 M6 -6 L-6 6" className="t-d-bpmn__gwmark" />,
  "event-based": (
    <>
      <circle r={10} className="t-d-bpmn__hollow t-d-bpmn__thin" />
      <circle r={8} className="t-d-bpmn__hollow t-d-bpmn__thin" />
      <path d="M0 -5 L5 -1.5 L3 4.5 H-3 L-5 -1.5 Z" className="t-d-bpmn__hollow t-d-bpmn__thin" />
    </>
  ),
  "event-based-start": (
    <>
      <circle r={10} className="t-d-bpmn__hollow t-d-bpmn__thin" />
      <path d="M0 -5 L5 -1.5 L3 4.5 H-3 L-5 -1.5 Z" className="t-d-bpmn__hollow t-d-bpmn__thin" />
    </>
  ),
  "parallel-event-based-start": (
    <>
      <circle r={10} className="t-d-bpmn__hollow t-d-bpmn__thin" />
      <path d="M0 -6 V6 M-6 0 H6" className="t-d-bpmn__gwmark" />
    </>
  ),
};

const TASK_GLYPH: Record<string, ReactNode> = {
  user: (
    <>
      <circle cx={7} cy={4} r={3} />
      <path d="M1 13 C1 8 13 8 13 13 Z" />
    </>
  ),
  manual: <path d="M1 7 H9 M1 10 H10 M1 13 H8 M1 4 H11 Q13 4 13 6 V13" />,
  service: (
    <>
      <circle cx={7} cy={7} r={4.5} />
      <circle cx={7} cy={7} r={1.6} />
      <path d="M7 0.5 V3 M7 11 V13.5 M0.5 7 H3 M11 7 H13.5" />
    </>
  ),
  script: (
    <path d="M3 1 H12 Q9 4 11 7 Q13 10 10 13 H1 Q4 10 2 7 Q0 4 3 1 Z M4 4 H9 M4 7 H10 M4 10 H9" />
  ),
  "business-rule": (
    <>
      <rect x={1} y={2} width={12} height={10} />
      <path d="M1 5 H13 M5 5 V12" />
    </>
  ),
  send: (
    <>
      <rect x={1} y={3} width={12} height={8} className="t-d-bpmn__ink" />
      <path d="M1 3 L7 8 L13 3" className="t-d-bpmn__inkline" />
    </>
  ),
  receive: (
    <>
      <rect x={1} y={3} width={12} height={8} />
      <path d="M1 3 L7 8 L13 3" />
    </>
  ),
  "receive-instantiate": (
    <>
      <circle cx={7} cy={7} r={7} />
      <rect x={3} y={4.5} width={8} height={5} />
      <path d="M3 4.5 L7 7.5 L11 4.5" />
    </>
  ),
};

const MARKER_GLYPH: Record<string, ReactNode> = {
  loop: <path d="M9 3 A4.5 4.5 0 1 0 10 8 M9 0 V3 H12" />,
  parallel: <path d="M3 1 V11 M6 1 V11 M9 1 V11" />,
  sequential: <path d="M1 3 H11 M1 6 H11 M1 9 H11" />,
  compensation: <path d="M5 2 L0 6 L5 10 Z M11 2 L6 6 L11 10 Z" />,
  adhoc: <path d="M0 7 Q3 3 6 6 T12 5" />,
  collapsed: (
    <>
      <rect x={0} y={0} width={12} height={12} />
      <path d="M6 3 V9 M3 6 H9" />
    </>
  ),
};

function Markers({ s, x, y }: { s: BpmnShape; x: number; y: number }) {
  const list = (s.markers ?? []).filter((m) => Object.hasOwn(MARKER_GLYPH, m));
  if (!list.length) return null;
  const step = 15;
  const left = x - (list.length * step - 3) / 2;
  return (
    <g className="t-d-bpmn__marker">
      {list.map((m, i) => (
        <g
          key={m}
          transform={`translate(${left + i * step} ${y})`}
          data-testid={`marker-${s.id}-${m}`}
        >
          {MARKER_GLYPH[m]}
        </g>
      ))}
    </g>
  );
}

function label(s: BpmnShape, thumb: boolean | undefined, fallback: () => ReactNode) {
  if (thumb || !s.label) return null;
  if (s.labelBox) return <PlacedLabel box={s.labelBox} />;
  return fallback();
}

function centred(lines: string[], cx: number, y: number) {
  return (
    <text x={cx} y={y} textAnchor="middle" className="t-d-bpmn__text">
      {lines.map((l, i) => (
        <tspan key={i} x={cx} dy={i === 0 ? 0 : LINE}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function Event({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const r = Math.min(s.w, s.h) / 2;
  const border = borderOf(s);
  const ring =
    s.kind === "endEvent"
      ? "t-d-bpmn__end"
      : s.kind === "startEvent"
        ? "t-d-bpmn__start"
        : "t-d-bpmn__event";
  const dash = s.dashed ? " t-d-bpmn--dashed" : "";
  const sym = symbolOf(s);
  const glyph = Object.hasOwn(EVENT_GLYPH, sym) ? EVENT_GLYPH[sym] : undefined;
  return (
    <g data-border={border}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className={ring + dash}
        data-thick={border === "thick" || undefined}
      />
      {border === "double" ? (
        <circle cx={cx} cy={cy} r={Math.max(1, r - 3)} className={`t-d-bpmn__ring${dash}`} />
      ) : null}
      {glyph && !thumb ? (
        <g
          className="t-d-bpmn__symbol"
          transform={`translate(${cx} ${cy}) scale(${r / 18})`}
          data-testid={`symbol-${s.id}`}
          data-symbol={sym}
          data-filled={filledOf(s) || undefined}
        >
          {glyph(filledOf(s))}
        </g>
      ) : null}
      {label(s, thumb, () => centred([s.label], cx, s.y + s.h + 14))}
    </g>
  );
}

function Gateway({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const sym = symbolOf(s);
  const glyph = Object.hasOwn(GATEWAY_GLYPH, sym) ? GATEWAY_GLYPH[sym] : null;
  return (
    <g>
      <path
        d={`M${cx} ${s.y} L${s.x + s.w} ${cy} L${cx} ${s.y + s.h} L${s.x} ${cy} Z`}
        className="t-d-bpmn__gw"
      />
      {glyph ? (
        <g
          className="t-d-bpmn__symbol"
          transform={`translate(${cx} ${cy}) scale(${s.w / 50})`}
          data-testid={thumb ? undefined : `symbol-${s.id}`}
          data-symbol={sym}
        >
          {glyph}
        </g>
      ) : null}
      {label(s, thumb, () => centred([s.label], cx, s.y - 8))}
    </g>
  );
}

function Activity({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const border = borderOf(s);
  const expanded = isExpanded(s);
  const sym = symbolOf(s);
  const glyph = Object.hasOwn(TASK_GLYPH, sym) ? TASK_GLYPH[sym] : null;
  const dotted = border === "dotted" ? " t-d-bpmn--dotted" : "";
  const lines = wrap(s.label, Math.max(10, Math.floor(s.w / 7.2)));
  return (
    <g data-border={border} data-expanded={expanded || undefined}>
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={10}
        className={(expanded ? "t-d-bpmn__sub" : "t-d-bpmn__task") + dotted}
        data-thick={border === "thick" || undefined}
      />
      {border === "double" ? (
        <rect
          x={s.x + 3}
          y={s.y + 3}
          width={Math.max(0, s.w - 6)}
          height={Math.max(0, s.h - 6)}
          rx={8}
          className="t-d-bpmn__ring"
        />
      ) : null}
      {glyph && !thumb ? (
        <g
          className="t-d-bpmn__symbol t-d-bpmn__tasksym"
          transform={`translate(${s.x + 6} ${s.y + 6})`}
          data-testid={`symbol-${s.id}`}
          data-symbol={sym}
        >
          {glyph}
        </g>
      ) : null}
      {thumb || !s.label ? null : expanded ? (
        s.labelBox ? (
          <PlacedLabel box={s.labelBox} />
        ) : (
          <text x={s.x + 10} y={s.y + 18} className="t-d-bpmn__text">
            {s.label}
          </text>
        )
      ) : s.labelBox ? (
        <PlacedLabel box={s.labelBox} />
      ) : (
        centred(lines, cx, cy - ((lines.length - 1) * LINE) / 2 + 4)
      )}
      {thumb ? null : <Markers s={s} x={cx} y={s.y + s.h - 15} />}
    </g>
  );
}

function Swimlane({ s, thumb, pool }: { s: BpmnShape; thumb?: boolean; pool: boolean }) {
  const head = 28;
  const cy = s.y + s.h / 2;
  return (
    <g>
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={pool ? 6 : 0}
        className={pool ? "t-d-bpmn__pool" : "t-d-bpmn__lane"}
      />
      <line
        x1={s.x + head}
        y1={s.y}
        x2={s.x + head}
        y2={s.y + s.h}
        className="t-d-bpmn__poolline"
      />
      {thumb || !s.label ? null : s.labelBox ? (
        <PlacedLabel box={s.labelBox} className="t-d-bpmn__pooltext" />
      ) : (
        <text
          x={s.x + 14}
          y={cy}
          transform={`rotate(-90 ${s.x + 14} ${cy})`}
          textAnchor="middle"
          className="t-d-bpmn__pooltext"
        >
          {s.label}
        </text>
      )}
      {thumb ? null : <Markers s={s} x={s.x + s.w / 2} y={s.y + s.h - 15} />}
    </g>
  );
}

function DataObject({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const fold = Math.min(10, s.w / 3);
  const r = s.x + s.w;
  const b = s.y + s.h;
  const sym = symbolOf(s);
  return (
    <g>
      <path
        d={`M${s.x} ${s.y} H${r - fold} L${r} ${s.y + fold} V${b} H${s.x} Z M${r - fold} ${s.y} V${s.y + fold} H${r}`}
        className="t-d-bpmn__data"
      />
      {sym === "input" || sym === "output" ? (
        <path
          d={`M${s.x + 3} ${s.y + 7} h5 v-3 l5 5 l-5 5 v-3 h-5 Z`}
          className={sym === "output" ? "t-d-bpmn__ink" : "t-d-bpmn__data"}
          data-testid={thumb ? undefined : `symbol-${s.id}`}
          data-symbol={sym}
        />
      ) : null}
      {s.collection ? (
        <path
          d={`M${s.x + s.w / 2 - 4} ${b - 10} v8 M${s.x + s.w / 2} ${b - 10} v8 M${s.x + s.w / 2 + 4} ${b - 10} v8`}
          className="t-d-bpmn__marker"
          data-testid={thumb ? undefined : `marker-${s.id}-collection`}
        />
      ) : null}
      {label(s, thumb, () => centred([s.label], s.x + s.w / 2, b + 14))}
    </g>
  );
}

function DataStore({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const e = Math.min(8, s.h / 5);
  const b = s.y + s.h;
  const r = s.x + s.w;
  const cx = s.x + s.w / 2;
  return (
    <g>
      <path
        d={`M${s.x} ${s.y + e} A${s.w / 2} ${e} 0 0 1 ${r} ${s.y + e} V${b - e} A${s.w / 2} ${e} 0 0 1 ${s.x} ${b - e} Z`}
        className="t-d-bpmn__data"
      />
      <path
        d={`M${s.x} ${s.y + e} A${s.w / 2} ${e} 0 0 0 ${r} ${s.y + e}`}
        className="t-d-bpmn__data"
      />
      {label(s, thumb, () => centred([s.label], cx, b + 14))}
    </g>
  );
}

function Annotation({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  const cy = s.y + s.h / 2;
  return (
    <g>
      <path
        d={`M${s.x + 10} ${s.y} H${s.x} V${s.y + s.h} H${s.x + 10}`}
        className="t-d-bpmn__note"
      />
      {label(s, thumb, () => (
        <text x={s.x + 8} y={cy + 4} className="t-d-bpmn__text">
          {s.label}
        </text>
      ))}
    </g>
  );
}

function Group({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  return (
    <g>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={8} className="t-d-bpmn__group" />
      {label(s, thumb, () => (
        <text x={s.x + s.w / 2} y={s.y - 6} textAnchor="middle" className="t-d-bpmn__text">
          {s.label}
        </text>
      ))}
    </g>
  );
}

export function ShapeGlyph({ s, thumb }: { s: BpmnShape; thumb?: boolean }) {
  switch (formOf(s)) {
    case "pool":
      return <Swimlane s={s} thumb={thumb} pool />;
    case "lane":
      return <Swimlane s={s} thumb={thumb} pool={false} />;
    case "circle":
      return <Event s={s} thumb={thumb} />;
    case "diamond":
      return <Gateway s={s} thumb={thumb} />;
    case "bracket":
      return <Annotation s={s} thumb={thumb} />;
    case "group":
      return <Group s={s} thumb={thumb} />;
    case "document":
      return <DataObject s={s} thumb={thumb} />;
    case "datastore":
      return <DataStore s={s} thumb={thumb} />;
    case "rect":
      return (
        <g>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} className="t-d-bpmn__task" />
          {label(s, thumb, () => centred([s.label], s.x + s.w / 2, s.y + s.h / 2 + 4))}
        </g>
      );
    default:
      return <Activity s={s} thumb={thumb} />;
  }
}

const GLYPH_SIZE: Partial<Record<BpmnForm, [number, number]>> = {
  circle: [36, 36],
  diamond: [40, 40],
  roundrect: [48, 36],
  document: [30, 36],
  datastore: [36, 32],
  bracket: [30, 36],
};

export function ElementGlyph({ s }: { s: BpmnShape }) {
  const form = formOf(s);
  const [w, h] = GLYPH_SIZE[form] ?? [40, 30];
  const pad = 3;
  return (
    <svg
      className="t-d-outline__glyph"
      viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
      width={16}
      height={16}
      aria-hidden="true"
      focusable="false"
      data-kind={s.kind}
      data-form={form}
    >
      <ShapeGlyph s={{ ...s, x: pad, y: pad, w, h, label: "" }} thumb />
    </svg>
  );
}

export type LineEnd = "" | "arrow" | "open-arrow" | "circle" | "diamond" | "slash";

export function edgeStyle(e: BpmnEdge): { stroke: string; start: LineEnd; end: LineEnd } {
  const stroke =
    e.stroke ??
    (e.kind === "messageFlow" ? "dashed" : e.kind === "association" ? "dotted" : "solid");

  const said = e.stroke != null;
  const end = (e.end ?? (said ? "" : e.kind === "association" ? "" : "arrow")) as LineEnd;
  const start = (e.start ?? "") as LineEnd;
  return { stroke, start, end };
}

const END_ID: Record<Exclude<LineEnd, "">, string> = {
  arrow: "t-d-arrow",
  "open-arrow": "t-d-open",
  circle: "t-d-dot",
  diamond: "t-d-diamond",
  slash: "t-d-slash",
};

export const markerUrl = (end: LineEnd) =>
  end && Object.hasOwn(END_ID, end) ? `url(#${END_ID[end]})` : undefined;

export function EdgeDefs() {
  const common = { viewBox: "0 0 10 10", markerWidth: 7, markerHeight: 7 } as const;
  return (
    <defs>
      <marker id="t-d-arrow" {...common} refX={9} refY={5} orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" className="t-d-bpmn__arrow" />
      </marker>
      <marker id="t-d-open" {...common} refX={9} refY={5} orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" className="t-d-bpmn__openarrow" />
      </marker>
      <marker id="t-d-dot" {...common} refX={5} refY={5} orient="auto">
        <circle cx={5} cy={5} r={3.5} className="t-d-bpmn__openarrow" />
      </marker>
      <marker id="t-d-diamond" {...common} refX={1} refY={5} orient="auto-start-reverse">
        <path d="M1 5 L5.5 2 L10 5 L5.5 8 Z" className="t-d-bpmn__openarrow" />
      </marker>
      <marker id="t-d-slash" {...common} refX={-6} refY={5} orient="auto">
        <path d="M3 1 L7 9" className="t-d-bpmn__slash" />
      </marker>
    </defs>
  );
}
