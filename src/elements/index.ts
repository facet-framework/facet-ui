import { labelText } from "../i18n/legacy/labels";
import {
  AnchorMap,
  Bar,
  Blind,
  Button,
  ClauseSheet,
  Companion,
  Counter,
  CoverageRing,
  DependencyFan,
  DepthLadder,
  Dot,
  EmptyState,
  EntryCards,
  ErrorState,
  EvidenceLedger,
  FieldRow,
  FieldSheet,
  FocusRow,
  GherkinStatement,
  GroupTiles,
  Hairline,
  IndexProgress,
  Kbd,
  KnowledgeSlots,
  LifecycleBadge,
  Mark,
  Markdown,
  ProbeNumber,
  ProofMatrix,
  QuietLine,
  RecordPicker,
  RecordSource,
  RestCloud,
  RoleGate,
  ScanValue,
  ScenarioLedger,
  Seal,
  SegmentBand,
  Sheet,
  SignalStack,
  Skeleton,
  Stack,
  StatValue,
  Surface,
  TestPyramid,
  Text,
  Timeline,
  Trail,
  type WithAnchorMapProps,
  type WithBarProps,
  type WithBlindProps,
  type WithButtonProps,
  type WithClauseSheetProps,
  type WithCompanionProps,
  type WithCounterProps,
  type WithCoverageRingProps,
  type WithDependencyFanProps,
  type WithDepthLadderProps,
  type WithDotProps,
  type WithEmptyStateProps,
  type WithEntryCardsProps,
  type WithErrorStateProps,
  type WithEvidenceLedgerProps,
  type WithFieldRowProps,
  type WithFieldSheetProps,
  type WithFocusRowProps,
  type WithGherkinStatementProps,
  type WithGroupTilesProps,
  type WithHairlineProps,
  type WithIndexProgressProps,
  type WithKbdProps,
  type WithKnowledgeSlotsProps,
  type WithLifecycleBadgeProps,
  type WithMarkProps,
  type WithMarkdownProps,
  type WithProbeNumberProps,
  type WithProofMatrixProps,
  type WithQuietLineProps,
  type WithRecordPickerProps,
  type WithRecordSourceProps,
  type WithRestCloudProps,
  type WithRoleGateProps,
  type WithScanValueProps,
  type WithScenarioLedgerProps,
  type WithSealProps,
  type WithSegmentBandProps,
  type WithSheetProps,
  type WithSignalStackProps,
  type WithSkeletonProps,
  type WithStackProps,
  type WithStatValueProps,
  type WithSurfaceProps,
  type WithTestPyramidProps,
  type WithTextProps,
  type WithTimelineProps,
  type WithTrailProps,
} from "../index";
import { defineFacetElement } from "./defineFacetElement";

export { defineFacetElement };
export type { AttributeKind, FacetElementDefinition } from "./defineFacetElement";

export const FACET_ELEMENT_TAGS = [
  "facet-anchor-map",
  "facet-bar",
  "facet-blind",
  "facet-button",
  "facet-clause-sheet",
  "facet-companion",
  "facet-counter",
  "facet-coverage-ring",
  "facet-dependency-fan",
  "facet-depth-ladder",
  "facet-dot",
  "facet-empty-state",
  "facet-entry-cards",
  "facet-error-state",
  "facet-evidence-ledger",
  "facet-field-row",
  "facet-field-sheet",
  "facet-focus-row",
  "facet-gherkin-statement",
  "facet-group-tiles",
  "facet-hairline",
  "facet-index-progress",
  "facet-kbd",
  "facet-knowledge-slots",
  "facet-lifecycle-badge",
  "facet-mark",
  "facet-markdown",
  "facet-probe-number",
  "facet-proof-matrix",
  "facet-quiet-line",
  "facet-record-picker",
  "facet-record-source",
  "facet-rest-cloud",
  "facet-role-gate",
  "facet-scan-value",
  "facet-scenario-ledger",
  "facet-seal",
  "facet-segment-band",
  "facet-sheet",
  "facet-signal-stack",
  "facet-skeleton",
  "facet-stack",
  "facet-stat-value",
  "facet-surface",
  "facet-test-pyramid",
  "facet-text",
  "facet-timeline",
  "facet-trail",
] as const;

