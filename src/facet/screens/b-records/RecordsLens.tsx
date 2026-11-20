import type { KeyboardEvent } from "react";
import { Badge, Button, Tabs } from "../../primitives/controls";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import { KNOWLEDGE_SLOTS, type RecordRow } from "./model";
import { LifecycleBadge, ProofBar, StepList, cx } from "./parts";
import type { RecordDossier } from "./RecordDossierPage";
import type { FieldGroup, FieldTile } from "./RecordsPage";

export type LensTab = "promises" | "knowledge" | "relations";

export type LensState = {
  focus: RecordDossier | null;

  hits: RecordRow[];
  tab: LensTab;

  open: number;
};

export type RecordsLensProps = {
  groups: FieldGroup[];
  query: string;
  lens: LensState;
  mobile?: boolean;
  onFocus?: (id: string) => void;
  onOpen?: (id: string) => void;
  onTab?: (tab: LensTab) => void;
  onUnfold?: (index: number) => void;
};

type DotState = "focus" | "neighbour" | "hit" | "deep" | "plain";

function dotState(tile: FieldTile, focus: string | null, near: Set<string>, searching: boolean) {
  if (tile.id === focus) return "focus" as const;
  if (near.has(tile.id)) return "neighbour" as const;
  if (searching) return tile.match ? ("hit" as const) : ("deep" as const);
  return "plain" as const;
}

function nextIndex(key: string, at: number, count: number, groupStarts: number[]): number | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return Math.min(count - 1, at + 1);
    case "ArrowLeft":
    case "ArrowUp":
      return Math.max(0, at - 1);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    case "PageDown":
      return groupStarts.find((s) => s > at) ?? count - 1;
    case "PageUp":
      return [...groupStarts].reverse().find((s) => s < at) ?? 0;
    default:
      return null;
  }
}

function focusDot(root: HTMLElement | null, id: string | null) {
  if (!root || !id) return;
  root.querySelector<HTMLButtonElement>(`[data-lens-id="${CSS.escape(id)}"]`)?.focus();
}

