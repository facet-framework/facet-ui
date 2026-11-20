import { labelText } from "../../../i18n/legacy/labels";
import { germanText as germanLabels } from "../../../i18n/legacy/shared";
import { localized } from "../../../i18n/legacy/components/ui/IndexProgress/IndexProgress.hoc";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { formatNumber, phaseRank, type IndexPhase, type IndexStatus } from "../../../core";
import { color, font, fontSize, space } from "../../../design-system/tokens";
import type { IndexPhaseRow, IndexProgressProps } from "./IndexProgress";

export type WithIndexProgressProps = Omit<
  IndexProgressProps,
  | "containerStyle"
  | "brandMarkStyle"
  | "titleStyle"
  | "originStyle"
  | "ladderStyle"
  | "captionStyle"
  | "tickerStyle"
  | "tickerRowStyles"
  | "title"
  | "origin"
  | "phases"
  | "percent"
  | "progressLabel"
  | "caption"
  | "ticker"
  | "busy"
> & {
  status: IndexStatus;

  root?: string;

  registry?: string;

  historyLength?: number;
  style?: CSSProperties;
};

const LADDER: { phase: IndexPhase; label: string }[] = [
  { phase: "connect", label: labelText.text304 },
  { phase: "config", label: labelText.text305 },
  { phase: "records", label: "Records lesen" },
  { phase: "enumerate", label: localized.text1 },
  { phase: "index", label: germanLabels.text179 },
  { phase: "model", label: germanLabels.text180 },
];

const TITLE: Record<IndexPhase, string> = {
  connect: germanLabels.text178,
  config: localized.text2,
  records: localized.text3,
  enumerate: localized.text4,
  index: localized.text5,
  model: localized.text6,
  ready: labelText.text306,
};

const MARK = { done: "✓", active: "▸", pending: "·" } as const;

type RowState = keyof typeof MARK;

