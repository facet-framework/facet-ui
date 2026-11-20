import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { facetLabel, type FacetRecord } from "../../../core";
import { color, FACETS, font, fontSize, type Facet } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { SealProps, SealStripe } from "./Seal";

export type WithSealProps = Omit<
  SealProps,
  "containerStyle" | "countStyle" | "stripes" | "count" | "label"
> & {
  /** Record whose facets are counted. */
  record?: Pick<FacetRecord, "present">;
  /** Directly set facet filling — takes precedence over `record`. */
  present?: Partial<Record<Facet, boolean>>;
  /** Height of the stripes. */
  height?: number;
  /** Hide the count when it already stands next to it. */
  hideCount?: boolean;
  style?: CSSProperties;
};

/** Counts the filled facets and phrases the plain text. */
export function withSealLogic(Component: ComponentType<SealProps>) {
  const Wrapped = ({ record, present, height = 14, hideCount, style, ...rest }: WithSealProps) => {
    const text = useText();
    const { t } = text;
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
          label: t("elements.seal.stripe", {
            facet: facetLabel(facet, text),
            state: filled[facet] ? t("elements.seal.filled") : t("elements.seal.empty"),
          }),
          filled: filled[facet],
          style: {
            display: "inline-block",
            width: 3,
            height,
            background: filled[facet] ? color.ink : "transparent",
            boxShadow: filled[facet] ? undefined : `inset 0 0 0 1px ${color.line2}`,
          },
        })),
      [filled, height, t, text],
    );

    const label = useMemo(() => {
      const names = FACETS.filter((facet) => filled[facet]).map((facet) => facetLabel(facet, text));
      return names.length
        ? t("elements.seal.summary", { count: filledCount, names: names.join(", ") })
        : t("elements.seal.none");
    }, [filled, filledCount, t, text]);

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