function Sheet({
  r,
  lens,
  onFocus,
  onOpen,
  onTab,
  onUnfold,
}: {
  r: RecordDossier;
  lens: LensState;
  onFocus?: (id: string) => void;
  onOpen?: (id: string) => void;
  onTab?: (tab: LensTab) => void;
  onUnfold?: (index: number) => void;
}) {
  const { t } = useText();
  const answered = r.knowledge.filter((k) => k.answer).length;
  const tabs: { value: LensTab; label: string; count: number }[] = [
    { value: "promises", label: t("b.common.promises"), count: r.scenarios.length },
    { value: "knowledge", label: t("b.dossier.rail.knowledge"), count: answered },
    {
      value: "relations",
      label: t("b.dossier.rail.relations"),
      count: r.dependsOn.length + r.dependents.length,
    },
  ];
  const panelId = `t-lens-panel-${lens.tab}`;

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((x) => x.value === lens.tab);
    const to =
      e.key === "ArrowRight"
        ? (at + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (at + tabs.length - 1) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : null;
    if (to == null) return;
    e.preventDefault();
    onTab?.(tabs[to].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus();
  };
  const links = (label: string, items: RecordDossier["dependsOn"], none: string) => (
    <div className="t-b-lens__rel">
      <span className="t-label">{label}</span>
      {items.length ? (
        <span className="t-row t-row--wrap" style={{ gap: 6 }}>
          {items.map((d) => (
            <Button
              key={d.id}
              size="small"
              variant="quiet"
              icon="records"
              onClick={() => onFocus?.(d.id)}
            >
              <span className="t-mono t-wrap">{d.id}</span>
            </Button>
          ))}
        </span>
      ) : (
        <span className="t-muted">{none}</span>
      )}
    </div>
  );
  return (
    <>
      <header className="t-b-lens__head">
        <span className="t-meta t-mono t-wrap">
          {r.kind === "assumption" ? t("b.kind.assumption") : r.domain} / {r.capability}
        </span>
        <h2 className="t-b-lens__name t-mono t-wrap" data-testid="lens-focus-name">
          {r.slug}
        </h2>
        <span className="t-row t-row--wrap" style={{ gap: 10 }}>
          <LifecycleBadge lifecycle={r.lifecycle} />
          {r.kind === "assumption" ? <Badge tone="signal">{t("b.kind.assumption")}</Badge> : null}
          <ProofBar proven={r.provenCount} total={r.scenarioCount} />
          {r.drift.length ? (
            <Badge tone="warn" plain>
              <Icon name="drift" size={12} /> {r.drift.length}
            </Badge>
          ) : null}
          <span className="t-spacer" />
          <Button size="small" icon="forward" onClick={() => onOpen?.(r.id)}>
            {t("b.dossier.viewRecord")}
          </Button>
        </span>
        <p className="t-b-lens__summary">{r.summary || t("b.dossier.noSummary")}</p>
        {}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div onKeyDown={onTabKey}>
          <Tabs
            label={t("b.records.lens.sections")}
            value={lens.tab}
            items={tabs.map((x) => ({ value: x.value, label: x.label, count: x.count }))}
            onChange={onTab}
          />
        </div>
      </header>
      <div
        className="t-b-lens__panel"
        role="tabpanel"
        id={panelId}
        aria-label={tabs.find((x) => x.value === lens.tab)?.label}
      >
        {lens.tab === "promises" ? (
          r.scenarios.length ? (
            <ol className="t-b-lens__promises">
              {r.scenarios.map((s, i) => {
                const unfolded = i === lens.open;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="t-b-lens__promise"
                      aria-expanded={unfolded}
                      onClick={() => onUnfold?.(unfolded ? -1 : i)}
                    >
                      <span
                        className={cx("t-b-lens__mark", !s.proven && "t-b-lens__mark--open")}
                        aria-hidden="true"
                      />
                      <span className="t-mono t-wrap">{s.id}</span>
                      <span className={s.proven ? "t-ok t-meta" : "t-warn t-meta"}>
                        {s.proven ? t("b.common.proven") : t("b.common.open")}
                      </span>
                    </button>
                    {unfolded ? (
                      <div className="t-b-lens__steps">
                        <StepList steps={s.steps} />
                        <span className="t-label">{t("b.dossier.provingTests")}</span>
                        {s.tests.length ? (
                          <ul className="t-b-lens__tests">
                            {s.tests.map((x) => (
                              <li key={`${x.file}::${x.name ?? ""}`} className="t-mono t-wrap">
                                {x.file}
                                {x.name ? ` · ${x.name}` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="t-muted">{t("b.dossier.noProof")}</span>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="t-muted">
              {r.kind === "assumption"
                ? t("b.dossier.assumptionNoPromise")
                : t("b.dossier.noScenario")}
            </p>
          )
        ) : lens.tab === "knowledge" ? (
          <dl className="t-b-lens__knowledge">
            {KNOWLEDGE_SLOTS.map((slot) => {
              const answer = r.knowledge.find((k) => k.key === slot.key)?.answer;
              return (
                <div key={slot.key}>
                  <dt className="t-label">{t(slot.label)}</dt>
                  <dd className={answer ? undefined : "t-muted"}>{answer || t("b.common.open")}</dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <div className="t-stack" style={{ gap: 14 }}>
            {links(t("b.dossier.needs"), r.dependsOn, t("b.dossier.nothing"))}
            {links(t("b.dossier.neededBy"), r.dependents, t("b.dossier.nobody"))}
          </div>
        )}
      </div>
    </>
  );
}

export function RecordsLens({
  groups,
  query,
  lens,
  mobile,
  onFocus,
  onOpen,
  onTab,
  onUnfold,
}: RecordsLensProps) {
  const { t, number } = useText();
  const searching = query.trim().length > 0;
  const r = lens.focus;
  const focusId = r?.id ?? null;
  const near = new Set([...(r?.dependsOn ?? []), ...(r?.dependents ?? [])].map((d) => d.id));
  const all = groups.flatMap((g) => g.tiles);
  const order = all.map((x) => x.id);
  const groupStarts: number[] = [];
  groups.reduce((at, g) => {
    groupStarts.push(at);
    return at + g.tiles.length;
  }, 0);

  const tabStop = focusId && order.includes(focusId) ? focusId : (order[0] ?? null);
  const sharp = searching ? all.filter((x) => x.match).length : all.length;

  const pick = (id: string) => {
    onFocus?.(id);
    if (mobile) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      document
        .querySelector('[data-testid="lens-sheet"]')
        ?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const onDotKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const to = nextIndex(e.key, order.indexOf(id), order.length, groupStarts);
    if (to == null) return;
    e.preventDefault();
    onFocus?.(order[to]);
    focusDot(e.currentTarget.closest(".t-b-lens__field"), order[to]);
  };

  const label = (tile: FieldTile, state: DotState) => {
    const proof = tile.scenarios
      ? t("b.records.tileTitle", { id: tile.id, proven: tile.proven, total: tile.scenarios })
      : `${tile.id} · ${t("b.parts.noPromises")}`;
    return state === "neighbour" ? `${proof} · ${t("b.records.lens.neighbour")}` : proof;
  };

  const field = (
    <section className="t-b-lens__fieldwrap" aria-label={t("b.records.lens.field")}>
      <p className="t-b-lens__status t-meta" role="status" data-testid="lens-status">
        {searching
          ? t("b.records.lens.status", { sharp: number(sharp), deep: number(all.length - sharp) })
          : null}
      </p>
      <div className="t-b-lens__field t-surface">
        {groups.map((g) => {
          const name =
            g.kind === "assumption"
              ? `${t("b.common.assumptions")} / ${g.capability}`
              : `${g.domain} / ${g.capability}`;
          const inFocus = g.tiles.some(
            (x) => x.id === focusId || near.has(x.id) || (searching && x.match),
          );
          return (
            <div
              key={`${g.domain}/${g.capability}`}
              className="t-b-lens__group"
              role="group"
              aria-label={name}
              data-depth={searching && !inFocus ? "1" : undefined}
            >
              <span className="t-b-lens__gname t-mono t-wrap" aria-hidden="true">
                {name}
              </span>
              <span className="t-b-lens__dots">
                {g.tiles.map((tile) => {
                  const state = dotState(tile, focusId, near, searching);
                  const full = tile.scenarios > 0 && tile.proven >= tile.scenarios;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      className={cx(
                        "t-b-dot",
                        `t-b-dot--${tile.lifecycle}`,
                        tile.scenarios === 0
                          ? "t-b-dot--none"
                          : full
                            ? "t-b-dot--proven"
                            : "t-b-dot--open",
                      )}
                      data-lens-id={tile.id}
                      data-state={state}
                      data-testid="lens-dot"
                      tabIndex={tile.id === tabStop ? 0 : -1}
                      aria-pressed={state === "focus"}
                      aria-label={label(tile, state)}
                      title={label(tile, state)}
                      onClick={() => pick(tile.id)}
                      onKeyDown={(e) => onDotKey(e, tile.id)}
                    />
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="t-b-lens__legend t-meta" aria-label={t("b.records.lens.legend")}>
        <li>
          <span className="t-b-dot t-b-dot--proven" aria-hidden="true" />{" "}
          {t("b.records.lens.legendProven")}
        </li>
        <li>
          <span className="t-b-dot t-b-dot--open" aria-hidden="true" />{" "}
          {t("b.records.lens.legendOpen")}
        </li>
        <li>
          <span className="t-b-dot t-b-dot--none" aria-hidden="true" /> {t("b.parts.noPromises")}
        </li>
        <li>
          <span className="t-b-dot t-b-dot--planned t-b-dot--none" aria-hidden="true" />{" "}
          {t("b.lifecycle.planned")}
        </li>
        <li>
          <span className="t-b-dot" data-state="focus" aria-hidden="true" />{" "}
          {t("b.records.lens.legendFocus")}
        </li>
        <li>
          <span className="t-b-dot t-b-dot--proven" data-state="neighbour" aria-hidden="true" />{" "}
          {t("b.records.lens.neighbour")}
        </li>
      </ul>
    </section>
  );

  const hits =
    searching && lens.hits.length ? (
      <section className="t-b-lens__hits" aria-label={t("b.records.lens.hits")}>
        <span className="t-label">{t("b.records.lens.hits")}</span>
        {lens.hits.map((h) => (
          <button
            key={h.id}
            type="button"
            className="t-b-lens__hit"
            aria-current={h.id === focusId ? "true" : undefined}
            onClick={() => pick(h.id)}
          >
            <span className="t-mono t-wrap">{h.slug}</span>
            <span className="t-meta t-mono t-wrap">
              {h.domain} / {h.capability}
            </span>
            <ProofBar proven={h.proven} total={h.scenarios} />
          </button>
        ))}
      </section>
    ) : null;

  const sheet = (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className="t-b-lens__sheet t-surface"
      aria-label={r ? r.id : t("b.records.lens.noFocus")}
      data-testid="lens-sheet"
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !focusId) return;
        e.stopPropagation();
        focusDot(e.currentTarget.parentElement, focusId);
      }}
    >
      {r ? (
        <Sheet r={r} lens={lens} onFocus={pick} onOpen={onOpen} onTab={onTab} onUnfold={onUnfold} />
      ) : (
        <p className="t-muted">{t("b.records.lens.noFocus")}</p>
      )}
    </article>
  );

  return (
    <div className={cx("t-b-lens", mobile && "t-b-lens--mobile")} data-testid="records-lens">
      {mobile ? (
        <>
          {hits}
          {sheet}
          {field}
        </>
      ) : (
        <>
          <div className="t-b-lens__main">
            {field}
            {hits}
          </div>
          {sheet}
        </>
      )}
    </div>
  );
}
