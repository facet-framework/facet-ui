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

export function Button({ computedStyle, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} style={computedStyle} {...rest}>
      {children}
    </button>
  );
}

export default Button;
