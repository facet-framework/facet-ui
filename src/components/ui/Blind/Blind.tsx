import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type BlindProps = {
  scrimStyle: CSSProperties;
  panelStyle: CSSProperties;
  open: boolean;
  /** Label of the region, e.g. "Detail: Quick add". */
  label: string;
  children: ReactNode;
  onScrimClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  panelRef?: (element: HTMLDivElement | null) => void;
  "data-testid"?: string;
};

/**
 * Detail — slides in from the right. Mechanic 9 · direction of origin: the
 * detail comes from the depth and goes back the same way.
 */
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

  // The scrim is a surface, not a control: clicking it is a convenience for
  // the mouse, and the keyboard way to close is Esc on the dialog. A
  // focusable scrim would be an extra stop before the dialog that can do
  // nothing but what Esc already does. The click handler on the dialog itself
  // only stops the event and operates nothing.
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
