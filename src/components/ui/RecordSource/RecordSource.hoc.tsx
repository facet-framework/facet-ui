import { labelText } from "../../../i18n/legacy/labels";
import { memo, useMemo, type ComponentType, type CSSProperties } from "react";
import { color, font, fontSize } from "../../../design-system/tokens";
import type { RecordSourceProps, SourceLine, SourceToken } from "./RecordSource";

export type WithRecordSourceProps = Omit<
  RecordSourceProps,
  "containerStyle" | "captionStyle" | "tokenStyle" | "lines" | "caption"
> & {
  raw: string;

  path?: string;

  markLine?: number | null;
  style?: CSSProperties;
};

export function tokenizeYamlLine(line: string): SourceToken[] {
  if (!line.trim()) return [];

  const comment = line.indexOf("#");
  const code = comment >= 0 ? line.slice(0, comment) : line;
  const tokens: SourceToken[] = [];

  const listMatch = /^(\s*-\s)(.*)$/.exec(code);
  const rest = listMatch ? listMatch[2] : code;
  if (listMatch) tokens.push({ kind: "marker", text: listMatch[1] });

  const keyMatch = /^(\s*)([A-Za-z0-9_.-]+)(:)(\s*)(.*)$/.exec(rest);
  if (keyMatch) {
    const [, indent, key, colon, space, value] = keyMatch;
    if (indent) tokens.push({ kind: "punct", text: indent });
    tokens.push({ kind: "key", text: key });
    tokens.push({ kind: "punct", text: colon + space });
    if (value) tokens.push({ kind: "value", text: value });
  } else if (rest) {
    tokens.push({ kind: "value", text: rest });
  }

  if (comment >= 0) tokens.push({ kind: "comment", text: line.slice(comment) });
  return tokens;
}

export function withRecordSourceLogic(Component: ComponentType<RecordSourceProps>) {
  const Wrapped = ({ raw, path, markLine, style, ...rest }: WithRecordSourceProps) => {
    const rows = useMemo(() => raw.replace(/\n$/, "").split("\n"), [raw]);
    const width = useMemo(() => String(rows.length).length, [rows.length]);

    const lines = useMemo<SourceLine[]>(
      () =>
        rows.map((text, index) => {
          const number = index + 1;
          const marked = markLine === number;
          return {
            key: `${number}`,
            number: String(number).padStart(width, " "),
            tokens: tokenizeYamlLine(text),
            marked,
            rowStyle: {
              display: "grid",
              gridTemplateColumns: "auto minmax(0, 1fr)",
              gap: 14,
              background: marked ? color.deadlineSoft : "transparent",
              whiteSpace: "pre",
            },
            numberStyle: {
              fontFamily: font.mono,
              fontVariantNumeric: "tabular-nums",
              fontSize: fontSize.caption,
              color: marked ? color.deadline : color.faint,
              userSelect: "none",
            },
          };
        }),
      [markLine, rows, width],
    );

    const caption = useMemo(() => {
      const count = `${rows.length} ${rows.length === 1 ? labelText.text315 : labelText.text316}`;
      return path ? `${path} · ${count}` : count;
    }, [path, rows.length]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        display: "grid",
        gap: 0,
        overflowX: "auto",
        fontFamily: font.mono,
        fontSize: fontSize.meta,
        lineHeight: 1.65,
        minWidth: 0,
        ...style,
      }),
      [style],
    );

    const captionStyle = useMemo<CSSProperties>(
      () => ({
        margin: "0 0 10px",
        fontFamily: font.mono,
        fontSize: fontSize.caption,
        letterSpacing: "0.1em",
        color: color.dim,
      }),
      [],
    );

    const tokenStyle = useMemo<Record<SourceToken["kind"], CSSProperties>>(
      () => ({
        key: { color: color.ink },
        value: { color: color.signal },
        punct: { color: color.dim },
        comment: { color: color.faint },
        marker: { color: color.dim },
      }),
      [],
    );

    return (
      <Component
        containerStyle={containerStyle}
        captionStyle={captionStyle}
        tokenStyle={tokenStyle}
        lines={lines}
        caption={caption}
        {...rest}
      />
    );
  };

  const Memoized = memo(Wrapped);
  Memoized.displayName = `withRecordSourceLogic(${Component.displayName ?? Component.name})`;
  return Memoized;
}
