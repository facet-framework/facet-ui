/**
 * Deterministic story data for large registries and for content the facet
 * snapshot does not carry (glossary, chat sessions, people).
 *
 * Every generator takes a count and returns the same list for the same count,
 * so a story with 4,812 features renders identically on every run.
 */
import { registry } from "./registry";

/** Mulberry32: small, seeded, good enough for story data. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const pad = (n: number, w = 4) => String(n).padStart(w, "0");
const day = (r: () => number, from = Date.UTC(2024, 0, 1), to = Date.UTC(2026, 10, 12)) =>
  new Date(from + Math.floor(r() * (to - from))).toISOString().slice(0, 10);

export const PEOPLE = [
  { id: "mira", name: "Mira Albers", team: "core", role: "Product Owner" },
  { id: "jonas", name: "Jonas Kettler", team: "core", role: "Engineering" },
  { id: "aylin", name: "Aylin Demir", team: "atlas", role: "Design" },
  { id: "tom", name: "Tom Reuter", team: "atlas", role: "Engineering" },
  { id: "sana", name: "Sana Okafor", team: "delivery", role: "Release" },
  { id: "lukas", name: "Lukas Brandt", team: "delivery", role: "QA" },
  { id: "noor", name: "Noor Haddad", team: "authoring", role: "Engineering" },
  { id: "ben", name: "Ben Vogt", team: "authoring", role: "Support" },
] as const;

export const TEAMS = [
  { id: "core", name: "Core team", purpose: "Tasks, lists and their synchronisation." },
  { id: "atlas", name: "Atlas", purpose: "The reader in the browser and its plugins." },
  { id: "delivery", name: "Delivery", purpose: "Builds, channels and approvals." },
  { id: "authoring", name: "Authoring", purpose: "Hooks, sessions and agents while writing." },
] as const;

/* Features ------------------------------------------------------------------ */

const VERBS = ["read", "check", "show", "compare", "approve", "export", "link", "report"];
const NOUNS = [
  "Record",
  "Anchor",
  "Scenario",
  "Drift",
  "Knowledge",
  "Plugin",
  "Page",
  "Check",
  "Channel",
  "Session",
];

export type GeneratedFeature = {
  id: string;
  title: string;
  domain: string;
  capability: string;
  lifecycle: "active" | "planned" | "deprecated";
  owner: string;
  scenarios: number;
  proven: number;
  anchors: number;
  drift: number;
  knowledgeOpen: number;
  changedAt: string;
};

/** A registry of `n` features spread over the real taxonomy. */
export function makeFeatures(n: number, seed = 7): GeneratedFeature[] {
  const r = rng(seed);
  const caps = registry.domains.flatMap((d) => d.capabilities.map((c) => ({ d: d.id, c: c.id })));
  return Array.from({ length: n }, (_, i) => {
    const at = caps[i % caps.length];
    const scenarios = 1 + Math.floor(r() * 18);
    const lifecycle = r() < 0.86 ? "active" : r() < 0.7 ? "planned" : "deprecated";
    const proven = lifecycle === "planned" ? 0 : Math.floor(scenarios * Math.min(1, 0.35 + r()));
    const noun = pick(r, NOUNS);
    const verb = pick(r, VERBS);
    return {
      id: `${at.d}/${at.c}/${noun.toLowerCase()}-${verb}-${pad(i)}`,
      title: `${noun} ${verb}`,
      domain: at.d,
      capability: at.c,
      lifecycle,
      owner: pick(r, TEAMS).id,
      scenarios,
      proven,
      anchors: lifecycle === "planned" ? 0 : 1 + Math.floor(r() * 9),
      drift: r() < 0.08 ? 1 + Math.floor(r() * 3) : 0,
      knowledgeOpen: Math.floor(r() * r() * 6),
      changedAt: day(r),
    };
  });
}

/* ADRs ---------------------------------------------------------------------- */

export type GeneratedAdr = {
  number: number;
  title: string;
  status: "proposed" | "accepted" | "superseded" | "rejected";
  date: string;
  authors: string[];
  area: string;
  supersededBy?: number;
  refs: number;
  file: string;
};

const ADR_TOPICS = [
  "How Atlas loads a plugin",
  "Sidecars instead of network access",
  "The host holds the permissions",
  "Records as YAML next to the code",
  "One release stream from main",
  "Embed checksums per binary",
  "Shadow DOM for plugin surfaces",
  "Knowledge in five slots",
  "Scenarios in Given/When/Then",
  "Anchors as comments, not annotations",
  "Reader roles instead of user accounts",
  "Measure drift against a merge base",
  "One glossary per registry",
  "BPMN as a file in the repository",
  "Configuration in .facetrc.yaml",
];

