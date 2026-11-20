import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button, Chip, IconButton, Segment, Tabs } from "../../primitives/controls";
import { Distribution, EmptyState } from "../../primitives/display";
import { Breadcrumbs, type Crumb } from "../../primitives/overlay";
import { Icon } from "../../primitives/Icon";
import { useText, type FacetText } from "../../i18n/TextProvider";
import {
  KNOWLEDGE_SLOTS,
  LIFECYCLE,
  TAG,
  dateText,
  pctText,
  roleLabel,
  share,
  type GwtStep,
  type KnowledgeKey,
  type Lifecycle,
  type RecordKind,
} from "./model";
import {
  CodeView,
  CommitSpark,
  DependencyGraph,
  Figure,
  KindBadge,
  LifecycleBadge,
  ProofMosaic,
  SectionChips,
  SectionRail,
  StepList,
  cx,
  type RailItem,
} from "./parts";
import { CodeZoom, SourceEditor, type SourceFile } from "./SourceEditor";

export type DossierTest = { kind: string; file: string; name: string | null };
export type DossierScenario = {
  id: string;
  steps: GwtStep[];
  proven: boolean;
  tests: DossierTest[];
};
export type DossierAnchor = { path: string; line: number; role: string };
export type DossierKnowledge = { key: KnowledgeKey; answer: string | null };
export type DossierCommit = { date: string; sha: string; subject: string };
export type DossierDrift = { path: string; changedAt: string | null };
export type DossierLink = { id: string; lifecycle?: Lifecycle };
export type DossierRule = { id: string; title: string; states: string };

export type RecordDossier = {
  id: string;
  kind: RecordKind;
  domain: string;
  capability: string;
  slug: string;
  summary: string;
  lifecycle: Lifecycle;
  owner: string | null;
  createdAt: string | null;
  scenarioCount: number;
  provenCount: number;

  scenarios: DossierScenario[];
  testCount: number;

  testKinds: Record<string, number>;
  anchorCount: number;
  anchors: DossierAnchor[];
  knowledge: DossierKnowledge[];

  logCount: number | null;

  log: DossierCommit[] | null;
  dependsOn: DossierLink[];
  dependents: DossierLink[];
  variants: DossierLink[];
  drift: DossierDrift[];

  observed: boolean | null;
  rules: DossierRule[];
  tickets: string[];
  yaml: string;
  json: string;
};

export type DossierSectionKey =
  "promises" | "code" | "knowledge" | "drift" | "history" | "relations" | "operations" | "rules";

export type Sibling = { id: string; records: number; scenarios: number; proven: number };

export type CrumbLevel = "domain" | "capability" | "record";

export const DOSSIER_STICK_KEYS = ["path", "status", "name", "id"] as const;
export type DossierStickKey = (typeof DOSSIER_STICK_KEYS)[number];

export type RecordDossierPageProps = {
  state: "ready" | "not-found";
  mobile?: boolean;
  record?: RecordDossier;

  siblings?: { domains: Sibling[]; capabilities: Sibling[]; records: Sibling[] };
  siblingsOpen?: CrumbLevel | null;

  siblingsQuery?: string;
  onSiblingsQuery?: (query: string) => void;

  onCloseSiblings?: () => void;

  stuck?: readonly DossierStickKey[];

  onStick?: (key: DossierStickKey, on: boolean) => void;
  tab: "record" | "raw";
  rawFormat?: "yaml" | "json";
  section?: DossierSectionKey;

  collapsed?: DossierSectionKey[];
  scenarioFilter?: "all" | "open" | "proven";

  now?: string;

  missingId?: string;
  nearest?: string[];
  onTab?: (t: "record" | "raw") => void;
  onRawFormat?: (f: "yaml" | "json") => void;
  onSection?: (s: DossierSectionKey) => void;
  onToggleSection?: (s: DossierSectionKey) => void;
  onToggleSiblings?: (level: CrumbLevel) => void;
  onNavigate?: (to: { kind: "product" | "records" | CrumbLevel; id: string }) => void;
  onScenarioFilter?: (f: "all" | "open" | "proven") => void;
  onMore?: (what: "scenarios" | "anchors" | "log") => void;
  onOpenAnchor?: (a: DossierAnchor) => void;
  onOpenTest?: (t: DossierTest) => void;
  onOpenRule?: (id: string) => void;
  onOpenCommit?: (sha: string) => void;
  onOpenDrift?: (path: string) => void;
  onAnswer?: (slot: KnowledgeKey) => void;
  onCopy?: (what: "id" | "raw" | "anchor") => void;
  onAsk?: () => void;

  codeZoom?: number;
  onCodeZoom?: (zoom: number) => void;

  openFile?: SourceFile | null;
  onCloseFile?: () => void;
};

