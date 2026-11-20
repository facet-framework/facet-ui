import { localized } from "../../../i18n/legacy/components/ui/DependencyFan/DependencyFan";
import type { CSSProperties } from "react";

export type FanLink = {
  id: string;
  label: string;

  ghost: boolean;
  style: CSSProperties;
  onOpen?: () => void;
};

export type FanGroup = {
  key: string;
  label: string;

  rank: string;

  upstream: FanLink[];

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

  caption: string;

  emptyText: string;

  upstreamLabel: string;
  downstreamLabel: string;
  "data-testid"?: string;
};

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
  const content = link.ghost ? `${link.label}${localized.text1}` : link.label;
  return link.onOpen ? (
    <button type="button" style={link.style} onClick={link.onOpen}>
      {content}
    </button>
  ) : (
    <span style={link.style}>{content}</span>
  );
}

export default DependencyFan;
