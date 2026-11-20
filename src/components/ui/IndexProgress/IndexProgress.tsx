import type { CSSProperties } from "react";
import Bar from "../Bar";
import Mark from "../Mark";

/** A step of the run, as it appears in the ladder. */
export type IndexPhaseRow = {
  key: string;
  /** Plain text of the step, e.g. "Find anchors". */
  label: string;
  /** Count or path for the step — empty as long as there is nothing to show. */
  detail: string;
  /** Glyph of the left column: done, running, pending. */
  mark: string;
  rowStyle: CSSProperties;
  markStyle: CSSProperties;
  labelStyle: CSSProperties;
  detailStyle: CSSProperties;
};

export type IndexProgressProps = {
  containerStyle: CSSProperties;
  brandMarkStyle: CSSProperties;
  titleStyle: CSSProperties;
  originStyle: CSSProperties;
  ladderStyle: CSSProperties;
  captionStyle: CSSProperties;
  tickerStyle: CSSProperties;
  tickerRowStyles: CSSProperties[];
  /** What is happening right now, in one sentence. */
  title: string;
  /** Root and registry of the run — the origin of the numbers beside it. */
  origin: string;
  phases: IndexPhaseRow[];
  /** Share of the running phase; `null` as long as its reference total is missing. */
  percent: number | null;
  /** Plain text of the bar, e.g. "1204 of 2481 files searched". */
  progressLabel: string;
  /** Counts of the run below the bar. */
  caption: string;
  /** Most recently read files, newest first. */
  ticker: string[];
  /** The run is not finished yet. */
  busy: boolean;
  "data-testid"?: string;
};

/**
 * Loading state of the corpus — the only place where Atlas waits.
 *
 * It shows no spinning ring but the run itself: which step is up, how many
 * files it has read out of how many, and which one is passing through its
 * hands right now. A bar that guesses the time would be an invented number;
 * here every one is counted.
 */
export function IndexProgress({
  containerStyle,
  brandMarkStyle,
  titleStyle,
  originStyle,
  ladderStyle,
  captionStyle,
  tickerStyle,
  tickerRowStyles,
  title,
  origin,
  phases,
  percent,
  progressLabel,
  caption,
  ticker,
  busy,
  ...rest
}: IndexProgressProps) {
  return (
    <section style={containerStyle} role="status" aria-busy={busy} aria-live="polite" {...rest}>
      <Mark variant={busy ? "loading" : "static"} size={64} style={brandMarkStyle} />
      <p style={titleStyle}>{title}</p>
      {origin ? <p style={originStyle}>{origin}</p> : null}

      <ol style={ladderStyle}>
        {phases.map((phase) => (
          <li key={phase.key} style={phase.rowStyle}>
            <span style={phase.markStyle} aria-hidden="true">
              {phase.mark}
            </span>
            <span style={phase.labelStyle}>{phase.label}</span>
            <span style={phase.detailStyle}>{phase.detail}</span>
          </li>
        ))}
      </ol>

      <Bar value={percent ?? 0} total={100} label={progressLabel} autoComplete={false} height={2} />
      <p style={captionStyle}>{caption}</p>

      <ul style={tickerStyle} aria-hidden="true">
        {ticker.map((path, index) => (
          <li key={`${index}-${path}`} style={tickerRowStyles[index]}>
            {path}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default IndexProgress;
