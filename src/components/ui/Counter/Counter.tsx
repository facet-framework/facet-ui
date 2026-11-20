import type { CSSProperties } from "react";

export type CounterProps = {
  display: string;
  computedStyle: CSSProperties;

  finalLabel: string;
  "data-testid"?: string;
};

export function Counter({ display, computedStyle, finalLabel, ...rest }: CounterProps) {
  return (
    <span style={computedStyle} {...rest}>
      <span aria-hidden="true">{display}</span>
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
        {finalLabel}
      </span>
    </span>
  );
}

export default Counter;
