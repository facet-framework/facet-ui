import { localized } from "../../../i18n/legacy/facet/screens/a-frame/OverviewPage";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { TextKey } from "../../i18n/en";
import { useText, type FacetText } from "../../i18n/TextProvider";
import { Icon, type IconName } from "../../primitives/Icon";
import { Badge, Button, Chip, Dot } from "../../primitives/controls";
import {
  EmptyState,
  Finding,
  ListRow,
  Meter,
  Section,
  Skeleton,
  Stat,
} from "../../primitives/display";
import { Pagination } from "../../primitives/collection";
import { BandChart, Pyramid, Ring, StackBar, TrendChart, pct, pctText, shareTone } from "./charts";
import type { FeatureView, OverviewModel } from "./model";
import { CommitList, OpenRecordList } from "./parts";
import { DriftMark } from "../../shell/Shell";

export type OverviewRole =
  "leadership" | "developer" | "test" | "author" | "ownership" | "new" | "agent";

export const OVERVIEW_ROLE_KEYS: readonly OverviewRole[] = [
  "leadership",
  "developer",
  "test",
  "author",
  "ownership",
  "new",
  "agent",
];

export const KNOWLEDGE_SLOTS = [
  "prerequisite_knowledge",
  "not_for",
  "discoverability",
  "common_pitfalls",
  "success_signal",
] as const;

function roleText(role: OverviewRole, t: FacetText["t"]): string {
  return t(`shell.role.${role}.name`);
}

type FindingKey =
  "proof" | "drift" | "open" | "untested" | "knowledge" | "outliers" | "unowned" | "planned";

type Weighted = {
  key: FindingKey;
  icon: IconName;
  count: number;
  step: string;
  target: string;
};

const WEIGHTS: Record<OverviewRole, FindingKey[]> = {
  leadership: ["proof", "open", "drift", "unowned", "untested", "knowledge", "planned", "outliers"],
  developer: ["drift", "untested", "open", "planned", "proof", "outliers", "knowledge", "unowned"],
  test: ["open", "untested", "proof", "drift", "outliers", "planned", "knowledge", "unowned"],
  author: ["knowledge", "outliers", "planned", "open", "drift", "untested", "unowned", "proof"],
  ownership: ["unowned", "drift", "open", "knowledge", "proof", "untested", "planned", "outliers"],
  new: ["proof", "knowledge", "open", "drift", "untested", "planned", "outliers", "unowned"],
  agent: ["drift", "untested", "planned", "open", "knowledge", "outliers", "unowned", "proof"],
};

function findings(m: OverviewModel, { t, plural }: FacetText): Record<FindingKey, Weighted> {
  const open = m.totals.scenarios - m.totals.proven;
  const untested = m.features.filter((f) => f.lifecycle === "active" && f.tests === 0).length;
  const know = m.features.filter((f) => f.knowledgeOpen > 0).length;
  const scen = m.calibration.find((c) => c.key === "scenarios per record");
  const planned = m.features.filter((f) => f.lifecycle === "planned").length;
  return {
    proof: {
      key: "proof",
      icon: "promise",
      count: open,
      step: t("a.overview.step.proof"),
      target: "promises",
    },
    drift: {
      key: "drift",
      icon: "drift",
      count: m.drift.length,
      step: plural("a.overview.step.drift", m.drift.length),
      target: "drift",
    },
    open: {
      key: "open",
      icon: "promise",
      count: m.features.filter((f) => f.proven < f.scenarios).length,
      step: plural("a.overview.step.open", open),
      target: "promises",
    },
    untested: {
      key: "untested",
      icon: "test",
      count: untested,
      step: plural("a.overview.step.untested", untested),
      target: "tests",
    },
    knowledge: {
      key: "knowledge",
      icon: "knowledge",
      count: know,
      step: plural("a.overview.step.knowledge", know),
      target: "knowledge",
    },
    outliers: {
      key: "outliers",
      icon: "calibrate",
      count: scen ? scen.above + scen.below : 0,
      step: plural("a.overview.step.outliers", scen ? scen.above + scen.below : 0),
      target: "calibration",
    },
    unowned: {
      key: "unowned",
      icon: "team",
      count: m.unowned,
      step: plural("a.overview.step.unowned", m.unowned),
      target: "provenance",
    },
    planned: {
      key: "planned",
      icon: "anchor",
      count: planned,
      step: plural("a.overview.step.planned", planned),
      target: "records?lifecycle=planned",
    },
  };
}

export type OverviewPageProps = {
  reader: OverviewRole;
  model: OverviewModel;
  state?: "ready" | "loading";
  mobile?: boolean;

  driftPage?: number;
  teamNames?: Record<string, string>;
  onNavigate?: (target: string) => void;
  onOpenRecord?: (id: string) => void;
  onAsk?: (question: string) => void;
  onDriftPage?: (page: number) => void;
  onCopy?: (text: string) => void;

  generative?: ReactNode;
};

const DRIFT_PAGE = 10;

const LEITUNG_STEPS: readonly FindingKey[] = ["proof", "open", "unowned"];

const SIDE_MAX = 380;

function useStackForTable(grid: RefObject<HTMLDivElement | null>, key: unknown): boolean {
  const [stack, setStack] = useState(false);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const table = el.querySelector<HTMLElement>("[data-overview-fit]");
      if (!table) return setStack(false);
      const width = table.style.width;
      table.style.width = "max-content";
      const needed = table.getBoundingClientRect().width;
      table.style.width = width;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setStack(needed > el.clientWidth - gap - SIDE_MAX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid, key]);
  return stack;
}

export function OverviewPage(props: OverviewPageProps) {
  const { reader: role, model: m, state = "ready" } = props;
  const tx = useText();
  const { t, plural } = tx;
  const grid = useRef<HTMLDivElement>(null);
  const stack = useStackForTable(grid, `${role}:${tx.locale}:${m.features.length}`);
  const roleName = roleText(role, t);
  if (state === "loading") return <OverviewSkeleton roleName={roleName} />;
  if (m.totals.records === 0)
    return (
      <OverviewEmpty roleName={roleName} onNavigate={props.onNavigate} onCopy={props.onCopy} />
    );

  const f = findings(m, tx);
  const steps = WEIGHTS[role]
    .filter((k) => role !== "leadership" || LEITUNG_STEPS.includes(k))
    .map((k) =>
      role === "leadership" && k === "unowned"
        ? { ...f[k], step: plural("a.overview.leadership.stepUnowned", f[k].count) }
        : f[k],
    )
    .filter((w) => w.count > 0);
  const proven = pct(m.totals.proven, m.totals.scenarios);

  return (
    <div className="t-page t-a-overview" data-testid="overview" data-role={role}>
      <div className="t-a-overview__meta t-meta">
        <span className="t-eyebrow">{t("a.overview.eyebrow", { role: roleName })}</span>
        <span>
          <Icon name="branch" size={12} /> {m.project.branch} · {m.project.commit}
        </span>
        <span>{t("a.overview.asOf", { time: m.project.generatedAt })}</span>
        <span className="t-hide-mobile">facet {m.project.version}</span>
      </div>
      <div
        ref={grid}
        className="t-a-overview__grid"
        data-testid="overview-grid"
        data-stack={stack || undefined}
      >
        <div className="t-a-overview__main">
          <Hero {...props} proven={proven} />
          {role === "leadership" ? (
            <LeadershipKpis m={m} proven={proven} />
          ) : (
            <Kpis m={m} proven={proven} />
          )}
          {props.generative}
          <RoleBody {...props} />
        </div>
        <aside className="t-a-overview__side" aria-label={t("a.overview.nextSteps")}>
          <NextSteps steps={steps.slice(0, 6)} onNavigate={props.onNavigate} />
          <SidePanel {...props} />
        </aside>
      </div>
    </div>
  );
}

