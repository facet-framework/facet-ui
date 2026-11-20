import { localized } from "../../i18n/legacy/core/fixtures/taskflow-repo";

import type { RepoScan } from "../types";

export const FACETRC: string = `schema_version: "1.5"
records: docs/facets
schema: schema
sources:
  - apps
  - packages
  - crates
tools:
  repo:
    provider: github
    url: https://github.example.invalid/example/taskflow
    branch: main
  adr:
    path: "docs/adr/{id}.md"
  observability:
    signoz: https://signoz.taskflow.example.invalid
    grafana: https://grafana.taskflow.example.invalid
  storybook:
    url: https://storybook.taskflow.example.invalid
`;

export const INDEX: string = `records:
  - docs/facets/features/tasks/create/quick-add.yaml
  - docs/facets/features/tasks/recurring/repeat-rule.yaml
  - docs/facets/features/tasks/archive/bulk-archive.yaml
  - docs/facets/features/sync/queue/offline-queue.yaml
  - docs/facets/features/sync/conflict/last-write-wins.yaml
  - docs/facets/features/lists/core/list-store.yaml
  - docs/facets/features/lists/sharing/shared-lists.yaml
  - docs/facets/features/reminders/due/push-notification.yaml
  - docs/facets/features/notifications/delivery/channel-fanout.yaml
  - docs/facets/features/search/fulltext/task-search.yaml
  - docs/facets/policies/notifications/quiet-hours.yaml
  - docs/facets/policies/data/local-first-storage.yaml
  - docs/facets/assumptions/sync/clock-skew-bounded.yaml
  - docs/facets/assumptions/growth/push-optin-rate.yaml
  - docs/facets/data/tasks/task-item.yaml
  - docs/facets/data/lists/list.yaml
  - docs/facets/data/identity/user.yaml
`;

export const RECORDS: Record<string, string> = {
  "docs/facets/features/tasks/create/quick-add.yaml": localized.text1,

  "docs/facets/features/tasks/recurring/repeat-rule.yaml": localized.text2,

  "docs/facets/features/tasks/archive/bulk-archive.yaml": localized.text3,

  "docs/facets/features/sync/queue/offline-queue.yaml": localized.text4,

  "docs/facets/features/sync/conflict/last-write-wins.yaml": localized.text5,

  "docs/facets/features/lists/core/list-store.yaml": localized.text6,

  "docs/facets/features/lists/sharing/shared-lists.yaml": localized.text7,

  "docs/facets/features/reminders/due/push-notification.yaml": localized.text8,

  "docs/facets/features/notifications/delivery/channel-fanout.yaml": localized.text9,

  "docs/facets/features/search/fulltext/task-search.yaml": localized.text10,

  "docs/facets/policies/notifications/quiet-hours.yaml": localized.text11,

  "docs/facets/policies/data/local-first-storage.yaml": localized.text12,

  "docs/facets/assumptions/sync/clock-skew-bounded.yaml": localized.text13,

  "docs/facets/assumptions/growth/push-optin-rate.yaml": localized.text14,

  "docs/facets/data/tasks/task-item.yaml": localized.text15,

  "docs/facets/data/lists/list.yaml": localized.text16,

  "docs/facets/data/identity/user.yaml": localized.text17,
};

