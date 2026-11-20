import type { CSSProperties } from "react";

export type SkeletonProps = {
  computedStyle: CSSProperties;

  label: string;
  "data-testid"?: string;
};

export function Skeleton({ computedStyle, label, ...rest }: SkeletonProps) {
  return <div style={computedStyle} role="status" aria-busy="true" aria-label={label} {...rest} />;
}

export default Skeleton;