function scrollSection(main: HTMLElement | null, k: DossierSectionKey) {
  const el = main?.querySelector<HTMLElement>(`[data-testid="section-${k}"]`);
  el?.scrollIntoView?.({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

function crumbsFor(p: RecordDossierPageProps, r: RecordDossier, { t, plural }: FacetText): Crumb[] {
  const sib = p.siblings;
  const go = p.onNavigate;
  const menu = (level: CrumbLevel, items: Sibling[] | undefined, current: string, prefix: string) =>
    items?.map((s) => ({
      key: s.id,
      label: s.id,
      current: s.id === current,
      sub:
        level === "record"
          ? t("b.common.provenOf", { proven: s.proven, total: s.scenarios })
          : plural("b.common.records", s.records),
      meta: pctText(share(s.proven, s.scenarios), t),
      onSelect: () => go?.({ kind: level, id: prefix + s.id }),
    }));
  if (r.kind === "assumption") {
    return [
      { key: "records", label: "Records", onClick: () => go?.({ kind: "records", id: "" }) },
      {
        key: "kind",
        label: t("b.common.assumptions"),
        onClick: () => go?.({ kind: "records", id: "kind:assumption" }),
      },
      { key: "record", label: r.slug, mono: true },
    ];
  }
  return [
    {
      key: "product",
      label: t("b.dossier.product"),
      onClick: () => go?.({ kind: "product", id: "" }),
    },
    {
      key: "domain",
      label: r.domain,
      mono: true,
      onClick: () => go?.({ kind: "domain", id: r.domain }),
      siblings: menu("domain", sib?.domains, r.domain, ""),
    },
    {
      key: "capability",
      label: r.capability,
      mono: true,
      onClick: () => go?.({ kind: "capability", id: `${r.domain}/${r.capability}` }),
      siblings: menu("capability", sib?.capabilities, r.capability, `${r.domain}/`),
    },
    {
      key: "record",
      label: r.slug,
      mono: true,
      siblings: menu("record", sib?.records, r.slug, `${r.domain}/${r.capability}/`),
    },
  ];
}

function DossierSection({
  id,
  title,
  meta,
  actions,
  children,
  collapsible,
  collapsed,
  onToggle,
}: {
  id: DossierSectionKey;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section
      className="t-b-sec t-anim-rise"
      id={id}
      aria-labelledby={`${id}-h`}
      data-testid={`section-${id}`}
    >
      <div className="t-b-sec__head">
        {collapsible ? (
          <button
            type="button"
            className="t-b-sec__toggle"
            aria-expanded={!collapsed}
            aria-controls={`${id}-body`}
            onClick={onToggle}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronDown"} size={14} />
            <h2 className="t-h2" id={`${id}-h`}>
              {title}
            </h2>
          </button>
        ) : (
          <h2 className="t-h2" id={`${id}-h`}>
            {title}
          </h2>
        )}
        {meta ? <span className="t-meta">{meta}</span> : null}
        {actions && !collapsed ? (
          <>
            <span className="t-spacer" />
            <div className="t-row t-row--wrap">{actions}</div>
          </>
        ) : null}
      </div>
      {collapsed ? null : (
        <div className="t-b-sec__body" id={`${id}-body`}>
          {children}
        </div>
      )}
    </section>
  );
}

function Banner({
  tone,
  icon,
  children,
  action,
}: {
  tone: "warn" | "plan" | "signal" | "bad";
  icon: Parameters<typeof Icon>[0]["name"];
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cx("t-b-banner", `t-b-banner--${tone}`)} role="note">
      <Icon name={icon} size={16} />
      <div className="t-b-banner__text">{children}</div>
      {action}
    </div>
  );
}

function ScenarioCard({
  s,
  onOpenTest,
}: {
  s: DossierScenario;
  onOpenTest?: (t: DossierTest) => void;
}) {
  const { t } = useText();
  return (
    <article
      className={cx("t-b-scn", !s.proven && "t-b-scn--open")}
      aria-label={s.id}
      data-testid={`scenario-${s.id}`}
    >
      <header className="t-b-scn__head">
        <span className="t-mono t-b-scn__id">{s.id}</span>
        <span className="t-spacer" />
        {s.proven ? (
          <Badge tone="ok">{t("b.common.proven")}</Badge>
        ) : (
          <Badge tone="warn">{t("b.common.open")}</Badge>
        )}
      </header>
      <StepList steps={s.steps} />
      {s.tests.length ? (
        <ul className="t-b-scn__tests" aria-label={t("b.dossier.provingTests")}>
          {s.tests.map((test, i) => (
            <li key={i}>
              <button type="button" className="t-b-test" onClick={() => onOpenTest?.(test)}>
                <Badge
                  plain
                  tone={
                    test.kind === "E2E"
                      ? "signal"
                      : test.kind === "Integration"
                        ? "plan"
                        : "neutral"
                  }
                >
                  {test.kind}
                </Badge>
                <Icon name="test" size={12} />
                <span className="t-mono t-wrap">{test.file}</span>
                {test.name ? <span className="t-b-test__name t-wrap">{test.name}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : s.proven ? null : (
        <p className="t-b-scn__none">
          <Icon name="warning" size={12} /> {t("b.dossier.noProof")}
        </p>
      )}
    </article>
  );
}

function rail(r: RecordDossier, { t, number }: FacetText): RailItem[] {
  const open = r.knowledge.filter((k) => !k.answer).length;
  return [
    {
      key: "promises",
      label: t("b.common.promises"),
      count: `${r.provenCount}/${r.scenarioCount}`,
      tone: r.scenarioCount === 0 ? undefined : r.provenCount === r.scenarioCount ? "ok" : "warn",
    },
    {
      key: "code",
      label: "Code",
      count: number(r.anchorCount),
      tone: r.anchorCount || r.kind === "assumption" ? undefined : "plan",
    },
    {
      key: "knowledge",
      label: t("b.dossier.rail.knowledge"),
      count: `${5 - open}/5`,
      tone: open ? "warn" : "ok",
    },
    {
      key: "drift",
      label: t("b.common.drift"),
      count: r.drift.length,
      tone: r.drift.length ? "warn" : undefined,
    },
    { key: "history", label: t("b.dossier.rail.history"), count: r.logCount ?? "—" },
    {
      key: "relations",
      label: t("b.dossier.rail.relations"),
      count: r.dependsOn.length + r.dependents.length + r.variants.length,
    },
    { key: "operations", label: t("b.dossier.rail.operations") },
    { key: "rules", label: t("b.dossier.rail.rules"), count: r.rules.length },
  ];
}

function NotFound({ p }: { p: RecordDossierPageProps }) {
  const { t } = useText();
  return (
    <div className="t-page t-b-record" data-testid="dossier-not-found">
      <EmptyState
        icon="records"
        title={
          <>
            {t("b.dossier.notFound")} <span className="t-mono">{p.missingId}</span>
          </>
        }
        body={t("b.dossier.notFoundBody")}
        action={
          <>
            <Button
              icon="records"
              onClick={() => p.onNavigate?.({ kind: "records", id: p.missingId ?? "" })}
            >
              {t("b.dossier.searchRecords")}
            </Button>
            <Button icon="chat" variant="quiet" onClick={p.onAsk}>
              {t("b.dossier.askAtlas")}
            </Button>
          </>
        }
      />
      {p.nearest?.length ? (
        <div className="t-b-nearest t-surface t-pad">
          <span className="t-label">{t("b.dossier.similarIds")}</span>
          <ul className="t-list">
            {p.nearest.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className="t-b-link t-mono"
                  onClick={() => p.onNavigate?.({ kind: "record", id })}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function RecordDossierPage(p: RecordDossierPageProps) {
  const text = useText();
  if (p.state === "not-found" || !p.record) return <NotFound p={p} />;
  return <Dossier p={p} r={p.record} text={text} />;
}

function Dossier({ p, r, text }: { p: RecordDossierPageProps; r: RecordDossier; text: FacetText }) {
  const { t, plural, number } = text;
  const mobile = !!p.mobile;
  const items = rail(r, text);
  const collapsed = (k: DossierSectionKey) => mobile && !!p.collapsed?.includes(k);
  const sec = (k: DossierSectionKey) => ({
    id: k,
    collapsible: mobile,
    collapsed: collapsed(k),
    onToggle: () => p.onToggleSection?.(k),
  });
  const filter = p.scenarioFilter ?? "all";
  const scenarios = r.scenarios.filter((s) =>
    filter === "all" ? true : filter === "open" ? !s.proven : s.proven,
  );
  const openKnowledge = r.knowledge.filter((k) => !k.answer).length;
  const provenPct = share(r.provenCount, r.scenarioCount);
  const files = new Set(r.anchors.map((a) => a.path)).size;
  const kinds = r.testKinds;
  const assumption = r.kind === "assumption";
  const roles = r.anchors.reduce<Record<string, number>>(
    (a, x) => ({ ...a, [x.role]: (a[x.role] ?? 0) + 1 }),
    {},
  );
  const lastChange = r.log?.[0]?.date ?? null;

  const mainRef = useRef<HTMLDivElement>(null);
  const scrollTo = (k: DossierSectionKey) => scrollSection(mainRef.current, k);
  const section = p.section;
  const tab = p.tab;
  const collapsedNow = collapsed(section ?? "promises");
  useEffect(() => {
    if (section && tab === "record") scrollSection(mainRef.current, section);
  }, [section, tab, collapsedNow]);

  const closeFile = () => {
    const f = p.openFile;
    p.onCloseFile?.();
    if (f)
      mainRef.current
        ?.querySelector<HTMLElement>(`[data-testid="anchor-${f.path}:${f.line}"]`)
        ?.focus();
  };

  const stuck = p.stuck ?? [];
  const stripRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Partial<Record<DossierStickKey, HTMLElement | null>>>({});
  const [gone, setGone] = useState<DossierStickKey[]>([]);
  const stuckKey = stuck.join(" ");
  useEffect(() => {
    if (!stuckKey) return;
    const keys = stuckKey.split(" ") as DossierStickKey[];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = stripRef.current?.getBoundingClientRect().top ?? 0;
      const next = keys.filter(
        (k) => (rowRefs.current[k]?.getBoundingClientRect().bottom ?? 0) <= line,
      );
      setGone((prev) => (prev.join(" ") === next.join(" ") ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [stuckKey]);

  const pinButton = (key: DossierStickKey) => {
    if (!p.onStick) return null;
    const on = stuck.includes(key);
    const what = t(`b.dossier.stick.what.${key}`);
    return (
      <IconButton
        icon="pin"
        size="small"
        className="t-b-stick__pin"
        label={t(on ? "b.dossier.stick.unpin" : "b.dossier.stick.pin", { what })}
        pressed={on}
        data-testid={`stick-${key}`}
        onClick={() => p.onStick?.(key, !on)}
      />
    );
  };
  const path = (inStrip: boolean) => (
    <Breadcrumbs
      crumbs={
        inStrip
          ? crumbsFor(p, r, text).map((c) => ({ ...c, siblings: undefined }))
          : crumbsFor(p, r, text)
      }
      openKey={inStrip ? null : p.siblingsOpen}
      onToggleSiblings={(k) => p.onToggleSiblings?.(k as CrumbLevel)}
      query={p.siblingsQuery}
      onQuery={p.onSiblingsQuery}
      onClose={p.onCloseSiblings}
    />
  );
  const status = (
    <div className="t-row t-row--wrap" style={{ gap: 8 }}>
      <KindBadge kind={r.kind} />
      <LifecycleBadge lifecycle={r.lifecycle} />
      {r.drift.length ? <Badge tone="warn">{t("b.common.drift")}</Badge> : null}
      {r.tickets.map((ticket) => (
        <Badge key={ticket} plain>
          {ticket}
        </Badge>
      ))}
    </div>
  );
  const idRow = (
    <div className="t-row t-row--wrap t-b-record__id">
      <span className="t-mono t-wrap">{r.id}</span>
      <Button
        size="small"
        variant="quiet"
        icon="copy"
        aria-label={t("b.dossier.copyId")}
        onClick={() => p.onCopy?.("id")}
      />
    </div>
  );

  const stickRow = (key: DossierStickKey, children: ReactNode) =>
    p.onStick ? (
      <div
        className="t-b-stick"
        tabIndex={-1}
        data-stuck={stuck.includes(key) || undefined}
        data-testid={`head-${key}`}
        ref={(el) => {
          rowRefs.current[key] = el;
        }}
      >
        <div className="t-b-stick__body">{children}</div>
        {pinButton(key)}
      </div>
    ) : (
      children
    );

  const shown = gone.filter((k) => stuck.includes(k));
  const strip = p.onStick ? (
    <div className="t-b-stuck" ref={stripRef}>
      {shown.length ? (
        <div
          className="t-b-stuck__inner t-float"
          role="region"
          aria-label={t("b.dossier.stick.region")}
          data-testid="dossier-stuck"
        >
          {DOSSIER_STICK_KEYS.filter((k) => shown.includes(k)).map((k) => (
            <div key={k} className="t-b-stick t-b-stuck__row" data-stuck data-testid={`stuck-${k}`}>
              <div className="t-b-stick__body">
                {k === "path" ? (
                  path(true)
                ) : k === "status" ? (
                  status
                ) : k === "name" ? (
                  <span className="t-b-stuck__name t-wrap">{r.slug}</span>
                ) : (
                  idRow
                )}
              </div>
              {pinButton(k)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ) : null;

  const head = (
    <header className="t-b-record__head t-stagger">
      {stickRow("path", path(false))}
      {stickRow("status", status)}
      {stickRow("name", <h1 className="t-b-record__title">{r.slug}</h1>)}
      {stickRow("id", idRow)}
      {r.summary ? (
        <p className="t-b-record__summary t-clamp-3">{r.summary}</p>
      ) : (
        <p className="t-b-record__summary t-muted">{t("b.dossier.noSummary")}</p>
      )}
      <div className="t-b-record__meta t-meta">
        <span>
          <Icon name="team" size={12} /> {r.owner ?? t("b.common.noTeam")}
        </span>
        <span>{t("b.dossier.created", { date: dateText(r.createdAt, t) })}</span>
        {r.logCount == null ? (
          <span data-testid="dossier-history-unmeasured" title={t("b.common.notMeasured")}>
            — · {t("b.dossier.historyUnmeasured")}
          </span>
        ) : (
          <span>
            {plural("b.common.commits", r.logCount)} ·{" "}
            {t("b.dossier.lastCommit", { date: dateText(lastChange, t) })}
          </span>
        )}
      </div>
      <div className="t-row t-row--wrap t-b-record__actions">
        <Button icon="chat" variant="primary" onClick={p.onAsk}>
          {t("b.dossier.askAtlas")}
        </Button>
        <Button
          icon="eye"
          pressed={p.tab === "raw"}
          onClick={() => p.onTab?.(p.tab === "raw" ? "record" : "raw")}
        >
          {t("b.dossier.viewRecord")}
        </Button>
      </div>
    </header>
  );

  const figures = (
    <div className="t-b-figures" role="group" aria-label={t("b.dossier.figures")}>
      <Figure
        icon="promise"
        label={t("b.common.promisesProven")}
        value={r.scenarioCount ? r.provenCount : null}
        of={r.scenarioCount || undefined}
        tone={r.scenarioCount && r.provenCount === r.scenarioCount ? "ok" : "warn"}
        foot={
          <ProofMosaic
            label={t("b.common.provenOf", { proven: r.provenCount, total: r.scenarioCount })}
            cells={Array.from({ length: r.scenarioCount }, (_, i) => ({
              id: `z${i}`,
              proven: i < r.provenCount,
            }))}
            size={mobile ? 8 : 10}
          />
        }
      />
      <Figure
        icon="anchor"
        label={t("b.common.anchors")}
        value={r.anchorCount}
        tone={r.anchorCount || assumption ? undefined : "plan"}
        foot={
          <span className="t-meta">
            {r.anchorCount
              ? t("b.dossier.inFiles", {
                  files: `${number(files)}${r.anchors.length < r.anchorCount ? "+" : ""}`,
                })
              : assumption
                ? t("b.dossier.anchorsNotExpected")
                : t("b.dossier.noAnchorYet")}
          </span>
        }
      />
      <Figure
        icon="test"
        label="Tests"
        value={r.testCount}
        tone={r.testCount || assumption ? undefined : "warn"}
        foot={
          <span className="t-meta">
            {Object.entries(kinds)
              .map(([k, n]) => `${n} ${k}`)
              .join(" · ") || t("b.dossier.noTestLinked")}
          </span>
        }
      />
      <Figure
        icon="knowledge"
        label={t("b.dossier.knowledgeAnswered")}
        value={5 - openKnowledge}
        of={5}
        tone={openKnowledge ? "warn" : "ok"}
        foot={
          <span className="t-meta">
            {openKnowledge
              ? t("b.dossier.openCount", { count: openKnowledge })
              : t("b.dossier.complete")}
          </span>
        }
      />
    </div>
  );

  const banners = (
    <>
      {r.kind === "assumption" ? (
        <Banner tone="signal" icon="info">
          <strong>{t("b.dossier.assumptionTitle")}</strong> {t("b.dossier.assumptionBody")}
        </Banner>
      ) : null}
      {r.lifecycle === "deprecated" ? (
        <Banner
          tone="warn"
          icon="warning"
          action={
            <Button
              size="small"
              icon="search"
              onClick={() =>
                p.onNavigate?.({ kind: "capability", id: `${r.domain}/${r.capability}` })
              }
            >
              {t("b.dossier.findSuccessor")}
            </Button>
          }
        >
          <strong>{t("b.dossier.deprecatedTitle")}</strong> {t("b.dossier.deprecatedBody")}
        </Banner>
      ) : null}
      {r.lifecycle === "planned" ? (
        <Banner
          tone="plan"
          icon="pin"
          action={
            r.anchorCount === 0 ? (
              <Button size="small" icon="copy" onClick={() => p.onCopy?.("anchor")}>
                {t("b.dossier.copyAnchor")}
              </Button>
            ) : undefined
          }
        >
          <strong>{t("b.dossier.plannedTitle")}</strong>{" "}
          {r.anchorCount === 0 ? (
            <>
              {t("b.dossier.plannedNoAnchorBefore")}{" "}
              <code className="t-mono">{`${TAG}: ${r.id}`}</code>
              {t("b.dossier.plannedNoAnchorAfter")}
            </>
          ) : (
            <>{t("b.dossier.plannedHasAnchor")}</>
          )}
        </Banner>
      ) : null}
      {r.drift.length ? (
        <Banner
          tone="warn"
          icon="drift"
          action={
            <Button size="small" onClick={() => p.onSection?.("drift")}>
              {t("b.dossier.toDrift")}
            </Button>
          }
        >
          <strong>{plural("b.dossier.driftFiles", r.drift.length)}</strong>{" "}
          {t("b.dossier.driftRest")}
        </Banner>
      ) : null}
    </>
  );

  const promises = (
    <DossierSection
      {...sec("promises")}
      title={t("b.common.promises")}
      meta={
        r.scenarioCount
          ? t("b.dossier.provenMeta", {
              proven: r.provenCount,
              total: r.scenarioCount,
              percent: pctText(provenPct, t),
            })
          : t("b.dossier.none")
      }
      actions={
        r.scenarios.length ? (
          <Segment
            label={t("b.dossier.filterPromises")}
            value={filter}
            options={[
              { value: "all", label: t("b.dossier.filterAll") },
              {
                value: "open",
                label: t("b.dossier.filterOpen", { count: r.scenarioCount - r.provenCount }),
              },
              { value: "proven", label: t("b.common.proven") },
            ]}
            onChange={p.onScenarioFilter}
          />
        ) : undefined
      }
    >
      {r.scenarios.length === 0 ? (
        <p className="t-muted">
          {r.kind === "assumption" ? t("b.dossier.assumptionNoPromise") : t("b.dossier.noScenario")}
        </p>
      ) : scenarios.length === 0 ? (
        <p className="t-muted">{t("b.dossier.noneInSelection")}</p>
      ) : (
        <div className="t-b-scns t-stagger">
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} s={s} onOpenTest={p.onOpenTest} />
          ))}
        </div>
      )}
      {r.scenarios.length < r.scenarioCount ? (
        <div className="t-b-more">
          <span className="t-meta">
            {t("b.common.shownOf", { shown: r.scenarios.length, total: r.scenarioCount })}
          </span>
          <Button
            size="small"
            variant="quiet"
            iconAfter="chevronDown"
            onClick={() => p.onMore?.("scenarios")}
          >
            {t("b.common.showAll", { count: r.scenarioCount })}
          </Button>
        </div>
      ) : null}
    </DossierSection>
  );

  const code = (
    <DossierSection
      {...sec("code")}
      title="Code"
      meta={plural("b.common.anchorCount", r.anchorCount)}
    >
      {r.anchors.length === 0 && assumption ? (
        <p className="t-muted">{t("b.dossier.assumptionNoAnchor")}</p>
      ) : r.anchors.length === 0 ? (
        <div className="t-b-noanchor">
          <p className="t-muted">{t("b.dossier.noSource")}</p>
          <CodeView
            label={t("b.dossier.anchorToInsert")}
            lang="go"
            text={`// ${TAG}: ${r.id}\n// ${TAG}-role: primary`}
          />
        </div>
      ) : (
        <>
          <Distribution
            label={t("b.dossier.anchorsByRole")}
            parts={Object.entries(roles).map(([k, n]) => ({
              key: k || "none",
              label: roleLabel(k, t),
              value: n,
              tone:
                k === "primary"
                  ? "var(--t-signal)"
                  : k === "config"
                    ? "var(--t-plan)"
                    : k === "data"
                      ? "var(--t-ok)"
                      : "var(--t-line-strong)",
            }))}
          />
          <ul className="t-b-anchors" aria-label={t("b.common.anchors")}>
            {r.anchors.map((a) => (
              <li key={`${a.path}:${a.line}`}>
                <button
                  type="button"
                  className="t-b-anchor"
                  aria-current={
                    p.openFile && p.openFile.path === a.path && p.openFile.line === a.line
                      ? "true"
                      : undefined
                  }
                  data-testid={`anchor-${a.path}:${a.line}`}
                  onClick={() => p.onOpenAnchor?.(a)}
                >
                  <Icon name={a.role === "config" ? "settings" : "code"} size={14} />
                  <span className="t-mono t-b-anchor__path">
                    <span className="t-muted">{a.path.slice(0, a.path.lastIndexOf("/") + 1)}</span>
                    {a.path.slice(a.path.lastIndexOf("/") + 1)}
                    <span className="t-b-anchor__line">:{a.line}</span>
                  </span>
                  <Badge
                    plain
                    tone={
                      a.role === "primary" ? "signal" : a.role === "config" ? "plan" : "neutral"
                    }
                  >
                    {roleLabel(a.role, t)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
          {r.anchors.length < r.anchorCount ? (
            <div className="t-b-more">
              <span className="t-meta">
                {t("b.common.shownOf", { shown: r.anchors.length, total: r.anchorCount })}
              </span>
              <Button
                size="small"
                variant="quiet"
                iconAfter="chevronDown"
                onClick={() => p.onMore?.("anchors")}
              >
                {t("b.common.showAll", { count: r.anchorCount })}
              </Button>
            </div>
          ) : null}
          {p.openFile ? (
            <SourceEditor
              file={p.openFile}
              recordId={r.id}
              zoom={p.codeZoom}
              onZoom={p.onCodeZoom}
              onClose={closeFile}
            />
          ) : null}
        </>
      )}
    </DossierSection>
  );

  const knowledge = (
    <DossierSection
      {...sec("knowledge")}
      title={t("b.dossier.rail.knowledge")}
      meta={t("b.dossier.answeredOf", { answered: 5 - openKnowledge })}
    >
      <div className="t-b-know">
        {KNOWLEDGE_SLOTS.map((slot) => {
          const answer = r.knowledge.find((k) => k.key === slot.key)?.answer ?? null;
          return (
            <article
              key={slot.key}
              className={cx("t-b-slot", !answer && "t-b-slot--open")}
              data-testid={`slot-${slot.key}`}
            >
              <header className="t-row">
                <span className="t-h3">{t(slot.label)}</span>
                <span className="t-spacer" />
                {answer ? null : <Badge tone="warn">{t("b.common.open")}</Badge>}
              </header>
              <p className="t-b-slot__q">{t(slot.question)}</p>
              {answer ? (
                <p className="t-b-slot__a">{answer}</p>
              ) : (
                <Button size="small" icon="edit" onClick={() => p.onAnswer?.(slot.key)}>
                  {t("b.dossier.proposeAnswer")}
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </DossierSection>
  );

  const drift = (
    <DossierSection
      {...sec("drift")}
      title={t("b.common.drift")}
      meta={r.drift.length ? plural("b.common.files", r.drift.length) : undefined}
    >
      {r.drift.length === 0 ? (
        <p className="t-b-calm">
          <Icon name="check" size={14} className="t-ok" /> {t("b.dossier.noDrift")}
        </p>
      ) : (
        <ul className="t-b-drift">
          {r.drift.map((d) => (
            <li key={d.path}>
              <Icon name="file" size={14} />
              <span className="t-mono t-wrap">{d.path}</span>
              <span className="t-meta">
                {t("b.dossier.changed", { date: dateText(d.changedAt, t) })}
              </span>
              <span className="t-spacer" />
              <Button
                size="small"
                variant="quiet"
                icon="eye"
                onClick={() => p.onOpenDrift?.(d.path)}
              >
                {t("b.dossier.change")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DossierSection>
  );

  const history = (
    <DossierSection
      {...sec("history")}
      title={t("b.dossier.rail.history")}
      meta={r.logCount == null ? "—" : plural("b.common.commits", r.logCount)}
      actions={
        r.log?.length ? (
          <CommitSpark dates={r.log.map((c) => c.date)} now={p.now ?? "2026-11"} />
        ) : undefined
      }
    >
      {r.log == null || r.logCount == null ? (
        <p
          className="t-muted"
          data-testid="dossier-log-unmeasured"
          title={t("b.common.notMeasured")}
        >
          — · {t("b.dossier.historyUnmeasured")}
        </p>
      ) : !r.log.length ? (
        <p className="t-muted" data-testid="dossier-log-empty">
          {t("b.dossier.noHistory")}
        </p>
      ) : (
        <ol className="t-b-log">
          {r.log.map((c) => (
            <li key={c.sha}>
              <span className="t-b-log__dot" aria-hidden="true" />
              <span className="t-mono t-meta">{dateText(c.date, t)}</span>
              <button
                type="button"
                className="t-b-link t-mono"
                onClick={() => p.onOpenCommit?.(c.sha)}
              >
                {c.sha}
              </button>
              <span className="t-b-log__subject">{c.subject}</span>
            </li>
          ))}
        </ol>
      )}
      {r.log && r.logCount != null && r.log.length < r.logCount ? (
        <div className="t-b-more">
          <span className="t-meta">
            {t("b.common.shownOf", { shown: r.log.length, total: r.logCount })}
          </span>
          <Button
            size="small"
            variant="quiet"
            iconAfter="chevronDown"
            onClick={() => p.onMore?.("log")}
          >
            {t("b.dossier.wholeHistory")}
          </Button>
        </div>
      ) : null}
    </DossierSection>
  );

  const linkList = (title: string, links: DossierLink[], empty: string) => (
    <div className="t-stack" style={{ gap: 6 }}>
      <span className="t-label">
        {title} <span className="t-meta">{links.length}</span>
      </span>
      {links.length ? (
        <div className="t-row t-row--wrap" style={{ gap: 6 }}>
          {links.map((l) => (
            <Chip key={l.id} mono onClick={() => p.onNavigate?.({ kind: "record", id: l.id })}>
              {l.id}
            </Chip>
          ))}
        </div>
      ) : (
        <span className="t-muted">{empty}</span>
      )}
    </div>
  );

  const relations = (
    <DossierSection {...sec("relations")} title={t("b.dossier.relationsTitle")}>
      {!mobile && (r.dependsOn.length || r.dependents.length) ? (
        <DependencyGraph
          center={r.id}
          upstream={r.dependsOn.map((d) => d.id)}
          downstream={r.dependents.map((d) => d.id)}
          onOpen={(id) => p.onNavigate?.({ kind: "record", id })}
        />
      ) : null}
      <div className="t-b-rel">
        {linkList(t("b.dossier.needs"), r.dependsOn, t("b.dossier.nothing"))}
        {linkList(t("b.dossier.neededBy"), r.dependents, t("b.dossier.nobody"))}
        {linkList(t("b.dossier.variants"), r.variants, t("b.dossier.none"))}
      </div>
    </DossierSection>
  );

  const operations = (
    <DossierSection {...sec("operations")} title={t("b.dossier.rail.operations")}>
      {r.observed ? (
        <p className="t-b-calm">
          <Badge tone="ok">{t("b.dossier.observed")}</Badge> {t("b.dossier.observedBody")}
        </p>
      ) : (
        <p className="t-b-calm t-muted">
          <span className="t-mono">—</span> {t("b.dossier.notObserved")}
        </p>
      )}
    </DossierSection>
  );

  const rules = (
    <DossierSection
      {...sec("rules")}
      title={t("b.dossier.rulesTitle")}
      meta={r.rules.length ? `${r.rules.length}` : undefined}
    >
      {r.rules.length ? (
        <ul className="t-b-rules">
          {r.rules.map((x) => (
            <li key={x.id}>
              <button type="button" className="t-b-rule" onClick={() => p.onOpenRule?.(x.id)}>
                <Icon name="rule" size={14} />
                <span className="t-stack" style={{ gap: 2 }}>
                  <span>{x.title}</span>
                  <span className="t-meta">{x.id}</span>
                </span>
                <Icon name="chevronRight" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-muted">{t("b.dossier.noRule")}</p>
      )}
    </DossierSection>
  );

  const raw = (
    <div className="t-b-raw t-anim-rise">
      <div className="t-row t-row--wrap" style={{ gap: 10 }}>
        <Segment
          label="Format"
          value={p.rawFormat ?? "yaml"}
          options={[
            { value: "yaml", label: "YAML" },
            { value: "json", label: "JSON" },
          ]}
          onChange={p.onRawFormat}
        />
        <span className="t-meta t-wrap">docs/facets/features/{r.id}.yaml</span>
        <span className="t-spacer" />
        <CodeZoom value={p.codeZoom} onChange={p.onCodeZoom} />
        <Button size="small" icon="copy" onClick={() => p.onCopy?.("raw")}>
          {t("b.dossier.copy")}
        </Button>
      </div>
      <CodeView
        label={t("b.dossier.recordAs", { format: p.rawFormat === "json" ? "JSON" : "YAML" })}
        lang={p.rawFormat === "json" ? "json" : "yaml"}
        text={p.rawFormat === "json" ? r.json : r.yaml}
        zoom={p.codeZoom}
      />
    </div>
  );

  const current = p.section ?? "promises";
  const pick = (k: string) => {
    p.onSection?.(k as DossierSectionKey);
    scrollTo(k as DossierSectionKey);
  };
  return (
    <div
      className={cx("t-page t-b-record t-anim-focus", mobile && "t-b-record--mobile")}
      data-testid="dossier"
    >
      {strip}
      {head}
      {figures}
      {banners}
      <Tabs
        label={t("b.dossier.view")}
        value={p.tab}
        items={[
          { value: "record", label: t("b.dossier.tab.record") },
          { value: "raw", label: t("b.dossier.tab.raw") },
        ]}
        onChange={p.onTab}
      />
      {p.tab === "raw" ? (
        raw
      ) : (
        <div className="t-b-record__body">
          {mobile ? (
            <SectionChips items={items} current={current} onPick={pick} />
          ) : (
            <aside className="t-b-record__rail">
              <SectionRail items={items} current={current} onPick={pick} />
              <div className="t-b-record__railfoot t-meta">
                {t(LIFECYCLE[r.lifecycle].label)} · {r.owner ?? t("b.common.noTeam")}
              </div>
            </aside>
          )}
          <div className="t-b-record__main" ref={mainRef}>
            {promises}
            {code}
            {knowledge}
            {drift}
            {history}
            {relations}
            {operations}
            {rules}
          </div>
        </div>
      )}
    </div>
  );
}
