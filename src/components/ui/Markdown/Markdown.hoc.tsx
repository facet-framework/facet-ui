import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { isSafeHref, parseMarkdown, type MdInline } from "../../../core";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { MarkdownBlockView, MarkdownPiece, MarkdownProps } from "./Markdown";

export type WithMarkdownProps = Omit<MarkdownProps, "containerStyle" | "blocks"> & {
  /** The text as it arrives. */
  text: string;
  /** Spacing between the blocks. */
  gap?: number;
  style?: CSSProperties;
};

/** Reads the text and renders each block in the design language. */
export function withMarkdownLogic(Component: ComponentType<MarkdownProps>) {
  const Wrapped = ({ text, gap = 10, style, ...rest }: WithMarkdownProps) => {
    const blocks = useMemo<MarkdownBlockView[]>(
      () =>
        parseMarkdown(text).map((block, index) => {
          const key = `b${index}`;
          switch (block.kind) {
            case "heading":
              return {
                kind: "heading",
                key,
                level: block.level,
                pieces: piecesOf(block.inline, key),
                style: headingStyle(block.level),
              };
            case "list":
              return {
                kind: "list",
                key,
                ordered: block.ordered,
                items: block.items.map((item, position) => ({
                  key: `${key}-${position}`,
                  pieces: piecesOf(item, `${key}-${position}`),
                })),
                style: LIST_STYLE,
                itemStyle: LIST_ITEM_STYLE,
              };
            case "code":
              return {
                kind: "code",
                key,
                text: block.text,
                language: block.language,
                style: CODE_STYLE,
                languageStyle: LANGUAGE_STYLE,
              };
            case "quote":
              return {
                kind: "quote",
                key,
                pieces: piecesOf(block.inline, key),
                style: QUOTE_STYLE,
              };
            case "rule":
              return { kind: "rule", key, style: RULE_STYLE };
            default:
              return {
                kind: "paragraph",
                key,
                pieces: piecesOf(block.inline, key),
                style: PARAGRAPH_STYLE,
              };
          }
        }),
      [text],
    );

    const containerStyle = useMemo<CSSProperties>(
      () => ({ display: "grid", gap, minWidth: 0, ...style }),
      [gap, style],
    );

    return <Component containerStyle={containerStyle} blocks={blocks} {...rest} />;
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withMarkdownLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}

function piecesOf(inline: MdInline[], prefix: string): MarkdownPiece[] {
  return inline.map((piece, index) => {
    const key = `${prefix}-i${index}`;
    switch (piece.kind) {
      case "strong":
        return { key, text: piece.text, style: STRONG_STYLE };
      case "em":
        return { key, text: piece.text, style: EM_STYLE };
      case "code":
        return { key, text: piece.text, style: INLINE_CODE_STYLE };
      case "link":
        // A target that may not be visited becomes text with its address
        // behind it: hiding it would be worse than showing it.
        return isSafeHref(piece.href)
          ? { key, text: piece.text, href: piece.href, style: LINK_STYLE }
          : { key, text: `${piece.text} (${piece.href})`, style: TEXT_STYLE };
      default:
        return { key, text: piece.text, style: TEXT_STYLE };
    }
  });
}

const TEXT_STYLE: CSSProperties = { color: "inherit" };
const STRONG_STYLE: CSSProperties = { fontWeight: 500, color: color.ink };
const EM_STYLE: CSSProperties = { fontStyle: "italic" };

const INLINE_CODE_STYLE: CSSProperties = {
  fontFamily: font.mono,
  fontSize: "0.92em",
  background: color.tint,
  padding: "1px 4px",
  color: color.ink,
};

const LINK_STYLE: CSSProperties = {
  color: color.signal,
  textDecoration: "none",
  borderBottom: `1px solid ${color.signalMid}`,
};

const PARAGRAPH_STYLE: CSSProperties = { margin: 0 };

function headingStyle(level: number): CSSProperties {
  return {
    margin: 0,
    fontFamily: font.sans,
    // Three levels are enough: an answer in a conversation is not a document.
    fontSize: level <= 2 ? fontSize.lead : fontSize.base,
    fontWeight: 500,
    color: color.ink,
    lineHeight: 1.4,
  };
}

const LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 4,
};

const LIST_ITEM_STYLE: CSSProperties = { lineHeight: 1.55 };

const CODE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: font.mono,
  fontSize: fontSize.meta,
  lineHeight: 1.6,
  background: color.surface,
  border: `1px solid ${color.line}`,
  borderRadius: 0,
  padding: "10px 12px",
  overflowX: "auto",
  color: color.ink,
  position: "relative",
};

const LANGUAGE_STYLE: CSSProperties = {
  display: "block",
  fontFamily: font.mono,
  fontSize: fontSize.micro,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: color.faint,
  marginBottom: 6,
};

const QUOTE_STYLE: CSSProperties = {
  margin: 0,
  borderLeft: `2px solid ${color.line2}`,
  paddingLeft: 12,
  color: color.dim,
};

const RULE_STYLE: CSSProperties = {
  margin: "2px 0",
  border: "none",
  borderTop: `1px solid ${color.line}`,
};
