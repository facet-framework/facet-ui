import type { CSSProperties, ReactNode } from "react";

export type ButtonProps = {
  computedStyle: CSSProperties;
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
  "data-testid"?: string;
};

/**
 * Button of the design language: fill or hairline, never rounded, never a shadow.
 * Hit area at least 32 px high.
 */
export function Button({ computedStyle, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} style={computedStyle} {...rest}>
      {children}
    </button>
  );
}

export default Button;
