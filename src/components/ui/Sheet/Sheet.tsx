import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type SheetProps = {
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
