import { Button, Chip, Field, SearchField } from "../../primitives/controls";
import { EmptyState, Finding, Skeleton } from "../../primitives/display";
import { Pagination } from "../../primitives/collection";
import { Breadcrumbs, Toast } from "../../primitives/overlay";
import { Icon } from "../../primitives/Icon";
import { useText, type FacetText } from "../../i18n/TextProvider";
import { InlineMd, KeyValues, PathRef, RecordRef } from "./frame";
import type { GlossaryTerm, GlossaryTermDetail, TermProposal, TermProposalErrors } from "./model";

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type ProposalState = {
  values: TermProposal;
  errors: TermProposalErrors;
  status: "idle" | "sending" | "sent" | "failed";

  result?: { branch: string; pr: string };
  failure?: string;
};

export type GlossaryPageProps = {
  state: "ready" | "empty" | "loading";
  mode?: "list" | "term" | "propose";
  terms: GlossaryTerm[];
  letters: { letter: string; count: number }[];
  letter?: string | null;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  categories: string[];
  category?: string | null;
  detail?: GlossaryTermDetail | null;
  proposal?: ProposalState | null;
  mobile?: boolean;
  onLetter?: (l: string | null) => void;
  onQuery?: (q: string) => void;
  onCategory?: (c: string | null) => void;
  onPage?: (p: number) => void;
  onOpen?: (term: string) => void;
  onClose?: () => void;
  onPropose?: () => void;

  proposeDisabledReason?: string;
  onProposalChange?: (patch: Partial<TermProposal>) => void;
  onSubmit?: () => void;
  onOpenRecord?: (id: string) => void;
};

