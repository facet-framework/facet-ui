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
  Metric,
  Surface,
} from "./display";
import {
  Collection,
  CollectionToolbar,
  DataTable,
  Pagination,
  type CollectionState,
} from "./collection";
import { Breadcrumbs, Dialog, Menu, Sheet } from "./overlay";
import { Toast, ToastRegion } from "./toast";
const sample = {
  adrs480: () =>
    Array.from({ length: 480 }, (_, i) => ({
      number: i + 1,
      title: `Item ${i + 1}`,
      status: "accepted",
      area: "Library",
      refs: 2,
      date: "2026-01-01",
    })),
};

const meta: Meta = { title: "Primitives/Overview", parameters: { layout: "padded" } };
export default meta;
type Story = StoryObj;

export const Colors: Story = {
  name: "Foundations · Colors",
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
  name: "Foundations · Typography",
  render: () => (
    <div className="t-stack" style={{ gap: 18, maxWidth: 900 }}>
      <span className="t-eyebrow">Overview · facet</span>
      <span className="t-hero-number">94 %</span>
      <h1 className="t-hero-sentence">1,853 of 1,971 tasks are backed.</h1>
      <p className="t-lead">
        118 are waiting for a test, 18 files have moved since the last comparison.
      </p>
      <h2 className="t-h1">Heading 1</h2>
      <h3 className="t-h2">Heading 2</h3>
      <h4 className="t-h3">Heading 3</h4>
      <p>binds the code to it.</p>
      <span className="t-meta">Meta · 12 Nov 2026 · c0abdee4</span>
    </div>
  ),
};

export const Icons: Story = {
  name: "Foundations · Icons",
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
          Add page
        </Button>
        <Button icon="edit">Edit</Button>
        <Button variant="quiet" icon="copy">
          Copy
        </Button>
        <Button variant="danger" icon="trash">
          Delete
        </Button>
        <Button size="small">Small</Button>
        <Button disabled>Disabled</Button>
        <IconButton icon="settings" label="Settings" />
      </div>
      <div className="t-row t-row--wrap">
        <Chip pressed count={217}>
          active
        </Chip>
        <Chip count={1}>planned</Chip>
        <Chip onRemove={() => undefined}>atlas</Chip>
        <Badge tone="ok">backed</Badge>
        <Badge tone="warn">Drift</Badge>
        <Badge tone="plan">planned</Badge>
        <Badge tone="bad">red</Badge>
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
          label="View"
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
          { value: "a", label: "Tasks", count: 19 },
          { value: "b", label: "Code", count: 8 },
          { value: "c", label: "History" },
        ]}
      />
      <div className="t-cols-2">
        <SearchField label="Search" value={q} placeholder="Item, file, term" onChange={setQ} />
        <Field label="Title" hint="Becomes the heading of the page.">
          {(id) => <input id={id} className="t-input" defaultValue="First steps" />}
        </Field>
        <Field label="Path" error="This path is already taken.">
          {(id) => (
            <input
              id={id}
              className="t-input"
              defaultValue="getting-started/first-steps.md"
              aria-invalid="true"
            />
          )}
        </Field>
        <Field label="Capability">
          {(id) => (
            <select id={id} className="t-select" defaultValue="Getting started">
              <option>Getting started</option>
              <option>Guides</option>
            </select>
          )}
        </Field>
      </div>
    </div>
  );
}

export const Controls: Story = { render: () => <ControlsDemo /> };

