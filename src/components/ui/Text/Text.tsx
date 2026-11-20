import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

export type TextElement = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "dt" | "dd" | "li";

export type TextProps = {
  as?: TextElement;

  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "style">;

export function Text({ as = "span", computedStyle, children, ...rest }: TextProps) {
  const Element = as as ElementType;
  return (
    <Element style={computedStyle} {...rest}>
      {children}
    </Element>
  );
}

export default Text;
