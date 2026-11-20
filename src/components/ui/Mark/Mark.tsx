import type { CSSProperties } from "react";

const BUTTON_RESET: CSSProperties = {
  all: "unset",
  cursor: "pointer",
};

export type MarkBar = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;

  animationKey?: string;
};

export type MarkProps = {
  size: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  bars: MarkBar[];

  label: string;

  interactive: boolean;
  wrapperStyle: CSSProperties;
  onClick?: () => void;
  "data-testid"?: string;
};

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
