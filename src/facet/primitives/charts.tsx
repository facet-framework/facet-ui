import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useText } from "../i18n/TextProvider";

/**
 * Small charts drawn in SVG with the design system's tokens.
 *
 * Series colours come from `--t-series-1` … `--t-series-4`, a categorical
 * order chosen to stay distinguishable under common colour-vision deficiencies. Status
 * colours (`ok`, `warn`, `plan`, `bad`) are reserved for states and are only
 * used when a caller passes them as a tone. A missing value (`null`) is drawn
 * as a gap, never as zero: absent and unmeasured are different from nothing.
 */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/**
 * A series colour by position (1–4), the brand signal for a single series, or
 * a status tone.
 */
export type ChartTone = 1 | 2 | 3 | 4 | "signal" | "ok" | "warn" | "plan" | "bad" | "muted";

export function chartColor(tone: ChartTone | undefined, index = 0): string {
  if (tone == null) return `var(--t-series-${(index % 4) + 1})`;
  if (typeof tone === "number") return `var(--t-series-${tone})`;
  return `var(--t-${tone})`;
}

type Point = [number, number];

/** Measured points in runs; a `null` ends a run, so a gap is never bridged. */
function pointRuns(
  values: readonly (number | null)[],
  width: number,
  height: number,
  min: number,
  max: number,
  pad: number,
): Point[][] {
  const span = max - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const runs: Point[][] = [];
  let current: Point[] = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (current.length) runs.push(current);
      current = [];
      return;
    }
    current.push([pad + i * step, pad + (height - pad * 2) * (1 - (v - min) / span)]);
  });
  if (current.length) runs.push(current);
  return runs;
}

const pathOf = (run: Point[]) =>
  run.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");

/** Points for a polyline; a `null` breaks the line into separate runs. */
export function linePaths(
  values: readonly (number | null)[],
  width: number,
  height: number,
  min: number,
  max: number,
  pad = 2,
): string[] {
  return pointRuns(values, width, height, min, max, pad).map(pathOf);
}

function extent(values: readonly (number | null)[], from?: number, to?: number): [number, number] {
  const measured = values.filter((v): v is number => v != null);
  const lo = from ?? Math.min(0, ...measured);
  const hi = to ?? Math.max(...measured, lo + 1);
  return [lo, hi];
}

export type SparklineProps = {
  /** One value per position; `null` is not measured and leaves a gap in the line. */
  values: readonly (number | null)[];
  /** The accessible name; the latest measured value is appended to it. */
  label: string;
  tone?: ChartTone;
  width?: number;
  height?: number;
  /** Fills the area under the line with a wash of its colour. On by default. */
  area?: boolean;
  min?: number;
  max?: number;
};

/**
 * A word-sized line: the trend of one series, without axes. A series without a
 * single measured value draws a dashed baseline and is named "not measured".
 */
export function Sparkline({
  values,
  label,
  tone = "signal",
  width = 96,
  height = 24,
  area = true,
  min,
  max,
}: SparklineProps) {
  const { t, number } = useText();
  const [lo, hi] = extent(values, min, max);
  const runs = pointRuns(values, width, height, lo, hi, 2);
  const last = [...values].reverse().find((v) => v != null);
  const color = chartColor(tone);
  const name =
    last != null ? `${label}: ${number(last)}` : `${label}: ${t("primitives.meter.unmeasured")}`;
  return (
    <svg
      className="t-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={name}
      data-state={last == null ? "unmeasured" : undefined}
      style={{ color } as CSSProperties}
    >
      {last == null ? (
        <line className="t-spark__none" x1={2} x2={width - 2} y1={height - 2} y2={height - 2} />
      ) : null}
      {area
        ? runs.map((run, i) => (
            <path
              key={`a${i}`}
              className="t-spark__area"
              d={`${pathOf(run)} L${run[run.length - 1][0].toFixed(2)} ${height} L${run[0][0].toFixed(2)} ${height} Z`}
            />
          ))
        : null}
      {runs.map((run, i) =>
        run.length === 1 ? (
          <circle key={i} className="t-spark__dot" cx={run[0][0]} cy={run[0][1]} r={1.5} />
        ) : (
          <path key={i} className="t-spark__line" d={pathOf(run)} />
        ),
      )}
    </svg>
  );
}

export type BarDatum = {
  key: string;
  label: ReactNode;
  /** `null` is not measured; the row says so instead of drawing an empty bar. */
  value: number | null;
  tone?: ChartTone;
  /** Shown instead of the formatted value, e.g. "12 of 40". */
  display?: ReactNode;
  /** A quiet fourth column, e.g. a share or an owner. Hidden on narrow screens. */
  meta?: ReactNode;
};

