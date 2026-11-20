/**
 * TaskFlow — a demo repository for Atlas. Real YAML texts, as they lie in a
 * repository: .facetrc.yaml, an index and 17 records. Atlas parses these
 * texts at runtime. SCAN is host material (a repository scan), not part of
 * the FACET schema.
 *
 * Taken over from the design prototype (project/data/taskflow-repo.js).
 */
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
  "docs/facets/features/tasks/create/quick-add.yaml": `schema_version: "1.3"
id: tasks/create/quick-add
lifecycle: active
intent:
  summary: |
    Creates a task from a single line of input. Recognizes the due date
    ("tomorrow 9:00"), list ("#groceries") and priority ("!high") while typing
    and works offline with a local queue.
  decision_records:
    - ADR-007
    - ADR-019
contract:
  scenarios:
    - id: task-added
      statement: |
        Given a user types "Buy milk tomorrow 9:00 #groceries"
        When they press Enter
        Then the task is created with its due date and list and appears at the top right away
      pre_state:
        tasks_in_list: 4
        due_date: none
      post_state:
        tasks_in_list: 5
        due_date: parsed
        list: groceries
    - id: empty-title-rejected
      statement: |
        Given the input field is empty or contains only whitespace
        When the user presses Enter
        Then no task is created and the field shows a hint
    - id: offline-queue-handoff
      statement: |
        Given the device is offline
        When a task is created
        Then it lands in the local queue and syncs exactly once on reconnect
      pre_state:
        queue_length: 0
      post_state:
        queue_length: 1
        sync_status: pending
verification:
  unit_tests:
    - id: src/tasks/quick_add.test.ts
      proves: [task-added, empty-title-rejected]
    - id: src/tasks/parse_input.test.ts
      proves: [task-added]
  integration_tests:
    - id: test/integration/offline_queue.test.ts
      proves: [offline-queue-handoff]
  e2e_tests:
    - id: e2e/quick-add.spec.ts
      proves: [task-added]
observation:
  slos:
    - name: Quick-add success rate
      target: 99.5
      window: 28d
      query: sum(rate(task_created_total[5m])) / sum(rate(task_create_attempt_total[5m]))
      query_source: prometheus
  alerts:
    - name: QuickAddErrorRate
      condition: rate(task_create_errors[5m]) > 0.01
      severity: critical
      runbook: docs/runbooks/quick-add.md
  continuous_checks:
    - id: synthetic-quick-add
      frequency: 5m
knowledge:
  prerequisite_knowledge:
    question: What does the user already need to understand?
    answer: Nothing — the syntax is visualized as chips while typing.
  not_for:
    question: When is this the wrong tool?
    answer: Not for tasks with subtasks or attachments — open the full editor for those.
  discoverability:
    question: Where does the user get in?
    derive_from: [anchors, tests]
  success_signal:
    question: How does the user know it worked?
    answer: The task appears at the top of the list right away, with a date chip.
lineage:
  owner:
    team: tasks
    individual: lena@taskflow.example.invalid
  created_at: "2026-05-12"
  superseded_by: null
  depends_on:
    - lists/core/list-store
    - sync/queue/offline-queue
  depended_on_by:
    - reminders/due/push-notification
    - tasks/recurring/repeat-rule
  related_policies:
    - policy/data/local-first-storage
  related_assumptions:
    - assumption/sync/clock-skew-bounded
  related_data_entities:
    - data/tasks/task-item
  change_history_ref: CHANGELOG.md#quick-add
`,

  "docs/facets/features/tasks/recurring/repeat-rule.yaml": `schema_version: "1.4"
id: tasks/recurring/repeat-rule
lifecycle: active
intent:
  summary: |
    Rules such as "every other Monday" create the next instance only when
    the previous one is completed — no upfront flood in the inbox.
  decision_records:
    - ADR-023
contract:
  scenarios:
    - id: next-instance-on-complete
      statement: |
        Given a task with the rule "every Monday" is open
        When the user completes it
        Then exactly one new instance is created with the next Monday as its due date
      pre_state:
        open_instances: 1
      post_state:
        open_instances: 1
        completed: 1
    - id: rule-edit-keeps-history
      statement: |
        Given a rule is changed
        When completed instances already exist
        Then they stay unchanged and only future ones follow the new rule
    - id: dst-shift-preserves-local-time
      statement: |
        Given a rule hits a daylight-saving changeover day
        When the next instance is created
        Then it keeps the local time of day, not the UTC offset
verification:
  unit_tests:
    - id: src/tasks/repeat_rule.test.ts
      proves: [next-instance-on-complete, rule-edit-keeps-history]
  integration_tests:
    - id: test/integration/repeat_dst.test.ts
      proves: [dst-shift-preserves-local-time]
observation:
  slos:
    - name: Instance creation correct
      target: 99.9
      window: 30d
      query: 1 - rate(repeat_instance_errors[1h])
      query_source: prometheus
  alerts:
    - name: RepeatInstanceDrift
      condition: repeat_instance_lag_seconds > 900
      severity: warning
      runbook: docs/runbooks/repeat-rule.md
knowledge:
  prerequisite_knowledge:
    question: What does the user already need to understand?
    answer: The difference between due date and repetition — the two are shown separately.
  not_for:
    question: When is this the wrong tool?
    answer: Not for calendar events with guests; the calendar integration is meant for those.
  success_signal:
    question: How does the user know it worked?
    answer: After completing it, the next instance with a new date is in the list right away.
lineage:
  owner:
    team: tasks
    individual: lena@taskflow.example.invalid
  created_at: "2026-05-28"
  superseded_by: null
  depends_on:
    - tasks/create/quick-add
  depended_on_by:
    - reminders/due/push-notification
  related_assumptions:
    - assumption/sync/clock-skew-bounded
  related_data_entities:
    - data/tasks/task-item
`,

  "docs/facets/features/tasks/archive/bulk-archive.yaml": `schema_version: "1.3"
id: tasks/archive/bulk-archive
lifecycle: deprecated
intent:
  summary: |
    Archive several completed tasks in one go. Replaced by
    the automatic cleanup rule in lists/core/list-store.
contract:
  scenarios:
    - id: archive-selected
      statement: |
        Given several completed tasks are selected
        When the user chooses archive
        Then they disappear from the list and remain findable in the archive
verification:
  unit_tests:
    - id: src/tasks/bulk_archive.test.ts
      proves: [archive-selected]
knowledge:
  not_for:
    question: When is this the wrong tool?
    answer: Do not use any more — the cleanup rule does this automatically.
lineage:
  owner:
    team: tasks
    individual: lena@taskflow.example.invalid
  created_at: "2026-05-14"
  superseded_by: lists/core/list-store
  depends_on:
    - lists/core/list-store
  related_data_entities:
    - data/tasks/task-item
`,

  "docs/facets/features/sync/queue/offline-queue.yaml": `schema_version: "1.5"
id: sync/queue/offline-queue
lifecycle: active
intent:
  summary: |
    Changes are written locally and transmitted exactly once on
    reconnect. The queue survives app restarts.
  decision_records:
    - ADR-011
contract:
  scenarios:
    - id: exactly-once-delivery
      statement: |
        Given three changes are in the queue
        When the connection returns
        Then each change is transmitted exactly once, in original order
      pre_state:
        queue_length: 3
        online: false
      post_state:
        queue_length: 0
        online: true
        duplicates: 0
    - id: queue-survives-restart
      statement: |
        Given the queue is not empty
        When the app restarts
        Then the queue is still there, unchanged
    - id: poison-item-quarantine
      statement: |
        Given an item fails three times at the server
        When the next attempt is due
        Then it moves to quarantine and does not block the queue
verification:
  unit_tests:
    - id: src/sync/queue.test.ts
      proves: [queue-survives-restart]
  integration_tests:
    - id: test/integration/exactly_once.test.ts
      proves: [exactly-once-delivery]
observation:
  slos:
    - name: Sync lag p95
      target: 99.0
      window: 30d
      query: histogram_quantile(0.95, rate(sync_lag_seconds_bucket[5m])) < 30
      query_source: grafana
  alerts:
    - name: SyncQueueStalled
      condition: sync_queue_age_seconds > 3600
      severity: critical
      runbook: docs/runbooks/sync-queue.md
    - name: PoisonItems
      condition: sync_quarantine_total > 0
      severity: warning
  continuous_checks:
    - id: synthetic-sync-roundtrip
      frequency: 15m
knowledge:
  prerequisite_knowledge:
    question: What does a developer need to know?
    answer: The queue is per device, not per user — two devices sync independently.
  not_for:
    question: When is this the wrong tool?
    answer: Not a substitute for conflict resolution; sync/conflict/last-write-wins does that.
  limitations:
    question: Where are the limits?
    answer: Above 500 waiting items, transmission is batched and slower.
lineage:
  owner:
    team: sync
    individual: tarek@taskflow.example.invalid
  created_at: "2026-05-19"
  superseded_by: null
  depends_on:
    - billing/quota/device-limit
  depended_on_by:
    - tasks/create/quick-add
    - sync/conflict/last-write-wins
  related_policies:
    - policy/data/local-first-storage
  related_assumptions:
    - assumption/sync/clock-skew-bounded
  related_data_entities:
    - data/tasks/task-item
`,

  "docs/facets/features/sync/conflict/last-write-wins.yaml": `schema_version: "1.5"
id: sync/conflict/last-write-wins
lifecycle: active
intent:
  summary: |
    Conflicts resolve in favor of the most recent write. The
    discarded state stays retrievable as a version for 30 days.
  decision_records:
    - ADR-012
contract:
  scenarios:
    - id: newest-write-wins
      statement: |
        Given two devices change the same task offline
        When both sync
        Then the newer timestamp wins and the older state is stored as a version
      pre_state:
        versions: 0
      post_state:
        versions: 1
    - id: equal-timestamp-tiebreak
      statement: |
        Given two changes carry the same timestamp
        When they collide
        Then the device ID decides deterministically
    - id: version-retention
      statement: |
        Given a discarded version is 30 days old
        When the cleanup run starts
        Then it is deleted
verification:
  unit_tests:
    - id: src/sync/conflict.test.ts
      proves: [newest-write-wins, equal-timestamp-tiebreak]
observation:
  slos:
    - name: Conflict rate
      target: 99.0
      window: 28d
      query: 1 - rate(sync_conflicts_total[1h]) / rate(sync_writes_total[1h])
      query_source: prometheus
  alerts:
    - name: ConflictSpike
      condition: rate(sync_conflicts_total[15m]) > 5
      severity: warning
knowledge:
  prerequisite_knowledge:
    question: What does a developer need to know?
    answer: Timestamps come from the device — the assumption about clock skew is load-bearing.
  limitations:
    question: Where are the limits?
    answer: There is no field-by-field merging; the whole record always wins.
lineage:
  owner:
    team: sync
    individual: tarek@taskflow.example.invalid
  created_at: "2026-06-02"
  superseded_by: null
  depends_on:
    - sync/queue/offline-queue
  related_assumptions:
    - assumption/sync/clock-skew-bounded
  related_data_entities:
    - data/tasks/task-item
`,

  "docs/facets/features/lists/core/list-store.yaml": `schema_version: "1.4"
id: lists/core/list-store
lifecycle: active
intent:
  summary: |
    Lists as shared storage with a stable order that stays the same even after
    offline merges. Cleans up completed tasks automatically.
  decision_records:
    - ADR-004
contract:
  scenarios:
    - id: stable-order-after-merge
      statement: |
        Given two devices insert tasks at the same time
        When both sync
        Then the order is identical on both devices
      pre_state:
        items: 4
      post_state:
        items: 6
        order_hash: equal
    - id: auto-cleanup-after-30d
      statement: |
        Given a task has been completed for 30 days
        When the cleanup run starts
        Then it moves to the archive
    - id: rename-keeps-references
      statement: |
        Given a list is renamed
        When tasks refer to it
        Then all references stay valid
verification:
  unit_tests:
    - id: src/lists/store.test.ts
      proves: [stable-order-after-merge, rename-keeps-references]
  integration_tests:
    - id: test/integration/cleanup.test.ts
      proves: [auto-cleanup-after-30d]
  e2e_tests:
    - id: e2e/list-order.spec.ts
      proves: [stable-order-after-merge]
observation:
  slos:
    - name: List load time p95
      target: 99.5
      window: 28d
      query: histogram_quantile(0.95, rate(list_load_ms_bucket[5m])) < 250
      query_source: grafana
  alerts:
    - name: ListLoadSlow
      condition: p95_list_load_ms > 600
      severity: warning
      runbook: docs/runbooks/list-store.md
knowledge:
  prerequisite_knowledge:
    question: What does a developer need to know?
    answer: The ordering uses fractional indexes, not integer positions.
  not_for:
    question: When is this the wrong tool?
    answer: Not as a general-purpose database for objects that are not lists.
  success_signal:
    question: How does the user know it worked?
    answer: After switching between devices, the list is in the same order.
  limitations:
    question: Where are the limits?
    answer: Above 5000 items per list, the ordering is reassigned.
lineage:
  owner:
    team: tasks
    individual: nina@taskflow.example.invalid
  created_at: "2026-05-12"
  superseded_by: null
  depended_on_by:
    - tasks/create/quick-add
    - tasks/archive/bulk-archive
    - lists/sharing/shared-lists
  related_policies:
    - policy/data/local-first-storage
  related_data_entities:
    - data/lists/list
    - data/tasks/task-item
`,

  "docs/facets/features/lists/sharing/shared-lists.yaml": `schema_version: "1.4"
id: lists/sharing/shared-lists
lifecycle: active
intent:
  summary: |
    Share lists with others, with roles per list: View, Edit,
    Manage. Invitations go through a link with an expiry date.
contract:
  scenarios:
    - id: invite-link-expires
      statement: |
        Given an invitation link is older than 7 days
        When someone opens it
        Then access is denied and a new link is requested
    - id: viewer-cannot-edit
      statement: |
        Given a user has the View role
        When they try to change a task
        Then the change is rejected and the interface shows the reason
    - id: owner-transfer
      statement: |
        Given the owner leaves the list
        When they hand over the role
        Then exactly one other member has the Manage role
verification:
  unit_tests:
    - id: src/lists/roles.test.ts
      proves: [viewer-cannot-edit]
  integration_tests:
    - id: test/integration/invite_link.test.ts
      proves: [invite-link-expires]
observation:
  alerts:
    - name: InviteAbuse
      condition: rate(invite_created_total[10m]) > 50
      severity: warning
knowledge:
  prerequisite_knowledge:
    question: What does the user already need to understand?
    answer: That roles apply per list, not per account.
  not_for:
    question: When is this the wrong tool?
    answer: Not an organization management tool — workspaces exist for teams.
lineage:
  owner:
    team: growth
    individual: samir@taskflow.example.invalid
  created_at: "2026-06-18"
  superseded_by: null
  depends_on:
    - lists/core/list-store
    - identity/access/role-check
  related_policies:
    - policy/data/local-first-storage
  related_data_entities:
    - data/lists/list
    - data/identity/user
`,

  "docs/facets/features/reminders/due/push-notification.yaml": `schema_version: "1.3"
id: reminders/due/push-notification
lifecycle: active
intent:
  summary: |
    Due tasks announce themselves by push. Delivery respects
    the recipient's time zone and quiet hours.
  decision_records:
    - ADR-016
contract:
  scenarios:
    - id: due-triggers-push
      statement: |
        Given a task becomes due
        When the recipient is not in quiet hours
        Then they receive a push message within 60 seconds
      pre_state:
        pushes_sent: 0
      post_state:
        pushes_sent: 1
    - id: quiet-hours-suppress
      statement: |
        Given the recipient's local time is between 22:00 and 07:00
        When a task becomes due
        Then the message is held back until 07:00
      pre_state:
        pushes_sent: 0
      post_state:
        pushes_sent: 0
        deferred: 1
    - id: no-duplicate-push
      statement: |
        Given a task has already been reported
        When the delivery run sees it again
        Then no second message is sent
verification:
  unit_tests:
    - id: src/reminders/quiet_hours.test.ts
      proves: [quiet-hours-suppress]
  integration_tests:
    - id: test/integration/due_push.test.ts::sends one push when a due task reaches a closed app
      proves: [due-triggers-push]
observation:
  slos:
    - name: Delivery under 60 s
      target: 99.0
      window: 28d
      query: histogram_quantile(0.95, rate(push_delay_seconds_bucket[5m])) < 60
      query_source: prometheus
  alerts:
    - name: PushBacklog
      condition: push_queue_depth > 1000
      severity: critical
    - name: QuietHoursViolation
      condition: quiet_hours_breach_total > 0
      severity: critical
      runbook: docs/runbooks/quiet-hours.md
  continuous_checks:
    - id: synthetic-due-push
      frequency: 1h
knowledge:
  prerequisite_knowledge:
    question: What does a developer need to know?
    answer: The local time comes from the device profile, not from the IP address.
  success_signal:
    question: How does the user know it worked?
    answer: The message arrives at the right time and not at night.
lineage:
  owner:
    team: growth
    individual: samir@taskflow.example.invalid
  created_at: "2026-06-05"
  superseded_by: null
  depends_on:
    - tasks/create/quick-add
    - notifications/delivery/channel-fanout
  related_policies:
    - policy/notifications/quiet-hours
  related_assumptions:
    - assumption/growth/push-optin-rate
  related_data_entities:
    - data/identity/user
`,

  "docs/facets/features/notifications/delivery/channel-fanout.yaml": `schema_version: "1.5"
id: notifications/delivery/channel-fanout
lifecycle: active
intent:
  summary: |
    One channel for all outputs — push, mail, in-app — with uniform
    suppression during quiet hours.
contract:
  scenarios:
    - id: fanout-respects-preferences
      statement: |
        Given a user has opted out of mail
        When a notification is raised
        Then it goes out only via push and in-app
    - id: single-suppression-point
      statement: |
        Given quiet hours apply
        When a notification goes out through any channel
        Then the same suppression applies
verification:
  unit_tests:
    - id: src/notifications/fanout.test.ts
      proves: [fanout-respects-preferences, single-suppression-point]
  e2e_tests:
    - id: e2e/notification-prefs.spec.ts
      proves: [fanout-respects-preferences]
observation:
  slos:
    - name: Fanout success rate
      target: 99.9
      window: 30d
      query: 1 - rate(fanout_errors[5m]) / rate(fanout_total[5m])
      query_source: prometheus
  alerts:
    - name: FanoutErrors
      condition: rate(fanout_errors[5m]) > 0.02
      severity: critical
      runbook: docs/runbooks/fanout.md
knowledge:
  prerequisite_knowledge:
    question: What does a developer need to know?
    answer: New channels register themselves; they are not hard-coded.
  limitations:
    question: Where are the limits?
    answer: No delivery guarantee for mail — only handover to the sender applies there.
lineage:
  owner:
    team: platform
    individual: rui@taskflow.example.invalid
  created_at: "2026-06-21"
  superseded_by: null
  depended_on_by:
    - reminders/due/push-notification
  related_policies:
    - policy/notifications/quiet-hours
  related_data_entities:
    - data/identity/user
`,

  "docs/facets/features/search/fulltext/task-search.yaml": `schema_version: "1.5"
id: search/fulltext/task-search
lifecycle: planned
intent:
  summary: |
    Full text over tasks and lists, with filters by list, due date
    and person. Not implemented yet.
contract:
  scenarios:
    - id: search-finds-by-title
      statement: |
        Given a task contains "Milk" in its title
        When the user searches for "milk"
        Then it appears in the result, regardless of upper and lower case
    - id: search-respects-sharing
      statement: |
        Given a task is in a list that is not shared
        When another user searches
        Then it does not appear in the result
lineage:
  owner:
    team: platform
    individual: rui@taskflow.example.invalid
  created_at: "2026-07-21"
  superseded_by: null
  depends_on:
    - lists/core/list-store
  related_data_entities:
    - data/tasks/task-item
`,

  "docs/facets/policies/notifications/quiet-hours.yaml": `schema_version: "1.5"
id: policy/notifications/quiet-hours
lifecycle: active
intent:
  summary: |
    Quiet hours for outgoing messages. Protects the recipients' night
    rest and meets the consent requirements.
  regulatory_basis:
    - GDPR Art. 6(1)(f)
    - TTDSG § 25(1)
contract:
  clauses:
    - id: QH-1
      requirement: |
        Push messages MUST be suppressed between 22:00 and 07:00 in the
        recipient's local time.
    - id: QH-2
      requirement: |
        Security-critical notices MAY break through quiet hours
        if the breakthrough is logged.
    - id: QH-3
      requirement: |
        The local time SHOULD come from the device profile, not from the
        IP address.
scope:
  domains:
    - reminders
    - notifications
  features:
    - reminders/due/push-notification
verification:
  compliance_checks:
    - id: quiet-hours-audit
      last_established: "2026-04-12"
      frequency: quarterly
      next_due: "2026-07-12"
  audit_artifacts:
    - docs/audit/quiet-hours-2026-Q2.pdf
lineage:
  owner:
    team: platform
    individual: rui@taskflow.example.invalid
  created_at: "2026-05-30"
  superseded_by: null
  depended_on_by:
    - reminders/due/push-notification
    - notifications/delivery/channel-fanout
`,

  "docs/facets/policies/data/local-first-storage.yaml": `schema_version: "1.4"
id: policy/data/local-first-storage
lifecycle: active
intent:
  summary: |
    Data lives on the device first. Server copies are replicas and
    may only rest encrypted.
  regulatory_basis:
    - GDPR Art. 32
contract:
  clauses:
    - id: LF-1
      requirement: |
        User data MUST be stored encrypted on the device.
    - id: LF-2
      requirement: |
        Server-side replicas MUST be encrypted at rest.
    - id: LF-3
      requirement: |
        Exporting one's own data MUST be possible in
        machine-readable form.
    - id: LF-4
      requirement: |
        Telemetry SHOULD NOT contain the content of tasks.
scope:
  domains:
    - tasks
    - lists
    - sync
verification:
  compliance_checks:
    - id: encryption-at-rest-audit
      last_established: "2026-03-02"
      frequency: quarterly
      next_due: "2026-06-02"
  audit_artifacts:
    - docs/audit/encryption-2026-Q1.pdf
lineage:
  owner:
    team: platform
    individual: rui@taskflow.example.invalid
  created_at: "2026-05-15"
  superseded_by: null
  depended_on_by:
    - tasks/create/quick-add
    - lists/core/list-store
    - sync/queue/offline-queue
    - lists/sharing/shared-lists
`,

  "docs/facets/assumptions/sync/clock-skew-bounded.yaml": `schema_version: "1.4"
id: assumption/sync/clock-skew-bounded
lifecycle: active
statement: |
  The clocks of all writing devices differ by at most 30 seconds
  from each other.
criticality: high
last_reviewed_at: "2025-05-14"
risk_if_false: |
  Conflict resolution picks the wrong winner; discarded changes
  look like data loss to the user.
evidence:
  - date: "2025-05-14"
    kind: measurement
    note: NTP measurement over 30 days on 12,000 devices, p99 at 8 seconds.
  - date: "2024-11-02"
    kind: incident-review
    note: Post-incident review of duplicate reminders; the cause was time zone, not clock skew.
referenced_by:
  - tasks/create/quick-add
  - tasks/recurring/repeat-rule
  - sync/queue/offline-queue
  - sync/conflict/last-write-wins
lineage:
  owner:
    team: sync
    individual: tarek@taskflow.example.invalid
  created_at: "2024-06-20"
`,

  "docs/facets/assumptions/growth/push-optin-rate.yaml": `schema_version: "1.4"
id: assumption/growth/push-optin-rate
lifecycle: active
statement: |
  At least 60 percent of users allow push messages.
criticality: medium
last_reviewed_at: "2026-06-30"
risk_if_false: |
  Reminders do not reach the majority; the value of due dates
  drops and mail delivery becomes load-bearing.
evidence:
  - date: "2026-06-30"
    kind: measurement
    note: Opt-in rate over the last 90 days at 68 percent.
referenced_by:
  - reminders/due/push-notification
lineage:
  owner:
    team: growth
    individual: samir@taskflow.example.invalid
  created_at: "2026-06-05"
`,

  "docs/facets/data/tasks/task-item.yaml": `schema_version: "1.5"
id: data/tasks/task-item
lifecycle: active
intent:
  summary: |
    A single task. Canonical shape for all clients and the
    sync queue.
canonical_schema:
  version: 3
  fields:
    - name: id
      type: uuid
      constraints: primary key
    - name: title
      type: string
      constraints: 1..200 characters
    - name: assignee_email
      type: string
      sensitivity: pii
    - name: list_id
      type: uuid
      references: data/lists/list
    - name: due_at
      type: timestamp
      constraints: UTC, optional
    - name: completed_at
      type: timestamp
      constraints: UTC, optional
retention:
  duration: 24 months after completion
  policy: |
    After that the record is anonymized: title and assignee are
    removed, timestamps are kept for statistics.
read_by:
  - tasks/create/quick-add
  - tasks/recurring/repeat-rule
  - lists/core/list-store
  - search/fulltext/task-search
mutated_by:
  - tasks/create/quick-add
  - tasks/recurring/repeat-rule
  - sync/conflict/last-write-wins
lineage:
  owner:
    team: tasks
    individual: nina@taskflow.example.invalid
  created_at: "2026-05-12"
  related_policies:
    - policy/data/local-first-storage
`,

  "docs/facets/data/lists/list.yaml": `schema_version: "1.5"
id: data/lists/list
lifecycle: active
intent:
  summary: |
    A list as a container for tasks, with members and roles.
canonical_schema:
  version: 2
  fields:
    - name: id
      type: uuid
      constraints: primary key
    - name: name
      type: string
      constraints: 1..80 characters
    - name: owner_id
      type: uuid
      references: data/identity/user
    - name: member_roles
      type: map
      constraints: user_id to role
    - name: order_seed
      type: string
      constraints: fractional index
retention:
  duration: unlimited
  policy: |
    Persists as long as at least one member exists; after that
    30 days of grace, then deletion.
read_by:
  - lists/core/list-store
  - lists/sharing/shared-lists
  - search/fulltext/task-search
mutated_by:
  - lists/core/list-store
  - lists/sharing/shared-lists
lineage:
  owner:
    team: tasks
    individual: nina@taskflow.example.invalid
  created_at: "2026-05-12"
`,

  "docs/facets/data/identity/user.yaml": `schema_version: "1.4"
id: data/identity/user
lifecycle: active
intent:
  summary: |
    An account with contact channels and delivery preferences.
canonical_schema:
  version: 4
  fields:
    - name: id
      type: uuid
      constraints: primary key
    - name: email
      type: string
      sensitivity: pii
    - name: display_name
      type: string
      sensitivity: pii
    - name: timezone
      type: string
      constraints: IANA zone
    - name: push_token
      type: string
      sensitivity: encrypted
    - name: channel_prefs
      type: map
      constraints: channel to boolean
retention:
  duration: 36 months after last sign-in
  policy: |
    After that the account is deleted; tasks in shared lists are
    handed over anonymized.
read_by:
  - lists/sharing/shared-lists
  - reminders/due/push-notification
  - notifications/delivery/channel-fanout
mutated_by:
  - notifications/delivery/channel-fanout
lineage:
  owner:
    team: platform
    individual: rui@taskflow.example.invalid
  created_at: "2026-05-15"
  related_policies:
    - policy/data/local-first-storage
`,
};

/* Host material: the repository scan over sources:. Not part of the FACET schema. */
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
  // The file paths are relative to the registry root, like Anchor.path.
  // They match the paths under `anchors` below: every file named there
  // appears here as anchored.
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
