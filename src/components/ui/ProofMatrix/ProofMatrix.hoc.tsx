import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { testKindLabel, type Scenario, type TestRef } from "../../../core";
import { color, font, fontSize, TEST_KINDS } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
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
  /** Promises from `contract.scenarios[]`. */
  scenarios: Scenario[];
  /** Test levels that appear as columns. */
  kinds?: readonly string[];
  /** Show only promises without a test mapping. */
  onlyGaps?: boolean;
  style?: CSSProperties;
};

/** Counts test mappings per promise and level and phrases the answer line. */
export function withProofMatrixLogic(Component: ComponentType<ProofMatrixProps>) {
  const Wrapped = ({
    scenarios,
    kinds = TEST_KINDS,
    onlyGaps,
    style,
    ...rest
  }: WithProofMatrixProps) => {
    const text = useText();
    const { t, plural } = text;
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
              title: `${scenario.id} · ${testKindLabel(kind, text)}: ${
                count === 0
                  ? t("elements.proofMatrix.noTest")
                  : plural("elements.proofMatrix.tests", count)
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
      [kinds, plural, t, text, visible],
    );

    const caption = useMemo(() => {
      const proven = scenarios.filter((scenario) => scenario.proven).length;
      if (!scenarios.length) return t("elements.proofMatrix.empty");
      if (proven === scenarios.length)
        return t("elements.proofMatrix.allMapped", { count: scenarios.length });
      return t("elements.proofMatrix.someMapped", {
        proven,
        total: scenarios.length,
        gap: plural("elements.proofMatrix.gap", scenarios.length - proven),
      });
    }, [plural, scenarios, t]);

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
        columns={kinds.map((kind) => testKindLabel(kind, text))}
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
