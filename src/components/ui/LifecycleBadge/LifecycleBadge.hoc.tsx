import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { lifecycleLabel } from "../../../core";
import { color, font, fontSize, lifecycleColor } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { LifecycleBadgeProps } from "./LifecycleBadge";

export type WithLifecycleBadgeProps = Omit<
  LifecycleBadgeProps,
  "containerStyle" | "markStyle" | "labelStyle" | "ageStyle" | "label" | "age" | "title"
> & {
  /** Value from `lifecycle`. */
  lifecycle: string;
  /** `lineage.created_at` — the basis for the days in the state. */
  createdAt?: string;
  /** Reference date, today by default. Settable for deterministic tests. */
  today?: Date;
  /** `lineage.superseded_by`, if the record was superseded. */
  supersededBy?: string | null;
  style?: CSSProperties;
};

const DAY_MS = 86_400_000;

/** Computes the days in the state and picks the badge's shape and tone. */
export function withLifecycleBadgeLogic(Component: ComponentType<LifecycleBadgeProps>) {
  const Wrapped = ({
    lifecycle,
    createdAt,
    today,
    supersededBy,
    style,
    ...rest
  }: WithLifecycleBadgeProps) => {
    const text = useText();
    const { t, plural } = text;
    const tone = lifecycleColor(lifecycle);
    const label = lifecycleLabel(lifecycle, text);

    const days = useMemo(() => {
      if (!createdAt) return null;
      const created = new Date(createdAt);
      if (Number.isNaN(created.getTime())) return null;
      const reference = today ?? new Date();
      return Math.max(0, Math.round((reference.getTime() - created.getTime()) / DAY_MS));
    }, [createdAt, today]);

    const age = days == null ? "" : t("elements.lifecycleBadge.age", { days });

    const title = useMemo(() => {
      const parts = [label];
      if (days != null) parts.push(plural("elements.lifecycleBadge.sinceDays", days));
      if (supersededBy) parts.push(t("elements.lifecycleBadge.supersededBy", { id: supersededBy }));
      return parts.join(" · ");
    }, [days, label, plural, supersededBy, t]);

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
        // planned: open shape
        return { ...base, background: "transparent", boxShadow: `inset 0 0 0 1px ${tone}` };
      }
      if (lifecycle === "deprecated") {
        // deprecated: flat shape, half height
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
