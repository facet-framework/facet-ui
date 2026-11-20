import type { CSSProperties, KeyboardEvent } from "react";

export type DepthStepView = {
  key: string;
  label: string;
  style: CSSProperties;
  current: boolean;
  onSelect: () => void;
};

export type DepthLadderProps = {
  containerStyle: CSSProperties;
  hintStyle: CSSProperties;
  steps: DepthStepView[];
  /** Label of the ladder for screen readers. */
  label: string;
  /** Hint about the keyboard controls. */
  hint: string;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  "data-testid"?: string;
};

/**
 * Mechanic 3 · depth ladder: answer → evidence → raw source.
 * One direction, one key, the same everywhere — instead of six tabs kept in stock.
 */
export function DepthLadder({
  containerStyle,
  hintStyle,
  steps,
  label,
  hint,
  onKeyDown,
  ...rest
}: DepthLadderProps) {
  return (
    <div
      style={containerStyle}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      {...rest}
    >
      {steps.map((step) => (
        <button
          key={step.key}
          type="button"
          role="tab"
          aria-selected={step.current}
          style={step.style}
          onClick={step.onSelect}
          onKeyDown={onKeyDown}
        >
          {step.label}
        </button>
      ))}
      <span style={hintStyle}>{hint}</span>
    </div>
  );
}

export default DepthLadder;
