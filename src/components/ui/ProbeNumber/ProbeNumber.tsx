import type { CSSProperties, ReactNode } from "react";

export type ProbeNumberProps = {
  computedStyle: CSSProperties;
  children: ReactNode;

  expanded: boolean;

  label: string;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "data-testid"?: string;
};

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
