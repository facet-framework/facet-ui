import type { CSSProperties } from "react";

export type LifecycleBadgeProps = {
  containerStyle: CSSProperties;
  markStyle: CSSProperties;
  labelStyle: CSSProperties;
  ageStyle: CSSProperties;

  label: string;

  age: string;

  title: string;
  "data-testid"?: string;
};

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
