import { useMemo, useState } from "react";
import {
  AppBar,
  AppShell,
  Avatar,
  Badge,
  BarChart,
  Button,
  CalendarHeatmap,
  Collection,
  CollectionToolbar,
  DataTable,
  Distribution,
  Finding,
  Grid,
  Icon,
  LineChart,
  Meter,
  NavBar,
  Page,
  RingMeter,
  Row,
  Section,
  Sheet,
  Stack,
  Metric,
  Sunburst,
  Surface,
  sortRows,
  type Column,
  type SortDir,
  type Tone,
} from "@facet-tools/ui";
import { records, trend, weeks, type Drift, type FeatureRecord, type Lifecycle } from "./records";

const lifecycleTone: Record<Lifecycle, Tone> = {
  active: "ok",
  planned: "plan",
  deprecated: "neutral",
};
const driftTone: Record<Exclude<Drift, null>, Tone> = { none: "ok", minor: "warn", major: "bad" };
const driftWord: Record<Exclude<Drift, null>, string> = {
  none: "in sync",
  minor: "minor drift",
  major: "drifted",
};
const verified = (r: FeatureRecord) => r.scenarios.filter((s) => s.verified).length;
const driftRank = (d: Drift) => (d == null ? -1 : ["none", "minor", "major"].indexOf(d));
const domains = [...new Set(records.map((r) => r.domain))];
const params = new URLSearchParams(location.search);

function DriftBadge({ drift }: { drift: Drift }) {
  if (drift == null) return <span className="t-meta">not measured</span>;
  return <Badge tone={driftTone[drift]}>{driftWord[drift]}</Badge>;
}

