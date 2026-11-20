/**
 * The companion with code it has actually read — the question goes to an agent
 * running in the repo instead of to the planner in `companion.ts`.
 *
 * `companion.ts` answers what Atlas has counted anyway: how many records there
 * are, which ones have no anchor, what is overdue. What it cannot answer is
 * everything whose answer lives in the code — where something really happens,
 * whether the implementation still matches a promise. That needs someone who
 * opens the files.
 *
 * For this the host (`facet ui`) starts Claude Code in the repo and passes on
 * every step: first the files read, then the answer. The order is not
 * decoration. A claim about someone else's code is worth as much as the
 * possibility to look it up, and that is why the evidence comes first.
 *
 * If the agent is missing, only the agent is missing: Atlas then keeps
 * answering from the model.
 */

import { ENGLISH_TEXT, type FacetText } from "../facet/i18n/text";

/** One step of the agent, as the host sends it. */
export type AgentStep =
  | { kind: "status"; text: string; tokens?: number }
  | { kind: "thinking"; text: string }
  | { kind: "read"; tool: string; target: string }
  | { kind: "text"; text: string }
  | { kind: "compacted"; text: string }
  | { kind: "done"; session: string; cost: number; turns?: number }
  | { kind: "signin"; text: string; hint: string }
  | { kind: "failed"; text: string };

/** Who would answer, and with what. */
export type AgentState = {
  auth: {
    loggedIn: boolean;
    authMethod?: string;
    email?: string;
    subscriptionType?: string;
    available: boolean;
    reason?: string;
    hint?: string;
  };
  models: { id: string; label: string; note?: string }[];
  model: string;
};

export type AgentHandlers = {
  /** What the agent is doing right now, before it has anything to show. */
  onStatus?: (status: string, tokens: number) => void;
  /** A piece of reasoning, while it is being written. */
  onThinking?: (text: string) => void;
  /** The agent has opened a location. */
  onRead?: (target: string, tool: string) => void;
  /** The conversation was compacted. */
  onCompacted?: () => void;
  /** Nobody is signed in — with the sentence that says what to do. */
  onSignIn?: (reason: string, hint: string) => void;
  /** A piece of the answer has arrived. */
  onText?: (text: string) => void;
  /** Done, with the session for the next question. */
  onDone?: (session: string, cost: number) => void;
  /** Abort with a reason, or: there is no agent here. */
  onError?: (error: Error) => void;
};

/** The slice of `EventSource` this reader needs. */
export type AgentStream = {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
};

export type AgentOptions = {
  /** Creates the stream. Default is `EventSource`; tests pass their own version. */
  open?: (url: string) => AgentStream;
  /** Session to continue. Empty starts a new conversation. */
  session?: string | null;
  /** Model for this one question. Empty uses whatever is configured. */
  model?: string | null;
  /**
   * What the reader has open, as `kind:value` entries (`record:<id>`,
   * `page:<key>`). Each goes to the host as its own `context` parameter;
   * none is sent when the list is empty.
   */
  context?: readonly string[];
  /** The conversation mode for this one question; empty is the plain question. */
  mode?: string | null;
  /** The language of the error messages handed to `onError`; English by default. */
  text?: FacetText;
};

/** The path under which the host accepts questions. */
export const AGENT_PATH = "/api/companion";

/**
 * Asks a question and reports every step.
 *
 * The return value is the abort. It is not mere cleanup: the host stops the
 * agent as soon as nobody is listening any more, and an agent that keeps
 * reading for a closed window costs money with no recipient.
 */
