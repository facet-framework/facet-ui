import { deCore } from "../../../facet/i18n/catalog/core";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Clause } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { ClauseSheetProps, ClauseView } from "./ClauseSheet";

export type WithClauseSheetProps = Omit<
  ClauseSheetProps,
  "containerStyle" | "captionStyle" | "clauses" | "caption"
> & {
  clauses: Clause[];
  /** Only mandatory clauses (MUST). */
  onlyBinding?: boolean;
  style?: CSSProperties;
};

// The word lists accept both languages: they match the wording of the clause
// content, including German obligation words.
const BINDING = new RegExp(`\\b(${deCore["core.requirement.bindingPattern"]}|SHALL)\\w*\\b`, "i");
const RECOMMENDED = new RegExp(`\\b(${deCore["core.requirement.recommendedPattern"]})\\w*\\b`, "i");

/** Reads the binding strength from the requirement text and counts it. */
function obligationOf(clause: Clause): { kind: "must" | "should" | "may"; binding: boolean } {
  const text = `${clause.requirement ?? ""} ${clause.obligation ?? ""}`;
  if (BINDING.test(text)) return { kind: "must", binding: true };
  if (RECOMMENDED.test(text)) return { kind: "should", binding: false };
  return { kind: "may", binding: false };
}

/** Prepares clauses and phrases the answer line. */
export function withClauseSheetLogic(Component: ComponentType<ClauseSheetProps>) {
  const Wrapped = ({ clauses, onlyBinding, style, ...rest }: WithClauseSheetProps) => {
    const { t } = useText();
    const visible = useMemo(
      () => (onlyBinding ? clauses.filter((clause) => obligationOf(clause).binding) : clauses),
      [clauses, onlyBinding],
    );

    const views = useMemo<ClauseView[]>(
      () =>
        visible.map((clause, index) => {
          const { kind, binding } = obligationOf(clause);
          return {
            key: String(clause.id || index),
            id: String(clause.id || t("elements.clauseSheet.clauseN", { n: index + 1 })),
            obligation: t(`elements.clauseSheet.${kind}`),
            requirement: String(clause.requirement || t("elements.clauseSheet.noWording")),
            measure: clause.measure ? String(clause.measure) : t("elements.clauseSheet.noMeasure"),
            binding,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 4,
              padding: "10px 0",
              borderTopStyle: "solid",
              borderTopWidth: 1,
              borderTopColor: color.line,
              minWidth: 0,
            },
            idStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: color.dim,
              whiteSpace: "nowrap",
            },
            obligationStyle: {
              fontFamily: font.mono,
              fontSize: fontSize.micro,
              letterSpacing: "0.14em",
              color: binding ? color.ink : color.faint,
              fontWeight: binding ? 500 : 400,
              whiteSpace: "nowrap",
            },
            requirementStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.sans,
              fontSize: fontSize.body,
              lineHeight: 1.6,
              color: color.ink,
            },
            measureStyle: {
              gridColumn: "1 / -1",
              fontFamily: font.mono,
              fontSize: fontSize.caption,
              color: clause.measure ? color.soft : color.signal,
            },
          };
        }),
      [visible, t],
    );

    const caption = useMemo(() => {
      if (!clauses.length) return t("elements.clauseSheet.empty");
      const binding = clauses.filter((clause) => obligationOf(clause).binding).length;
      const unmeasured = clauses.filter((clause) => !clause.measure).length;
      const head = t("elements.clauseSheet.head", { total: clauses.length, binding });
      return unmeasured
        ? `${head} ${t("elements.clauseSheet.unmeasured", { count: unmeasured })}`
        : `${head} ${t("elements.clauseSheet.allMeasured")}`;
    }, [clauses, t]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 2, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 4px",
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
        clauses={views}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withClauseSheetLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
