import { labelText } from "../../../i18n/legacy/labels";
import { localized } from "../../../i18n/legacy/components/ui/SignalStack/SignalStack.hoc";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import type { AlertEntry, SloEntry } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { SignalEntry, SignalStackProps } from "./SignalStack";

export type WithSignalStackProps = Omit<
  SignalStackProps,
  "containerStyle" | "captionStyle" | "entries" | "caption"
> & {
  slos?: SloEntry[];
  alerts?: AlertEntry[];

  onlyGaps?: boolean;
  style?: CSSProperties;
};

export function withSignalStackLogic(Component: ComponentType<SignalStackProps>) {
  const Wrapped = ({ slos = [], alerts = [], onlyGaps, style, ...rest }: WithSignalStackProps) => {
    const entries = useMemo<SignalEntry[]>(() => {
      const rowStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 4,
        padding: "9px 0",
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: color.line,
        minWidth: 0,
      };

      const alertRows: SignalEntry[] = alerts.map((alert, index) => {
        const open = !alert.runbook;
        return {
          key: `alert-${String(alert.name || alert.id || index)}`,
          kind: "alert",
          name: String(alert.name || alert.id || `${labelText.text283}${index + 1}`),
          detail: String(alert.condition || localized.text1),
          meta: alert.severity ? String(alert.severity) : localized.text2,
          runbook: open ? localized.text3 : String(alert.runbook),
          open,
          rowStyle,
          nameStyle: {
            fontFamily: font.mono,
            fontSize: fontSize.meta,
            color: color.ink,
            fontWeight: open ? 500 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          metaStyle: {
            fontFamily: font.mono,
            fontSize: fontSize.micro,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: color.dim,
            whiteSpace: "nowrap",
          },
          detailStyle: {
            gridColumn: "1 / -1",
            fontFamily: font.mono,
            fontSize: fontSize.caption,
            color: color.soft,
            overflowWrap: "anywhere",
          },
          runbookStyle: {
            gridColumn: "1 / -1",
            fontFamily: font.sans,
            fontSize: fontSize.meta,
            color: open ? color.signal : color.dim,
          },
        };
      });

      const sloRows: SignalEntry[] = slos.map((slo, index) => ({
        key: `slo-${String(slo.name || slo.id || index)}`,
        kind: "slo",
        name: String(slo.name || slo.id || `SLO ${index + 1}`),
        detail: String(slo.query || slo.target || localized.text4),
        meta: slo.window ? String(slo.window) : localized.text5,
        runbook: slo.target ? `${labelText.text284}${slo.target}` : localized.text6,
        open: false,
        rowStyle,
        nameStyle: {
          fontFamily: font.mono,
          fontSize: fontSize.meta,
          color: color.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        metaStyle: {
          fontFamily: font.mono,
          fontSize: fontSize.micro,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: color.dim,
          whiteSpace: "nowrap",
        },
        detailStyle: {
          gridColumn: "1 / -1",
          fontFamily: font.mono,
          fontSize: fontSize.caption,
          color: color.soft,
          overflowWrap: "anywhere",
        },
        runbookStyle: {
          gridColumn: "1 / -1",
          fontFamily: font.sans,
          fontSize: fontSize.meta,
          color: color.dim,
        },
      }));

      const all = [
        ...alertRows.filter((row) => row.open),
        ...alertRows.filter((row) => !row.open),
        ...sloRows,
      ];
      return onlyGaps ? all.filter((row) => row.open) : all;
    }, [alerts, onlyGaps, slos]);

    const caption = useMemo(() => {
      if (!slos.length && !alerts.length) return localized.text7;
      const gaps = alerts.filter((alert) => !alert.runbook).length;
      const head = `${slos.length} ${slos.length === 1 ? "SLO" : "SLOs"} · ${
        alerts.length
      } ${alerts.length === 1 ? labelText.text285 : labelText.text286}.`;
      return gaps
        ? `${head} ${gaps} ${gaps === 1 ? labelText.text285 : labelText.text286}${localized.text8}`
        : `${head}${localized.text9}`;
    }, [alerts, slos]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap: 0, minWidth: 0, ...style }),
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
        entries={entries}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withSignalStackLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
