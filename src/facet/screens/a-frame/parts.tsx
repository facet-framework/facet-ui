import type { TextKey } from "../../i18n/en";
import { useText } from "../../i18n/TextProvider";
import { Dot } from "../../primitives/controls";
import { ListRow } from "../../primitives/display";
import { Breadcrumbs, type Crumb } from "../../primitives/overlay";
import { Mosaic } from "./charts";
import type { CommitView, FeatureView } from "./model";

export const LIFECYCLE: Record<FeatureView["lifecycle"], TextKey> = {
  active: "a.lifecycle.active",
  planned: "a.lifecycle.planned",
  deprecated: "a.lifecycle.deprecated",
};

export function PathBar({
  crumbs,
  openKey,
  mobile,
  onToggleSiblings,
  query,
  onQuery,
  onClose,
}: {
  crumbs: Crumb[];
  openKey?: string | null;
  mobile?: boolean;
  onToggleSiblings?: (key: string) => void;

  query?: string;
  onQuery?: (query: string) => void;

  onClose?: () => void;
}) {
  const { t } = useText();
  if (mobile) {
    return (
      <nav className="t-a-pathline" aria-label={t("primitives.crumbs.label")}>
        <ol>
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            const cls = c.mono ? "t-mono" : undefined;
            return (
              <li key={c.key}>
                {i > 0 ? (
                  <span className="t-a-pathline__sep" aria-hidden="true">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span className={cls} aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <button type="button" className="t-a-link" onClick={c.onClick}>
                    <span className={cls}>{c.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
  return (
    <div className="t-a-path">
      <Breadcrumbs
        crumbs={crumbs}
        openKey={openKey}
        onToggleSiblings={onToggleSiblings}
        query={query}
        onQuery={onQuery}
        onClose={onClose}
      />
    </div>
  );
}

export function OpenRecordList({
  features,
  limit,
  onOpenRecord,
  label,
}: {
  features: FeatureView[];
  limit: number;
  onOpenRecord?: (id: string) => void;
  label?: string;
}) {
  const { t, number: nf } = useText();
  const open = features
    .filter((f) => f.proven < f.scenarios)
    .sort((a, b) => b.scenarios - b.proven - (a.scenarios - a.proven))
    .slice(0, limit);
  if (!open.length) return <p className="t-muted">{t("a.parts.noOpen")}</p>;
  return (
    <div className="t-surface t-a-list" role="list" aria-label={label ?? t("a.parts.openPromises")}>
      {open.map((f) => (
        <div key={f.id} role="listitem">
          <ListRow
            title={<span className="t-mono">{f.id}</span>}
            sub={t("a.parts.openLine", {
              open: nf(f.scenarios - f.proven),
              tests: nf(f.tests),
              lifecycle: t(LIFECYCLE[f.lifecycle]),
            })}
            lead={<Dot tone="warn" />}
            trail={
              <Mosaic
                cells={f.mosaic ?? Array.from({ length: f.scenarios }, (_, i) => i < f.proven)}
                label={f.slug}
                size={8}
              />
            }
            onClick={() => onOpenRecord?.(f.id)}
          />
        </div>
      ))}
    </div>
  );
}

export function CommitList({
  commits,
  limit,
  onOpenRecord,
}: {
  commits: CommitView[] | null;
  limit: number;
  onOpenRecord?: (id: string) => void;
}) {
  const { t } = useText();
  if (commits == null)
    return (
      <p className="t-muted" data-testid="commits-unmeasured" title={t("a.common.unmeasured")}>
        — · {t("a.common.unmeasured")}
      </p>
    );
  if (!commits.length)
    return (
      <p className="t-muted" data-testid="commits-none">
        {t("a.domain.noCommits")}
      </p>
    );
  return (
    <ol className="t-a-commits">
      {commits.slice(0, limit).map((c) => (
        <li key={c.sha}>
          <span className="t-meta">{c.date}</span>
          <span className="t-stack" style={{ gap: 2, minWidth: 0 }}>
            <span className="t-a-commits__subject">{c.subject}</span>
            <button
              type="button"
              className="t-a-link t-mono t-wrap"
              onClick={() => onOpenRecord?.(c.record)}
            >
              {c.sha} · {c.record}
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}
