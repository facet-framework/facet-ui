import { labelText } from "../i18n/legacy/labels";
import { remainingText } from "../i18n/legacy/remaining";
import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/rag.spec.text";
import { taskflowModel } from "./fixtures";
import {
  isRagTool,
  queryIndex,
  ragEmptyPlan,
  ragPlan,
  ragQueryOf,
  RAG_PATH,
  RAG_TOOL,
  shouldConsultIndex,
  type RagResponse,
} from "./rag";

const model = taskflowModel();

function response(over: Partial<RagResponse> = {}): RagResponse {
  return {
    available: true,
    model: "openai-compatible/text-embedding-3-small",
    chunks: 120,
    hits: [
      {
        feature: "sync/conflict/last-write-wins",
        kind: "record",
        facet: "intent",
        path: "docs/facets/features/sync/conflict/last-write-wins.yaml",
        title: "sync/conflict/last-write-wins · intent",
        score: 0.71,
        text: "feature: sync/conflict/last-write-wins\nfacet: intent\n\nsummary: …",
      },
      {
        feature: "sync/queue/offline-queue",
        kind: "doc",
        facet: "article",
        path: "docs/help/offline.md",
        title: "docs/help/offline.md",
        score: 0.52,
        text: localized.text1,
      },
    ],
    ...over,
  };
}

function fakeFetch(body: unknown, ok = true) {
  const calls: string[] = [];
  const fetcher = ((url: string) => {
    calls.push(String(url));
    return Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    } as Response);
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

describe("Unit tests for shouldConsultIndex", () => {
  it("asks the index for a question Atlas cannot map", () => {
    expect(shouldConsultIndex(model, localized.text2)).toBe(true);
    expect(shouldConsultIndex(model, localized.text3)).toBe(true);
  });

  it("does not ask the index when the question names a record", () => {
    expect(shouldConsultIndex(model, germanLabels.text138)).toBe(false);
    expect(shouldConsultIndex(model, localized.text4)).toBe(false);
  });

  it("does not ask the index when Atlas already has the numbers", () => {
    for (const question of [
      localized.text5,
      localized.text6,
      localized.text7,
      localized.text8,
      labelText.text388,
      localized.text9,
    ]) {
      expect([question, shouldConsultIndex(model, question)]).toEqual([question, false]);
    }
  });

  it("does not ask the index for a remark that is not a question", () => {
    expect(shouldConsultIndex(model, labelText.text414)).toBe(false);
    expect(shouldConsultIndex(model, "?")).toBe(false);
    expect(shouldConsultIndex(model, "danke dir")).toBe(false);
  });

  it("does not ask the index for a command", () => {
    expect(shouldConsultIndex(model, labelText.text415)).toBe(false);
    expect(shouldConsultIndex(model, remainingText.text46)).toBe(false);
  });
});

describe("Unit tests for queryIndex", () => {
  it("asks the host with the question and the requested count", async () => {
    const { fetcher, calls } = fakeFetch(response());

    const found = await queryIndex(localized.text10, { fetcher, limit: 4 });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain(RAG_PATH);
    expect(calls[0]).toContain(localized.text11);
    expect(calls[0]).toContain("n=4");
    expect(found?.hits).toHaveLength(2);
  });

  it("returns nothing when no host answers", async () => {
    const failing = (() => Promise.reject(new Error("no host"))) as unknown as typeof fetch;
    expect(await queryIndex("question", { fetcher: failing })).toBeNull();
  });

  it("returns nothing when the answer does not have the expected shape", async () => {
    const { fetcher } = fakeFetch({ anything: true });
    expect(await queryIndex("question", { fetcher })).toBeNull();
  });

  it("returns nothing when the host answers with an error", async () => {
    const { fetcher } = fakeFetch(response(), false);
    expect(await queryIndex("question", { fetcher })).toBeNull();
  });
});

describe("Unit tests for ragPlan", () => {
  it("names the file for each hit and leads into the record", () => {
    const plan = ragPlan(response());

    expect(plan.sources).toEqual([
      {
        text: "docs/facets/features/sync/conflict/last-write-wins.yaml",
        recordId: "sync/conflict/last-write-wins",
      },
      { text: "docs/help/offline.md", recordId: "sync/queue/offline-queue" },
    ]);
    expect(plan.openId).toBe("sync/conflict/last-write-wins");
    expect(plan.reads).toContain("docs/help/offline.md");
  });

  it("does not summarise, but says that it does not summarise", () => {
    const plan = ragPlan(response());
    expect(plan.text).toContain(localized.text12);
    expect(plan.text).toContain("docs/facets/features/sync/conflict/last-write-wins.yaml");
    expect(plan.text).toContain("0.71");
  });

  it("marks a weak similarity as a signal", () => {
    const weak = response({
      hits: [{ ...response().hits[0], score: 0.11 }],
    });
    const meaning = ragPlan(weak).facts.find((entry) => entry.label === localized.text13)?.meaning;
    expect(meaning).toBe("signal");

    const strong = ragPlan(response()).facts.find(
      (entry) => entry.label === localized.text14,
    )?.meaning;
    expect(strong).toBe("neutral");
  });

  it("says so when the index only compares words", () => {
    expect(ragPlan(response({ lexical: true })).text).toContain(localized.text15);
    expect(ragPlan(response()).text).not.toContain(localized.text16);
  });
});

describe("Unit tests for ragEmptyPlan", () => {
  it("says that nothing was found, and invents nothing", () => {
    const plan = ragEmptyPlan(response({ hits: [] }));
    expect(plan.text).toContain(labelText.text416);
    expect(plan.text).toContain(localized.text17);
    expect(plan.sources).toEqual([]);
    expect(plan.openId).toBeNull();
    expect(plan.facts.find((entry) => entry.label === "GEFUNDEN")?.value).toBe("0");
  });
});

describe("Unit tests for isRagTool", () => {
  it("recognises the search and keeps it separate from the reads", () => {
    expect(isRagTool(RAG_TOOL)).toBe(true);
    expect(isRagTool(RAG_TOOL.toUpperCase())).toBe(true);
    expect(isRagTool("Read")).toBe(false);
    expect(isRagTool("Grep")).toBe(false);
  });

  it("returns the asked question for a search, nothing otherwise", () => {
    expect(ragQueryOf(RAG_TOOL, localized.text18)).toBe(localized.text19);
    expect(ragQueryOf("Read", "src/core/rag.ts")).toBeNull();
  });
});
