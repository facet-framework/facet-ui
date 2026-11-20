import type { CSSProperties } from "react";

export type DotProps = {
  computedStyle: CSSProperties;

  label?: string;
  "data-testid"?: string;
};

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
