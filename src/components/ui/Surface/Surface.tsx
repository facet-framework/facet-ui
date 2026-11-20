import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type SurfaceProps = {
  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

export function Surface({ computedStyle, children, ...rest }: SurfaceProps) {
  return (
    <div style={computedStyle} {...rest}>
      {children}
    </div>
  );
}

export default Surface;
