import { Fragment, type ReactNode } from "react";
import { Icon, type IconName } from "../../primitives/Icon";
import { Button, Kbd } from "../../primitives/controls";
import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";

export const noop = () => {};

const LIFECYCLE_KEY: Record<string, TextKey> = {
  active: "d.lifecycle.active",
  planned: "d.lifecycle.planned",
  deprecated: "d.lifecycle.deprecated",
  retired: "d.lifecycle.retired",
};

export function useLifecycleLabel() {
  const { t } = useText();
  return (lc: string) => (LIFECYCLE_KEY[lc] ? t(LIFECYCLE_KEY[lc]) : lc);
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

export function Inline({ text, onLink = noop }: { text: string; onLink?: (href: string) => void }) {
  const parts = text.split(INLINE);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4)
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2)
          return (
            <code key={i} className="t-d-md__code">
              {p.slice(1, -1)}
            </code>
          );
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
        if (link)
          return (
            <a
              key={i}
              href={link[2]}
              className="t-d-md__link"
              onClick={(e) => {
                e.preventDefault();
                onLink(link[2]);
              }}
            >
              {link[1]}
            </a>
          );
        if (/^([*_]).+\1$/.test(p) && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "quote"; text: string }
  | { t: "code"; lang: string; code: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      out.push({ t: "code", lang: fence[1], code: body.join("\n") });
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      out.push({ t: "h", level: h[1].length, text: h[2] });
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      out.push({ t: "quote", text: q.join(" ") });
      continue;
    }
    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-+/.test(lines[i + 1])
    ) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      out.push({ t: "table", head, rows });
      continue;
    }
    const li = /^\s*([-*]|\d+\.)\s+/;
    if (li.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && li.test(lines[i])) items.push(lines[i++].replace(li, ""));
      out.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|```|>|\s*([-*]|\d+\.)\s|\|)/.test(lines[i]))
      para.push(lines[i++]);
    if (para.length === 0) para.push(lines[i++]);
    out.push({ t: "p", text: para.join(" ") });
  }
  return out;
}

export type MarkdownProps = {
  source: string;
  onCopyCode?: (code: string) => void;
  onLink?: (href: string) => void;

  copiedCode?: number | null;

  anchors?: boolean;

  fold?: boolean;

  openAnchor?: string | null;
};

export function headingId(text: string): string {
  const id = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return id || "section";
}

function headingIds(blocks: Block[]): (string | null)[] {
  const seen = new Map<string, number>();
  return blocks.map((b) => {
    if (b.t !== "h") return null;
    const base = headingId(b.text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

export function markdownHeadings(source: string): { id: string; label: string; level: number }[] {
  const blocks = parseMarkdown(source);
  const ids = headingIds(blocks);
  const out: { id: string; label: string; level: number }[] = [];
  blocks.forEach((b, i) => {
    if (b.t === "h")
      out.push({ id: ids[i] as string, label: b.text.replace(/[*_`]/g, ""), level: b.level });
  });
  return out;
}

type Fold = { head: number; level: number; body: (number | Fold)[] };

function foldSections(blocks: Block[]): (number | Fold)[] {
  const root: (number | Fold)[] = [];
  const stack: Fold[] = [];
  blocks.forEach((b, i) => {
    if (b.t === "h" && b.level <= 2) {
      while (stack.length && stack[stack.length - 1].level >= b.level) stack.pop();
      const section: Fold = { head: i, level: b.level, body: [] };
      (stack.length ? stack[stack.length - 1].body : root).push(section);
      stack.push(section);
      return;
    }
    (stack.length ? stack[stack.length - 1].body : root).push(i);
  });
  return root;
}

