import type { CSSProperties } from "react";
import Bar from "../Bar";
import Mark from "../Mark";

export type IndexPhaseRow = {
  key: string;

  label: string;

  detail: string;

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

  title: string;

  origin: string;
  phases: IndexPhaseRow[];

  percent: number | null;

  progressLabel: string;

  caption: string;

  ticker: string[];

  busy: boolean;
  "data-testid"?: string;
};

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
