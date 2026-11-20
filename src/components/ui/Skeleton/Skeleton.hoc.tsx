import { localized } from "../../../i18n/legacy/components/ui/Skeleton/Skeleton.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color } from "../../../design-system/tokens";
import type { SkeletonProps } from "./Skeleton";

export type WithSkeletonProps = Omit<SkeletonProps, "computedStyle" | "label"> & {
  height?: number;

  width?: string | number;
  label?: string;
  style?: CSSProperties;
};

export function withSkeletonLogic(Component: ComponentType<SkeletonProps>) {
  const Wrapped = ({
    height = 14,
    width = "100%",
    label = localized.text1,
    style,
    ...rest
  }: WithSkeletonProps) => {
    const computedStyle = useMemo<CSSProperties>(
      () => ({ height, width, background: color.tint, flex: "0 0 auto", ...style }),
      [height, width, style],
    );

    return <Component computedStyle={computedStyle} label={label} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withSkeletonLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
