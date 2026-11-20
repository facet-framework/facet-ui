import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

export type FocusRowProps = {
  containerStyle: CSSProperties;
  headerStyle: CSSProperties;
  rankStyle: CSSProperties;
  titleStyle: CSSProperties;
  whyStyle: CSSProperties;
  metaStyle: CSSProperties;
  bodyStyle: CSSProperties;

  rank: string;
  title: string;

  why: string;
  meta?: string;
  open: boolean;

  children?: ReactNode;
  onToggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  "data-testid"?: string;
};

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