export function defineFacetElements(): void {
  defineFacetElement<WithSealProps>({
    tag: "facet-seal",
    component: Seal,
    attributes: {
      present: { prop: "present", kind: "json" },
      height: { prop: "height", kind: "number" },
      "hide-count": { prop: "hideCount", kind: "boolean" },
    },
    defaults: { present: {} },
  });

  defineFacetElement<WithLifecycleBadgeProps>({
    tag: "facet-lifecycle-badge",
    component: LifecycleBadge,
    attributes: {
      lifecycle: { prop: "lifecycle", kind: "string" },
      "created-at": { prop: "createdAt", kind: "string" },
      "superseded-by": { prop: "supersededBy", kind: "string" },
    },
    defaults: { lifecycle: "active" },
  });

  defineFacetElement<WithGherkinStatementProps>({
    tag: "facet-gherkin-statement",
    component: GherkinStatement,
    attributes: {
      statement: { prop: "statement", kind: "string" },
      compact: { prop: "compact", kind: "boolean" },
    },
  });

  defineFacetElement<WithProofMatrixProps>({
    tag: "facet-proof-matrix",
    component: ProofMatrix,
    attributes: {
      scenarios: { prop: "scenarios", kind: "json" },
      "only-gaps": { prop: "onlyGaps", kind: "boolean" },
    },
    defaults: { scenarios: [] },
  });

  defineFacetElement<WithAnchorMapProps>({
    tag: "facet-anchor-map",
    component: AnchorMap,
    attributes: {
      anchors: { prop: "anchors", kind: "json" },
      lifecycle: { prop: "lifecycle", kind: "string" },
      "hide-excerpt": { prop: "hideExcerpt", kind: "boolean" },
    },
    defaults: { anchors: [] },
  });

  defineFacetElement<WithCoverageRingProps>({
    tag: "facet-coverage-ring",
    component: CoverageRing,
    attributes: {
      value: { prop: "value", kind: "number" },
      total: { prop: "total", kind: "number" },
      size: { prop: "size", kind: "number" },
    },
    defaults: { value: 0, total: 0 },
  });

  defineFacetElement<WithBarProps>({
    tag: "facet-bar",
    component: Bar,
    attributes: {
      value: { prop: "value", kind: "number" },
      total: { prop: "total", kind: "number" },
      label: { prop: "label", kind: "string" },
    },
    defaults: { value: 0, total: 0, label: labelText.text252 },
  });

  defineFacetElement<WithSegmentBandProps>({
    tag: "facet-segment-band",
    component: SegmentBand,
    attributes: {
      segments: { prop: "segments", kind: "json" },
      height: { prop: "height", kind: "number" },
    },
    defaults: { segments: [] },
  });

  defineFacetElement<WithStatValueProps>({
    tag: "facet-stat-value",
    component: StatValue,
    attributes: {
      label: { prop: "label", kind: "string" },
      value: { prop: "value", kind: "string" },
      hint: { prop: "hint", kind: "string" },
      meaning: { prop: "meaning", kind: "string" },
      size: { prop: "size", kind: "string" },
    },
    defaults: { label: "", value: "" },
  });

  defineFacetElement<WithTextProps>({
    tag: "facet-text",
    component: Text,
    attributes: {
      variant: { prop: "variant", kind: "string" },
      tone: { prop: "tone", kind: "string" },
      mono: { prop: "mono", kind: "boolean" },
      truncate: { prop: "truncate", kind: "boolean" },
      clamp: { prop: "clamp", kind: "number" },
    },
    children: true,
  });

  defineFacetElement<WithStackProps>({
    tag: "facet-stack",
    component: Stack,
    attributes: {
      direction: { prop: "direction", kind: "string" },
      gap: { prop: "gap", kind: "number" },
      align: { prop: "align", kind: "string" },
      justify: { prop: "justify", kind: "string" },
      wrap: { prop: "wrap", kind: "boolean" },
    },
    children: true,
  });

  defineFacetElement<WithSurfaceProps>({
    tag: "facet-surface",
    component: Surface,
    attributes: {
      tone: { prop: "tone", kind: "string" },
      padding: { prop: "padding", kind: "number" },
      edge: { prop: "edge", kind: "string" },
      rail: { prop: "rail", kind: "string" },
    },
    children: true,
  });

  defineFacetElement<WithHairlineProps>({
    tag: "facet-hairline",
    component: Hairline,
    attributes: {
      orientation: { prop: "orientation", kind: "string" },
      strength: { prop: "strength", kind: "string" },
      inset: { prop: "inset", kind: "number" },
    },
  });

  defineFacetElement<WithMarkProps>({
    tag: "facet-mark",
    component: Mark,
    attributes: {
      variant: { prop: "variant", kind: "string" },
      size: { prop: "size", kind: "number" },
      label: { prop: "label", kind: "string" },
    },
  });

  defineFacetElement<WithDotProps>({
    tag: "facet-dot",
    component: Dot,
    attributes: {
      meaning: { prop: "meaning", kind: "string" },
      size: { prop: "size", kind: "number" },
      hollow: { prop: "hollow", kind: "boolean" },
      label: { prop: "label", kind: "string" },
    },
  });

  defineFacetElement<WithCounterProps>({
    tag: "facet-counter",
    component: Counter,
    attributes: {
      value: { prop: "value", kind: "number" },
      unit: { prop: "unit", kind: "string" },
      duration: { prop: "duration", kind: "number" },
      animate: { prop: "animate", kind: "boolean" },
    },
    defaults: { value: 0 },
  });

  defineFacetElement<WithScanValueProps>({
    tag: "facet-scan-value",
    component: ScanValue,
    attributes: {
      origin: { prop: "origin", kind: "string" },
      "origin-label": { prop: "originLabel", kind: "string" },
    },
    children: true,
  });

  defineFacetElement<WithQuietLineProps>({
    tag: "facet-quiet-line",
    component: QuietLine,
    attributes: { tone: { prop: "tone", kind: "string" } },
    children: true,
  });

  defineFacetElement<WithKbdProps>({
    tag: "facet-kbd",
    component: Kbd,
    attributes: { keys: { prop: "keys", kind: "json" } },
  });

  defineFacetElement<WithSkeletonProps>({
    tag: "facet-skeleton",
    component: Skeleton,
    attributes: {
      height: { prop: "height", kind: "number" },
      width: { prop: "width", kind: "string" },
      label: { prop: "label", kind: "string" },
    },
  });

  defineFacetElement<WithFieldRowProps>({
    tag: "facet-field-row",
    component: FieldRow,
    attributes: {
      label: { prop: "label", kind: "string" },
      value: { prop: "value", kind: "string" },
      emphasis: { prop: "emphasis", kind: "boolean" },
      "label-width": { prop: "labelWidth", kind: "number" },
      "preserve-lines": { prop: "preserveLines", kind: "boolean" },
    },
  });

  defineFacetElement<WithProbeNumberProps>({
    tag: "facet-probe-number",
    component: ProbeNumber,
    attributes: {
      "probe-key": { prop: "probeKey", kind: "string" },
      "active-probe": { prop: "activeProbe", kind: "string" },
      label: { prop: "label", kind: "string" },
    },
    events: { onToggle: "facet-toggle" },
    children: true,
  });

  defineFacetElement<WithButtonProps>({
    tag: "facet-button",
    component: Button,
    attributes: {
      variant: { prop: "variant", kind: "string" },
      disabled: { prop: "disabled", kind: "boolean" },
    },
    events: { onClick: "facet-click" },
    children: true,
  });

  defineFacetElement<WithDepthLadderProps>({
    tag: "facet-depth-ladder",
    component: DepthLadder,
    attributes: {
      depth: { prop: "depth", kind: "number" },
      steps: { prop: "steps", kind: "json" },
      label: { prop: "label", kind: "string" },
    },
    events: { onDepthChange: "facet-depth-change" },
    defaults: { depth: 1 },
  });

  defineFacetElement<WithTrailProps>({
    tag: "facet-trail",
    component: Trail,
    attributes: { steps: { prop: "steps", kind: "json" } },
    defaults: { steps: [] },
  });

  defineFacetElement<WithRecordPickerProps>({
    tag: "facet-record-picker",
    component: RecordPicker,
    attributes: {
      items: { prop: "items", kind: "json" },
      placeholder: { prop: "placeholder", kind: "string" },
      limit: { prop: "limit", kind: "number" },
    },
    events: { onSelect: "facet-select" },
    defaults: { items: [] },
  });

  defineFacetElement<WithMarkdownProps>({
    tag: "facet-markdown",
    component: Markdown,
    attributes: {
      text: { prop: "text", kind: "string" },
      gap: { prop: "gap", kind: "number" },
    },
    defaults: { text: "" },
  });

  defineFacetElement<WithCompanionProps>({
    tag: "facet-companion",
    component: Companion,
    attributes: {
      entries: { prop: "entries", kind: "json" },
      reads: { prop: "reads", kind: "json" },
      scope: { prop: "scope", kind: "string" },
      intro: { prop: "intro", kind: "string" },
      foot: { prop: "foot", kind: "string" },
      draft: { prop: "draft", kind: "string" },
      busy: { prop: "busy", kind: "boolean" },
    },
    events: { onAsk: "facet-ask", onSend: "facet-send", onClose: "facet-close" },
    defaults: { entries: [], reads: [], suggestions: [] },
  });

  defineFacetElement<WithRoleGateProps>({
    tag: "facet-role-gate",
    component: RoleGate,
    attributes: { fallback: { prop: "fallback", kind: "string" } },
    events: { onPick: "facet-pick" },
  });

  defineFacetElement<WithFocusRowProps>({
    tag: "facet-focus-row",
    component: FocusRow,
    attributes: {
      id: { prop: "id", kind: "string" },
      rank: { prop: "rank", kind: "number" },
      title: { prop: "title", kind: "string" },
      why: { prop: "why", kind: "string" },
      meta: { prop: "meta", kind: "string" },
      overdue: { prop: "overdue", kind: "boolean" },
      "open-id": { prop: "openId", kind: "string" },
      dimmed: { prop: "dimmed", kind: "boolean" },
    },
    events: { onOpenChange: "facet-open-change", onDeeper: "facet-deeper" },
    children: true,
  });

  defineFacetElement<WithRestCloudProps>({
    tag: "facet-rest-cloud",
    component: RestCloud,
    attributes: {
      items: { prop: "items", kind: "json" },
      expanded: { prop: "expanded", kind: "boolean" },
    },
    events: { onToggle: "facet-toggle" },
    defaults: { items: [] },
  });

  defineFacetElement<WithSheetProps>({
    tag: "facet-sheet",
    component: Sheet,
    attributes: {
      open: { prop: "open", kind: "boolean" },
      label: { prop: "label", kind: "string" },
      height: { prop: "height", kind: "string" },
    },
    events: { onClose: "facet-close" },
    children: true,
  });

  defineFacetElement<WithBlindProps>({
    tag: "facet-blind",
    component: Blind,
    attributes: {
      open: { prop: "open", kind: "boolean" },
      label: { prop: "label", kind: "string" },
      width: { prop: "width", kind: "string" },
    },
    events: { onClose: "facet-close" },
    children: true,
  });

  defineFacetElement<WithEmptyStateProps>({
    tag: "facet-empty-state",
    component: EmptyState,
    attributes: {
      headline: { prop: "headline", kind: "string" },
      body: { prop: "body", kind: "string" },
      tone: { prop: "tone", kind: "string" },
    },
    defaults: { headline: "" },
  });

  defineFacetElement<WithErrorStateProps>({
    tag: "facet-error-state",
    component: ErrorState,
    attributes: {
      error: { prop: "error", kind: "string" },
      path: { prop: "path", kind: "string" },
      "retry-label": { prop: "retryLabel", kind: "string" },
    },
    events: { onRetry: "facet-retry" },
  });

  defineFacetElement<WithIndexProgressProps>({
    tag: "facet-index-progress",
    component: IndexProgress,
    attributes: {
      status: { prop: "status", kind: "json" },
      root: { prop: "root", kind: "string" },
      registry: { prop: "registry", kind: "string" },
      "history-length": { prop: "historyLength", kind: "number" },
    },
  });

  defineFacetElement<WithScenarioLedgerProps>({
    tag: "facet-scenario-ledger",
    component: ScenarioLedger,
    attributes: {
      scenarios: { prop: "scenarios", kind: "json" },
      "only-gaps": { prop: "onlyGaps", kind: "boolean" },
    },
    defaults: { scenarios: [] },
  });

  defineFacetElement<WithTestPyramidProps>({
    tag: "facet-test-pyramid",
    component: TestPyramid,
    attributes: {
      counts: { prop: "counts", kind: "json" },
      kinds: { prop: "kinds", kind: "json" },
    },
    defaults: { counts: {} },
  });

  defineFacetElement<WithKnowledgeSlotsProps>({
    tag: "facet-knowledge-slots",
    component: KnowledgeSlots,
    attributes: { slots: { prop: "slots", kind: "json" } },
    defaults: { slots: [] },
  });

  defineFacetElement<WithClauseSheetProps>({
    tag: "facet-clause-sheet",
    component: ClauseSheet,
    attributes: { clauses: { prop: "clauses", kind: "json" } },
    defaults: { clauses: [] },
  });

  defineFacetElement<WithFieldSheetProps>({
    tag: "facet-field-sheet",
    component: FieldSheet,
    attributes: { fields: { prop: "fields", kind: "json" } },
    defaults: { fields: [] },
  });

  defineFacetElement<WithEvidenceLedgerProps>({
    tag: "facet-evidence-ledger",
    component: EvidenceLedger,
    attributes: { evidence: { prop: "evidence", kind: "json" } },
    defaults: { evidence: [] },
  });

  defineFacetElement<WithSignalStackProps>({
    tag: "facet-signal-stack",
    component: SignalStack,
    attributes: {
      slos: { prop: "slos", kind: "json" },
      alerts: { prop: "alerts", kind: "json" },
      "only-gaps": { prop: "onlyGaps", kind: "boolean" },
    },
  });

  defineFacetElement<WithDependencyFanProps>({
    tag: "facet-dependency-fan",
    component: DependencyFan,
    attributes: {
      edges: { prop: "edges", kind: "json" },
      depth: { prop: "depth", kind: "json" },
      ghosts: { prop: "ghosts", kind: "json" },
    },
    events: { onOpen: "facet-open" },
    defaults: { edges: [] },
  });

  defineFacetElement<WithEntryCardsProps>({
    tag: "facet-entry-cards",
    component: EntryCards,
    attributes: {
      entries: { prop: "entries", kind: "json" },
      "card-width": { prop: "cardWidth", kind: "number" },
      "empty-text": { prop: "emptyText", kind: "string" },
    },
    events: { onOpen: "facet-open" },
    defaults: { entries: [] },
  });

  defineFacetElement<WithGroupTilesProps>({
    tag: "facet-group-tiles",
    component: GroupTiles,
    attributes: {
      groups: { prop: "groups", kind: "json" },
      noun: { prop: "noun", kind: "string" },
      unit: { prop: "unit", kind: "string" },
      "share-noun": { prop: "shareNoun", kind: "string" },
      "tile-width": { prop: "tileWidth", kind: "number" },
      "empty-text": { prop: "emptyText", kind: "string" },
    },
    events: { onOpen: "facet-open" },
    defaults: { groups: [] },
  });

  defineFacetElement<WithTimelineProps>({
    tag: "facet-timeline",
    component: Timeline,
    attributes: {
      events: { prop: "events", kind: "json" },
      unit: { prop: "unit", kind: "string" },
      bucket: { prop: "bucket", kind: "string" },
      height: { prop: "height", kind: "number" },
      "empty-text": { prop: "emptyText", kind: "string" },
    },
    defaults: { events: [] },
  });

  defineFacetElement<WithRecordSourceProps>({
    tag: "facet-record-source",
    component: RecordSource,
    attributes: {
      raw: { prop: "raw", kind: "string" },
      path: { prop: "path", kind: "string" },
    },
  });
}

defineFacetElements();
