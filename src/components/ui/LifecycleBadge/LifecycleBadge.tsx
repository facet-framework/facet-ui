import type { CSSProperties } from "react";

export type LifecycleBadgeProps = {
  containerStyle: CSSProperties;
  markStyle: CSSProperties;
  labelStyle: CSSProperties;
  ageStyle: CSSProperties;
  /** Plain words for the state, e.g. "active". */
  label: string;
  /** Days in the state, already formatted — empty if there is no date. */
  age: string;
  /** Complete statement for screen readers. */
  title: string;
  "data-testid"?: string;
};

/**
 * Lifecycle of a record. The state is encoded twice: shape of the badge
 * (filled · open · struck through) and word — never by colour alone.
 */
export function LifecycleBadge({
  containerStyle,
  markStyle,
  labelStyle,
  ageStyle,
  label,
  age,
  title,
  ...rest
}: LifecycleBadgeProps) {
  return (
    <span style={containerStyle} title={title} {...rest}>
      <span style={markStyle} aria-hidden="true" />
      <span style={labelStyle}>{label}</span>
      {age ? <span style={ageStyle}>{age}</span> : null}
    </span>
  );
}

export default LifecycleBadge;
