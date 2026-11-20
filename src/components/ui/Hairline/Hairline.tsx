import type { CSSProperties } from "react";

export type HairlineProps = {
  /** Fully computed style — comes from `withHairlineLogic`. */
  computedStyle: CSSProperties;
  /** Invisible to screen readers, as long as it only carries structure. */
  role?: string;
  "aria-orientation"?: "horizontal" | "vertical";
  "data-testid"?: string;
};

/**
 * Hairline — the only separator of the design language.
 * No borders, no shadows, no rounded corners.
 */
export function Hairline({ computedStyle, ...rest }: HairlineProps) {
  return <div style={computedStyle} {...rest} />;
}

export default Hairline;
