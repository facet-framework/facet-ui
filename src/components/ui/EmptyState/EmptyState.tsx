import type { CSSProperties, ReactNode } from "react";

export type EmptyStateProps = {
  containerStyle: CSSProperties;
  headlineStyle: CSSProperties;
  bodyStyle: CSSProperties;

  headline: string;

  body?: string;

  action?: ReactNode;
  "data-testid"?: string;
};

export function EmptyState({
  containerStyle,
  headlineStyle,
  bodyStyle,
  headline,
  body,
  action,
  ...rest
}: EmptyStateProps) {
  return (
    <div style={containerStyle} role="status" {...rest}>
      <p style={headlineStyle}>{headline}</p>
      {body ? <p style={bodyStyle}>{body}</p> : null}
      {action}
    </div>
  );
}

export default EmptyState;
