import type { CSSProperties } from "react";

export type ErrorStateProps = {
  containerStyle: CSSProperties;
  headlineStyle: CSSProperties;
  originStyle: CSSProperties;
  retryStyle: CSSProperties;

  headline: string;

  origin?: string;
  onRetry?: () => void;
  retryLabel: string;
  "data-testid"?: string;
};

export function ErrorState({
  containerStyle,
  headlineStyle,
  originStyle,
  retryStyle,
  headline,
  origin,
  onRetry,
  retryLabel,
  ...rest
}: ErrorStateProps) {
  return (
    <div style={containerStyle} role="alert" {...rest}>
      <p style={headlineStyle}>{headline}</p>
      {origin ? <p style={originStyle}>{origin}</p> : null}
      {onRetry ? (
        <button type="button" style={retryStyle} onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
