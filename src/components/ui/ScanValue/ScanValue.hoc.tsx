import { localized } from "../../../i18n/legacy/components/ui/ScanValue/ScanValue.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font } from "../../../design-system/tokens";
import type { ScanValueProps } from "./ScanValue";

export type ScanOrigin = "scan" | "host";

export type WithScanValueProps = Omit<ScanValueProps, "computedStyle" | "originLabel"> & {
  origin?: ScanOrigin;

  originLabel?: string;
  style?: CSSProperties;
};

const DEFAULT_LABEL: Record<ScanOrigin, string> = {
  scan: localized.text1,
  host: localized.text2,
};

export function withScanValueLogic(Component: ComponentType<ScanValueProps>) {
  const Wrapped = ({ origin = "scan", originLabel, style, ...rest }: WithScanValueProps) => {
    const label = originLabel ?? DEFAULT_LABEL[origin];

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
