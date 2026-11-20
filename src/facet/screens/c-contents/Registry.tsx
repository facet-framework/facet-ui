import { labelText } from "../../../i18n/legacy/labels";
import { useState } from "react";
import { Button, Chip, Tabs } from "../../primitives/controls";
import { EmptyState, Meter } from "../../primitives/display";
import { Pagination } from "../../primitives/collection";
import { Icon } from "../../primitives/Icon";
import { useText } from "../../i18n/TextProvider";
import type { TextKey } from "../../i18n/en";
import { BarList, CalendarHeatmap } from "./charts";
import { KeyValues, KindFrame, MiniStat, RecordRef, short } from "./frame";
import { DetailCard, originOf, type CardOrigin } from "./detail";
import type { DayCount, KnowledgeRow, OpsEntry, TeamProvenance, ViewDef } from "./model";

export type KnowledgeView = "matrix" | "open";

export type KnowledgePageProps = {
  view: KnowledgeView;
  slots: string[];

  questions?: string[];
  rows: KnowledgeRow[];
  totals: { records: number; filled: number; open: number };

  openPerSlot: number[];
  page: number;
  pageSize: number;
  total: number;
  slot?: number;
  mobile?: boolean;
  onView?: (v: KnowledgeView) => void;
  onPage?: (p: number) => void;
  onSlot?: (i: number) => void;
  onOpenRecord?: (id: string) => void;
  onAnswer?: (id: string, slot: number) => void;
};

const K_VIEWS: (ViewDef<KnowledgeView> & { label: TextKey })[] = [
  { value: "matrix", label: "c.knowledge.view.matrix", icon: "grid" },
  { value: "open", label: "c.knowledge.view.open", icon: "knowledge" },
];

