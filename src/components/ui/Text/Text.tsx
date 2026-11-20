import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

/** Elements `Text` may render — semantics stay the caller's business. */
export type TextElement = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "dt" | "dd" | "li";

export type TextProps = {
  /** Rendered element. Default: `span`. */
  as?: TextElement;
  /** Fully computed style — comes from `withTextLogic`. */
  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "style">;

/**
 * Text primitive of the design system. Purely presentational: it knows
 * neither variants nor tones, only the fully computed style.
 */
export function Text({ as = "span", computedStyle, children, ...rest }: TextProps) {
  const Element = as as ElementType;
  return (
    <Element style={computedStyle} {...rest}>
      {children}
    </Element>
  );
}

export default Text;
