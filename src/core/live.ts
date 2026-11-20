import { germanText as germanLabels } from "../i18n/legacy/shared";
import { localized } from "../i18n/legacy/core/live";

import type { CorpusSource } from "./corpus";

export const INDEX_PHASES = [
  "connect",
  "config",
  "records",
  "enumerate",
  "index",
  "model",
  "ready",
] as const;

export type IndexPhase = (typeof INDEX_PHASES)[number];

export function phaseRank(phase: IndexPhase | string): number {
  return INDEX_PHASES.indexOf(phase as IndexPhase);
}

export type IndexStatus = {
  phase: IndexPhase;

  file: string;

  done: number;

  total: number;

  records: number;

  files: number;

  anchors: number;

  root: string;

  registry: string;
};

export function initialStatus(): IndexStatus {
  return {
    phase: "connect",
    file: "",
    done: 0,
    total: 0,
    records: 0,
    files: 0,
    anchors: 0,
    root: "",
    registry: "",
  };
}

export function mergeStatus(previous: IndexStatus, patch: Partial<IndexStatus>): IndexStatus {
  return {
    phase: patch.phase ?? previous.phase,
    file: patch.file ?? "",
    done: patch.done ?? 0,
    total: patch.total ?? 0,
    records: patch.records ?? previous.records,
    files: patch.files ?? previous.files,
    anchors: patch.anchors ?? previous.anchors,
    root: patch.root ?? previous.root,
    registry: patch.registry ?? previous.registry,
  };
}

export type CorpusStreamHandlers = {
  onStatus?: (status: IndexStatus) => void;

  onReady?: (source: CorpusSource) => void;

  onError?: (error: Error) => void;
};

export type CorpusStream = {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
};

export type CorpusStreamOptions = {
  open?: (url: string) => CorpusStream;
};

export function subscribeCorpus(
  url: string,
  handlers: CorpusStreamHandlers = {},
  options: CorpusStreamOptions = {},
): () => void {
  const open = options.open ?? defaultOpen;
  const stream = open(url);

  let status = initialStatus();
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
    const patch = decode<Partial<IndexStatus>>(event.data);
    if (patch instanceof Error) return fail(patch);
    status = mergeStatus(status, patch);
    handlers.onStatus?.(status);
  });

  stream.addEventListener("ready", (event) => {
    const source = decode<CorpusSource>(event.data);
    if (source instanceof Error) return fail(source);
    if (closed) return;
    close();
    handlers.onReady?.(source);
  });

  stream.addEventListener("failed", (event) => {
    const payload = decode<{ message?: string }>(event.data);
    if (payload instanceof Error) return fail(payload);
    fail(new Error(payload.message || localized.text1));
  });

  stream.addEventListener("error", () => {
    fail(new Error(`${localized.text2}${url}).`));
  });

  return close;
}

function defaultOpen(url: string): CorpusStream {
  if (typeof EventSource === "undefined") {
    throw new Error(localized.text3);
  }
  return new EventSource(url);
}

function decode<T>(data: string): T | Error {
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    return new Error(`${germanLabels.text131}${(error as Error).message}`);
  }
}
