import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { Evidence } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import { useText } from "../../../facet/i18n";
import type { EvidenceLedgerProps, EvidenceView } from "./EvidenceLedger";

export type WithEvidenceLedgerProps = Omit<
  EvidenceLedgerProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  evidence: Evidence[];
  /** After how many months without evidence the assumption counts as old. */
  staleMonths?: number;
  /** Reference date; settable for deterministic tests. */
  today?: Date;
  style?: CSSProperties;
};

const MONTH_MS = 2_592_000_000;

const KIND_KEY = {
  measurement: "elements.evidenceLedger.kind.measurement",
  survey: "elements.evidenceLedger.kind.survey",
  incident: "elements.evidenceLedger.kind.incident",
  review: "elements.evidenceLedger.kind.review",
  benchmark: "elements.evidenceLedger.kind.benchmark",
} as const;

const isKnownKind = (kind: string): kind is keyof typeof KIND_KEY =>
  Object.prototype.hasOwnProperty.call(KIND_KEY, kind);

/** Sorts evidence, computes the age of the most recent and phrases the finding. */
export function withEvidenceLedgerLogic(Component: ComponentType<EvidenceLedgerProps>) {
  const Wrapped = ({
    evidence,
    staleMonths = 12,
    today,
    style,
    ...rest
  }: WithEvidenceLedgerProps) => {
    const { t, plural } = useText();
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
          key: `${entry.date ?? "no-date"}-${index}`,
          date: entry.date ? String(entry.date) : t("elements.evidenceLedger.noDate"),
          kind: entry.kind
            ? isKnownKind(String(entry.kind))
              ? t(KIND_KEY[String(entry.kind) as keyof typeof KIND_KEY])
              : String(entry.kind)
            : t("elements.evidenceLedger.noKind"),
          note: entry.note ? String(entry.note) : t("elements.evidenceLedger.noNote"),
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
      [sorted, t],
    );

    const caption = useMemo(() => {
      if (!evidence.length) return t("elements.evidenceLedger.empty");
      if (ageMonths == null)
        return plural("elements.evidenceLedger.noReadableDate", evidence.length);
      const head = t("elements.evidenceLedger.head", {
        evidence: plural("elements.evidenceLedger.pieces", evidence.length),
        age: plural("elements.evidenceLedger.months", ageMonths),
      });
      return ageMonths >= staleMonths
        ? `${head} ${plural("elements.evidenceLedger.stale", staleMonths)}`
        : head;
    }, [ageMonths, evidence.length, plural, staleMonths, t]);

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
            ? color.due
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
