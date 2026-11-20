import type { CSSProperties } from "react";
import { useText } from "../../../facet/i18n";

/** A reference as it appears in the fan-out. */
export type FanLink = {
  id: string;
  label: string;
  /** No record carries this id — the reference points into the void. */
  ghost: boolean;
  style: CSSProperties;
  onOpen?: () => void;
};

/** A record with what hangs below and above it. */
export type FanGroup = {
  key: string;
  label: string;
  /** Rank in depth, from 1 — the roots first. */
  rank: string;
  /** What this record relies on. */
  upstream: FanLink[];
  /** What relies on it. */
  downstream: FanLink[];
  rowStyle: CSSProperties;
  rankStyle: CSSProperties;
  labelStyle: CSSProperties;
  armStyle: CSSProperties;
  armLabelStyle: CSSProperties;
  onOpen?: () => void;
};

export type DependencyFanProps = {
  containerStyle: CSSProperties;
  captionStyle: CSSProperties;
  emptyStyle: CSSProperties;
  groups: FanGroup[];
  /** Counts of the graph in one sentence. */
  caption: string;
  /** Sentence for when no record depends on another. */
  emptyText: string;
  /** Labels of the two arms, for screen readers and narrow columns. */
  upstreamLabel: string;
  downstreamLabel: string;
  "data-testid"?: string;
};

/**
 * Dependencies fanned out: one row per record, on the left what it hangs on,
 * on the right what hangs on it.
 *
 * Read as a list of edges — "A → B", "A → C", "D → B" — you have to assemble
 * the graph in your head, and that is the work a display is supposed to take
 * off you. Fanned out, every record stands there once, with everything that
 * concerns it, in one row.
 *
 * A reference for which there is no record is an open point and carries that
 * as a word too: colour alone would not carry the statement.
 */
export function DependencyFan({
  containerStyle,
  captionStyle,
  emptyStyle,
  groups,
  caption,
  emptyText,
  upstreamLabel,
  downstreamLabel,
  ...rest
}: DependencyFanProps) {
  if (!groups.length) {
    return (
      <div style={containerStyle} {...rest}>
        <p style={emptyStyle}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle} {...rest}>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {groups.map((group) => (
          <li key={group.key} style={group.rowStyle} data-fan={group.key}>
            <span style={group.rankStyle} aria-hidden="true">
              {group.rank}
            </span>

            {group.onOpen ? (
              <button type="button" style={group.labelStyle} onClick={group.onOpen}>
                {group.label}
              </button>
            ) : (
              <span style={group.labelStyle}>{group.label}</span>
            )}

            <span style={group.armStyle}>
              <span style={group.armLabelStyle}>{upstreamLabel}</span>
              {group.upstream.length ? (
                group.upstream.map((link) => <Link key={link.id} link={link} />)
              ) : (
                <span style={group.armLabelStyle}>—</span>
              )}
            </span>

            <span style={group.armStyle}>
              <span style={group.armLabelStyle}>{downstreamLabel}</span>
              {group.downstream.length ? (
                group.downstream.map((link) => <Link key={link.id} link={link} />)
              ) : (
                <span style={group.armLabelStyle}>—</span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p style={captionStyle}>{caption}</p>
    </div>
  );
}

function Link({ link }: { link: FanLink }) {
  const { t } = useText();
  const content = link.ghost
    ? `${link.label} · ${t("elements.dependencyFan.noRecord")}`
    : link.label;
  return link.onOpen ? (
    <button type="button" style={link.style} onClick={link.onOpen}>
      {content}
    </button>
  ) : (
    <span style={link.style}>{content}</span>
  );
}

export default DependencyFan;
