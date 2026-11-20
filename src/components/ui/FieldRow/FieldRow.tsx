import type { CSSProperties, ReactNode } from "react";

export type FieldRowProps = {
  containerStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;

  label: string;

  value: ReactNode;
  "data-testid"?: string;
};

export function FieldRow({
  containerStyle,
  labelStyle,
  valueStyle,
  label,
  value,
  ...rest
}: FieldRowProps) {
  return (
    <div style={containerStyle} {...rest}>
      <dt style={labelStyle}>{label}</dt>
      <dd style={valueStyle}>{value}</dd>
    </div>
  );
}

export default FieldRow;
