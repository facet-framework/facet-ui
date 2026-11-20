import { Chip } from "../../primitives/controls";
import { useText } from "../../i18n/TextProvider";
import type { Lifecycle } from "./model";
import { cx } from "./parts";

export type NetworkNode = {
  id: string;
  slug: string;
  domain: string;
  lifecycle: Lifecycle;

  depth: number;
  match: boolean;
};

export type NetworkEdge = [string, string];

export type NetworkGraph = { nodes: NetworkNode[]; edges: NetworkEdge[] };

const COL_W = 300;
const ROW_H = 24;
const NODE_W = 236;
const HEAD_H = 34;

export function DependencyNetwork({
  graph,
  query,
  mobile,
  onOpen,
}: {
  graph: NetworkGraph;
  query: string;
  mobile?: boolean;
  onOpen?: (id: string) => void;
}) {
  const { t, number } = useText();
  const searching = query.trim().length > 0;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  if (mobile) {
    const dependents = [...new Set(graph.edges.map((e) => e[0]))];
    return (
      <ul className="t-b-netlist" aria-label={t("b.network.label")}>
        {dependents
          .filter(
            (d) =>
              !searching ||
              byId.get(d)?.match ||
              graph.edges.some((e) => e[0] === d && byId.get(e[1])?.match),
          )
          .map((d) => (
            <li key={d} className="t-surface">
              <button type="button" className="t-b-link t-mono" onClick={() => onOpen?.(d)}>
                {d}
              </button>
              <span className="t-meta">{t("b.network.needs")}</span>
              <div className="t-row t-row--wrap" style={{ gap: 6 }}>
                {graph.edges
                  .filter((e) => e[0] === d)
                  .map((e) => (
                    <Chip key={e[1]} mono onClick={() => onOpen?.(e[1])}>
                      {e[1]}
                    </Chip>
                  ))}
              </div>
            </li>
          ))}
      </ul>
    );
  }
  const depths = Math.max(0, ...graph.nodes.map((n) => n.depth)) + 1;
  const cols = Array.from({ length: depths }, (_, d) =>
    graph.nodes.filter((n) => n.depth === d).sort((a, b) => a.id.localeCompare(b.id)),
  );
  const pos = new Map<string, { x: number; y: number }>();
  cols.forEach((col, d) =>
    col.forEach((n, i) => pos.set(n.id, { x: d * COL_W, y: HEAD_H + i * ROW_H + ROW_H / 2 })),
  );
  const h = HEAD_H + Math.max(...cols.map((c) => c.length)) * ROW_H + 8;
  const w = (depths - 1) * COL_W + NODE_W + 8;
  const hot = (id: string) => !searching || !!byId.get(id)?.match;
  return (
    <div className="t-b-net t-surface">
      <p className="t-meta t-b-net__legend">
        {t("b.network.legend", {
          records: number(graph.nodes.length),
          edges: number(graph.edges.length),
          levels: depths,
        })}
      </p>
      <div className="t-b-net__scroll">
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={t("b.network.graph")}
        >
          {cols.map((col, d) => (
            <text key={`h${d}`} x={d * COL_W + 4} y={16} className="t-b-net__head">
              {t("b.network.level", { level: d, count: col.length })}
            </text>
          ))}
          {graph.edges.map(([from, to]) => {
            const a = pos.get(to)!;
            const b = pos.get(from)!;
            const x1 = a.x + NODE_W;
            const mid = (x1 + b.x) / 2;
            const lit = searching && (hot(from) || hot(to));
            return (
              <path
                key={`${from}>${to}`}
                d={`M ${x1} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`}
                className={cx(
                  "t-b-net__edge",
                  lit && "t-b-net__edge--lit",
                  searching && !lit && "t-b-net__edge--dim",
                )}
              />
            );
          })}
          {graph.nodes.map((n) => {
            const p = pos.get(n.id)!;
            return (
              <a
                key={n.id}
                href={`#/record/${n.id}`}
                className={cx(
                  "t-b-net__node",
                  `t-b-net__node--${n.lifecycle}`,
                  searching && (n.match ? "t-b-net__node--hit" : "t-b-net__node--dim"),
                )}
                onClick={(e) => {
                  e.preventDefault();
                  onOpen?.(n.id);
                }}
              >
                <title>{`${n.id} · ${n.domain}`}</title>
                <rect x={p.x} y={p.y - 9} width={NODE_W} height={18} rx={5} />
                <text x={p.x + 8} y={p.y} dy="0.35em">
                  {n.slug.length > 32 ? `${n.slug.slice(0, 31)}…` : n.slug}
                </text>
              </a>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
