import type { CSSProperties, ReactNode } from "react";

export type QuietLineProps = {
  computedStyle: CSSProperties;
  children: ReactNode;
  "data-testid"?: string;
};

/**
 * Quiet line — the statement "nothing is open here".
 * Mono, muted, without a frame: calm needs a sign, otherwise it looks like a
 * loading error. The best screen in this field is the empty one.
 */
export function QuietLine({ computedStyle, children, ...rest }: QuietLineProps) {
  return (
    <p style={computedStyle} {...rest}>
      {children}
    </p>
  );
}

export default QuietLine;
