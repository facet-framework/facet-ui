import { labelText } from "../../i18n/legacy/labels";
import { remainingText } from "../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../i18n/legacy/shared";
import { localized } from "../../i18n/legacy/facet/primitives/Primitives.stories.text";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Icon, iconNames } from "./Icon";
import {
  Badge,
  Button,
  Chip,
  Dot,
  Field,
  IconButton,
  Kbd,
  SearchField,
  Segment,
  Switch,
  Tabs,
} from "./controls";
import {
  Distribution,
  EmptyState,
  ErrorState,
  Finding,
  ListRow,
  Meter,
  Section,
  Skeleton,
  Stat,
  Surface,
} from "./display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  type CollectionState,
} from "./collection";
import { Breadcrumbs, Dialog, Menu, Sheet, Toast } from "./overlay";
import { sample } from "../fixtures";

const meta: Meta = { title: "Primitives/Overview", parameters: { layout: "padded" } };
export default meta;
type Story = StoryObj;

export const Colors: Story = {
  name: "Colors",
  render: () => {
    const tokens = [
      "ground",
      "ground-2",
      "surface",
      "raised",
      "float",
      "sunken",
      "line",
      "line-strong",
      "ink",
      "ink-2",
      "muted",
      "faint",
      "signal",
      "signal-wash",
      "ok",
      "warn",
      "plan",
      "bad",
    ];
    return (
      <div className="t-grid" style={{ ["--t-grid-min" as string]: "150px" }}>
        {tokens.map((t) => (
          <div key={t} className="t-stack" style={{ gap: 6 }}>
            <div
              style={{
                height: 56,
                borderRadius: 10,
                border: "1px solid var(--t-line)",
                background: `var(--t-${t})`,
              }}
            />
            <span className="t-mono t-meta">--t-{t}</span>
          </div>
        ))}
      </div>
    );
  },
};

export const Typography: Story = {
  name: "Typography",
  render: () => (
    <div className="t-stack" style={{ gap: 18, maxWidth: 900 }}>
      <span className="t-eyebrow">Overview · facet</span>
      <span className="t-hero-number">94 %</span>
      <h1 className="t-hero-sentence">{localized.text2}</h1>
      <p className="t-lead">{localized.text3}</p>
      <h2 className="t-h1">{localized.text4}</h2>
      <h3 className="t-h2">{localized.text5}</h3>
      <h4 className="t-h3">{localized.text6}</h4>
      <p>
        {localized.text7}
        <code className="t-mono">@facet:</code>
        {germanLabels.text1}
      </p>
      <span className="t-meta">Meta · 12. Nov 2026 · c0abdee4</span>
    </div>
  ),
};

export const Icons: Story = {
  name: "Icons",
  render: () => (
    <div className="t-grid" style={{ ["--t-grid-min" as string]: "120px", gap: 10 }}>
      {iconNames.map((n) => (
        <div
          key={n}
          className="t-surface t-stack"
          style={{ gap: 8, padding: 14, alignItems: "center" }}
        >
          <Icon name={n} size={22} />
          <span className="t-mono t-meta">{n}</span>
        </div>
      ))}
    </div>
  ),
};

function ControlsDemo() {
  const [on, setOn] = useState(true);
  const [view, setView] = useState<"cards" | "list" | "table">("list");
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [q, setQ] = useState("");
  return (
    <div className="t-stack" style={{ gap: 24, maxWidth: 900 }}>
      <div className="t-row t-row--wrap">
        <Button variant="primary" icon="plus">
          Page create
        </Button>
        <Button icon="edit">{remainingText.text1}</Button>
        <Button variant="quiet" icon="copy">
          {germanLabels.text2}
        </Button>
        <Button variant="danger" icon="trash">
          {localized.text8}
        </Button>
        <Button size="small">{labelText.text1}</Button>
        <Button disabled>Disabled</Button>
        <IconButton icon="settings" label="Settings" />
      </div>
      <div className="t-row t-row--wrap">
        <Chip pressed count={217}>
          active
        </Chip>
        <Chip count={1}>planned</Chip>
        <Chip onRemove={() => undefined}>atlas</Chip>
        <Badge tone="ok">proven</Badge>
        <Badge tone="warn">Drift</Badge>
        <Badge tone="plan">planned</Badge>
        <Badge tone="bad">{labelText.text2}</Badge>
        <Badge tone="signal">new</Badge>
        <Dot tone="ok" />
        <Dot tone="warn" />
        <Dot tone="plan" open />
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </div>
      <div className="t-row t-row--wrap" style={{ gap: 24 }}>
        <Switch checked={on} label="Motion" onChange={setOn} />
        <Segment
          label={localized.text9}
          value={view}
          onChange={setView}
          options={[
            { value: "cards", label: "Cards", icon: "grid" },
            { value: "list", label: "List", icon: "list" },
            { value: "table", label: "Table", icon: "table" },
          ]}
        />
      </div>
      <Tabs
        label="Sections"
        value={tab}
        onChange={setTab}
        items={[
          { value: "a", label: "Promises", count: 19 },
          { value: "b", label: "Code", count: 8 },
          { value: "c", label: "History" },
        ]}
      />
      <div className="t-cols-2">
        <SearchField label="Search" value={q} placeholder="Record, File, Term" onChange={setQ} />
        <Field label="Title" hint={localized.text11}>
          {(id) => <input id={id} className="t-input" defaultValue={remainingText.text2} />}
        </Field>
        <Field label="path" error={localized.text12}>
          {(id) => (
            <input
              id={id}
              className="t-input"
              defaultValue="entrypoint/getting-started.md"
              aria-invalid="true"
            />
          )}
        </Field>
        <Field label={"Category"}>
          {(id) => (
            <select id={id} className="t-select" defaultValue="Entry">
              <option>EntryPoint</option>
              <option>{labelText.text3}</option>
            </select>
          )}
        </Field>
      </div>
    </div>
  );
}