function Hero({
  reader: role,
  model: m,
  proven,
  teamNames,
  onNavigate,
}: OverviewPageProps & { proven: number | null }) {
  const { t, plural, number: nf } = useText();
  const open = m.totals.scenarios - m.totals.proven;
  const know = m.features.filter((f) => f.knowledgeOpen > 0);
  const slots = m.features.reduce((a, f) => a + f.knowledgeOpen, 0);
  const untested = m.features.filter((f) => f.lifecycle === "active" && f.tests === 0).length;
  const go = (target: string, label: string) => (
    <Button variant="primary" iconAfter="forward" onClick={() => onNavigate?.(target)}>
      {label}
    </Button>
  );
  switch (role) {
    case "leadership":
      return open === 0 ? (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={pctText(100, t)}
          tone="ok"
          sentence={t("a.overview.leadership.allProven")}
          lead={t("a.overview.leadership.allProvenLead", {
            scenarios: m.totals.scenarios,
            records: m.totals.records,
          })}
          aside={go("product", t("a.overview.leadership.openMap"))}
        />
      ) : (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={pctText(proven, t)}
          tone={shareTone(proven)}
          sentence={plural("a.overview.leadership.unproven", open)}
          lead={t("a.overview.leadership.unprovenLead", {
            proven: m.totals.proven,
            scenarios: m.totals.scenarios,
            weakest: weakest(m, t),
          })}
          aside={go("promises", t("a.parts.openPromises"))}
        />
      );
    case "developer":
      if (m.driftMeasured === false)
        return (
          <Finding
            eyebrow={t("a.overview.hero.finding")}
            mark={<DriftMark share={null} />}
            figure="—"
            sentence={t("a.overview.dev.driftUnmeasured")}
            aside={go("anchor", t("a.overview.dev.viewAnchors"))}
          />
        );
      return m.drift.length === 0 ? (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          mark={<DriftMark share={0} />}
          figure="0"
          tone="ok"
          sentence={t("a.overview.dev.noDrift")}
          lead={t("a.overview.dev.noDriftLead", { count: m.totals.anchoredFiles })}
          aside={go("anchor", t("a.overview.dev.viewAnchors"))}
        />
      ) : (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          mark={
            <DriftMark
              share={
                m.totals.records
                  ? new Set(m.drift.map((d) => d.record)).size / m.totals.records
                  : null
              }
            />
          }
          figure={nf(m.drift.length)}
          tone="warn"
          sentence={plural("a.overview.dev.drifted", m.drift.length)}
          lead={t("a.overview.dev.driftedLead", {
            records: new Set(m.drift.map((d) => d.record)).size,
            date: m.drift
              .map((d) => d.changedAt)
              .sort()
              .reverse()[0],
          })}
          aside={go("drift", t("a.overview.dev.openDrift"))}
        />
      );
    case "test":
      return m.totals.proven === 0 ? (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure="0"
          of={nf(m.totals.scenarios)}
          tone="bad"
          sentence={t("a.overview.test.none")}
          lead={t("a.overview.test.noneLead")}
          aside={go("tests", t("a.overview.test.assignFirst"))}
        />
      ) : (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={nf(open)}
          of={nf(m.totals.scenarios)}
          tone={open ? "warn" : "ok"}
          sentence={plural("a.overview.test.waiting", open)}
          lead={t("a.overview.test.waitingLead", { untested })}
          aside={go("promises", t("a.overview.test.openFirst"))}
        />
      );
    case "author":
      return know.length === 0 ? (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={`${nf(m.totals.records * 5)}`}
          tone="ok"
          sentence={t("a.overview.author.allFilled")}
          lead={t("a.overview.author.allFilledLead", { records: m.totals.records })}
          aside={go("calibration", t("a.overview.calibration"))}
        />
      ) : (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={nf(slots)}
          tone="warn"
          sentence={t("a.overview.author.empty", { slots, records: know.length })}
          lead={t("a.overview.author.emptyLead")}
          aside={go("knowledge", t("a.overview.author.matrix"))}
        />
      );
    case "ownership":
      return m.owners.length === 1 && m.unowned === 0 ? (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure="1"
          tone="plan"
          sentence={t("a.overview.owner.oneTeam", { records: m.totals.records })}
          lead={t("a.overview.owner.oneTeamLead", { team: teamName(m.owners[0].team, teamNames) })}
          aside={go("provenance", t("a.overview.owner.byTeam"))}
        />
      ) : (
        <Finding
          eyebrow={t("a.overview.hero.finding")}
          figure={nf(m.unowned)}
          tone={m.unowned ? "warn" : "ok"}
          sentence={
            m.unowned
              ? plural("a.overview.owner.unowned", m.unowned)
              : t("a.overview.owner.allOwned")
          }
          lead={t("a.overview.owner.lead", {
            teams: m.owners.length,
            records: m.totals.records,
            domains: m.totals.domains,
          })}
          aside={go("provenance", t("a.overview.owner.byTeam"))}
        />
      );
    case "new":
      return (
        <Finding
          eyebrow={t("a.overview.hero.welcome")}
          figure={nf(m.totals.records)}
          sentence={t("a.overview.new.sentence", { project: m.project.name })}
          lead={t("a.overview.new.lead", {
            domains: m.totals.domains,
            categories: m.totals.capabilities,
          })}
          aside={go("product", t("a.overview.new.explore"))}
        />
      );
    case "agent":
      return (
        <Finding
          eyebrow="registry.state"
          figure={m.drift.length ? nf(m.drift.length) : "0"}
          tone={m.drift.length ? "warn" : "ok"}
          sentence={m.drift.length ? t("a.overview.agent.drift") : t("a.overview.agent.clean")}
          lead={t("a.overview.agent.lead", {
            records: m.totals.records,
            anchors: m.totals.anchors,
            scenarios: m.totals.scenarios,
            version: m.project.version,
          })}
        />
      );
  }
}

function teamName(id: string, names?: Record<string, string>) {
  return names?.[id] ?? id;
}

function weakest(m: OverviewModel, t: FacetText["t"]) {
  const d = [...m.domains]
    .filter((x) => x.scenarios)
    .sort((a, b) => a.proven / a.scenarios - b.proven / b.scenarios)[0];
  return d
    ? t("a.overview.weakest", { title: d.title, share: pctText(pct(d.proven, d.scenarios), t) })
    : t("a.overview.noArea");
}

function Kpis({ m, proven }: { m: OverviewModel; proven: number | null }) {
  const { t, plural, number: nf } = useText();
  return (
    <div className="t-a-kpis t-stagger" data-testid="overview-kpis">
      <Stat
        value={nf(m.totals.records)}
        label={plural("a.overview.kpi.records", m.totals.assumptions)}
      />
      <Stat
        value={pctText(proven, t)}
        tone={shareTone(proven) === "plan" ? undefined : shareTone(proven)}
        label={t("a.overview.kpi.proven")}
      />
      {m.driftMeasured === false ? (
        <Stat
          value={<span title={t("a.common.unmeasured")}>—</span>}
          label={t("a.overview.kpi.drift")}
        />
      ) : (
        <Stat
          value={nf(m.drift.length)}
          tone={m.drift.length ? "warn" : "ok"}
          label={t("a.overview.kpi.drift")}
        />
      )}
      <Stat
        value={
          m.totals.files == null ? (
            <span title={t("a.common.unmeasured")}>—</span>
          ) : (
            pctText(pct(m.totals.anchoredFiles, m.totals.files), t)
          )
        }
        label={t("a.overview.kpi.anchored", {
          anchored: m.totals.anchoredFiles,
          files: m.totals.files ?? "—",
        })}
      />
    </div>
  );
}

