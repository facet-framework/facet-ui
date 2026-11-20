import type { CSSProperties, ReactNode } from "react";

export type ProbeNumberProps = {
  computedStyle: CSSProperties;
  children: ReactNode;
  /** Is the probe open? Drives `aria-expanded`. */
  expanded: boolean;
  /** Plain text of what the probe opens. */
  label: string;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "data-testid"?: string;
};

/**
 * Probe — a number in the lead sentence that opens its derivation.
 * Mechanic 1: numbers in a sentence are read, numbers in tiles are counted.
 */
export function ProbeNumber({
  computedStyle,
  children,
  expanded,
  label,
  disabled,
  ...rest
}: ProbeNumberProps) {
  return (
    <button
      type="button"
      style={computedStyle}
      aria-expanded={expanded}
      aria-label={label}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default ProbeNumber;
