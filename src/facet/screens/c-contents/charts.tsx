import type { CSSProperties, ReactNode } from "react";
import { useText } from "../../i18n/TextProvider";
import type { Tone } from "./model";

export const nf = (n: number) => n.toLocaleString("de-DE");

export const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)} %`);

export function usePct() {
  const { t } = useText();
  return (v: number | null) => (v == null ? "—" : t("c.percent", { value: Math.round(v * 100) }));
}

export const toneVar = (t: Tone | undefined) =>
  t === "ok"
    ? "var(--t-ok)"
    : t === "warn"
      ? "var(--t-warn)"
      : t === "plan"
        ? "var(--t-plan)"
        : t === "bad"
          ? "var(--t-bad)"
          : t === "signal"
            ? "var(--t-signal)"
            : "var(--t-faint)";

export function Sparkline({
  values,
  label,
  width = 96,
  height = 24,
  tone = "signal",
}: {
  values: number[];
  label: string;
  width?: number;
  height?: number;
  tone?: Tone;
}) {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values.map(
    (v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 4)).toFixed(1)}`,
  );
  return (
    <svg
      className="t-c-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={toneVar(tone)}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${pts.join(" ")} ${width},${height}`}
        fill={toneVar(tone)}
        opacity="0.12"
      />
    </svg>
  );
}