function LeadershipKpis({ m, proven }: { m: OverviewModel; proven: number | null }) {
  const { t, number: nf } = useText();
  const open = m.totals.scenarios - m.totals.proven;
  const rework = m.domains.filter((d) => d.drift > 0).length;
  return (
    <div className="t-a-kpis t-stagger" data-testid="overview-kpis">
      <Stat
        value={pctText(proven, t)}
        tone={shareTone(proven) === "plan" ? undefined : shareTone(proven)}
        label={t("a.overview.leadership.kpiChecked")}
      />
      <Stat
        value={nf(open)}
        tone={open ? "warn" : "ok"}
        label={t("a.overview.leadership.kpiOpen")}
      />
      <Stat
        value={nf(rework)}
        tone={rework ? "warn" : "ok"}
        label={t("a.overview.leadership.kpiRework", { areas: m.domains.length })}
      />
      <Stat value={nf(m.owners.length)} label={t("a.overview.leadership.kpiTeams")} />
    </div>
  );
}

function featureName(f: Pick<FeatureView, "slug">): string {
  const words = f.slug.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function Unmeasured({ testid }: { testid: string }) {
  const { t } = useText();
  return (
    <p className="t-muted" data-testid={testid}>
      — · {t("a.common.unmeasured")}
    </p>
  );
}

function daysBetween(from: string, to: string): number | null {
  const a = Date.parse(from.slice(0, 10));
  const b = Date.parse(to.slice(0, 10));
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 86_400_000);
}

function NextSteps({ steps, onNavigate }: { steps: Weighted[]; onNavigate?: (t: string) => void }) {
  const { t } = useText();
  return (
    <section className="t-surface t-a-steps" aria-label={t("a.overview.nextStepsList")}>
      <div className="t-a-panel-head">
        <span className="t-h3">{t("a.overview.nextSteps")}</span>
        <span className="t-meta">
          {steps.length
            ? t("a.overview.stepsOpen", { count: steps.length })
            : t("a.overview.nothingOpen")}
        </span>
      </div>
      {steps.length ? (
        <ol className="t-list t-stagger">
          {steps.map((s, i) => (
            <li key={s.key}>
              <ListRow
                lead={<span className="t-a-step-num">{i + 1}</span>}
                title={s.step}
                sub={<Icon name={s.icon} size={12} />}
                trail={<Icon name="chevronRight" size={14} />}
                onClick={() => onNavigate?.(s.target)}
              />
            </li>
          ))}
        </ol>
      ) : (
        <div className="t-a-allclear" data-testid="all-clear">
          <Icon name="check" size={20} className="t-ok" />
          <span>{t("a.overview.allClear")}</span>
        </div>
      )}
    </section>
  );
}

function RoleBody(p: OverviewPageProps) {
  switch (p.reader) {
    case "leadership":
      return <Leadership {...p} />;
    case "developer":
      return <Developer {...p} />;
    case "test":
      return <TestReview {...p} />;
    case "author":
      return <Author {...p} />;
    case "ownership":
      return <Ownership {...p} />;
    case "new":
      return <NewHere {...p} />;
    case "agent":
      return <Agent {...p} />;
  }
}

function DomainRows({
  m,
  onNavigate,
  plain,
}: {
  m: OverviewModel;
  onNavigate?: (t: string) => void;

  plain?: boolean;
}) {
  const { t, plural, number: nf } = useText();
  return (
    <div className="t-a-domrows" role="group" aria-label={t("a.overview.areas")}>
      {[...m.domains]
        .sort(
          (a, b) =>
            (a.scenarios ? a.proven / a.scenarios : 2) - (b.scenarios ? b.proven / b.scenarios : 2),
        )
        .map((d) => {
          const p = pct(d.proven, d.scenarios);
          return (
            <button
              key={d.id}
              type="button"
              className="t-a-domrow"
              onClick={() => onNavigate?.(`${localized.text5}${d.id}`)}
            >
              <Ring value={p} size={44} label={d.title} />
              <span className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                <span className="t-a-domrow__title">
                  {d.title}{" "}
                  <span className="t-meta">
                    {d.cls === "core" ? t("a.common.core") : t("a.common.supporting")}
                  </span>
                </span>
                <span className="t-meta t-wrap">
                  {plain
                    ? plural("a.overview.leadership.areaLine", d.features, {
                        open: d.scenarios - d.proven,
                      })
                    : t("a.overview.domainRowMeta", {
                        records: d.features,
                        categories: d.capabilities.length,
                        open: d.scenarios - d.proven,
                      })}
                </span>
              </span>
              <span className="t-a-domrow__bar">
                <Meter
                  value={d.scenarios ? d.proven / d.scenarios : null}
                  tone={p != null && p >= 95 ? "ok" : "warn"}
                  thin
                  label={t("a.overview.domainProven", { title: d.title })}
                />
              </span>
              <span className="t-a-domrow__drift">
                {d.drift && plain ? (
                  <Badge tone="warn">{t("a.overview.leadership.reworkBadge")}</Badge>
                ) : d.drift ? (
                  <Badge tone="warn">
                    <Icon name="drift" size={12} /> {nf(d.drift)}
                  </Badge>
                ) : (
                  <Badge tone="ok" plain>
                    {t("a.overview.calm")}
                  </Badge>
                )}
              </span>
            </button>
          );
        })}
    </div>
  );
}

