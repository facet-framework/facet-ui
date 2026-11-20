import type { CSSProperties, ReactNode } from "react";

export type StatValueProps = {
  containerStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
  hintStyle: CSSProperties;

  label: string;

  value: ReactNode;

  hint?: string;
  "data-testid"?: string;
};

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