export type BarChartProps = {
  label: string;
  bars: BarDatum[];
  /** The value of a full bar; the largest bar by default. */
  max?: number;
  /** Appended to every formatted value, e.g. "%". */
  unit?: string;
  /**
   * The colour of every bar without its own tone. One measure is one colour;
   * pass a tone per bar only when the bars stand for different states.
   */
  tone?: ChartTone;
  onPick?: (key: string) => void;
  active?: string;
};

/** Horizontal bars with their labels and values written beside them. */
export function BarChart({
  label,
  bars,
  max,
  unit = "",
  tone = "signal",
  onPick,
  active,
}: BarChartProps) {
  const { t, number } = useText();
  const top = max ?? Math.max(1, ...bars.map((b) => b.value ?? 0));
  const withMeta = bars.some((b) => b.meta != null);
  return (
    <ul className={cx("t-bars", withMeta && "t-bars--meta")} aria-label={label}>
      {bars.map((b) => {
        const share = b.value == null ? null : Math.max(0, Math.min(1, b.value / top));
        const value =
          b.display ??
          (b.value == null ? t("primitives.meter.unmeasured") : `${number(b.value)}${unit}`);
        const body = (
          <>
            <span className="t-bars__label t-wrap">{b.label}</span>
            <span className="t-bars__track" aria-hidden="true">
              {share != null ? (
                <span
                  className="t-bars__fill"
                  style={
                    {
                      "--t-value": share,
                      background: chartColor(b.tone ?? tone),
                    } as CSSProperties
                  }
                />
              ) : (
                <span className="t-bars__unmeasured" />
              )}
            </span>
            <span className={cx("t-bars__value t-num", b.value == null && "t-muted")}>{value}</span>
            {withMeta ? <span className="t-bars__meta t-meta">{b.meta}</span> : null}
          </>
        );
        return (
          <li key={b.key}>
            {onPick ? (
              <button
                type="button"
                className={cx("t-bars__row", "t-bars__row--pick")}
                aria-pressed={active === b.key}
                onClick={() => onPick(b.key)}
              >
                {body}
              </button>
            ) : (
              <div className="t-bars__row">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type LineSeries = {
  key: string;
  label: string;
  values: readonly (number | null)[];
  tone?: ChartTone;
};

export type LineChartProps = {
  label: string;
  series: LineSeries[];
  /** One label per value position, shown under the axis and in the tooltip. */
  categories: readonly string[];
  height?: number;
  min?: number;
  max?: number;
  unit?: string;
};

const W = 640;

/**
 * A line chart with a single y-axis, a legend, a crosshair tooltip and a
 * table that screen readers read instead of the drawing.
 */
export function LineChart({
  label,
  series,
  categories,
  height = 200,
  min,
  max,
  unit = "",
}: LineChartProps) {
  const { number } = useText();
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const all = useMemo(() => series.flatMap((s) => s.values), [series]);
  const [lo, hi] = extent(all, min, max);
  const plotH = height;
  const n = categories.length;
  const pad = 2;
  const step = n > 1 ? (W - pad * 2) / (n - 1) : 0;
  const mid = lo + (hi - lo) / 2;
  // A whole-number range keeps whole-number ticks.
  const ticks = [lo, Number.isInteger(lo) && Number.isInteger(hi) ? Math.round(mid) : mid, hi];
  const yOf = (v: number) => pad + (plotH - pad * 2) * (1 - (v - lo) / (hi - lo || 1));
  const every = Math.max(1, Math.ceil(n / 6));
  const fmt = (v: number | null) => (v == null ? "–" : `${number(v)}${unit}`);

  return (
    <figure className="t-linechart" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="t-sr">
        {label}
      </figcaption>
      {series.length > 1 ? (
        <div className="t-linechart__legend" aria-hidden="true">
          {series.map((s, i) => (
            <span key={s.key} className="t-row" style={{ gap: 6 }}>
              <span className="t-linechart__key" style={{ background: chartColor(s.tone, i) }} />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="t-linechart__plot">
        <div className="t-linechart__axis" aria-hidden="true">
          {[...ticks].reverse().map((v) => (
            <span key={v}>{fmt(v)}</span>
          ))}
        </div>
        <div className="t-linechart__area">
          <svg
            viewBox={`0 0 ${W} ${plotH}`}
            style={{ height: plotH }}
            preserveAspectRatio="none"
            aria-hidden="true"
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - box.left) / (box.width || 1)) * W;
              if (!Number.isFinite(x)) return;
              setHover(Math.max(0, Math.min(n - 1, Math.round((x - pad) / (step || 1)))));
            }}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((v) => (
              <line key={v} className="t-linechart__grid" x1={0} x2={W} y1={yOf(v)} y2={yOf(v)} />
            ))}
            {series.map((s, i) =>
              linePaths(s.values, W, plotH, lo, hi, pad).map((d, j) => (
                <path
                  key={`${s.key}-${j}`}
                  className="t-linechart__line"
                  d={d}
                  style={{ stroke: chartColor(s.tone, i) }}
                />
              )),
            )}
            {hover != null ? (
              <line
                className="t-linechart__cross"
                x1={pad + hover * step}
                x2={pad + hover * step}
                y1={0}
                y2={plotH}
              />
            ) : null}
          </svg>
          <div className="t-linechart__x" aria-hidden="true">
            {categories.map((c, i) =>
              (i % every === 0 && n - 1 - i >= every) || i === n - 1 ? (
                <span
                  key={c + i}
                  style={{
                    left: `${((pad + i * step) / W) * 100}%`,
                    transform:
                      i === 0 ? "none" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {c}
                </span>
              ) : null,
            )}
          </div>
          {hover != null ? (
            <div
              className="t-tooltip t-linechart__tip"
              role="presentation"
              style={{ left: `${((pad + hover * step) / W) * 100}%` }}
            >
              <strong>{categories[hover]}</strong>
              {series.map((s, i) => (
                <span key={s.key} className="t-row" style={{ gap: 6 }}>
                  <span
                    className="t-linechart__key"
                    style={{ background: chartColor(s.tone, i) }}
                  />
                  {s.label} <span className="t-num">{fmt(s.values[hover] ?? null)}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <table className="t-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col" />
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={c + i}>
              <th scope="row">{c}</th>
              {series.map((s) => (
                <td key={s.key}>{fmt(s.values[i] ?? null)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export type BandChartProps = {
  label: string;
  /** The smallest and largest measured value; `null` is not measured and draws no span. */
  min: number | null;
  max: number | null;
  /** Drawn as a strong tick; `null` draws none. */
  median: number | null;
  /** The target range, drawn as a wash; values outside it are marked. */
  band?: { low: number; high: number };
  /** Single samples, drawn as dots around the span. */
  values?: readonly number[];
  /** The right end of the scale; the largest of `max`, `band.high` and this. */
  scaleMax?: number;
  width?: number;
};

/** One measure on a horizontal scale: span (min–max), target band, median tick and samples. */
export function BandChart({
  label,
  min,
  max,
  median,
  band,
  values = [],
  scaleMax,
  width = 640,
}: BandChartProps) {
  const { t, number } = useText();
  const measured = min != null || max != null || median != null || values.length > 0;
  const top = Math.max(scaleMax ?? 0, max ?? 0, band?.high ?? 0, ...values) * 1.04 || 1;
  const h = 64;
  const pad = 8;
  const x = (v: number) => pad + (v / top) * (width - pad * 2);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f));
  const show = (v: number | null) => (v == null ? "–" : number(v));
  const summary = measured
    ? t("primitives.band.summary", { min: show(min), median: show(median), max: show(max) })
    : t("primitives.meter.unmeasured");
  const outside = (v: number) => band != null && (v > band.high || v < band.low);
  return (
    <svg
      className="t-band"
      viewBox={`0 0 ${width} ${h + 18}`}
      width="100%"
      role="img"
      aria-label={`${label}: ${summary}`}
      data-state={measured ? undefined : "unmeasured"}
    >
      {band ? (
        <rect
          className="t-band__target"
          x={x(band.low)}
          y={10}
          width={Math.max(2, x(band.high) - x(band.low))}
          height={h - 20}
          rx={4}
        />
      ) : null}
      {!measured ? (
        <line className="t-band__none" x1={pad} x2={width - pad} y1={h / 2} y2={h / 2} />
      ) : null}
      {min != null && max != null ? (
        <g className="t-band__span">
          <line x1={x(min)} x2={x(max)} y1={h / 2} y2={h / 2} />
          <line x1={x(min)} x2={x(min)} y1={h / 2 - 7} y2={h / 2 + 7} />
          <line x1={x(max)} x2={x(max)} y1={h / 2 - 7} y2={h / 2 + 7} />
        </g>
      ) : null}
      {values.map((v, i) => (
        <circle
          key={i}
          className={cx("t-band__dot", outside(v) && "t-band__dot--out")}
          cx={x(v)}
          cy={h / 2 + (((i * 37) % 17) - 8)}
          r={2.2}
        />
      ))}
      {median != null ? (
        <line className="t-band__median" x1={x(median)} x2={x(median)} y1={4} y2={h - 4} />
      ) : null}
      {ticks.map((v, i) => (
        <text
          key={i}
          x={x(v)}
          y={h + 14}
          textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
          className="t-chart-text"
        >
          {number(v)}
        </text>
      ))}
    </svg>
  );
}
