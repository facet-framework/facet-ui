import { createText } from "../facet/i18n/text";
import {
  INDEX_PHASES,
  initialStatus,
  mergeStatus,
  phaseRank,
  subscribeCorpus,
  type CorpusStream,
  type IndexStatus,
} from "./live";

/** A stream the test feeds by hand — no network, no timer. */
function fakeStream() {
  const listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  let closed = false;

  const stream: CorpusStream = {
    addEventListener(type, listener) {
      (listeners[type] ??= []).push(listener);
    },
    close() {
      closed = true;
    },
  };

  return {
    stream,
    get closed() {
      return closed;
    },
    emit(type: string, data: unknown) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      (listeners[type] ?? []).forEach((listener) => listener({ data: payload } as MessageEvent));
    },
    has(type: string) {
      return (listeners[type] ?? []).length > 0;
    },
  };
}

describe("Unit tests for phaseRank", () => {
  it("orders the phases in run order", () => {
    expect(phaseRank("connect")).toBe(0);
    expect(phaseRank("index")).toBeGreaterThan(phaseRank("records"));
    expect(phaseRank("ready")).toBe(INDEX_PHASES.length - 1);
  });

  it("reports an unknown phase as -1 instead of slotting it in", () => {
    expect(phaseRank("cleanup")).toBe(-1);
  });
});

describe("Unit tests for mergeStatus", () => {
  const previous: IndexStatus = {
    phase: "records",
    file: "docs/facets/features/a.yaml",
    done: 3,
    total: 17,
    records: 3,
    files: 0,
    anchors: 0,
    root: "/repo",
    registry: "",
  };

  it("carries forward what belongs to the run", () => {
    const next = mergeStatus(previous, { phase: "enumerate" });
    expect(next).toMatchObject({ records: 3, root: "/repo" });
  });

  it("resets the phase-specific values instead of carrying them over", () => {
    const next = mergeStatus(previous, { phase: "enumerate" });
    expect(next).toMatchObject({ file: "", done: 0, total: 0 });
  });

  it("takes over what the host sends", () => {
    const next = mergeStatus(previous, { phase: "index", done: 12, total: 40, anchors: 5 });
    expect(next).toMatchObject({ phase: "index", done: 12, total: 40, anchors: 5 });
  });
});

describe("Unit tests for subscribeCorpus", () => {
  it("reports filled-in intermediate states", () => {
    const fake = fakeStream();
    const onStatus = jest.fn();
    subscribeCorpus("/api/corpus", { onStatus }, { open: () => fake.stream });

    fake.emit("status", { phase: "records", done: 1, total: 17, records: 1 });
    fake.emit("status", { phase: "index", done: 4, total: 900, anchors: 2 });

    expect(onStatus).toHaveBeenNthCalledWith(1, expect.objectContaining({ phase: "records" }));
    // The second state still knows the records, although the host does not repeat them.
    expect(onStatus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ phase: "index", records: 1, anchors: 2 }),
    );
  });

  it("passes the finished corpus through and closes the stream", () => {
    const fake = fakeStream();
    const onReady = jest.fn();
    subscribeCorpus("/api/corpus", { onReady }, { open: () => fake.stream });

    fake.emit("ready", { facetrc: "records: docs/facets\n", index: "records: []\n", records: {} });

    expect(onReady).toHaveBeenCalledWith(expect.objectContaining({ facetrc: expect.any(String) }));
    expect(fake.closed).toBe(true);
  });

  it("reports the host's abort with its reason", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    subscribeCorpus("/api/corpus", { onError }, { open: () => fake.stream });

    fake.emit("failed", { message: "docs/facets fehlt in diesem Repo" });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "docs/facets fehlt in diesem Repo" }),
    );
    expect(fake.closed).toBe(true);
  });

  it("names the address when the connection is not up", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    subscribeCorpus("http://127.0.0.1:7777/api/corpus", { onError }, { open: () => fake.stream });

    fake.emit("error", "");

    expect(onError.mock.calls[0][0].message).toContain("http://127.0.0.1:7777/api/corpus");
  });

  it("does not treat the end of the connection after a finished run as an error", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    subscribeCorpus("/api/corpus", { onError }, { open: () => fake.stream });

    fake.emit("ready", { facetrc: "", index: "records: []\n", records: {} });
    fake.emit("error", "");

    expect(onError).not.toHaveBeenCalled();
  });

  it("treats an unreadable response as an abort, not as an intermediate state", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    const onStatus = jest.fn();
    subscribeCorpus("/api/corpus", { onError, onStatus }, { open: () => fake.stream });

    fake.emit("status", "{no json");

    expect(onStatus).not.toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Unreadable answer from the facet server");
  });

  it("reports its errors in German under the German text", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    subscribeCorpus(
      "/api/corpus",
      { onError },
      { open: () => fake.stream, text: createText("de") },
    );

    fake.emit("error", "");

    expect(onError.mock.calls[0][0].message).toBe(
      "Keine Verbindung zum facet-Server (/api/corpus).",
    );
  });

  it("returns an unsubscribe that closes the stream", () => {
    const fake = fakeStream();
    const unsubscribe = subscribeCorpus("/api/corpus", {}, { open: () => fake.stream });

    unsubscribe();

    expect(fake.closed).toBe(true);
  });

  it("reports nothing more after unsubscribing", () => {
    const fake = fakeStream();
    const onReady = jest.fn();
    const unsubscribe = subscribeCorpus("/api/corpus", { onReady }, { open: () => fake.stream });

    unsubscribe();
    fake.emit("ready", { facetrc: "", index: "records: []\n", records: {} });

    expect(onReady).not.toHaveBeenCalled();
  });
});

describe("Unit tests for initialStatus", () => {
  it("starts at the connection and without counts", () => {
    expect(initialStatus()).toEqual({
      phase: "connect",
      file: "",
      done: 0,
      total: 0,
      records: 0,
      files: 0,
      anchors: 0,
      root: "",
      registry: "",
    });
  });
});
