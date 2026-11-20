import type { CSSProperties, ReactNode } from "react";

export type EmptyStateProps = {
  containerStyle: CSSProperties;
  headlineStyle: CSSProperties;
  bodyStyle: CSSProperties;
  /** What is missing — as a sentence, not as an empty panel. */
  headline: string;
  /** What it depends on and what it means. */
  body?: string;
  /** Optional way forward. */
  action?: ReactNode;
  "data-testid"?: string;
};

/**
 * Empty state: a field is not filled. The best screen in this field is the
 * empty one — it needs a sentence, not axes without data.
 */
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
