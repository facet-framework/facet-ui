import type { CSSProperties, ReactNode } from "react";

export type QuietLineProps = {
  computedStyle: CSSProperties;
  children: ReactNode;
  "data-testid"?: string;
};

export function QuietLine({ computedStyle, children, ...rest }: QuietLineProps) {
  return (
    <p style={computedStyle} {...rest}>
      {children}
    </p>
  );
}

export default QuietLine;