export function App() {
  const [query, setQuery] = useState("");
  const [life, setLife] = useState<Lifecycle | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>({ key: "drift", dir: "desc" });
  const [area, setArea] = useState("overview");
  const [open, setOpen] = useState<FeatureRecord | null>(
    records.find((r) => r.id === params.get("record")) ?? null,
  );

  const active = records.filter((r) => r.lifecycle === "active");
  const drifted = active.filter((r) => r.drift === "minor" || r.drift === "major");
  const scenarios = records.flatMap((r) => r.scenarios);

  const columns: Column<FeatureRecord>[] = [
    {
      key: "title",
      label: "Feature",
      sortable: true,
      render: (r) => (
        <Stack gap={0}>
          <span>{r.title}</span>
          <span className="t-meta">{r.id}</span>
        </Stack>
      ),
    },
    { key: "domain", label: "Domain", sortable: true, hideOnMobile: true, render: (r) => r.domain },
    {
      key: "lifecycle",
      label: "Lifecycle",
      sortable: true,
      render: (r) => <Badge tone={lifecycleTone[r.lifecycle]}>{r.lifecycle}</Badge>,
    },
    {
      key: "scenarios",
      label: "Scenarios verified",
      sortable: true,
      width: 180,
      render: (r) => (
        <Row gap={2}>
          <Meter
            value={verified(r) / r.scenarios.length}
            tone={verified(r) === r.scenarios.length ? "ok" : "plan"}
            thin
            label={`${r.title} scenarios verified`}
          />
          <span className="t-num t-meta">
            {verified(r)}/{r.scenarios.length}
          </span>
        </Row>
      ),
    },
    { key: "drift", label: "Code", sortable: true, render: (r) => <DriftBadge drift={r.drift} /> },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      hideOnMobile: true,
      render: (r) => (
        <Row gap={2}>
          <Avatar name={r.owner} size={24} />
          {r.owner}
        </Row>
      ),
    },
    {
      key: "updated",
      label: "Updated",
      sortable: true,
      numeric: true,
      hideOnMobile: true,
      render: (r) => r.updated,
    },
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = records.filter(
      (r) =>
        (!life || r.lifecycle === life) &&
        (!domain || r.domain === domain) &&
        (!q || `${r.title} ${r.id} ${r.owner}`.toLowerCase().includes(q)),
    );
    const value = (r: FeatureRecord) =>
      sort.key === "scenarios"
        ? verified(r) / r.scenarios.length
        : sort.key === "drift"
          ? driftRank(r.drift)
          : String(r[sort.key as keyof FeatureRecord]);
    return sortRows(hit, value, sort.dir);
  }, [query, life, domain, sort]);

  const filtered = query !== "" || life != null || domain != null;

  return (
    <AppShell
      theme={{ theme: "facet", mode: "light" }}
      top={
        <AppBar
          brand={
            <>
              <Icon name="layers" size={20} /> Parcel
            </>
          }
          title="Features"
          meta={`${records.length} records · release 4.2`}
          stats={[
            { key: "live", label: "Live", value: active.length },
            {
              key: "drift",
              label: "Drifted",
              value: drifted.length,
              tone: drifted.length ? "warn" : "ok",
            },
            {
              key: "planned",
              label: "Planned",
              value: records.filter((r) => r.lifecycle === "planned").length,
            },
          ]}
          command={{
            label: "Find a feature",
            keys: ["Ctrl", "K"],
            onOpen: () => document.querySelector<HTMLInputElement>("input[type=search]")?.focus(),
          }}
          actions={
            <>
              <Button icon="download" variant="quiet">
                Export
              </Button>
              <Button icon="plus" variant="primary">
                New feature
              </Button>
            </>
          }
        />
      }
      nav={
        <NavBar
          onPick={setArea}
          items={[
            { key: "overview", label: "Overview", icon: "home", current: area === "overview" },
            {
              key: "drift",
              label: "Drift",
              icon: "warning",
              badge: drifted.length,
              current: area === "drift",
            },
            { key: "owners", label: "Owners", icon: "person", current: area === "owners" },
          ]}
        />
      }
      overlay={
        <Sheet
          open={open != null}
          title={open?.title ?? ""}
          meta={open?.id}
          width={520}
          onClose={() => setOpen(null)}
        >
          {open ? <RecordDetail record={open} /> : null}
        </Sheet>
      }
    >
      <Page>
        <Stack gap={7}>
          <Finding
            eyebrow="Release 4.2"
            figure={active.length}
            of={records.length}
            tone="ok"
            sentence="features are live."
            lead={`${drifted.length} of them changed in code since their record was written; ${records.filter((r) => r.lifecycle === "planned").length} are planned.`}
          />

          <Grid min={200} gap={4} fit>
            <Surface>
              <Metric value={active.length} label="Live" tone="ok" size="large" count />
            </Surface>
            <Surface>
              <Metric
                value={records.filter((r) => r.lifecycle === "planned").length}
                label="Planned"
                tone="plan"
                size="large"
                count
              />
            </Surface>
            <Surface>
              <Metric
                value={drifted.length}
                label="Drifted from code"
                tone="bad"
                size="large"
                count
              />
            </Surface>
            <Surface>
              <Metric
                value={
                  scenarios.length
                    ? Math.round(
                        (scenarios.filter((s) => s.verified).length / scenarios.length) * 100,
                      )
                    : null
                }
                unit="%"
                label="Scenarios verified"
                size="large"
              />
            </Surface>
          </Grid>

          <div className="t-cols-2">
            <Section title="Features per week" meta="last 10 weeks">
              <Surface>
                <LineChart
                  label="Features per week"
                  categories={weeks}
                  height={180}
                  series={[
                    { key: "active", label: "Live", values: trend.active },
                    { key: "planned", label: "Planned", values: trend.planned },
                    { key: "drifted", label: "Drifted", values: trend.drifted },
                  ]}
                />
              </Surface>
            </Section>
            <Section title="Verified scenarios by domain">
              <Surface>
                <Stack gap={5}>
                  <BarChart
                    label="Verified scenarios by domain"
                    unit="%"
                    max={100}
                    active={domain ?? undefined}
                    onPick={(d) => setDomain(domain === d ? null : d)}
                    bars={domains.map((d) => {
                      const s = records.filter((r) => r.domain === d).flatMap((r) => r.scenarios);
                      const ok = s.filter((x) => x.verified).length;
                      return {
                        key: d,
                        label: d,
                        value: Math.round((ok / s.length) * 100),
                        meta: `${ok}/${s.length}`,
                      };
                    })}
                  />
                  <Distribution
                    label="Lifecycle"
                    onPick={(k) => setLife(life === k ? null : (k as Lifecycle))}
                    parts={(["active", "planned", "deprecated"] as const).map((l) => ({
                      key: l,
                      label: l,
                      value: records.filter((r) => r.lifecycle === l).length,
                      active: life === l,
                      tone:
                        l === "active"
                          ? "var(--t-ok)"
                          : l === "planned"
                            ? "var(--t-plan)"
                            : "var(--t-faint)",
                    }))}
                  />
                </Stack>
              </Surface>
            </Section>
          </div>

          <Section title="Registry shape">
            <Grid min={300} gap={4} fit>
              <Surface>
                <Stack gap={3}>
                  <span className="t-label">Features by domain</span>
                  <Sunburst
                    label="Features by domain and lifecycle"
                    size={300}
                    selected={domain}
                    center={<span className="t-num">{records.length}</span>}
                    nodes={domains.map((d) => {
                      const inDomain = records.filter((r) => r.domain === d);
                      return {
                        key: d,
                        label: d,
                        value: inDomain.length,
                        children: (["active", "planned", "deprecated"] as const)
                          .map((l) => ({
                            key: `${d}:${l}`,
                            label: l,
                            value: inDomain.filter((r) => r.lifecycle === l).length,
                          }))
                          .filter((c) => c.value > 0),
                      };
                    })}
                  />
                </Stack>
              </Surface>
              <Surface>
                <Stack gap={4}>
                  <span className="t-label">Scenarios verified</span>
                  <RingMeter
                    label="Scenarios verified"
                    value={scenarios.filter((s) => s.verified).length / scenarios.length}
                    valueText={`${scenarios.filter((s) => s.verified).length} of ${scenarios.length}`}
                    tone="ok"
                  />
                  <span className="t-meta">
                    {scenarios.filter((s) => s.verified).length} of {scenarios.length} scenarios
                  </span>
                </Stack>
              </Surface>
              <Surface>
                <Stack gap={3}>
                  <span className="t-label">Record updates</span>
                  <CalendarHeatmap
                    label="Record updates per day"
                    from="2026-09-01"
                    to="2026-11-23"
                    cell={11}
                    days={[...new Set(records.map((r) => r.updated))].map((date) => ({
                      date,
                      count: records.filter((r) => r.updated === date).length,
                    }))}
                  />
                </Stack>
              </Surface>
            </Grid>
          </Section>

          <Section title="All features" meta={`${rows.length} shown`}>
            <CollectionToolbar
              query={query}
              queryLabel="Find a feature"
              placeholder="Title, id or owner"
              onQuery={setQuery}
              facets={[
                ...(["active", "planned", "deprecated"] as const).map((l) => ({
                  key: `life:${l}`,
                  label: l,
                  count: records.filter((r) => r.lifecycle === l).length,
                  active: life === l,
                })),
                ...domains.map((d) => ({ key: `domain:${d}`, label: d, active: domain === d })),
              ]}
              onFacet={(key) => {
                const [kind, v] = key.split(":");
                if (kind === "life") setLife(life === v ? null : (v as Lifecycle));
                else setDomain(domain === v ? null : v);
              }}
              onReset={() => (setQuery(""), setLife(null), setDomain(null))}
            />
            <Collection
              state={rows.length ? "ready" : filtered ? "filtered-empty" : "empty"}
              empty={{ title: "No features yet" }}
              filteredEmpty={{
                query,
                onReset: () => (setQuery(""), setLife(null), setDomain(null)),
              }}
            >
              <DataTable
                label="Features"
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                sort={sort}
                onSort={(key) =>
                  setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
                }
                onRowClick={setOpen}
                selectedKey={open?.id}
              />
            </Collection>
          </Section>
        </Stack>
      </Page>
    </AppShell>
  );
}

