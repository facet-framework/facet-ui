import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import { phaseRank, type IndexPhase, type IndexStatus } from "../../../core";
import { color, font, fontSize, space } from "../../../design-system/tokens";
import { useText, type FacetText, type TextKey } from "../../../facet/i18n";
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
  /** The host's most recently reported state. */
  status: IndexStatus;
  /** Repo root; if not given, the one the host reports in its state. */
  root?: string;
  /** Registry of the run; if not given, the one from the state. */
  registry?: string;
  /** How many files the ticker holds. */
  historyLength?: number;
  style?: CSSProperties;
};

/** The steps in run order. `ready` ends the state instead of standing in it. */
const LADDER: { phase: IndexPhase; label: TextKey }[] = [
  { phase: "connect", label: "elements.indexProgress.step.connect" },
  { phase: "config", label: "elements.indexProgress.step.config" },
  { phase: "records", label: "elements.indexProgress.step.records" },
  { phase: "enumerate", label: "elements.indexProgress.step.enumerate" },
  { phase: "index", label: "elements.indexProgress.step.index" },
  { phase: "model", label: "elements.indexProgress.step.model" },
];

const TITLE: Record<IndexPhase, TextKey> = {
  connect: "elements.indexProgress.title.connect",
  config: "elements.indexProgress.title.config",
  records: "elements.indexProgress.title.records",
  enumerate: "elements.indexProgress.title.enumerate",
  index: "elements.indexProgress.title.index",
  model: "elements.indexProgress.title.model",
  ready: "elements.indexProgress.title.ready",
};

const MARK = { done: "✓", active: "▸", pending: "·" } as const;

type RowState = keyof typeof MARK;

/**
 * Converts the host's state into the ladder: which step is done, which is
 * running, which is still pending — and keeps the most recently read files as
 * a ticker, so it stays visible that work is happening.
 *
 * The ticker is the only state here. It lives in the HOC because it grows over
 * time; the presentation only receives the finished list.
 */
export function withIndexProgressLogic(Component: ComponentType<IndexProgressProps>) {
  const Wrapped = ({
    status,
    root,
    registry,
    historyLength = 6,
    style,
    ...rest
  }: WithIndexProgressProps) => {
    const text = useText();
    const { t, number } = text;
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
            label: t(label),
            detail: phaseDetail(phase, state, status, text),
            mark: MARK[state],
            rowStyle: rowStyle(state),
            markStyle: markStyle(state),
            labelStyle: labelStyle(state),
            detailStyle: detailStyle(state),
          };
        }),
      [rank, status, text, t],
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
        return t("elements.indexProgress.progressLabel", {
          done: number(status.done),
          total: number(status.total),
          title: t(TITLE[status.phase]),
        });
      }
      return t(TITLE[status.phase]);
    }, [status.done, status.phase, status.total, t, number]);

    const caption = useMemo(() => captionFor(status, text), [status, text]);

    const origin = useMemo(() => {
      const place = root ?? status.root;
      const name = registry ?? status.registry;
      return [place, name ? t("elements.indexProgress.registry", { name }) : ""]
        .filter(Boolean)
        .join(" · ");
    }, [registry, root, status.registry, status.root, t]);

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
          // The newest line stands first and strongest; older ones recede.
          // The position carries the same statement as the opacity.
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
        title={t(TITLE[status.phase])}
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

/** What stands on the right of the row: the count this step knows. */
function phaseDetail(
  phase: IndexPhase,
  state: RowState,
  status: IndexStatus,
  { t, number }: FacetText,
): string {
  if (state === "pending") return "";

  switch (phase) {
    case "connect":
      return state === "done" ? t("elements.indexProgress.up") : "…";
    case "config":
      return ".facetrc.yaml";
    case "records":
      return state === "active" && status.total > 0
        ? `${number(status.done)}/${number(status.total)}`
        : number(status.records);
    case "enumerate":
      return number(state === "active" ? status.done : status.files);
    case "index":
      return state === "active" && status.total > 0
        ? `${number(status.done)}/${number(status.total)}`
        : t("elements.indexProgress.anchorsCount", { count: number(status.anchors) });
    case "model":
      return t("elements.indexProgress.recordsCount", { count: number(status.records) });
    default:
      return "";
  }
}

/** The run's counts, written out below the bar. */
function captionFor(status: IndexStatus, { t, number }: FacetText): string {
  switch (status.phase) {
    case "connect":
      return t("elements.indexProgress.caption.connect");
    case "config":
      return t("elements.indexProgress.caption.config");
    case "records":
      return status.total > 0
        ? t("elements.indexProgress.caption.recordsOf", {
            done: number(status.done),
            total: number(status.total),
          })
        : t("elements.indexProgress.caption.records", { count: number(status.records) });
    case "enumerate":
      return t("elements.indexProgress.caption.enumerate", { count: number(status.done) });
    case "index":
      return status.total > 0
        ? t("elements.indexProgress.caption.indexOf", {
            done: number(status.done),
            total: number(status.total),
            anchors: number(status.anchors),
          })
        : t("elements.indexProgress.caption.index", {
            files: number(status.files),
            anchors: number(status.anchors),
          });
    case "model":
    case "ready":
      return t("elements.indexProgress.caption.done", {
        records: number(status.records),
        files: number(status.files),
        anchors: number(status.anchors),
      });
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
  // A path is wrapped, not truncated: what would fall off the end is the
  // folder that matters.
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
  // Final geometry: the ticker keeps its height so nothing below it jumps.
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
    // Weight carries the same statement as colour: the running step is the
    // only one that gets emphasis.
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
