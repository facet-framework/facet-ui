import type { CSSProperties, ReactNode } from "react";

export type ScanValueProps = {
  computedStyle: CSSProperties;
  children: ReactNode;
  /** Plain text of the origin, shown as `title` and to screen readers. */
  originLabel: string;
  "data-testid"?: string;
};

/**
 * Host material: a value that does not come from the FACET schema but from the
 * repo scan. A dotted underline plus the plain text of the origin — so it is
 * always clear what the record says and what the scan contributes.
 */
export function ScanValue({ computedStyle, children, originLabel, ...rest }: ScanValueProps) {
  return (
    <span style={computedStyle} title={originLabel} {...rest}>
      {children}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {` (${originLabel})`}
      </span>
    </span>
  );
}

export default ScanValue;
