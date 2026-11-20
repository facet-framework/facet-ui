import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/Seal/Seal.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { FacetRecord } from "../../../core";
import {
  color,
  FACET_LABEL,
  FACETS,
  font,
  fontSize,
  type Facet,
} from "../../../design-system/tokens";
import type { SealProps, SealStripe } from "./Seal";

export type WithSealProps = Omit<
  SealProps,
  "containerStyle" | "countStyle" | "stripes" | "count" | "label"
> & {
  record?: Pick<FacetRecord, "present">;

  present?: Partial<Record<Facet, boolean>>;

  height?: number;

  hideCount?: boolean;
  style?: CSSProperties;
};

export function withSealLogic(Component: ComponentType<SealProps>) {
  const Wrapped = ({ record, present, height = 14, hideCount, style, ...rest }: WithSealProps) => {
    const filled = useMemo(
      () =>
        FACETS.reduce<Record<Facet, boolean>>(
          (acc, facet) => {
            acc[facet] = Boolean(present?.[facet] ?? record?.present?.[facet]);
            return acc;
          },
          {} as Record<Facet, boolean>,
        ),
      [present, record],
    );

    const filledCount = useMemo(() => FACETS.filter((facet) => filled[facet]).length, [filled]);

    const stripes = useMemo<SealStripe[]>(
      () =>
        FACETS.map((facet) => ({
          key: facet,
          label: `${FACET_LABEL[facet]} — ${filled[facet] ? localized.text1 : labelText.text21}`,
          filled: filled[facet],
          style: {
            display: "inline-block",
            width: 3,
            height,
            background: filled[facet] ? color.ink : "transparent",
            boxShadow: filled[facet] ? undefined : `inset 0 0 0 1px ${color.line2}`,
          },
        })),
      [filled, height],
    );

    const label = useMemo(() => {
      const names = FACETS.filter((facet) => filled[facet]).map((facet) => FACET_LABEL[facet]);
      return names.length ? `${filledCount}${localized.text2}${names.join(", ")}` : localized.text3;
    }, [filled, filledCount]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "inline-flex", alignItems: "center", gap: 2, ...style }),
      [style],
    );

    const countStyle = useMemo<CSSProperties>(
      () => ({
        display: hideCount ? "none" : "inline",
        marginLeft: 6,
        fontFamily: font.mono,
        fontVariantNumeric: "tabular-nums",
        fontSize: fontSize.caption,
        color: color.dim,
      }),
      [hideCount],
    );

    return (
      <Component
        containerStyle={containerStyle}
        countStyle={countStyle}
        stripes={stripes}
        count={`${filledCount}/7`}
        label={label}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withSealLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
