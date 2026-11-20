import type { CSSProperties } from "react";

export type SkeletonProps = {
  computedStyle: CSSProperties;
  /** Plain text of what is being loaded right now. */
  label: string;
  "data-testid"?: string;
};

/**
 * Loading placeholder in the final geometry: if the layout shifts after
 * loading, the skeleton was a lie.
 */
export function Skeleton({ computedStyle, label, ...rest }: SkeletonProps) {
  return <div style={computedStyle} role="status" aria-busy="true" aria-label={label} {...rest} />;
}

export default Skeleton;