function RecordDetail({ record: r }: { record: FeatureRecord }) {
  return (
    <Stack gap={5}>
      <Row gap={2} wrap>
        <Badge tone={lifecycleTone[r.lifecycle]}>{r.lifecycle}</Badge>
        <DriftBadge drift={r.drift} />
        <span className="t-spacer" />
        <Row gap={2}>
          <Avatar name={r.owner} size={22} />
          <span className="t-muted">{r.owner}</span>
        </Row>
      </Row>
      <p className="t-lead" style={{ margin: 0 }}>
        {r.summary}
      </p>
      <Section title="Scenarios" meta={`${verified(r)} of ${r.scenarios.length} verified`}>
        <Stack gap={2}>
          {r.scenarios.map((s, i) => (
            <Surface key={i} level="sunken">
              <Row align="start" gap={3}>
                <Icon
                  name={s.verified ? "check" : "clock"}
                  className={s.verified ? "t-ok" : "t-plan"}
                />
                <dl className="gwt">
                  <dt>Given</dt>
                  <dd>{s.given}</dd>
                  <dt>When</dt>
                  <dd>{s.when}</dd>
                  <dt>Then</dt>
                  <dd>{s.then}</dd>
                </dl>
              </Row>
            </Surface>
          ))}
        </Stack>
      </Section>
      <Section title="Code" meta={r.anchors.length ? `${r.anchors.length} files` : undefined}>
        {r.anchors.length ? (
          <Stack gap={1}>
            {r.anchors.map((a) => (
              <Row key={a} gap={2} className="t-mono">
                <Icon name="file" size={14} /> {a}
              </Row>
            ))}
          </Stack>
        ) : (
          <span className="t-muted">No code yet</span>
        )}
      </Section>
      {r.questions?.length ? (
        <Section title="Open questions">
          <Stack gap={2}>
            {r.questions.map((q) => (
              <Row key={q} gap={2} align="start">
                <Icon name="info" className="t-plan" /> {q}
              </Row>
            ))}
          </Stack>
        </Section>
      ) : null}
      <span className="t-meta">Updated {r.updated}</span>
    </Stack>
  );
}
