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
import type { SheetProps } from "./Sheet";

export type WithSheetProps = Omit<
  SheetProps,
  "scrimStyle" | "panelStyle" | "onScrimClick" | "onKeyDown" | "panelRef"
> & {
  onClose?: () => void;

  height?: string;
  style?: CSSProperties;
};

export function withSheetLogic(Component: ComponentType<SheetProps>) {
  const Wrapped = ({ open, onClose, height = "86%", style, ...rest }: WithSheetProps) => {
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
        alignItems: "flex-end",
        zIndex: 40,
      }),
      [],
    );

    const panelStyle = useMemo<CSSProperties>(
      () => ({
        width: "100%",
        height,
        minHeight: 0,
        background: color.paper,
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: color.line2,
        display: "flex",
        flexDirection: "column",
        outline: "none",
        ...style,
      }),
      [height, style],
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
  Memoized.displayName = `withSheetLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
