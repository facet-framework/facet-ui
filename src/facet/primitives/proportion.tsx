import { useId, type CSSProperties, type ReactNode } from "react";
import { useText } from "../i18n/TextProvider";
import { chartColor, type ChartTone } from "./charts";

/**
 * Charts of parts and wholes: a sunburst, a treemap, a pyramid and an inline
 * share bar. Categories take the series colours in order; status tones stay
 * reserved for parts that stand for a state. Every chart names itself, and
 * interactive parts are real buttons, never clickable shapes.
 */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/**
 * A categorical colour for position `i`: the four series colours, then mixes
 * of neighbouring series so that a fifth category never repeats the first.
 */
export function categoryColor(i: number): string {
  const n = i % 8;
  if (n < 4) return `var(--t-series-${n + 1})`;
  const a = (n % 4) + 1;
  const b = ((n + 1) % 4) + 1;
  return `color-mix(in srgb, var(--t-series-${a}) 55%, var(--t-series-${b}))`;
}

/* Sunburst ----------------------------------------------------------------- */

export type SunburstNode = {
  key: string;
  label: string;
  value: number;
  tone?: ChartTone;
  children?: SunburstNode[];
};

function arc(c: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) =>
    `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

export type SunburstProps = {
  label: string;
  nodes: SunburstNode[];
  size?: number;
  /** A node or child key: it stays sharp, everything else recedes. */
  selected?: string | null;
  /** Content in the hole, e.g. the total. */
  center?: ReactNode;
  /**
   * A visible key of the inner ring under the drawing, on by default. Arcs
   * too short for their whole label carry none, so the key names them.
   */
  legend?: boolean;
};

/**
 * Two rings: the inner nodes and their children. A label is drawn only where
 * its arc is long enough to carry it; every value is in the list that screen
 * readers read instead of the drawing.
 */
export function Sunburst({
  label,
  nodes,
  size = 360,
  selected,
  center,
  legend = true,
}: SunburstProps) {
  const { number } = useText();
  const id = useId();
  const total = nodes.reduce((a, n) => a + n.value, 0);
  const c = size / 2;
  const r = [size * 0.2, size * 0.33, size * 0.48];
  const segs: ReactNode[] = [];
  const labels: ReactNode[] = [];
  const hueOf = (n: SunburstNode, i: number) => (n.tone ? chartColor(n.tone) : categoryColor(i));
  // A tint of the hue, so the ink of the labels and the legend reads on it in every palette.
  const tintOf = (n: SunburstNode, i: number) =>
    `color-mix(in srgb, ${hueOf(n, i)} 70%, var(--t-surface))`;
  /**
   * A label at the middle of an arc, only when the whole label fits inside
   * its band: never cut short. A horizontal line of text crosses the band
   * radially by `width·|cos|` and runs along it by `width·|sin|`, so both
   * must stay within the band's thickness and its chord.
   */
  const place = (
    key: string,
    text: string,
    a0: number,
    a1: number,
    inner: number,
    outer: number,
    cls: string,
    font: number,
  ) => {
    const radius = (inner + outer) / 2;
    const mid = (a0 + a1) / 2 - Math.PI / 2;
    const chord = 2 * radius * Math.sin(Math.min(Math.PI / 2, (a1 - a0) / 2));
    const thick = outer - inner;
    const width = text.length * font * 0.62 + 6;
    const height = font + 4;
    const cos = Math.abs(Math.cos(mid));
    const sin = Math.abs(Math.sin(mid));
    if (width * cos + height * sin > thick || width * sin + height * cos > chord) return;
    labels.push(
      <text
        key={`l-${key}`}
        x={c + Math.cos(mid) * radius}
        y={c + Math.sin(mid) * radius}
        className={cls}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>,
    );
  };
  let a = 0;
  if (total > 0) {
    nodes.forEach((n, i) => {
      const a0 = a;
      const a1 = a + (n.value / total) * Math.PI * 2;
      const hue = hueOf(n, i);
      const color = tintOf(n, i);
      const dim =
        selected != null && selected !== n.key && !n.children?.some((ch) => ch.key === selected);
      segs.push(
        <path
          key={n.key}
          d={arc(c, r[0], r[1] - 2, a0, a1 - 0.006)}
          fill={color}
          opacity={dim ? 0.45 : 1}
          data-key={n.key}
        >
          <title>{`${n.label}: ${number(n.value)}`}</title>
        </path>,
      );
      place(n.key, n.label, a0, a1, r[0], r[1] - 2, "t-sun__label t-sun__label--inner", 12);
      const sub = (n.children ?? []).reduce((s, ch) => s + ch.value, 0) || 1;
      let b = a0;
      (n.children ?? []).forEach((ch, j) => {
        const b1 = b + (ch.value / sub) * (a1 - a0);
        const cdim = selected != null && selected !== ch.key && selected !== n.key;
        segs.push(
          <path
            key={ch.key}
            d={arc(c, r[1], r[2], b, b1 - 0.006)}
            fill={
              ch.tone
                ? chartColor(ch.tone)
                : `color-mix(in srgb, ${hue} ${48 - (j % 3) * 12}%, var(--t-surface))`
            }
            opacity={cdim ? 0.4 : 1}
            data-key={ch.key}
          >
            <title>{`${ch.label}: ${number(ch.value)}`}</title>
          </path>,
        );
        place(ch.key, ch.label, b, b1, r[1], r[2], "t-sun__label", 11);
        b = b1;
      });
      a = a1;
    });
  } else {
    segs.push(
      <circle
        key="empty"
        className="t-sun__empty"
        cx={c}
        cy={c}
        r={(r[0] + r[2]) / 2}
        strokeWidth={r[2] - r[0]}
      />,
    );
  }
  return (
    <figure className="t-sun" style={{ width: size }} aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="t-sr">
        {label}
      </figcaption>
      <div className="t-sun__plot">
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" aria-hidden="true">
          {segs}
          {labels}
        </svg>
        {center ? <div className="t-sun__center">{center}</div> : null}
      </div>
      {legend ? (
        <ul className="t-sun__legend">
          {nodes.map((n, i) => (
            <li key={n.key}>
              <span
                className="t-sun__swatch"
                aria-hidden="true"
                style={{ background: tintOf(n, i) }}
              />
              <span>{n.label}</span>
              <span className="t-meta t-num">{number(n.value)}</span>
              {n.children?.length ? (
                <ul className="t-sr">
                  {n.children.map((ch) => (
                    <li key={ch.key}>{`${ch.label}: ${number(ch.value)}`}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="t-sr">
          {nodes.map((n) => (
            <li key={n.key}>
              {`${n.label}: ${number(n.value)}`}
              {n.children?.length ? (
                <ul>
                  {n.children.map((ch) => (
                    <li key={ch.key}>{`${ch.label}: ${number(ch.value)}`}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

/* Treemap ------------------------------------------------------------------ */

export type TreemapRect = { x: number; y: number; w: number; h: number };

/**
 * Binary split layout: the sorted list is cut where the sums come closest to
 * half, along the longer side, until every item has its own rectangle.
 */
export function layoutTreemap<T extends { value: number }>(
  items: readonly T[],
  r: TreemapRect,
): (T & TreemapRect)[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], ...r }];
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].value;
    cut = i + 1;
    if (acc >= total / 2) break;
  }
  const a = items.slice(0, cut);
  const b = items.slice(cut);
  const share = a.reduce((s, i) => s + i.value, 0) / total;
  if (r.w >= r.h) {
    const w = r.w * share;
    return [
      ...layoutTreemap(a, { ...r, w }),
      ...layoutTreemap(b, { ...r, x: r.x + w, w: r.w - w }),
    ];
  }
  const h = r.h * share;
  return [...layoutTreemap(a, { ...r, h }), ...layoutTreemap(b, { ...r, y: r.y + h, h: r.h - h })];
}

export type TreemapItem = {
  key: string;
  label: string;
  value: number;
  /** A quiet second line, shown when the cell is tall enough. */
  sub?: string;
  /** 0–1: how strongly the cell is tinted. Absent is the middle tint. */
  heat?: number;
};

export type TreemapProps = {
  label: string;
  items: TreemapItem[];
  height?: number;
  selected?: string | null;
  onPick?: (key: string) => void;
};

/** Areas proportional to value. With `onPick` every cell is a toggle button. */
export function Treemap({ label, items, height = 420, selected, onPick }: TreemapProps) {
  const { number } = useText();
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const cells = layoutTreemap(sorted, { x: 0, y: 0, w: 100, h: 100 });
  return (
    <ul className="t-treemap" aria-label={label} style={{ height }}>
      {cells.map((c) => {
        const name = `${c.label}: ${number(c.value)}`;
        const style = {
          left: `${c.x}%`,
          top: `${c.y}%`,
          width: `${c.w}%`,
          height: `${c.h}%`,
          background: `color-mix(in srgb, var(--t-signal) ${Math.round(14 + Math.max(0, Math.min(1, c.heat ?? 0.5)) * 60)}%, var(--t-raised))`,
        } as CSSProperties;
        const body =
          c.w > 8 && c.h > 9 ? (
            <>
              <span className="t-treemap__label t-mono" aria-hidden="true">
                {c.label}
              </span>
              <span className="t-treemap__value" aria-hidden="true">
                {number(c.value)}
              </span>
              {c.sub && c.h > 16 ? (
                <span className="t-treemap__sub" aria-hidden="true">
                  {c.sub}
                </span>
              ) : null}
            </>
          ) : null;
        return (
          <li key={c.key} className="t-treemap__slot" style={style}>
            {onPick ? (
              <button
                type="button"
                className="t-treemap__cell"
                aria-pressed={selected === c.key}
                aria-label={name}
                title={name}
                onClick={() => onPick(c.key)}
              >
                {body}
              </button>
            ) : (
              <div
                className="t-treemap__cell"
                data-selected={selected === c.key || undefined}
                title={name}
              >
                <span className="t-sr">{name}</span>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Pyramid ------------------------------------------------------------------ */

export type PyramidLayer = { key: string; label: string; value: number; meta?: string };

export type PyramidProps = {
  label: string;
  /** From the top (narrowest) to the bottom (widest). */
  layers: PyramidLayer[];
  selected?: string | null;
  onPick?: (key: string) => void;
};

/**
 * Layers from narrow to wide, each with its count and its share of the whole.
 * The width shows the rank of a layer, the number its size; with a total of
 * zero there is no denominator, so no layer shows a share.
 */
export function Pyramid({ label, layers, selected, onPick }: PyramidProps) {
  const { t, number } = useText();
  const total = layers.reduce((a, l) => a + l.value, 0);
  return (
    <ul className="t-pyramid" aria-label={label}>
      {layers.map((l, i) => {
        const share = total ? l.value / total : null;
        const width = 28 + ((i + 1) / layers.length) * 72;
        const meta = [
          share == null
            ? null
            : t("primitives.chart.percent", { value: Math.round(share * 1000) / 10 }),
          l.meta,
        ]
          .filter(Boolean)
          .join(" · ");
        const body = (
          <>
            <span className="t-pyramid__name">{l.label}</span>
            <span className="t-pyramid__value">{number(l.value)}</span>
            <span className="t-meta">{meta}</span>
          </>
        );
        const style = { "--t-pyramid-w": `${width}%` } as CSSProperties;
        return (
          <li key={l.key} className="t-pyramid__slot">
            {onPick ? (
              <button
                type="button"
                className="t-pyramid__layer t-pyramid__layer--pick"
                aria-pressed={selected === l.key}
                style={style}
                onClick={() => onPick(l.key)}
              >
                {body}
              </button>
            ) : (
              <div
                className="t-pyramid__layer"
                data-selected={selected === l.key || undefined}
                style={style}
              >
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Share bar ---------------------------------------------------------------- */

export type SharePart = { key: string; value: number; tone?: ChartTone; label?: string };

export type ShareBarProps = {
  /** The accessible name; labelled parts and their values are appended to it. */
  label: string;
  parts: SharePart[];
  width?: number;
};

/**
 * One thin band of parts, sized to sit inline in a row. Not interactive; for
 * a band whose parts filter, use `Distribution`. A whole of zero draws the
 * empty track and is named "none".
 */
export function ShareBar({ label, parts, width = 72 }: ShareBarProps) {
  const { t, number } = useText();
  const total = parts.reduce((a, p) => a + p.value, 0);
  const named = parts.filter((p) => p.label);
  const name =
    total === 0
      ? `${label}: ${t("primitives.chart.none")}`
      : named.length
        ? `${label}: ${named.map((p) => `${p.label} ${number(p.value)}`).join(", ")}`
        : label;
  return (
    <span
      className={cx("t-share", total === 0 && "t-share--empty")}
      role="img"
      aria-label={name}
      style={{ width }}
    >
      {total === 0
        ? null
        : parts.map((p, i) =>
            p.value > 0 ? (
              <span
                key={p.key}
                style={{
                  flexGrow: p.value,
                  background: p.tone ? chartColor(p.tone) : categoryColor(i),
                }}
              />
            ) : null,
          )}
    </span>
  );
}