export const Display: Story = {
  render: () => (
    <div className="t-stack" style={{ gap: 28, maxWidth: 1000 }}>
      <Finding
        eyebrow="Overview"
        figure="94 %"
        tone="ok"
        sentence="1,853 of 1,971 tasks are backed."
        lead="118 are waiting for a test."
      />
      <div className="t-row t-row--wrap" style={{ gap: 40 }}>
        <Metric value={217} label="active features" size="large" count />
        <Metric value={18} label="files with drift" tone="warn" />
        <Metric value={525} of={1852} label="files indexed" />
        <Metric value={null} label="tokens today" detail="offline" />
      </div>
      <div className="t-stack" style={{ gap: 10, maxWidth: 420 }}>
        <Meter value={0.94} label="backed" />
        <Meter value={0.28} tone="warn" label="Drift" />
        <Meter value={null} label="not measured" />
      </div>
      <Distribution
        label="State of the features"
        parts={[
          { key: "a", label: "backed", value: 182, tone: "var(--t-ok)" },
          { key: "b", label: "partial", value: 26, tone: "var(--t-warn)" },
          { key: "c", label: "planned", value: 9, tone: "var(--t-plan)" },
        ]}
      />
      <Section title="Section" meta="12 entries" actions={<Button size="small">All</Button>}>
        <Surface pad={false}>
          <ListRow
            lead={<Dot tone="ok" />}
            title="Commit-Gate"
            sub="authoring/guardrails/commit-gate"
            trail={<Badge tone="ok">19/19</Badge>}
          />
          <ListRow
            lead={<Dot tone="warn" />}
            title="Drift notice"
            sub="authoring/guardrails/drift-notice"
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
          icon="scales"
          title="No decisions yet"
          body="Add the first ADR under docs/adr."
          action={<Button icon="plus">Add ADR</Button>}
        />
        <ErrorState
          title="Items not readable"
          reason="facet ui does not answer on /api/model."
          onRetry={() => undefined}
        />
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
          placeholder="Title, number, person"
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
      empty={{ title: "No decisions yet", body: "docs/adr is empty.", icon: "scales" }}
      filteredEmpty={{ query: "sidecar 2019" }}
      error={{
        title: "Directory not readable",
        reason: "repo.list refuses docs/adr: outside the grant.",
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
            label: "No.",
            numeric: true,
            sortable: true,
            width: 64,
            render: (r) => <span className="t-mono">{r.number}</span>,
          },
          { key: "title", label: "Title", sortable: true, render: (r) => r.title },
          {
            key: "status",
            label: "Status",
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
            label: "Items",
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
  name: "Collection · 480 entries",
  render: () => <CollectionDemo state="ready" />,
};
export const CollectionLoading: Story = {
  name: "Collection · loading",
  render: () => <CollectionDemo state="loading" />,
};
export const CollectionEmpty: Story = {
  name: "Collection · empty",
  render: () => <CollectionDemo state="empty" />,
};
export const CollectionNoMatches: Story = {
  name: "Collection · no matches",
  render: () => <CollectionDemo state="filtered-empty" />,
};
export const CollectionError: Story = {
  name: "Collection · error",
  render: () => <CollectionDemo state="error" />,
};
export const CollectionMobile: Story = {
  name: "Collection · mobile",
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
            siblings: ["catalog", "authoring", "delivery", "core"].map((d) => ({
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
              label: "Item",
              items: [
                { key: "c", label: "Copy id", icon: "copy", meta: "C" },
                { key: "o", label: "Open in editor", icon: "code" },
              ],
            },
            { items: [{ key: "a", label: "Ask Atlas", icon: "chat", active: true }] },
          ]}
        />
      </div>
      <ToastRegion inline>
        <Toast tone="ok" duration={null} onUndo={() => undefined}>
          Note removed
        </Toast>
        <Toast tone="bad" duration={null} irreversible>
          Branch deleted
        </Toast>
      </ToastRegion>
    </div>
  );
}

export const Overlays: Story = { render: () => <OverlayDemo /> };

export const Drawer: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Sheet
      open
      title="commit-gate"
      meta="authoring/guardrails/commit-gate"
      onClose={() => undefined}
      footer={<Button variant="primary">Open</Button>}
    >
      <p className="t-lead">The commit gate refuses a commit while the lint is red.</p>
    </Sheet>
  ),
};

export const DialogWindow: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <Dialog
      open
      title="Clear history?"
      onClose={() => undefined}
      footer={
        <>
          <Button variant="quiet">Cancel</Button>
          <Button variant="danger">Clear</Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>The 86 visited places of this browser are removed.</p>
    </Dialog>
  ),
};
