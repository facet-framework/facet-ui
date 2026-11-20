import type { CSSProperties, ReactNode } from "react";

export type FieldRowProps = {
  containerStyle: CSSProperties;
  labelStyle: CSSProperties;
  valueStyle: CSSProperties;
  /** Factual label in capitals, e.g. "CADENCE". */
  label: string;
  /** Value — text or a composite node. */
  value: ReactNode;
  "data-testid"?: string;
};

/**
 * Field row: on the left the subject label, on the right the value from the
 * record. The basic form of every detail — one field, one row, no
 * interpretation.
 */
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
