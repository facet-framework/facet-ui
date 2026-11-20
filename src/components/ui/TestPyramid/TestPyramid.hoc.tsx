import { localized } from "../../../i18n/legacy/components/ui/TestPyramid/TestPyramid.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize, TEST_KINDS, TEST_KIND_LABEL } from "../../../design-system/tokens";
import type { PyramidLevel, TestPyramidProps } from "./TestPyramid";

export type WithTestPyramidProps = Omit<
  TestPyramidProps,
  "containerStyle" | "captionStyle" | "levels" | "caption"
> & {
  counts: Record<string, number>;

  kinds?: readonly string[];
  style?: CSSProperties;
};

export function withTestPyramidLogic(Component: ComponentType<TestPyramidProps>) {
  const Wrapped = ({ counts, kinds = TEST_KINDS, style, ...rest }: WithTestPyramidProps) => {
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
            label: TEST_KIND_LABEL[kind] ?? kind,
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
      [counts, kinds, total],
    );

    const caption = useMemo(() => {
      if (!total) return localized.text1;
      const base = counts[kinds[0]] ?? 0;
      const top = counts[kinds[kinds.length - 1]] ?? 0;
      const shape = base >= top ? localized.text2 : localized.text3;
      return `${total} ${total === 1 ? "Test" : "Tests"}${localized.text4}${
        kinds.filter((kind) => (counts[kind] ?? 0) > 0).length
      } Ebenen. ${shape}`;
    }, [counts, kinds, total]);

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