export function GlossaryPage(p: GlossaryPageProps) {
  const { t, plural, number } = useText();
  const mode = p.mode ?? "list";
  const fixed = p.terms.filter((term) => term.status === "settled").length;
  const groups = ALPHABET.map((l) => ({
    l,
    list: p.terms.filter((term) => term.term[0]?.toUpperCase() === l),
  })).filter((g) => g.list.length);
  const side =
    mode === "term" && p.detail ? (
      <TermDetail
        detail={p.detail}
        onClose={p.onClose}
        onOpen={p.onOpen}
        onOpenRecord={p.onOpenRecord}
      />
    ) : mode === "propose" && p.proposal ? (
      <ProposalForm
        proposal={p.proposal}
        categories={p.categories}
        onChange={p.onProposalChange}
        onSubmit={p.onSubmit}
        onCancel={p.onClose}
      />
    ) : null;

  if (p.mobile && side) {
    return (
      <div className="t-page t-c-gloss" data-testid="glossary-page">
        <Breadcrumbs
          crumbs={[
            { key: "g", label: `‹ ${t("c.kind.glossary")}`, onClick: p.onClose },
            {
              key: "t",
              label: mode === "term" ? p.detail?.term : t("c.gloss.propose"),
            },
          ]}
        />
        <div className="t-anim-rise">{side}</div>
      </div>
    );
  }

  return (
    <div className="t-page t-c-gloss" data-testid="glossary-page">
      <Finding
        eyebrow={t("c.kind.glossary")}
        figure={p.state === "ready" ? number(p.total) : p.state === "empty" ? number(0) : "—"}
        sentence={
          p.state === "empty"
            ? t("c.gloss.sentenceEmpty")
            : p.state === "loading"
              ? t("c.gloss.loading")
              : t("c.gloss.sentence", { count: p.total })
        }
        lead={
          p.state === "ready"
            ? `${p.total > p.terms.length ? `${t("c.gloss.onPage", { count: p.terms.length })} · ` : ""}${t("c.gloss.proposedLead", { count: p.terms.length - fixed })}`
            : undefined
        }
        aside={
          p.state === "empty" ? undefined : (
            <Button
              variant="primary"
              icon="plus"
              onClick={p.onPropose}
              disabledReason={p.proposeDisabledReason}
            >
              {t("c.gloss.propose")}
            </Button>
          )
        }
      />

      {p.state === "empty" ? (
        <EmptyState
          icon="book"
          title={t("c.gloss.emptyTitle")}
          body={
            <>
              {t("c.gloss.emptyBefore")}
              <code className="t-mono">docs/facets/glossary.yaml</code>
              {t("c.gloss.emptyAfter")}
            </>
          }
          action={
            <Button
              variant="primary"
              icon="plus"
              onClick={p.onPropose}
              disabledReason={p.proposeDisabledReason}
            >
              {t("c.gloss.proposeFirst")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="t-c-gloss__bar">
            <div className="t-c-gloss__search">
              <SearchField
                label={t("c.gloss.search")}
                value={p.query}
                placeholder={t("c.gloss.searchPlaceholder")}
                onChange={p.onQuery}
              />
            </div>
            <div className="t-row t-row--wrap" style={{ gap: 6 }}>
              <Chip pressed={!p.category} onClick={() => p.onCategory?.(null)}>
                {t("c.gloss.all")}
              </Chip>
              {p.categories.map((c) => (
                <Chip key={c} pressed={p.category === c} onClick={() => p.onCategory?.(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
          <nav className="t-c-az" aria-label={t("c.gloss.letters")}>
            {ALPHABET.map((l) => {
              const n = p.letters.find((x) => x.letter === l)?.count ?? 0;
              return (
                <button
                  key={l}
                  type="button"
                  className="t-c-az__l"
                  disabled={!n}
                  aria-pressed={p.letter === l}
                  aria-label={t("c.gloss.letterCount", { letter: l, count: n })}
                  onClick={() => p.onLetter?.(p.letter === l ? null : l)}
                >
                  {l}
                </button>
              );
            })}
          </nav>
          <div className={side ? "t-c-kind__body t-c-kind__body--aside" : "t-c-kind__body"}>
            <div className="t-stack" style={{ gap: 20 }}>
              {p.state === "loading"
                ? Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="t-stack" style={{ gap: 6 }}>
                      <Skeleton width={`${20 + ((i * 13) % 20)}%`} height={16} />
                      <Skeleton width={`${50 + ((i * 17) % 40)}%`} height={12} />
                    </div>
                  ))
                : groups.map((g) => (
                    <section
                      key={g.l}
                      aria-label={t("c.gloss.letter", { letter: g.l })}
                      className="t-c-gloss__group"
                    >
                      <h2 className="t-c-gloss__letter">{g.l}</h2>
                      <ul className="t-c-plain">
                        {g.list.map((term) => (
                          <li key={term.term}>
                            <button
                              type="button"
                              className="t-c-term"
                              aria-current={p.detail?.term === term.term || undefined}
                              onClick={() => p.onOpen?.(term.term)}
                            >
                              <span className="t-c-term__name">
                                {term.term}
                                {term.status === "proposed" ? (
                                  <span className="t-badge t-badge--plan">
                                    {t("c.gloss.status.proposed")}
                                  </span>
                                ) : null}
                              </span>
                              <span className="t-c-term__def t-clamp-2">
                                <InlineMd text={term.definition} />
                              </span>
                              <span className="t-c-term__meta t-meta">
                                {term.category}
                                {term.aliases.length
                                  ? ` · ${t("c.gloss.also", { aliases: term.aliases.join(", ") })}`
                                  : ""}{" "}
                                · {plural("c.records", term.records)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
              {p.state === "ready" ? (
                <Pagination
                  page={p.page}
                  pageSize={p.pageSize}
                  total={p.total}
                  onPage={p.onPage}
                  compact={p.mobile}
                />
              ) : null}
            </div>
            {side ? (
              <aside className="t-c-kind__aside t-raised t-pad t-c-aside">{side}</aside>
            ) : null}
          </div>
        </>
      )}
      {p.proposal?.status === "sent" && p.proposal.result ? (
        <div className="t-c-toastwrap">
          <Toast
            tone="ok"
            action={
              <Button size="small" variant="quiet" icon="external">
                {t("c.open")}
              </Button>
            }
          >
            {t("c.gloss.sentAs", { pr: p.proposal.result.pr })}{" "}
            <span className="t-mono">{p.proposal.result.branch}</span>
          </Toast>
        </div>
      ) : null}
    </div>
  );
}

function TermDetail({
  detail: d,
  onClose,
  onOpen,
  onOpenRecord,
}: {
  detail: GlossaryTermDetail;
  onClose?: () => void;
  onOpen?: (t: string) => void;
  onOpenRecord?: (id: string) => void;
}) {
  const { t, number } = useText();
  return (
    <article className="t-stack t-c-termdetail" data-testid="term-detail" aria-label={d.term}>
      <header className="t-row">
        <span className="t-eyebrow">{d.category}</span>
        <span className="t-spacer" />
        <Button size="small" variant="quiet" icon="edit">
          {t("c.gloss.proposeChange")}
        </Button>
        <Button
          size="small"
          variant="quiet"
          icon="close"
          aria-label={t("c.close")}
          onClick={onClose}
        />
      </header>
      <h2 className="t-h1">{d.term}</h2>
      <p className="t-lead">
        <InlineMd text={d.definition} />
      </p>
      <KeyValues
        items={[
          [
            "Status",
            d.status === "settled" ? (
              <span className="t-ok" key="s">
                {t("c.gloss.status.fixed")}
              </span>
            ) : (
              <span className="t-plan" key="s">
                {t("c.gloss.status.proposed")}
              </span>
            ),
          ],
          [t("c.gloss.aliases"), d.aliases.length ? d.aliases.join(", ") : "—"],
          [t("c.gloss.english"), d.translation ?? "—"],
          ["Records", number(d.records)],
        ]}
      />
      {d.related.length ? (
        <div className="t-stack" style={{ gap: 6 }}>
          <span className="t-label">{t("c.gloss.related")}</span>
          <div className="t-row t-row--wrap" style={{ gap: 4 }}>
            {d.related.map((r) => (
              <Chip key={r} icon="book" onClick={() => onOpen?.(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("c.gloss.usedBy")}</span>
        <ul className="t-c-plain t-stack" style={{ gap: 2 }}>
          {d.recordIds.map((id) => (
            <li key={id}>
              <RecordRef id={id} onOpen={onOpenRecord} />
            </li>
          ))}
        </ul>
      </div>
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("c.gloss.occurrences")}</span>
        <ul className="t-c-plain t-stack" style={{ gap: 8 }}>
          {d.occurrences.map((o) => (
            <li key={`${o.path}:${o.line}`} className="t-sunken t-c-occ">
              <PathRef path={o.path} line={o.line} />
              <span className="t-c-small t-ink2">{t("c.quote", { text: o.excerpt })}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-label">{t("c.gloss.history")}</span>
        <ol className="t-c-plain t-c-hist">
          {d.history.map((h) => (
            <li key={h.date + h.change} className="t-row t-c-small">
              <span className="t-meta">{h.date}</span>
              <span>{h.who}</span>
              <span className="t-muted t-ellipsis">{h.change}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function ProposalForm({
  proposal,
  categories,
  onChange,
  onSubmit,
  onCancel,
}: {
  proposal: ProposalState;
  categories: string[];
  onChange?: (patch: Partial<TermProposal>) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  const { t } = useText();
  const { values: v, errors: e, status } = proposal;
  const sending = status === "sending";
  return (
    <form
      className="t-stack t-c-form"
      aria-label={t("c.gloss.propose")}
      data-testid="term-proposal"
      onSubmit={(ev) => {
        ev.preventDefault();
        onSubmit?.();
      }}
    >
      <header className="t-row">
        <span className="t-h2">{t("c.gloss.propose")}</span>
        <span className="t-spacer" />
        <Button
          size="small"
          variant="quiet"
          icon="close"
          aria-label={t("c.cancel")}
          onClick={onCancel}
        />
      </header>
      <Field label={t("c.gloss.term")} error={e.term} hint={t("c.gloss.termHint")}>
        {(id) => (
          <input
            id={id}
            className="t-input"
            value={v.term}
            aria-invalid={!!e.term || undefined}
            disabled={sending}
            onChange={(ev) => onChange?.({ term: ev.target.value })}
          />
        )}
      </Field>
      <Field
        label="Definition"
        error={e.definition}
        hint={t("c.gloss.definitionHint", { count: v.definition.length, max: 280, min: 20 })}
      >
        {(id) => (
          <textarea
            id={id}
            className="t-textarea"
            rows={4}
            value={v.definition}
            aria-invalid={!!e.definition || undefined}
            disabled={sending}
            onChange={(ev) => onChange?.({ definition: ev.target.value })}
          />
        )}
      </Field>
      <div className="t-c-form__two">
        <Field label={t("c.gloss.category")} error={e.category}>
          {(id) => (
            <select
              id={id}
              className="t-select"
              value={v.category}
              disabled={sending}
              onChange={(ev) => onChange?.({ category: ev.target.value })}
            >
              <option value="">{t("c.gloss.choose")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t("c.gloss.aliases")} hint={t("c.gloss.aliasesHint")}>
          {(id) => (
            <input
              id={id}
              className="t-input"
              value={v.aliases}
              disabled={sending}
              onChange={(ev) => onChange?.({ aliases: ev.target.value })}
            />
          )}
        </Field>
      </div>
      <div className="t-stack" style={{ gap: 6 }}>
        <span className="t-field__label">{t("c.gloss.recordsUsing")}</span>
        <div className="t-row t-row--wrap" style={{ gap: 4 }}>
          {v.records.map((r) => (
            <Chip
              key={r}
              mono
              onRemove={() => onChange?.({ records: v.records.filter((x) => x !== r) })}
            >
              {r.split("/").pop()}
            </Chip>
          ))}
          {v.records.length === 0 ? <span className="t-meta">{t("c.none")}</span> : null}
        </div>
        {e.records ? <span className="t-field__error">{e.records}</span> : null}
      </div>
      {status === "failed" ? (
        <div className="t-c-alert" role="alert">
          <Icon name="error" size={16} />
          <span>{proposal.failure ?? t("c.gloss.failed")}</span>
        </div>
      ) : null}
      <footer className="t-row t-c-form__foot">
        <span className="t-meta">{t("c.gloss.becomesPr")}</span>
        <span className="t-spacer" />
        <Button variant="quiet" onClick={onCancel} disabled={sending}>
          {t("c.cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          icon={sending ? "refresh" : "pr"}
          disabled={sending}
        >
          {sending
            ? t("c.gloss.sending")
            : status === "failed"
              ? t("c.gloss.retry")
              : t("c.gloss.submit")}
        </Button>
      </footer>
    </form>
  );
}

export function validateProposal(
  v: TermProposal,
  existing: string[],
  t: FacetText["t"],
): TermProposalErrors {
  const e: TermProposalErrors = {};
  const term = v.term.trim();
  if (!term) e.term = t("c.gloss.err.termMissing");
  else if (existing.some((x) => x.toLowerCase() === term.toLowerCase()))
    e.term = t("c.gloss.err.termExists", { term });
  if (v.definition.trim().length < 20) e.definition = t("c.gloss.err.definitionShort", { min: 20 });
  else if (v.definition.length > 280) e.definition = t("c.gloss.err.definitionLong", { max: 280 });
  if (!v.category) e.category = t("c.gloss.err.category");
  return e;
}
