import type { CSSProperties } from "react";

export type ErrorStateProps = {
  containerStyle: CSSProperties;
  headlineStyle: CSSProperties;
  originStyle: CSSProperties;
  retryStyle: CSSProperties;
  /** Cause in plain text. */
  headline: string;
  /** Origin: file and line — an error without a location is not a report. */
  origin?: string;
  onRetry?: () => void;
  retryLabel: string;
  "data-testid"?: string;
};

/**
 * Error state: cause, origin (file, line), the way back. It never replaces the
 * whole application — a broken record stays a broken record.
 */
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
