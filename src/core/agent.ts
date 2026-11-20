import { localized } from "../i18n/legacy/core/agent";

export type AgentStep =
  | { kind: "status"; text: string; tokens?: number }
  | { kind: "thinking"; text: string }
  | { kind: "read"; tool: string; target: string }
  | { kind: "text"; text: string }
  | { kind: "compacted"; text: string }
  | { kind: "done"; session: string; cost: number; turns?: number }
  | { kind: "signin"; text: string; hint: string }
  | { kind: "failed"; text: string };

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
  onStatus?: (status: string, tokens: number) => void;

  onThinking?: (text: string) => void;

  onRead?: (target: string, tool: string) => void;

  onCompacted?: () => void;

  onSignIn?: (reason: string, hint: string) => void;

  onText?: (text: string) => void;

  onDone?: (session: string, cost: number) => void;

  onError?: (error: Error) => void;
};

export type AgentStream = {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
};

export type AgentOptions = {
  open?: (url: string) => AgentStream;

  session?: string | null;

  model?: string | null;

  context?: readonly string[];

  mode?: string | null;
};

export const AGENT_PATH = "/api/companion";

export function askAgent(
  question: string,
  handlers: AgentHandlers = {},
  options: AgentOptions = {},
): () => void {
  const open = options.open ?? defaultOpen;
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

  stream.addEventListener("failed", (event) => {
    const step = decode<{ text?: string }>(event.data);
    if (step instanceof Error) return fail(step);
    fail(new Error(step.text || localized.text1));
  });

  stream.addEventListener("error", () => {
    fail(new Error(localized.text2));
  });

  return close;
}

function defaultOpen(url: string): AgentStream {
  if (typeof EventSource === "undefined") {
    throw new Error(localized.text3);
  }
  return new EventSource(url);
}

function decode<T>(data: string): T | Error {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    return new Error(`Unreadable answer from the agent: ${(error as Error).message}`);
  }
}

export const AGENT_STATE_PATH = "/api/companion/state";

export async function agentState(fetcher?: typeof fetch): Promise<AgentState | null> {
  const get = fetcher ?? (typeof fetch === "function" ? fetch : null);
  if (!get) return null;
  try {
    const response = await get(AGENT_STATE_PATH, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const body: unknown = await response.json();

    return meetsContract(body) ? body : null;
  } catch {
    return null;
  }
}

function meetsContract(body: unknown): body is AgentState {
  if (typeof body !== "object" || body === null) return false;
  const { auth, models } = body as { auth?: unknown; models?: unknown };
  if (typeof auth !== "object" || auth === null) return false;
  if (typeof (auth as { loggedIn?: unknown }).loggedIn !== "boolean") return false;
  return Array.isArray(models);
}
