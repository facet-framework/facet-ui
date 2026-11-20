import { Fragment } from "react";
import { Icon, type IconName } from "../../primitives/Icon";
import { Button, IconButton, Kbd } from "../../primitives/controls";
import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { KeyHints, noop } from "./shared";

export type PaletteItem = {
  key: string;
  icon: IconName;
  title: string;
  sub?: string;
  mono?: boolean;
  hint?: string;
  badge?: string;
};
export type PaletteGroup = {
  key: string;
  label: string;
  total?: number;

  of?: number;
  items: PaletteItem[];
};

export type PaletteProps = {
  query: string;
  groups: PaletteGroup[];
  activeKey?: string | null;

  total?: number;

  nearest?: string[];
  mobile?: boolean;
  onQuery?: (q: string) => void;
  onSelect?: (key: string) => void;
  onShowAll?: (group: string) => void;
  onAsk?: (q: string) => void;
  onClose?: () => void;
};

const PREFIX: Record<string, [TextKey | { fixed: string }, IconName]> = {
  "/": ["d.palette.commands", "keyboard"],
  "?": ["d.palette.ask", "spark"],
  "#": [{ fixed: "Ids" }, "records"],
};

export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.replace(/^[/?#]/, "").trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="t-d-mark">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function CommandPalette({
  query,
  groups,
  activeKey,
  total,
  nearest = [],
  mobile,
  onQuery = noop,
  onSelect = noop,
  onShowAll = noop,
  onAsk = noop,
  onClose = noop,
}: PaletteProps) {
  const { t, plural, number } = useText();
  const prefix = PREFIX[query.charAt(0)];
  const prefixLabel = prefix
    ? typeof prefix[0] === "string"
      ? t(prefix[0])
      : prefix[0].fixed
    : null;
  const listed = groups.reduce((a, g) => a + g.items.length, 0);
  const term = query.replace(/^[/?#]/, "").trim();
  return (
    <>
      <div className="t-scrim" aria-hidden="true" onClick={onClose} />
      <div
        className="t-d-palette t-float"
        data-mobile={mobile || undefined}
        role="dialog"
        aria-modal="true"
        aria-label={t("d.palette.label")}
      >
        <div className="t-d-palette__field">
          <Icon name={prefix ? prefix[1] : "search"} size={18} />
          {prefix ? <span className="t-d-palette__prefix">{prefixLabel}</span> : null}
          <input
            className="t-d-palette__input"
            aria-label={t("d.palette.input")}
            placeholder={t("d.palette.placeholder")}
            value={query}
            role="combobox"
            aria-expanded={listed > 0}
            aria-controls="t-d-palette-list"
            onChange={(e) => onQuery(e.target.value)}
          />
          {total != null && total > listed ? (
            <span className="t-meta t-mono">{plural("d.palette.hits", total)}</span>
          ) : null}
          {mobile ? (
            <IconButton icon="close" label={t("d.palette.close")} onClick={onClose} />
          ) : (
            <Kbd>Esc</Kbd>
          )}
        </div>
        <div
          className="t-d-palette__list"
          id="t-d-palette-list"
          role="listbox"
          aria-label={t("d.palette.results")}
        >
          {groups.map((g) => (
            <Fragment key={g.key}>
              <div className="t-d-palette__group" role="presentation">
                <span>{g.label}</span>
                {g.total != null ? (
                  <span className="t-mono">
                    {number(g.total)}
                    {g.of != null ? t("d.palette.of", { total: g.of }) : ""}
                  </span>
                ) : null}
                <span className="t-spacer" />
                {g.total != null && g.total > g.items.length ? (
                  <button type="button" className="t-d-linkbtn" onClick={() => onShowAll(g.key)}>
                    {t("d.palette.showAll", { count: g.total })}
                  </button>
                ) : null}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  role="option"
                  aria-selected={activeKey === it.key}
                  className="t-d-palette__item"
                  onClick={() => onSelect(it.key)}
                >
                  <span className="t-d-palette__icon">
                    <Icon name={it.icon} size={16} />
                  </span>
                  <span className="t-stack" style={{ gap: 0, minWidth: 0, flex: 1 }}>
                    <span className={it.mono ? "t-mono t-wrap" : "t-wrap"}>
                      <Highlight text={it.title} query={query} />
                    </span>
                    {it.sub ? <span className="t-meta t-wrap">{it.sub}</span> : null}
                  </span>
                  {it.badge ? <span className="t-badge t-badge--plain">{it.badge}</span> : null}
                  {it.hint ? <Kbd>{it.hint}</Kbd> : null}
                  {activeKey === it.key ? <Icon name="forward" size={14} /> : null}
                </button>
              ))}
            </Fragment>
          ))}
          {!groups.length ? (
            <div className="t-d-palette__none">
              <span className="t-d-palette__noneart" aria-hidden="true">
                <Icon name="search" size={22} />
              </span>
              <strong>{t("d.palette.none", { term })}</strong>
              {nearest.length ? (
                <span className="t-row t-row--wrap" style={{ gap: 6, justifyContent: "center" }}>
                  <span className="t-meta">{t("d.palette.didYouMean")}</span>
                  {nearest.map((n) => (
                    <button key={n} type="button" className="t-chip" onClick={() => onQuery(n)}>
                      {n}
                    </button>
                  ))}
                </span>
              ) : null}
              <Button variant="primary" icon="spark" onClick={() => onAsk(term)}>
                {t("d.palette.askTerm", { term })}
              </Button>
            </div>
          ) : null}
        </div>
        {mobile ? null : (
          <KeyHints
            hints={[
              ["↑↓", t("d.palette.key.choose")],
              ["↵", t("d.palette.key.open")],
              ["/", t("d.palette.key.commands")],
              ["?", t("d.palette.key.ask")],
              ["#", "Ids"],
            ]}
          />
        )}
      </div>
    </>
  );
}
