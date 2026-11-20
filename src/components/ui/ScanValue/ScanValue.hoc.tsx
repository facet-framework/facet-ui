import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { ScanValueProps } from "./ScanValue";

export type ScanOrigin = "scan" | "host";

export type WithScanValueProps = Omit<ScanValueProps, "computedStyle" | "originLabel"> & {
  /** `scan` = repo scan, `host` = connected measurement source. */
  origin?: ScanOrigin;
  /** Exact origin, e.g. "Repo scan of 2026-07-28". */
  originLabel?: string;
  style?: CSSProperties;
};

const DEFAULT_LABEL = {
  scan: "elements.scanValue.fromScan",
  host: "elements.scanValue.fromHost",
} as const;

/** Sets the dotted origin marking and phrases the plain text. */
export function withScanValueLogic(Component: ComponentType<ScanValueProps>) {
  const Wrapped = ({ origin = "scan", originLabel, style, ...rest }: WithScanValueProps) => {
    const { t } = useText();
    const label = originLabel ?? t(DEFAULT_LABEL[origin]);

    const computedStyle = useMemo<CSSProperties>(
      () => ({
        position: "relative",
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        color: color.soft,
        borderBottomStyle: "dotted",
        borderBottomWidth: 1,
        borderBottomColor: color.line2,
        cursor: "help",
        ...style,
      }),
      [style],
    );

    return <Component computedStyle={computedStyle} originLabel={label} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withScanValueLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
