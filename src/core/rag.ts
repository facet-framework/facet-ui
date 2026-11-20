/**
 * The search index — questions that name no record.
 *
 * `companion.ts` answers what Atlas has counted, and `agent.ts` sends the
 * question to an agent that opens the files. In between lies a third kind of
 * question: "How do these two functions relate", "What is the convention
 * here", "Where does it say why the limit is five". No counter answers them,
 * and whoever asks names neither an id nor a path — which is why the word
 * search finds nothing either, although the answer is in two records.
 *
 * `facet rag index` builds a vector index for this, and the host answers
 * `/api/rag` from it. That costs a millisecond, no model and no sign-in — the
 * difference from the agent is not just the price but that nobody phrases
 * anything here. What comes back are hits with their file and their
 * closeness. Atlas shows them and does not summarise them: a plausible
 * sentence that nobody can look up is worse than none at all.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";
import { companionRoute } from "./companion";
import type { CompanionPlan } from "./companion";
import type { AtlasModel } from "./types";

/** A hit, as the host sends it. */
export type RagHit = {
  /** The feature id — the jump into the record starts here. */
  feature?: string;
  registry?: string;
  /** `record` for the wording of a record, `doc` for generated documentation. */
  kind: string;
  /** Which part of the record: intent, contract, verification, … */
  facet: string;
  path: string;
  title?: string;
  /** Cosine closeness between −1 and 1. */
  score: number;
  text: string;
};

export type RagResponse = {
  available: boolean;
  reason?: string;
  hint?: string;
  model?: string;
  chunks?: number;
  /**
   * The index was built by the built-in word embedder: it compares words,
   * not meaning. This is stated here so the interface can say it, instead of
   * leaving the reader to infer it from a model name.
   */
  lexical?: boolean;
  hits: RagHit[];
};

/** The path under which the host searches the index. */
export const RAG_PATH = "/api/rag";

/**
 * The name of the tool the agent uses to search the same index.
 *
 * It shows up in the step stream like a read, but it is not one: no file was
 * opened. Whoever displays it as "read: …" claims something about a file
 * nobody opened.
 */
export const RAG_TOOL = "mcp__facet__rag_query";

/** Is this step a search in the index and not a read? */
export function isRagTool(tool: string): boolean {
  return tool.toLowerCase() === RAG_TOOL.toLowerCase();
}

/**
 * What the agent asked the index.
 *
 * For this tool the host sends the question as `target`, not a path. Empty
 * means: it was a search, but the wording did not come along.
 */
export function ragQueryOf(tool: string, target: string): string | null {
  return isRagTool(tool) ? target.trim() || "" : null;
}

export type RagOptions = {
  /** Defaults to `fetch`; tests pass in their own version. */
  fetcher?: typeof fetch;
  /** How many hits. The host caps at 20. */
  limit?: number;
  signal?: AbortSignal;
};

/**
 * Searches the index.
 *
 * Without a host there is no result, and that is not an error: Atlas also runs
 * as a bundle with nothing behind it, and then the planner keeps answering the
 * question. The same pattern as `agentState` — a host that lacks something
 * should deliver nothing and not crash.
 */