export function withIndexProgressLogic(Component: ComponentType<IndexProgressProps>) {
  const Wrapped = ({
    status,
    root,
    registry,
    historyLength = 6,
    style,
    ...rest
  }: WithIndexProgressProps) => {
    const [ticker, setTicker] = useState<string[]>([]);
    const lastFile = useRef("");

    useEffect(() => {
      const file = status.file;
      if (!file || file === lastFile.current) return;
      lastFile.current = file;
      setTicker((previous) => [file, ...previous].slice(0, historyLength));
    }, [status.file, historyLength]);

    const rank = phaseRank(status.phase);
    const busy = status.phase !== "ready";

    const phases = useMemo<IndexPhaseRow[]>(
      () =>
        LADDER.map(({ phase, label }) => {
          const own = phaseRank(phase);
          const state: RowState = own < rank ? "done" : own === rank ? "active" : "pending";
          return {
            key: phase,
            label,
            detail: phaseDetail(phase, state, status),
            mark: MARK[state],
            rowStyle: rowStyle(state),
            markStyle: markStyle(state),
            labelStyle: labelStyle(state),
            detailStyle: detailStyle(state),
          };
        }),
      [rank, status],
    );

    const percent = useMemo(
      () =>
        status.total > 0
          ? Math.min(100, Math.round((status.done / status.total) * 100))
          : busy
            ? null
            : 100,
      [busy, status.done, status.total],
    );

    const progressLabel = useMemo(() => {
      if (status.total > 0) {
        return `${formatNumber(status.done)}${germanLabels.text109}${formatNumber(status.total)} — ${TITLE[status.phase]}`;
      }
      return TITLE[status.phase];
    }, [status.done, status.phase, status.total]);

    const caption = useMemo(() => captionFor(status), [status]);

    const origin = useMemo(() => {
      const place = root ?? status.root;
      const name = registry ?? status.registry;
      return [place, name ? `Registry ${name}` : ""].filter(Boolean).join(" · ");
    }, [registry, root, status.registry, status.root]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 10,
        alignContent: "center",
        justifyItems: "stretch",
        width: "min(560px, 100%)",
        margin: "0 auto",
        padding: `${space.s5} ${space.s4}`,
        minWidth: 0,
        ...style,
      }),
      [style],
    );

    const tickerRowStyles = useMemo<CSSProperties[]>(
      () =>
        ticker.map((_, index) => ({
          fontFamily: font.mono,
          fontSize: fontSize.caption,
          letterSpacing: 0,
          textTransform: "none",
          color: color.dim,

          opacity: Math.max(0.15, 1 - index * 0.18),
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        })),
      [ticker],
    );

    return (
      <Component
        containerStyle={containerStyle}
        brandMarkStyle={BRAND_MARK_STYLE}
        titleStyle={TITLE_STYLE}
        originStyle={ORIGIN_STYLE}
        ladderStyle={LADDER_STYLE}
        captionStyle={CAPTION_STYLE}
        tickerStyle={TICKER_STYLE}
        tickerRowStyles={tickerRowStyles}
        title={TITLE[status.phase]}
        origin={origin}
        phases={phases}
        percent={percent}
        progressLabel={progressLabel}
        caption={caption}
        ticker={ticker}
        busy={busy}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withIndexProgressLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

function phaseDetail(phase: IndexPhase, state: RowState, status: IndexStatus): string {
  if (state === "pending") return "";

  switch (phase) {
    case "connect":
      return state === "done" ? labelText.text307 : "…";
    case "config":
      return ".facetrc.yaml";
    case "records":
      return state === "active" && status.total > 0
        ? `${formatNumber(status.done)}/${formatNumber(status.total)}`
        : formatNumber(status.records);
    case "enumerate":
      return formatNumber(state === "active" ? status.done : status.files);
    case "index":
      return state === "active" && status.total > 0
        ? `${formatNumber(status.done)}/${formatNumber(status.total)}`
        : `${formatNumber(status.anchors)}${germanLabels.text181}`;
    case "model":
      return `${formatNumber(status.records)} Records`;
    default:
      return "";
  }
}

function captionFor(status: IndexStatus): string {
  switch (status.phase) {
    case "connect":
      return localized.text7;
    case "config":
      return localized.text8;
    case "records":
      return status.total > 0
        ? `${formatNumber(status.done)}${germanLabels.text109}${formatNumber(status.total)} Records gelesen`
        : `${formatNumber(status.records)} Records gelesen`;
    case "enumerate":
      return `${formatNumber(status.done)}${localized.text9}`;
    case "index":
      return status.total > 0
        ? `${formatNumber(status.done)}${germanLabels.text109}${formatNumber(status.total)}${localized.text10}${formatNumber(status.anchors)}${germanLabels.text181}`
        : `${formatNumber(status.files)}${localized.text11}${formatNumber(status.anchors)}${germanLabels.text181}`;
    case "model":
    case "ready":
      return `${formatNumber(status.records)} Records · ${formatNumber(status.files)}${localized.text12}${formatNumber(status.anchors)}${germanLabels.text181}`;
    default:
      return "";
  }
}

const BRAND_MARK_STYLE: CSSProperties = {
  justifyContent: "center",
  margin: `0 0 ${space.s3}`,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.sans,
  fontSize: fontSize.lead,
  fontWeight: 400,
  color: color.ink,
};

const ORIGIN_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  color: color.dim,

  overflowWrap: "anywhere",
};

const LADDER_STYLE: CSSProperties = {
  display: "grid",
  gap: 2,
  listStyle: "none",
  margin: `${space.s3} 0 0`,
  padding: 0,
};

const CAPTION_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  fontVariantNumeric: "tabular-nums",
  color: color.soft,
};

const TICKER_STYLE: CSSProperties = {
  display: "grid",
  gap: 1,
  listStyle: "none",
  margin: `${space.s2} 0 0`,
  padding: 0,

  minHeight: 6 * 15,
  alignContent: "start",
};

function rowStyle(state: RowState): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "12px 1fr auto",
    gap: 8,
    alignItems: "baseline",
    padding: "3px 0",
    borderBottom: `1px solid ${state === "active" ? color.line2 : "transparent"}`,
  };
}

function markStyle(state: RowState): CSSProperties {
  return {
    fontFamily: font.mono,
    fontSize: fontSize.meta,
    color: state === "done" ? color.ok : state === "active" ? color.signal : color.faint,
  };
}

function labelStyle(state: RowState): CSSProperties {
  return {
    fontFamily: font.sans,
    fontSize: fontSize.base,

    fontWeight: state === "active" ? 500 : 400,
    color: state === "pending" ? color.faint : color.ink,
  };
}

function detailStyle(state: RowState): CSSProperties {
  return {
    fontFamily: font.mono,
    fontSize: fontSize.meta,
    fontVariantNumeric: "tabular-nums",
    color: state === "active" ? color.signal : color.dim,
  };
}
