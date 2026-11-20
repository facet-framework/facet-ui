import type { CSSProperties, ReactNode } from "react";

export type ScanValueProps = {
  computedStyle: CSSProperties;
  children: ReactNode;

  originLabel: string;
  "data-testid"?: string;
};

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