function Leadership({ model: m, teamNames, onNavigate, onOpenRecord }: OverviewPageProps) {
  const { t, plural, number: nf } = useText();
  const asOf = m.project.generatedAt;
  const dated = m.features.filter((f) => f.createdAt);
  const thisWeek = dated
    .filter((f) => {
      const d = daysBetween(f.createdAt!, asOf);
      return d != null && d >= 0 && d < 7;
    })
    .sort((a, b) => b.createdAt!.localeCompare(a.createdAt!));
  const movedAreas = m.domains.filter((d) =>
    m.drift.some((x) => {
      const days = daysBetween(x.changedAt, asOf);
      return x.record.startsWith(d.id + "/") && days != null && days >= 0 && days < 7;
    }),
  );
  const weekMeasured = dated.length > 0 && daysBetween(asOf, asOf) != null;
  const risk = m.features
    .filter((f) => f.lifecycle !== "planned" && (f.proven < f.scenarios || f.drift > 0))
    .map((f) => ({
      f,
      weight: f.drift * 2 + (f.scenarios ? (f.scenarios - f.proven) / f.scenarios : 0) * 3,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  const unowned = m.features.filter((f) => !f.owner);
  const questions = m.features.reduce((a, f) => a + f.knowledgeOpen, 0);
  return (
    <>
      <Section
        title={t("a.overview.areas")}
        meta={t("a.overview.leadership.areasMeta", { count: m.domains.length })}
        actions={
          <Button
            size="small"
            variant="quiet"
            icon="product"
            onClick={() => onNavigate?.("product")}
          >
            {t("a.overview.leadership.map")}
          </Button>
        }
      >
        <DomainRows m={m} onNavigate={onNavigate} plain />
      </Section>
      <Section
        title={t("a.overview.leadership.week")}
        meta={
          weekMeasured
            ? t("a.overview.leadership.weekMeta", { date: asOf.slice(0, 10) })
            : undefined
        }
      >
        <div data-testid="overview-leadership-week">
          {!weekMeasured ? (
            <Unmeasured testid="overview-leadership-week-unmeasured" />
          ) : (
            <div className="t-surface t-pad t-stack" style={{ gap: 8 }}>
              <span>{plural("a.overview.leadership.weekNew", thisWeek.length)}</span>
              {thisWeek.length ? (
                <div className="t-a-chips">
                  {thisWeek.slice(0, 12).map((f) => (
                    <Chip key={f.id} onClick={() => onOpenRecord?.(f.id)}>
                      {featureName(f)}
                    </Chip>
                  ))}
                  {thisWeek.length > 12 ? (
                    <span className="t-meta">+{nf(thisWeek.length - 12)}</span>
                  ) : null}
                </div>
              ) : null}
              <span>
                {movedAreas.length
                  ? t("a.overview.leadership.weekMoved", {
                      areas: movedAreas.map((d) => d.title).join(", "),
                    })
                  : t("a.overview.leadership.weekCalm")}
              </span>
            </div>
          )}
        </div>
      </Section>
      <Section title={t("a.overview.leadership.risk")} meta={t("a.overview.leadership.riskMeta")}>
        {risk.length ? (
          <div
            className="t-surface t-a-list"
            role="list"
            aria-label={t("a.overview.leadership.risk")}
            data-testid="overview-leadership-risk"
          >
            {risk.map(({ f }) => (
              <div key={f.id} role="listitem">
                <ListRow
                  title={<span className="t-wrap">{featureName(f)}</span>}
                  sub={[
                    t("a.overview.leadership.riskChecked", {
                      share: pctText(pct(f.proven, f.scenarios), t),
                    }),
                    f.drift ? t("a.overview.leadership.riskMoved") : null,
                    f.owner
                      ? t("a.overview.leadership.riskOwner", { team: teamName(f.owner, teamNames) })
                      : t("a.overview.leadership.riskNoOwner"),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  lead={<Dot tone="warn" />}
                  trail={<Icon name="chevronRight" size={14} />}
                  onClick={() => onOpenRecord?.(f.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="t-muted">{t("a.overview.leadership.noRisk")}</p>
        )}
      </Section>
      <Section
        title={t("a.overview.leadership.owners")}
        meta={t("a.overview.leadership.ownersMeta", { teams: m.owners.length })}
      >
        <div
          className="t-surface t-a-list"
          role="list"
          aria-label={t("a.overview.leadership.owners")}
          data-testid="overview-leadership-owners"
        >
          {m.owners.map((o) => (
            <div key={o.team} role="listitem">
              <ListRow
                lead={
                  <Ring
                    value={pct(o.proven, o.scenarios)}
                    size={32}
                    label={teamName(o.team, teamNames)}
                  />
                }
                title={teamName(o.team, teamNames)}
                sub={t("a.overview.leadership.ownerLine", {
                  features: o.records,
                  share: pctText(pct(o.proven, o.scenarios), t),
                })}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section
        title={t("a.overview.leadership.questions")}
        meta={plural("a.overview.leadership.questionsMeta", unowned.length)}
      >
        <div
          className="t-surface t-pad t-stack"
          style={{ gap: 8 }}
          data-testid="overview-leadership-questions"
        >
          {unowned.length ? (
            <div className="t-a-chips">
              {unowned.slice(0, 12).map((f) => (
                <Chip key={f.id} icon="team" onClick={() => onOpenRecord?.(f.id)}>
                  {featureName(f)}
                </Chip>
              ))}
              {unowned.length > 12 ? (
                <span className="t-meta">+{nf(unowned.length - 12)}</span>
              ) : null}
            </div>
          ) : (
            <span>{t("a.overview.leadership.allOwned")}</span>
          )}
          <span>{plural("a.overview.leadership.questionsOpen", questions)}</span>
        </div>
      </Section>
      <Section title={t("a.overview.leadership.trend")} meta={t("a.overview.leadership.trendMeta")}>
        <div className="t-surface t-pad">
          <TrendChart points={m.trend} label={t("a.overview.leadership.trendLabel")} />
          <div className="t-row t-meta" style={{ gap: 16 }}>
            <span className="t-row" style={{ gap: 6 }}>
              <span className="t-a-key t-a-key--ok" /> {t("a.common.proven")}
            </span>
            <span className="t-row" style={{ gap: 6 }}>
              <span className="t-a-key" /> {t("a.overview.leadership.allPromises")}
            </span>
          </div>
        </div>
      </Section>
    </>
  );
}

function DriftDays({ m }: { m: OverviewModel }) {
  const { t } = useText();
  const by = new Map<string, number>();
  for (const d of m.drift) by.set(d.changedAt, (by.get(d.changedAt) ?? 0) + 1);
  const days = [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const max = Math.max(1, ...days.map((d) => d[1]));
  const W = 600;
  const slot = W / 14;
  return (
    <svg
      className="t-a-chart t-a-chart--bars"
      viewBox={`0 0 ${W} 80`}
      role="img"
      aria-label={t("a.overview.dev.driftByDay")}
    >
      {days.map(([day, n], i) => {
        const h = (n / max) * 52;
        return (
          <g key={day}>
            <rect
              x={i * slot + slot * 0.2}
              y={60 - h}
              width={slot * 0.6}
              height={h}
              rx="3"
              className="t-a-chart__bar"
            />
            <text
              x={i * slot + slot / 2}
              y={56 - h}
              textAnchor="middle"
              className="t-a-chart__tick"
            >
              {n}
            </text>
            <text x={i * slot + slot / 2} y="76" textAnchor="middle" className="t-a-chart__tick">
              {day.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Developer({
  model: m,
  mobile,
  driftPage = 1,
  onDriftPage,
  onOpenRecord,
  onNavigate,
}: OverviewPageProps) {
  const { t } = useText();
  const pages = m.drift.slice((driftPage - 1) * DRIFT_PAGE, driftPage * DRIFT_PAGE);
  const [unprovenPage, setUnprovenPage] = useState(1);
  return (
    <>
      <Section
        title={t("a.overview.drift")}
        meta={
          m.drift.length
            ? t("a.overview.dev.driftMeta", {
                files: m.drift.length,
                records: new Set(m.drift.map((d) => d.record)).size,
              })
            : t("a.overview.none")
        }
        actions={
          m.drift.length ? (
            <Button
              size="small"
              variant="quiet"
              icon="timeline"
              onClick={() => onNavigate?.("drift")}
            >
              {t("a.overview.dev.timeline")}
            </Button>
          ) : undefined
        }
      >
        {m.drift.length ? (
          <>
            <div className="t-surface t-pad">
              <DriftDays m={m} />
            </div>
            <div
              className="t-surface t-a-list"
              role="list"
              aria-label={t("a.overview.kpi.drift")}
              data-testid="drift-list"
            >
              {pages.map((d) => (
                <div key={d.path + d.record} role="listitem" className="t-a-drift">
                  <Icon name="file" size={14} />
                  <span className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="t-mono t-wrap">{d.path}</span>
                    <button
                      type="button"
                      className="t-a-link t-mono"
                      onClick={() => onOpenRecord?.(d.record)}
                    >
                      {d.record}
                    </button>
                  </span>
                  <span className="t-meta">{d.changedAt}</span>
                </div>
              ))}
            </div>
            {m.drift.length > DRIFT_PAGE ? (
              <Pagination
                page={driftPage}
                pageSize={DRIFT_PAGE}
                total={m.drift.length}
                pageSizes={[10, 25, 50]}
                compact={mobile}
                onPage={onDriftPage}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            plain
            icon="check"
            title={t("a.overview.dev.noDriftTitle")}
            body={t("a.overview.dev.noDriftBody")}
          />
        )}
      </Section>
      <Section
        title={t("a.overview.dev.unproven")}
        meta={
          m.driftUnproven
            ? t("a.overview.dev.unprovenMeta", {
                promises: m.driftUnproven.length,
                records: new Set(m.driftUnproven.map((x) => x.record)).size,
              })
            : undefined
        }
      >
        {!m.driftUnproven ? (
          <Unmeasured testid="overview-dev-unproven-unmeasured" />
        ) : m.driftUnproven.length ? (
          <>
            <div
              className="t-surface t-a-list"
              role="list"
              aria-label={t("a.overview.dev.unproven")}
              data-testid="overview-dev-unproven"
            >
              {m.driftUnproven
                .slice((unprovenPage - 1) * DRIFT_PAGE, unprovenPage * DRIFT_PAGE)
                .map((x) => (
                  <div key={x.record + "#" + x.scenario} role="listitem">
                    <ListRow
                      lead={<Dot tone="warn" />}
                      title={<span className="t-wrap">{x.then || x.scenario}</span>}
                      sub={<span className="t-mono t-wrap">{`${x.record} · ${x.scenario}`}</span>}
                      onClick={() => onOpenRecord?.(x.record)}
                    />
                  </div>
                ))}
            </div>
            {m.driftUnproven.length > DRIFT_PAGE ? (
              <Pagination
                page={unprovenPage}
                pageSize={DRIFT_PAGE}
                total={m.driftUnproven.length}
                pageSizes={[DRIFT_PAGE]}
                compact={mobile}
                onPage={setUnprovenPage}
              />
            ) : null}
          </>
        ) : (
          <p className="t-muted">{t("a.overview.dev.unprovenNone")}</p>
        )}
      </Section>
      <Section
        title={t("a.overview.dev.anchoring")}
        meta={t("a.overview.dev.anchoringMeta", {
          anchors: m.totals.anchors,
          files: m.totals.anchoredFiles,
        })}
      >
        <div className="t-surface t-pad t-stack" style={{ gap: 10 }}>
          <Meter
            value={m.totals.files ? m.totals.anchoredFiles / m.totals.files : null}
            tone="signal"
            label={t("a.overview.dev.filesAnchored")}
          />
          <div className="t-row t-row--between t-meta">
            <span>
              {t("a.overview.dev.anchoredSplit", {
                anchored: m.totals.anchoredFiles,
                without: m.totals.files == null ? "—" : m.totals.files - m.totals.anchoredFiles,
              })}
            </span>
            <span
              data-testid="overview-loc"
              title={m.totals.loc == null ? t("a.common.unmeasured") : undefined}
            >
              {t("a.overview.dev.lines", { count: m.totals.loc ?? "—" })}
            </span>
          </div>
        </div>
      </Section>
      <Section title={t("a.overview.recent")} meta={t("a.overview.dev.recentMeta")}>
        <CommitList commits={m.recent} limit={6} onOpenRecord={onOpenRecord} />
      </Section>
    </>
  );
}

function TestReview({ model: m, onOpenRecord, onNavigate }: OverviewPageProps) {
  const { t, number: nf } = useText();
  const untested = m.features.filter((f) => f.lifecycle === "active" && f.tests === 0);
  const undocumented = m.features
    .filter((f) => f.lifecycle === "active" && f.knowledgeOpen > 0)
    .sort((a, b) => b.knowledgeOpen - a.knowledgeOpen);
  const capabilities = m.domains
    .flatMap((d) =>
      d.capabilities.map((c) => {
        const fs = m.features.filter((f) => f.domain === d.id && f.capability === c.id);
        return {
          domain: d,
          capability: c,
          features: fs.length,
          scenarios: fs.reduce((a, f) => a + f.scenarios, 0),
          proven: fs.reduce((a, f) => a + f.proven, 0),
        };
      }),
    )
    .filter((c) => c.features > 0)
    .sort((a, b) => b.scenarios - b.proven - (a.scenarios - a.proven));
  return (
    <>
      <Section
        title={t("a.overview.test.byCapability")}
        meta={t("a.overview.test.byCapabilityMeta")}
      >
        <div
          className="t-surface t-a-list"
          role="list"
          aria-label={t("a.overview.test.byCapability")}
          data-testid="overview-test-capabilities"
        >
          {capabilities.map((c) => (
            <div key={c.domain.id + "/" + c.capability.id} role="listitem">
              <ListRow
                lead={
                  <Ring value={pct(c.proven, c.scenarios)} size={32} label={c.capability.title} />
                }
                title={
                  <span className="t-wrap">{`${c.domain.title} → ${c.capability.title}`}</span>
                }
                sub={t("a.overview.test.capabilityLine", {
                  features: c.features,
                  proven: c.proven,
                  scenarios: c.scenarios,
                })}
                trail={<Icon name="chevronRight" size={14} />}
                onClick={() => onNavigate?.(`${localized.text6}${c.domain.id}/${c.capability.id}`)}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section
        title={t("a.overview.test.deviations")}
        meta={m.deviations ? nf(m.deviations.length) : undefined}
        actions={
          m.deviations?.length ? (
            <Button
              size="small"
              variant="quiet"
              icon="warning"
              onClick={() => onNavigate?.("deviations")}
            >
              {t("a.overview.all")}
            </Button>
          ) : undefined
        }
      >
        {!m.deviations ? (
          <Unmeasured testid="overview-test-deviations-unmeasured" />
        ) : m.deviations.length ? (
          <div
            className="t-surface t-a-list"
            role="list"
            aria-label={t("a.overview.test.deviations")}
            data-testid="overview-test-deviations"
          >
            {m.deviations.slice(0, 6).map((d) => (
              <div key={d.record + "#" + d.scenario} role="listitem">
                <ListRow
                  lead={<Icon name="warning" size={14} className="t-warn" />}
                  title={<span className="t-wrap">{d.then || d.scenario}</span>}
                  sub={
                    <span className="t-wrap">
                      <span className="t-mono">{`${d.record} · ${d.scenario}`}</span>
                      {d.reason ? ` · ${d.reason}` : ""}
                    </span>
                  }
                  onClick={() => onOpenRecord?.(d.record)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="t-muted">{t("a.overview.test.noDeviations")}</p>
        )}
      </Section>
      <Section
        title={t("a.chart.testsByKind")}
        meta={
          m.tests
            ? t("a.overview.test.assigned", {
                count: m.tests.unit + m.tests.integration + m.tests.e2e,
              })
            : t("a.common.unmeasured")
        }
      >
        <div className="t-a-split">
          <div className="t-surface t-pad">
            <Pyramid mix={m.tests} />
          </div>
          <div className="t-surface t-pad t-stack" style={{ gap: 12 }}>
            <span className="t-label">{t("a.overview.test.proofByArea")}</span>
            {m.domains.map((d) => (
              <div key={d.id} className="t-stack" style={{ gap: 4 }}>
                <div className="t-row t-row--between">
                  <span>{d.title}</span>
                  <span className="t-meta">
                    {nf(d.proven)} / {nf(d.scenarios)}
                  </span>
                </div>
                <StackBar
                  label={d.title}
                  parts={[
                    { key: "p", label: t("a.common.proven"), value: d.proven, tone: "var(--t-ok)" },
                    {
                      key: "o",
                      label: t("a.common.open"),
                      value: d.scenarios - d.proven,
                      tone: "var(--t-warn-wash)",
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section
        title={t("a.parts.openPromises")}
        meta={t("a.overview.test.mostFirst")}
        actions={
          <Button
            size="small"
            variant="quiet"
            icon="promise"
            onClick={() => onNavigate?.("promises")}
          >
            {t("a.overview.all")}
          </Button>
        }
      >
        <OpenRecordList features={m.features} limit={6} onOpenRecord={onOpenRecord} />
      </Section>
      <Section title={t("a.overview.test.untestedTitle")} meta={nf(untested.length)}>
        {untested.length ? (
          <div className="t-a-chips">
            {untested.slice(0, 24).map((f) => (
              <Chip key={f.id} mono icon="test" onClick={() => onOpenRecord?.(f.id)}>
                {f.id}
              </Chip>
            ))}
            {untested.length > 24 ? (
              <span className="t-meta">+{nf(untested.length - 24)}</span>
            ) : null}
          </div>
        ) : (
          <p className="t-muted">{t("a.overview.test.allTested")}</p>
        )}
      </Section>
      <Section
        title={t("a.overview.test.undocumented")}
        meta={nf(undocumented.length)}
        actions={
          undocumented.length ? (
            <Button
              size="small"
              variant="quiet"
              icon="knowledge"
              onClick={() => onNavigate?.("knowledge")}
            >
              {t("a.overview.all")}
            </Button>
          ) : undefined
        }
      >
        {undocumented.length ? (
          <div className="t-a-chips" data-testid="overview-test-undocumented">
            {undocumented.slice(0, 24).map((f) => (
              <Chip
                key={f.id}
                mono
                icon="knowledge"
                count={f.knowledgeOpen}
                onClick={() => onOpenRecord?.(f.id)}
              >
                {f.id}
              </Chip>
            ))}
            {undocumented.length > 24 ? (
              <span className="t-meta">+{nf(undocumented.length - 24)}</span>
            ) : null}
          </div>
        ) : (
          <p className="t-muted">{t("a.overview.test.allDocumented")}</p>
        )}
      </Section>
    </>
  );
}

function missingFields(f: FeatureView): boolean[] {
  const knowledge = KNOWLEDGE_SLOTS.map((_, i) =>
    f.knowledgeSlots ? !f.knowledgeSlots[i] : i >= 5 - f.knowledgeOpen,
  );
  return [!f.summary.trim(), f.scenarios === 0, !f.owner, ...knowledge];
}

const AUTHOR_PAGE = 12;

function Author({ model: m, mobile, onOpenRecord }: OverviewPageProps) {
  const { t } = useText();
  const [page, setPage] = useState(1);
  const slotNames = KNOWLEDGE_SLOTS.map((s) => t(`a.knowledge.${s}`));
  const columns = [
    t("a.overview.author.fieldIntent"),
    t("a.overview.author.fieldScenarios"),
    t("a.overview.author.fieldOwner"),
    ...slotNames,
  ];
  const all = m.features
    .map((f) => {
      const missing = missingFields(f);
      return { f, missing, count: missing.filter(Boolean).length };
    })
    .sort((a, b) => b.count - a.count || a.f.id.localeCompare(b.f.id));
  const incomplete = all.filter((r) => r.count > 0).length;
  const rows = all.slice((page - 1) * AUTHOR_PAGE, page * AUTHOR_PAGE);
  const scen = m.calibration.find((c) => c.key === "scenarios per record");
  const outliers = scen
    ? m.features
        .filter((f) => f.scenarios > scen.high || f.scenarios < scen.low)
        .sort((a, b) => b.scenarios - a.scenarios)
        .slice(0, 8)
    : [];
  return (
    <>
      <Section
        title={t("a.overview.author.fields")}
        meta={t("a.overview.author.fieldsMeta", { incomplete, records: all.length })}
      >
        {incomplete ? (
          <>
            <div
              className="t-surface t-a-know t-a-fields"
              role="table"
              aria-label={t("a.overview.author.openSlots")}
              data-overview-fit=""
              data-testid="author-knowledge"
            >
              <div role="row" className="t-a-know__row t-a-know__head">
                <span role="columnheader">Record</span>
                {columns.map((s, i) => (
                  <span
                    role="columnheader"
                    key={s}
                    className={i >= 3 ? "t-hide-mobile" : undefined}
                  >
                    {s}
                  </span>
                ))}
                <span role="columnheader">{t("a.overview.author.missing")}</span>
              </div>
              {rows.map(({ f, missing, count }) => (
                <div role="row" key={f.id} className="t-a-know__row">
                  <span role="cell">
                    <button
                      type="button"
                      className="t-a-link t-mono t-a-know__id"
                      onClick={() => onOpenRecord?.(f.id)}
                    >
                      {f.id}
                    </button>
                  </span>
                  {columns.map((s, i) => (
                    <span role="cell" key={s} className={i >= 3 ? "t-hide-mobile" : undefined}>
                      <i
                        className="t-a-slot"
                        data-open={missing[i] || undefined}
                        aria-label={t(
                          missing[i]
                            ? "a.overview.author.slotOpen"
                            : "a.overview.author.slotFilled",
                          { slot: s },
                        )}
                      />
                    </span>
                  ))}
                  <span role="cell" className={count ? "t-num t-warn" : "t-num"}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
            {all.length > AUTHOR_PAGE ? (
              <Pagination
                page={page}
                pageSize={AUTHOR_PAGE}
                total={all.length}
                pageSizes={[AUTHOR_PAGE]}
                compact={mobile}
                onPage={setPage}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            plain
            icon="knowledge"
            title={t("a.overview.author.allSlotsFilled")}
            body={t("a.overview.author.allSlotsBody", { count: m.totals.records })}
          />
        )}
      </Section>
      <Section
        title={t("a.overview.author.outside")}
        meta={
          scen ? t("a.overview.author.outsideMeta", { low: scen.low, high: scen.high }) : undefined
        }
      >
        {scen ? <BandChart m={scen} /> : null}
        <div className="t-a-chips">
          {outliers.map((f) => (
            <Chip key={f.id} mono count={f.scenarios} onClick={() => onOpenRecord?.(f.id)}>
              {f.slug}
            </Chip>
          ))}
        </div>
      </Section>
    </>
  );
}

function Ownership({ model: m, teamNames, mobile, onNavigate, onOpenRecord }: OverviewPageProps) {
  const { t, plural, number: nf } = useText();
  const teams = m.owners.map((o) => o.team);
  const [fixPage, setFixPage] = useState(1);
  const reach = (m.reach ?? []).filter((r) => r.dependents > 0).slice(0, 6);
  const maxReach = Math.max(1, ...reach.map((r) => r.dependents));
  return (
    <>
      <Section
        title="teams"
        meta={t("a.overview.owner.teamsMeta", { teams: m.owners.length, unowned: m.unowned })}
      >
        <div className="t-a-teams t-stagger">
          {m.owners.map((o) => {
            const p = pct(o.proven, o.scenarios);
            return (
              <div key={o.team} className="t-surface t-pad t-a-team">
                <Ring value={p} size={56} label={teamName(o.team, teamNames)} />
                <span className="t-stack" style={{ gap: 2 }}>
                  <span className="t-h3">{teamName(o.team, teamNames)}</span>
                  <span className="t-meta">
                    {t("a.overview.owner.teamLine", { records: o.records, scenarios: o.scenarios })}
                  </span>
                </span>
              </div>
            );
          })}
          {m.unowned ? (
            <button
              type="button"
              className="t-surface t-pad t-a-team t-a-team--none t-interactive"
              onClick={() => onNavigate?.("records?owner=none")}
            >
              <Icon name="warning" size={22} className="t-warn" />
              <span className="t-stack" style={{ gap: 2 }}>
                <span className="t-h3">{t("a.overview.owner.none")}</span>
                <span className="t-meta">{plural("a.common.records", m.unowned)}</span>
              </span>
            </button>
          ) : null}
        </div>
      </Section>
      <Section title={t("a.overview.owner.matrix")} meta="records">
        <div
          className="t-surface t-a-matrix"
          role="table"
          aria-label={t("a.overview.owner.matrixLabel")}
        >
          <div
            role="row"
            className="t-a-matrix__row"
            style={{ gridTemplateColumns: `minmax(120px,1fr) repeat(${teams.length + 1}, 104px)` }}
          >
            <span role="columnheader" />
            {teams.map((team) => (
              <span role="columnheader" key={team} className="t-meta">
                {teamName(team, teamNames)}
              </span>
            ))}
            <span role="columnheader" className="t-meta">
              {t("a.overview.owner.noTeam")}
            </span>
          </div>
          {m.domains.map((d) => (
            <div
              role="row"
              key={d.id}
              className="t-a-matrix__row"
              style={{
                gridTemplateColumns: `minmax(120px,1fr) repeat(${teams.length + 1}, 104px)`,
              }}
            >
              <span role="rowheader">{d.title}</span>
              {[...teams, null].map((team) => {
                const n = m.features.filter((f) => f.domain === d.id && f.owner === team).length;
                return (
                  <span
                    role="cell"
                    key={String(team)}
                    className="t-a-matrix__cell"
                    data-zero={n === 0 || undefined}
                    style={{ ["--t-a-heat" as string]: `${Math.min(80, n * 2)}%` }}
                  >
                    {n || "·"}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </Section>
      <Section title={t("a.overview.owner.reach")} meta={t("a.overview.owner.reachMeta")}>
        {!m.reach ? (
          <Unmeasured testid="overview-owner-reach-unmeasured" />
        ) : reach.length ? (
          <div
            className="t-surface t-a-list"
            role="list"
            aria-label={t("a.overview.owner.reach")}
            data-testid="overview-owner-reach"
          >
            {reach.map((r) => (
              <div key={r.record} role="listitem">
                <ListRow
                  title={<span className="t-mono t-wrap">{r.record}</span>}
                  sub={
                    <span className="t-stack" style={{ gap: 4 }}>
                      <span>
                        {plural("a.overview.owner.reachLine", r.dependents)} ·{" "}
                        {r.team ? teamName(r.team, teamNames) : t("a.overview.owner.none")}
                      </span>
                      <Meter
                        value={r.dependents / maxReach}
                        tone="signal"
                        thin
                        label={plural("a.overview.owner.reachLine", r.dependents)}
                      />
                    </span>
                  }
                  onClick={() => onOpenRecord?.(r.record)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="t-muted">{t("a.overview.owner.noReach")}</p>
        )}
      </Section>
      <Section title={t("a.overview.owner.fixes")} meta={m.fixes ? nf(m.fixes.length) : undefined}>
        {!m.fixes ? (
          <Unmeasured testid="overview-owner-fixes-unmeasured" />
        ) : m.fixes.length ? (
          <>
            <ol
              className="t-surface t-a-list"
              aria-label={t("a.overview.owner.fixes")}
              data-testid="overview-owner-fixes"
            >
              {m.fixes.slice((fixPage - 1) * 6, fixPage * 6).map((x, i) => (
                <li key={x.record + x.date + i}>
                  <ListRow
                    lead={<Icon name="check" size={14} className="t-ok" />}
                    title={<span className="t-wrap">{x.subject || "—"}</span>}
                    sub={<span className="t-mono t-wrap">{`${x.date} · ${x.record}`}</span>}
                    onClick={() => onOpenRecord?.(x.record)}
                  />
                </li>
              ))}
            </ol>
            {m.fixes.length > 6 ? (
              <Pagination
                page={fixPage}
                pageSize={6}
                total={m.fixes.length}
                pageSizes={[6]}
                compact={mobile}
                onPage={setFixPage}
              />
            ) : null}
          </>
        ) : (
          <p className="t-muted">{t("a.overview.owner.noFixes")}</p>
        )}
      </Section>
    </>
  );
}

const STARTER_QUESTIONS: TextKey[] = [
  "a.overview.new.q1",
  "a.overview.new.q2",
  "a.overview.new.q3",
  "a.overview.new.q4",
];

function NewHere({ model: m, mobile, onNavigate, onAsk, onOpenRecord }: OverviewPageProps) {
  const { t, number: nf } = useText();
  const [faqPage, setFaqPage] = useState(1);

  const terms: [string, string][] = [
    ["Record", t("a.overview.term.recordDef")],
    [t("a.overview.term.promise"), t("a.overview.term.promiseDef")],
    [t("a.overview.term.anchor"), t("a.overview.term.anchorDef")],
    [t("a.overview.drift"), t("a.overview.term.driftDef")],
  ];
  return (
    <>
      <Section
        title={t("a.overview.new.built")}
        meta={t("a.overview.new.builtMeta", {
          domains: m.totals.domains,
          categories: m.totals.capabilities,
        })}
      >
        <div className="t-a-tour t-stagger">
          {m.domains.map((d) => (
            <button
              key={d.id}
              type="button"
              className="t-surface t-pad t-a-tour__card t-interactive"
              onClick={() => onNavigate?.(`${localized.text8}${d.id}`)}
            >
              <span className="t-row t-row--between">
                <span className="t-h3">{d.title}</span>
                <span className="t-meta">{nf(d.features)}</span>
              </span>
              <span className="t-muted t-clamp-2">{d.purpose}</span>
              <span className="t-row t-row--wrap" style={{ gap: 4 }}>
                {d.capabilities.map((c) => (
                  <Badge key={c.id} plain>
                    {c.title}
                  </Badge>
                ))}
              </span>
            </button>
          ))}
        </div>
      </Section>
      <Section
        title={t("a.overview.new.faq")}
        meta={m.faq ? t("a.overview.new.faqMeta", { count: m.faq.length }) : undefined}
      >
        {!m.faq ? (
          <Unmeasured testid="overview-new-faq-unmeasured" />
        ) : m.faq.length ? (
          <>
            <dl className="t-a-terms" data-testid="overview-new-faq">
              {m.faq.slice((faqPage - 1) * 5, faqPage * 5).map((q, i) => (
                <div key={q.record + q.slot + i}>
                  <dt className="t-wrap">{q.question || t(`a.knowledge.${q.slot}` as TextKey)}</dt>
                  <dd>
                    {q.answer}{" "}
                    <button
                      type="button"
                      className="t-a-link t-mono t-wrap"
                      onClick={() => onOpenRecord?.(q.record)}
                    >
                      {q.record}
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
            {m.faq.length > 5 ? (
              <Pagination
                page={faqPage}
                pageSize={5}
                total={m.faq.length}
                pageSizes={[5]}
                compact={mobile}
                onPage={setFaqPage}
              />
            ) : null}
          </>
        ) : (
          <p className="t-muted">{t("a.overview.new.noFaq")}</p>
        )}
      </Section>
      <Section
        title={t("a.overview.new.fourWords")}
        actions={
          <Button size="small" variant="quiet" icon="book" onClick={() => onNavigate?.("glossary")}>
            {t("a.overview.new.glossary")}
          </Button>
        }
      >
        <dl className="t-a-terms">
          {terms.map(([term, d]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title={t("a.overview.new.ask")} meta={t("a.overview.new.askMeta")}>
        <div className="t-a-chips">
          {STARTER_QUESTIONS.map((key) => (
            <Chip key={key} icon="chat" onClick={() => onAsk?.(t(key))}>
              {t(key)}
            </Chip>
          ))}
        </div>
      </Section>
    </>
  );
}

function Agent({ model: m, onCopy }: OverviewPageProps) {
  const { t, number: nf } = useText();

  const measured = (v: string) => (v === "—" || v === "" ? null : v);
  const state = {
    branch: measured(m.project.branch),
    commit: measured(m.project.commit),
    records: m.totals.records,
    scenarios: { total: m.totals.scenarios, proven: m.totals.proven },
    drift: m.drift.slice(0, 3).map((d) => ({ record: d.record, path: d.path })),
    driftCount: m.drift.length,
    untested: m.features.filter((f) => f.lifecycle === "active" && f.tests === 0).length,
    anchors: m.totals.anchors,
    files: m.totals.files,
    loc: m.totals.loc,
    tests: m.tests,
    knowledgeOpen: m.features.reduce((a, f) => a + f.knowledgeOpen, 0),
    deviations: m.deviations ? m.deviations.length : null,
  };
  const json = JSON.stringify(state, null, 2);
  const checks: [string, boolean, string][] = [
    ["Schema", true, t("a.overview.agent.schemaOk")],
    [t("a.overview.term.anchor"), true, t("a.overview.agent.anchorsOk")],
    [
      t("a.overview.drift"),
      m.drift.length === 0,
      m.drift.length
        ? t("a.overview.agent.driftFix", { count: m.drift.length })
        : t("a.overview.none"),
    ],
    ["proves:", true, t("a.overview.agent.provesNote")],
  ];
  return (
    <>
      <Section title={t("a.overview.agent.beforeCommit")} meta="commit-gate">
        <ul className="t-surface t-a-checks" aria-label={t("a.overview.agent.checks")}>
          {checks.map(([k, ok, d]) => (
            <li key={k}>
              <Icon name={ok ? "check" : "warning"} size={16} className={ok ? "t-ok" : "t-warn"} />
              <span className="t-mono">{k}</span>
              <span className="t-muted">{d}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t("a.overview.agent.tools")} meta={t("a.overview.agent.toolsMeta")}>
        <div className="t-surface t-a-list" role="list" aria-label={t("a.overview.agent.tools")}>
          {m.tools.map((tool) => (
            <div key={tool.name} role="listitem" className="t-a-tool">
              <Icon name="plug" size={14} />
              <span className="t-mono">{tool.name}</span>
              <span className="t-muted t-wrap">{tool.purpose}</span>
              <span
                className="t-meta"
                title={tool.calls == null ? t("a.common.unmeasured") : undefined}
              >
                {tool.calls == null ? "—" : nf(tool.calls)}
              </span>
            </div>
          ))}
        </div>
      </Section>
      <Section title={t("a.overview.agent.endpoints")} meta={t("a.overview.agent.endpointsMeta")}>
        {!m.endpoints ? (
          <Unmeasured testid="overview-agent-endpoints-unmeasured" />
        ) : (
          <div
            className="t-surface t-a-list"
            role="list"
            aria-label={t("a.overview.agent.endpoints")}
            data-testid="overview-agent-endpoints"
          >
            {m.endpoints.map((e) => (
              <div key={e.method + e.path} role="listitem" className="t-a-tool">
                <Icon name="link" size={14} />
                <span className="t-mono t-wrap">{`${e.method} ${e.path}`}</span>
                <span className="t-muted t-wrap">{e.purpose}</span>
                <span />
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section
        title={t("a.overview.agent.state")}
        meta="registry_validate · JSON"
        actions={
          <Button size="small" variant="quiet" icon="copy" onClick={() => onCopy?.(json)}>
            {t("a.common.copy")}
          </Button>
        }
      >
        <pre className="t-sunken t-a-json" data-testid="agent-json">
          {json}
        </pre>
      </Section>
    </>
  );
}

function SidePanel({ reader: role, model: m, onOpenRecord, onNavigate }: OverviewPageProps) {
  const { t, plural } = useText();
  let body: ReactNode;
  if (role === "leadership" || role === "new") {
    body = (
      <>
        <span className="t-label">{t("a.overview.side.decisions")}</span>
        {m.adrs.slice(0, 4).map((a) => (
          <ListRow
            key={a.file}
            lead={<Icon name="decision" size={14} />}
            title={a.title}
            sub={`${a.status} · ${a.date} · ${plural(
              role === "leadership" ? "a.overview.leadership.features" : "a.common.records",
              a.refs.length,
            )}`}
            onClick={() => onNavigate?.(`adr/${a.file}`)}
          />
        ))}
      </>
    );
  } else if (role === "test" || role === "author") {
    body = (
      <>
        <span className="t-label">{t("a.overview.calibration")}</span>
        {m.calibration.slice(1, 3).map((c) => (
          <BandChart key={c.key} m={c} />
        ))}
      </>
    );
  } else {
    body = (
      <>
        <span className="t-label">{t("a.overview.recent")}</span>
        <CommitList commits={m.recent} limit={4} onOpenRecord={onOpenRecord} />
      </>
    );
  }
  return <div className="t-surface t-pad t-stack t-a-sidepanel">{body}</div>;
}

function OverviewSkeleton({ roleName }: { roleName: string }) {
  const { t } = useText();
  return (
    <div className="t-page t-a-overview" aria-busy="true" data-testid="overview-loading">
      <div className="t-a-overview__meta t-meta">
        <span className="t-eyebrow">{t("a.overview.eyebrow", { role: roleName })}</span>
        <span>—</span>
      </div>
      <div className="t-a-overview__grid">
        <div className="t-a-overview__main t-stack" style={{ gap: 18 }}>
          <span className="t-hero-number t-muted">—</span>
          <Skeleton width="62%" height={36} />
          <Skeleton width="44%" height={16} />
          <div className="t-a-kpis">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="t-stack" style={{ gap: 6 }}>
                <span className="t-stat__value t-muted">—</span>
                <Skeleton width="70%" height={10} />
              </div>
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="t-row" style={{ gap: 14 }}>
              <Skeleton width={44} height={44} radius={22} />
              <div className="t-stack" style={{ gap: 6, flex: 1 }}>
                <Skeleton width={`${40 + i * 9}%`} height={12} />
                <Skeleton width="30%" height={10} />
              </div>
            </div>
          ))}
        </div>
        <div className="t-a-overview__side t-stack" style={{ gap: 10 }}>
          <Skeleton height={220} radius={12} />
          <Skeleton height={160} radius={12} />
        </div>
      </div>
    </div>
  );
}

function OverviewEmpty({
  roleName,
  onNavigate,
  onCopy,
}: {
  roleName: string;
  onNavigate?: (t: string) => void;
  onCopy?: (t: string) => void;
}) {
  const { t } = useText();
  const unmeasured = t("a.common.unmeasured");
  return (
    <div className="t-page t-a-overview" data-testid="overview-empty">
      <div className="t-a-overview__meta t-meta">
        <span className="t-eyebrow">{t("a.overview.eyebrow", { role: roleName })}</span>
      </div>
      <EmptyState
        icon="records"
        title={t("a.overview.empty.title")}
        body={t("a.overview.empty.body")}
        action={
          <>
            <Button variant="primary" icon="plus" onClick={() => onNavigate?.("records/new")}>
              {t("a.overview.empty.write")}
            </Button>
            <Button icon="copy" onClick={() => onCopy?.("facet init")}>
              {t("a.overview.empty.copyInit")}
            </Button>
          </>
        }
      />
      <div className="t-a-kpis t-a-kpis--empty">
        <Stat value="0" label="records" />
        <Stat value="—" label={`${t("a.overview.kpi.proven")} · ${unmeasured}`} />
        <Stat value="—" label={`${t("a.overview.kpi.drift")} · ${unmeasured}`} />
        <Stat value="—" label={`${t("a.overview.dev.filesAnchored")} · ${unmeasured}`} />
      </div>
    </div>
  );
}