export function BarList({
  label,
  items,
  onPick,
}: {
  label: string;
  items: { key: string; label: ReactNode; value: number; tone?: Tone; meta?: ReactNode }[];
  onPick?: (key: string) => void;
}) {
  const { number } = useText();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="t-c-bars" aria-label={label}>
      {items.map((it) => {
        const inner = (
          <>
            <span className="t-c-bars__label t-wrap">{it.label}</span>
            <span className="t-c-bars__track">
              <span
                className="t-c-bars__fill"
                style={{
                  width: `${(it.value / max) * 100}%`,
                  background: toneVar(it.tone ?? "signal"),
                }}
              />
            </span>
            <span className="t-c-bars__value t-num">{number(it.value)}</span>
            {it.meta ? <span className="t-meta t-hide-mobile">{it.meta}</span> : null}
          </>
        );
        return (
          <li key={it.key}>
            {onPick ? (
              <button type="button" className="t-c-bars__row" onClick={() => onPick(it.key)}>
                {inner}
              </button>
            ) : (
              <div className="t-c-bars__row">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const LABELLED_ROWS = [0, 2, 4];

export function CalendarHeatmap({
  label,
  days,
  from,
  to,
  cell = 14,
  selected,
  onPick,
}: {
  label: string;
  days: { date: string; count: number }[];
  from: string;
  to: string;
  cell?: number;
  selected?: string | null;
  onPick?: (date: string) => void;
}) {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const { t } = useText();
  const months = t("c.chart.months").split(" ");
  const weekdays = t("c.chart.weekdays").split(" ");
  const max = Math.max(1, ...days.map((d) => d.count));
  const start = new Date(`${from}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const end = new Date(`${to}T00:00:00Z`);
  const cells: { date: string; week: number; dow: number; count: number }[] = [];
  for (let d = new Date(start), i = 0; d <= end; d.setUTCDate(d.getUTCDate() + 1), i++) {
    const date = d.toISOString().slice(0, 10);
    cells.push({ date, week: Math.floor(i / 7), dow: i % 7, count: byDate.get(date) ?? 0 });
  }
  const weeks = (cells.at(-1)?.week ?? 0) + 1;
  const gap = 3;
  const left = 24;
  const top = 18;
  const width = left + weeks * (cell + gap);
  const height = top + 7 * (cell + gap);

  const firsts = cells.filter((c) => c.date.endsWith("-01"));
  const monthStarts =
    cells.length > 0 && !cells[0].date.endsWith("-01") && (firsts[0]?.week ?? weeks) >= 3
      ? [cells[0], ...firsts]
      : firsts;
  return (
    <div className="t-c-cal">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {monthStarts.map((c) => (
          <text key={c.date} x={left + c.week * (cell + gap)} y={11} className="t-c-svgtext">
            {months[Number(c.date.slice(5, 7)) - 1]}
          </text>
        ))}
        {LABELLED_ROWS.map((row, i) => (
          <text key={row} x={0} y={top + row * (cell + gap) + cell - 3} className="t-c-svgtext">
            {weekdays[i]}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.date}
            x={left + c.week * (cell + gap)}
            y={top + c.dow * (cell + gap)}
            width={cell}
            height={cell}
            rx={3}
            fill={
              c.count
                ? `color-mix(in srgb, var(--t-signal) ${20 + Math.round((c.count / max) * 80)}%, var(--t-sunken))`
                : "var(--t-sunken)"
            }
            stroke={selected === c.date ? "var(--t-ink)" : "none"}
            strokeWidth={1.5}
          >
            <title>{`${c.date}: ${c.count}`}</title>
          </rect>
        ))}
      </svg>
      {onPick ? (
        <div className="t-c-cal__days" role="group" aria-label={t("c.chart.daysWithEntries")}>
          {days
            .filter((d) => d.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map((d) => (
              <button
                key={d.date}
                type="button"
                className="t-chip"
                aria-pressed={selected === d.date}
                onClick={() => onPick(d.date)}
              >
                <span className="t-mono">{d.date}</span>
                <span className="t-chip__count">{d.count}</span>
              </button>
            ))}
        </div>
      ) : null}
      <div className="t-c-legend" aria-hidden="true">
        <span>{t("c.chart.less")}</span>
        {[0, 25, 50, 75, 100].map((p) => (
          <span
            key={p}
            className="t-c-legend__sw"
            style={{
              background: p
                ? `color-mix(in srgb, var(--t-signal) ${20 + Math.round(p * 0.8)}%, var(--t-sunken))`
                : "var(--t-sunken)",
            }}
          />
        ))}
        <span>{t("c.chart.more")}</span>
      </div>
    </div>
  );
}

export type SunNode = {
  key: string;
  label: string;
  value: number;
  tone?: Tone;
  children?: SunNode[];
};

function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) =>
    `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

const SUN_COLORS = [
  "var(--t-signal)",
  "var(--t-ok)",
  "var(--t-warn)",
  "var(--t-plan)",
  "color-mix(in srgb, var(--t-signal) 50%, var(--t-bad))",
  "color-mix(in srgb, var(--t-ok) 50%, var(--t-signal))",
  "color-mix(in srgb, var(--t-warn) 50%, var(--t-bad))",
];
export const sunColor = (i: number) => SUN_COLORS[i % SUN_COLORS.length];

export function Sunburst({
  label,
  nodes,
  size = 360,
  selected,
  center,
}: {
  label: string;
  nodes: SunNode[];
  size?: number;
  selected?: string | null;
  center?: ReactNode;
}) {
  const total = nodes.reduce((a, n) => a + n.value, 0) || 1;
  const c = size / 2;
  const r = [size * 0.2, size * 0.33, size * 0.48];
  let a = 0;
  const segs: ReactNode[] = [];
  const labels: ReactNode[] = [];

  const place = (
    key: string,
    text: string,
    a0: number,
    a1: number,
    radius: number,
    cls: string,
  ) => {
    const span = (a1 - a0) * radius;
    const chars = Math.floor(span / 7);
    if (chars < 4) return;
    const mid = (a0 + a1) / 2 - Math.PI / 2;
    labels.push(
      <text
        key={`l-${key}`}
        x={c + Math.cos(mid) * radius}
        y={c + Math.sin(mid) * radius}
        className={cls}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text.length > chars ? `${text.slice(0, chars - 1)}…` : text}
      </text>,
    );
  };
  nodes.forEach((n, i) => {
    const a0 = a;
    const a1 = a + (n.value / total) * Math.PI * 2;
    const color = sunColor(i);
    const dim = selected && selected !== n.key && !n.children?.some((ch) => ch.key === selected);
    segs.push(
      <path
        key={n.key}
        d={arc(c, c, r[0], r[1] - 2, a0, a1 - 0.006)}
        fill={color}
        opacity={dim ? 0.45 : 1}
      >
        <title>{`${n.label}: ${n.value}`}</title>
      </path>,
    );
    place(n.key, n.label, a0, a1, (r[0] + r[1]) / 2, "t-c-sun__label t-c-sun__label--domain");
    let b = a0;
    const sub = (n.children ?? []).reduce((s2, ch) => s2 + ch.value, 0) || 1;
    (n.children ?? []).forEach((ch, j) => {
      const b1 = b + (ch.value / sub) * (a1 - a0);
      const cdim = selected && selected !== ch.key && selected !== n.key;
      segs.push(
        <path
          key={ch.key}
          d={arc(c, c, r[1], r[2], b, b1 - 0.006)}
          fill={
            ch.tone
              ? toneVar(ch.tone)
              : `color-mix(in srgb, ${color} ${80 - (j % 3) * 14}%, var(--t-surface))`
          }
          opacity={cdim ? 0.4 : 1}
        >
          <title>{`${ch.label}: ${ch.value}`}</title>
        </path>,
      );
      place(ch.key, ch.label, b, b1, (r[1] + r[2]) / 2, "t-c-sun__label");
      b = b1;
    });
    a = a1;
  });
  segs.push(...labels);
  return (
    <div className="t-c-sun" style={{ width: size, maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} width="100%">
        {segs}
      </svg>
      {center ? <div className="t-c-sun__center">{center}</div> : null}
    </div>
  );
}

export function BandChart({
  label,
  min,
  max,
  median,
  band,
  values,
  scaleMax,
  width = 640,
}: {
  label: string;
  min: number;
  max: number;
  median: number;
  band: { low: number; high: number };
  values?: number[];
  scaleMax?: number;
  width?: number;
}) {
  const top = Math.max(scaleMax ?? 0, max, band.high) * 1.04 || 1;
  const h = 64;
  const pad = 8;
  const x = (v: number) => pad + (v / top) * (width - pad * 2);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t));
  return (
    <svg
      className="t-c-band"
      viewBox={`0 0 ${width} ${h + 18}`}
      width="100%"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <rect
        x={x(band.low)}
        y={10}
        width={Math.max(2, x(band.high) - x(band.low))}
        height={h - 20}
        rx={4}
        fill="var(--t-ok-wash)"
        stroke="var(--t-ok)"
        strokeOpacity={0.5}
      />
      <line
        x1={x(min)}
        x2={x(max)}
        y1={h / 2}
        y2={h / 2}
        stroke="var(--t-ink-2)"
        strokeWidth={1.5}
      />
      <line
        x1={x(min)}
        x2={x(min)}
        y1={h / 2 - 7}
        y2={h / 2 + 7}
        stroke="var(--t-ink-2)"
        strokeWidth={1.5}
      />
      <line
        x1={x(max)}
        x2={x(max)}
        y1={h / 2 - 7}
        y2={h / 2 + 7}
        stroke="var(--t-ink-2)"
        strokeWidth={1.5}
      />
      {(values ?? []).map((v, i) => (
        <circle
          key={i}
          cx={x(v)}
          cy={h / 2 + (((i * 37) % 17) - 8)}
          r={2.2}
          fill={v > band.high || v < band.low ? "var(--t-warn)" : "var(--t-signal)"}
          opacity={0.7}
        />
      ))}
      <line
        x1={x(median)}
        x2={x(median)}
        y1={4}
        y2={h - 4}
        stroke="var(--t-ink)"
        strokeWidth={2.5}
      />
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={h + 14} textAnchor="middle" className="t-c-svgtext">
          {t}
        </text>
      ))}
    </svg>
  );
}

export function Pyramid({
  label,
  layers,
  selected,
  onPick,
}: {
  label: string;
  layers: { key: string; label: string; value: number; meta?: string }[];
  selected?: string | null;
  onPick?: (key: string) => void;
}) {
  const { t, number } = useText();
  const total = layers.reduce((a, l) => a + l.value, 0) || 1;
  return (
    <div className="t-c-pyr" role="group" aria-label={label}>
      {layers.map((l, i) => {
        const share = l.value / total;
        const width = 28 + ((i + 1) / layers.length) * 72;
        return (
          <button
            key={l.key}
            type="button"
            className="t-c-pyr__layer"
            aria-pressed={selected === l.key}
            style={{ "--t-c-w": `${width}%` } as CSSProperties}
            onClick={() => onPick?.(l.key)}
          >
            <span className="t-c-pyr__name">{l.label}</span>
            <span className="t-c-pyr__value">{number(l.value)}</span>
            <span className="t-meta">
              {t("c.percent", { value: Math.round(share * 1000) / 10 })}
              {l.meta ? ` · ${l.meta}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

export function layoutTreemap<T extends { value: number }>(items: T[], r: Rect): (T & Rect)[] {
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

export function Treemap({
  label,
  items,
  height = 420,
  selected,
  onPick,
}: {
  label: string;
  items: { key: string; label: string; value: number; sub?: string; heat?: number }[];
  height?: number;
  selected?: string | null;
  onPick?: (key: string) => void;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const { number } = useText();
  const cells = layoutTreemap(sorted, { x: 0, y: 0, w: 100, h: 100 });
  return (
    <div className="t-c-tree-map" role="group" aria-label={label} style={{ height }}>
      {cells.map((c) => (
        <button
          key={c.key}
          type="button"
          className="t-c-tree-map__cell"
          aria-pressed={selected === c.key}
          aria-label={`${c.label}: ${c.value}`}
          title={`${c.label}: ${c.value}`}
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.w}%`,
            height: `${c.h}%`,
            background: `color-mix(in srgb, var(--t-signal) ${Math.round(14 + (c.heat ?? 0.5) * 60)}%, var(--t-raised))`,
          }}
          onClick={() => onPick?.(c.key)}
        >
          {c.w > 8 && c.h > 9 ? (
            <>
              <span className="t-c-tree-map__label t-mono">{c.label}</span>
              <span className="t-c-tree-map__value">{number(c.value)}</span>
              {c.sub && c.h > 16 ? <span className="t-c-tree-map__sub">{c.sub}</span> : null}
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function ShareBar({
  label,
  parts,
}: {
  label: string;
  parts: { key: string; value: number; tone: Tone }[];
}) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <span className="t-c-share" role="img" aria-label={label}>
      {total === 0
        ? null
        : parts.map((p) => (
            <span key={p.key} style={{ flexGrow: p.value, background: toneVar(p.tone) }} />
          ))}
    </span>
  );
}