export const Bedienelemente: Story = { render: () => <ControlsDemo /> };

export const Display: Story = {
  render: () => (
    <div className="t-stack" style={{ gap: 28, maxWidth: 1000 }}>
      <Finding
        eyebrow="Overview"
        figure="94%"
        tone="ok"
        sentence={localized.text14}
        lead={localized.text15}
      />
      <div className="t-row t-row--wrap" style={{ gap: 40 }}>
        <Stat value="217" label={localized.text16} large />
        <Stat value="18" label={localized.text17} tone="warn" />
        <Stat value="525" of="1.852" label={localized.text18} />
      </div>
      <div className="t-stack" style={{ gap: 10, maxWidth: 420 }}>
        <Meter value={0.94} label="proven" />
        <Meter value={0.28} tone="warn" label="Drift" />
        <Meter value={null} label={localized.text19} />
      </div>
      <Distribution
        label={localized.text20}
        parts={[
          { key: "a", label: "proven", value: 182, tone: "var(--t-ok)" },
          { key: "b", label: "partial", value: 26, tone: "var(--t-warn)" },
          { key: "c", label: "planned", value: 9, tone: "var(--t-plan)" },
        ]}
      />
      <Section title="Section" meta={localized.text21} actions={<Button size="small">All</Button>}>
        <Surface pad={false}>
          <ListRow
            lead={<Dot tone="ok" />}
            title="Commit-Gate"
            sub="lists/permissions/admin"
            trail={<Badge tone="ok">19/19</Badge>}
          />
          <ListRow
            lead={<Dot tone="warn" />}
            title="Drift-Note"
            sub="lists/permissions/lock"
            trail={<Badge tone="warn">Drift</Badge>}
          />
        </Surface>
      </Section>
      <div className="t-stack" style={{ gap: 8, maxWidth: 420 }}>
        <Skeleton width="60%" />
        <Skeleton width="40%" height={10} />
      </div>
      <div className="t-cols-2">
        <EmptyState
          icon="decision"
          title={localized.text22}
          body={localized.text23}
          action={<Button icon="plus">ADR create</Button>}
        />
        <ErrorState title={localized.text24} reason={localized.text25} onRetry={() => undefined} />
      </div>
    </div>
  ),
};

