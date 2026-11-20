import { labelText } from "../../i18n/legacy/labels";
import { remainingText } from "../../i18n/legacy/remaining";
import { germanText as germanLabels } from "../../i18n/legacy/shared";
import { localized } from "../../i18n/legacy/facet/fixtures/generate";

import { registry } from "./registry";

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
  { id: "aylin", name: "Aylin Demir", team: "board", role: "Design" },
  { id: "tom", name: "Tom Reuter", team: "board", role: "Engineering" },
  { id: "sana", name: "Sana Okafor", team: "delivery", role: "Release" },
  { id: "lukas", name: "Lukas Brandt", team: "delivery", role: "QA" },
  { id: "noor", name: "Noor Haddad", team: "authoring", role: "Engineering" },
  { id: "ben", name: "Ben Vogt", team: "authoring", role: "Support" },
] as const;

export const TEAMS = [
  { id: "core", name: "FACET Kern", purpose: localized.text1 },
  { id: "board", name: "Atlas", purpose: localized.text2 },
  { id: "delivery", name: labelText.text69, purpose: localized.text3 },
  { id: "authoring", name: labelText.text70, purpose: localized.text4 },
] as const;

const VERBS = [
  "read",
  localized.text5,
  remainingText.text142,
  labelText.text71,
  remainingText.text143,
  labelText.extra15,
  localized.text6,
  remainingText.text144,
];
const NOUNS = [
  "Record",
  germanLabels.text18,
  germanLabels.text22,
  germanLabels.text4,
  remainingText.text16,
  "Plugin",
  labelText.text46,
  localized.text7,
  labelText.text72,
  labelText.text73,
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
  localized.text9,
  localized.text10,
  localized.text11,
  germanLabels.text92,
  localized.text12,
  localized.text13,
  localized.text14,
  localized.text15,
  labelText.text74,
  localized.text16,
  localized.text17,
  localized.text18,
  localized.text19,
  germanLabels.text93,
  labelText.text75,
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
      title: round ? `${topic} (${round + 1}. Fassung)` : topic,
      status,
      date: day(r, Date.UTC(2019, 0, 1)),
      authors: [pick(r, PEOPLE).name, ...(r() < 0.3 ? [pick(r, PEOPLE).name] : [])],
      area: pick(r, areas),
      supersededBy: status === "superseded" ? Math.min(n, i + 2 + Math.floor(r() * 40)) : undefined,
      refs: Math.floor(r() * 14),
      file: `docs/adr/${pad(i + 1)}-${topic.toLowerCase().replace(localized.text22, "-")}.md`,
    });
  }

  const dates = out.map((a) => a.date).sort();
  out.forEach((a, i) => {
    a.date = dates[i];
  });
  return out.sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
}

export type GeneratedTerm = {
  term: string;
  definition: string;
  category: string;
  aliases: string[];
  records: number;
  status: "settled" | "proposed";
};

const TERMS: [string, string][] = [
  ["Record", localized.text32],
  [germanLabels.text18, localized.text33],
  [germanLabels.text22, localized.text34],
  [germanLabels.text4, localized.text35],
  [remainingText.text16, localized.text36],
  [germanLabels.text21, localized.text37],
  ["Area", localized.text39],
  [localized.text40, localized.text41],
  [germanLabels.text20, germanLabels.text94],
  ["Sidecar", localized.text42],
  [labelText.text76, localized.text43],
  ["Evidence", localized.text44],
];

export function makeGlossary(n: number, seed = 17): GeneratedTerm[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i): GeneratedTerm => {
    const [t, d] = TERMS[i % TERMS.length];
    return {
      term:
        i < TERMS.length ? t : `${t} ${String.fromCharCode(65 + (((i / TERMS.length) % 26) | 0))}`,
      definition: d,
      category: pick(r, [
        germanLabels.text17,
        localized.text45,
        localized.text46,
        labelText.text69,
      ]),
      aliases:
        r() < 0.4
          ? [
              pick(r, [
                labelText.text77,
                localized.text47,
                labelText.text78,
                labelText.text79,
                "Feature",
              ]),
            ]
          : [],
      records: Math.floor(r() * 40),
      status: r() < 0.85 ? "settled" : "proposed",
    };
  }).sort((a, b) => a.term.localeCompare(b.term, "de"));
}

export type ChatSource = { kind: "record" | "file" | "adr"; ref: string; line?: number };
export type ChatStep = { label: string; detail?: string; state: "done" | "running" | "failed" };
export type ChatMessage =
  | { role: "user"; text: string; at: string }
  | {
      role: "assistant";
      at: string;

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
  mode: "ask";
  pinned?: boolean;
  messages: ChatMessage[];
};

const ANSWER_MD = localized.text50;

export function makeChatSessions(n: number, seed = 19): ChatSession[] {
  const r = rng(seed);
  const qs = [
    localized.text51,
    localized.text52,
    localized.text53,
    "Summarize the getting-started decision",
    localized.text55,
    localized.text56,
  ];
  return Array.from({ length: n }, (_, i): ChatSession => {
    const q = qs[i % qs.length];
    return {
      id: `s${pad(i, 3)}`,
      title: q.replace(/\?$/, ""),
      updatedAt: day(r, Date.UTC(2026, 8, 1)),
      mode: "ask",
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
            { label: "Records gesucht", detail: "commit gate", state: "done" },
            { label: labelText.text80, detail: "scripts/search.sh", state: "done" },
            { label: labelText.text80, detail: "packages/task/import.go", state: "done" },
          ],
          sources: [
            { kind: "record", ref: "lists/permissions/admin" },
            { kind: "file", ref: "scripts/search.sh", line: 41 },
            { kind: "file", ref: "packages/task/import.go", line: 212 },
          ],
        },
      ],
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const sample = {
  features4812: () => makeFeatures(4812),
  adrs480: () => makeAdrs(480),
  glossary300: () => makeGlossary(300),
  chats: () => makeChatSessions(24),
};

export { ANSWER_MD };
