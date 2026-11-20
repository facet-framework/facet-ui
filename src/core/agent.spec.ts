import { createText } from "../facet/i18n/text";
import { AGENT_PATH, agentState, askAgent, type AgentStream } from "./agent";

/** A stream the test feeds by hand — no network, no agent. */
function fakeStream() {
  const listeners: Record<string, ((event: MessageEvent) => void)[]> = {};
  let closed = false;

  const stream: AgentStream = {
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
  };
}

describe("Unit tests for askAgent", () => {
  it("reports locations read before the answer arrives", () => {
    const fake = fakeStream();
    const order: string[] = [];

    askAgent(
      "wo steht das",
      {
        onRead: (target) => order.push(`read:${target}`),
        onText: (text) => order.push(`text:${text}`),
        onDone: () => order.push("done"),
      },
      { open: () => fake.stream },
    );

    fake.emit("read", { kind: "read", tool: "Grep", target: "cmd/facet/hook.go" });
    fake.emit("text", { kind: "text", text: "Dort." });
    fake.emit("done", { kind: "done", session: "s1", cost: 0.02 });

    expect(order).toEqual(["read:cmd/facet/hook.go", "text:Dort.", "done"]);
  });

  it("passes the session on so the next question can continue it", () => {
    const fake = fakeStream();
    const onDone = jest.fn();

    askAgent("erste Frage", { onDone }, { open: () => fake.stream });
    fake.emit("done", { kind: "done", session: "session-7", cost: 0.5 });

    expect(onDone).toHaveBeenCalledWith("session-7", 0.5);
  });

  it("appends a known session to the URL", () => {
    const fake = fakeStream();
    let asked = "";

    askAgent(
      "and where exactly",
      {},
      {
        open: (url) => {
          asked = url;
          return fake.stream;
        },
        session: "session-7",
      },
    );

    expect(asked).toContain(AGENT_PATH);
    expect(asked).toContain("session=session-7");
    expect(asked).toContain("q=and+where+exactly");
  });

  it("closes the stream as soon as the answer is complete", () => {
    const fake = fakeStream();

    askAgent("question", {}, { open: () => fake.stream });
    expect(fake.closed).toBe(false);

    fake.emit("done", { kind: "done", session: "s", cost: 0 });
    expect(fake.closed).toBe(true);
  });

  it("reports the agent's abort with its reason", () => {
    const fake = fakeStream();
    const onError = jest.fn();

    askAgent("question", { onError }, { open: () => fake.stream });
    fake.emit("failed", { kind: "failed", text: "claude is not on PATH" });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("PATH");
    expect(fake.closed).toBe(true);
  });

  it("reports a connection error as a missing agent", () => {
    const fake = fakeStream();
    const onError = jest.fn();

    askAgent("question", { onError }, { open: () => fake.stream });
    fake.emit("error", "");

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe("No agent reachable.");
  });

  it("reports its errors in German under the German text", () => {
    const fake = fakeStream();
    const onError = jest.fn();

    askAgent("question", { onError }, { open: () => fake.stream, text: createText("de") });
    fake.emit("error", "");

    expect(onError.mock.calls[0][0].message).toBe("Kein Agent erreichbar.");
  });

  it("reports only once, even if something still arrives after the abort", () => {
    const fake = fakeStream();
    const onError = jest.fn();
    const onText = jest.fn();

    askAgent("question", { onError, onText }, { open: () => fake.stream });
    fake.emit("failed", { kind: "failed", text: "aus" });
    fake.emit("failed", { kind: "failed", text: "nochmal aus" });

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("does not trip over unreadable answers", () => {
    const fake = fakeStream();
    const onError = jest.fn();

    askAgent("question", { onError }, { open: () => fake.stream });
    fake.emit("text", "{no json");

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("Unreadable answer");
  });

  it("does not break the surface without a host", () => {
    const onError = jest.fn();

    const stop = askAgent(
      "question",
      { onError },
      {
        open: () => {
          throw new Error("no EventSource");
        },
      },
    );

    expect(onError).toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
  });
});

describe("Unit tests for the agent's steps", () => {
  it("reports thinking and counted tokens separately from the text", () => {
    const fake = fakeStream();
    const thinking: string[] = [];
    const text: string[] = [];
    let counted = 0;

    askAgent(
      "question",
      {
        onThinking: (part) => thinking.push(part),
        onText: (part) => text.push(part),
        onStatus: (_status, tokens) => {
          if (tokens) counted = tokens;
        },
      },
      { open: () => fake.stream },
    );

    fake.emit("status", { kind: "status", text: "thinking", tokens: 42 });
    fake.emit("thinking", { kind: "thinking", text: "The file first." });
    fake.emit("text", { kind: "text", text: "Answer." });

    expect(counted).toBe(42);
    expect(thinking).toEqual(["The file first."]);
    expect(text).toEqual(["Answer."]);
  });

  it("passes on the command when the login is missing, not just the error", () => {
    const fake = fakeStream();
    const onSignIn = jest.fn();
    const onError = jest.fn();

    askAgent("question", { onSignIn, onError }, { open: () => fake.stream });
    fake.emit("signin", {
      kind: "signin",
      text: "Nobody is signed in to Claude Code.",
      hint: "Melde dich in einem Terminal an: `claude auth login`.",
    });

    expect(onSignIn).toHaveBeenCalled();
    expect(onSignIn.mock.calls[0][1]).toContain("claude auth login");
    // No error channel: the reader should see the command, not a breakdown.
    expect(onError).not.toHaveBeenCalled();
    expect(fake.closed).toBe(true);
  });

  it("appends the chosen model to the URL", () => {
    const fake = fakeStream();
    let asked = "";

    askAgent(
      "question",
      {},
      {
        open: (url) => {
          asked = url;
          return fake.stream;
        },
        model: "haiku",
      },
    );

    expect(asked).toContain("model=haiku");
  });

  it("sends each context entry and the mode as their own parameters", () => {
    const fake = fakeStream();
    const asked: string[] = [];
    const open = (url: string) => {
      asked.push(url);
      return fake.stream;
    };

    askAgent("q", {}, { open, context: ["record:a/b/c", "page:contents"], mode: "book" });
    askAgent("q", {}, { open, context: [] });

    const sent = new URL(asked[0], "http://host").searchParams;
    expect(sent.getAll("context")).toEqual(["record:a/b/c", "page:contents"]);
    expect(sent.get("mode")).toBe("book");
    const bare = new URL(asked[1], "http://host").searchParams;
    expect(bare.has("context")).toBe(false);
    expect(bare.has("mode")).toBe(false);
  });

  it("reports the compaction of the conversation", () => {
    const fake = fakeStream();
    const onCompacted = jest.fn();

    askAgent("/compact", { onCompacted }, { open: () => fake.stream });
    fake.emit("compacted", { kind: "compacted", text: "Conversation compacted" });

    expect(onCompacted).toHaveBeenCalled();
  });
});

describe("Unit tests for agentState", () => {
  it("reads sign-in and models from the host", async () => {
    const state = await agentState((async () => ({
      ok: true,
      json: async () => ({
        auth: { loggedIn: true, authMethod: "claude.ai", available: true },
        models: [{ id: "haiku", label: "Haiku" }],
        model: "",
      }),
    })) as unknown as typeof fetch);

    expect(state?.auth.loggedIn).toBe(true);
    expect(state?.models).toHaveLength(1);
  });

  // Without a host this is not an error: Atlas also runs as a bundle without anything.
  it("returns nothing without a host instead of failing", async () => {
    const state = await agentState((async () => {
      throw new Error("no host");
    }) as unknown as typeof fetch);

    expect(state).toBeNull();
  });

  // Missing required fields and error objects are an absent host (null),
  // even when the transport succeeds; callers must never get partial state.
  it.each([
    ["without auth — an older host that did not know it yet", { models: [], model: "" }],
    ["an error object with 200", { error: "not found" }],
    ["auth without a sign-in state", { auth: { available: true }, models: [], model: "" }],
    ["without models", { auth: { loggedIn: true, available: true }, model: "" }],
    ["no object at all", "not found"],
    ["null as body", null],
  ])("rejects an answer that does not meet the contract: %s", async (_name, body) => {
    const state = await agentState((async () => ({
      ok: true,
      json: async () => body,
    })) as unknown as typeof fetch);

    expect(state).toBeNull();
  });

  // The counter-check to the table above: without it, a check that rejects
  // *every* answer would pass — and the surface would never have a sign-in
  // state.
  it("accepts an answer that only lacks optional fields", async () => {
    const state = await agentState((async () => ({
      ok: true,
      json: async () => ({ auth: { loggedIn: false, available: false }, models: [], model: "" }),
    })) as unknown as typeof fetch);

    expect(state?.auth.loggedIn).toBe(false);
    expect(state?.models).toEqual([]);
  });

  // A host without fetch should get nothing, not crash: the same handling as
  // for a missing EventSource.
  it("copes without fetch", async () => {
    const original = globalThis.fetch;
    // @ts-expect-error -- simulate an environment without fetch
    delete globalThis.fetch;
    try {
      await expect(agentState()).resolves.toBeNull();
    } finally {
      globalThis.fetch = original;
    }
  });
});
