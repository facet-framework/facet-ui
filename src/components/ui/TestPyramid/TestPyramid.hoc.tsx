import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { testKindLabel } from "../../../core";
import { color, font, fontSize, TEST_KINDS } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { PyramidLevel, TestPyramidProps } from "./TestPyramid";

export type WithTestPyramidProps = Omit<
  TestPyramidProps,
  "containerStyle" | "captionStyle" | "levels" | "caption"
> & {
  /** Number of tests per level, keys as in the schema (`unit`, `e2e`, …). */
  counts: Record<string, number>;
  /** Order of the levels — from bottom (wide) to top (narrow). */
  kinds?: readonly string[];
  style?: CSSProperties;
};

/** Computes shares and phrases what the distribution says. */
export function withTestPyramidLogic(Component: ComponentType<TestPyramidProps>) {
  const Wrapped = ({ counts, kinds = TEST_KINDS, style, ...rest }: WithTestPyramidProps) => {
    const text = useText();
    const { t, plural } = text;
    const total = useMemo(
      () => kinds.reduce((sum, kind) => sum + (counts[kind] ?? 0), 0),
      [counts, kinds],
    );

    const levels = useMemo<PyramidLevel[]>(
      () =>
        kinds.map((kind) => {
          const count = counts[kind] ?? 0;
          const share = total > 0 ? Math.round((count / total) * 100) : 0;
          return {
            key: kind,
            label: testKindLabel(kind, text),
            count,
            share,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "104px minmax(0, 1fr) 34px",
              gap: 10,
              alignItems: "center",
              padding: "4px 0",
            },
            labelStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: count ? color.dim : color.faint,
              whiteSpace: "nowrap",
            },
            barStyle: {
              display: "block",
              height: 8,
              width: `${share}%`,
              minWidth: count ? 2 : 0,
              background: count ? color.signal : "transparent",
            },
            countStyle: {
              fontFamily: font.mono,
              fontVariantNumeric: "tabular-nums",
              fontSize: fontSize.caption,
              color: count ? color.ink : color.faint,
              textAlign: "right",
            },
          };
        }),
      [counts, kinds, text, total],
    );

    const caption = useMemo(() => {
      if (!total) return t("elements.testPyramid.empty");
      const base = counts[kinds[0]] ?? 0;
      const top = counts[kinds[kinds.length - 1]] ?? 0;
      const shape =
        base >= top ? t("elements.testPyramid.baseWider") : t("elements.testPyramid.topWider");
      return t("elements.testPyramid.caption", {
        tests: plural("elements.testPyramid.tests", total),
        levels: kinds.filter((kind) => (counts[kind] ?? 0) > 0).length,
        shape,
      });
    }, [counts, kinds, plural, t, total]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 2, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 6px",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        levels={levels}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withTestPyramidLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
