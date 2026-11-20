import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/ClauseSheet/ClauseSheet.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Clause } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { ClauseSheetProps, ClauseView } from "./ClauseSheet";

export type WithClauseSheetProps = Omit<
  ClauseSheetProps,
  "containerStyle" | "captionStyle" | "clauses" | "caption"
> & {
  clauses: Clause[];

  onlyBinding?: boolean;
  style?: CSSProperties;
};

const BINDING = localized.text1;
const RECOMMENDED = /\b(SOLL|SHOULD)\w*\b/i;

function obligationOf(clause: Clause): { word: string; binding: boolean } {
  const text = `${clause.requirement ?? ""} ${clause.obligation ?? ""}`;
  if (BINDING.test(text)) return { word: "MUSS", binding: true };
  if (RECOMMENDED.test(text)) return { word: "SOLL", binding: false };
  return { word: localized.text2, binding: false };
}

export function withClauseSheetLogic(Component: ComponentType<ClauseSheetProps>) {
  const Wrapped = ({ clauses, onlyBinding, style, ...rest }: WithClauseSheetProps) => {
    const visible = useMemo(
      () => (onlyBinding ? clauses.filter((clause) => obligationOf(clause).binding) : clauses),
      [clauses, onlyBinding],
    );

    const views = useMemo<ClauseView[]>(
      () =>
        visible.map((clause, index) => {
          const { word, binding } = obligationOf(clause);
          return {
            key: String(clause.id || index),
            id: String(clause.id || `${labelText.text311}${index + 1}`),
            obligation: word,
            requirement: String(clause.requirement || localized.text3),
            measure: clause.measure ? String(clause.measure) : localized.text4,
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
      [visible],
    );

    const caption = useMemo(() => {
      if (!clauses.length) return localized.text5;
      const binding = clauses.filter((clause) => obligationOf(clause).binding).length;
      const unmeasured = clauses.filter((clause) => !clause.measure).length;
      const head = `${clauses.length}${labelText.text312}${binding} verpflichtend.`;
      return unmeasured ? `${head} ${unmeasured}${localized.text6}` : `${head}${localized.text7}`;
    }, [clauses]);

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