export function KnowledgePage(p: KnowledgePageProps) {
  const { t, plural, number } = useText();
  const all = p.totals.filled + p.totals.open;
  const slot = p.slot ?? 0;
  const [card, setCard] = useState<{ id: string; slot: number; origin?: CardOrigin } | null>(null);
  const cardRow = card ? p.rows.find((r) => r.id === card.id) : undefined;
  const cardAnswer =
    card && cardRow ? (cardRow.answers?.[card.slot] ?? cardRow.slots[card.slot]) : null;
  return (
    <KindFrame
      groupId="Registry"
      testId="knowledge-page"
      kindLabel={t("c.kind.knowledge")}
      group="Registry"
      figure={number(p.totals.open)}
      of={number(all)}
      tone={p.totals.open ? "warn" : "ok"}
      sentence={plural("c.knowledge.sentence", p.totals.open)}
      lead={t("c.knowledge.lead", {
        share: Math.round((p.totals.filled / (all || 1)) * 100),
        records: p.totals.records,
      })}
      stats={p.slots.map((s, i) => (
        <MiniStat
          key={s}
          label={s}
          value={p.openPerSlot[i]}
          tone={p.openPerSlot[i] ? "warn" : "ok"}
        />
      ))}
      views={K_VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={p.view}
      onView={p.onView}
    >
      {p.view === "matrix" ? (
        <div
          className="t-c-kmatrix"
          role="table"
          aria-label={t("c.knowledge.view.matrix")}
          data-testid="knowledge-matrix"
        >
          <div role="row" className="t-c-kmatrix__row t-c-kmatrix__row--head">
            <span role="columnheader">Record</span>
            {p.slots.map((s, i) => (
              <span role="columnheader" key={s} className="t-c-kmatrix__colhead">
                <span className="t-wrap">{s}</span>
                <Meter
                  value={1 - p.openPerSlot[i] / (p.totals.records || 1)}
                  thin
                  label={t("c.knowledge.slotAnswered", { slot: s })}
                />
              </span>
            ))}
          </div>
          {p.rows.map((r) => (
            <div role="row" key={r.id} className="t-c-kmatrix__row">
              <span role="rowheader">
                <RecordRef id={r.id} onOpen={p.onOpenRecord} />
              </span>
              {r.slots.map((v, i) => (
                <span role="cell" key={i}>
                  {v ? (
                    <button
                      type="button"
                      className="t-c-kcell t-c-kcell--filled"
                      aria-label={t("c.knowledge.showAnswer", {
                        id: short(r.id),
                        slot: p.slots[i],
                      })}
                      aria-haspopup="dialog"
                      aria-expanded={(card?.id === r.id && card.slot === i) || undefined}
                      onClick={(e) =>
                        setCard({ id: r.id, slot: i, origin: originOf(e.currentTarget) })
                      }
                    >
                      <Icon name="check" size={12} />
                      <span className="t-wrap t-hide-mobile">{v}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="t-c-kcell t-c-kcell--open"
                      aria-label={t("c.knowledge.answerSlot", {
                        id: short(r.id),
                        slot: p.slots[i],
                      })}
                      onClick={() => p.onAnswer?.(r.id, i)}
                    >
                      <span className="t-hide-mobile">{t("c.promises.state.open")}</span>
                    </button>
                  )}
                </span>
              ))}
            </div>
          ))}
          <Pagination
            page={p.page}
            pageSize={p.pageSize}
            total={p.total}
            onPage={p.onPage}
            compact={p.mobile}
          />
        </div>
      ) : (
        <div className="t-stack" data-testid="knowledge-open">
          <div className="t-c-tabscroll">
            <Tabs
              label={t("c.knowledge.slot")}
              value={String(slot)}
              items={p.slots.map((s, i) => ({
                value: String(i),
                label: s,
                count: p.openPerSlot[i],
              }))}
              onChange={(v) => p.onSlot?.(Number(v))}
            />
          </div>
          <ul className="t-c-rows" aria-label={t("c.knowledge.openIn", { slot: p.slots[slot] })}>
            {p.rows
              .filter((r) => r.slots[slot] == null)
              .map((r) => {
                const filled = r.slots.filter(Boolean).length;
                return (
                  <li key={r.id} className="t-c-qrow">
                    <span className="t-c-qrow__q">
                      <span className="t-c-small t-muted">{p.slots[slot]}?</span>
                      <RecordRef id={r.id} onOpen={p.onOpenRecord} />
                    </span>
                    <span
                      className="t-c-dots"
                      aria-label={t("c.knowledge.filledOf", { count: filled, total: 5 })}
                    >
                      {r.slots.map((v, i) => (
                        <span key={i} className={v ? "t-dot t-dot--ok" : "t-dot t-dot--open"} />
                      ))}
                    </span>
                    <Button size="small" icon="edit" onClick={() => p.onAnswer?.(r.id, slot)}>
                      {t("c.knowledge.answer")}
                    </Button>
                  </li>
                );
              })}
          </ul>
          <Pagination
            page={p.page}
            pageSize={p.pageSize}
            total={p.openPerSlot[slot]}
            onPage={p.onPage}
            compact={p.mobile}
          />
        </div>
      )}
      {card && cardAnswer != null ? (
        <DetailCard
          testId="knowledge-card"
          label={`${p.slots[card.slot]} · ${card.id}`}
          eyebrow={p.slots[card.slot]}
          title={p.questions?.[card.slot] ?? p.slots[card.slot]}
          meta={<span className="t-mono">{card.id}</span>}
          origin={card.origin}
          mobile={p.mobile}
          onClose={() => setCard(null)}
          footer={
            p.onOpenRecord ? (
              <Button
                size="small"
                icon="records"
                onClick={() => {
                  setCard(null);
                  p.onOpenRecord?.(card.id);
                }}
              >
                {t("c.knowledge.openRecord")}
              </Button>
            ) : undefined
          }
        >
          <p className="t-c-dcard__answer">{cardAnswer}</p>
        </DetailCard>
      ) : null}
    </KindFrame>
  );
}

export type OperationsPageProps = {
  state: "ready" | "empty";
  entries: OpsEntry[];
  records: number;
  onOpenRecord?: (id: string) => void;
  onLearn?: () => void;
};

const OPS_KIND: Record<OpsEntry["kind"], TextKey | null> = {
  SLO: null,
  Alert: labelText.text199,
  "Continuous check": "c.ops.kind.check",
};

export function OperationsPage({
  state,
  entries,
  records,
  onOpenRecord,
  onLearn,
}: OperationsPageProps) {
  const { t, number } = useText();
  const opsKind = (k: OpsEntry["kind"]) => {
    const key = OPS_KIND[k];
    return key ? t(key) : k;
  };
  const observed = [...new Set(entries.map((e) => e.recordId))];
  const count = (k: OpsEntry["kind"]) => entries.filter((e) => e.kind === k).length;
  return (
    <KindFrame
      groupId="Registry"
      testId="operations-page"
      kindLabel={t("c.kind.operations")}
      group="Registry"
      figure={state === "empty" ? number(0) : number(observed.length)}
      of={number(records)}
      sentence={
        state === "empty"
          ? t("c.ops.sentenceEmpty")
          : observed.length === 1
            ? t("c.ops.sentence.one")
            : t("c.ops.sentence.other", { count: observed.length })
      }
      stats={
        <>
          <MiniStat label="SLOs" value={state === "empty" ? 0 : count("SLO")} />
          <MiniStat label={t("c.ops.alarms")} value={state === "empty" ? 0 : count("Alert")} />
          <MiniStat
            label={t("c.ops.checks")}
            value={state === "empty" ? 0 : count("Continuous check")}
          />
        </>
      }
    >
      {state === "empty" ? (
        <EmptyState
          icon="ops"
          title={t("c.ops.emptyTitle")}
          body={
            <>
              {t("c.ops.emptyBodyBefore")}
              <code className="t-mono">observation:</code>
              {t("c.ops.emptyBodyAfter")}
            </>
          }
          action={
            <Button variant="primary" icon="plus" onClick={onLearn}>
              {t("c.ops.create")}
            </Button>
          }
        />
      ) : (
        <div className="t-stack" style={{ gap: 16 }}>
          {observed.map((rid) => (
            <section key={rid} className="t-surface t-c-group" aria-label={rid}>
              <header className="t-c-group__head">
                <Icon name="ops" size={16} />
                <RecordRef id={rid} onOpen={onOpenRecord} />
                <span className="t-spacer" />
                <span className="t-meta">
                  {t("c.ops.entries", { count: entries.filter((e) => e.recordId === rid).length })}
                </span>
              </header>
              <ul className="t-c-plain t-c-ops">
                {entries
                  .filter((e) => e.recordId === rid)
                  .map((e) => (
                    <li key={e.key} className="t-c-ops__row">
                      <span
                        className={`t-badge ${e.kind === "Alert" ? "t-badge--warn" : e.kind === "SLO" ? "t-badge--signal" : ""}`}
                      >
                        {opsKind(e.kind)}
                      </span>
                      <span className="t-c-ops__name">{e.name}</span>
                      <span className="t-c-ops__target t-mono">{e.target}</span>
                      <span className="t-meta">{e.window ?? "—"}</span>
                      <span className="t-meta t-wrap t-hide-mobile">{e.source}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <p className="t-meta t-c-center">
            {t("c.ops.without", { count: records - observed.length })}
          </p>
        </div>
      )}
    </KindFrame>
  );
}

export type ProvenanceView = "team" | "calendar";

export type ProvenancePageProps = {
  view: ProvenanceView;
  teams: TeamProvenance[];
  unowned: number;
  days: DayCount[];
  range: { from: string; to: string };
  selectedDay?: DayCount | null;
  months: { key: string; label: string; count: number }[];
  undated: number;
  mobile?: boolean;
  onView?: (v: ProvenanceView) => void;
  onPickDay?: (date: string) => void;
  onOpenRecord?: (id: string) => void;
  onTeam?: (id: string) => void;
};

const P_VIEWS: (ViewDef<ProvenanceView> & { label: TextKey })[] = [
  { value: "team", label: "c.prov.view.team", icon: "team" },
  { value: "calendar", label: "c.prov.view.calendar", icon: "calendar" },
];

export function ProvenancePage(p: ProvenancePageProps) {
  const { t, plural, number } = useText();
  const owned = p.teams.reduce((a, team) => a + team.records, 0);
  const dated = p.days.reduce((a, d) => a + d.count, 0);
  const busiest = [...p.days].sort((a, b) => b.count - a.count)[0];
  return (
    <KindFrame
      groupId="Registry"
      testId="provenance-page"
      kindLabel={t("c.kind.provenance")}
      group="Registry"
      figure={number(owned)}
      of={number(owned + p.unowned)}
      sentence={p.unowned ? plural("c.prov.sentence", p.unowned) : t("c.prov.sentenceAll")}
      lead={t("c.prov.lead", { teams: p.teams.length, from: p.range.from, to: p.range.to })}
      stats={
        <>
          <MiniStat label="Teams" value={p.teams.length} />
          <MiniStat
            label={t("c.prov.withoutTeam")}
            value={p.unowned}
            tone={p.unowned ? "warn" : undefined}
          />
          <MiniStat label={t("c.prov.withoutDate")} value={p.undated} />
        </>
      }
      views={P_VIEWS.map((v) => ({ ...v, label: t(v.label) }))}
      view={p.view}
      onView={p.onView}
    >
      {p.view === "team" ? (
        <div className="t-c-teams t-stagger" data-testid="provenance-teams">
          {p.teams.map((team) => (
            <article key={team.id} className="t-raised t-c-team">
              <header className="t-row">
                <span className="t-c-tile__icon">
                  <Icon name="team" size={16} />
                </span>
                <div className="t-stack" style={{ gap: 0, flex: 1 }}>
                  <button
                    type="button"
                    className="t-c-linkish t-h3"
                    onClick={() => p.onTeam?.(team.id)}
                  >
                    {team.name}
                  </button>
                  {team.purpose ? <span className="t-c-small t-muted">{team.purpose}</span> : null}
                </div>
                <span className="t-c-team__n">{number(team.records)}</span>
              </header>
              <Meter
                value={team.records ? team.proven / team.records : null}
                label={t("c.prov.teamProven", { team: team.name })}
                thin
              />
              <BarList
                label={t("c.prov.teamAreas", { team: team.name })}
                items={team.domains.map((d) => ({
                  key: d.id,
                  label: <span className="t-mono">{d.id}</span>,
                  value: d.records,
                }))}
              />
              <div className="t-stack" style={{ gap: 4 }}>
                <span className="t-label">{t("c.prov.recent")}</span>
                {team.recent.map((r) => (
                  <div key={r.id} className="t-row t-c-small">
                    <span className="t-meta" style={{ whiteSpace: "nowrap" }}>
                      {r.date}
                    </span>
                    <RecordRef id={r.id} onOpen={p.onOpenRecord} />
                  </div>
                ))}
              </div>
            </article>
          ))}
          {p.unowned ? (
            <article className="t-surface t-c-team t-c-team--none">
              <header className="t-row">
                <Icon name="warning" size={16} className="t-warn" />
                <span className="t-h3" style={{ flex: 1 }}>
                  {t("c.prov.noTeam")}
                </span>
                <span className="t-c-team__n t-warn">{number(p.unowned)}</span>
              </header>
              <span className="t-c-small t-muted">
                <code className="t-mono">owner:</code> {t("c.prov.ownerMissing")}
              </span>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="t-c-cal-layout" data-testid="provenance-calendar">
          <div className="t-surface t-pad t-stack">
            <div className="t-row t-row--wrap">
              <span className="t-h3">{t("c.prov.perDay")}</span>
              <span className="t-meta">
                {t("c.prov.dated", { count: dated })}
                {busiest
                  ? ` · ${t("c.prov.busiest", { date: busiest.date, count: busiest.count })}`
                  : ""}
              </span>
            </div>
            <div className="t-c-scrollx">
              <CalendarHeatmap
                label={t("c.prov.perDay")}
                days={p.days}
                cell={p.mobile ? 14 : 44}
                from={p.range.from}
                to={p.range.to}
                selected={p.selectedDay?.date}
                onPick={p.onPickDay}
              />
            </div>
            <BarList
              label={t("c.prov.perMonth")}
              items={p.months.map((m) => ({ key: m.key, label: m.label, value: m.count }))}
            />
          </div>
          <div className="t-raised t-pad t-stack" data-testid="provenance-day">
            {p.selectedDay ? (
              <>
                <span className="t-eyebrow">{p.selectedDay.date}</span>
                <span className="t-h2">
                  {t("c.prov.dayCreated", { count: p.selectedDay.count })}
                </span>
                <ul className="t-c-plain t-stack" style={{ gap: 4 }}>
                  {(p.selectedDay.ids ?? []).slice(0, 14).map((id) => (
                    <li key={id}>
                      <RecordRef id={id} onOpen={p.onOpenRecord} />
                    </li>
                  ))}
                </ul>
                {(p.selectedDay.ids?.length ?? 0) > 14 ? (
                  <Chip>{t("c.more", { count: (p.selectedDay.ids?.length ?? 0) - 14 })}</Chip>
                ) : null}
              </>
            ) : (
              <KeyValues
                items={[
                  [t("c.prov.first"), p.range.from],
                  [t("c.prov.last"), p.range.to],
                  [t("c.chart.daysWithEntries"), p.days.filter((d) => d.count).length],
                ]}
              />
            )}
          </div>
        </div>
      )}
    </KindFrame>
  );
}
