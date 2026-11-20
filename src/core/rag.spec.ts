import { createText } from "../facet/i18n/text";
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

/** An answer from the host, without a host. */
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
        text: "document: docs/help/offline.md\n\nWhat happens when two devices …",
      },
    ],
    ...over,
  };
}

/** A `fetch` that returns a fixed answer and records the URL. */
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
  // The index is asked exactly when Atlas would otherwise answer "ask about a
  // record by name" (`core.companion.corpus.ask`). That is the whole rule, and it stands here as a test because otherwise it would only
  // exist in the author's head.
  it("asks the index for a question Atlas cannot map", () => {
    expect(shouldConsultIndex(model, "What is the naming convention for promises here?")).toBe(
      true,
    );
    expect(shouldConsultIndex(model, "Why was the limit set to five?")).toBe(true);
    // The same holds for a German question.
    expect(shouldConsultIndex(model, "Warum ist das Limit auf fünf gesetzt worden?")).toBe(true);
  });

  it("does not ask the index when the question names a record", () => {
    // The record is in the model: searching for it would be slower and less
    // precise than looking it up.
    expect(shouldConsultIndex(model, "What does last write wins promise?")).toBe(false);
    expect(shouldConsultIndex(model, "Tell me something about sync/queue/offline-queue")).toBe(
      false,
    );
  });

  it("does not ask the index when Atlas already has the numbers", () => {
    for (const question of [
      "How high is the test coverage?",
      "What is overdue?",
      "Who is responsible for delivery?",
      "Which personal data is there?",
      "Where should I start?",
      "Which alerts have no runbook?",
      // German questions find the same areas.
      "Was ist überfällig?",
      "Welche personenbezogenen Daten gibt es?",
    ]) {
      expect([question, shouldConsultIndex(model, question)]).toEqual([question, false]);
    }
  });

  it("does not ask the index for a remark that is not a question", () => {
    // Three random hits with low similarity look like an answer and are not
    // one. A greeting therefore gets the planner.
    expect(shouldConsultIndex(model, "Hello")).toBe(false);
    expect(shouldConsultIndex(model, "?")).toBe(false);
    expect(shouldConsultIndex(model, "thank you")).toBe(false);
  });

  it("does not ask the index for a command", () => {
    expect(shouldConsultIndex(model, "/new please right now")).toBe(false);
    expect(shouldConsultIndex(model, "/help what works here")).toBe(false);
  });
});

describe("Unit tests for queryIndex", () => {
  it("asks the host with the question and the requested count", async () => {
    const { fetcher, calls } = fakeFetch(response());

    const found = await queryIndex("how do café & co relate", { fetcher, limit: 4 });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain(RAG_PATH);
    expect(calls[0]).toContain("q=how+do+caf%C3%A9+%26+co+relate");
    expect(calls[0]).toContain("n=4");
    expect(found?.hits).toHaveLength(2);
  });

  // Without a host there is no result, and that is not an error: Atlas also
  // runs as a bundle without anything.
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

  // At this point the companion has no model behind it. It may show the hits
  // and must not stir them into a paragraph that appears in none of them.
  it("does not summarise, but says that it does not summarise", () => {
    const plan = ragPlan(response());
    expect(plan.text).toContain("I do not summarise");
    expect(plan.text).toContain("docs/facets/features/sync/conflict/last-write-wins.yaml");
    expect(plan.text).toContain("0.71");
  });

  it("marks a weak similarity as a signal", () => {
    const weak = response({
      hits: [{ ...response().hits[0], score: 0.11 }],
    });
    const meaning = ragPlan(weak).facts.find((entry) => entry.label === "CLOSENESS")?.meaning;
    expect(meaning).toBe("signal");

    const strong = ragPlan(response()).facts.find((entry) => entry.label === "CLOSENESS")?.meaning;
    expect(strong).toBe("neutral");
  });

  // A word index compares words. Not saying so invites taking the hits for
  // more than they are.
  it("says so when the index only compares words", () => {
    expect(ragPlan(response({ lexical: true })).text).toContain("compares words");
    expect(ragPlan(response()).text).not.toContain("compares words");
  });

  it("speaks German under the German text", () => {
    const de = createText("de");
    const plan = ragPlan(response({ lexical: true }), de);
    expect(plan.text).toMatch(/^2 Stellen im Bestand liegen nah an der Frage:/);
    expect(plan.text).toContain("(Nähe 0.71)");
    expect(plan.text).toContain("vergleicht Wörter");
    expect(plan.facts.map((entry) => entry.label)).toEqual(["GEFUNDEN", "NÄHE", "DURCHSUCHT"]);
    expect(plan.follow[0]).toBe("Was ist bei sync/conflict/last-write-wins offen?");
    const single = ragPlan(response({ hits: [response().hits[0]] }));
    expect(single.text).toMatch(/^One passage in the inventory is close to the question:/);
  });
});

describe("Unit tests for ragEmptyPlan", () => {
  // "Nothing is written about it" is a complete answer and is treated as an
  // error too often.
  it("says that nothing was found, and invents nothing", () => {
    const plan = ragEmptyPlan(response({ hits: [] }));
    expect(plan.text).toContain("says nothing about this");
    expect(plan.text).toContain("I do not invent");
    expect(plan.sources).toEqual([]);
    expect(plan.openId).toBeNull();
    expect(plan.facts.find((entry) => entry.label === "FOUND")?.value).toBe("0");
    const german = ragEmptyPlan(response({ hits: [] }), createText("de"));
    expect(german.text).toContain("steht dazu nichts");
    expect(german.text).toContain("erfinde ich nicht");
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
    expect(ragQueryOf(RAG_TOOL, "  convention for promises  ")).toBe("convention for promises");
    expect(ragQueryOf("Read", "src/core/rag.ts")).toBeNull();
  });
});