export async function queryIndex(
  question: string,
  options: RagOptions = {},
): Promise<RagResponse | null> {
  const get = options.fetcher ?? (typeof fetch === "function" ? fetch : null);
  if (!get) return null;

  const params = new URLSearchParams({ q: question });
  if (options.limit) params.set("n", String(options.limit));

  try {
    const response = await get(`${RAG_PATH}?${params.toString()}`, {
      headers: { accept: "application/json" },
      signal: options.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as RagResponse;
    // A host that delivers something other than expected is like no host:
    // a half-read answer would be worse than none.
    if (!body || !Array.isArray(body.hits)) return null;
    return body;
  } catch {
    return null;
  }
}

/**
 * The smallest number of words from which a question is a question.
 *
 * "Hello" and "?" land in the same corner as a real question Atlas does not
 * recognise, and a search on them returns three random records with low
 * closeness — a result that looks like an answer and is not one.
 */
const MIN_WORDS = 3;

/**
 * Should the index be consulted for this question?
 *
 * There is exactly one rule, and it already lives in `companion.ts`: the index
 * is asked when Atlas would otherwise answer `aboutCorpus` — that is, when the
 * question neither names a record nor falls into one of the counted areas.
 * That is the moment in which Atlas today says "ask me about a record by
 * name", and that is exactly what the index is for.
 *
 * Conversely: whoever names a record gets the record; whoever asks about
 * deadlines, tests, ownership, data, code, coupling or operations gets the
 * numbers. A search would be slower and less precise there than a counter
 * that already has the answer.
 */
export function shouldConsultIndex(model: AtlasModel, question: string): boolean {
  const words = question.trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) return false;
  if (question.trim().startsWith("/")) return false;
  return companionRoute(model, question) === "corpus";
}

/**
 * Builds the answer from what was found.
 *
 * It phrases nothing. What is here is a list of hits with their file and their
 * closeness, plus one sentence about what that is. At this point the
 * companion has no model behind it — so there would be nothing it could
 * summarise with, and that is the more honest design: whoever turns three hits
 * into a paragraph makes a claim that none of the three contains.
 */
export function ragPlan(response: RagResponse, text: FacetText = ENGLISH_TEXT): CompanionPlan {
  const { t, plural } = text;
  const hits = response.hits;
  const best = hits[0];

  const lines = hits.map((hit) => {
    const where = hit.feature ? `${hit.feature} · ${hit.facet}` : hit.path;
    return t("core.rag.hitLine", { where, path: hit.path, score: hit.score.toFixed(2) });
  });

  const head = plural("core.rag.head", hits.length, { count: String(hits.length) });

  const foot = response.lexical ? t("core.rag.footLexical") : t("core.rag.foot");

  return {
    text: `${head}\n${lines.join("\n")}\n\n${foot}`,
    facts: [
      { label: t("core.rag.found"), value: String(hits.length), meaning: "neutral" },
      {
        label: t("core.rag.closeness"),
        value: best ? best.score.toFixed(2) : "—",
        // A weak closeness is a signal and not an answer: it means the
        // registry holds nothing on the question, not that the best is here.
        meaning: best && best.score < 0.3 ? "signal" : "neutral",
      },
      {
        label: t("core.rag.searched"),
        value: t("core.rag.passages", { count: String(response.chunks ?? 0) }),
        meaning: "neutral",
      },
    ],
    reads: hits.map((hit) => hit.path),
    sources: hits.map((hit) => ({ text: hit.path, recordId: hit.feature ?? null })),
    // The best hit is the record the answer means — from there it continues
    // into the detail, as with every other answer.
    openId: best?.feature ?? null,
    section: null,
    follow: best?.feature
      ? [
          t("core.companion.suggest.recordOpen", { label: best.feature }),
          t("core.companion.suggest.where"),
        ]
      : [],
  };
}

/**
 * What is said when the index yields nothing.
 *
 * Kept apart from `ragPlan` because it is a different statement: not "here is
 * the closest thing" but "the registry says nothing about it". The second is
 * a complete answer and is too often treated as an error.
 */
export function ragEmptyPlan(response: RagResponse, text: FacetText = ENGLISH_TEXT): CompanionPlan {
  const { t } = text;
  return {
    text: `${t("core.rag.empty")}\n\n${t("core.rag.emptyFoot")}`,
    facts: [
      { label: t("core.rag.found"), value: "0", meaning: "signal" },
      {
        label: t("core.rag.searched"),
        value: t("core.rag.passages", { count: String(response.chunks ?? 0) }),
        meaning: "neutral",
      },
    ],
    reads: [],
    sources: [],
    openId: null,
    section: null,
    follow: [],
  };
}
