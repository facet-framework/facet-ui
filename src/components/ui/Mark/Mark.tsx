import type { CSSProperties } from "react";

const BUTTON_RESET: CSSProperties = {
  all: "unset",
  cursor: "pointer",
};

/** One bar of the mark - two in the resting state, five during motion. */
export type MarkBar = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  /** `data-facet-mark-bar` - the keyframes themselves live centrally in tokens.css. */
  animationKey?: string;
};

export type MarkProps = {
  /** Width in pixels; the height follows from `viewBoxWidth`/`viewBoxHeight`. */
  size: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  bars: MarkBar[];
  /** Plain words for screen readers, e.g. "Facet Atlas". */
  label: string;
  /** `brand` is clickable (replay); the other two are not. */
  interactive: boolean;
  wrapperStyle: CSSProperties;
  onClick?: () => void;
  "data-testid"?: string;
};

/**
 * The Facet Atlas mark: two offset blocks. This view draws the bars and field size that
 * `withMarkLogic` hands it - it does not know which variant that is.
 */
export function Mark({
  size,
  viewBoxWidth,
  viewBoxHeight,
  bars,
  label,
  interactive,
  wrapperStyle,
  onClick,
  ...rest
}: MarkProps) {
  const height = Math.round((size * viewBoxHeight) / viewBoxWidth);
  const svg = (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      width={size}
      height={height}
      aria-hidden="true"
    >
      {bars.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          fill={bar.fill}
          data-facet-mark-bar={bar.animationKey}
        />
      ))}
    </svg>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        style={{ ...BUTTON_RESET, ...wrapperStyle }}
        {...rest}
      >
        {svg}
      </button>
    );
  }

  return (
    <span role="img" aria-label={label} style={wrapperStyle} {...rest}>
      {svg}
    </span>
  );
}

export default Mark;
