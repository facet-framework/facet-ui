import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { SkeletonProps } from "./Skeleton";

export type WithSkeletonProps = Omit<SkeletonProps, "computedStyle" | "label"> & {
  /** Height in pixels — the final geometry of the line that will stand here later. */
  height?: number;
  /** Width as a CSS value. */
  width?: string | number;
  label?: string;
  style?: CSSProperties;
};

/** Computes the silhouette of the later content. */
export function withSkeletonLogic(Component: ComponentType<SkeletonProps>) {
  const Wrapped = ({
    height = 14,
    width = "100%",
    label: labelProp,
    style,
    ...rest
  }: WithSkeletonProps) => {
    const { t } = useText();
    const label = labelProp ?? t("elements.skeleton.loading");
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