export function makeAdrs(n: number, seed = 11): GeneratedAdr[] {
  const r = rng(seed);
  const areas = registry.domains.map((d) => d.id);
  const out: GeneratedAdr[] = [];
  for (let i = 0; i < n; i++) {
    const topic = ADR_TOPICS[i % ADR_TOPICS.length];
    const round = Math.floor(i / ADR_TOPICS.length);
    const x = r();
    const status =
      x < 0.62 ? "accepted" : x < 0.78 ? "superseded" : x < 0.92 ? "proposed" : "rejected";
    out.push({
      number: i + 1,
      title: round ? `${topic} (version ${round + 1})` : topic,
      status,
      date: day(r, Date.UTC(2019, 0, 1)),
      authors: [pick(r, PEOPLE).name, ...(r() < 0.3 ? [pick(r, PEOPLE).name] : [])],
      area: pick(r, areas),
      supersededBy: status === "superseded" ? Math.min(n, i + 2 + Math.floor(r() * 40)) : undefined,
      refs: Math.floor(r() * 14),
      file: `docs/adr/${pad(i + 1)}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
    });
  }
  // ADR numbers grow with time: number n+1 is never older than n. The random dates are drawn
  // in loop order (so every other field keeps its value) and then handed out ascending by
  // number; drawn per record, a low number could carry a later date than a high one, and a
  // list sorted by number showed a year's dates out of order.
  const dates = out.map((a) => a.date).sort();
  out.forEach((a, i) => {
    a.date = dates[i];
  });
  return out.sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
}

/* Glossary ------------------------------------------------------------------- */

export type GeneratedTerm = {
  term: string;
  definition: string;
  category: string;
  aliases: string[];
  records: number;
  status: "settled" | "proposed";
};

const TERMS: [string, string][] = [
  ["Record", "The machine-readable description of a named product capability."],
  ["Scenario", "A promise in Given/When/Then that a test can prove."],
  ["Drift", "Code that changed without its record following."],
  ["Knowledge", "Five slots that answer what a person needs to know about a feature."],
  ["Feature", "A capability of the product that a record describes."],
  ["Area", "The top level of the taxonomy, a domain of the product."],
  ["Capability", "The second level of the taxonomy, a group of related features."],
  ["Graveyard", "Where records lie whose feature was removed."],
  ["Sidecar", "A binary that a plugin brings along to act on the outside."],
  ["Reader role", "The perspective from which Atlas weights a page."],
  ["Evidence", "A test that demonstrably runs a scenario."],
];

export function makeGlossary(n: number, seed = 17): GeneratedTerm[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i): GeneratedTerm => {
    const [t, d] = TERMS[i % TERMS.length];
    return {
      term:
        i < TERMS.length ? t : `${t} ${String.fromCharCode(65 + (((i / TERMS.length) % 26) | 0))}`,
      definition: d,
      category: pick(r, ["Core term", "Check", "Surface", "Delivery"]),
      aliases: r() < 0.4 ? [pick(r, ["Facet", "Entry", "Mark", "Deviation", "Feature"])] : [],
      records: Math.floor(r() * 40),
      status: r() < 0.85 ? "settled" : "proposed",
    };
  }).sort((a, b) => a.term.localeCompare(b.term, "en"));
}

/* Chat ------------------------------------------------------------------------ */

export type ChatSource = { kind: "record" | "file" | "adr"; ref: string; line?: number };
export type ChatStep = { label: string; detail?: string; state: "done" | "running" | "failed" };
export type ChatMessage =
  | { role: "user"; text: string; at: string }
  | {
      role: "assistant";
      at: string;
      /** Markdown. */
      text: string;
      steps?: ChatStep[];
      sources?: ChatSource[];
      state?: "streaming" | "done" | "stopped" | "failed" | "cut";
      model?: string;
      seconds?: number;
    };

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
  mode: "Ask";
  pinned?: boolean;
  messages: ChatMessage[];
};

const ANSWER_MD = `The **commit gate** runs before every \`git commit\` an agent issues through Bash.

1. It reads the command from the hook JSON on stdin.
2. It starts \`sh tools/facet-lint/run-all.sh\`.
3. If the lint is red, it refuses the call with exit 2.

| Check | Source | Result |
|---|---|---|
| Schema | \`ajv\` | 182 files |
| orphaned anchors | \`lint_anchors.go\` | 0 |
| orphaned records | \`lint_records.go\` | 0 |

\`\`\`sh
FACET_STRICT_DEPS=1 sh tools/facet-lint/run-all.sh
\`\`\`

> Without \`ajv\` the lint reports exit 0 and has validated nothing.`;

export function makeChatSessions(n: number, seed = 19): ChatSession[] {
  const r = rng(seed);
  const qs = [
    "How does the commit gate work?",
    "Which features have open drift?",
    "What is the ADR plugin still missing?",
    "Where is the sidecar checksum measured?",
    "Which scenarios are unproven?",
  ];
  return Array.from({ length: n }, (_, i): ChatSession => {
    const q = qs[i % qs.length];
    return {
      id: `s${pad(i, 3)}`,
      title: q.replace(/\?$/, ""),
      updatedAt: day(r, Date.UTC(2026, 8, 1)),
      mode: "Ask",
      pinned: i === 1,
      messages: [
        { role: "user", text: q, at: "14:02" },
        {
          role: "assistant",
          at: "14:02",
          text: ANSWER_MD,
          model: "claude-opus-5-5",
          seconds: 18 + Math.floor(r() * 40),
          state: "done",
          steps: [
            { label: "Records searched", detail: "commit gate", state: "done" },
            { label: "File read", detail: "scripts/commit-gate.sh", state: "done" },
            { label: "File read", detail: "internal/facet/config.go", state: "done" },
          ],
          sources: [
            { kind: "record", ref: "lists/permissions/admin" },
            { kind: "file", ref: "scripts/commit-gate.sh", line: 41 },
            { kind: "file", ref: "internal/facet/config.go", line: 212 },
          ],
        },
      ],
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/* Sample sets used across stories -------------------------------------------- */

export const sample = {
  features4812: () => makeFeatures(4812),
  adrs480: () => makeAdrs(480),
  glossary300: () => makeGlossary(300),
  chats: () => makeChatSessions(24),
};

export { ANSWER_MD };
