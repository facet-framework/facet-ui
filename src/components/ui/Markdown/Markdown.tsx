import type { CSSProperties, ReactNode } from "react";

/** A piece of text, fully marked up. */
export type MarkdownPiece = {
  key: string;
  text: string;
  style: CSSProperties;
  /** Set only on links, and only on those that may be visited. */
  href?: string;
};

export type MarkdownBlockView =
  | { kind: "paragraph"; key: string; pieces: MarkdownPiece[]; style: CSSProperties }
  | {
      kind: "heading";
      key: string;
      level: number;
      pieces: MarkdownPiece[];
      style: CSSProperties;
    }
  | {
      kind: "list";
      key: string;
      ordered: boolean;
      items: { key: string; pieces: MarkdownPiece[] }[];
      style: CSSProperties;
      itemStyle: CSSProperties;
    }
  | {
      kind: "code";
      key: string;
      text: string;
      language: string;
      style: CSSProperties;
      languageStyle: CSSProperties;
    }
  | { kind: "quote"; key: string; pieces: MarkdownPiece[]; style: CSSProperties }
  | { kind: "rule"; key: string; style: CSSProperties };

export type MarkdownProps = {
  containerStyle: CSSProperties;
  blocks: MarkdownBlockView[];
  "data-testid"?: string;
};

/**
 * Markdown in the house design language.
 *
 * A code block is a surface with a hairline, not a grey box with rounded
 * corners; a quote carries a stroke on the left instead of a tint; a rule is a
 * hairline. What the reader does not know arrives here as text and is shown
 * as text.
 */
export function Markdown({ containerStyle, blocks, ...rest }: MarkdownProps) {
  return (
    <div style={containerStyle} {...rest}>
      {blocks.map((block) => render(block))}
    </div>
  );
}

function render(block: MarkdownBlockView): ReactNode {
  switch (block.kind) {
    case "heading": {
      const Tag = `h${Math.min(block.level + 2, 6)}` as unknown as "h4";
      return (
        <Tag key={block.key} style={block.style}>
          {pieces(block.pieces)}
        </Tag>
      );
    }

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag key={block.key} style={block.style}>
          {block.items.map((item) => (
            <li key={item.key} style={block.itemStyle}>
              {pieces(item.pieces)}
            </li>
          ))}
        </Tag>
      );
    }

    case "code":
      return (
        <pre key={block.key} style={block.style} data-language={block.language || undefined}>
          {block.language ? <span style={block.languageStyle}>{block.language}</span> : null}
          <code>{block.text}</code>
        </pre>
      );

    case "quote":
      return (
        <blockquote key={block.key} style={block.style}>
          {pieces(block.pieces)}
        </blockquote>
      );

    case "rule":
      return <hr key={block.key} style={block.style} />;

    default:
      return (
        <p key={block.key} style={block.style}>
          {pieces(block.pieces)}
        </p>
      );
  }
}

function pieces(list: MarkdownPiece[]): ReactNode {
  return list.map((piece) =>
    piece.href ? (
      <a
        key={piece.key}
        href={piece.href}
        style={piece.style}
        target="_blank"
        rel="noreferrer noopener"
      >
        {piece.text}
      </a>
    ) : (
      <span key={piece.key} style={piece.style}>
        {piece.text}
      </span>
    ),
  );
}

export default Markdown;
