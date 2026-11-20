import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type SheetProps = {
  scrimStyle: CSSProperties;
  panelStyle: CSSProperties;
  open: boolean;
  /** Label of the area, e.g. "Register". */
  label: string;
  children: ReactNode;
  onScrimClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  panelRef?: (element: HTMLDivElement | null) => void;
  "data-testid"?: string;
};

/**
 * Register — slides in from below. Mechanic 9 · direction of origin:
 * looking things up comes from the filing tray, hence from below and back down.
 */
export function Sheet({
  scrimStyle,
  panelStyle,
  open,
  label,
  children,
  onScrimClick,
  onKeyDown,
  panelRef,
  ...rest
}: SheetProps) {
  if (!open) return null;

  // The veil is a surface, not a control: clicking it is a
  // convenience for the mouse, and the keyboard way to close is Esc on the
  // dialog. A focusable veil would be an extra stop before the
  // dialog that can do nothing other than what Esc already does. The click on the
  // dialog itself only stops the event and operates nothing.
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
        data-up
      >
        {children}
      </div>
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
}

export default Sheet;
