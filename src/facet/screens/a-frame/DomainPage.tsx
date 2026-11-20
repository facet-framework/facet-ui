import { useText } from "../../i18n/TextProvider";
import { Icon } from "../../primitives/Icon";
import { Badge, Button } from "../../primitives/controls";
import { EmptyState, Finding, ListRow, Meter, Section, Stat } from "../../primitives/display";
import { Mosaic, Ring, pct, pctText, shareTone } from "./charts";
import type { AdrView, CommitView, DomainView, DriftView, FeatureView } from "./model";
import { CommitList, OpenRecordList, PathBar } from "./parts";

export type DomainLinkView = { domain: string; title: string; count: number; examples: string[] };

export type DomainPageProps = {
  domain: DomainView;

  domains: DomainView[];
  features: FeatureView[];
  links: { incoming: DomainLinkView[]; outgoing: DomainLinkView[] };
  drift: DriftView[];
  adrs: AdrView[];

  recent: CommitView[] | null;
  teamName?: string;
  mobile?: boolean;
  crumbOpen?: string | null;
  onToggleCrumb?: (key: string) => void;

  crumbQuery?: string;
  onCrumbQuery?: (query: string) => void;

  onCloseCrumb?: () => void;
  onNavigate?: (target: string) => void;
  onOpenDomain?: (id: string) => void;
  onOpenCapability?: (capability: string) => void;
  onOpenRecord?: (id: string) => void;
  onNewRecord?: (capability?: string) => void;
};

