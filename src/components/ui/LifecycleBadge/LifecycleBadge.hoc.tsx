import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/LifecycleBadge/LifecycleBadge.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import {
  color,
  font,
  fontSize,
  lifecycleColor,
  LIFECYCLE_LABEL,
} from "../../../design-system/tokens";
import type { LifecycleBadgeProps } from "./LifecycleBadge";

export type WithLifecycleBadgeProps = Omit<
  LifecycleBadgeProps,
  "containerStyle" | "markStyle" | "labelStyle" | "ageStyle" | "label" | "age" | "title"
> & {
  lifecycle: string;

  createdAt?: string;

  today?: Date;

  supersededBy?: string | null;
  style?: CSSProperties;
};

const DAY_MS = 86_400_000;

export function withLifecycleBadgeLogic(Component: ComponentType<LifecycleBadgeProps>) {
  const Wrapped = ({
    lifecycle,
    createdAt,
    today,
    supersededBy,
    style,
    ...rest
  }: WithLifecycleBadgeProps) => {
    const tone = lifecycleColor(lifecycle);
    const label = LIFECYCLE_LABEL[lifecycle] ?? lifecycle;

    const days = useMemo(() => {
      if (!createdAt) return null;
      const created = new Date(createdAt);
      if (Number.isNaN(created.getTime())) return null;
      const reference = today ?? new Date();
      return Math.max(0, Math.round((reference.getTime() - created.getTime()) / DAY_MS));
    }, [createdAt, today]);

    const age = days == null ? "" : `${days} T`;

    const title = useMemo(() => {
      const parts = [label];
      if (days != null) parts.push(`${labelText.text332}${days}${labelText.text333}`);
      if (supersededBy) parts.push(`${localized.text1}${supersededBy}`);
      return parts.join(" · ");
    }, [days, label, supersededBy]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        ...style,
      }),
      [style],
    );

    const markStyle = useMemo<CSSProperties>(() => {
      const base: CSSProperties = { width: 7, height: 7, flex: "0 0 auto", background: tone };
      if (lifecycle === "planned") {
        return { ...base, background: "transparent", boxShadow: `inset 0 0 0 1px ${tone}` };
      }
      if (lifecycle === "deprecated") {
        return { ...base, height: 2, alignSelf: "center" };
      }
      return base;
    }, [lifecycle, tone]);

    const labelStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: tone,
      }),
      [tone],
    );

    const ageStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: fontSize.caption,
        color: color.faint,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        markStyle={markStyle}
        labelStyle={labelStyle}
        ageStyle={ageStyle}
        label={label}
        age={age}
        title={title}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withLifecycleBadgeLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
