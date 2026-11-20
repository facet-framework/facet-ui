import type { CSSProperties } from "react";

export type DotProps = {
  /** Fully computed style — comes from `withDotLogic`. */
  computedStyle: CSSProperties;
  /** Plain text for screen readers, e.g. "overdue". */
  label?: string;
  "data-testid"?: string;
};

/**
 * State dot. It never stands alone: rank, weight or a word beside it carry the
 * same statement a second time.
 */
export function Dot({ computedStyle, label, ...rest }: DotProps) {
  return (
    <span
      style={computedStyle}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  );
}

export default Dot;
