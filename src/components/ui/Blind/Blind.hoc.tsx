import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { color } from "../../../design-system/tokens";
import type { BlindProps } from "./Blind";

export type WithBlindProps = Omit<
  BlindProps,
  "scrimStyle" | "panelStyle" | "onScrimClick" | "onKeyDown" | "panelRef"
> & {
  /** Esc goes back exactly one level — first the depth, then the blind. */
  onClose?: () => void;
  /** Width of the blind. */
  width?: number | string;
  style?: CSSProperties;
};

/** Owns the blind's focus takeover and Escape handling. */
// @facet: interface/overlays/side-dialog
// @facet-role: primary
export function withBlindLogic(Component: ComponentType<BlindProps>) {
  const Wrapped = ({ open, onClose, width = 720, style, ...rest }: WithBlindProps) => {
    const panelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (open) panelRef.current?.focus();
    }, [open]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose?.();
        }
      },
      [onClose],
    );

    const handleScrimClick = useCallback(() => onClose?.(), [onClose]);

    const setPanelRef = useCallback((element: HTMLDivElement | null) => {
      panelRef.current = element;
    }, []);

    const scrimStyle = useMemo<CSSProperties>(
      () => ({
        position: "fixed",
        inset: 0,
        background: color.scrim,
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 50,
      }),
      [],
    );

    const panelStyle = useMemo<CSSProperties>(
      () => ({
        width,
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        background: color.paper,
        borderLeftStyle: "solid",
        borderLeftWidth: 1,
        borderLeftColor: color.line2,
        display: "flex",
        flexDirection: "column",
        outline: "none",
        ...style,
      }),
      [width, style],
    );

    return (
      <Component
        scrimStyle={scrimStyle}
        panelStyle={panelStyle}
        open={open}
        onScrimClick={handleScrimClick}
        onKeyDown={handleKeyDown}
        panelRef={setPanelRef}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withBlindLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