export function askAgent(
  question: string,
  handlers: AgentHandlers = {},
  options: AgentOptions = {},
): () => void {
  const open = options.open ?? defaultOpen;
  const { t } = options.text ?? ENGLISH_TEXT;
  const decode = <T>(data: string) => decodeWith<T>(data, t);
  const params = new URLSearchParams({ q: question });
  if (options.session) params.set("session", options.session);
  if (options.model) params.set("model", options.model);
  if (options.mode) params.set("mode", options.mode);
  for (const entry of options.context ?? []) params.append("context", entry);

  let stream: AgentStream;
  try {
    stream = open(`${AGENT_PATH}?${params.toString()}`);
  } catch (error) {
    handlers.onError?.(error as Error);
    return () => {};
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    stream.close();
  };

  const fail = (error: Error) => {
    if (closed) return;
    close();
    handlers.onError?.(error);
  };

  stream.addEventListener("status", (event) => {
    const step = decode<{ text?: string; tokens?: number }>(event.data);
    if (step instanceof Error) return fail(step);
    handlers.onStatus?.(step.text ?? "", step.tokens ?? 0);
  });

  stream.addEventListener("thinking", (event) => {
    const step = decode<{ text?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    if (step.text) handlers.onThinking?.(step.text);
  });

  stream.addEventListener("compacted", () => handlers.onCompacted?.());

  // Not being signed in is not an error like the others: there is exactly one
  // sentence that fixes it, and it is in the step. Hence a channel of its own
  // instead of 'failed' — the reader should see the command, not an error
  // message.
  stream.addEventListener("signin", (event) => {
    const step = decode<{ text?: string; hint?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    close();
    handlers.onSignIn?.(step.text ?? "", step.hint ?? "");
  });

  stream.addEventListener("read", (event) => {
    const step = decode<{ tool?: string; target?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    if (step.target) handlers.onRead?.(step.target, step.tool ?? "");
  });

  stream.addEventListener("text", (event) => {
    const step = decode<{ text?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    if (step.text) handlers.onText?.(step.text);
  });

  stream.addEventListener("done", (event) => {
    const step = decode<{ session?: string; cost?: number }>(event.data);
    if (step instanceof Error) return fail(step);
    if (closed) return;
    close();
    handlers.onDone?.(step.session ?? "", step.cost ?? 0);
  });

  // 'failed' is the agent aborting, 'error' is EventSource's connection error.
  // Two meanings under one name could no longer be told apart at the receiving
  // end — the same separation as in the corpus stream.
  stream.addEventListener("failed", (event) => {
    const step = decode<{ text?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    fail(new Error(step.text || t("core.agent.aborted")));
  });

  stream.addEventListener("error", () => {
    fail(new Error(t("core.agent.unreachable")));
  });

  return close;
}

function defaultOpen(url: string): AgentStream {
  if (typeof EventSource === "undefined") {
    throw new Error("This host has no EventSource — pass `open`.");
  }
  return new EventSource(url);
}

function decodeWith<T>(data: string, t: FacetText["t"]): T | Error {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    return new Error(t("core.agent.unreadable", { message: (error as Error).message }));
  }
}

/** The path under which the host says who would answer. */
export const AGENT_STATE_PATH = "/api/companion/state";

/**
 * Asks whether anyone can answer at all — and with which models.
 *
 * Once on opening, not on every question: the reader should know they have to
 * sign in before they type, instead of finding out after twenty seconds of
 * thinking. Without a host there is no result, and that is not an error —
 * Atlas also runs as a bundle without anything.
 */
export async function agentState(fetcher?: typeof fetch): Promise<AgentState | null> {
  // Not as the parameter's default value: that would be evaluated before the
  // try takes effect, and in an environment without `fetch` the call itself
  // would already blow up. The same pattern as for EventSource further up — a
  // host that lacks something should get nothing, not crash.
  const get = fetcher ?? (typeof fetch === "function" ? fetch : null);
  if (!get) return null;
  try {
    const response = await get(AGENT_STATE_PATH, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    // Validate the foreign response, including auth, before exposing AgentState.
    // A 200 can still contain an error or an incompatible host response.
    // Return null as for an absent host; partial objects can crash the React tree.
    return meetsContract(body) ? body : null;
  } catch {
    return null;
  }
}

/**
 * Does the answer look like an `AgentState`?
 *
 * Exactly what the callers read is checked, and no more: `auth` with a sign-in
 * inside and a list of models. A stricter check — every field, every type —
 * would reject an answer the surface can handle, and a host that omits an
 * optional field is not a broken host.
 */
function meetsContract(body: unknown): body is AgentState {
  if (typeof body !== "object" || body === null) return false;
  const { auth, models } = body as { auth?: unknown; models?: unknown };
  if (typeof auth !== "object" || auth === null) return false;
  if (typeof (auth as { loggedIn?: unknown }).loggedIn !== "boolean") return false;
  return Array.isArray(models);
}