export function DomainPage(p: DomainPageProps) {
  const { domain: d, features: fs } = p;
  const { t, plural, number: nf } = useText();
  const scen = fs.reduce((a, f) => a + f.scenarios, 0);
  const proven = fs.reduce((a, f) => a + f.proven, 0);
  const share = pct(proven, scen);
  const anchors = fs.reduce((a, f) => a + f.anchors, 0);
  const know = fs.reduce((a, f) => a + f.knowledgeOpen, 0);
  const empty = fs.length === 0;

  return (
    <div className="t-page t-a-over" data-testid="domain">
      <PathBar
        mobile={p.mobile}
        openKey={p.crumbOpen}
        onToggleSiblings={p.onToggleCrumb}
        query={p.crumbQuery}
        onQuery={p.onCrumbQuery}
        onClose={p.onCloseCrumb}
        crumbs={[
          {
            key: "product",
            label: t("a.common.product"),
            onClick: () => p.onNavigate?.("product"),
          },
          {
            key: d.id,
            label: d.id,
            mono: true,
            siblings: p.domains.map((s) => ({
              key: s.id,
              label: s.title,
              sub: s.id,
              icon: "product",
              current: s.id === d.id,
              onSelect: () => p.onOpenDomain?.(s.id),
            })),
          },
        ]}
      />
      <div className="t-a-over__head">
        <Finding
          eyebrow={t("a.domain.eyebrow", {
            cls: d.cls === "core" ? t("a.common.core") : t("a.common.supporting"),
            team: p.teamName ?? d.team,
          })}
          figure={empty ? "—" : pctText(share, t)}
          tone={empty ? undefined : shareTone(share)}
          sentence={d.title}
          lead={d.purpose}
          aside={
            <span className="t-meta">
              {empty
                ? t("a.domain.nothingToProve")
                : t("a.domain.carryTest", { proven, scenarios: scen })}
            </span>
          }
        />
        <div className="t-a-over__stats t-stagger">
          <Stat value={nf(fs.length)} label="Records" />
          <Stat value={nf(d.capabilities.length)} label={t("a.common.categories")} />
          <Stat
            value={empty ? "—" : `${nf(proven)} / ${nf(scen)}`}
            label={empty ? t("a.common.scenariosUnmeasured") : t("a.overview.kpi.proven")}
          />
          <Stat value={nf(anchors)} label={t("a.common.anchors")} />
          <Stat
            value={nf(p.drift.length)}
            tone={p.drift.length ? "warn" : "ok"}
            label={t("a.overview.kpi.drift")}
          />
          <Stat
            value={nf(know)}
            tone={know ? "warn" : undefined}
            label={t("a.common.openKnowledge")}
          />
        </div>
      </div>

      {empty ? (
        <EmptyState
          icon="records"
          title={t("a.domain.emptyTitle", { title: d.title })}
          body={t("a.domain.emptyBody", { count: d.capabilities.length })}
          action={
            <Button variant="primary" icon="plus" onClick={() => p.onNewRecord?.()}>
              {t("a.domain.createFirst")}
            </Button>
          }
        />
      ) : null}

      <div className="t-a-over__grid">
        <div className="t-a-over__main">
          <Section
            title={t("a.common.categories")}
            meta={t("a.domain.categoriesMeta", { count: d.capabilities.length })}
          >
            <div className="t-a-tiles t-stagger" role="group" aria-label={t("a.common.categories")}>
              {d.capabilities.map((c) => {
                const cf = fs.filter((f) => f.capability === c.id);
                const cs = cf.reduce((a, f) => a + f.scenarios, 0);
                const cp = cf.reduce((a, f) => a + f.proven, 0);
                const drift = cf.reduce((a, f) => a + f.drift, 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="t-surface t-a-tile t-interactive"
                    data-empty={cf.length === 0 || undefined}
                    data-testid={`cap-${c.id}`}
                    onClick={() => p.onOpenCapability?.(c.id)}
                  >
                    <span className="t-row t-row--between" style={{ alignItems: "flex-start" }}>
                      <span className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                        <span className="t-h3">{c.title}</span>
                        <span className="t-meta">{c.id}</span>
                      </span>
                      <Ring value={pct(cp, cs)} size={48} label={c.title} />
                    </span>
                    <span className="t-muted t-clamp-2 t-a-tile__purpose">{c.purpose}</span>
                    {cf.length ? (
                      <>
                        <Mosaic
                          cells={cf.map((f) => f.proven === f.scenarios && f.scenarios > 0)}
                          label={t("a.domain.fullyProven", { title: c.title })}
                          size={8}
                        />
                        <span className="t-row t-meta" style={{ gap: 10 }}>
                          <span>{plural("a.common.records", cf.length)}</span>
                          <span>{t("a.overview.stepsOpen", { count: cs - cp })}</span>
                          {drift ? (
                            <span className="t-warn">
                              <Icon name="drift" size={12} /> {nf(drift)}
                            </span>
                          ) : null}
                        </span>
                      </>
                    ) : (
                      <span className="t-meta">{t("a.domain.noRecordYet")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {!empty ? (
            <Section title={t("a.domain.deps")} meta={t("a.domain.depsMeta")}>
              <DependencyFlow domain={d} links={p.links} onOpenDomain={p.onOpenDomain} />
            </Section>
          ) : null}

          {!empty ? (
            <Section
              title={t("a.parts.openPromises")}
              meta={t("a.domain.withoutProof", { count: scen - proven })}
            >
              <OpenRecordList features={fs} limit={6} onOpenRecord={p.onOpenRecord} />
            </Section>
          ) : null}
        </div>

        <aside className="t-a-over__side" aria-label={t("a.domain.side")}>
          <section
            className="t-surface t-pad t-stack"
            style={{ gap: 8 }}
            aria-label={t("a.domain.driftHere")}
          >
            <div className="t-a-panel-head">
              <span className="t-h3">{t("a.overview.drift")}</span>
              <span className="t-meta">{nf(p.drift.length)}</span>
            </div>
            {p.drift.length ? (
              p.drift.slice(0, 8).map((x) => (
                <div key={x.path + x.record} className="t-a-drift">
                  <Icon name="file" size={14} />
                  <span className="t-stack" style={{ gap: 2, minWidth: 0 }}>
                    <span className="t-mono t-wrap">{x.path}</span>
                    <button
                      type="button"
                      className="t-a-link t-mono t-wrap"
                      onClick={() => p.onOpenRecord?.(x.record)}
                    >
                      {x.record.split("/").slice(1).join("/")}
                    </button>
                  </span>
                  <span className="t-meta">{x.changedAt.slice(5)}</span>
                </div>
              ))
            ) : (
              <p className="t-a-calm" data-testid="no-drift">
                <Icon name="check" size={16} className="t-ok" /> {t("a.domain.noDrift")}
              </p>
            )}
          </section>
          <section
            className="t-surface t-pad t-stack"
            style={{ gap: 4 }}
            aria-label={t("a.common.decisions")}
          >
            <div className="t-a-panel-head">
              <span className="t-h3">{t("a.common.decisions")}</span>
              <span className="t-meta">{nf(p.adrs.length)}</span>
            </div>
            {p.adrs.length ? (
              p.adrs.map((a) => (
                <ListRow
                  key={a.file}
                  lead={<Icon name="decision" size={14} />}
                  title={a.title}
                  sub={t("a.domain.adrLine", {
                    status: a.status,
                    date: a.date,
                    count: a.refs.filter((r) => r.startsWith(d.id + "/")).length,
                  })}
                  onClick={() => p.onNavigate?.(`adr/${a.file}`)}
                />
              ))
            ) : (
              <p className="t-muted">{t("a.domain.noAdr")}</p>
            )}
          </section>
          <section
            className="t-surface t-pad t-stack"
            style={{ gap: 8 }}
            aria-label={t("a.overview.recent")}
          >
            <div className="t-a-panel-head">
              <span className="t-h3">{t("a.overview.recent")}</span>
            </div>
            <CommitList commits={p.recent} limit={5} onOpenRecord={p.onOpenRecord} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function DependencyFlow({
  domain,
  links,
  onOpenDomain,
}: {
  domain: DomainView;
  links: DomainPageProps["links"];
  onOpenDomain?: (id: string) => void;
}) {
  const { t } = useText();
  const W = 640;
  const rowH = 34;
  const n = Math.max(links.incoming.length, links.outgoing.length, 1);
  const H = n * rowH + 16;
  const max = Math.max(
    1,
    ...links.incoming.map((l) => l.count),
    ...links.outgoing.map((l) => l.count),
  );
  const cy = H / 2;
  const y = (i: number, len: number) => cy - ((len - 1) * rowH) / 2 + i * rowH;
  const stroke = (c: number) => 1.5 + (c / max) * 7;
  if (!links.incoming.length && !links.outgoing.length) {
    return <p className="t-muted">{t("a.domain.noLinks")}</p>;
  }
  return (
    <div className="t-surface t-pad t-a-flow">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="t-a-flow__svg"
        role="img"
        aria-label={t("a.domain.flowLabel", { title: domain.title })}
      >
        {links.incoming.map((l, i) => (
          <path
            key={"i" + l.domain}
            d={`M150,${y(i, links.incoming.length)} C230,${y(i, links.incoming.length)} 230,${cy} 262,${cy}`}
            className="t-a-flow__edge t-a-flow__edge--in"
            style={{ strokeWidth: stroke(l.count) }}
          />
        ))}
        {links.outgoing.map((l, i) => (
          <path
            key={"o" + l.domain}
            d={`M378,${cy} C410,${cy} 410,${y(i, links.outgoing.length)} 490,${y(i, links.outgoing.length)}`}
            className="t-a-flow__edge"
            style={{ strokeWidth: stroke(l.count) }}
          />
        ))}
        <rect x="262" y={cy - 18} width="116" height="36" rx="10" className="t-a-flow__self" />
        <text x="320" y={cy + 5} textAnchor="middle" className="t-a-flow__self-label">
          {domain.title}
        </text>
        {links.incoming.map((l, i) => (
          <text
            key={"it" + l.domain}
            x="144"
            y={y(i, links.incoming.length) + 4}
            textAnchor="end"
            className="t-a-flow__label"
          >
            {l.title} · {l.count}
          </text>
        ))}
        {links.outgoing.map((l, i) => (
          <text
            key={"ot" + l.domain}
            x="496"
            y={y(i, links.outgoing.length) + 4}
            className="t-a-flow__label"
          >
            {l.title} · {l.count}
          </text>
        ))}
      </svg>
      <div className="t-a-flow__cols">
        <div className="t-stack" style={{ gap: 4 }}>
          <span className="t-label">
            {t("a.domain.usedBy", { count: links.incoming.reduce((a, l) => a + l.count, 0) })}
          </span>
          {links.incoming.map((l) => (
            <button
              key={l.domain}
              type="button"
              className="t-a-flow__row"
              onClick={() => onOpenDomain?.(l.domain)}
            >
              <Badge plain>{l.title}</Badge>
              <span className="t-meta t-ellipsis">{l.examples[0]}</span>
              <Meter
                value={l.count / max}
                thin
                tone="signal"
                label={t("a.domain.incoming", { title: l.title })}
              />
            </button>
          ))}
        </div>
        <div className="t-stack" style={{ gap: 4 }}>
          <span className="t-label">
            {t("a.domain.needs", { count: links.outgoing.reduce((a, l) => a + l.count, 0) })}
          </span>
          {links.outgoing.map((l) => (
            <button
              key={l.domain}
              type="button"
              className="t-a-flow__row"
              onClick={() => onOpenDomain?.(l.domain)}
            >
              <Badge plain>{l.title}</Badge>
              <span className="t-meta t-ellipsis">{l.examples[0]}</span>
              <Meter
                value={l.count / max}
                thin
                tone="signal"
                label={t("a.domain.outgoing", { title: l.title })}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
