import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/ProofMatrix/ProofMatrix.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Scenario, TestRef } from "../../../core";
import { color, font, fontSize, TEST_KIND_LABEL, TEST_KINDS } from "../../../design-system/tokens";
import type { ProofMatrixProps, ProofRow } from "./ProofMatrix";

export type WithProofMatrixProps = Omit<
  ProofMatrixProps,
  | "containerStyle"
  | "headerStyle"
  | "headCellStyle"
  | "captionStyle"
  | "columns"
  | "rows"
  | "caption"
> & {
  scenarios: Scenario[];

  kinds?: readonly string[];

  onlyGaps?: boolean;
  style?: CSSProperties;
};

export function withProofMatrixLogic(Component: ComponentType<ProofMatrixProps>) {
  const Wrapped = ({
    scenarios,
    kinds = TEST_KINDS,
    onlyGaps,
    style,
    ...rest
  }: WithProofMatrixProps) => {
    const visible = useMemo(
      () => (onlyGaps ? scenarios.filter((scenario) => !scenario.proven) : scenarios),
      [onlyGaps, scenarios],
    );

    const rows = useMemo<ProofRow[]>(
      () =>
        visible.map((scenario) => ({
          key: scenario.id,
          scenario: scenario.id,
          proven: scenario.proven,
          rowStyle: {
            display: "grid",
            gridTemplateColumns: `minmax(0, 1fr) repeat(${kinds.length}, 46px)`,
            gap: 2,
            alignItems: "center",
            padding: "3px 0",
          },
          labelStyle: {
            fontFamily: font.mono,
            fontSize: fontSize.meta,
            color: scenario.proven ? color.soft : color.ink,
            fontWeight: scenario.proven ? 400 : 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          cells: kinds.map((kind) => {
            const count = scenario.tests.filter((test: TestRef) => test.kind === kind).length;
            return {
              key: `${scenario.id}:${kind}`,
              count,
              title: `${scenario.id} · ${TEST_KIND_LABEL[kind] ?? kind}: ${
                count === 0 ? localized.text1 : count === 1 ? "1 Test" : `${count} Tests`
              }`,
              style: {
                display: "grid",
                placeItems: "center",
                height: 22,
                fontFamily: font.mono,
                fontVariantNumeric: "tabular-nums",
                fontSize: fontSize.caption,
                color: count > 0 ? color.ok : color.faint,
                background: count > 0 ? color.okSoft : "transparent",
                boxShadow: count > 0 ? undefined : `inset 0 0 0 1px ${color.line}`,
              },
            };
          }),
        })),
      [kinds, visible],
    );

    const caption = useMemo(() => {
      const proven = scenarios.filter((scenario) => scenario.proven).length;
      if (!scenarios.length) return localized.text2;
      if (proven === scenarios.length)
        return `${germanLabels.text152}${scenarios.length}${localized.text3}`;
      return `${proven}${germanLabels.text109}${scenarios.length}${localized.text4}${
        scenarios.length - proven === 1
          ? localized.text5
          : `${scenarios.length - proven}${localized.text6}`
      }.`;
    }, [scenarios]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 4, minWidth: 0, ...style }),
      [style],
    );

    const headerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gridTemplateColumns: `minmax(0, 1fr) repeat(${kinds.length}, 46px)`,
        gap: 2,
        paddingBottom: 4,
        borderBottomStyle: "solid",
        borderBottomWidth: 1,
        borderBottomColor: color.line,
      }),
      [kinds.length],
    );

    const headCellStyle = useMemo<CSSProperties>(
      () => ({
        fontFamily: font.mono,
        fontSize: fontSize.micro,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: color.dim,
        textAlign: "center",
        whiteSpace: "nowrap",
      }),
      [],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: 0,
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color: color.ink,
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        headerStyle={headerStyle}
        headCellStyle={headCellStyle}
        captionStyle={captionStyle}
        columns={kinds.map((kind) => TEST_KIND_LABEL[kind] ?? kind)}
        rows={rows}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withProofMatrixLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
