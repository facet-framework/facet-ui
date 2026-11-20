import type { ReactNode } from "react";
import { useText, type FacetText } from "../../i18n/TextProvider";
import type { CalibrationView, TestMix, TrendPoint } from "./model";

export function pct(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

export const pctText = (p: number | null, t: FacetText["t"]) =>
  p == null ? "—" : t("a.common.percent", { value: p });

export function shareTone(p: number | null): "ok" | "warn" | "plan" {
  if (p == null) return "plan";
  return p >= 95 ? "ok" : "warn";
}

export function shareFill(p: number | null): string {
  if (p == null) return "var(--t-faint)";
  const ok = Math.max(0, Math.min(100, (p - 50) * 2));
  return `color-mix(in srgb, var(--t-ok) ${ok}%, var(--t-warn))`;
}

export function TrendChart({
  points,
  width = 900,
  height = 150,
  label,
}: {
  points: TrendPoint[];
  width?: number;
  height?: number;
  label: string;
}) {
  const { t } = useText();
  if (points.length < 2) {
    return (
      <p className="t-meta" data-testid="trend-empty">
        {t("a.chart.trendEmpty")}
      </p>
    );
  }
  const max = Math.max(...points.map((p) => p.scenarios));
  const x = (i: number) => (i / (points.length - 1)) * (width - 8) + 4;
  const y = (v: number) => height - 18 - (v / max) * (height - 30);
  const line = (k: "scenarios" | "proven") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const area = `${line("proven")} L${x(points.length - 1)},${height - 18} L${x(0)},${height - 18} Z`;
  const last = points[points.length - 1];
  return (
    <svg
      className="t-a-chart t-a-chart--bars"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <line x1="0" x2={width} y1={height - 18} y2={height - 18} className="t-a-chart__axis" />
      <path d={area} className="t-a-chart__area" />
      <path d={line("scenarios")} className="t-a-chart__line t-a-chart__line--muted" />
      <path d={line("proven")} className="t-a-chart__line" />
      <circle cx={x(points.length - 1)} cy={y(last.proven)} r="3.5" className="t-a-chart__dot" />
      <text x="4" y={height - 4} className="t-a-chart__tick">
        {points[0].date}
      </text>
      <text x={width - 4} y={height - 4} textAnchor="end" className="t-a-chart__tick">
        {last.date}
      </text>
    </svg>
  );
}

const CALIBRATION_TEXT = {
  "scenarios per record": "a.calibration.scenariosPerRecord",
  "records per capability": "a.calibration.recordsPerCapability",
  "capabilities per domain": "a.calibration.capabilitiesPerArea",
  "records per anchored file": "a.calibration.recordsPerAnchoredFile",
} as const;

function calibrationLabel(m: { key: string; label: string }, t: FacetText["t"]): string {
  const key = CALIBRATION_TEXT[m.key as keyof typeof CALIBRATION_TEXT];
  return key ? t(key) : m.label;
}

export function BandChart({ m }: { m: CalibrationView }) {
  const { t, number: nf } = useText();
  const w = 300;
  const lo = Math.min(m.min, m.low, m.median);
  const hi = Math.max(m.max, m.high, m.median);
  const span = Math.max(1, hi - lo);
  const x = (v: number) => 8 + ((v - lo) / span) * (w - 16);
  return (
    <div className="t-a-band" data-testid={`band-${m.key}`}>
      <div className="t-row t-row--between">
        <span className="t-a-band__label">{calibrationLabel(m, t)}</span>
        <span className="t-meta">
          Median {nf(m.median)} · n {nf(m.samples)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} 34`}
        className="t-a-band__svg"
        role="img"
        aria-label={t("a.chart.bandLabel", {
          label: calibrationLabel(m, t),
          low: m.low,
          high: m.high,
          median: m.median,
        })}
      >
        <line x1={x(m.min)} x2={x(m.max)} y1="14" y2="14" className="t-a-band__range" />
        <rect
          x={x(m.low)}
          y="7"
          width={Math.max(3, x(m.high) - x(m.low))}
          height="14"
          rx="3"
          className="t-a-band__band"
        />
        <line x1={x(m.median)} x2={x(m.median)} y1="3" y2="25" className="t-a-band__median" />
        <text x={x(m.min)} y="33" className="t-a-chart__tick">
          {m.min}
        </text>
        <text x={x(m.max)} y="33" textAnchor="end" className="t-a-chart__tick">
          {m.max}
        </text>
      </svg>
      <div className="t-row t-meta" style={{ gap: 12 }}>
        <span>{t("a.chart.band", { low: m.low, high: m.high })}</span>
        <span className={m.below ? "t-warn" : undefined}>
          {t("a.chart.below", { count: m.below })}
        </span>
        <span className={m.above ? "t-warn" : undefined}>
          {t("a.chart.above", { count: m.above })}
        </span>
      </div>
    </div>
  );
}

export function Ring({
  value,
  size = 64,
  label,
  children,
}: {
  value: number | null;
  size?: number;
  label: string;
  children?: ReactNode;
}) {
  const { t } = useText();
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <span className="t-a-ring" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={`${label}: ${pctText(value, t)}`}
      >
        <circle cx={size / 2} cy={size / 2} r={r} className="t-a-ring__track" />
        {value != null ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className="t-a-ring__value"
            style={{ stroke: shareFill(value) }}
            strokeDasharray={`${(v / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </svg>
      <span className="t-a-ring__in" data-small={size < 56 || undefined}>
        {children ?? (size < 56 ? (value == null ? "—" : value) : pctText(value, t))}
      </span>
    </span>
  );
}

export function Pyramid({ mix }: { mix: TestMix | null }) {
  const { t, number: nf } = useText();
  const layers: [string, number | null][] = [
    ["E2E", mix ? mix.e2e : null],
    ["Integration", mix ? mix.integration : null],
    ["Unit", mix ? mix.unit : null],
  ];
  const total = mix ? mix.e2e + mix.integration + mix.unit : 0;
  return (
    <div className="t-a-pyramid" role="list" aria-label={t("a.chart.testsByKind")}>
      {layers.map(([k, v], i) => (
        <div
          key={k}
          role="listitem"
          className="t-a-pyramid__layer"
          style={{ width: `${46 + i * 27}%` }}
        >
          <span>{k}</span>
          <b className="t-num">{v == null ? "—" : nf(v)}</b>
          <span className="t-meta">
            {v == null ? t("a.common.unmeasured") : pctText(pct(v, total), t)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Mosaic({
  cells,
  label,
  size = 9,
}: {
  cells: boolean[];
  label: string;
  size?: number;
}) {
  const { t } = useText();
  const open = cells.filter((c) => !c).length;
  return (
    <span
      className="t-a-mosaic"
      role="img"
      aria-label={t("a.chart.mosaic", { label, proven: cells.length - open, total: cells.length })}
      style={{ ["--t-a-cell" as string]: `${size}px` }}
    >
      {cells.map((c, i) => (
        <i key={i} data-proven={c || undefined} />
      ))}
    </span>
  );
}

export function StackBar({
  parts,
  label,
}: {
  parts: { key: string; label: string; value: number; tone: string }[];
  label: string;
}) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <div
      className="t-a-stack"
      role="img"
      aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}
    >
      {parts.map((p) => (
        <span key={p.key} style={{ flexGrow: total ? p.value / total : 0, background: p.tone }} />
      ))}
    </div>
  );
}
