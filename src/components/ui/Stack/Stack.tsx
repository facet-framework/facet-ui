import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type StackProps = {
  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

export function Stack({ computedStyle, children, ...rest }: StackProps) {
  return (
    <div style={computedStyle} {...rest}>
      {children}
    </div>
  );
}

export default Stack;
