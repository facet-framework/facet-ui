import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type BlindProps = {
  scrimStyle: CSSProperties;
  panelStyle: CSSProperties;
  open: boolean;

  label: string;
  children: ReactNode;
  onScrimClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  panelRef?: (element: HTMLDivElement | null) => void;
  "data-testid"?: string;
};

export function Blind({
  scrimStyle,
  panelStyle,
  open,
  label,
  children,
  onScrimClick,
  onKeyDown,
  panelRef,
  ...rest
}: BlindProps) {
  if (!open) return null;

  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
  return (
    <div style={scrimStyle} role="presentation" onClick={onScrimClick} data-in {...rest}>
      <div
        ref={panelRef}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        data-right
      >
        {children}
      </div>
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
}

export default Blind;
