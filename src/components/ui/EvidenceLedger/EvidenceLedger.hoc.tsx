import { labelText } from "../../../i18n/legacy/labels";
import { remainingText } from "../../../i18n/legacy/remaining";
import { localized } from "../../../i18n/legacy/components/ui/EvidenceLedger/EvidenceLedger.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Evidence } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { EvidenceLedgerProps, EvidenceView } from "./EvidenceLedger";

export type WithEvidenceLedgerProps = Omit<
  EvidenceLedgerProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  evidence: Evidence[];

  staleMonths?: number;

  today?: Date;
  style?: CSSProperties;
};

const MONTH_MS = 2_592_000_000;

const KIND_LABEL: Record<string, string> = {
  measurement: labelText.text436,
  survey: labelText.text437,
  incident: labelText.text438,
  review: labelText.text439,
  benchmark: labelText.text440,
};

export function withEvidenceLedgerLogic(Component: ComponentType<EvidenceLedgerProps>) {
  const Wrapped = ({
    evidence,
    staleMonths = 12,
    today,
    style,
    ...rest
  }: WithEvidenceLedgerProps) => {
    const sorted = useMemo(
      () => [...evidence].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))),
      [evidence],
    );

    const ageMonths = useMemo(() => {
      const newest = sorted[0]?.date;
      if (!newest) return null;
      const date = new Date(String(newest));
      if (Number.isNaN(date.getTime())) return null;
      const reference = today ?? new Date();
      return Math.max(0, Math.round((reference.getTime() - date.getTime()) / MONTH_MS));
    }, [sorted, today]);

    const entries = useMemo<EvidenceView[]>(
      () =>
        sorted.map((entry, index) => ({
          key: `${entry.date ?? localized.text1}-${index}`,
          date: entry.date ? String(entry.date) : localized.text2,
          kind: entry.kind
            ? (KIND_LABEL[String(entry.kind)] ?? String(entry.kind))
            : localized.text3,
          note: entry.note ? String(entry.note) : localized.text4,
          oldest: index === sorted.length - 1,
          rowStyle: {
            display: "grid",
            gridTemplateColumns: "104px 132px minmax(0, 1fr)",
            gap: 10,
            alignItems: "baseline",
            padding: "7px 0",
            borderTopStyle: "solid",
            borderTopWidth: 1,
            borderTopColor: color.line,
            minWidth: 0,
          },
          dateStyle: {
            fontFamily: font.mono,
            fontVariantNumeric: "tabular-nums",
            fontSize: fontSize.meta,
            color: index === 0 ? color.ink : color.dim,
            whiteSpace: "nowrap",
          },
          kindStyle: {
            fontFamily: font.mono,
            fontSize: fontSize.caption,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: color.dim,
            whiteSpace: "nowrap",
          },
          noteStyle: {
            fontFamily: font.sans,
            fontSize: fontSize.meta,
            color: color.soft,
            overflowWrap: "anywhere",
          },
        })),
      [sorted],
    );

    const caption = useMemo(() => {
      if (!evidence.length) return localized.text5;
      if (ageMonths == null) return `${evidence.length}${localized.text6}`;
      const head = `${evidence.length} ${evidence.length === 1 ? localized.text7 : remainingText.text51}${labelText.text441}${ageMonths} ${
        ageMonths === 1 ? labelText.text442 : labelText.text443
      }.`;
      return ageMonths >= staleMonths
        ? `${head}${localized.text8}${staleMonths}${localized.text9}`
        : head;
    }, [ageMonths, evidence.length, staleMonths]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 0, minWidth: 0, ...style }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 6px",
        fontFamily: font.sans,
        fontSize: fontSize.base,
        color:
          !evidence.length || (ageMonths != null && ageMonths >= staleMonths)
            ? color.deadline
            : color.ink,
      }),
      [ageMonths, evidence.length, staleMonths],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        entries={entries}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withEvidenceLedgerLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
