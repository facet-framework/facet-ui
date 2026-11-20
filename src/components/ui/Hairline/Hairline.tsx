import type { CSSProperties } from "react";

export type HairlineProps = {
  computedStyle: CSSProperties;

  role?: string;
  "aria-orientation"?: "horizontal" | "vertical";
  "data-testid"?: string;
};

export function Hairline({ computedStyle, ...rest }: HairlineProps) {
  return <div style={computedStyle} {...rest} />;
}

export default Hairline;
