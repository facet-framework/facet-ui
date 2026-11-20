import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type SurfaceProps = {
  /** Fully computed style — it comes from `withSurfaceLogic`. */
  computedStyle: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

/**
 * Surface — carries content without a boxed look: paper, surface or tint,
 * separated by hairlines instead of borders.
 */
export function Surface({ computedStyle, children, ...rest }: SurfaceProps) {
  return (
    <div style={computedStyle} {...rest}>
      {children}
    </div>
  );
}

export default Surface;