function CollectionDemo({ state, mobile }: { state: CollectionState; mobile?: boolean }) {
  const all = sample.adrs480();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  });
  const rows = all.slice((page - 1) * size, page * size);
  return (
    <Collection
      state={state}
      toolbar={
        <CollectionToolbar
          query=""
          queryLabel="Search decisions"
          placeholder={labelText.text4}
          facets={[
            { key: "accepted", label: "accepted", count: 298, active: true },
            { key: "superseded", label: "superseded", count: 77 },
            { key: "proposed", label: "proposed", count: 67 },
            { key: "rejected", label: "rejected", count: 38 },
          ]}
          sortLabel="Date ▼"
          groupLabel="Year"
          view="table"
          views={[
            { value: "table", label: "Table", icon: "table" },
            { value: "list", label: "List", icon: "list" },
            { value: "timeline", label: "Timeline", icon: "timeline" },
          ]}
        />
      }
      empty={{ title: localized.text28, body: localized.text29, icon: "decision" }}
      filteredEmpty={{ query: "sidecar 2019" }}
      error={{
        title: localized.text30,
        reason: localized.text31,
        onRetry: () => undefined,
      }}
      pagination={
        <Pagination
          page={page}
          pageSize={size}
          total={all.length}
          onPage={setPage}
          onPageSize={setSize}
          compact={mobile}
        />
      }
    >
      <DataTable
        label="Decisions"
        rows={rows}
        rowKey={(r) => String(r.number)}
        sort={sort}
        onSort={(key) =>
          setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))
        }
        onRowClick={() => undefined}
        columns={[
          {
            key: "number",
            label: "Nr.",
            numeric: true,
            sortable: true,
            width: 64,
            render: (r) => <span className="t-mono">{r.number}</span>,
          },
          { key: "title", label: "Title", sortable: true, render: (r) => r.title },
          {
            key: "status",
            label: "status",
            render: (r) => (
              <Badge
                tone={
                  r.status === "accepted"
                    ? "ok"
                    : r.status === "proposed"
                      ? "signal"
                      : r.status === "superseded"
                        ? "plan"
                        : "bad"
                }
              >
                {r.status}
              </Badge>
            ),
          },
          { key: "area", label: "Area", hideOnMobile: true, render: (r) => r.area },
          {
            key: "refs",
            label: "records",
            numeric: true,
            sortable: true,
            hideOnMobile: true,
            render: (r) => r.refs,
          },
          {
            key: "date",
            label: "Date",
            sortable: true,
            render: (r) => <span className="t-mono">{r.date}</span>,
          },
        ]}
      />
    </Collection>
  );
}

export const CollectionReady: Story = {
  name: "Collection Ready",
  render: () => <CollectionDemo state="ready" />,
};
export const CollectionLoading: Story = {
  name: "Collection Loading",
  render: () => <CollectionDemo state="loading" />,
};
export const CollectionEmpty: Story = {
  name: "Collection Empty",
  render: () => <CollectionDemo state="empty" />,
};
export const CollectionNoMatches: Story = {
  name: "Collection No Matches",
  render: () => <CollectionDemo state="filtered-empty" />,
};
export const CollectionError: Story = {
  name: "Collection Error",
  render: () => <CollectionDemo state="error" />,
};
export const CollectionMobile: Story = {
  name: "Collection Mobile",
  globals: { viewport: { value: "mobile" } },
  render: () => <CollectionDemo state="ready" mobile />,
};

function OverlayDemo() {
  const [open, setOpen] = useState<string | null>("domain");
  return (
    <div className="t-stack" style={{ gap: 28, minHeight: 520 }}>
      <Breadcrumbs
        openKey={open}
        onToggleSiblings={(k) => setOpen((o) => (o === k ? null : k))}
        crumbs={[
          { key: "root", label: "Product", onClick: () => undefined },
          {
            key: "domain",
            label: "navigation",
            onClick: () => undefined,
            siblings: ["registry", "authoring", "delivery", "core"].map((d) => ({
              key: d,
              label: d,
              onSelect: () => undefined,
            })),
          },
          {
            key: "cap",
            label: "atlas",
            onClick: () => undefined,
            siblings: [{ key: "x", label: "reader" }],
          },
          { key: "rec", label: "adr-plugin", mono: true },
        ]}
      />
      <div style={{ position: "relative", height: 200 }}>
        <Menu
          label="Actions"
          style={{ position: "absolute", top: 0, left: 0, width: 280 }}
          groups={[
            {
              label: "Record",
              items: [
                { key: "c", label: "Copy id", icon: "copy", meta: "C" },
                { key: "o", label: localized.text37, icon: "code" },
              ],
            },
            { items: [{ key: "a", label: localized.text38, icon: "chat", active: true }] },
          ]}
        />
      </div>
      <Toast
        tone="ok"
        action={
          <Button size="small" variant="quiet">
            {localized.text39}
          </Button>
        }
      >
        {remainingText.text3}
      </Toast>
    </div>
  );
}

export const Overlays: Story = { name: "Overlays", render: () => <OverlayDemo /> };

export const Drawer: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Sheet
      open
      title="commit-gate"
      meta="lists/permissions/admin"
      onClose={() => undefined}
      footer={<Button variant="primary">{localized.text41}</Button>}
    >
      <p className="t-lead">{localized.text42}</p>
    </Sheet>
  ),
};

export const DialogOverlay: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Dialog
      open
      title="History clear?"
      onClose={() => undefined}
      footer={
        <>
          <Button variant="quiet">{germanLabels.text3}</Button>
          <Button variant="danger">Clear</Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{localized.text43}</p>
    </Dialog>
  ),
};
