import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type FocusRowProps = {
  containerStyle: CSSProperties;
  headerStyle: CSSProperties;
  rankStyle: CSSProperties;
  titleStyle: CSSProperties;
  whyStyle: CSSProperties;
  metaStyle: CSSProperties;
  bodyStyle: CSSProperties;
  /** Rank of the row, two digits, e.g. "01". */
  rank: string;
  title: string;
  /** A reason in plain words — it turns opening into a decision. */
  why: string;
  meta?: string;
  open: boolean;
  /** Content that grows downwards when opening. */
  children?: ReactNode;
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  "data-testid"?: string;
};

/**
 * Mechanic 2 · solo focus: exactly one open row, neighbours muted, the opened
 * row snaps into place at its position. The closed row is complete enough
 * that opening is a decision and not a duty.
 */
export function FocusRow({
  containerStyle,
  headerStyle,
  rankStyle,
  titleStyle,
  whyStyle,
  metaStyle,
  bodyStyle,
  rank,
  title,
  why,
  meta,
  open,
  children,
  onToggle,
  onKeyDown,
  ...rest
}: FocusRowProps) {
  return (
    <div style={containerStyle} {...rest}>
      <div
        style={headerStyle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <span style={rankStyle}>{rank}</span>
        <span style={titleStyle}>{title}</span>
        <span style={whyStyle}>{why}</span>
        {meta ? <span style={metaStyle}>{meta}</span> : null}
      </div>
      {open && children ? (
        <div style={bodyStyle} data-open>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default FocusRow;