export function Markdown({
  source,
  onCopyCode = noop,
  onLink = noop,
  copiedCode = null,
  anchors = false,
  fold = false,
  openAnchor = null,
}: MarkdownProps) {
  const { t } = useText();
  const blocks = parseMarkdown(source);
  const ids = anchors || fold ? headingIds(blocks) : [];

  const codeIndexOf = new Map<number, number>();
  blocks.forEach((b, i) => {
    if (b.t === "code") codeIndexOf.set(i, codeIndexOf.size);
  });
  const render = (b: Block, i: number) => {
    switch (b.t) {
      case "h": {
        const H = `h${Math.min(6, b.level + 1)}` as "h2";
        return (
          <H key={i} id={ids[i] ?? undefined} className={`t-d-md__h t-d-md__h${b.level}`}>
            <Inline text={b.text} onLink={onLink} />
          </H>
        );
      }
      case "ul":
      case "ol": {
        const L = b.t;
        return (
          <L key={i} className="t-d-md__list">
            {b.items.map((it, j) => (
              <li key={j}>
                <Inline text={it} onLink={onLink} />
              </li>
            ))}
          </L>
        );
      }
      case "quote":
        return (
          <blockquote key={i} className="t-d-md__quote">
            <Icon name="quote" size={16} />
            <p>
              <Inline text={b.text} onLink={onLink} />
            </p>
          </blockquote>
        );
      case "code": {
        const idx = codeIndexOf.get(i) ?? -1;
        return (
          <figure key={i} className="t-d-md__pre">
            <figcaption className="t-d-md__pre-head">
              <span className="t-mono">{b.lang || "text"}</span>
              <span className="t-spacer" />
              <Button
                size="small"
                variant="quiet"
                icon={copiedCode === idx ? "check" : "copy"}
                onClick={() => onCopyCode(b.code)}
              >
                {copiedCode === idx ? t("d.md.copied") : t("d.md.copy")}
              </Button>
            </figcaption>
            <pre>
              <code>{b.code}</code>
            </pre>
          </figure>
        );
      }
      case "table":
        return (
          <div key={i} className="t-d-md__table">
            <table className="t-table t-table--dense">
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j}>
                      <Inline text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>
                        <Inline text={c} onLink={onLink} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "hr":
        return <hr key={i} className="t-hair" />;
      default:
        return (
          <p key={i} className="t-d-md__p">
            <Inline text={b.text} onLink={onLink} />
          </p>
        );
    }
  };
  if (!fold) return <div className="t-d-md">{blocks.map(render)}</div>;

  const tree = foldSections(blocks);

  const holds = (f: Fold, id: string): boolean =>
    ids[f.head] === id ||
    f.body.some((n) => (typeof n === "number" ? ids[n] === id : holds(n, id)));

  const first = new Set<Fold>();
  let level: (number | Fold)[] = tree;
  for (;;) {
    const f = level.find((n): n is Fold => typeof n !== "number");
    if (!f) break;
    first.add(f);
    level = f.body;
  }
  const section = (f: Fold) => {
    const head = blocks[f.head];
    const open = first.has(f) || (!!openAnchor && holds(f, openAnchor));
    return (
      <details key={f.head} className="t-d-md__fold" open={open} data-testid="md-fold">
        <summary className="t-d-md__summary">
          <Icon name="down" size={16} className="t-d-md__chev" />
          {render(head, f.head)}
        </summary>
        <div className="t-d-md__foldbody">
          {f.body.map((n) => (typeof n === "number" ? render(blocks[n], n) : section(n)))}
        </div>
      </details>
    );
  };
  return (
    <div className="t-d-md" data-fold="true">
      {tree.map((n) => (typeof n === "number" ? render(blocks[n], n) : section(n)))}
    </div>
  );
}

export function PluginHead({
  icon,
  title,
  count,
  sentence,
  actions,
  meta,
}: {
  icon: IconName;
  title: string;
  count?: ReactNode;
  sentence?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="t-d-head t-anim-rise">
      <span className="t-d-head__mark" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <div className="t-stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
        <div className="t-row t-row--baseline t-row--wrap" style={{ gap: 10 }}>
          <h1 className="t-h1">{title}</h1>
          {count != null ? <span className="t-d-head__count t-mono">{count}</span> : null}
          {meta ? <span className="t-meta">{meta}</span> : null}
        </div>
        {sentence ? <p className="t-d-head__sentence">{sentence}</p> : null}
      </div>
      {actions ? <div className="t-row t-row--wrap t-d-head__actions">{actions}</div> : null}
    </header>
  );
}

export function Facts({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="t-d-facts">
      {rows.map(([k, v], i) => (
        <div key={i} className="t-d-facts__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Bars({
  values,
  label,
  tone = "signal",
}: {
  values: number[];
  label: string;
  tone?: "signal" | "ok" | "warn";
}) {
  const max = Math.max(1, ...values);
  const w = 4;
  const gap = 2;
  return (
    <svg
      className={`t-d-bars t-d-bars--${tone}`}
      width={values.length * (w + gap)}
      height={24}
      viewBox={`0 0 ${values.length * (w + gap)} 24`}
      role="img"
      aria-label={label}
    >
      {values.map((v, i) => {
        const h = Math.max(1, (v / max) * 22);
        return <rect key={i} x={i * (w + gap)} y={24 - h} width={w} height={h} rx={1} />;
      })}
    </svg>
  );
}

export function KeyHints({ hints }: { hints: [string, string][] }) {
  return (
    <div className="t-d-keys">
      {hints.map(([k, label]) => (
        <span key={k} className="t-row" style={{ gap: 4 }}>
          <Kbd>{k}</Kbd>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

export type DiffLine = {
  kind: "add" | "del" | "same" | "hunk";
  text: string;
  old?: number;
  new?: number;
};

export function Diff({ lines, label }: { lines: DiffLine[]; label: string }) {
  return (
    <div className="t-d-diff" role="table" aria-label={label}>
      {lines.map((l, i) => (
        <div key={i} role="row" className="t-d-diff__line" data-kind={l.kind}>
          <span role="cell" className="t-d-diff__n">
            {l.old ?? ""}
          </span>
          <span role="cell" className="t-d-diff__n">
            {l.new ?? ""}
          </span>
          <span role="cell" className="t-d-diff__sign" aria-hidden="true">
            {l.kind === "add" ? "+" : l.kind === "del" ? "−" : l.kind === "hunk" ? "@" : " "}
          </span>
          <span role="cell" className="t-d-diff__text">
            {l.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Steps({
  steps,
  label,
}: {
  steps: {
    key: string;
    label: ReactNode;
    state: "done" | "running" | "failed" | "todo";
    detail?: ReactNode;
  }[];
  label: string;
}) {
  return (
    <ol className="t-d-steps" aria-label={label}>
      {steps.map((s) => (
        <li key={s.key} className="t-d-steps__item" data-state={s.state}>
          <span className="t-d-steps__mark" aria-hidden="true">
            {s.state === "done" ? (
              <Icon name="check" size={12} />
            ) : s.state === "failed" ? (
              <Icon name="close" size={12} />
            ) : null}
          </span>
          <div className="t-stack" style={{ gap: 2 }}>
            <span className="t-d-steps__label">{s.label}</span>
            {s.detail ? <span className="t-meta">{s.detail}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
