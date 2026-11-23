import type { ReactNode } from "react";
import { useText } from "../i18n/TextProvider";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export type RingMeterProps = {
  /** A share between 0 and 1. `null` is not measured: a dashed ring and a dash, never zero. */
  value: number | null;
  /** The accessible name, e.g. "Scenarios with a test". */
  label: string;
  /** Text in the middle; the whole percent of `value` by default. */
  display?: ReactNode;
  /** Words for screen readers instead of the percent, e.g. "31 of 38". */
  valueText?: string;
  tone?: "signal" | "ok" | "warn" | "plan" | "bad";
  size?: number;
  stroke?: number;
};

/**
 * A share as a ring with the number in its middle: the shape alone is not a
 * statement. It is a `meter` like the bar `Meter`, for places where a figure
 * stands on its own, e.g. at the head of a card.
 */
export function RingMeter({
  value,
  label,
  display,
  valueText,
  tone = "signal",
  size = 96,
  stroke = 8,
}: RingMeterProps) {
  const { t } = useText();
  const measured = value != null && Number.isFinite(value);
  const share = measured ? Math.max(0, Math.min(1, value)) : 0;
  const percent = Math.round(share * 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * share;
  const centre = size / 2;
  return (
    <div
      className={cx("t-ring", !measured && "t-ring--unmeasured")}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={measured ? percent : undefined}
      aria-valuetext={
        measured
          ? (valueText ?? t("primitives.chart.percent", { value: percent }))
          : t("primitives.meter.unmeasured")
      }
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="t-ring__track"
          cx={centre}
          cy={centre}
          r={radius}
          style={{ strokeWidth: measured ? stroke : Math.max(1.5, stroke / 4) }}
        />
        {measured && share > 0 ? (
          <circle
            className="t-ring__value"
            cx={centre}
            cy={centre}
            r={radius}
            strokeDasharray={`${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}`}
            transform={`rotate(-90 ${centre} ${centre})`}
            style={{ strokeWidth: stroke, stroke: `var(--t-${tone})` }}
          />
        ) : null}
      </svg>
      <span className="t-ring__display" aria-hidden="true">
        {measured ? (display ?? t("primitives.chart.percent", { value: percent })) : "—"}
      </span>
    </div>
  );
}
