import type { CSSProperties } from "react";

export type CounterProps = {
  /** Already formatted value to display. */
  display: string;
  computedStyle: CSSProperties;
  /** The final value as plain text — it stays fixed even during the count-up. */
  finalLabel: string;
  "data-testid"?: string;
};

/**
 * Number landing: the value counts up once on first appearance.
 * Screen readers get the final value immediately — the motion is a bonus.
 */
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
