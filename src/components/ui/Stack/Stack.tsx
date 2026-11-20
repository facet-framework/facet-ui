import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type StackProps = {
  /** Fully computed flex style — comes from `withStackLogic`. */
  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

/** Layout primitive: a flex track that only knows the computed style. */
export function Stack({ computedStyle, children, ...rest }: StackProps) {
  return (
    <div style={computedStyle} {...rest}>
      {children}
    </div>
  );
}

export default Stack;