export const SCAN: RepoScan = {
  scannedAt: "2026-07-29T08:12:00Z",
  lastCommit: { sha: "9f3ac21", at: "2026-07-26T14:02:00Z", by: "nina@taskflow.example.invalid" },
  totalLoc: 84200,
  testLoc: 22800,
  testFiles: 96,
  trees: [
    { path: "apps", loc: 41200 },
    { path: "packages", loc: 31600 },
    { path: "crates", loc: 11400 },
  ],
  domainLoc: {
    tasks: 26400,
    sync: 18200,
    lists: 14900,
    reminders: 11600,
    notifications: 7300,
    search: 5800,
  },
  coverageReport: null,

  anchoredFiles: [
    { path: "apps/mobile/src/tasks/quick_add.ts", loc: 96 },
    { path: "apps/mobile/src/tasks/parse_input.ts", loc: 54 },
    { path: "apps/mobile/src/tasks/bulk_archive.ts", loc: 71 },
    { path: "apps/web/src/lists/sharing.tsx", loc: 142 },
    { path: "packages/core/src/repeat/rule.ts", loc: 118 },
    { path: "packages/core/src/lists/store.ts", loc: 233 },
    { path: "packages/core/src/lists/order.ts", loc: 47 },
    { path: "packages/core/src/reminders/due.ts", loc: 88 },
    { path: "packages/core/src/reminders/quiet_hours.ts", loc: 39 },
    { path: "packages/core/src/notifications/fanout.ts", loc: 76 },
    { path: "crates/sync/src/queue.rs", loc: 164 },
    { path: "crates/sync/src/quarantine.rs", loc: 58 },
    { path: "crates/sync/src/conflict.rs", loc: 91 },
  ],
  unanchoredFiles: [
    { path: "apps/mobile/src/tasks/quick_add.spec.ts", loc: 84 },
    { path: "apps/mobile/src/tasks/inline_edit.tsx", loc: 66 },
    { path: "apps/web/src/lists/sharing.spec.tsx", loc: 51 },
    { path: "apps/web/src/App.tsx", loc: 28 },
    { path: "packages/core/src/lists/store.spec.ts", loc: 112 },
    { path: "packages/core/src/util/id.ts", loc: 14 },
    { path: "packages/ui/src/Button.tsx", loc: 37 },
    { path: "crates/sync/src/backoff.rs", loc: 22 },
    { path: "crates/sync/tests/queue_test.rs", loc: 73 },
  ],
  anchors: {
    "tasks/create/quick-add": [
      {
        path: "apps/mobile/src/tasks/quick_add.ts",
        line: 48,
        role: "primary",
        excerpt: "export async function quickAdd(input: string) {",
      },
      {
        path: "apps/mobile/src/tasks/parse_input.ts",
        line: 12,
        role: "secondary",
        excerpt: "export function parseInput(raw: string): ParsedTask {",
      },
    ],
    "tasks/recurring/repeat-rule": [
      {
        path: "packages/core/src/repeat/rule.ts",
        line: 76,
        role: "primary",
        excerpt: "export function nextInstance(rule: RepeatRule, from: Date) {",
      },
    ],
    "tasks/archive/bulk-archive": [
      {
        path: "apps/mobile/src/tasks/bulk_archive.ts",
        line: 31,
        role: "primary",
        excerpt: "export function bulkArchive(ids: string[]) {",
      },
    ],
    "sync/queue/offline-queue": [
      {
        path: "crates/sync/src/queue.rs",
        line: 118,
        role: "primary",
        excerpt: "pub fn enqueue(&mut self, change: Change) -> Result<()> {",
      },
      {
        path: "crates/sync/src/quarantine.rs",
        line: 44,
        role: "secondary",
        excerpt: "pub fn quarantine(&mut self, item: QueueItem) {",
      },
    ],
    "sync/conflict/last-write-wins": [
      {
        path: "crates/sync/src/conflict.rs",
        line: 62,
        role: "primary",
        excerpt: "pub fn resolve(local: &Rev, remote: &Rev) -> Winner {",
      },
    ],
    "lists/core/list-store": [
      {
        path: "packages/core/src/lists/store.ts",
        line: 204,
        role: "primary",
        excerpt: "export class ListStore implements Store<List> {",
      },
      {
        path: "packages/core/src/lists/order.ts",
        line: 19,
        role: "secondary",
        excerpt: "export function fractionalIndex(a?: string, b?: string) {",
      },
    ],
    "lists/sharing/shared-lists": [
      {
        path: "apps/web/src/lists/sharing.tsx",
        line: 87,
        role: "primary",
        excerpt: "export function SharingPanel({ list }: Props) {",
      },
    ],
    "reminders/due/push-notification": [
      {
        path: "packages/core/src/reminders/due.ts",
        line: 55,
        role: "primary",
        excerpt: "export async function dispatchDue(now: Date) {",
      },
      {
        path: "packages/core/src/reminders/quiet_hours.ts",
        line: 23,
        role: "secondary",
        excerpt: "export function inQuietHours(zone: string, at: Date) {",
      },
    ],
    "notifications/delivery/channel-fanout": [
      {
        path: "packages/core/src/notifications/fanout.ts",
        line: 41,
        role: "primary",
        excerpt: "export async function fanout(msg: Message, prefs: Prefs) {",
      },
    ],
  },
  orphanAnchors: [
    { path: "apps/web/src/tasks/inline_edit.tsx", line: 64, id: "tasks/edit/inline-edit" },
  ],
  drift: [
    {
      id: "sync/conflict/last-write-wins",
      path: "crates/sync/src/conflict.rs",
      changedAt: "2026-07-26T14:02:00Z",
    },
  ],
};
