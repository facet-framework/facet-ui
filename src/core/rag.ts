import { labelText } from "../i18n/legacy/labels";
import { localized } from "../i18n/legacy/core/rag";

import { companionRoute } from "./companion";
import type { CompanionPlan } from "./companion";
import type { AtlasModel } from "./types";

export type RagHit = {
  feature?: string;
  registry?: string;

  kind: string;

  facet: string;
  path: string;
  title?: string;

  score: number;
  text: string;
};

export type RagResponse = {
  available: boolean;
  reason?: string;
  hint?: string;
  model?: string;
  chunks?: number;

  lexical?: boolean;
  hits: RagHit[];
};

export const RAG_PATH = "/api/rag";

export const RAG_TOOL = "mcp__facet__rag_query";

export function isRagTool(tool: string): boolean {
  return tool.toLowerCase() === RAG_TOOL.toLowerCase();
}

export function ragQueryOf(tool: string, target: string): string | null {
  return isRagTool(tool) ? target.trim() || "" : null;
}

export type RagOptions = {
  fetcher?: typeof fetch;

  limit?: number;
  signal?: AbortSignal;
};

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

    if (!body || !Array.isArray(body.hits)) return null;
    return body;
  } catch {
    return null;
  }
}

const MIN_WORDS = 3;

export function shouldConsultIndex(model: AtlasModel, question: string): boolean {
  const words = question.trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) return false;
  if (question.trim().startsWith("/")) return false;
  return companionRoute(model, question) === "corpus";
}

export function ragPlan(response: RagResponse): CompanionPlan {
  const hits = response.hits;
  const best = hits[0];

  const lines = hits.map((hit) => {
    const where = hit.feature ? `${hit.feature} · ${hit.facet}` : hit.path;
    return `${where} — ${hit.path}${localized.text1}${hit.score.toFixed(2)})`;
  });

  const head = hits.length === 1 ? localized.text2 : `${hits.length}${localized.text3}`;

  const foot = response.lexical ? localized.text4 : localized.text5;

  return {
    text: `${head}\n${lines.join("\n")}\n\n${foot}`,
    facts: [
      { label: "GEFUNDEN", value: String(hits.length), meaning: "neutral" },
      {
        label: localized.text6,
        value: best ? best.score.toFixed(2) : "—",

        meaning: best && best.score < 0.3 ? "signal" : "neutral",
      },
      {
        label: "DURCHSUCHT",
        value: `${response.chunks ?? 0}${labelText.text357}`,
        meaning: "neutral",
      },
    ],
    reads: hits.map((hit) => hit.path),
    sources: hits.map((hit) => ({ text: hit.path, recordId: hit.feature ?? null })),

    openId: best?.feature ?? null,
    section: null,
    follow: best?.feature
      ? [`${localized.text7}${best.feature}${localized.text8}`, localized.text9]
      : [],
  };
}

export function ragEmptyPlan(response: RagResponse): CompanionPlan {
  return {
    text: localized.text10 + localized.text11,
    facts: [
      { label: "GEFUNDEN", value: "0", meaning: "signal" },
      {
        label: "DURCHSUCHT",
        value: `${response.chunks ?? 0}${labelText.text357}`,
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
