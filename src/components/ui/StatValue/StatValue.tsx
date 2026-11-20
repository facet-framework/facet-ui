import type { CSSProperties, ReactNode } from "react";

export type StatValueProps = {
  containerStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
  hintStyle: CSSProperties;
  /** Factual label in capitals, e.g. "OVERDUE". */
  label: string;
  /** The value itself — number, share or a counter. */
  value: ReactNode;
  /** Classification below it, e.g. "of 38 promises". */
  hint?: string;
  "data-testid"?: string;
};

/**
 * Metric: factual label, value, classification. The classification is
 * mandatory as soon as the value alone says nothing — without a reference
 * total a number is decoration.
 */
export function StatValue({
  containerStyle,
  labelStyle,
  valueStyle,
  hintStyle,
  label,
  value,
  hint,
  ...rest
}: StatValueProps) {
  return (
    <div style={containerStyle} {...rest}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
      {hint ? <span style={hintStyle}>{hint}</span> : null}
    </div>
  );
}

export default StatValue;
